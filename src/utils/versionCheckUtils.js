import axios from 'axios';
import useLx from '@/hooks/useLx';
import { logError } from '@/utils/devUtils';

const VERSION_STATE_KEYS = [
  'version_reload_pending',
  'version_update_notification',
  'intended_route',
  'is_navigating',
];

let notificationShown = false; // Prevent duplicate notifications

// Text may be a getter, so a portal can keep it in sync with the active locale
function resolveText(notifyText, fallback) {
  const text = typeof notifyText === 'function' ? notifyText() : notifyText;
  return text || fallback;
}

/**
 * Compare the running version against the deployed one and act on a mismatch.
 * @returns {Promise<boolean>} `true` when a hard reload was triggered
 */
async function checkVersion(notify, notifyText = undefined, basePath = '/') {
  try {
    // Remove trailing slashes if happens
    const normalizedBasePath = basePath.replace(/\/$/, '');

    const resp = await axios.get(
      `${globalThis.location.origin}${normalizedBasePath}/version.json?anti-cache=${Date.now()}`
    );

    if (!resp.data?.version) return false;
    if (globalThis.config?.version === resp.data.version) return false;

    if (
      sessionStorage.getItem('is_navigating') === 'true' &&
      sessionStorage.getItem('version_reload_pending') !== 'true'
    ) {
      sessionStorage.setItem('version_reload_pending', 'true');
      sessionStorage.setItem('version_update_notification', 'true');

      // Perform a hard refresh
      globalThis.location.reload();
      // The reload is queued, not immediate - let the caller abort the navigation
      return true;
    }

    if (!notificationShown) {
      // Default notification text if no text where provided
      const defaultNotifyText = 'Ir pieejama jauna lietotnes versija, lūdzu pārlādējiet lapu!';
      // Show notification for manual refresh if idle or work in progress inside current route
      notify?.pushWarning(resolveText(notifyText, defaultNotifyText), null, 0);
      notificationShown = true;
    }
    return false;
  } catch (e) {
    logError(`Error checking version: ${e}`, useLx().getGlobals()?.environment);
    return false;
  }
}

/**
 * Monitor version changes and handle navigation.
 * @important it works only if `lxVitePortalVersionPlugin` is defined in plugins inside `vite.config.mjs` !
 * @experimental This functionality is experimental and may change or be removed in future.
 *
 * @param {any} notify - Pinia LxNotifyStore instance
 * @param {string | (() => string)} [notifyText] - text, or a getter for it when the
 * app can switch locale without reloading
 * @returns {Promise<boolean>} `true` when a hard reload was triggered - router guards
 * should abort the current navigation in that case
 *
 * @example
 * ```js
 * // In MainLayout.vue
 * // Start monitoring for version changes every 10 seconds
 * // Uses the default notification text and checks `version.json` in the base path `/`
 * lxVersionCheckUtils.isAppVersionChanged(notify, undefined, true, 10000);
 *
 */

let lastVersionCheckTime = 0;
let versionCheckIntervalId = null;

export async function isAppVersionChanged(
  notify,
  notifyText = undefined,
  useInterval = false,
  intervalTime = 1800000, // 30 minutes
  basePath = '/',
  throttleTime = 1000 // 1 seconds
) {
  const currentEnv = globalThis.config?.environment;

  if (currentEnv?.toLowerCase() === 'local') return false;

  const now = Date.now();

  // Skip if called too soon again
  if (!useInterval && now - lastVersionCheckTime < throttleTime) return false;

  lastVersionCheckTime = now;

  if (!useInterval) return checkVersion(notify, notifyText, basePath);

  // Layouts re-run their setup on remount - never stack up intervals
  if (versionCheckIntervalId !== null) return false;

  versionCheckIntervalId = setInterval(async () => {
    await checkVersion(notify, notifyText, basePath);
  }, intervalTime);

  // Do not stay blind until the first interval elapses
  return checkVersion(notify, notifyText, basePath);
}

/**
 * Restore the route the user was heading to before a version reload, and tell them why.
 * Call it once the app is mounted (e.g. `onMounted` in the main layout).
 * @experimental This functionality is experimental and may change or be removed in future.
 *
 * @param {any} router - vue-router instance
 * @param {any} notify - Pinia LxNotifyStore instance
 * @param {string | (() => string)} [notifyText] - text, or a getter for it
 */
export function restoreRouteAndNotify(router, notify, notifyText) {
  if (sessionStorage.getItem('version_reload_pending') !== 'true') return;

  const savedRoute = sessionStorage.getItem('intended_route');
  const versionUpdateFlag = sessionStorage.getItem('version_update_notification');

  const { environment } = useLx().getGlobals();

  // Clear up front so this cannot re-enter or leak flags on an early return
  VERSION_STATE_KEYS.forEach((key) => sessionStorage.removeItem(key));

  if (!versionUpdateFlag) return;

  // Default notification text if no text where provided
  const defaultNotifyText = 'Notika lapas pārlāde, lai atjaunotu lietotnes versiju';
  notify?.pushWarning(resolveText(notifyText, defaultNotifyText), null, 0);

  if (!savedRoute) return;

  const parsedRoute = JSON.parse(savedRoute);

  router.isReady().then(() => {
    // Check if the route exists in the app's route definitions
    if (!router.hasRoute(parsedRoute.name)) return;
    // The reload may already have landed on the intended route
    if (router.currentRoute.value.name === parsedRoute.name) return;

    router.replace(parsedRoute).catch((error) => {
      logError(`Failed to navigate to saved route: ${error}`, environment);
    });
  });
}
