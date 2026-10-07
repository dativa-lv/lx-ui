<script setup>
import { ref, computed, nextTick, watch, inject } from 'vue';
import { onClickOutside, useDebounceFn, useWindowSize } from '@vueuse/core';
import { generateUUID, textSearch } from '@/utils/stringUtils';
import { clampText, getDisplayTexts, isDefined, isNil } from '@/utils/generalUtils';
import { logError } from '@/utils/devUtils';
import useLx from '@/hooks/useLx';
import LxPopper from '@/components/Popper.vue';
import LxButton from '@/components/Button.vue';
import LxIcon from '@/components/Icon.vue';
import LxLoader from '@/components/Loader.vue';
import LxSearchableText from '@/components/SearchableText.vue';
import LxCheckbox from '@/components/Checkbox.vue';
import LxInfoWrapper from '@/components/InfoWrapper.vue';
import LxModal from '@/components/Modal.vue';
import LxList from '@/components/list/List.vue';
import LxContentSwitcher from '@/components/ContentSwitcher.vue';
import LxEmptyValue from '@/components/EmptyValue.vue';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  modelValue: { type: [String, Number, Boolean, Object, Array], default: null },
  items: { type: Array, default: () => [] },
  idAttribute: { type: String, default: 'id' },
  nameAttribute: { type: String, default: 'name' },
  iconAttribute: { type: String, default: 'icon' },
  groupId: { type: String, default: null },
  queryMinLength: { type: Number, default: 0 },
  queryMaxLength: { type: Number, default: null },
  queryDebounce: { type: [String, Number], default: 200 },
  placeholder: { type: String, default: null },
  tooltip: { type: String, default: null },
  tooltipAttribute: { type: String, default: null },
  readOnly: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: null },
  invalid: { type: Boolean, default: false },
  invalidationMessage: { type: String, default: null },
  helperText: { type: String, default: null },
  helperTextKind: { type: String, default: 'label' }, // 'label' || 'icon'
  loading: { type: Boolean, default: false },
  hasDetails: { type: Boolean, default: false },
  selectionKind: { type: String, default: 'single' }, // 'single' || 'multiple'
  detailMode: { type: String, default: 'simple' }, // 'simple' || 'detailed'
  // Declared as a prop only to know whether @search is listened to; emit('search') still calls it
  onSearch: { type: Function, default: null },
  labelId: { type: String, default: null },
  hasSelectAll: { type: Boolean, default: false },
  texts: { type: Object, default: () => ({}) },
  searchAttributes: { type: Array, default: null },
  searchString: { type: String, default: null },
  enableAdditionalText: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'openDetails', 'update:searchString', 'search']);

const SELECT_ALL_KEY = '__lx-select-all__';

const textsDefault = {
  emptyValue: 'Nav norādīts',
  clear: 'Notīrīt izvēli',
  empty: 'Nav atrasti rezultāti, kas saturētu tekstu',
  tryEndingWith1: 'Lai sāktu meklēšanu, ievadiet vismaz {0} simbolu',
  try: 'Lai sāktu meklēšanu, ievadiet vismaz {0} simbolus',
  tooltipDisplayTextSingle: 'cits',
  tooltipDisplayTextMulti: 'citi',
  detailsSwitchAdvancedSearch: 'Izvērstā meklēšana',
  detailsSwitchSelectedItems: 'Izvēlētās vērtības',
  detailsButton: 'Skatīt detaļas',
  detailsModalLabel: 'Izvērstais skats',
  clearChosen: 'Notīrīt visas izvēlētās vērtības',
  selectAll: 'Izvēlēties visu',
  loadingState: 'Notiek ielāde',
  additionalText: 'Mēģiniet meklēt, izmantojot citu vārdu vai frāzi',
  helperTextLabel: 'Papildinformācija',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault, 'LxAutoComplete'));
const invalidationMessageClamped = computed(() => clampText(props.invalidationMessage));
const showInvalidationMessage = computed(() => props.invalid && props.invalidationMessage);

const hasHelperText = computed(() => isDefined(props.helperText) && props.helperText !== '');
const helperTextClamped = computed(() => clampText(props.helperText));
const showInlineHelper = computed(
  () => hasHelperText.value && props.helperTextKind === 'label' && !props.invalid
);
const showInfoHelper = computed(
  () => hasHelperText.value && props.helperTextKind === 'icon' && !props.invalid
);
const describedBy = computed(() => {
  const ids = [];
  if (showInlineHelper.value || showInfoHelper.value) ids.push(`${props.id}-helper`);
  if (showInvalidationMessage.value) ids.push(`${props.id}-invalidation-message`);
  return ids.length ? ids.join(' ') : null;
});

