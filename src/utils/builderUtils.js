import { getCurrentInstance, onUnmounted } from 'vue';
import { builderRegistry } from '@/stores';

/**
 * Registers a component instance in the builderRegistry.
 * @param {Object} options - Options for registration.
 * @param {string} options.name - The component name/type.
 * @param {object} options.instance - The Vue component instance (from getCurrentInstance()).
 * @param {object} [options.props] - The component props (optional).
 * @param {string} [options.schemaPath] - The schema path (optional).
 * @param {string} [options.builderName] - The builder name (optional).
 * @param {Array} [options.componentStack] - The component stack for nested components (optional).
 * @param {string} [options.customItemPath] - The custom item path (optional).
 * @param {string} [options.id] - The registry entry id override (optional).
 */
export function registerBuilderInstance({
  name,
  instance,
  props = {},
  schemaPath = '',
  builderName = null,
  componentStack = [],
  customItemPath = null,
  id = null,
}) {
  if (!instance) return;
  const res = {
    id: id || props?.id,
    type: name,
    props,
    node: instance,
    schemaPath,
    builderName,
    componentStack,
    customItemPath,
  };
  builderRegistry.register(res);
}

/**
 * Unregisters a component instance from the builderRegistry.
 * @param {string} id - The registry entry id.
 */
export function unregisterBuilderInstance(id) {
  if (!id) return;
  builderRegistry.unregister(id);
}

/**
 * Registers the current component in the builderRegistry when `props.builderOptions.useRegistry`
 * is set, and unregisters it on unmount. Must be called synchronously inside `setup`.
 * @param {string} name - The component name/type (e.g. 'LxToggle').
 * @param {object} props - The component props.
 * @param {object} [options]
 * @param {object} [options.texts] - Default texts to expose on the component's `texts` prop definition.
 * @param {boolean} [options.skipInnerComponent=false] - Skip registration when `builderOptions.innerComponent` is set.
 * @param {boolean} [options.addToStack=true] - Append this component to `builderOptions.componentStack`.
 */
export function useBuilderRegistration(
  name,
  props,
  { texts = null, skipInnerComponent = false, addToStack = true } = {}
) {
  const { builderOptions } = props;
  if (!builderOptions?.useRegistry) return;
  if (skipInnerComponent && builderOptions.innerComponent) return;

  const instance = getCurrentInstance();
  // Adds default texts to ensure they are available in the builder instance
  if (texts) instance.type.props.texts.options = texts;

  registerBuilderInstance({
    name,
    instance,
    props,
    builderName: builderOptions.schemaPath,
    componentStack: addToStack
      ? builderOptions.componentStack?.concat([{ id: props?.id, name }])
      : builderOptions.componentStack,
    customItemPath: builderOptions.customItemPath,
  });

  onUnmounted(() => {
    unregisterBuilderInstance(props?.id);
  });
}
