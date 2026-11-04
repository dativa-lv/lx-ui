<script setup>
import { computed } from 'vue';
import useLx from '@/hooks/useLx';
import LxIcon from '@/components/Icon.vue';
import { lxDevUtils } from '@/utils';
import { generateUUID } from '@/utils/stringUtils';
import { useBuilderRegistration } from '@/utils/builderUtils';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  icon: { type: String, default: null, group: 'main', sequence: 1 },
  iconSet: {
    type: String,
    default: () => useLx().getGlobals()?.iconSet,
    options: ['cds', 'material', 'brand', 'phosphor'],
    group: 'main',
    sequence: 2,
  },
  value: { type: String, default: null },
  tooltip: {
    type: String,
    default: null,
    group: 'main',
    sequence: 3,
    validator: (v, p) => {
      // If icon or value is non-empty, tooltip must be non-empty
      if ((p.icon || p.value) && !v) {
        lxDevUtils.logWarn(
          `LxBadge [${p.id}]: "tooltip" is required when "icon" is provided`,
          useLx().getGlobals()?.environment
        );
        return false;
      }
      return true;
    },
  },
  tooltipDisabled: { type: Boolean, default: false }, // Skips the hover tooltip but keeps it as the accessible name – for when a wrapping component already shows it
  type: {
    type: String,
    default: 'auto',
    options: ['auto', 'number', 'text'],
    group: 'main',
    sequence: 4,
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

const isValueNumber = computed(() => {
  if (props.type === 'auto') return !Number.isNaN(Number(String(props.value)?.trim()));
  return props.type === 'number';
});

const isIconOnly = computed(() => !!props.icon && !props.value);

const isTextOnly = computed(() => !!props.value && !props.icon);

const isEmpty = computed(
  () => props.value != null && String(props.value).trim() === '' && !props.icon
);

useBuilderRegistration('LxBadge', props);
</script>
<template>
  <div
    v-if="icon || value"
    class="lx-badge"
    :class="{
      'lx-badge-icon-only': isIconOnly,
      'lx-badge-text-only': isTextOnly,
      'lx-badge-empty': isEmpty,
    }"
    v-tooltip="{ value: tooltip, disabled: tooltipDisabled }"
    :id="id"
    :data-id="id"
    :aria-label="tooltip"
    data-component="lx-badge"
  >
    <LxIcon
      v-if="icon"
      class="lx-badge-icon"
      :value="icon"
      :iconSet="iconSet"
      :title="tooltipDisabled ? '' : tooltip"
      :aria-hidden="true"
    />
    <template v-if="icon || value">
      <div
        v-if="tooltip && (icon || value)"
        :id="`${id}-tooltip`"
        class="lx-invisible"
        aria-hidden="false"
      >
        ({{ tooltip }}):
      </div>
      <div
        v-if="value"
        class="lx-data lx-badge-text"
        :class="{ 'lx-badge-type-number': isValueNumber }"
      >
        {{ value }}
      </div>
    </template>
  </div>
</template>
