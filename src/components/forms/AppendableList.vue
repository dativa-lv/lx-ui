<script setup>
import { computed, onBeforeUnmount, onMounted, ref, inject, nextTick, watch } from 'vue';

import { generateUUID } from '@/utils/stringUtils';
import { getDisplayTexts } from '@/utils/generalUtils';
import { flattenNestedActions, resolveActionGroups } from '@/utils/actionDefinitionsUtils';

import LxButton from '@/components/Button.vue';
import LxForm from '@/components/forms/Form.vue';
import LxDataBlock from '@/components/DataBlock.vue';
import LxToolbar from '@/components/Toolbar.vue';
import useScrollVirtualizer, {
  extractVirtualRangeWithPinned,
  resolveVirtualizerScrollParent,
} from '@/hooks/useScrollVirtualizer';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  modelValue: { type: Array, default: null },
  readOnly: { type: Boolean, default: false },
  expandable: { type: Boolean, default: false },
  idAttribute: { type: String, default: 'id' },
  nameAttribute: { type: String, default: 'name' },
  descriptionAttribute: { type: String, default: null },
  iconAttribute: { type: String, default: null },
  hideRemoveAttribute: { type: String, default: null },
  removeEnableByAttribute: { type: String, default: null },
  removeVisibleByAttribute: { type: String, default: null },
  columnCount: { type: Number, default: 1 },
  kind: { type: String, default: 'default' }, // default, compact
  requiredMode: { type: String, default: 'optional' }, // required, required-asterisk, optional
  canAddItems: { type: Boolean, default: true },
  actionDefinitions: { type: Array, default: () => [] },
  toolbarActionDefinitions: { type: Array, default: () => [] },
  actionGroupDefinitions: { type: Array, default: null },
  toolbarActionGroupDefinitions: { type: Array, default: null },
  uppercase: { type: Boolean, default: true },
  hasSelecting: { type: Boolean, default: false },
  selectionKind: { type: String, default: 'single' }, // single, multiple
  selectableAttribute: { type: String, default: 'selectable' },
  defaultExpanded: { type: Boolean, default: true },
  expandedAttribute: { type: String, default: 'extended' },
  invalidAttribute: { type: String, default: 'invalid' },
  selectedValues: { type: Object, default: null },
  labelId: { type: String, default: null },
  stickyToolbar: { type: Boolean, default: false },
  hasVirtualization: { type: Boolean, default: true },
  texts: { type: Object, default: () => ({}) },
});

const defaultTexts = {
  removeItem: 'Dzēst ierakstu',
  removeItemHint: 'Nospiediet Delete, lai noņemtu ierakstu',
  addItemButtonTooltip: 'Pievienot ierakstu',
  addButtonLabel: 'Pievienot ierakstu',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, defaultTexts, 'LxAppendableList'));

const isSelectable = (item) => item?.[props.selectableAttribute] !== false;
const selectableItems = computed(() => props.modelValue?.filter(isSelectable) ?? []);
const showSelecting = computed(() => props.hasSelecting && selectableItems.value.length > 0);

const emits = defineEmits([
  'update:modelValue',
  'actionClick',
  'toolbarActionClick',
  'update:selectedValues',
]);

// Adds a unique key to each object in the model
function addKey(object) {
  const res = object?.map((obj) => {
    if (!('_lx_appendableKey' in obj)) return { ...obj, _lx_appendableKey: generateUUID() };
    return { ...obj };
  });
  return res;
}

const model = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    const res = addKey(value);
    emits('update:modelValue', res);
  },
});

const VIRTUALIZED_ESTIMATED_ITEM_HEIGHT = 72;
const VIRTUALIZED_OVERSCAN = 6;

const wrapperRef = ref();
const listRef = ref(null);
const listGap = ref(0);
// A hidden list can't be measured, so only virtualize while it's rendered.
const isListRendered = ref(false);

