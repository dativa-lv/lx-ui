<script setup>
import { computed, onMounted, ref, inject, getCurrentInstance, onUnmounted } from 'vue';
import { generateUUID, stringifyItemsByIdAttribute } from '@/utils/stringUtils';
import { getDisplayTexts } from '@/utils/generalUtils';

import LxValuePickerDefault from '@/components/valuePickers/Default.vue';
import LxValuePickerDropDown from '@/components/valuePickers/Dropdown.vue';
import LxValuePickerTileTag from '@/components/valuePickers/TileTag.vue';
import LxValuePickerRotator from '@/components/valuePickers/Rotator.vue';
import LxValuePickerIndicator from '@/components/valuePickers/Indicator.vue';
import LxValuePickerHorizontal from '@/components/valuePickers/Horizontal.vue';
import { registerBuilderInstance, unregisterBuilderInstance } from '@/utils/builderUtils';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  modelValue: { type: [Array, String, Number], default: () => [] },
  items: { type: Array, default: () => [], group: 'main', sequence: 1 },
  idAttribute: { type: String, default: 'id' },
  nameAttribute: { type: String, default: 'name' },
  iconAttribute: { type: String, default: 'icon', group: 'additional', sequence: 4 },
  iconSetAttribute: { type: String, default: 'iconSet' },
  categoryAttribute: { type: String, default: 'category' },
  descriptionAttribute: { type: String, default: 'description' },
  groupId: { type: String, default: () => generateUUID() },
  variant: {
    type: String,
    default: 'default',
    options: [
      'default',
      'dropdown',
      'tiles',
      'tags',
      'rotator',
      'default-custom',
      'dropdown-custom',
      'tiles-custom',
      'tags-custom',
      'rotator-custom',
      'indicator',
      'horizontal',
      'horizontal-custom',
    ],
    group: 'main',
    sequence: 2,
  }, // 'default' || 'dropdown' || 'tiles' || 'tags' || 'rotator' || 'default-custom' || 'dropdown-custom' || 'tiles-custom' || 'tags-custom'|| 'rotator-custom' || 'indicator' || 'horizontal' || 'horizontal-custom'
  selectionKind: {
    type: String,
    default: 'single',
    options: ['single', 'multiple'],
    group: 'main',
    sequence: 3,
  }, // 'single' (with radio buttons; can select one item) or 'multiple' (with checkboxes; can select many items)
  nullable: { type: Boolean, default: false, group: 'main', sequence: 5 }, // Only if selectionKind === 'single'. If true - adds default radio button 'Not selected'. If false - one item must be already selected.
  placeholder: { type: String, default: null, group: 'main', sequence: 7 },
  hasSearch: { type: Boolean, default: false, group: 'main', sequence: 6 },
  tooltip: { type: String, default: null, group: 'main', sequence: 8 },
  readOnly: { type: Boolean, default: false, group: 'mode', sequence: 1 },
  readOnlyRenderType: {
    type: String,
    default: 'row',
    options: ['row', 'column'],
    group: 'mode',
    sequence: 3,
  }, // 'row' || 'column'
  alwaysAsArray: { type: Boolean, default: false, group: 'additional', sequence: 3 },
  disabled: { type: Boolean, default: false, group: 'mode', sequence: 2 },
  invalid: { type: Boolean, default: false, sequence: 1 },
  invalidationMessage: { type: String, default: null, sequence: 2 },
  searchAttributes: { type: Array, default: null },
  hasSelectAll: { type: Boolean, default: false, group: 'main', sequence: 4 },
  labelId: { type: String, default: null },
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
  clearQuery: 'Notīrīt meklēšanu',
  clearChosen: 'Notīrīt visas izvēlētās vērtības',
  notSelected: 'Nav izvēlēts',
  searchPlaceholder: 'Ievadiet nosaukuma daļu, lai sameklētu vērtības',
  selectAll: 'Izvēlēties visu',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));

const emits = defineEmits(['update:modelValue']);

const stringifiedItems = computed(() =>
  stringifyItemsByIdAttribute(props.items, props.idAttribute)
);

function isDropdownVariant() {
  return props.variant === 'dropdown' || props.variant === 'dropdown-custom';
}

function isNotSelectedValue(value) {
  return Boolean(value) && (value === 'notSelected' || value[0] === 'notSelected');
}

function getClearedValue() {
  return props.alwaysAsArray ? [] : null;
}

