<script setup>
import { computed, watch } from 'vue';
import { generateUUID } from '@/utils/stringUtils';
import LxIcon from '@/components/Icon.vue';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  loading: { type: Boolean, default: false },
  size: { type: String, default: 'l' }, // 's' (small) or 'l' (large)
  variant: { type: String, default: 'default' }, // 'default' or 'bar'
  modelValue: { type: [Number, String], default: 0 },
  kind: { type: String, default: 'indeterminate' }, // 'indeterminate' or 'progress'
  label: { type: String, default: '' },
  description: { type: String, default: '' },
  fakedDuration: { type: Number, default: 2000 },
  faked: { type: Boolean, default: false },
  state: { type: String, default: 'default' },
  ariaHidden: { type: Boolean, default: false },
});

const emits = defineEmits(['update:modelValue']);

const model = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emits('update:modelValue', value);
  },
});

watch(
  () => model.value,
  (newVal) => {
    if (Number(newVal) > 1) {
      model.value = 1;
    }
    if (Number(newVal) < 0) {
      model.value = 0;
    }
  }
);

const radius = computed(() => (props.size === 's' ? 42 : 45));
const strokeDashArray = computed(() => 2 * Math.PI * radius.value);
const defaultLoaderValue = computed(
  () => 2 * Math.PI * radius.value * ((100 - Number(model.value) * 100) / 100)
);

const strokeWidth = computed(() => (props.size === 's' ? 15 : 10));

const loaderAriaHidden = computed(() => {
  if (props.ariaHidden) {
    return true;
  }
  return !props.label;
});
</script>

<template>
  <div class="lx-loader-wrapper" :id="id" :aria-hidden="loaderAriaHidden" :aria-label="props.label">
    <div
      v-if="loading || kind === 'progress'"
      :class="[
        { 'lx-loader-indeterminate': kind === 'indeterminate' },
        { 'lx-loader-progress': kind === 'progress' },
        { 'lx-loader-default': variant === 'default' },
        { 'lx-loader-bar': variant === 'bar' },
        { 'lx-loader-state-error': state === 'error' },
        { 'lx-loader-state-success': state === 'success' },
        { 'lx-loader-small': size === 's' },
        { 'lx-loader-large': size === 'l' },
      ]"
      :title="props.description"
      :role="kind === 'progress' ? 'progressbar' : undefined"
      :aria-valuenow="kind === 'progress' ? model : undefined"
      :aria-valuemin="kind === 'progress' ? 0 : undefined"
      :aria-valuemax="kind === 'progress' ? 1 : undefined"
    >
      <template v-if="variant === 'default'">
        <div class="lx-loader" v-if="state === 'default'">
          <svg viewBox="0 0 100 100">
            <circle
              class="lx-loader-track"
              cx="50%"
              cy="50%"
              :r="kind === 'progress' ? radius : 44"
              :stroke-width="kind === 'progress' ? strokeWidth : undefined"
              :stroke-dasharray="kind === 'progress' ? strokeDashArray : undefined"
              :stroke-dashoffset="kind === 'progress' ? 0 : undefined"
            />
            <circle
              class="lx-loader-active"
              cx="50%"
              cy="50%"
              :r="kind === 'progress' ? radius : 44"
              :stroke-width="kind === 'progress' ? strokeWidth : undefined"
              :stroke-dashoffset="kind === 'progress' ? defaultLoaderValue : undefined"
              :stroke-dasharray="kind === 'progress' ? strokeDashArray : undefined"
              :style="
                kind === 'progress' && props.faked
                  ? {
                      transition: `stroke-dashoffset ${props.fakedDuration}ms cubic-bezier(0.22,0.05,0,0.87)`,
                    }
                  : {}
              "
            />
          </svg>
        </div>
        <div class="lx-loader-state" v-else>
          <LxIcon v-if="state === 'error'" customClass="lx-invalidation-icon" value="invalid" />
          <LxIcon
            v-if="state === 'success'"
            customClass="lx-success-icon"
            value="notification-success"
          />
        </div>
        <div class="lx-loader-data" v-if="props.label || (props.description && size !== 's')">
          <div class="lx-primary">{{ props.label }}</div>
          <div class="lx-secondary" v-if="size !== 's'">{{ props.description }}</div>
        </div>
      </template>
      <template v-else-if="variant === 'bar'">
        <div class="lx-loader-bar-header">
          <p class="lx-primary">{{ props.label }}</p>
          <div class="lx-loader-bar-state">
            <LxIcon v-if="state === 'error'" customClass="lx-invalidation-icon" value="invalid" />
            <LxIcon
              v-if="state === 'success'"
              customClass="lx-success-icon"
              value="notification-success"
            />
          </div>
        </div>
        <div class="lx-loader-bar-track">
          <div
            class="lx-loader-active"
            :style="
              kind === 'progress'
                ? [
                    { width: `${Number(model) * 100}%` },
                    props.faked
                      ? {
                          transition: `width ${props.fakedDuration}ms cubic-bezier(0.22,0.05,0,0.87)`,
                        }
                      : {},
                  ]
                : {}
            "
          />
        </div>
        <div class="lx-secondary">{{ props.description }}</div>
      </template>
    </div>
  </div>
</template>
