/* eslint-disable no-underscore-dangle */
import useLx from '@/hooks/useLx';
import { logWarn } from '@/utils/devUtils';
import { setGlobalProperties } from '@/utils/global';

/**
 * Install function for Vue plugin (called by Vue.use() or app.use())
 *
 * @param {import('vue').App} Vue - The Vue app instance (in Vue 3 it's actually the app, not the Vue constructor)
 * @typedef {Object} createLxOptions
 * @property {string} systemId - Unique identifier of the consuming system/portal
 * @property {string} authSessionKey - Key used in sessionStorage/localStorage for auth token
 * @property {string} authUrl - Base URL for authentication endpoints
 * @property {string} authClientId - OAuth client ID
 * @property {string} publicUrl - Public base URL of the application
 * @property {string} environment - Current environment ('dev', 'test', 'prod', etc.)
 * @property {Object} [preload] - Configuration for preloading async components
 * @property {string[]} [preload.components] - Array of actual components to preload (e.g. [LxModal, LxDataGrid])
 */
function install(Vue, options) {
  // Don't install more than once
  // @ts-ignore
  if (install.installed) return;
  // @ts-ignore
  install.installed = true;
  setGlobalProperties(options);

  const preloadConfig = options.preload ?? {};
  const globalEnvironment = useLx().getGlobals()?.environment;

  const loaders = [];

  if (preloadConfig.components?.length) {
    preloadConfig.components.forEach((comp) => {
      if (!comp) return;

      let loaderFn;

      if (typeof comp.__asyncLoader === 'function') {
        loaderFn = comp.__asyncLoader;
      } else if (typeof comp.loader === 'function') {
        loaderFn = comp.loader;
      }

      if (loaderFn) {
        loaders.push(loaderFn);
      } else {
        logWarn('[lx-ui] Could not extract loader from component', globalEnvironment);
      }
    });
  }

  if (loaders.length === 0) return;

  const doPreload = () => {
    loaders.forEach((loader) => loader().catch(() => {}));
  };

  doPreload();
}

const plugin = { install };

// Use automatically when global Vue instance detected
let GlobalVue = null;
if (typeof window !== 'undefined') {
  // @ts-ignore
  GlobalVue = window.Vue;
} else if (typeof global !== 'undefined') {
  GlobalVue = global.Vue;
}
if (GlobalVue) {
  GlobalVue.use(plugin);
}

// Default export is library as a whole, registered via Vue.use()
export const createLx = plugin;

// Exports for individual use
export * from '@/stores';
export * from '@/components';
export * from '@/utils';
export * from '@/constants';
