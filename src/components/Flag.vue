<script setup>
import { ref, watch, getCurrentInstance, onUnmounted } from 'vue';
import CountryFlag from 'vue-country-flag-next';
import useLx from '@/hooks/useLx';
import { generateUUID } from '@/utils/stringUtils';
import { registerBuilderInstance, unregisterBuilderInstance } from '@/utils/builderUtils';

const props = defineProps({
  id: {
    type: String,
    default: () => generateUUID(),
  },
  value: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    default: 'm', // s, m, l
    options: ['s', 'm', 'l'],
    group: 'main',
    sequence: 1,
  },
  title: {
    type: String,
    default: '',
    group: 'main',
    sequence: 2,
  },
  locale: {
    type: String,
    default: () => useLx().getGlobals()?.locale?.locale || 'lv',
  },
  meaningful: {
    type: Boolean,
    default: true,
  },
  builderOptions: {
    type: Object,
    default: () => ({
      innerComponent: false,
      schemaPath: null,
      componentStack: null,
      useRegistry: false,
      customItemPath: null,
    }),
  },
});

const sizeMap = {
  s: 'small',
  m: 'normal',
  l: 'big',
};

const countryName = ref('');

watch(
  [() => props.value, () => props.locale, () => props.title],
  async ([value, locale, title]) => {
    if (title) {
      countryName.value = '';
      return;
    }
    const { formatCountryCode } = await import('@/utils/format/country');
    countryName.value = formatCountryCode(value, locale) ?? '';
  },
  { immediate: true }
);

if (props.builderOptions?.useRegistry) {
  const instance = getCurrentInstance();
  registerBuilderInstance({
    name: 'LxFlag',
    instance,
    props,
    builderName: props.builderOptions?.schemaPath,
    componentStack: props.builderOptions?.componentStack?.concat([
      { id: props?.id, name: 'LxFlag' },
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
    class="lx-flag"
    :class="[
      { 'lx-small': size === 's' },
      { 'lx-normal': size === 'm' },
      { 'lx-large': size === 'l' },
    ]"
    :aria-label="title || countryName"
    role="img"
    :aria-hidden="!meaningful"
  >
    <country-flag
      :country="value ?? ''"
      :size="sizeMap[size] || 'normal'"
      v-tooltip="title || countryName"
    />
  </div>
</template>