function getSingleSelectionValue(value) {
  return props.selectionKind === 'single' && value ? value[0] : value;
}

function getDropdownArrayValue(value) {
  if (!value) return null;
  return props.selectionKind === 'single' ? [value] : value;
}

function normalizeModelValue(value) {
  if (!props.alwaysAsArray && !isDropdownVariant()) {
    return getSingleSelectionValue(value);
  }

  if (props.alwaysAsArray && isDropdownVariant()) {
    return getDropdownArrayValue(value);
  }

  return value;
}

const model = computed({
  get() {
    if (typeof props.modelValue === 'number') {
      return String(props.modelValue);
    }
    return props.modelValue;
  },
  set(value) {
    if (isNotSelectedValue(value)) {
      emits('update:modelValue', getClearedValue());
    } else {
      emits('update:modelValue', normalizeModelValue(value));
    }
  },
});

const rowId = inject('rowId', ref(null));
const labelledBy = computed(() => props.labelId || rowId.value);

onMounted(() => {
  const updateModelValue = (value) => emits('update:modelValue', value);

  // Handle existing value
  if (model.value) {
    const shouldBeArray = props.alwaysAsArray || props.selectionKind === 'multiple';
    if (!Array.isArray(model.value) && shouldBeArray) {
      updateModelValue([model.value]);
    }
    return;
  }

  // Handle missing value
  if (props.selectionKind === 'multiple') {
    updateModelValue([]);
  } else if (props.selectionKind === 'single') {
    updateModelValue(null);
  }
});

if (props.builderOptions?.useRegistry) {
  const instance = getCurrentInstance();
  registerBuilderInstance({
    name: 'LxValuePicker',
    instance,
    props,
    builderName: props.builderOptions?.schemaPath,
    componentStack: props.builderOptions?.componentStack?.concat([
      { id: props?.id, name: 'LxValuePicker' },
    ]),
  });

  onUnmounted(() => {
    unregisterBuilderInstance(props?.id);
  });
}
</script>

