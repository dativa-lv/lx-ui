import { defineAsyncComponent as vueDefineAsyncComponent, shallowRef } from 'vue';
import { onError as stopNavigationOnError } from '@/utils/flowUtils';
import { getDisplayTexts } from '@/utils/generalUtils';
import { generateUUID } from '@/utils/stringUtils';

const REPORT_THROTTLE_MS = 3000;
const NOTIFICATION_AUTO_CLOSE_SECONDS = 7;

const textsDefault = {
  offline: 'Nav interneta savienojuma. Pārbaudiet savienojumu un mēģiniet vēlreiz!',
  loadFailed: 'Neizdevās ielādēt lapas saturu. Mēģiniet vēlreiz!',
};

/** @typedef {'offline' | 'loadFailed'} ImportErrorReason */

/** Notifications raised by lx/ui itself, shown by LxShell next to the app's own */
export const importErrorNotifications = shallowRef([]);

function pushImportErrorNotification(reason) {
  const texts = getDisplayTexts({}, textsDefault, 'LxDynamicImport');
  importErrorNotifications.value = [
    ...importErrorNotifications.value,
    {
      uid: generateUUID(),
      type: 'error',
      title: texts[reason],
      autoCloseSeconds: NOTIFICATION_AUTO_CLOSE_SECONDS,
    },
  ];
}

/** @type {(reason: ImportErrorReason, error: Error) => void} */
let errorHandler = pushImportErrorNotification;
let lastReport = { reason: null, time: 0 };
let reloadOnNextNavigation = false;

export function isFailedImportError(error) {
  return /dynamically imported module|module script failed/i.test(error?.message ?? '');
}

function isOffline() {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function getFailedModuleUrl(error) {
  return error.message.match(/(\S+:\/\/\S+)$/)?.[1] ?? null;
}

// Browsers cache a failed module fetch for the page lifetime, so the same URL can't be retried
function withCacheBust(url) {
  const parsed = new URL(url);
  parsed.searchParams.set('t', String(Date.now()));
  return parsed.href;
}

function report(reason, error) {
  const now = Date.now();
  if (lastReport.reason === reason && now - lastReport.time < REPORT_THROTTLE_MS) return;
  lastReport = { reason, time: now };
  errorHandler(reason, error);
}

// Shared by all wrappers, since components defined in `<script setup>` get a new one per instance
const loadedKeys = new Set();

/**
 * Wraps a single-module loader (`() => import(...)`) so a load attempted offline doesn't break
 * later loads: offline it fails without touching the network, unless the module was already
 * loaded, and is retried on the next request.
 * @template T
 * @param {() => Promise<T>} loader
 * @param {string} [key] - identifies the module, needed when the import path is built from
 *   variables, as the loader source is the same for every module then
 * @returns {() => Promise<T>}
 */
export function importWithRetry(loader, key = String(loader)) {
  if (loader.lxImportRetry) return loader;
  const wrapped = async () => {
    if (isOffline() && !loadedKeys.has(key)) {
      const error = new Error('Failed to fetch dynamically imported module: offline');
      report('offline', error);
      throw error;
    }
    try {
      const module = await loader();
      loadedKeys.add(key);
      return module;
    } catch (error) {
      if (!isFailedImportError(error)) throw error;
      const url = getFailedModuleUrl(error);
      if (url && !isOffline()) {
        try {
          const module = await import(/* @vite-ignore */ withCacheBust(url));
          loadedKeys.add(key);
          return module;
        } catch {
          // its preloaded dependencies failed too, only a page load can refetch them
        }
      }
      reloadOnNextNavigation = true;
      report(isOffline() ? 'offline' : 'loadFailed', error);
      throw error;
    }
  };
  wrapped.lxImportRetry = true;
  return wrapped;
}

/**
 * @param {string} iconSet - e.g. 'cds'
 * @param {string} fileName - icon file name without extension, e.g. 'NotificationWarning'
 */
export function getIconLoader(iconSet, fileName) {
  return importWithRetry(
    () => import(`@/components/icons/${iconSet}/${fileName}.vue`),
    `icons/${iconSet}/${fileName}`
  );
}

/**
 * Drop-in replacement for Vue's `defineAsyncComponent` that survives temporary network loss.
 * @param {Parameters<typeof vueDefineAsyncComponent>[0]} source
 */
export function lxDefineAsyncComponent(source) {
  if (typeof source === 'function') {
    return vueDefineAsyncComponent(importWithRetry(source));
  }
  return vueDefineAsyncComponent({ ...source, loader: importWithRetry(source.loader) });
}

// Same check vue-router uses to tell a lazy loader from a functional component
function isLazyRouteComponent(component) {
  return (
    typeof component === 'function' &&
    !('displayName' in component) &&
    !('props' in component) &&
    !('__vccOpts' in component)
  );
}

/**
 * Sets up recovery from dynamic import failures caused by lost network. Called by `createLx`
 * when it's installed after the router.
 * Lazy routes opened offline stay on the current page and report 'offline'; after a failure that
 * left the browser's module cache broken, the next navigation is done as a full page load.
 * @param {import('vue-router').Router} router
 * @param {(reason: ImportErrorReason, error: Error) => void} [onError] - replaces the default
 *   LxShell notification (texts from `texts.LxDynamicImport`)
 */
export function setupImportRecovery(router, onError) {
  errorHandler = onError ?? pushImportErrorNotification;
  if (router.lxImportRecovery) return;
  // eslint-disable-next-line no-param-reassign
  router.lxImportRecovery = true;
  router.getRoutes().forEach((record) => {
    Object.entries(record.components ?? {}).forEach(([name, component]) => {
      if (!isLazyRouteComponent(component)) return;
      // eslint-disable-next-line no-param-reassign
      record.components[name] = importWithRetry(component);
    });
  });
  router.onError(stopNavigationOnError);
  router.beforeEach((to, from) => {
    if (!reloadOnNextNavigation || isOffline() || !from.matched.length) return true;
    window.location.assign(router.resolve(to).href);
    return false;
  });
}
