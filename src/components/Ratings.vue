<script setup lang="ts">
import { computed, ref } from 'vue';
import LxInfoWrapper from '@/components/InfoWrapper.vue';
import LxIcon from '@/components/Icon.vue';
import { getDisplayTexts } from '@/utils/generalUtils';

const emits = defineEmits(['update:modelValue']);

const props = defineProps({
  mode: { type: String, default: 'edit' },
  modelValue: { type: Number, default: 0 },
  kind: { type: String, default: '5stars' },
  variant: { type: String, default: 'default' }, // 'default' or 'colorful'
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
    if (props.mode === 'read') {
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
    if (model.value >= 5.0) return displayTexts.value.star5;
    if (model.value >= 4.0) return displayTexts.value.star4;
    if (model.value >= 3.0) return displayTexts.value.star3;
    if (model.value >= 2.0) return displayTexts.value.star2;
    if (model.value >= 1.0) return displayTexts.value.star1;
  }
  return '';
});
const valueClass = computed(() => {
  if (props.kind === '5stars') {
    if (model.value >= 5.0) return 'lx-category-green';
    if (model.value >= 4.0) return 'lx-category-orange';
    if (model.value >= 3.0) return 'lx-category-orange';
    if (model.value >= 2.0) return 'lx-category-red';
    if (model.value >= 1.0) return 'lx-category-red';
  }
  return '';
});

function setValue(value) {
  if (props.mode === 'edit' && !props.disabled) {
    if (model.value !== value) {
      model.value = value;
    } else {
      model.value = null;
    }
  }
}

const hoveredValue = ref(null);
function hover(value) {
  if (props.disabled) {
    hoveredValue.value = null;
  } else if (props.mode === 'edit') {
    hoveredValue.value = value;
  }
}

function reset() {
  if (props.disabled) {
    hoveredValue.value = null;
  } else if (props.mode === 'edit') {
    hoveredValue.value = null;
  }
}

const showInvalid = computed(() => props.invalid && props.mode !== 'read');

function focus() {
  if (props.focusable) {
    infoWrapperRef.value?.focus();
  }
}

defineExpose({ focus });
</script>
<template>
  <div class="lx-field-wrapper">
    <div class="lx-ratings-wrapper">
      <LxInfoWrapper
        ref="infoWrapperRef"
        :disabled="disabled && mode === 'edit'"
        :focusable="focusable"
      >
        <div
          v-if="!(mode === 'read' && !model)"
          class="lx-ratings"
          :class="[
            { 'lx-disabled': disabled },
            { 'lx-read-only': mode === 'read' },
            { 'lx-select-1': hoveredValue === 1 },
            { 'lx-select-2': hoveredValue === 2 },
            { 'lx-select-3': hoveredValue === 3 },
            { 'lx-select-4': hoveredValue === 4 },
            { 'lx-select-5': hoveredValue === 5 },
            { 'lx-colorful': variant === 'colorful' },
            { 'lx-invalid': showInvalid },
          ]"
        >
          <div class="lx-star-1" :class="[{ 'lx-selected': valueDecomposition[0] !== 'star' }]">
            <!-- focus is handled by info wrapper -->
            <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events -->
            <LxIcon
              :value="valueDecomposition[0]"
              :customClass="valueClass"
              @click="setValue(1)"
              @mouseover="hover(1)"
              @mouseleave="reset()"
            />
          </div>

          <div class="lx-star-2" :class="[{ 'lx-selected': valueDecomposition[1] !== 'star' }]">
            <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events -->
            <LxIcon
              :value="valueDecomposition[1]"
              :customClass="valueClass"
              @click="setValue(2)"
              @mouseover="hover(2)"
              @mouseleave="reset()"
            />
          </div>

          <div class="lx-star-3" :class="[{ 'lx-selected': valueDecomposition[2] !== 'star' }]">
            <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events -->
            <LxIcon
              :value="valueDecomposition[2]"
              :customClass="valueClass"
              @click="setValue(3)"
              @mouseover="hover(3)"
              @mouseleave="reset()"
            />
          </div>

          <div class="lx-star-4" :class="[{ 'lx-selected': valueDecomposition[3] !== 'star' }]">
            <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events -->
            <LxIcon
              :value="valueDecomposition[3]"
              :customClass="valueClass"
              @click="setValue(4)"
              @mouseover="hover(4)"
              @mouseleave="reset()"
            />
          </div>

          <div class="lx-star-5" :class="[{ 'lx-selected': valueDecomposition[4] !== 'star' }]">
            <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events -->
            <LxIcon
              :value="valueDecomposition[4]"
              :customClass="valueClass"
              @click="setValue(5)"
              @mouseover="hover(5)"
              @mouseleave="reset()"
            />
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
