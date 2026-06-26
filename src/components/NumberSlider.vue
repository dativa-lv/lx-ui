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
import LxButton from '@/components/Button.vue';
import { getDisplayTexts } from '@/utils/generalUtils';
import { registerBuilderInstance, unregisterBuilderInstance } from '@/utils/builderUtils';
import { makeIntegerValidator } from '@/utils/numberSliderUtils';

const props = defineProps({
  id: { type: String, default: null },
  modelValue: {
    type: Number,
    default: 0,
    validator: makeIntegerValidator('modelValue'),
  },
  kind: {
    type: String,
    default: 'slider',
    options: ['slider', 'stepper'],
    group: 'main',
    sequence: 1,
  },
  min: {
    type: Number,
    default: 0,
    group: 'main',
    sequence: 2,
    validator: makeIntegerValidator('min'),
  },
  max: {
    type: Number,
    default: 9999,
    group: 'main',
    sequence: 3,
    validator: makeIntegerValidator('max'),
  },
  step: {
    type: Number,
    default: 1,
    group: 'additional',
    validator: makeIntegerValidator('step'),
  },
  stepMultiplier: {
    type: Number,
    default: 5,
    group: 'additional',
    validator: makeIntegerValidator('stepMultiplier'),
  },
  hasInput: { type: Boolean, default: false, group: 'main', sequence: 4 },
  disabled: { type: Boolean, default: false, group: 'mode', sequence: 2 },
  readOnly: { type: Boolean, default: false, group: 'mode', sequence: 1 },
  labelId: { type: String, default: null },
  disableArrowKeys: { type: Boolean, default: false },
  texts: { type: Object, default: () => ({}) },
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

const textsDefault = {
  decreaseValue: 'Samazināt vērtību',
  increaseValue: 'Palielināt vērtību',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));

const emits = defineEmits(['update:modelValue']);

const model = computed({
  get() {
    return Math.round(Number(props.modelValue));
  },
  set(value) {
    emits('update:modelValue', Math.round(Number(value)));
  },
});

const stepValue = computed(() => Math.round(Number(props.step)));
const stepMultiplierValue = computed(() => Math.round(Number(props.stepMultiplier)));
const minValue = computed(() => Math.round(Number(props.min)));
const maxValue = computed(() => Math.round(Number(props.max)));

watch(
  () => model.value,
  (newValue, oldValue) => {
    if (newValue !== oldValue) {
      model.value = Number(newValue);
    }

    if (model.value <= minValue.value) {
      model.value = minValue.value;
    }
    if (model.value >= maxValue.value) {
      model.value = maxValue.value;
    }
  }
);

const tooltip = computed(() => model.value.toString());
const liveAnnouncement = ref(model.value.toString());
let announcementTimeout;

const onIncreaseMultiplier = () => {
  model.value += stepMultiplierValue.value;
};
const onDecreaseMultiplier = () => {
  model.value -= stepMultiplierValue.value;
};
const onIncreaseStep = () => {
  model.value += stepValue.value;
};
const onDecreaseStep = () => {
  model.value -= stepValue.value;
};

const pageStep = computed(() =>
  Math.max(stepValue.value, Math.round((maxValue.value - minValue.value) / 10))
);

const onIncreasePage = () => {
  model.value += pageStep.value;
};
const onDecreasePage = () => {
  model.value -= pageStep.value;
};

function onStepperButtonMouseDown(event) {
  if (props.hasInput) event.preventDefault();
}

const isDecreaseDisabled = computed(() => props.disabled || model.value <= minValue.value);
const isIncreaseDisabled = computed(() => props.disabled || model.value >= maxValue.value);
const fillingUp = computed(
  () => ((model.value - minValue.value) / (maxValue.value - minValue.value)) * 100
);

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
    <template v-else-if="kind === 'stepper'">
      <div
        class="lx-number-stepper-wrapper lx-input-wrapper"
        :class="[{ 'lx-disabled': disabled }, { 'lx-number-stepper-no-input': !hasInput }]"
      >
        <LxTextInput
          v-if="hasInput"
          :id="id"
          v-model="model"
          mask="integer"
          class="lx-number-stepper-field"
          :labelId="labelledBy"
          :disabled
          :builderOptions="{ innerComponent: true }"
          @keydown.up.exact.prevent="!props.disableArrowKeys && onIncreaseStep()"
          @keydown.down.exact.prevent="!props.disableArrowKeys && onDecreaseStep()"
          @keydown.shift.up.exact.prevent="!props.disableArrowKeys && onIncreaseMultiplier()"
          @keydown.shift.down.exact.prevent="!props.disableArrowKeys && onDecreaseMultiplier()"
          @keydown.page-up.prevent="onIncreasePage"
          @keydown.page-down.prevent="onDecreasePage"
        />
        <p
          v-else
          class="lx-number-stepper-value lx-input-area"
          role="spinbutton"
          :aria-labelledby="labelledBy"
          :aria-valuenow="model"
          :aria-valuemin="minValue"
          :aria-valuemax="maxValue"
        >
          {{ model }}
        </p>
        <LxButton
          customClass="lx-number-stepper-decrease"
          kind="ghost"
          variant="icon-only"
          icon="subtract"
          :label="displayTexts.decreaseValue"
          :disabled="isDecreaseDisabled"
          :tabindex="hasInput ? -1 : 0"
          @mousedown="onStepperButtonMouseDown"
          @click="onDecreaseStep"
        />
        <LxButton
          customClass="lx-number-stepper-increase"
          kind="ghost"
          variant="icon-only"
          icon="add"
          :label="displayTexts.increaseValue"
          :disabled="isIncreaseDisabled"
          :tabindex="hasInput ? -1 : 0"
          @mousedown="onStepperButtonMouseDown"
          @click="onIncreaseStep"
        />
      </div>
      <div
        v-if="!hasInput"
        class="lx-invisible"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {{ liveAnnouncement }}
      </div>
    </template>
    <div v-else class="input-slider-container-wrapper" :class="{ 'lx-disabled': disabled }">
      <div class="input-slider-range-label">
        <p>{{ minValue }}</p>
      </div>

      <div class="input-slider" :title="tooltip">
        <input
          v-model="model"
          type="range"
          class="lx-number-slider"
          :id="id"
          :min="minValue"
          :max="maxValue"
          :step="stepValue"
          :aria-labelledby="labelledBy"
          :disabled
          @mousedown="onMouseDown"
          @keydown.up.prevent="!props.disableArrowKeys && onIncreaseStep()"
          @keydown.right.prevent="onIncreaseStep"
          @keydown.down.prevent="!props.disableArrowKeys && onDecreaseStep()"
          @keydown.left.prevent="onDecreaseStep"
          @keydown.shift.up.exact.prevent="!props.disableArrowKeys && onIncreaseMultiplier()"
          @keydown.shift.right.exact.prevent="onIncreaseMultiplier"
          @keydown.shift.down.exact.prevent="!props.disableArrowKeys && onDecreaseMultiplier()"
          @keydown.shift.left.exact.prevent="onDecreaseMultiplier"
        />
        <div class="input-slider-filled" :style="`width: ${fillingUp}%`" />
        <div class="input-slider-full" />
      </div>
      <div class="lx-invisible" role="status" aria-live="polite" aria-atomic="true">
        {{ liveAnnouncement }}
      </div>

      <div class="input-slider-range-label">
        <p>{{ maxValue }}</p>
      </div>
      <div
        class="input-slider-range-text"
        v-show="hasInput"
        @keydown.up.exact.prevent="!props.disableArrowKeys && onIncreaseStep()"
        @keydown.down.exact.prevent="!props.disableArrowKeys && onDecreaseStep()"
        @keydown.shift.up.exact.prevent="!props.disableArrowKeys && onIncreaseMultiplier()"
        @keydown.shift.down.exact.prevent="!props.disableArrowKeys && onDecreaseMultiplier()"
        @keydown.page-up.prevent="onIncreasePage"
        @keydown.page-down.prevent="onDecreasePage"
      >
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
