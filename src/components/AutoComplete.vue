<script setup>
import { ref, computed } from 'vue';
import { generateUUID } from '@/utils/stringUtils';
import LxAutoCompleteLegacy from '@/components/autoComplete/AutoCompleteLegacy.vue';
import LxAutoCompleteNew from '@/components/autoComplete/AutoCompleteNew.vue';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  mode: {
    type: String,
    default: 'legacy',
    options: ['legacy', 'new'],
    group: 'main',
    sequence: 0,
  }, // 'legacy' - v-model holds ids; 'new' - v-model holds the selected objects
  modelValue: { type: [String, Number, Boolean, Object, Array], default: null },
  items: { type: [Array, Function], default: () => [] },
  idAttribute: { type: String, default: 'id' },
  nameAttribute: { type: String, default: 'name' },
  iconAttribute: { type: String, default: 'icon' }, // mode 'new' only
  groupId: { type: String, default: null },
  queryMinLength: { type: Number, default: 0, group: 'main', sequence: 8 },
  queryMaxLength: { type: Number, default: null, group: 'main', sequence: 9 },
  queryDebounce: { type: [String, Number], default: 200, group: 'additional', sequence: 3 },
  placeholder: { type: String, default: null, group: 'main', sequence: 6 },
  tooltip: { type: String, default: null, group: 'main', sequence: 7 },
  tooltipAttribute: { type: String, default: null, group: 'additional', sequence: 4 },
  readOnly: { type: Boolean, default: false, group: 'mode', sequence: 1 },
  disabled: { type: Boolean, default: false, group: 'mode', sequence: 2 },
  required: { type: Boolean, default: null },
  invalid: { type: Boolean, default: false, sequence: 1 },
  invalidationMessage: { type: String, default: null, sequence: 2 },
  helperText: { type: String, default: null, group: 'main', sequence: 10 },
  helperTextKind: {
    type: String,
    default: 'label',
    options: ['label', 'icon'],
    group: 'main',
    sequence: 11,
  },
  loading: { type: Boolean, default: false, group: 'mode', sequence: 3 },
  hasDetails: { type: Boolean, default: false, group: 'main', sequence: 3 },
  selectionKind: {
    type: String,
    default: 'single',
    options: ['single', 'multiple'],
    group: 'main',
    sequence: 1,
  }, // 'single' or 'multiple'
  detailMode: {
    type: String,
    default: 'simple',
    options: ['simple', 'detailed'],
    group: 'main',
    sequence: 4,
  }, // 'simple' or 'detailed'
  // mode 'new' only. The @search listener: with it the parent searches and items are shown as given
  onSearch: { type: Function, default: null },
  preloadedItems: { type: Array, default: null }, // mode 'legacy' only. Used for preloading items if items is a function and there is need to show items before user starts typing
  labelId: { type: String, default: null },
  hasSelectAll: { type: Boolean, default: false, group: 'main', sequence: 2 },
  texts: { type: Object, default: () => ({}), group: 'additional', sequence: 100 },
  searchAttributes: { type: Array, default: null }, // array of attributes for search
  searchString: { type: String, default: null },
  enableAdditionalText: { type: Boolean, default: false, group: 'main', sequence: 5 },
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

const emit = defineEmits(['update:modelValue', 'openDetails', 'update:searchString', 'search']);

// The legacy component is kept as it was, including its builder registration (builderOptions);
// mode 'new' is not registered until legacy is removed
const legacyOnlyProps = ['preloadedItems', 'builderOptions'];
const newOnlyProps = ['iconAttribute'];

const innerProps = computed(() => {
  // onSearch is passed on as a listener below
  const excluded = ['mode', 'onSearch', ...(props.mode === 'new' ? legacyOnlyProps : newOnlyProps)];
  return Object.fromEntries(Object.entries(props).filter(([key]) => !excluded.includes(key)));
});

const innerListeners = computed(() => {
  const listeners = {
    'update:modelValue': (value) => emit('update:modelValue', value),
    'update:searchString': (value) => emit('update:searchString', value),
    openDetails: (id) => emit('openDetails', id),
  };
  // Only when @search is listened to, as that makes the new component search server side
  if (props.mode === 'new' && props.onSearch) listeners.search = (query) => emit('search', query);
  return listeners;
});

const innerRef = ref();

const autoCompleteState = computed(() => innerRef.value?.autoCompleteState);
const autoCompleteQuery = computed(() => innerRef.value?.autoCompleteQuery);

function clearFilteredItems() {
  innerRef.value?.clearFilteredItems?.();
}

defineExpose({ autoCompleteState, autoCompleteQuery, clearFilteredItems });
</script>

<template>
  <component
    :is="mode === 'new' ? LxAutoCompleteNew : LxAutoCompleteLegacy"
    ref="innerRef"
    v-bind="innerProps"
    v-on="innerListeners"
  >
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData || {}" />
    </template>
  </component>
</template>
