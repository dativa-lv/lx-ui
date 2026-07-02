<script setup>
import { ref, computed, watch, nextTick, inject, getCurrentInstance, onUnmounted } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import LxIcon from '@/components/Icon.vue';
import LxEmptyValue from '@/components/EmptyValue.vue';
import { getDisplayTexts } from '@/utils/generalUtils';
import { registerBuilderInstance, unregisterBuilderInstance } from '@/utils/builderUtils';

const props = defineProps({
  id: { type: String, default: null },
  modelValue: { type: String, default: null },
  placeholder: { type: String, default: null, group: 'main', sequence: 4 },
  rows: { type: Number, default: 3, group: 'main', sequence: 2 },
  readOnly: { type: Boolean, default: false, group: 'mode', sequence: 1 },
  disabled: { type: Boolean, default: false, group: 'mode', sequence: 2 },
  invalid: { type: Boolean, default: false, sequence: 1 },
  invalidationMessage: { type: String, default: null, sequence: 2 },
  maxlength: { type: Number, default: null, group: 'main', sequence: 1 },
  dynamicHeight: { type: Boolean, default: false, group: 'main', sequence: 3 },
  tooltip: { type: String, default: null, group: 'main', sequence: 5 },
  labelId: { type: String, default: null },
  texts: { type: Object, default: () => ({}), group: 'additional', sequence: 100 },
  builderOptions: {
    type: Object,
    default: () => ({
      innerComponent: false,
      schemaPath: null,
      componentStack: null,
      useRegistry: false,
    }),
  },
});

const textsDefault = {
  emptyValue: 'Nav norādīts',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));

const emits = defineEmits(['update:modelValue']);

const model = computed({
  get() {
    return props.modelValue?.toString();
  },
  set(value) {
    emits('update:modelValue', value?.toString());
  },
});

const textarea = ref(null);
const shadowTextarea = ref(null);
const wrapperRef = ref();

function triggerResize() {
  if (!textarea.value || !shadowTextarea.value) return;

  shadowTextarea.value.value = model.value || '';
  const newHeight = `${shadowTextarea.value.scrollHeight}px`;
  textarea.value.style.height = newHeight;
}

function focus() {
  if (textarea.value !== null && textarea.value !== undefined) textarea.value.focus();
}

const rowId = inject('rowId', ref(null));
const labelledBy = computed(() => props.labelId || rowId.value);

watch(
  model,
  () => {
    if (props.dynamicHeight) {
      nextTick(triggerResize);
    }
  },
  { immediate: true }
);

watch(
  () => props.dynamicHeight,
  (newValue) => {
    if (newValue) {
      nextTick(triggerResize);
    }
  }
);

useResizeObserver(wrapperRef, (entries) => {
  const entry = entries[0];
  const { height } = entry.contentRect;

  if (height !== 0 && props.dynamicHeight) {
    nextTick(triggerResize);
  }
});

defineExpose({ focus });

if (props.builderOptions?.useRegistry) {
  const instance = getCurrentInstance();
  // Adds default texts to ensure they are available in the builder instance
  instance.type.props.texts.options = textsDefault;
  registerBuilderInstance({
    name: 'LxTextArea',
    instance,
    props,
    builderName: props.builderOptions?.schemaPath,
    componentStack: props.builderOptions?.componentStack?.concat([
      { id: props?.id, name: 'LxTextArea' },
    ]),
  });

  onUnmounted(() => {
    unregisterBuilderInstance(props?.id);
  });
}
</script>

<template>
  <div class="lx-field-wrapper" ref="wrapperRef" :data-id="id">
    <p v-if="props.readOnly" class="lx-data" :aria-labelledby="labelledBy">
      {{ model }}
      <LxEmptyValue v-if="!model" :texts="{ emptyValue: displayTexts.emptyValue }" />
    </p>
    <template v-else>
      <div class="lx-text-area-wrapper" :data-invalid="invalid ? '' : null">
        <div
          class="lx-input-wrapper"
          :class="[{ 'lx-invalid': invalid }, { 'lx-disabled': disabled }]"
        >
          <div class="pseudo-input" />
          <textarea
            v-model="model"
            ref="textarea"
            :class="[
              'lx-text-area',
              'lx-input-area',
              { 'lx-text-area-dynamic': props.dynamicHeight },
            ]"
            :aria-invalid="invalid"
            :id="props.id"
            :placeholder="props.placeholder"
            :rows="props.rows"
            :disabled="props.disabled"
            :maxlength="props.maxlength"
            :title="props.tooltip"
            :aria-labelledby="labelledBy"
            :aria-errormessage="invalid ? `${props.id}-invalidation-message` : null"
            :aria-describedby="invalid ? `${props.id}-invalidation-message` : null"
            @input="triggerResize"
          />

          <!-- Hidden template textarea for height calculation -->
          <textarea
            v-if="props.dynamicHeight"
            ref="shadowTextarea"
            class="lx-text-area lx-text-area-template lx-input-area"
            :id="`${props.id}-shadow`"
            readonly
            aria-hidden="true"
            role="presentation"
            :tabindex="-1"
          />

          <div v-if="invalid" class="lx-invalidation-icon-wrapper">
            <LxIcon customClass="lx-invalidation-icon" value="invalid" />
          </div>
        </div>
        <div v-if="props.maxlength" class="lx-text-length">
          {{ model?.toString()?.length || 0 }}/{{ props.maxlength }}
        </div>
        <div
          v-if="invalid && !readOnly"
          class="lx-invalidation-message"
          :id="`${props.id}-invalidation-message`"
        >
          {{ props.invalidationMessage }}
        </div>
      </div>
    </template>
  </div>
</template>
