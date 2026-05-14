<script setup>
import {
  ref,
  computed,
  watch,
  inject,
  onBeforeUnmount,
  getCurrentInstance,
  onUnmounted,
} from 'vue';
import LxTextInput from '@/components/TextInput.vue';
import { registerBuilderInstance, unregisterBuilderInstance } from '@/utils/builderUtils';

const props = defineProps({
  id: { type: String, default: null },
  modelValue: { type: Number, default: 0 },
  min: { type: Number, default: 0, group: 'main', sequence: 2 },
  max: { type: Number, default: 9999, group: 'main', sequence: 3 },
  step: { type: Number, default: 1, group: 'additional' },
  stepMultiplier: { type: Number, default: 5, group: 'additional' },
  hasInput: { type: Boolean, default: false, group: 'main', sequence: 1 },
  disabled: { type: Boolean, default: false, group: 'mode', sequence: 2 },
  readOnly: { type: Boolean, default: false, group: 'mode', sequence: 1 },
  labelId: { type: String, default: null },
  builderOptions: {
    type: Object,
    default: () => ({
      innerComponent: false,
      componentStack: null,
      schemaPath: null,
      useRegistry: false,
    }),
  },
});

const emits = defineEmits(['update:modelValue']);

const model = computed({
  get() {
    return Number(props.modelValue);
  },
  set(value) {
    emits('update:modelValue', Number(value));
  },
});

watch(
  () => model.value,
  (newValue, oldValue) => {
    if (newValue !== oldValue) {
      model.value = Number(newValue);
    }

    if (model.value <= props.min) {
      model.value = props.min;
    }
    if (model.value >= props.max) {
      model.value = props.max;
    }
  }
);

const tooltip = computed(() => model.value.toString());
const liveAnnouncement = ref(model.value.toString());
let announcementTimeout;

const onIncreaseMultiplier = () => {
  model.value += Number(props.stepMultiplier);
};
const onDecreaseMultiplier = () => {
  model.value -= Number(props.stepMultiplier);
};
const onIncreaseStep = () => {
  model.value += Number(props.step);
};
const onDecreaseStep = () => {
  model.value -= Number(props.step);
};
const fillingUp = computed(() => ((model.value - props.min) / (props.max - props.min)) * 100);

const rowId = inject('rowId', ref(null));
const labelledBy = computed(() => props.labelId || rowId.value);

const onMouseDown = () => {
  globalThis.getSelection()?.removeAllRanges();
};

watch(
  model,
  (newValue) => {
    clearTimeout(announcementTimeout);
    announcementTimeout = globalThis.setTimeout(() => {
      liveAnnouncement.value = newValue.toString();
    }, 250);
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  clearTimeout(announcementTimeout);
});

if (props.builderOptions?.useRegistry) {
  const instance = getCurrentInstance();
  registerBuilderInstance({
    name: 'LxNumberSlider',
    instance,
    props,
    builderName: props.builderOptions?.schemaPath,
    componentStack: props.builderOptions?.componentStack?.concat([
      { id: props?.id, name: 'LxNumberSlider' },
    ]),
  });

  onUnmounted(() => {
    unregisterBuilderInstance(props?.id);
  });
}
</script>
<template>
  <div class="lx-field-wrapper" :data-id="id">
    <p v-if="readOnly" class="lx-data" :aria-labelledby="labelledBy">{{ model }}</p>
    <div
      v-if="!readOnly"
      class="input-slider-container-wrapper"
      :class="{ 'lx-disabled': disabled }"
    >
      <div class="input-slider-range-label">
        <p>{{ props.min }}</p>
      </div>

      <div class="input-slider" :title="tooltip">
        <input
          v-model="model"
          type="range"
          class="lx-number-slider"
          :id="id"
          :min="props.min"
          :max="props.max"
          :step="props.step"
          :aria-labelledby="labelledBy"
          :disabled
          @mousedown="onMouseDown"
          @keydown.up.prevent="onIncreaseStep"
          @keydown.right.prevent="onIncreaseStep"
          @keydown.down.prevent="onDecreaseStep"
          @keydown.left.prevent="onDecreaseStep"
          @keydown.shift.up.exact.prevent="onIncreaseMultiplier"
          @keydown.shift.right.exact.prevent="onIncreaseMultiplier"
          @keydown.shift.down.exact.prevent="onDecreaseMultiplier"
          @keydown.shift.left.exact.prevent="onDecreaseMultiplier"
        />
        <div class="input-slider-filled" :style="`width: ${fillingUp}%`" />
        <div class="input-slider-full" />
      </div>
      <div class="lx-visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {{ liveAnnouncement }}
      </div>

      <div class="input-slider-range-label">
        <p>{{ props.max }}</p>
      </div>
      <div class="input-slider-range-text" v-show="hasInput">
        <LxTextInput
          type="text"
          v-model="model"
          mask="integer"
          :labelId="labelledBy"
          :disabled
          :builderOptions="{ innerComponent: true }"
        />
      </div>
    </div>
  </div>
</template>