// Items lack `_lx_appendableKey` when bound one-way (LxDataGrid), so fall back to the id.
const itemsWithVirtualKey = computed(() => {
  const seenById = new Map();
  return (model.value || []).map((item, index) => {
    // eslint-disable-next-line no-underscore-dangle
    const baseId = item?._lx_appendableKey ?? item?.[props.idAttribute] ?? index;
    const duplicateCount = (seenById.get(baseId) || 0) + 1;
    seenById.set(baseId, duplicateCount);
    return {
      item,
      index,
      virtualKey: duplicateCount === 1 ? `${baseId}` : `${baseId}__dup_${duplicateCount}`,
    };
  });
});

const wantsVirtualization = computed(
  () => props.hasVirtualization && itemsWithVirtualKey.value.length > 0 && isListRendered.value
);

// Key of the item holding focus; it stays rendered while scrolled out of view, so focus isn't lost.
const focusedItemKey = ref(null);
const pinnedIndex = computed(() => {
  if (focusedItemKey.value === null) return null;
  const index = itemsWithVirtualKey.value.findIndex(
    (entry) => entry.virtualKey === focusedItemKey.value
  );
  return index === -1 ? null : index;
});

// This list's own item around the target, skipping items of lists nested inside it.
function findOwnItem(target) {
  let item = target?.closest?.('.lx-appendable-list-item');
  while (item && item.parentElement !== listRef.value) {
    item = item.parentElement?.closest('.lx-appendable-list-item');
  }
  return item ?? null;
}

function onListFocusIn(event) {
  const index = Number(findOwnItem(event.target)?.dataset.index);
  focusedItemKey.value = Number.isInteger(index)
    ? itemsWithVirtualKey.value[index]?.virtualKey ?? null
    : null;
}

function onListFocusOut() {
  // Checked once focus settles: a window blur or the item's own menu (in #poppers) keeps it.
  setTimeout(() => {
    const active = globalThis.document?.activeElement;
    if (listRef.value?.contains(active) || active?.closest?.('#poppers')) return;
    focusedItemKey.value = null;
  });
}

function resolveScrollParent(el) {
  // Fall back to a scrollable ancestor that isn't height-constrained yet.
  return resolveVirtualizerScrollParent(el, { allowUnconstrainedFallback: true });
}

// Unmeasured items take the first screen's median height, locked so recomputes can't shift content.
let sampledSizes = null;
let sampledItemSize = VIRTUALIZED_ESTIMATED_ITEM_HEIGHT;
let lockedItemSize = null;
function estimateItemSize(instance) {
  const sizes = instance?.itemSizeCache;
  if (!sizes?.size) {
    // Cleared by a re-measure (e.g. a width change), so learn it again.
    lockedItemSize = null;
    return VIRTUALIZED_ESTIMATED_ITEM_HEIGHT;
  }
  if (lockedItemSize !== null) return lockedItemSize;
  // tanstack replaces the map on every measurement, so it doubles as a cache key.
  if (sizes !== sampledSizes) {
    const values = [...sizes.values()].sort((a, b) => a - b);
    const middle = Math.floor(values.length / 2);
    sampledItemSize =
      values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
    sampledSizes = sizes;
    const measuredTotal = values.reduce((total, size) => total + size, 0);
    const viewport = instance.getSize?.() ?? 0;
    if (viewport > 0 && measuredTotal >= viewport) lockedItemSize = sampledItemSize;
  }
  return sampledItemSize;
}

