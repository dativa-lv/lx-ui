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
 * @param {string} [options.id] - The registry entry id override (optional).
 */
export function registerBuilderInstance({
  name,
  instance,
  props = {},
  schemaPath = '',
  builderName = null,
  componentStack = [],
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
  };
  builderRegistry.register(res);
}