const globalEnvironment = useLx().getGlobals()?.environment;
const isTouchSensitive = inject('isTouchMode', ref(false));
const windowSize = useWindowSize();
const responsiveView = computed(() => windowSize.width.value <= 500);

const isMultiple = computed(() => props.selectionKind === 'multiple');
// With @search the parent searches and items are its results; without it, items are filtered here
const isServerSide = computed(() => !!props.onSearch);

// Entry: { key: stringified id, raw: value as given, data: object used for display }
function isObjectValue(value) {
  return value !== null && typeof value === 'object';
}

function toEntry(value) {
  if (isNil(value)) return null;
  if (isObjectValue(value)) {
    const id = value[props.idAttribute];
    if (isNil(id)) {
      logError(
        `LxAutoComplete [${props.id}]: "idAttribute" (${
          props.idAttribute
        }) is not defined for item ${JSON.stringify(value)}`,
        globalEnvironment
      );
      return null;
    }
    return { key: String(id), raw: value, data: value };
  }
  // Primitives are shown as { id: value, name: value } and returned as they were given
  return {
    key: String(value),
    raw: value,
    data: { [props.idAttribute]: value, [props.nameAttribute]: String(value) },
  };
}

const itemEntries = computed(() =>
  Array.isArray(props.items) ? props.items.map(toEntry).filter(Boolean) : []
);
const itemEntryMap = computed(() => new Map(itemEntries.value.map((entry) => [entry.key, entry])));

const modelEntries = computed(() => {
  let values;
  if (Array.isArray(props.modelValue)) {
    values = isMultiple.value ? props.modelValue : props.modelValue.slice(0, 1);
  } else {
    values = [props.modelValue];
  }
  return values
    .map(toEntry)
    .filter(Boolean)
    .map((entry) => {
      // A primitive model value takes its display data from the matching item, if there is one
      const match = !isObjectValue(entry.raw) && itemEntryMap.value.get(entry.key);
      return match ? { ...entry, data: match.data } : entry;
    });
});

const selectedKeys = computed(() => new Set(modelEntries.value.map((entry) => entry.key)));
const selectedEntry = computed(() => (isMultiple.value ? null : modelEntries.value[0] || null));
const hasValue = computed(() => modelEntries.value.length > 0);

function commitEntries(entries) {
  const value = isMultiple.value ? entries.map((entry) => entry.raw) : entries[0]?.raw ?? null;
  emit('update:modelValue', value);
}

function getName(entry) {
  const name = entry?.data?.[props.nameAttribute];
  return isNil(name) ? entry?.key : name;
}

function getIcon(entry) {
  return props.iconAttribute ? entry?.data?.[props.iconAttribute] || null : null;
}

function getItemTooltip(entry) {
  if (!entry) return '';
  const tooltipValue = props.tooltipAttribute && entry.data?.[props.tooltipAttribute];
  return tooltipValue || getName(entry) || '';
}

const selectedNames = computed(() => modelEntries.value.map(getName).join(', '));

const customTooltip = computed(() => {
  if (isMultiple.value) return '';
  return selectedEntry.value ? getItemTooltip(selectedEntry.value) : props.tooltip;
});

const menuOpen = ref(false);
const refRoot = ref();
const refContainer = ref();
const refQuery = ref();
const refListbox = ref();
const infoWrapperRef = ref();
const detailedModeModal = ref();
const listRef = ref();
const detailsSwitchType = ref('advanced-search');
const panelWidth = ref();
const highlightedKey = ref(null);
const tapStage = ref(0);

const query = ref(props.searchString);
const finalQuery = computed(() => query.value?.trim() || '');
const isQueryTooShort = computed(
  () => props.queryMinLength > 0 && finalQuery.value.length < props.queryMinLength
);

function matchesQuery(entry) {
  if (Array.isArray(props.searchAttributes) && props.searchAttributes.length > 0) {
    return props.searchAttributes.some((attr) => textSearch(query.value, entry.data?.[attr]));
  }
  return textSearch(query.value, getName(entry));
}

const filteredEntries = computed(() => {
  if (isServerSide.value) {
    // Items are already the results for the query, but stale ones are hidden while it is too short
    return isQueryTooShort.value && finalQuery.value ? [] : itemEntries.value;
  }
  // Like legacy, queryMinLength does not hide local items
  if (!query.value) return itemEntries.value;
  return itemEntries.value.filter(matchesQuery);
});

