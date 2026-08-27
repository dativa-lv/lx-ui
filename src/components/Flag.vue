<script setup>
import { ref, watch } from 'vue';
import CountryFlag from 'vue-country-flag-next';
import useLx from '@/hooks/useLx';

const props = defineProps({
  value: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    default: 'm', // s, m, l
  },
  title: {
    type: String,
    default: '',
  },
  locale: {
    type: String,
    default: () => useLx().getGlobals()?.locale?.locale || 'lv',
  },
  meaningful: {
    type: Boolean,
    default: true,
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
</script>
<template>
  <div
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
      :title="title || countryName"
    />
  </div>
</template>
