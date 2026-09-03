<script setup>
import { ref, computed, inject } from 'vue';
import { generateUUID } from '@/utils/stringUtils';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  groupId: { type: String, default: null },
  modelValue: { type: Boolean, default: false },
  label: { type: String, default: null },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: null },
  value: { type: String, default: 'none' },
  tabindex: { type: String, default: '0' },
  labelId: { type: String, default: null },
});

const emits = defineEmits(['update:modelValue', 'click']);

const model = computed({
  get() {
    return !!props.modelValue;
  },
  set(value) {
    emits('update:modelValue', !!value);
  },
});

const inputRef = ref(null);

const rowId = inject('rowId', ref(null));
const labelledBy = computed(() => props.labelId || rowId.value);
const ariaRequired = computed(() => (props.required ? true : null));

const click = (e) => {
  emits('click', e);
};

function focus() {
  inputRef.value?.focus();
}

function scrollIntoView({
  behavior = 'auto',
  block = 'start',
  container = 'all',
  inline = 'nearest',
}) {
  inputRef.value?.scrollIntoView({
    behavior,
    block,
    container,
    inline,
  });
}

defineExpose({ focus, scrollIntoView });
</script>

<template>
  <div
    class="lx-radio-button-wrapper"
    :class="{ 'lx-checked': model, 'lx-disabled': disabled }"
    data-component="lx-radio-button"
    :data-id="id"
  >
    <input
      ref="inputRef"
      type="radio"
      class="lx-radio-button-input"
      :id="id"
      :name="groupId"
      v-model="model"
      :checked="model"
      :aria-label="label"
      :aria-checked="model"
      :disabled="disabled"
      :value="value"
      :tabindex="tabindex"
      :aria-labelledby="labelledBy"
      :aria-required="ariaRequired"
      @click="click"
    />
    <label :for="id" class="lx-selecting-block" aria-hidden="true">
      <span class="lx-radio-button-container">
        <span class="lx-radio-button-thumb" />
      </span>
    </label>
    <label v-if="label || $slots.default" :for="id" class="lx-radio-button-text-wrapper">
      <span class="lx-radio-button-label" v-if="label">{{ label }}</span>
      <template v-else><slot /></template>
    </label>
  </div>
</template>
