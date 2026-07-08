<script setup>
import { computed, inject, ref, watch } from 'vue';
import { getLogo, getAltText } from '@/utils/logoUtils';

const props = defineProps({
  value: { type: String, default: 'dativa' },
  kind: { type: String, default: 'default' }, // 'default' - 16:9 format, 'square' - 1:1 format
  size: { type: String, default: 'auto' }, // 'auto', 's', 'm', 'l'
  theme: { type: String, default: 'auto' }, // 'auto', 'light', 'dark'
});

const systemTheme = inject('theme', { state: { value: null } });

const resolvedTheme = computed(() => {
  if (props.theme === 'auto') {
    // Temporarily default to dark logos in contrast theme until mono logos are added
    return systemTheme.state?.value === 'light' ? 'light' : 'dark';
  }
  return props.theme;
});

const altText = computed(() => getAltText(props.value));

// Logos are loaded lazily, so getLogo is async — resolve URLs into refs.
const srcS = ref('');
const srcM = ref('');
const srcL = ref('');
const srcFixed = ref('');

watch(
  [() => props.value, () => props.kind, () => props.size, resolvedTheme],
  async ([value, kind, size, theme]) => {
    if (size === 'auto') {
      [srcS.value, srcM.value, srcL.value] = await Promise.all([
        getLogo(value, kind, 's', theme),
        getLogo(value, kind, 'm', theme),
        getLogo(value, kind, 'l', theme),
      ]);
    } else {
      srcFixed.value = await getLogo(value, kind, size, theme);
    }
  },
  { immediate: true }
);
</script>

<template>
  <picture v-if="size === 'auto'">
    <source :srcset="srcL" media="(min-resolution: 3dppx)" />
    <source :srcset="srcM" media="(min-resolution: 2dppx)" />
    <img :src="srcS" :alt="altText" />
  </picture>

  <img v-else :src="srcFixed" :alt="altText" />
</template>
