<script setup>
import { computed, getCurrentInstance, onUnmounted } from 'vue';
import { generateUUID } from '@/utils/stringUtils';
import { registerBuilderInstance, unregisterBuilderInstance } from '@/utils/builderUtils';

const props = defineProps({
  /**
   * A unique identifier for the component instance.
   * @default generateUUID()
   * @since 1.8.0-beta.16
   */
  id: { type: String, default: () => generateUUID() },
  /**
   * The orientation of the stack.
   * @default 'vertical'
   * @since 1.8.0-beta.16
   */
  orientation: {
    type: String,
    default: 'vertical',
    options: ['vertical', 'horizontal', 'overlay'],
    group: 'main',
    sequence: 3,
  }, // vertical || horizontal || overlay
  /**
   * The kind of stack.
   * @default 'default'
   * @since 1.8.0-beta.16
   */
  kind: {
    type: String,
    default: 'default',
    options: ['default', 'compact'],
    group: 'main',
    sequence: 2,
  }, // default || compact
  /**
   * The mode of the stack.
   * @default 'default'
   * @since 1.8.0-beta.16
   */
  mode: {
    type: String,
    default: 'default',
    options: ['default', 'grid'],
    group: 'main',
    sequence: 1,
  }, // default || grid
  /**
   * The horizontal alignment of the stack.
   * @default 'leading'
   * @since 1.8.0-beta.16
   */
  horizontalAlignment: {
    type: String,
    default: 'leading',
    options: ['leading', 'trailing', 'center', 'stretch'],
    group: 'main',
    sequence: 4,
  }, // leading || trailing || center || stretch

  /**
   * The vertical alignment of the stack.
   * @default 'leading'
   * @since 1.8.0-beta.16
   */
  verticalAlignment: {
    type: String,
    default: 'leading',
    options: ['leading', 'trailing', 'center', 'stretch'],
    group: 'main',
    sequence: 5,
  }, // leading || trailing || center || stretch
  /**
   * Grid vertical configuration. Works only when mode is set to 'grid'.
   * @default []
   * @since 1.8.0
   */
  verticalConfig: { type: Array, default: () => [], group: 'main', sequence: 6 },
  /**
   * Grid horizontal configuration. Works only when mode is set to 'grid'.
   * @default []
   * @since 1.8.0
   */
  horizontalConfig: { type: Array, default: () => [], group: 'main', sequence: 7 },
  builderOptions: {
    type: Object,
    default: () => ({
      innerComponent: false,
      schemaPath: null,
      componentStack: null,
      useRegistry: false,
    }),
  },
});

function formatConfig(prop) {
  let res = '';
  if (prop.length > 0) {
    prop.forEach((x) => {
      if (Number.isInteger(x)) {
        res += `${x}fr `;
      } else if (x === 'auto') {
        res += 'auto ';
      } else if (typeof x === 'string') {
        if (x === '*') {
          res += '1fr ';
        } else {
          const number = x?.split('*')?.[0];
          res += `${number}fr `;
        }
      }
    });
  }
  return res;
}

const verticalConfigAlignment = computed(() => {
  const res = props.mode === 'grid' ? formatConfig(props.verticalConfig) : '';
  return res.length > 0 ? `--stack-template-rows: ${res}` : null;
});

const horizontalConfigAlignment = computed(() => {
  const res = props.mode === 'grid' ? formatConfig(props.horizontalConfig) : '';
  return res.length > 0 ? `--stack-template-columns: ${res}` : null;
});

if (props.builderOptions?.useRegistry) {
  const instance = getCurrentInstance();
  registerBuilderInstance({
    name: 'LxStack',
    instance,
    props,
    builderName: props.builderOptions?.schemaPath,
    componentStack: props.builderOptions?.componentStack?.concat([
      { id: props?.id, name: 'LxStack' },
    ]),
    customItemPath: props.builderOptions?.customItemPath,
  });

  onUnmounted(() => {
    unregisterBuilderInstance(props?.id);
  });
}
</script>
<template>
  <div
    :id="id"
    :data-id="id"
    class="lx-stack"
    :style="`${verticalConfigAlignment}; ${horizontalConfigAlignment}`"
    :class="[
      { [`lx-stack-orientation-${orientation}`]: orientation },
      { [`lx-stack-kind-${kind}`]: kind },
      { [`lx-stack-mode-${mode}`]: mode },
      { [`lx-stack-horizontal-alignment-${horizontalAlignment}`]: horizontalAlignment },
      { [`lx-stack-vertical-alignment-${verticalAlignment}`]: verticalAlignment },
      { 'lx-stack-has-vertical-config': verticalConfig?.length > 1 },
      { 'lx-stack-has-horizontal-config': horizontalConfig?.length > 1 },
      { 'lx-stack-use-vertical-config': verticalConfig?.length > 0 },
      { 'lx-stack-use-horizontal-config': horizontalConfig?.length > 0 },
    ]"
  >
    <slot />
  </div>
</template>