const showSelectAll = computed(
  () =>
    props.hasSelectAll &&
    isMultiple.value &&
    !isServerSide.value &&
    !query.value &&
    filteredEntries.value.length > 0
);

const navigableKeys = computed(() => [
  ...(showSelectAll.value ? [SELECT_ALL_KEY] : []),
  ...filteredEntries.value.map((entry) => entry.key),
]);

const queryDebounceValue = computed(() => Number(props.queryDebounce) || 0);

let lastSearchedQuery = '';
function emitSearchNow(value) {
  if (value === lastSearchedQuery) return;
  lastSearchedQuery = value;
  emit('search', value);
}
const emitSearch = useDebounceFn(emitSearchNow, queryDebounceValue);

watch(query, (newValue, oldValue) => {
  if (newValue !== oldValue) emit('update:searchString', newValue || '');
});

watch(
  finalQuery,
  (value) => {
    if (!isServerSide.value) return;
    if (value && isQueryTooShort.value) return;
    emitSearch(value);
  },
  { immediate: true }
);

watch(
  () => props.searchString,
  (value) => {
    if (value !== query.value) query.value = value || null;
  }
);

function getItemId(key) {
  return `${props.id}-item-${key}`;
}

function getLabelId(key) {
  return `${key}-${props.id}-label`;
}

function isEntrySelected(entry) {
  return selectedKeys.value.has(entry.key);
}

function focusInput() {
  if (isTouchSensitive.value) return;
  nextTick(() => refQuery.value?.focus());
}

function initSearchInput(shouldClear = true, shouldFocus = true) {
  if (shouldClear) query.value = null;
  if (shouldFocus) refQuery.value?.focus();
}

function openMenu(shouldClear = true, shouldFocus = true) {
  if (props.disabled || menuOpen.value) return;
  panelWidth.value = refContainer.value?.offsetWidth;
  menuOpen.value = true;
  nextTick(() => initSearchInput(shouldClear, shouldFocus));
}

function resetMenuState() {
  menuOpen.value = false;
  highlightedKey.value = null;
  tapStage.value = 0;
  query.value = null;
}

function closeMenu() {
  resetMenuState();
  focusInput();
}

function closeOnClickOutside() {
  if (infoWrapperRef.value?.showPopper) infoWrapperRef.value.handleClose();
  resetMenuState();
}

onClickOutside(refRoot, closeOnClickOutside, { ignore: ['#poppers'] });

function closeOnEsc() {
  menuOpen.value = false;
  query.value = null;
  focusInput();
}

function toggleMenu(e) {
  const isInput = e.target?.id === props.id;
  const waitsForQuery =
    props.queryMinLength > 0 && isServerSide.value && itemEntries.value.length === 0;

  if (!isTouchSensitive.value || waitsForQuery) {
    if (menuOpen.value && isInput) closeMenu();
    else openMenu();
    return;
  }

  // On touch devices the first tap only opens the list, the second one opens the keyboard
  if (!menuOpen.value) {
    tapStage.value = 1;
    openMenu(true, false);
  } else if (isInput && tapStage.value === 1) {
    tapStage.value = 2;
    nextTick(() => initSearchInput());
  } else if (isInput && tapStage.value === 2) {
    closeMenu();
  }
}

function handleFocusOut(e) {
  if (!refListbox.value?.contains(e.relatedTarget)) menuOpen.value = false;
}

function clear() {
  commitEntries([]);
  if (!menuOpen.value) openMenu();
}

function selectSingle(entry) {
  commitEntries([entry]);
  closeMenu();
}

function toggleMultiple(entry) {
  if (isEntrySelected(entry)) {
    commitEntries(modelEntries.value.filter((selected) => selected.key !== entry.key));
  } else {
    commitEntries([...modelEntries.value, entry]);
  }
}

function selectEntry(entry) {
  if (isMultiple.value) toggleMultiple(entry);
  else selectSingle(entry);
}

const areSomeSelected = computed(() => itemEntries.value.some(isEntrySelected));
const areAllSelected = computed(
  () => itemEntries.value.length > 0 && itemEntries.value.every(isEntrySelected)
);

function toggleSelectAll() {
  if (areSomeSelected.value) {
    commitEntries([]);
    return;
  }
  commitEntries([...modelEntries.value, ...itemEntries.value.filter((e) => !isEntrySelected(e))]);
}

