/* eslint-disable no-underscore-dangle */
import useLx from '@/hooks/useLx';
import { logWarn } from '@/utils/devUtils';
import { setGlobalProperties, setComponentTexts } from '@/utils/global';
import { shellModeLoaders } from '@/components/shell/shellModeLoaders';

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
 * @property {string} [dateFormat] - Default date format
 * @property {string} [dateTimeFormat] - Default date and time format
 * @property {string} [dateTimeFullFormat] - Default full date and time format
 * @property {string} [iconSet] - Default icon set
 * @property {string} [avatarKind] - Default avatar kind
 * @property {string} [currency] - Default currency code
 * @property {Object} [locale] - Locale configuration
 * @property {string} [locale.locale] - Locale identifier (e.g. 'lv-LV')
 * @property {number} [locale.firstDayOfTheWeek] - First day of week for date picker calendars (1-7)
 * @property {Object} [locale.masks] - Date picker mask configuration
 * @property {string} [locale.masks.input] - Date input mask
 * @property {string} [locale.masks.inputDateTime24hr] - Date and time input mask
 * @property {string} [locale.masks.inputDateTimeFull24hr] - Full date and time input mask
 * @property {string} [locale.masks.inputTime24hr] - Time input mask
 * @property {string} [locale.masks.inputTimeFull24hr] - Full time input mask
 * @property {string} [locale.masks.inputMonthYear] - Month and year input mask
 * @property {string} [locale.masks.inputQuarters] - Quarter input mask
 * @property {string} [locale.masks.inputYear] - Year input mask
 * @property {string} [locale.masks.monthYearFormat] - Month and year output format
 * @property {Object} [preload] - Configuration for preloading async components
 * @property {string[]} [preload.components] - Array of actual components to preload (e.g. [LxModal, LxDataGrid])
 * @property {string[]} [preload.shellModes] - Array of shell mode names to preload (e.g. ['default', 'digimaks'])
 * @property {Record<string, Object>} [texts] - Global component texts overrides, keyed by component name
 *   (e.g. { LxDataGrid: { search: 'Search' } }). Applied on top of each component's hardcoded default
 *   texts, without needing a per-instance `texts` prop. For runtime updates call setLxComponentTexts(...).
 */
function install(Vue, options) {
  // Don't install more than once
  // @ts-ignore
  if (install.installed) return;
  // @ts-ignore
  install.installed = true;
  setGlobalProperties(options);

  if (options.texts) {
    setComponentTexts(options.texts);
  }

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
        logWarn('Could not extract loader from component', globalEnvironment);
      }
    });
  }

  if (preloadConfig.shellModes?.length) {
    preloadConfig.shellModes.forEach((mode) => {
      if (shellModeLoaders[mode]) {
        loaders.push(shellModeLoaders[mode]);
      } else {
        logWarn(`Unknown shell mode for preload: "${mode}"`, globalEnvironment);
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
const GlobalVue = globalThis?.Vue;

if (GlobalVue && typeof GlobalVue.use === 'function') {
  GlobalVue.use(plugin);
}

// Default export is library as a whole, registered via Vue.use()
export const createLx = plugin;

// Set/replace the global component texts overrides at runtime (e.g. on locale change).
// Mirrors the `texts` option of createLx; reactive – mounted components update automatically.
export { setComponentTexts as setLxComponentTexts } from '@/utils/global';

// Exports for individual use
export * from '@/stores';
export * from '@/components';
export * from '@/utils';
export * from '@/constants';
