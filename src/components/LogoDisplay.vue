<script setup>
import { computed, inject } from 'vue';
import { getLogo, getAltText } from '@/utils/logoUtils';

const props = defineProps({
  value: { type: String, default: 'zzdats' },
  kind: { type: String, default: 'default' }, // 'default' - 16:9 format, 'square' - 1:1 format
  size: { type: String, default: 'auto' }, // 'auto', 's', 'm', 'l'
  theme: { type: String, default: 'auto' }, // 'auto', 'light', 'dark'
});

const systemTheme = inject('theme', { state: { value: null } });

const resolvedTheme = computed(() => {
  if (props.theme === 'auto') {
    return systemTheme.state?.value === 'dark' ? 'dark' : 'light';
  }
  return props.theme;
});
</script>

<template>
  <template v-if="size === 'auto'">
    <picture>
      <img
        :src="getLogo(props.value, props.kind, 's', resolvedTheme)"
        :alt="getAltText(props.value)"
      />
      <source
        :srcset="getLogo(props.value, props.kind, 'm', resolvedTheme)"
        media="(min-resolution: 2dppx)"
      />
      <source
        :srcset="getLogo(props.value, props.kind, 'l', resolvedTheme)"
        media="(min-resolution: 3dppx)"
      />
    </picture>
  </template>

  <template v-else-if="size === 's'">
    <img
      :src="getLogo(props.value, props.kind, props.size, resolvedTheme)"
      :alt="getAltText(props.value)"
    />
  </template>

  <template v-else-if="size === 'm'">
    <img
      :src="getLogo(props.value, props.kind, props.size, resolvedTheme)"
      :alt="getAltText(props.value)"
    />
  </template>

  <template v-else-if="size === 'l'">
    <img
      :src="getLogo(props.value, props.kind, props.size, resolvedTheme)"
      :alt="getAltText(props.value)"
    />
  </template>
</template>