function moveHighlight(step) {
  if (!menuOpen.value) {
    openMenu();
    return;
  }
  const keys = navigableKeys.value;
  if (!keys.length) return;
  const index = keys.indexOf(highlightedKey.value || selectedEntry.value?.key);
  if (index === -1) {
    highlightedKey.value = step > 0 ? keys[0] : keys[keys.length - 1];
  } else {
    highlightedKey.value = keys[(index + step + keys.length) % keys.length];
  }
}

function focusHighlightedItem() {
  nextTick(() => {
    refListbox.value?.querySelector('.lx-value-picker-item.lx-highlighted-item')?.focus();
  });
}

function focusNextItem(e) {
  if (e.shiftKey) return;
  moveHighlight(1);
  focusHighlightedItem();
}

function focusPreviousItem(e) {
  if (e.shiftKey) return;
  moveHighlight(-1);
  focusHighlightedItem();
}

watch(highlightedKey, (key) => {
  if (!key) return;
  nextTick(() => {
    const el = document.getElementById(getItemId(key));
    const container = el?.closest('.lx-dropdown-default-content');
    if (!container) return;
    const elRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    if (elRect.top < containerRect.top || elRect.bottom > containerRect.bottom) {
      el.scrollIntoView({ block: 'center' });
    }
  });
});

function handleEnterSelection() {
  if (props.loading) return;
  let key = highlightedKey.value;
  if (!key && filteredEntries.value.length > 0 && finalQuery.value) {
    key = filteredEntries.value[0].key;
  }
  if (!key) return;

  if (key === SELECT_ALL_KEY) {
    toggleSelectAll();
    return;
  }
  const entry = filteredEntries.value.find((e) => e.key === key);
  if (entry) selectEntry(entry);
}

function onEnter() {
  if (document.activeElement?.id === `${props.id}-clearButton`) {
    clear();
    closeMenu();
    openMenu();
    return;
  }
  if (!menuOpen.value) {
    openMenu();
    return;
  }
  if (props.loading) return;
  handleEnterSelection();
  if (!highlightedKey.value && !isMultiple.value) {
    closeMenu();
  }
}

function handleShiftArrow(inputElement, direction) {
  if (!inputElement?.setSelectionRange) return;
  const textLength = inputElement.value.length;
  if (direction === 'down') inputElement.setSelectionRange(textLength, textLength);
  else inputElement.setSelectionRange(0, textLength);
}

function handleKeydown(e) {
  const inputElement = document.activeElement;

  if (e.key === 'Tab' && menuOpen.value) {
    resetMenuState();
    return;
  }

  if (e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
    handleShiftArrow(inputElement, e.key === 'ArrowDown' ? 'down' : 'up');
    return;
  }

  const isPrintableChar = e.key.length === 1 && /\S/.test(e.key);
  if (
    inputElement?.id === props.id &&
    (isPrintableChar || ['Backspace', 'Delete'].includes(e.key))
  ) {
    if (!menuOpen.value) openMenu();
    if (hasValue.value && !isMultiple.value) clear();
    highlightedKey.value = null;
  }
}

function returnToInput() {
  highlightedKey.value = null;
  focusInput();
}

function openDetails() {
  if (props.loading || props.disabled || props.readOnly || !props.hasDetails) return;
  if (props.detailMode === 'simple') emit('openDetails', props.id);
  else if (props.detailMode === 'detailed') detailedModeModal.value?.open();
}

const icon = computed(() => {
  if (!isServerSide.value) return 'chevron-down';
  return props.hasDetails ? 'search-details' : 'search';
});

const shouldShowPlaceholder = computed(() => !hasValue.value && !query.value && !menuOpen.value);
const shouldShowValue = computed(() => hasValue.value && !menuOpen.value && !query.value);
const shouldShowInputPlaceholder = computed(() => !query.value && menuOpen.value);
// The clear button takes the search icon's place once a value is selected
const shouldShowIcon = computed(
  () => !props.hasDetails && !props.loading && (isMultiple.value || !hasValue.value)
);
const shouldShowDetailsBtn = computed(
  () => props.hasDetails && !props.loading && (isMultiple.value || !hasValue.value)
);
const shouldShowClearBtn = computed(() => !isMultiple.value && hasValue.value && !props.loading);

const inputPlaceholder = computed(() => {
  if (!shouldShowInputPlaceholder.value) return null;
  return hasValue.value ? selectedNames.value : props.placeholder;
});

const displayTooltipItems = computed(() => {
  const entries = modelEntries.value;
  if (!entries.length) return [];

  const displayed = entries.slice(0, 10).map((entry) => ({ key: entry.key, name: getName(entry) }));
  const remainingCount = entries.length - 10;
  if (remainingCount > 0) {
    const text =
      remainingCount === 1
        ? displayTexts.value.tooltipDisplayTextSingle
        : displayTexts.value.tooltipDisplayTextMulti;
    displayed.push({ key: generateUUID(), name: `+ ${remainingCount} ${text || ''}`.trim() });
  }
  return displayed;
});

