import { shallowRef } from 'vue';

let globalProperties = {};

export const setGlobalProperties = (props) => {
  globalProperties = props;
};

export const getGlobalProperties = () => globalProperties;

/**
 * Global, reactive store of component texts, keyed by component name (e.g. 'LxDataGrid').
 * Lets a consuming app override translations once (via createLx or setLxComponentTexts)
 * instead of passing a `texts` prop to every component instance. This layer sits ABOVE
 * each component's hardcoded default texts, but BELOW a per-instance `texts` prop.
 *
 * shallowRef: the whole map is swapped on change, so a shallow ref is enough to trigger
 * reactivity in components reading it inside a computed.
 */
const componentTexts = shallowRef({});

/**
 * Replace the global component texts map. Reactive – components re-render on change.
 * @param {Record<string, Object>} texts - Map of componentName -> texts object
 */
export const setComponentTexts = (texts) => {
  componentTexts.value = texts ?? {};
};

/**
 * Get the texts overridden globally for a single component.
 * Reads .value so callers inside a computed track changes reactively.
 * @param {string} componentKey - Component name, e.g. 'LxDataGrid'
 * @returns {Object|undefined}
 */
export const getComponentTexts = (componentKey) =>
  componentKey ? componentTexts.value?.[componentKey] : undefined;
