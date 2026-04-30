<script setup>
import { computed, ref } from 'vue';
import LxInfoWrapper from '@/components/InfoWrapper.vue';
import LxIcon from '@/components/Icon.vue';
import { getDisplayTexts } from '@/utils/generalUtils';

const emits = defineEmits(['update:modelValue']);

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  kind: { type: String, default: '5stars' },
  variant: { type: String, default: 'default' }, // 'default' or 'colorful'
  readOnly: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  focusable: { type: Boolean, default: true },
  invalid: { type: Boolean, default: false },
  invalidationMessage: { type: String, default: null },
  texts: { type: Object, default: () => ({}) },
});

const textsDefault = {
  label: 'Vērtējums',
  star1: 'Ļoti slikti',
  star2: 'Slikti',
  star3: 'Gandrīz labi',
  star4: 'Labi',
  star5: 'Izcili',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));

const infoWrapperRef = ref(null);

const model = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emits('update:modelValue', value);
  },
});

const valueDecomposition = computed(() => {
  if (props.kind === '5stars') {
    const res = [];
    const count = Math.floor(model.value);
    let notFilled = 5 - count;
    const decimal = model.value - count;
    for (let i = 0; i < count; i += 1) {
      res.push('star-filled');
    }
    if (props.readOnly) {
      if (decimal >= 0.5) {
        res.push('star-half');
        notFilled -= 1;
      }
    }
    for (let i = 0; i < notFilled; i += 1) {
      res.push('star');
    }
    return res;
  }
  return [];
});

const valueDescription = computed(() => {
  if (props.kind === '5stars') {
    if (model.value >= 5) return displayTexts.value.star5;
    if (model.value >= 4) return displayTexts.value.star4;
    if (model.value >= 3) return displayTexts.value.star3;
    if (model.value >= 2) return displayTexts.value.star2;
    if (model.value >= 1) return displayTexts.value.star1;
  }
  return '';
});
const valueClass = computed(() => {
  if (props.kind === '5stars') {
    if (model.value >= 5) return 'lx-category-green';
    if (model.value >= 4) return 'lx-category-orange';
    if (model.value >= 3) return 'lx-category-orange';
    if (model.value >= 2) return 'lx-category-red';
    if (model.value >= 1) return 'lx-category-red';
  }
  return '';
});

const accessibleLabel = computed(() => {
  if (model.value) {
    return `${displayTexts.value.label}: ${model.value}, ${valueDescription.value}`;
  }
  return `${displayTexts.value.label}: —`;
});

function setValue(value) {
  if (props.readOnly || props.disabled) {
    return;
  }
  if (model.value !== value) {
    model.value = value;
  } else {
    model.value = null;
  }
}

function focusStar(value) {
  const root = infoWrapperRef.value?.$el;
  const star = root?.querySelector(`.lx-ratings [role="radio"][data-rating="${value}"]`);
  star?.focus();
}

function handleRadioKeydown(event, value) {
  if (props.readOnly || props.disabled) {
    return;
  }

  switch (event.key) {
    case ' ':
    case 'Enter':
      setValue(value);
      break;
    case 'ArrowLeft':
    case 'ArrowUp': {
      const previous = value === 1 ? 5 : value - 1;
      setValue(previous);
      focusStar(previous);
      break;
    }
    case 'ArrowRight':
    case 'ArrowDown': {
      const next = value === 5 ? 1 : value + 1;
      setValue(next);
      focusStar(next);
      break;
    }
    case 'Home':
      setValue(1);
      focusStar(1);
      break;
    case 'End':
      setValue(5);
      focusStar(5);
      break;
    default:
      return;
  }

  event.preventDefault();
}

const getTabIndex = (value) => {
  if (props.readOnly || props.disabled) {
    return -1;
  }

  if (!model.value) {
    return value === 1 ? 0 : -1;
  }

  if (model.value > 5) {
    return value === 5 ? 0 : -1;
  }

  const isActive = model.value >= value && model.value < value + 1;

  return isActive ? 0 : -1;
};

const hoveredValue = ref(null);
function hover(value) {
  if (props.disabled) {
    hoveredValue.value = null;
  } else if (props.readOnly) {
    hoveredValue.value = value;
  }
}

function reset() {
  if (props.disabled || props.readOnly) {
    hoveredValue.value = null;
  }
}

const showInvalid = computed(() => props.invalid && !props.readOnly);

function focus() {
  if (props.focusable) {
    infoWrapperRef.value?.focus();
  }
}

function scrollIntoView({ behavior, block, container, inline }) {
  infoWrapperRef.value?.scrollIntoView({
    behavior,
    block,
    container,
    inline,
  });
}

