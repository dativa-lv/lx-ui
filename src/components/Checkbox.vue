<script setup>
import { ref, computed, onMounted, inject, getCurrentInstance } from 'vue';
import { generateUUID } from '@/utils/stringUtils';
import LxIcon from '@/components/Icon.vue';
import { registerBuilderInstance } from '@/utils/builderUtils';

const props = defineProps({
  id: { type: String, default: null },
  groupId: { type: String, default: null },
  modelValue: { type: Boolean, default: false },
  label: { type: String, default: null, group: 'main', sequence: 1 },
  disabled: { type: Boolean, default: false, group: 'mode', sequence: 1 },
  value: { type: String, default: 'none', group: 'main', sequence: 2 },
  tabindex: { type: String, default: '0' },
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

const emits = defineEmits(['update:modelValue', 'click']);

const model = computed({
  get() {
    return !!props.modelValue;
  },
  set(value) {
    emits('update:modelValue', !!value);
  },
});

const idValue = ref('');
const inputRef = ref(null);

const rowId = inject('rowId', ref(null));
const labelledBy = computed(() => props.labelId || rowId.value);

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

onMounted(() => {
  if (props.id) {
    idValue.value = props.id;
  } else {
    idValue.value = generateUUID();
  }
});

defineExpose({ focus, scrollIntoView });

if (!props.builderOptions?.innerComponent && props.builderOptions?.useRegistry) {
  const instance = getCurrentInstance();
  registerBuilderInstance({
    name: 'LxCheckbox',
    instance,
    props,
    builderName: props.builderOptions?.schemaPath,
    componentStack: props.builderOptions?.componentStack?.concat([
      { id: props?.id, name: 'LxCheckbox' },
    ]),
  });
}
</script>

<template>
  <div class="lx-checkbox-wrapper" :data-id="id">
    <input
      ref="inputRef"
      type="checkbox"
      class="lx-checkbox"
      :id="idValue"
      :name="groupId"
      v-model="model"
      :checked="model"
      :aria-checked="model"
      :disabled="disabled"
      :value="value"
      :tabindex="tabindex"
      :aria-labelledby="labelledBy"
      :aria-label="label"
      @click="click"
    />
    <label
      :for="idValue"
      class="lx-checkbox-label-wrapper lx-aligned-row lx-aligned-row-inverse lx-aligned-row-2"
    >
      <span class="lx-checkbox-appearance">
        <span class="lx-checkbox-thumb">
          <LxIcon value="check" icon-set="cds" />
        </span>
      </span>
      <span class="lx-checkbox-label" v-if="label">{{ label }}</span>
      <template v-else><slot /></template>
    </label>
  </div>
</template>