const selectedItemsData = computed(() => modelEntries.value.map((entry) => entry.data));

const detailsSwitchTypes = computed(() => [
  {
    id: 'advanced-search',
    name: displayTexts.value.detailsSwitchAdvancedSearch || '',
    icon: 'search',
  },
  {
    id: 'selected-items',
    name: `${displayTexts.value.detailsSwitchSelectedItems || ''} (${modelEntries.value.length})`,
    icon: 'list-bulleted',
  },
]);

watch([selectedItemsData, listRef], () => {
  nextTick(() => listRef.value?.selectRows(selectedItemsData.value));
});

let selectionTimeout = null;
function handleListSelectionChange(selectedIds) {
  clearTimeout(selectionTimeout);
  selectionTimeout = setTimeout(() => {
    if (!selectedIds) return;
    const ids = selectedIds.map(String);
    const kept = modelEntries.value.filter((entry) => ids.includes(entry.key));
    if (kept.length !== modelEntries.value.length) commitEntries(kept);
  }, 150);
}

watch(
  () => props.selectionKind,
  (kind) => emit('update:modelValue', kind === 'multiple' ? [] : null)
);

const rowId = inject('rowId', ref(null));
const labelledBy = computed(() => props.labelId || rowId.value);
const rowRequired = inject('rowRequired', ref(null));
const ariaRequired = computed(() => {
  const value = isNil(props.required) ? rowRequired.value : props.required;
  return value ? true : null;
});

const minLengthText = computed(() => {
  const min = props.queryMinLength;
  const text =
    min % 10 === 1 && min !== 11 ? displayTexts.value.tryEndingWith1 : displayTexts.value.try;
  return text?.replace('{0}', min);
});

const showEmptyMessage = computed(
  () =>
    !!finalQuery.value &&
    !(isServerSide.value && isQueryTooShort.value) &&
    !filteredEntries.value.length &&
    !props.loading &&
    !props.enableAdditionalText
);

const showMinLengthMessage = computed(
  () =>
    isServerSide.value &&
    isQueryTooShort.value &&
    !filteredEntries.value.length &&
    !props.enableAdditionalText
);

const autoCompleteState = computed(() => {
  if (props.loading) return 'searching';
  if (hasValue.value) return 'selected';
  if (isServerSide.value && isQueryTooShort.value) return 'start';
  if (finalQuery.value && !filteredEntries.value.length) return 'empty';
  return 'default';
});

const autoCompleteQuery = computed(() => {
  if (props.queryMinLength === 0) return query.value;
  return isQueryTooShort.value ? '' : finalQuery.value;
});

const dataState = computed(() => JSON.stringify({ readOnly: props.readOnly, mode: 'new' }));

function countDigits(number) {
  return number.toString().length;
}

defineExpose({ autoCompleteState, autoCompleteQuery });
</script>

