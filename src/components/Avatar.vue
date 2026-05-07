<script setup>
import { computed } from 'vue';
import {
  generateUUID,
  generateIntegerInRange,
  initials as getInitials,
  safeString,
} from '@/utils/stringUtils';
import { BACKGROUND_COLORS, SHAPE_COLORS, SHAPES } from '@/utils/decorationUtils';
import useLx from '@/hooks/useLx';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  value: { type: String, default: 'lx' },
  initialsValue: { type: String, default: null },
  kind: { type: String, default: null }, // 'default', 'initials'
  size: { type: String, default: 'm' }, // 's', 'm', 'l', 'xl'
});

const resolvedKind = computed(() => props.kind || useLx().getGlobals()?.avatarKind || 'default');
const safeValue = computed(() => (props.value ? safeString(props.value) : ''));
const safeInitialsValue = computed(() => (props.initialsValue ? props.initialsValue : ''));

const background = computed(() => {
  if (safeValue.value) {
    const index = generateIntegerInRange(safeValue.value, BACKGROUND_COLORS.length, 1);
    return `#${BACKGROUND_COLORS[index]}`;
  }
  return 'transparent';
});

const shapeColor = computed(() => {
  if (safeValue.value) {
    const index = generateIntegerInRange(safeValue.value, SHAPE_COLORS.length, 2);
    return `#${SHAPE_COLORS[index]}`;
  }
  return 'transparent';
});

const shape = computed(() => {
  if (safeValue.value) {
    const index = generateIntegerInRange(safeValue.value, 59, 3);
    return SHAPES.icons[index + 1];
  }
  return '';
});

const initials = computed(() => getInitials(safeInitialsValue.value));
</script>
<template>
  <div
    class="lx-avatar-display"
    :aria-hidden="true"
    :class="[
      { 'lx-avatar-display-s': size === 's' },
      { 'lx-avatar-display-l': size === 'l' },
      { 'lx-avatar-display-xl': size === 'xl' },
      { 'lx-avatar-display-initials-s': resolvedKind === 'initials' && size === 's' },
      { 'lx-avatar-display-initials-m': resolvedKind === 'initials' && size === 'm' },
      { 'lx-avatar-display-initials-l': resolvedKind === 'initials' && size === 'l' },
      { 'lx-avatar-display-initials-xl': resolvedKind === 'initials' && size === 'xl' },
    ]"
    :style="`background-color: ${background};`"
  >
    <span
      v-if="resolvedKind === 'initials' && initials"
      class="lx-avatar-initials"
      :style="`color: ${shapeColor};`"
    >
      {{ initials }}
    </span>
    <svg v-else viewBox="0 0 32 32" :style="`fill: ${shapeColor};`" v-html="shape"></svg>
  </div>
</template>