// The wrapper resolves the scroll parent; the list anchors the scroll margin.
const {
  isActive: isVirtualizationActive,
  totalSize: virtualTotalSize,
  virtualItems,
  scrollMargin,
  measure: measureList,
  measureElement: measureListItem,
  scrollToIndex,
  updateScrollContext,
  scheduleLayoutUpdate,
  syncVirtualizationContext,
  clearVirtualizer,
  cleanup: cleanupVirtualization,
} = useScrollVirtualizer({
  enabled: wantsVirtualization,
  scrollParentSourceRef: wrapperRef,
  scrollAnchorRef: listRef,
  positionObserverRef: wrapperRef,
  resolveScrollParent,
  createVirtualizerOptions: ({
    scrollMargin: margin,
    virtualizer,
    shouldAdjustScrollPositionOnItemSizeChange,
  }) => ({
    get count() {
      if (!wantsVirtualization.value) return 0;
      return itemsWithVirtualKey.value.length;
    },
    getItemKey: (index) => itemsWithVirtualKey.value?.[index]?.virtualKey ?? index,
    get scrollMargin() {
      return margin.value;
    },
    estimateSize: () => estimateItemSize(virtualizer.value?.value),
    // Instant corrections; `scroll-behavior: smooth` would animate them against the user's scrolling.
    scrollToFn: (offset, { adjustments = 0, behavior }, instance) => {
      instance.scrollElement?.scrollTo?.({
        top: offset + adjustments,
        behavior: behavior === 'smooth' ? 'smooth' : 'instant',
      });
    },
    shouldAdjustScrollPositionOnItemSizeChange,
    get gap() {
      return listGap.value;
    },
    overscan: VIRTUALIZED_OVERSCAN,
    // Getter so reading the ref during the options spread keeps the pin reactive.
    get rangeExtractor() {
      const pinned = pinnedIndex.value;
      return (range) => extractVirtualRangeWithPinned(range, pinned);
    },
  }),
});

// Until the virtualizer is live, render nothing rather than the full model.
const displayedItems = computed(() => {
  if (isVirtualizationActive.value) {
    const margin = scrollMargin.value;
    return virtualItems.value
      .map((virtualRow) => {
        const entry = itemsWithVirtualKey.value?.[virtualRow.index];
        if (!entry?.item) return null;
        return {
          item: entry.item,
          index: virtualRow.index,
          itemKey: entry.virtualKey,
          style: { transform: `translateY(${virtualRow.start - margin}px)` },
        };
      })
      .filter(Boolean);
  }

  if (props.hasVirtualization) return [];

  return itemsWithVirtualKey.value.map((entry) => ({
    item: entry.item,
    index: entry.index,
    itemKey: entry.virtualKey,
    style: null,
  }));
});

const virtualizedListStyle = computed(() => {
  if (!isVirtualizationActive.value) return null;
  return { height: `${virtualTotalSize.value}px`, position: 'relative' };
});

// `display: none` anywhere up the tree means the list has no usable geometry.
function checkListRendered() {
  let element = listRef.value;
  if (!element) return false;
  while (element) {
    const style = globalThis.getComputedStyle?.(element);
    if (style?.display === 'none' || style?.visibility === 'hidden') return false;
    element = element.parentElement;
  }
  return true;
}

function syncListRendered() {
  isListRendered.value = checkListRendered();
  return isListRendered.value;
}

function updateListGap() {
  if (!listRef.value) return;
  const computedStyle = globalThis.getComputedStyle(listRef.value);
  const rowGap = Number.parseFloat(computedStyle.rowGap || computedStyle.gap || '0');
  listGap.value = Number.isFinite(rowGap) ? rowGap : 0;
}

// Scrolls the item into the virtual window so it exists before focusing.
// Rendered items keep the browser's own focus scroll; unrendered ones are scrolled to first.
async function resolveItemElement(index) {
  if (index < 0) return { element: null, scrolled: false };
  await nextTick();
  const findItem = () =>
    listRef.value?.querySelector(`.lx-appendable-list-item[data-index="${index}"]`) ?? null;
  if (!isVirtualizationActive.value || findItem()) return { element: findItem(), scrolled: false };
  await scrollToIndex(index);
  await nextTick();
  return { element: findItem(), scrolled: true };
}

function focusItemPart(element, scrolled) {
  element?.focus({ preventScroll: scrolled });
}

