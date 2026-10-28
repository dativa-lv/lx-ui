<script setup>
import {
  shallowRef,
  computed,
  watch,
  defineAsyncComponent,
  getCurrentInstance,
  onUnmounted,
} from 'vue';
import IconDefault from '@/components/icons/Default.vue';
import useLx from '@/hooks/useLx';
import { getDisplayTexts } from '@/utils/generalUtils';
import { generateUUID } from '@/utils/stringUtils';
import { registerBuilderInstance, unregisterBuilderInstance } from '@/utils/builderUtils';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  value: { type: String, default: 'default' },
  iconSet: {
    type: String,
    default: () => useLx().getGlobals()?.iconSet,
    options: ['cds', 'material', 'brand', 'phosphor'],
    group: 'main',
    sequence: 2,
  },
  variant: {
    type: String,
    default: 'default',
    options: ['default', 'gradient-brand', 'gradient-brand-vertical'],
    group: 'main',
    sequence: 3,
  }, // 'default', 'gradient-brand', 'gradient-brand-vertical'
  customClass: { type: String, default: '', group: 'main', sequence: 4 },
  animation: {
    type: String,
    default: 'default',
    options: ['default', 'spin'],
    group: 'main',
    sequence: 5,
  }, // 'default', 'spin'
  meaningful: { type: Boolean, default: false, group: 'main', sequence: 6 }, // If true, icon will be announced by screen reader
  title: { type: String, default: '', group: 'main', sequence: 1 },
  desc: { type: String, default: '', group: 'main', sequence: 7 },
  texts: {
    type: Object,
    default: () => ({}),
  },
  builderOptions: {
    type: Object,
    default: () => ({
      useRegistry: false,
      schemaPath: null,
      componentStack: null,
      customItemPath: null,
    }),
  },
});

const defaultTexts = {
  iconLabel: 'Piktogramma',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, defaultTexts, 'LxIcon'));

const iconPath = shallowRef(null);

const iconSetComputed = computed(() => (props.iconSet ? props.iconSet : 'cds'));

const icon = computed(() => {
  // Separate icon name by '-' if any

  if (typeof props.value === 'object') {
    return null;
  }
  const parts = props.value?.split('-');

  let ret = '';
  parts?.forEach((part) => {
    // Make first letter of each part uppercase and concat them to match icon file name
    ret += `${part?.charAt(0).toUpperCase()}${part?.slice(1)}`;
  });

  return ret;
});

function loadIcon() {
  if (icon.value && iconSetComputed.value) {
    iconPath.value = defineAsyncComponent({
      loader: () =>
        import(
          `@/components/icons/${iconSetComputed.value ? iconSetComputed.value : 'cds'}/${
            icon.value
          }.vue`
        ),
      errorComponent: IconDefault,
    });
  }
}

watch(
  [icon, iconSetComputed],
  () => {
    loadIcon();
  },
  { immediate: true }
);
const viewBoxType = computed(() => {
  if (iconSetComputed.value === 'cds' || iconSetComputed.value === 'brand') {
    return '0 0 32 32';
  }
  if (iconSetComputed.value === 'phosphor') {
    return '0 0 256 256';
  }
  return '0 96 960 960';
});

const gradientComputed = computed(() => {
  if (props.variant === 'gradient-brand') {
    return 'fill: url(#gradient)';
  }
  if (props.variant === 'gradient-brand-vertical') {
    return 'fill: url(#gradient-vertical)';
  }
  return null;
});

if (props.builderOptions?.useRegistry) {
  const instance = getCurrentInstance();
  registerBuilderInstance({
    name: 'LxIcon',
    instance,
    props,
    builderName: props.builderOptions?.schemaPath,
    componentStack: props.builderOptions?.componentStack?.concat([
      { id: props?.id, name: 'LxIcon' },
    ]),
    customItemPath: props.builderOptions?.customItemPath,
  });

  onUnmounted(() => {
    unregisterBuilderInstance(props?.id);
  });
}
</script>

<template>
  <svg
    :class="customClass"
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="viewBoxType"
    :style="gradientComputed"
    :aria-hidden="value === 'none' ? true : !meaningful"
    focusable="false"
    data-component="lx-icon"
    :id="id"
    :data-id="id"
    v-tooltip="props.title"
  >
    <desc>{{ props.desc ? props.desc : `${displayTexts.iconLabel} "${icon}"` }}</desc>
    <defs v-if="variant !== 'default'">
      <linearGradient id="gradient">
        <stop offset="0%" stop-color="var(--color-brand)" />
        <stop offset="50%" stop-color="var(--color-brand-secondary)" />
      </linearGradient>
      <linearGradient id="gradient-vertical" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="var(--color-brand)" />
        <stop offset="100%" stop-color="var(--color-brand-secondary)" />
      </linearGradient>
    </defs>
    <Transition :name="`icon-${animation}`">
      <icon-path />
    </Transition>
  </svg>
</template>
