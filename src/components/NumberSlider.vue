<script setup>
import { ref, computed, watch, inject, onBeforeUnmount } from 'vue';
import LxTextInput from '@/components/TextInput.vue';

const props = defineProps({
  id: { type: String, default: null },
  modelValue: { type: Number, default: 0 },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 9999 },
  step: { type: Number, default: 1 },
  stepMultiplier: { type: Number, default: 5 },
  hasInput: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  readOnly: { type: Boolean, default: false },
  labelId: { type: String, default: null },
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
    announcementTimeout = window.setTimeout(() => {
      liveAnnouncement.value = newValue.toString();
    }, 250);
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  clearTimeout(announcementTimeout);
});
</script>
<template>
  <div class="lx-field-wrapper">
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
        <LxTextInput type="text" v-model="model" mask="integer" :labelId="labelledBy" :disabled />
      </div>
    </div>
  </div>
</template>