<template>
  <div class="lx-field-wrapper" ref="refRoot">
    <div class="lx-value-picker-wrapper" :data-id="id">
      <LxValuePickerDefault
        v-if="variant === 'default' || variant === 'default-custom'"
        :role="selectionKind === 'single' ? 'radiogroup' : 'group'"
        :id="id"
        v-model="model"
        :items="stringifiedItems"
        :idAttribute="idAttribute"
        :nameAttribute="nameAttribute"
        :descriptionAttribute="descriptionAttribute"
        :groupId="groupId"
        :selectionKind="selectionKind"
        :disabled="disabled"
        :invalid="invalid"
        :invalidation-message="invalidationMessage"
        :texts="displayTexts"
        :placeholder="placeholder"
        :tooltip="tooltip"
        :has-search="hasSearch"
        :always-as-array="alwaysAsArray"
        :nullable="nullable"
        :readOnly="readOnly"
        :readOnlyRenderType="readOnlyRenderType"
        :variant="variant"
        :search-attributes="searchAttributes"
        :hasSelectAll="hasSelectAll"
        :labelId="labelledBy"
      >
        <template v-slot:customItem="slotData" v-if="$slots.customItem">
          <slot name="customItem" v-bind="slotData" />
        </template>
      </LxValuePickerDefault>

      <LxValuePickerDropDown
        v-if="variant === 'dropdown' || variant === 'dropdown-custom'"
        :id="id"
        v-model="model"
        :items="stringifiedItems"
        :idAttribute="idAttribute"
        :nameAttribute="nameAttribute"
        :descriptionAttribute="descriptionAttribute"
        :groupId="groupId"
        :selectionKind="selectionKind"
        :disabled="disabled"
        :invalid="invalid"
        :invalidation-message="invalidationMessage"
        :texts="displayTexts"
        :placeholder="placeholder"
        :tooltip="tooltip"
        :has-search="hasSearch"
        :always-as-array="alwaysAsArray"
        :nullable="nullable"
        :readOnly="readOnly"
        :readOnlyRenderType="readOnlyRenderType"
        :variant="variant"
        :search-attributes="searchAttributes"
        :hasSelectAll="hasSelectAll"
        :labelId="labelledBy"
      >
        <template v-slot:customItemDropdown="slotData">
          <slot name="customItem" v-bind="slotData" />
        </template>
      </LxValuePickerDropDown>

      <LxValuePickerTileTag
        v-if="
          variant === 'tiles' ||
          variant === 'tags' ||
          variant === 'tiles-custom' ||
          variant === 'tags-custom'
        "
        :id="id"
        v-model="model"
        :items="stringifiedItems"
        :idAttribute="idAttribute"
        :nameAttribute="nameAttribute"
        :descriptionAttribute="descriptionAttribute"
        :groupId="groupId"
        :variant="variant"
        :selectionKind="selectionKind"
        :disabled="disabled"
        :invalid="invalid"
        :invalidation-message="invalidationMessage"
        :texts="displayTexts"
        :placeholder="placeholder"
        :tooltip="tooltip"
        :always-as-array="alwaysAsArray"
        :has-search="hasSearch"
        :nullable="nullable"
        :readOnly="readOnly"
        :readOnlyRenderType="readOnlyRenderType"
        :search-attributes="searchAttributes"
        :hasSelectAll="hasSelectAll"
        :labelId="labelledBy"
      >
        <template v-slot:customItem="slotData" v-if="$slots.customItem">
          <slot name="customItem" v-bind="slotData" />
        </template>
      </LxValuePickerTileTag>

      <LxValuePickerRotator
        v-if="variant === 'rotator' || variant === 'rotator-custom'"
        :id="id"
        v-model="model"
        :items="stringifiedItems"
        :idAttribute="idAttribute"
        :nameAttribute="nameAttribute"
        :descriptionAttribute="descriptionAttribute"
        :groupId="groupId"
        :variant="variant"
        :selectionKind="selectionKind"
        :disabled="disabled"
        :invalid="invalid"
        :invalidation-message="invalidationMessage"
        :texts="displayTexts"
        :placeholder="placeholder"
        :tooltip="tooltip"
        :always-as-array="alwaysAsArray"
        :has-search="hasSearch"
        :nullable="nullable"
        :readOnly="readOnly"
        :readOnlyRenderType="readOnlyRenderType"
        :search-attributes="searchAttributes"
        :labelId="labelledBy"
      >
        <template v-slot:customItem="slotData" v-if="$slots.customItem">
          <slot name="customItem" v-bind="slotData" />
        </template>
      </LxValuePickerRotator>

      <LxValuePickerIndicator
        v-if="variant === 'indicator'"
        :id="id"
        v-model="model"
        :items="stringifiedItems"
        :idAttribute="idAttribute"
        :nameAttribute="nameAttribute"
        :iconAttribute="iconAttribute"
        :iconSetAttribute="iconSetAttribute"
        :categoryAttribute="categoryAttribute"
        :descriptionAttribute="descriptionAttribute"
        :groupId="groupId"
        :variant="variant"
        :selectionKind="selectionKind"
        :disabled="disabled"
        :invalid="invalid"
        :invalidation-message="invalidationMessage"
        :texts="displayTexts"
        :placeholder="placeholder"
        :tooltip="tooltip"
        :always-as-array="alwaysAsArray"
        :has-search="hasSearch"
        :nullable="nullable"
        :readOnly="readOnly"
        :readOnlyRenderType="readOnlyRenderType"
        :search-attributes="searchAttributes"
        :hasSelectAll="hasSelectAll"
        :labelId="labelledBy"
      >
        <template v-slot:customItem="slotData" v-if="$slots.customItem">
          <slot name="customItem" v-bind="slotData" />
        </template>
      </LxValuePickerIndicator>

      <LxValuePickerHorizontal
        v-if="variant === 'horizontal' || variant === 'horizontal-custom'"
        :id="id"
        v-model="model"
        :items="stringifiedItems"
        :idAttribute="idAttribute"
        :nameAttribute="nameAttribute"
        :descriptionAttribute="descriptionAttribute"
        :groupId="groupId"
        :selectionKind="selectionKind"
        :disabled="disabled"
        :invalid="invalid"
        :invalidation-message="invalidationMessage"
        :texts="displayTexts"
        :placeholder="placeholder"
        :tooltip="tooltip"
        :has-search="hasSearch"
        :always-as-array="alwaysAsArray"
        :nullable="nullable"
        :readOnly="readOnly"
        :readOnlyRenderType="readOnlyRenderType"
        :variant="variant"
        :search-attributes="searchAttributes"
        :hasSelectAll="hasSelectAll"
      >
        <template v-slot:customItem="slotData" v-if="$slots.customItem">
          <slot name="customItem" v-bind="slotData" />
        </template>
      </LxValuePickerHorizontal>
    </div>
  </div>
</template>