<template>
  <div
    class="lx-field-wrapper"
    ref="refRoot"
    :data-id="id"
    data-component="lx-auto-complete"
    :data-state="dataState"
  >
    <div v-if="readOnly" class="lx-data" :aria-labelledby="labelledBy">
      <LxEmptyValue v-if="!hasValue" :texts="{ emptyValue: displayTexts.emptyValue }" />
      <template v-else-if="$slots.customItem">
        <div class="lx-autocomplete-read-only-items">
          <template v-for="entry in modelEntries" :key="entry.key">
            <slot
              name="customItem"
              :item="entry.data"
              context="value"
              :selected="true"
              :search-string="null"
            />
          </template>
        </div>
      </template>
      <p v-else class="lx-input-text">{{ selectedNames }}</p>
    </div>

    <template v-else>
      <div
        class="lx-autocomplete-default"
        ref="refContainer"
        :class="[
          { 'lx-opened': menuOpen },
          { 'lx-invalid': invalid },
          { 'lx-disabled': disabled },
          { 'lx-navigating': !!highlightedKey },
        ]"
        :data-invalid="invalid ? '' : null"
        :data-disabled="disabled ? '' : null"
      >
        <LxPopper
          :id="`${id}-popper`"
          offset-distance="0"
          :disabled="disabled"
          :show="menuOpen"
          @referenceHidden="closeMenu"
        >
          <div class="lx-autocomplete-input-icon-container">
            <div
              class="lx-autocomplete"
              v-tooltip="customTooltip"
              tabindex="-1"
              @keydown.esc.prevent="closeOnEsc"
              @keydown.enter.prevent="onEnter"
              @keydown.down.prevent="focusNextItem"
              @keydown.up.prevent="focusPreviousItem"
              @keydown.f3.prevent="openDetails"
              @keydown="handleKeydown"
              @click="toggleMenu"
            >
              <div
                class="lx-autocomplete-default-panel"
                :class="[{ multiselect: isMultiple }]"
                v-tooltip="isMultiple ? tooltip : customTooltip"
              >
                <div
                  class="lx-autocomplete-default-data"
                  :class="[{ emptyModel: !hasValue || !isMultiple }]"
                >
                  <div
                    class="lx-text-input-wrapper lx-input-wrapper"
                    role="search"
                    :class="[{ 'lx-disabled': disabled }, { 'lx-invalid': invalid }]"
                    :data-invalid="invalid ? '' : null"
                  >
                    <div
                      v-if="isMultiple && hasValue"
                      class="lx-tag"
                      :class="[`chars-${countDigits(modelEntries.length)}`]"
                    >
                      <div class="lx-tag-label">{{ modelEntries.length }}</div>
                      <div class="lx-tag-button">
                        <LxInfoWrapper
                          ref="infoWrapperRef"
                          :disabled="disabled || menuOpen || responsiveView"
                          :focusable="false"
                        >
                          <LxButton
                            :id="`${id}-clearButton`"
                            :label="displayTexts.clear"
                            :disabled="disabled"
                            kind="secondary"
                            variant="icon-only"
                            icon="remove"
                            @click.stop="clear"
                          />
                          <template #panel>
                            <ul class="lx-list" v-if="displayTooltipItems.length > 0">
                              <li v-for="item in displayTooltipItems" :key="item.key">
                                <div class="lx-row">
                                  <p class="lx-data">{{ item.name }}</p>
                                </div>
                              </li>
                            </ul>
                          </template>
                        </LxInfoWrapper>
                      </div>
                    </div>

                    <input
                      ref="refQuery"
                      :placeholder="inputPlaceholder"
                      :id="id"
                      v-model="query"
                      class="lx-text-input lx-value-picker-placeholder lx-input-area"
                      role="combobox"
                      aria-autocomplete="list"
                      :aria-expanded="menuOpen"
                      :aria-controls="`${id}-listbox`"
                      aria-haspopup="listbox"
                      :aria-activedescendant="
                        menuOpen && highlightedKey ? getItemId(highlightedKey) : undefined
                      "
                      :aria-labelledby="labelledBy"
                      :aria-label="selectedNames || undefined"
                      :aria-required="ariaRequired"
                      :aria-invalid="invalid"
                      :aria-errormessage="
                        showInvalidationMessage ? `${id}-invalidation-message` : null
                      "
                      :aria-describedby="describedBy"
                      :aria-busy="loading"
                      :maxlength="queryMaxLength || null"
                      :tabindex="disabled ? '-1' : '0'"
                      :disabled="disabled"
                      @focusout="handleFocusOut"
                    />

                    <div class="lx-invisible" aria-live="polite" v-if="loading">
                      {{ displayTexts.loadingState }}
                    </div>

                    <div
                      v-if="shouldShowValue"
                      class="lx-value lx-input-area"
                      v-tooltip="customTooltip"
                    >
                      <div>
                        <slot
                          v-if="$slots.customItem && selectedEntry"
                          name="customItem"
                          :item="selectedEntry.data"
                          context="value"
                          :selected="true"
                          :search-string="null"
                        />
                        <span
                          v-else-if="selectedEntry && getIcon(selectedEntry)"
                          class="lx-autocomplete-item-content"
                        >
                          <LxIcon :value="getIcon(selectedEntry)" />
                          <span>{{ selectedNames }}</span>
                        </span>
                        <template v-else>{{ selectedNames }}</template>
                      </div>
                    </div>

                    <div v-if="shouldShowPlaceholder" class="lx-placeholder lx-input-area">
                      <div>{{ placeholder }}</div>
                    </div>

                    <div v-if="invalid && !loading" class="lx-invalidation-icon-wrapper">
                      <LxIcon customClass="lx-invalidation-icon" value="invalid" />
                    </div>

                    <div
                      v-if="showInfoHelper && !loading"
                      class="lx-input-helper-wrapper"
                      @click.stop
                      @mousedown.stop
                      @keydown.space.stop
                      @keydown.enter.stop
                      @keydown.up.stop
                      @keydown.down.stop
                    >
                      <LxInfoWrapper
                        placement="top"
                        :disabled="disabled"
                        :label="displayTexts.helperTextLabel"
                      >
                        <LxIcon customClass="lx-helper-icon" value="info" />
                        <template #panel>
                          <p class="lx-data">{{ helperTextClamped }}</p>
                        </template>
                      </LxInfoWrapper>
                    </div>

                    <div v-if="shouldShowIcon" class="lx-input-icon-wrapper">
                      <LxIcon customClass="lx-modifier-icon" :value="icon" />
                    </div>

                    <LxButton
                      v-if="shouldShowClearBtn"
                      :id="`${id}-clearButton`"
                      :disabled="disabled"
                      icon="close"
                      kind="ghost"
                      variant="icon-only"
                      :label="displayTexts.clear"
                      @click="clear"
                    />

                    <LxButton
                      v-if="shouldShowDetailsBtn"
                      :id="`${id}-detailsButton`"
                      :disabled="disabled"
                      icon="search-details"
                      kind="ghost"
                      variant="icon-only"
                      :label="displayTexts.detailsButton"
                      @keydown.space.stop.prevent="openDetails"
                      @keydown.f3.stop.prevent="openDetails"
                      @click.stop.prevent="openDetails"
                    />

                    <div
                      class="lx-autocomplete-loader"
                      v-if="loading"
                      v-tooltip="displayTexts.loadingState"
                    >
                      <LxLoader loading size="s" />
                    </div>
                  </div>

                  <div
                    v-if="showInvalidationMessage"
                    class="lx-invalidation-message"
                    :id="`${id}-invalidation-message`"
                    @click.stop
                  >
                    {{ invalidationMessageClamped }}
                  </div>
                  <div
                    class="lx-helper-text"
                    v-if="showInlineHelper"
                    :id="`${id}-helper`"
                    @click.stop
                  >
                    {{ helperTextClamped }}
                  </div>
                  <div
                    class="lx-invisible"
                    v-else-if="showInfoHelper"
                    :id="`${id}-helper`"
                    @click.stop
                  >
                    {{ helperTextClamped }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <template #content>
            <div
              ref="refListbox"
              tabindex="-1"
              :aria-labelledby="labelledBy"
              class="lx-dropdown-default-content"
              :style="{ width: `${panelWidth}px` }"
              @keydown.esc.prevent="closeOnEsc"
              @keydown.enter.prevent="handleEnterSelection"
              @keydown.space.prevent="handleEnterSelection"
              @keydown.up.prevent="focusPreviousItem"
              @keydown.down.prevent="focusNextItem"
              @keydown.f3.prevent="openDetails"
              @keydown.backspace="returnToInput"
              @keydown="handleKeydown"
            >
              <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
              <slot name="panel" @click="closeMenu()">
                <transition name="appear-down">
                  <div
                    v-show="menuOpen && !loading"
                    class="lx-dropdown-panel lx-region-component"
                    :id="`${id}-listbox`"
                    role="listbox"
                    :aria-multiselectable="isMultiple || null"
                  >
                    <div
                      v-if="enableAdditionalText"
                      class="lx-empty additional-text lx-aligned-row"
                    >
                      <LxIcon value="info" />
                      <div class="lx-invisible" aria-hidden="true"></div>
                      <p>{{ displayTexts.additionalText }}</p>
                    </div>

                    <div v-if="showSelectAll" class="select-all-wrapper">
                      <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
                      <div
                        :id="getItemId(SELECT_ALL_KEY)"
                        class="lx-value-picker-item select-all lx-popover-item-selecting"
                        :class="{ 'lx-highlighted-item': highlightedKey === SELECT_ALL_KEY }"
                        tabindex="-1"
                        role="option"
                        :aria-selected="areAllSelected"
                        v-tooltip="
                          areSomeSelected ? displayTexts.clearChosen : displayTexts.selectAll
                        "
                        @keydown.enter.prevent="toggleSelectAll"
                        @click="toggleSelectAll"
                        @focus="highlightedKey = SELECT_ALL_KEY"
                      >
                        <LxIcon
                          :value="
                            areSomeSelected
                              ? areAllSelected
                                ? 'checkbox-filled'
                                : 'checkbox-indeterminate'
                              : 'checkbox'
                          "
                        />
                        <span>
                          {{ areSomeSelected ? displayTexts.clearChosen : displayTexts.selectAll }}
                        </span>
                      </div>
                    </div>

                    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
                    <div
                      v-for="entry in filteredEntries"
                      :key="entry.key"
                      tabindex="-1"
                      role="option"
                      :aria-selected="isEntrySelected(entry)"
                      class="lx-value-picker-item lx-popover-item-text-only lx-embedded-selecting-block"
                      :class="{
                        'lx-selected': isEntrySelected(entry),
                        'lx-highlighted-item': highlightedKey === entry.key,
                        'autocomplete-multiple lx-popover-item-selecting': isMultiple,
                        'autocomplete-default-item': !$slots.customItem,
                      }"
                      :id="getItemId(entry.key)"
                      v-tooltip="getItemTooltip(entry)"
                      @click.prevent="selectEntry(entry)"
                      @focus="highlightedKey = entry.key"
                    >
                      <LxCheckbox
                        v-if="isMultiple"
                        aria-hidden="true"
                        :id="`${getItemId(entry.key)}-checkbox`"
                        :group-id="groupId"
                        :modelValue="isEntrySelected(entry)"
                        :disabled="disabled"
                        :value="entry.key"
                        tabindex="-1"
                        :builderOptions="{ innerComponent: true }"
                        @click.stop.prevent="toggleMultiple(entry)"
                      >
                        <slot
                          v-if="$slots.customItem"
                          name="customItem"
                          :item="entry.data"
                          context="item"
                          :selected="isEntrySelected(entry)"
                          :search-string="query"
                        />
                        <span v-else class="lx-autocomplete-item-content">
                          <LxIcon v-if="getIcon(entry)" :value="getIcon(entry)" />
                          <LxSearchableText :value="getName(entry)" :search-string="query" />
                        </span>
                      </LxCheckbox>

                      <div
                        :class="{
                          'lx-invisible': isMultiple,
                          'lx-autocomplete-custom-item': !isMultiple && $slots.customItem,
                        }"
                        :id="getLabelId(entry.key)"
                      >
                        <template v-if="isMultiple">{{ getName(entry) }}</template>
                        <slot
                          v-else-if="$slots.customItem"
                          name="customItem"
                          :item="entry.data"
                          context="item"
                          :selected="isEntrySelected(entry)"
                          :search-string="query"
                        />
                        <span v-else-if="getIcon(entry)" class="lx-autocomplete-item-content">
                          <LxIcon :value="getIcon(entry)" />
                          <span>{{ getName(entry) }}</span>
                        </span>
                        <template v-else>{{ getName(entry) }}</template>
                      </div>

                      <LxIcon
                        v-if="isEntrySelected(entry) && !isMultiple"
                        customClass="lx-popover-item-checkmark"
                        value="tick"
                      />
                    </div>

                    <div v-if="showEmptyMessage" class="lx-empty lx-aligned-row">
                      <LxIcon value="info" />
                      <div class="lx-invisible" aria-hidden="true"></div>
                      <p>
                        {{ displayTexts.empty }} "<span class="lx-highlighted-item">{{
                          query.toLowerCase()
                        }}</span
                        >"
                      </p>
                    </div>

                    <div v-if="showMinLengthMessage" class="lx-empty lx-aligned-row">
                      <LxIcon value="info" />
                      <div class="lx-invisible" aria-hidden="true"></div>
                      <p>{{ minLengthText }}</p>
                    </div>
                  </div>
                </transition>
              </slot>
            </div>
          </template>
        </LxPopper>
      </div>

      <LxModal
        ref="detailedModeModal"
        :id="`${id}-details-modal`"
        :label="displayTexts.detailsModalLabel"
        size="m"
      >
        <LxContentSwitcher
          v-if="$slots.details && isMultiple"
          :id="`${id}-details-switcher`"
          :items="detailsSwitchTypes"
          v-model="detailsSwitchType"
          kind="combo"
          :builderOptions="{ innerComponent: true }"
        />

        <slot
          v-if="
            $slots.details && detailMode === 'detailed' && detailsSwitchType === 'advanced-search'
          "
          name="details"
        />

        <LxList
          v-if="
            (!$slots.details && isMultiple) ||
            ($slots.details && detailsSwitchType === 'selected-items')
          "
          ref="listRef"
          :id="`${id}-details-list`"
          :items="selectedItemsData"
          :idAttribute="idAttribute"
          :nameAttribute="nameAttribute"
          :hasSelecting="selectedItemsData.length > 0"
          :has-search="selectedItemsData.length > 0"
          selectionKind="multiple"
          list-type="1"
          @selectionChange="handleListSelectionChange"
        />
      </LxModal>
    </template>
  </div>
</template>
