<script setup lang="ts">
import CountryFlag from 'vue-country-flag-next';
import { formatCountryCode } from '@/utils/formatUtils';
import useLx from '@/hooks/useLx';

defineProps({
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
</script>
<template>
  <div
    class="lx-flag"
    :class="[
      { 'lx-small': size === 's' },
      { 'lx-normal': size === 'm' },
      { 'lx-large': size === 'l' },
    ]"
    :aria-label="title || formatCountryCode(value, locale)"
    role="img"
    :aria-hidden="!meaningful"
  >
    <country-flag
      :country="value ?? ''"
      :size="sizeMap[size] || 'normal'"
      :title="title || formatCountryCode(value, locale)"
    />
  </div>
</template>