async function focusLastAddedElement() {
  // Wait for the parent to write the new item back.
  await nextTick();
  const lastIndex = (model.value?.length ?? 0) - 1;
  const { element: lastItemEl, scrolled } = await resolveItemElement(lastIndex);
  if (!lastItemEl) return;
  if (props.expandable) {
    focusItemPart(lastItemEl.querySelector('.lx-data-block-header'), scrolled);
  } else {
    focusItemPart(lastItemEl.querySelector('.lx-form-grid'), scrolled);
  }
}
function removeItem(id) {
  const index = model.value.findIndex((x) => x._lx_appendableKey === id);
  const res = [...model.value];
  res.splice(index, 1);
  model.value = res;

  nextTick(async () => {
    const remainingCount = model.value?.length ?? 0;
    if (!remainingCount) return;
    const { element: nextItem, scrolled } = await resolveItemElement(
      Math.min(index, remainingCount - 1)
    );
    if (!nextItem) return;
    const focusable = nextItem.querySelector(
      'a:not([disabled]), button:not([disabled]), input:not([disabled]), [tabindex="0"]'
    );
    focusItemPart(focusable, scrolled);
  });
}

function addItem() {
  let res = [{}];
  if (props.modelValue) {
    const object = { ...model.value[0] };
    Object.keys(object)?.forEach((k) => (object[k] = null));
    res = [...model.value];
    delete object._lx_appendableKey;
    res.push(object);
  }
  model.value = res;
  focusLastAddedElement();
}

const expanded = computed(() => {
  const object = [...model.value];
  const transformedStructure = object?.reduce((result, obj) => {
    const res = result;
    if (typeof obj?.[props.expandedAttribute] === 'boolean') {
      res[obj?.[props.idAttribute]] = obj[props.expandedAttribute];
    } else {
      res[obj?.[props.idAttribute]] = props.defaultExpanded;
    }
    return res;
  }, {});
  return transformedStructure;
});

// Takes out all the _lx_appendableKey properties from the model
function clearModel() {
  const res = [];
  model.value?.forEach((obj) => {
    const modifiedObj = { ...obj };
    delete modifiedObj._lx_appendableKey;
    res.push(modifiedObj);
  });
  return res;
}

function changeActions(actionDefinitions, item) {
  return flattenNestedActions(actionDefinitions)
    .filter((x) => (x.visibleByAttribute ? item[x.visibleByAttribute] : true))
    .map((x) => {
      const updatedAction = { ...x };

      if (x.enableByAttribute) {
        const value = item[x.enableByAttribute];
        if (!value) {
          updatedAction.disabled = true;
        }
      }
      return updatedAction;
    });
}

const allActions = computed(() => {
  if (!props.readOnly && props.actionDefinitions.length === 0) {
    return [
      {
        id: 'appendableListDelete',
        icon: 'remove-item',
        destructive: true,
        title: displayTexts.value.removeItem,
        enableByAttribute: props.removeEnableByAttribute,
        visibleByAttribute: props.removeVisibleByAttribute,
      },
    ];
  }
  if (!props.readOnly && props.actionDefinitions.length > 0) {
    return [
      {
        id: 'appendableListDelete',
        name: displayTexts.value.removeItem,
        icon: 'remove-item',
        destructive: true,
        title: displayTexts.value.removeItem,
        enableByAttribute: props.removeEnableByAttribute,
        visibleByAttribute: props.removeVisibleByAttribute,
      },
      ...resolveActionGroups(props.actionDefinitions, props.actionGroupDefinitions),
    ];
  }
  return resolveActionGroups(props.actionDefinitions, props.actionGroupDefinitions);
});

function actionClick(val, item, itemKey) {
  if (val === 'appendableListDelete') removeItem(itemKey);
  emits('actionClick', val, item, itemKey);
}

const selectedValuesNotDefined = ref({});

const selectedValues = computed({
  get() {
    if (!props.selectedValues) return selectedValuesNotDefined.value;
    return props.selectedValues;
  },
  set(value) {
    if (!props.selectedValues) selectedValuesNotDefined.value = value;
    emits('update:selectedValues', value);
  },
});

function deselectAll() {
  Object.keys(selectedValues.value).forEach((key) => {
    selectedValues.value[key] = false;
  });
}

function changeSelecting(value) {
  if (props.selectionKind === 'single') {
    deselectAll();
    selectedValues.value = { [value]: true };
  }
}

function handleToolbarActionClick(id, value) {
  if (id === 'add-item') {
    addItem();
  } else {
    emits('toolbarActionClick', id, value);
  }
}