defineExpose({ focus, scrollIntoView });
</script>
<template>
  <div class="lx-field-wrapper">
    <div class="lx-ratings-wrapper">
      <LxInfoWrapper
        ref="infoWrapperRef"
        :disabled="disabled && !readOnly"
        :focusable="focusable"
        :label="accessibleLabel"
      >
        <div
          v-if="!(readOnly && !model)"
          class="lx-ratings"
          role="radiogroup"
          :aria-disabled="disabled"
          :class="[
            { 'lx-disabled': disabled },
            { 'lx-read-only': readOnly },
            { 'lx-select-1': hoveredValue === 1 },
            { 'lx-select-2': hoveredValue === 2 },
            { 'lx-select-3': hoveredValue === 3 },
            { 'lx-select-4': hoveredValue === 4 },
            { 'lx-select-5': hoveredValue === 5 },
            { 'lx-colorful': variant === 'colorful' },
            { 'lx-invalid': showInvalid },
          ]"
        >
          <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
          <div
            class="lx-star-1"
            :class="[{ 'lx-selected': valueDecomposition[0] !== 'star' }]"
            role="radio"
            :aria-checked="model >= 1 && model < 2"
            :aria-disabled="disabled"
            data-rating="1"
            :aria-label="displayTexts.star1"
            :tabindex="getTabIndex(1)"
            @click="setValue(1)"
            @keydown="handleRadioKeydown($event, 1)"
            @mouseover="hover(1)"
            @focus="hover(1)"
            @mouseleave="reset()"
            @blur="reset()"
          >
            <LxIcon :value="valueDecomposition[0]" :customClass="valueClass" />
          </div>
          <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
          <div
            class="lx-star-2"
            :class="[{ 'lx-selected': valueDecomposition[1] !== 'star' }]"
            role="radio"
            :aria-checked="model >= 2 && model < 3"
            :aria-disabled="disabled"
            data-rating="2"
            :aria-label="displayTexts.star2"
            :tabindex="getTabIndex(2)"
            @click="setValue(2)"
            @keydown="handleRadioKeydown($event, 2)"
            @mouseover="hover(2)"
            @focus="hover(2)"
            @mouseleave="reset()"
            @blur="reset()"
          >
            <LxIcon :value="valueDecomposition[1]" :customClass="valueClass" />
          </div>
          <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
          <div
            class="lx-star-3"
            :class="[{ 'lx-selected': valueDecomposition[2] !== 'star' }]"
            role="radio"
            :aria-checked="model >= 3 && model < 4"
            :aria-disabled="disabled"
            data-rating="3"
            :aria-label="displayTexts.star3"
            :tabindex="getTabIndex(3)"
            @click="setValue(3)"
            @keydown="handleRadioKeydown($event, 3)"
            @mouseover="hover(3)"
            @focus="hover(3)"
            @mouseleave="reset()"
            @blur="reset()"
          >
            <LxIcon :value="valueDecomposition[2]" :customClass="valueClass" />
          </div>
          <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
          <div
            class="lx-star-4"
            :class="[{ 'lx-selected': valueDecomposition[3] !== 'star' }]"
            role="radio"
            :aria-checked="model >= 4 && model < 5"
            :aria-disabled="disabled"
            data-rating="4"
            :aria-label="displayTexts.star4"
            :tabindex="getTabIndex(4)"
            @click="setValue(4)"
            @keydown="handleRadioKeydown($event, 4)"
            @mouseover="hover(4)"
            @focus="hover(4)"
            @mouseleave="reset()"
            @blur="reset()"
          >
            <LxIcon :value="valueDecomposition[3]" :customClass="valueClass" />
          </div>
          <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
          <div
            class="lx-star-5"
            :class="[{ 'lx-selected': valueDecomposition[4] !== 'star' }]"
            role="radio"
            :aria-checked="model >= 5"
            :aria-disabled="disabled"
            data-rating="5"
            :aria-label="displayTexts.star5"
            :tabindex="getTabIndex(5)"
            @click="setValue(5)"
            @keydown="handleRadioKeydown($event, 5)"
            @mouseover="hover(5)"
            @focus="hover(5)"
            @mouseleave="reset()"
            @blur="reset()"
          >
            <LxIcon :value="valueDecomposition[4]" :customClass="valueClass" />
          </div>
        </div>

        <div v-else class="lx-ratings">
          <p class="lx-data">—</p>
        </div>

        <template #panel>
          <div class="lx-row">
            <label>{{ displayTexts.label }}</label>

            <p v-if="model" class="lx-data">
              <strong>{{ model.toString() }}</strong
              ><span class="lx-primary">&nbsp;/ 5:&nbsp;</span> {{ valueDescription }}
            </p>

            <p v-else class="lx-data">—</p>
          </div>
        </template>
      </LxInfoWrapper>
      <div v-if="showInvalid" class="lx-invalidation-icon-wrapper">
        <LxIcon customClass="lx-invalidation-icon" value="invalid" />
      </div>
    </div>
    <div class="lx-invalidation-message" v-if="showInvalid">
      {{ invalidationMessage }}
    </div>
  </div>
</template>