function onDelete(e, itemKey) {
  if (e.key !== 'Delete') return;
  const { activeElement } = document;
  if (activeElement.ariaLabel !== displayTexts.value.removeItemHint) {
    return;
  }
  e.preventDefault();
  removeItem(itemKey);
}

const toolbarActions = computed(() => {
  const actionsDefault = [];

  if (!props.readOnly && props.canAddItems) {
    actionsDefault.push({
      id: 'add-item',
      name: displayTexts.value.addButtonLabel,
      title: displayTexts.value.addItemButtonTooltip,
      icon: 'add-item',
      kind: 'tertiary',
    });
  }

  const actionsBuiltIn = actionsDefault.map((a) => ({ ...a, builtIn: true }));
  // With the built-in add action, it stays promoted and the other actions are shown as ghost
  const actions = actionsBuiltIn.length
    ? props.toolbarActionDefinitions.map((a) => ({ ...Object(a), extra: true }))
    : props.toolbarActionDefinitions;

  return [...actionsBuiltIn, ...actions];
});

const rowId = inject('rowId', ref(null));
const labelledBy = computed(() => props.labelId || rowId.value);

// Only width changes item heights, so skip height-only resizes (mobile keyboard).
let lastResizeWidth = null;
function handleResize() {
  syncListRendered();
  if (!wantsVirtualization.value) return;
  updateListGap();
  scheduleLayoutUpdate();
  const width = globalThis.innerWidth;
  if (lastResizeWidth !== null && width === lastResizeWidth) return;
  lastResizeWidth = width;
  measureList();
}

async function refreshVirtualization({ reloadOnScrollParentChange = false } = {}) {
  await nextTick();
  syncListRendered();
  if (!wantsVirtualization.value) return;
  await syncVirtualizationContext({ reloadOnScrollParentChange });
  updateListGap();
  measureList();
}

let previousKeys = new Set();
watch(itemsWithVirtualKey, (entries) => {
  const keys = new Set(entries.map((entry) => entry.virtualKey));
  const isNewDataSet = previousKeys.size > 0 && ![...keys].some((key) => previousKeys.has(key));
  previousKeys = keys;
  if (!isVirtualizationActive.value) return;
  nextTick(() => {
    updateListGap();
    updateScrollContext();
    if (isNewDataSet) measureList();
  });
});

watch(wantsVirtualization, async (wants) => {
  if (!wants) {
    clearVirtualizer();
    return;
  }
  await refreshVirtualization({ reloadOnScrollParentChange: true });
});

// Catches the list being revealed without a resize (e.g. an inactive tab).
let renderedObserver = null;
function observeListRendered() {
  const RO = globalThis.ResizeObserver;
  if (!RO || !listRef.value || renderedObserver) return;
  renderedObserver = new RO(() => syncListRendered());
  renderedObserver.observe(listRef.value);
}

async function startVirtualization() {
  observeListRendered();
  await refreshVirtualization({ reloadOnScrollParentChange: true });
}

watch(
  () => props.hasVirtualization,
  (hasVirtualization) => {
    if (hasVirtualization) startVirtualization();
  }
);

onMounted(async () => {
  model.value = props.modelValue;

  // Seed the width so the first (keyboard) resize is skipped, not re-measured.
  lastResizeWidth = globalThis.innerWidth;
  globalThis.addEventListener('resize', handleResize);

  if (!props.hasVirtualization) return;
  await startVirtualization();
});

onBeforeUnmount(() => {
  globalThis.removeEventListener('resize', handleResize);
  renderedObserver?.disconnect();
  renderedObserver = null;
  cleanupVirtualization();
});

defineExpose({ clearModel });

const dataState = computed(() =>
  JSON.stringify({
    expandable: props.expandable,
  })
);
</script>

<template>
  <div
    class="lx-appendable-list-wrapper"
    ref="wrapperRef"
    data-component="lx-appendable-list"
    :data-id="id"
    :data-state="dataState"
  >
    <LxToolbar
      class="lx-floating-toolbar"
      :id="`${props.id}-toolbar`"
      :actionDefinitions="toolbarActions"
      :actionGroupDefinitions="toolbarActionGroupDefinitions"
      :texts="displayTexts"
      :sticky="stickyToolbar"
      :wrapperRef="wrapperRef"
      @actionClick="handleToolbarActionClick"
    >
      <template #leftArea>
        <slot name="leftToolbar" />
      </template>

      <template #rightArea>
        <slot name="toolbar" />
      </template>
    </LxToolbar>
    <div
      ref="listRef"
      class="lx-appendable-list"
      :class="[
        {
          'lx-appendable-list-compact': kind === 'compact',
          'lx-region-component': !expandable,
          'lx-appendable-list-virtualized': isVirtualizationActive,
        },
      ]"
      :style="virtualizedListStyle"
      @focusin="onListFocusIn"
      @focusout="onListFocusOut"
      :aria-labelledby="labelledBy"
      :id="props.id"
      role="list"
    >
      <div
        v-for="{ item, index, itemKey, style } in displayedItems"
        :key="itemKey"
        :ref="isVirtualizationActive ? measureListItem : null"
        :data-index="index"
        :style="style"
        class="lx-appendable-list-item"
        :id="item._lx_appendableKey"
        role="listitem"
        @keydown.delete="onDelete($event, item._lx_appendableKey)"
      >
        <template v-if="expandable">
          <LxDataBlock
            v-model="expanded[item?.[idAttribute]]"
            @update:model-value="
              typeof item[props.expandedAttribute] === 'boolean'
                ? (item[props.expandedAttribute] = $event)
                : null
            "
            v-model:selected="selectedValues[item?.[idAttribute]]"
            :id="item[idAttribute]"
            :name="item[nameAttribute]"
            :description="item[descriptionAttribute]"
            :icon="item[iconAttribute]"
            :expandable="true"
            :actionDefinitions="changeActions([...allActions], item)"
            :actionGroupDefinitions="actionGroupDefinitions"
            :uppercase="uppercase"
            :hasSelecting="showSelecting"
            :selectable="isSelectable(item)"
            :selectionKind="selectionKind"
            :invalid="item[invalidAttribute]"
            :ariaLabel="
              !readOnly && (!hideRemoveAttribute || !item[hideRemoveAttribute])
                ? displayTexts.removeItemHint
                : null
            "
            @actionClick="(val) => actionClick(val, item[idAttribute], item._lx_appendableKey)"
            @selectingClick="changeSelecting"
          >
            <LxForm
              kind="stripped"
              role="group"
              :columnCount="columnCount"
              :required-mode="props.requiredMode"
            >
              <slot name="customItem" v-bind="{ item, index }" />
            </LxForm>

            <template #customHeader v-if="$slots.customHeader">
              <slot
                name="customHeader"
                v-bind="{ item, expanded: expanded[item && item[idAttribute]] }"
              />
            </template>
          </LxDataBlock>
        </template>

        <template v-else>
          <LxForm
            kind="stripped"
            role="group"
            :tabindex="!readOnly && (!hideRemoveAttribute || !item[hideRemoveAttribute]) ? 0 : null"
            :aria-label="
              !readOnly && (!hideRemoveAttribute || !item[hideRemoveAttribute])
                ? displayTexts.removeItemHint
                : null
            "
            :columnCount="columnCount"
            :required-mode="props.requiredMode"
          >
            <slot name="customItem" v-bind="{ item, index }" />
          </LxForm>

          <div class="appendable-list-remove-button-wrapper">
            <div class="appendable-list-remove">
              <LxButton
                v-if="
                  !readOnly &&
                  (!hideRemoveAttribute || !item[hideRemoveAttribute]) &&
                  (!removeVisibleByAttribute || item[removeVisibleByAttribute])
                "
                :id="`${item[idAttribute]}-remove-button`"
                icon="remove-item"
                variant="icon-only"
                :label="displayTexts.removeItem"
                :destructive="true"
                kind="ghost"
                :disabled="!!removeEnableByAttribute && !item[removeEnableByAttribute]"
                @click="
                  () =>
                    actionClick('appendableListDelete', item[idAttribute], item._lx_appendableKey)
                "
              />
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
