<script setup>
import { computed, onMounted, onBeforeUnmount, ref, toRaw, watch, nextTick, useSlots } from 'vue';
import {
  useWindowSize,
  useElementBounding,
  useElementSize,
  useMutationObserver,
} from '@vueuse/core';

import { logError } from '@/utils/devUtils';
import useLx from '@/hooks/useLx';
import useScrollVirtualizer from '@/hooks/useScrollVirtualizer';
import { useGridKeyboardNavigation } from '@/hooks/useGridKeyboardNavigation';
import { formatValueArray } from '@/utils/formatUtils';
import { formatDateTime, formatDate, formatFull } from '@/utils/dateUtils';
import { generateUUID, foldToAscii } from '@/utils/stringUtils';
import { getDisplayTexts } from '@/utils/generalUtils';

import LxButton from '@/components/Button.vue';
import LxCheckbox from '@/components/Checkbox.vue';
import LxRadioButton from '@/components/RadioButton.vue';
import LxIcon from '@/components/Icon.vue';
import LxDropDownMenu from '@/components/DropDownMenu.vue';
import LxStateDisplay from '@/components/StateDisplay.vue';
import LxEmptyValue from '@/components/EmptyValue.vue';
import LxRating from '@/components/Rating.vue';
import LxInfoWrapper from '@/components/InfoWrapper.vue';
import LxFlag from '@/components/Flag.vue';
import LxFlagItemDisplay from '@/components/itemDisplay/FlagItemDisplay.vue';
import LxEmptyState from '@/components/EmptyState.vue';
import LxAppendableList from '@/components/forms/AppendableList.vue';
import LxRow from '@/components/forms/Row.vue';
import LxToolbar from '@/components/Toolbar.vue';
import LxPersonDisplay from '@/components/PersonDisplay.vue';
import LxBadge from '@/components/Badge.vue';

const lvCollator = new Intl.Collator('lv');
const numberFormatters = new Map();

function getNumberFormatter(fractionDigits) {
  if (!numberFormatters.has(fractionDigits)) {
    numberFormatters.set(
      fractionDigits,
      new Intl.NumberFormat('lv-LV', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      })
    );
  }
  return numberFormatters.get(fractionDigits);
}

const emits = defineEmits([
  'update:searchString',
  'search',
  'selectPage',
  'sortingChange',
  'selectionChange',
  'itemsPerPageChange',
  'actionClick',
  'selectionActionClick',
  'toolbarActionClick',
  'emptyStateActionClick',
]);
const slots = useSlots();
const props = defineProps({
  id: {
    type: String,
    default: () => generateUUID(),
  },
  label: { type: String, default: null },
  description: { type: String, default: null },
  columnDefinitions: {
    type: Array,
    default: () => [
      { attributeName: 'id', size: 's' },
      { attributeName: 'name', size: '*' },
    ],
  },
  idAttribute: { type: String, default: 'id' },
  actionDefinitions: { type: Array, default: () => [] },
  actionAdditionalParameter: { type: String, default: null },
  defaultActionName: { type: String, default: 'open' },
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  skeletonRowCount: { type: Number, default: 10 },
  hasVirtualization: { type: Boolean, default: true },
  scrollable: { type: [Boolean, String], default: 'auto' }, // 'auto', true, false
  stickyHeader: { type: Boolean, default: true },
  showHeader: { type: Boolean, default: false },
  showToolbar: { type: Boolean, default: false },
  showStatusbar: { type: Boolean, default: true },
  showAllColumns: { type: Boolean, default: false },
  showItemsCountSelector: { type: Boolean, default: false },
  hasPaging: { type: Boolean, default: false },
  hasSorting: { type: Boolean, default: false },
  hasSelecting: { type: Boolean, default: false },
  selectionKind: { type: String, default: 'multiple' }, // 'multiple' (with checkboxes; can select many rows) or 'single' (with radio buttons; can select one row)
  sortingSide: { type: String, default: 'client' }, // 'client' (sorting is done on client side) or 'server' (sorting is done on server side)
  sortingIgnoreEmpty: { type: Boolean, default: true },
  pageCurrent: { type: Number, default: 0 },
  itemsPerPage: { type: Number, default: 20 },
  itemsTotal: { type: Number, default: 0 },
  sortingMode: { type: String, default: 'strip' }, // 'default' or 'strip'
  selectionActionDefinitions: { type: Array, default: () => [] },
  toolbarActionDefinitions: { type: Array, default: () => [] },
  emptyStateActionDefinitions: { type: Array, default: null },
  emptyStateIcon: { type: String, default: '' },
  clickableRole: { type: String, default: 'link' }, // 'link' or 'button'
  hasSearch: { type: Boolean, default: false },
  searchMode: { type: String, default: 'default' }, // default, compact
  searchString: { type: String, default: '' },
  searchSide: { type: String, default: 'server' }, // server, TODO add client search
  locale: { type: String, default: null }, // lv, en
  fullBleed: { type: Boolean, default: true },
  badgeDefinitions: { type: Array, default: () => [] },
  stickyToolbar: { type: Boolean, default: false },
  texts: { type: Object, default: () => ({}) },
});

const textsDefault = {
  emptyValue: 'Nav norādīts',
  valueYes: 'Jā',
  valueNo: 'Nē',
  items: {
    singular: 'ieraksts',
    plural: 'ieraksti',
    endingWith234: 'ieraksti',
    endingWith1: 'ieraksts',
  },
  ofItems: {
    label: 'Ieraksti',
    singular: 'ieraksta',
    plural: 'ierakstiem',
    endingWith234: 'ierakstiem',
    endingWith1: 'ieraksta',
  },
  selected: {
    singular: 'Izvēlēts',
    plural: 'Izvēlēti',
    endingWith234: 'Izvēlēti',
    endingWith1: 'Izvēlēts',
  },
  of: 'no',
  firstPage: 'Pirmā lapa',
  nextPage: 'Nākamā lapa',
  previousPage: 'Iepriekšējā lapa',
  clear: 'Attīrīt izvēles',
  clearSearch: 'Notīrīt meklēšanas ievadi',
  itemsPerPage: 'Ierakstu skaits vienā lapā:',
  itemsPerPageLabel: 'ieraksti lapā',
  selectAllRows: 'Izvēlēties visu',
  noItems: 'Nav neviena ieraksta, ko attēlot',
  noItemsDescription: '',
  iconsResponsiveRowLabel: 'Ikonas',
  moreActions: 'Papildu darbības',
  actions: 'Darbības',
  openSearch: 'Atvērt meklētāju',
  closeSearch: 'Aizvērt meklētāju',
  personDisplay: {
    name: 'Vārds, uzvārds',
    description: 'Apraksts',
    role: 'Loma',
    institution: 'Iestāde',
  },
  rating: {
    label: 'Vērtējums',
    star1: 'Ļoti slikti',
    star2: 'Slikti',
    star3: 'Gandrīz labi',
    star4: 'Labi',
    star5: 'Izcili',
  },
  placeholder: 'Ievadiet nosaukuma vai apraksta daļu, lai sameklētu ierakstus',
  search: 'Meklēt',
  close: 'Aizvērt',
  skipHeader: 'Pāriet uz tabulas datiem',
  overflowMenu: 'Atvērt papildu iespējas',
  loadingStart: 'Ielādē sākas',
  loadingEnd: 'Ielādē beidzas',
  defaultSortingTooltips: {
    asc: 'Tiek kārtots augošā secībā pēc',
    desc: 'Tiek kārtots dilstošā secībā pēc',
    default: 'Kārtot pēc',
  },
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));

const sortedColumns = ref({});
const dataGridWrapperRef = ref(null);
const selectedRowsRaw = ref({});
const gridTemplateColumns = ref('');
const skeletonGridTemplateColumns = ref('6rem 12rem auto');
const header = ref(null);
const container = ref(null);
const showLoadingAlert = ref(false);
const autoScrollable = ref(false);

// Row dropdown menus keyed by rowKey, not by render index: Vue's v-for ref
// arrays aren't guaranteed to match source order, so during fast virtualized
// scrolling an index lookup can resolve to the wrong row's menu and open the
// popper at the wrong place. Keying by the stable rowKey avoids that.
const dropDownMenus = new Map();
const dropDownMenuSetters = new Map();

function dropDownMenuRefFor(rowKey) {
  let setter = dropDownMenuSetters.get(rowKey);
  if (!setter) {
    setter = (instance) => {
      if (instance) dropDownMenus.set(rowKey, instance);
      else dropDownMenus.delete(rowKey);
    };
    dropDownMenuSetters.set(rowKey, setter);
  }
  return setter;
}

const VIRTUALIZED_ESTIMATED_ROW_HEIGHT = 72;
const VIRTUALIZED_OVERSCAN = 6;
const isDataGridLayoutVisible = ref(false);

let pendingHeaderScrollRaf = null;
let pendingContainerScrollRaf = null;
let pendingBoundingRaf = null;

const { width, height } = useWindowSize();

const isResponsiveLayout = computed(() => width.value <= 800);

const bounding = useElementBounding(container, {
  windowScroll: false,
  windowResize: false,
});
const headerSize = useElementSize(header);
const lxElement = document.querySelector('.lx');
const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);

function isElementRenderable(element) {
  if (!element) return false;

  let currentElement = element;
  while (currentElement) {
    if (currentElement.style?.display === 'none' || currentElement.style?.visibility === 'hidden') {
      return false;
    }

    const currentComputedStyle =
      typeof globalThis.getComputedStyle === 'function'
        ? globalThis.getComputedStyle(currentElement)
        : null;

    if (currentComputedStyle?.display === 'none' || currentComputedStyle?.visibility === 'hidden') {
      return false;
    }

    currentElement = currentElement.parentElement;
  }

  const computedStyle =
    typeof globalThis.getComputedStyle === 'function' ? globalThis.getComputedStyle(element) : null;

  if (typeof element.getClientRects === 'function' && element.getClientRects().length > 0) {
    return true;
  }

  if ((element.offsetWidth ?? 0) > 0 || (element.offsetHeight ?? 0) > 0) {
    return true;
  }

  return computedStyle ? computedStyle.display !== 'none' : true;
}

function syncDataGridLayoutVisibility() {
  const nextVisibility = isElementRenderable(container.value);
  isDataGridLayoutVisible.value = nextVisibility;
  return nextVisibility;
}

const {
  activeRow: gridActiveRow,
  activeCol: gridActiveCol,
  activeItem: gridActiveItem,
  registerCell,
  getTabIndex,
  getFocusable,
  onKeydown,
  isCellDelegated,
  setActiveFromClick,
} = useGridKeyboardNavigation();

const isDisabled = computed(() => props.loading || props.busy);

const columnsComputed = computed(() => {
  const ret = [];
  props.columnDefinitions?.forEach((definition) => {
    ret.push({
      id: definition.id ? definition.id : definition.attributeName,
      attributeName: definition.attributeName,
      attributeDescription: definition.attributeDescription,
      name: definition.name ? definition.name : definition.attributeName,
      title: definition.title,
      dictionary: definition.dictionary,
      type: definition.type ? definition.type : 'default',
      kind: definition.kind ? definition.kind : 'default',
      size: definition.size ? definition.size : '*',
      options: definition.options ? definition.options : null,
      sortingTooltips: definition.sortingTooltips,
    });
  });
  return ret;
});

function isValueEmpty(value) {
  return value === null || value === undefined || value === '';
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Keep column wrapper identities stable across recomputes so `col` stays stable
// in cell :class arrays and v-memo deps (a fresh wrapper invalidates every cell).
const gridColumnsDisplayCache = new Map();
function buildCellStaticClass(col) {
  return Object.freeze({
    'lx-cell-number': col.type === 'number' || col.type === 'decimal' || col.type === 'float',
    'lx-cell-number-left': col.options?.justify === 'left',
    'lx-cell-xs': col.size === 'xs',
    'lx-cell-s': col.size === 's',
    'lx-cell-m': col.size === 'm',
    'lx-cell-l': col.size === 'l',
    'lx-cell-xl': col.size === 'xl',
    'lx-cell-stretch': col.size === '*',
    'lx-cell-clickable': col.kind === 'clickable',
    'lx-cell-primary': col.kind === 'primary',
    'lx-cell-secondary': col.kind === 'secondary',
    'lx-cell-extra': col.kind === 'extra',
  });
}
function colSignature(col) {
  return [
    col.attributeName,
    col.attributeDescription,
    col.name,
    col.title,
    col.dictionary,
    col.type,
    col.kind,
    col.size,
    col.options?.justify ?? '',
    col.options?.displayItemsCount ?? '',
    col.options?.fractionDigits ?? '',
    col.sortingTooltips ?? '',
  ].join('|');
}
const gridColumnsDisplay = computed(() => {
  const seenIds = new Set();
  const result = columnsComputed.value
    .filter((col) => col.kind !== 'extra' || props.showAllColumns)
    .map((col) => {
      seenIds.add(col.id);
      const cached = gridColumnsDisplayCache.get(col.id);
      const sig = colSignature(col);
      if (cached && cached.sig === sig) return cached.value;
      const value = Object.freeze({
        ...col,
        cellStaticClass: buildCellStaticClass(col),
      });
      gridColumnsDisplayCache.set(col.id, { sig, value });
      return value;
    });
  Array.from(gridColumnsDisplayCache.keys()).forEach((id) => {
    if (!seenIds.has(id)) gridColumnsDisplayCache.delete(id);
  });
  return result;
});

function cellNotDelegated(row, col) {
  const isClickableTextCell =
    col?.kind === 'clickable' &&
    !['state', 'rating', 'array', 'flag', 'country', 'person', 'icon'].includes(col?.type);

  if (isClickableTextCell) {
    return true;
  }

  return !isCellDelegated(
    col,
    (isObject(row?.[col?.attributeName]) &&
      !isValueEmpty(row?.[col?.attributeName]) &&
      col.type === 'icon') ||
      (row[col.attributeName] &&
        row[col.attributeName].length >
          (col.options?.displayItemsCount ? col.options?.displayItemsCount : 1) &&
        col.type === 'array') ||
      (col.type === 'person' && !isValueEmpty(row?.[col?.attributeName]))
  );
}

// Cache cellNotDelegated(row, col) by identity — :tabindex, :ref and :class all
// need it per cell, and it does several reactive reads per call.
const cellInteractiveCache = new WeakMap();
function cellIsInteractive(row, col) {
  let perRow = cellInteractiveCache.get(row);
  if (!perRow) {
    perRow = new WeakMap();
    cellInteractiveCache.set(row, perRow);
  }
  if (perRow.has(col)) return perRow.get(col);
  const result = cellNotDelegated(row, col);
  perRow.set(col, result);
  return result;
}

function formatBoolean(value) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  return value ? displayTexts.value.valueYes : displayTexts.value.valueNo;
}

function formatValue(value, type, options = null) {
  let optionsValue = options;
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  switch (type) {
    case 'bool':
    case 'boolean':
      return formatBoolean(value);
    case 'number':
      return getNumberFormatter(0).format(value);

    case 'float':
    case 'decimal':
      if (!options) {
        optionsValue = 2;
      }
      return getNumberFormatter(optionsValue).format(value);

    case 'date':
      return formatDate(value);
    case 'dateTime':
      return formatDateTime(value);
    case 'dateTimeFull':
      return formatFull(value);

    case 'array':
      if (!options) {
        optionsValue = 1;
      }
      if (value && value.length > optionsValue) {
        return value.length;
      }
      if (value && value.length <= optionsValue) {
        return value;
      }
      return '—';

    case 'default':
    default:
      return value.toString();
  }
}

function getSortingTooltipKey(sorting) {
  if (sorting === null || sorting === undefined) return 'default';
  if (sorting === 'asc' || sorting === 'desc') return sorting;
  return null;
}

function buildSortingText(sortTooltips, tooltipKey, trimmedDisplayName, hasCustomSortingTooltips) {
  if (!props.hasSorting || !sortTooltips || !tooltipKey) return '';
  const tooltipText = sortTooltips?.[tooltipKey];
  if (!tooltipText) return '';
  if (hasCustomSortingTooltips) return tooltipText;
  return `${tooltipText} "${trimmedDisplayName}"`;
}

function formatTooltip(displayName, title, sorting, sortingTooltips) {
  const hasCustomSortingTooltips = Boolean(sortingTooltips);
  const sortTooltips =
    hasCustomSortingTooltips && props.hasSorting
      ? sortingTooltips
      : displayTexts.value.defaultSortingTooltips;

  const trimmedDisplayName = typeof displayName === 'string' ? displayName.trim() : displayName;
  const trimmedTitle = title?.trim();
  const tooltipKey = getSortingTooltipKey(sorting);
  const sortingText = buildSortingText(
    sortTooltips,
    tooltipKey,
    trimmedDisplayName,
    hasCustomSortingTooltips
  );

  // Compose all lines
  const tooltipLines = [];
  if (trimmedDisplayName) tooltipLines.push(trimmedDisplayName);
  if (trimmedTitle) tooltipLines.push(trimmedTitle);
  if (sortingText && props.hasSorting) tooltipLines.push(sortingText);

  return tooltipLines.join('\r\n');
}

function getTextTooltip(col, row) {
  if (col.type === 'tooltip-text') {
    return row[col.attributeDescription] || row[col.attributeName];
  }
  if (col.type === 'bool' || col.type === 'boolean') {
    return formatBoolean(row[col.attributeName]);
  }
  if (col.type === 'date') {
    return formatDate(row[col.attributeName]);
  }
  if (col.type === 'dateTime') {
    return formatDateTime(row[col.attributeName]);
  }
  if (col.type === 'dateTimeFull') {
    return formatFull(row[col.attributeName]);
  }
  return ['xs', 's', 'm'].includes(col.size) ? row[col.attributeName] : '';
}

function getAriaLabel(col, row) {
  if (col.kind === 'clickable') {
    return row[col.attributeDescription] || row[col.attributeName];
  }
  return '';
}

function handleActionClick(actionName, rowCode, additionalParam) {
  if (!props.loading && !props.busy) {
    emits('actionClick', actionName, rowCode, additionalParam);
  }
}

function handleSelectionActionClick(actionName, selectedRowCodes) {
  if (!props.loading && !props.busy) {
    emits('selectionActionClick', actionName, selectedRowCodes);
  }
}

function selectPageClicked(pageNum) {
  if (!props.loading && !props.busy) {
    emits('selectPage', pageNum);
  }
}

const defaultActionEnableByAttribute = computed(() => {
  const action = props.actionDefinitions?.find((item) => item.id === props.defaultActionName);
  return action?.enableByAttribute || null;
});

function checkEnableByAttributeName(row) {
  const enableByAttribute = defaultActionEnableByAttribute.value;
  if (enableByAttribute) {
    return row[enableByAttribute];
  }
  return true;
}

function defaultActionClicked(rowCode, row) {
  if (checkEnableByAttributeName(row) && props.defaultActionName && !props.loading && !props.busy) {
    handleActionClick(props.defaultActionName, rowCode, props.actionAdditionalParameter);
  }
}

function selectNextPage() {
  selectPageClicked(Number(props.pageCurrent) + 1);
}

function selectPreviousPage() {
  selectPageClicked(Number(props.pageCurrent) - 1);
}

function selectFirstPage() {
  selectPageClicked(0);
}

function resolveDataGridScrollParent(el) {
  if (!el) return null;

  const isScrollableOverflow = (overflowY) =>
    overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';

  const isConstrainedScrollableElement = (element, style) => {
    if (!element || !style) return false;
    if (element.scrollHeight > element.clientHeight + 1) return true;

    const hasConstrainedHeight = style.height !== 'auto' && style.height !== '';
    const hasConstrainedMaxHeight = style.maxHeight && style.maxHeight !== 'none';

    return hasConstrainedHeight || hasConstrainedMaxHeight;
  };

  const modalElement = el.closest('.lx-modal');
  const modalMain = modalElement?.querySelector(':scope > .lx-main');
  if (modalMain) {
    const modalMainStyle = globalThis.getComputedStyle(modalMain);
    if (isScrollableOverflow(modalMainStyle?.overflowY)) {
      return modalMain;
    }
  }

  let parent = el.parentElement;
  while (parent && parent !== document.body && parent !== document.documentElement) {
    const style = globalThis.getComputedStyle(parent);

    if (isScrollableOverflow(style?.overflowY) && isConstrainedScrollableElement(parent, style)) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return null;
}

function syncHeaderScroll() {
  if (header.value && container.value) {
    header.value.scrollLeft = container.value.scrollLeft;
  }
}

function syncContainerScroll() {
  if (header.value && container.value) {
    container.value.scrollLeft = header.value.scrollLeft;
  }
}

function scheduleHeaderScroll() {
  if (pendingHeaderScrollRaf !== null) {
    return;
  }
  pendingHeaderScrollRaf = globalThis.requestAnimationFrame(() => {
    pendingHeaderScrollRaf = null;
    syncHeaderScroll();
  });
}

function scheduleBoundingUpdate() {
  if (pendingBoundingRaf !== null) {
    return;
  }
  pendingBoundingRaf = globalThis.requestAnimationFrame(() => {
    pendingBoundingRaf = null;
    bounding.update();
  });
}

function scheduleContainerScroll() {
  if (pendingContainerScrollRaf !== null) {
    return;
  }
  pendingContainerScrollRaf = globalThis.requestAnimationFrame(() => {
    pendingContainerScrollRaf = null;
    syncContainerScroll();
  });
}

function setSorting(columnCode, direction) {
  sortedColumns.value[columnCode] = direction;
  emits('sortingChange', { columnCode, direction });
}

function sortColumn(columnCode) {
  if (!isDisabled.value) {
    const prevSorting = sortedColumns.value[columnCode];

    sortedColumns.value = {};
    if (props.hasSorting) {
      if (prevSorting === 'asc') setSorting(columnCode, 'desc');
      else if (prevSorting === 'desc') setSorting(columnCode, null);
      else setSorting(columnCode, 'asc');
    }
  }
}

const selectedRows = computed(() => {
  const ret = [];
  Object.keys(selectedRowsRaw.value).forEach((key) => {
    if (selectedRowsRaw.value[key]) {
      if (props.selectionKind === 'multiple') {
        ret.push(key);
      } else if (props.selectionKind === 'single') {
        ret[0] = key;
      }
    }
  });
  return ret;
});

watch(selectedRows, (newVal) => {
  emits('selectionChange', newVal);
});

function selectRow(id) {
  selectedRowsRaw.value = {};
  selectedRowsRaw.value[id] = true;
}

function cancelSelection() {
  selectedRowsRaw.value = {};
}

const toolbarActions = computed(() => {
  if (selectedRows.value.length > 0) {
    return [];
  }
  return props.toolbarActionDefinitions;
});

const selectionState = computed(() => {
  if (props.selectionKind === 'single') {
    return 'radiobutton-filled';
  }

  if (selectedRows.value.length === 0) {
    return 'checkbox';
  }

  if (selectedRows.value.length === props.items.length) {
    return 'checkbox-filled';
  }

  return 'checkbox-indeterminate';
});

function compareOrder(a, b, ascending, getOrder) {
  const orderA = getOrder(a);
  const orderB = getOrder(b);

  if (orderA && !orderB) {
    return ascending ? -1 : 1;
  }
  if (!orderA && orderB) {
    return ascending ? 1 : -1;
  }
  if (orderA && orderB) {
    return orderA - orderB;
  }
  return 0;
}

function getLowercaseString(value) {
  return value?.trim().toLowerCase() || '';
}

function isValidString(value) {
  return value && value.trim() !== '';
}

function compareExistence(aExists, bExists, ascending) {
  if (aExists && !bExists) {
    return ascending ? -1 : 1;
  }
  if (!aExists && bExists) {
    return ascending ? 1 : -1;
  }
  return 0;
}

function isItemEmpty(item, value, label) {
  if (typeof item === 'string') {
    return isValidString(item);
  }
  if (typeof item === 'object') {
    return (
      (isValidString(value) && isValidString(label)) ||
      (isValidString(value) && !isValidString(label))
    );
  }
  return true;
}

function compareFlagNames(nameA, nameB, hasNameOnlyA, hasNameOnlyB, ascending) {
  if (hasNameOnlyA && !hasNameOnlyB) {
    return ascending ? -1 : 1;
  }
  if (!hasNameOnlyA && hasNameOnlyB) {
    return ascending ? 1 : -1;
  }
  return lvCollator.compare(nameA, nameB);
}

function compareFlags(a, b, colCode, ascending) {
  const flagA = a[colCode];
  const flagB = b[colCode];

  const flagIdA = typeof flagA === 'string' ? flagA : flagA.id;
  const flagIdB = typeof flagB === 'string' ? flagB : flagB.id;

  const flagNameA = flagA.name;
  const flagNameB = flagB.name;

  const hasNameOnlyA = isValidString(flagNameA) && !isValidString(flagIdA);
  const hasNameOnlyB = isValidString(flagNameB) && !isValidString(flagIdA);

  const isFlagAEmpty = isItemEmpty(flagA, flagIdA, flagNameA);
  const isFlagBEmpty = isItemEmpty(flagB, flagIdB, flagNameB);

  const orderComparison = compareOrder(flagA, flagB, ascending, (i) => i.order);
  if (orderComparison !== 0) return orderComparison;

  // flags with names stay on top by default
  const nameComparison = compareExistence(flagNameA, flagNameB, ascending);
  if (nameComparison !== 0) return nameComparison;

  // icons that don't appear defined are at the bottom with icons that are ACTUALLY not defined
  const flagExistanceComparison = compareExistence(isFlagAEmpty, isFlagBEmpty, ascending);
  if (flagExistanceComparison !== 0) return flagExistanceComparison;

  // flags with only a name stay right below flags with names
  const nameOnlyComparison = compareFlagNames(
    flagNameA,
    flagNameB,
    hasNameOnlyA,
    hasNameOnlyB,
    ascending
  );
  if (nameOnlyComparison !== 0) return nameOnlyComparison;

  return lvCollator.compare(flagIdA, flagIdB);
}

function compareNumber(a, b, colCode) {
  const preparedA = a[colCode] || 0;
  const preparedB = b[colCode] || 0;
  return preparedA - preparedB;
}

function compareStrip(a, b, colCode) {
  const preparedA = foldToAscii(a[colCode]?.toString().toLowerCase()) || '';
  const preparedB = foldToAscii(b[colCode]?.toString().toLowerCase()) || '';
  return +(preparedA > preparedB) || -(preparedA < preparedB);
}

function getFullName(person) {
  return isValidString(person.firstName) && isValidString(person.lastName)
    ? (getLowercaseString(person.firstName) + getLowercaseString(person.lastName)).replace(
        /\s/g,
        ''
      )
    : '';
}

function compareStructures(personA, personB, ascending) {
  if (Array.isArray(personA) && !Array.isArray(personB)) {
    return ascending ? -1 : 1;
  }
  if (!Array.isArray(personA) && Array.isArray(personB)) {
    return ascending ? 1 : -1;
  }
  return 0;
}

// compare persons, who are partially defined i.e. ones that don't have a full name, yet have a description,
// and persons, who have neither and appear undefined, but may have other attributes
function comparePartialExistance(nameA, descriptionA, nameB, descriptionB, ascending) {
  if (!nameA && descriptionA && !nameB && !descriptionB) {
    return ascending ? -1 : 1;
  }
  if (!nameA && !descriptionA && !nameB && descriptionB) {
    return ascending ? 1 : -1;
  }
  if (!nameA && !descriptionA && !nameB && !descriptionB) {
    return 0;
  }
  return 0;
}

function comparePersonsColumn(personA, personB, ascending) {
  const fullNameA = getFullName(personA);
  const fullNameB = getFullName(personB);

  const hasFullNameA = isValidString(fullNameA);
  const hasFullNameB = isValidString(fullNameB);

  const hasDescriptionA = isValidString(personA.description);
  const hasDescriptionB = isValidString(personB.description);

  // persons with full name are on top by default
  const fullNameComparison = compareExistence(hasFullNameA, hasFullNameB, ascending);
  if (fullNameComparison !== 0) return fullNameComparison;

  // person object arrays stay right below regular person objects
  const structureComparison = compareStructures(personA, personB, ascending);
  if (structureComparison !== 0) return structureComparison;

  // persons with descriptions, yet no name, stay above persons who don't appear defined
  const existanceComparison = comparePartialExistance(
    hasFullNameA,
    hasDescriptionA,
    hasFullNameB,
    hasDescriptionB,
    ascending
  );
  if (existanceComparison !== 0) return existanceComparison;

  const orderComparison = compareOrder(personA, personB, ascending, (p) => p.order);
  if (orderComparison !== 0) return orderComparison;

  if (hasFullNameA && hasFullNameB) {
    return lvCollator.compare(fullNameA, fullNameB);
  }
  return 0;
}

function sortPersonsArray(personsArray, ascending) {
  return [...personsArray].sort((a, b) => {
    const result = comparePersonsColumn(a, b, ascending);
    return ascending ? result : -result;
  });
}

function comparePersons(a, b, colCode, ascending) {
  const personA = a[colCode];
  const personB = b[colCode];

  if (Array.isArray(personA) && Array.isArray(personB)) {
    const sortedA = sortPersonsArray(personA, ascending);
    const sortedB = sortPersonsArray(personB, ascending);

    return comparePersonsColumn(sortedA[0], sortedB[0]);
  }
  return comparePersonsColumn(personA, personB, ascending);
}

function compareIconLabels(labelA, labelB, ascending) {
  if (labelA && !labelB) {
    return ascending ? -1 : 1;
  }
  if (!labelA && labelB) {
    return ascending ? 1 : -1;
  }
  if (labelA && labelB) {
    return lvCollator.compare(labelA.toLowerCase(), labelB.toLowerCase());
  }
  return 0;
}

function compareIcons(a, b, colCode, ascending) {
  const iconA = a[colCode];
  const iconB = b[colCode];

  const iconNameA = typeof iconA === 'string' ? iconA : iconA.icon;
  const iconNameB = typeof iconB === 'string' ? iconB : iconB.icon;

  const labelA = iconA.label;
  const labelB = iconB.label;

  const isIconAEmpty = isItemEmpty(iconA, iconNameA, labelA);
  const isIconBEmpty = isItemEmpty(iconB, iconNameB, labelB);

  const orderComparison = compareOrder(iconA, iconB, ascending, (i) => i.order);
  if (orderComparison !== 0) return orderComparison;

  // icons with labels show on top by default
  const labelComparison = compareIconLabels(labelA, labelB, ascending);
  if (labelComparison !== 0) return labelComparison;

  // icons that don't appear defined are at the bottom with icons that are ACTUALLY not defined
  const iconExistanceComparison = compareExistence(isIconAEmpty, isIconBEmpty, ascending);
  if (iconExistanceComparison !== 0) return iconExistanceComparison;

  const valueA = (typeof iconA === 'object' ? iconA.icon : iconA) || '';
  const valueB = (typeof iconB === 'object' ? iconB.icon : iconB) || '';
  return lvCollator.compare(valueA, valueB);
}

function compareBoolean(a, b, colCode) {
  const aBool = a[colCode];
  const bBool = b[colCode];

  if (aBool && !bBool) {
    return -1;
  }
  if (!aBool && bBool) {
    return 1;
  }
  return 0;
}

function defaultComparison(a, b, colCode) {
  if (props.sortingMode === 'default') {
    return lvCollator.compare(
      a[colCode]?.toString().toLowerCase(),
      b[colCode]?.toString().toLowerCase()
    );
  }
  if (props.sortingMode === 'strip') {
    return compareStrip(a, b, colCode);
  }
  return 0;
}

function compare(ascending) {
  const colCode = Object.keys(sortedColumns.value)[0];
  const colDefinition = columnsComputed.value.find((item) => item.id === colCode);

  if (!colDefinition) {
    return () => 0;
  }

  return function compareRows(a, b) {
    let ret = 0;
    if (colDefinition.type !== 'bool' && colDefinition.type !== 'boolean') {
      if (!a[colCode] && props.sortingIgnoreEmpty) {
        return 1;
      }
      if (!b[colCode] && props.sortingIgnoreEmpty) {
        return -1;
      }
    }

    switch (colDefinition.type) {
      case 'person':
        ret = comparePersons(a, b, colCode, ascending);
        break;
      case 'icon':
        ret = compareIcons(a, b, colCode, ascending);
        break;
      case 'number':
      case 'decimal':
      case 'float':
        ret = compareNumber(a, b, colCode);
        break;
      case 'flag':
      case 'country':
        ret = compareFlags(a, b, colCode, ascending);
        break;
      case 'bool':
      case 'boolean':
        ret = compareBoolean(a, b, colCode);
        break;
      default:
        ret = defaultComparison(a, b, colCode);
        break;
    }

    return ascending ? ret : -ret;
  };
}

function primaryColumn() {
  let clickableObject = null;
  let primaryObject = null;

  columnsComputed.value.forEach((obj) => {
    if (obj.kind === 'clickable' && !clickableObject) {
      clickableObject = obj;
    } else if (obj.kind === 'primary' && !primaryObject) {
      primaryObject = obj;
    }
  });

  return clickableObject || primaryObject || columnsComputed.value[0];
}

// Used to format LxAppendableList header names correctly
function primaryColumnDisplayAttribute() {
  return `_lx_${primaryColumn()?.attributeName}`;
}

const rows = computed(() => {
  if (!props.items) return [];

  const primaryAttributeName = primaryColumn()?.attributeName;
  const primaryAttributeNameHeaders = primaryColumnDisplayAttribute();
  const primaryType = primaryColumn()?.type;
  const { idAttribute } = props;

  // Single pass: transform each row and detect duplicate IDs at once.
  const seenIds = idAttribute ? new Set() : null;
  let hasDuplicates = false;

  let ret = props.items.map((row) => {
    if (seenIds) {
      const id = row?.[idAttribute];
      if (!hasDuplicates) {
        if (seenIds.has(id)) hasDuplicates = true;
        else seenIds.add(id);
      }
    }
    // If the primary column is an array display it as a string to ensure clickability, except for "person" type
    if (Array.isArray(row[primaryAttributeName]) && primaryType !== 'person') {
      if (
        typeof row[primaryAttributeName][0] === 'object' ||
        row[primaryAttributeName].length === 0
      ) {
        return {
          ...row,
          [primaryAttributeName]: formatValueArray(row[primaryAttributeName]),
          [primaryAttributeNameHeaders]: formatValueArray(row[primaryAttributeName]),
        };
      }
      return {
        ...row,
        [primaryAttributeName]: row[primaryAttributeName],
        [primaryAttributeNameHeaders]: row[primaryAttributeName].join(', '),
      };
    }
    return { ...row, [primaryAttributeNameHeaders]: row[primaryAttributeName] };
  });

  const colCode = Object.keys(sortedColumns.value)[0];
  if (sortedColumns.value[colCode] && props.sortingSide === 'client') {
    if (sortedColumns.value[colCode] === 'asc') {
      ret = ret.sort(compare(true));
    } else {
      ret = ret.sort(compare(false));
    }
  }
  if (hasDuplicates) {
    logError(
      `LxDataGrid [${props.id}]: Duplicate row IDs found in items. Please ensure that each item has a unique ID for the attribute "${idAttribute}"`,
      useLx().getGlobals()?.environment
    );
  }
  return ret;
});

const rowsWithVirtualKey = computed(() => {
  const seenById = new Map();
  return (rows.value || []).map((row, index) => {
    const baseId = row?.[props.idAttribute] ?? index;
    const duplicateCount = (seenById.get(baseId) || 0) + 1;
    seenById.set(baseId, duplicateCount);
    return {
      // Detach the row from Vue's reactive Proxy. Every `row[col.attributeName]`
      // access in the cell template would otherwise hit the Proxy machinery;
      // for ~17 visible × N cells × multiple field reads per render, that
      // overhead adds up. Assumes the parent treats `items` as immutable —
      // mutating a row field in place would no longer trigger a re-render.
      row: toRaw(row),
      rowIndex: index,
      virtualKey: duplicateCount === 1 ? `${baseId}` : `${baseId}__dup_${duplicateCount}`,
    };
  });
});

const wantsDataGridVirtualization = computed(
  () =>
    props.hasVirtualization &&
    !props.loading &&
    rows.value.length > 0 &&
    isDataGridLayoutVisible.value
);

const {
  virtualizer: dataGridVirtualizer,
  isActive: shouldVirtualizeDataGrid,
  totalSize: dataGridVirtualTotalSize,
  virtualItems: dataGridVirtualItems,
  scrollMargin: dataGridScrollMargin,
  measureElement: measureDataGridVirtualElement,
  measureElements: measureDataGridVirtualElements,
  updateScrollContext: updateDataGridScrollContext,
  scheduleLayoutUpdate: scheduleDataGridLayoutUpdate,
  syncVirtualizationContext: syncDataGridVirtualizationContext,
  clearVirtualizer: clearDataGridVirtualization,
  cleanup: cleanupDataGridVirtualization,
} = useScrollVirtualizer({
  enabled: wantsDataGridVirtualization,
  scrollParentSourceRef: container,
  scrollAnchorRef: container,
  positionObserverRef: dataGridWrapperRef,
  resolveScrollParent: resolveDataGridScrollParent,
  createVirtualizerOptions: ({ scrollMargin }) => ({
    get count() {
      if (!wantsDataGridVirtualization.value) return 0;
      return rows.value?.length || 0;
    },
    getItemKey: (index) => rowsWithVirtualKey.value?.[index]?.virtualKey ?? index,
    get scrollMargin() {
      return scrollMargin.value;
    },
    estimateSize: () => VIRTUALIZED_ESTIMATED_ROW_HEIGHT,
    shouldAdjustScrollPositionOnItemSizeChange: () => false,
    overscan: VIRTUALIZED_OVERSCAN,
  }),
});

function handleDataGridResize() {
  syncDataGridLayoutVisibility();
  scheduleDataGridLayoutUpdate();
  scheduleBoundingUpdate();
}

const displayedRows = computed(() => {
  if (shouldVirtualizeDataGrid.value) {
    const scrollMargin = dataGridScrollMargin.value;
    const rowsByIndex = rowsWithVirtualKey.value;
    return dataGridVirtualItems.value
      .map((virtualRow) => {
        const entry = rowsByIndex?.[virtualRow.index];
        if (!entry?.row) return null;
        return {
          row: entry.row,
          rowIndex: virtualRow.index,
          rowKey: entry.virtualKey,
          style: { transform: `translateY(${virtualRow.start - scrollMargin}px)` },
        };
      })
      .filter(Boolean);
  }

  // Virtualization opted in but not yet initialized: render nothing instead of
  // mounting every item just to discard it once the virtualizer activates.
  if (props.hasVirtualization) {
    return [];
  }

  return rowsWithVirtualKey.value.map((entry) => ({
    row: entry.row,
    rowIndex: entry.rowIndex,
    rowKey: entry.virtualKey,
    style: null,
  }));
});

const dataGridContentStyle = computed(() => {
  if (!shouldVirtualizeDataGrid.value) return null;
  return {
    height: `${dataGridVirtualTotalSize.value}px`,
    position: 'relative',
  };
});

// Re-measures the currently rendered rows in place to settle initial heights
// once layout and web fonts are final — the first measurement can run before
// column widths/fonts are ready, which otherwise only corrects on scroll.
function remeasureRenderedDataGridRows() {
  if (!shouldVirtualizeDataGrid.value || !container.value) return;
  const rowElements = container.value.querySelectorAll('.lx-grid-content-virtualized .lx-grid-row');
  measureDataGridVirtualElements(rowElements);
}

// Schedules a frame callback, skipping it where requestAnimationFrame is absent (SSR / torn-down test DOM).
function scheduleFrame(callback) {
  if (typeof globalThis.requestAnimationFrame !== 'function') return;
  globalThis.requestAnimationFrame(callback);
}

const pagesTotal = computed(() => Math.ceil(props.itemsTotal / props.itemsPerPage));

const itemsLabel = computed(() => {
  const num = rows.value.length;
  let numDisplay = num.toString();
  let label = displayTexts.value.items.plural;
  if (props.hasPaging && pagesTotal.value) {
    const numStarting = props.pageCurrent * props.itemsPerPage + 1;
    let numEnding =
      Number(props.pageCurrent) * Number(props.itemsPerPage) + Number(props.itemsPerPage);
    if (numEnding > props.itemsTotal) numEnding = props.itemsTotal;
    numDisplay = `${numStarting}-${numEnding}`;

    return `${displayTexts.value.ofItems.label} ${numDisplay} ${displayTexts.value.of} ${props.itemsTotal}`;
  }
  if (num === 1) {
    label = displayTexts.value.items.singular;
  } else if (num > 20 && (num % 10 === 2 || num % 10 === 3 || num % 10 === 4)) {
    label = displayTexts.value.items.endingWith234;
  } else if (num > 11 && num % 10 === 1) {
    label = displayTexts.value.items.endingWith1;
  }
  return `${numDisplay} ${label}`;
});

const selectedLabel = computed(() => {
  const num = selectedRows.value.length;
  const numDisplay = num.toString();
  let label = displayTexts.value.items.plural;
  let labelStart = displayTexts.value.selected.plural;
  let ret = numDisplay;

  if (num === 1) {
    label = displayTexts.value.items.singular;
    labelStart = displayTexts.value.selected.singular;
  } else if (num > 20 && (num % 10 === 2 || num % 10 === 3 || num % 10 === 4)) {
    label = displayTexts.value.items.endingWith234;
    labelStart = displayTexts.value.selected.endingWith234;
  } else if (num > 11 && num % 10 === 1) {
    label = displayTexts.value.items.endingWith1;
    labelStart = displayTexts.value.selected.endingWith1;
  }
  ret = `${labelStart} ${numDisplay} ${label} ${displayTexts.value.of} ${props.itemsTotal}`;

  return ret;
});

const hasActionButtons = computed(() => props.actionDefinitions?.length > 0);

const itemsCountSelector = computed(() => [10, 20, 30, 40, 50]);

const rowCount = computed(() => rows.value.length);
const colCount = computed(() => gridColumnsDisplay.value.length);

function changeItemsPerPage(value) {
  emits('itemsPerPageChange', value);
}

function arrayToObject(arr) {
  const ret = {};
  arr.forEach((o) => {
    ret[o] = true;
  });
  return ret;
}

function selectRows(arr = null) {
  if (arr === null) {
    selectedRowsRaw.value = arrayToObject(props.items?.map((x) => x[props.idAttribute].toString()));
  } else {
    selectedRowsRaw.value = arrayToObject(arr.map((x) => x[props.idAttribute].toString()));
  }
}

function sortBy(columnCode, direction = 'asc') {
  if (!isDisabled.value) {
    sortedColumns.value = {};
    if (props.hasSorting) {
      if (direction === 'asc') setSorting(columnCode, 'asc');
      else if (direction === 'desc') setSorting(columnCode, 'desc');
      else setSorting(columnCode, null);
    }
  }
}

function getAriaSorting(sortDirection) {
  if (sortDirection === 'asc') return 'ascending';
  if (sortDirection === 'desc') return 'descending';
  return 'none';
}

const autoSearchMode = computed(() => {
  if (props.searchMode === 'compact') {
    return 'compact';
  }
  if (props.searchMode === 'default' && !props.hasSelecting) {
    return 'default';
  }
  return 'compact';
});

function toolbarClick(action) {
  if (selectedRows.value.length === 0) {
    emits('toolbarActionClick', action);
  } else {
    handleSelectionActionClick(action, selectedRows.value);
  }
}

const actionDefinitionsGroup = computed(() => props.actionDefinitions?.slice(1));

function getRowVisibleActions(row) {
  return props.actionDefinitions?.filter((a) =>
    a.visibleByAttribute ? row[a.visibleByAttribute] : true
  );
}

function getRowActionDefinitionsGroup(row) {
  return actionDefinitionsGroup.value
    .filter((a) => (a.visibleByAttribute ? row[a.visibleByAttribute] : true))
    .map((a) => {
      const action = a;
      return {
        ...action,
        disabled:
          isDisabled.value ||
          action.disabled ||
          (action.enableByAttribute ? !row[action.enableByAttribute] : false),
      };
    });
}

function emptyStateActionClicked(actionName) {
  emits('emptyStateActionClick', actionName);
}

const shouldShowIconRow = computed(() => {
  const iconColumns = columnsComputed.value?.filter((col) => col.type === 'icon');
  const extraIconColumns = iconColumns?.filter((col) => col.kind === 'extra');
  return (
    iconColumns.length > 0 &&
    (props.showAllColumns || extraIconColumns.length !== iconColumns.length)
  );
});

const gridColumnWidths = {
  xs: 'minmax(4rem, 1fr)',
  s: 'minmax(10rem, 2.5fr)',
  m: 'minmax(12rem, 3fr)',
  l: 'minmax(20rem, 5fr)',
  xl: 'minmax(30rem, 7.5fr)',
  '*': 'minmax(auto, 20fr)',
};

function modifyColumn(templateColumns, condition, columnValue, prepend) {
  const index = templateColumns.indexOf(columnValue);
  if (condition && index === -1) {
    if (prepend) {
      templateColumns.unshift(columnValue);
    } else {
      templateColumns.push(columnValue);
    }
  } else if (!condition && index !== -1) {
    templateColumns.splice(index, 1);
  }
}

function updateGridTemplateColumns() {
  const templateColumns = columnsComputed.value
    .filter((col) => props.showAllColumns || col.kind !== 'extra')
    .map((col) => gridColumnWidths[col.size] || 'auto');

  const actionColumnWidth = props.actionDefinitions?.length > 1 ? '5rem' : '2.5rem';

  modifyColumn(templateColumns, hasActionButtons.value, actionColumnWidth, false);
  modifyColumn(templateColumns, props.hasSelecting, '3rem', true);

  gridTemplateColumns.value = templateColumns.join(' ');
}

function syncColumnWidths() {
  if (!header.value || !container.value) return;

  if (props.loading) container.value.style.gridTemplateColumns = 'auto';
  autoScrollable.value = false;

  // without this if, totalWidth will be calculate assuming its possible to scroll and * size columns will be too wide
  if (props.scrollable === 'auto') {
    container.value.classList.remove('lx-scrollable');
  }

  const { children } = header.value;
  let totalWidth = 0;

  Array.from(children).forEach((child) => {
    totalWidth += child.getBoundingClientRect().width;
  });

  if (totalWidth > container.value.getBoundingClientRect().width && props.scrollable === 'auto') {
    autoScrollable.value = true;
    container.value.style.gridTemplateColumns = 'auto';
    container.value.classList.add('lx-scrollable');
  } else {
    autoScrollable.value = false;
  }

  const headerColumns = Array.from(header.value.children).filter(
    (col) => col.getBoundingClientRect().width > 0
  );

  const columnWidths = headerColumns
    .map((col) => `${col.getBoundingClientRect().width}px`)
    .join(' ');

  container.value.style.setProperty('--lx-data-grid-template-columns', columnWidths);
  container.value.style.gridTemplateColumns = columnWidths;

  if (shouldVirtualizeDataGrid.value) {
    dataGridVirtualizer.value?.value.measure();
  }
}

function calculateOffset(el) {
  const rowRems = getComputedStyle(el).getPropertyValue('--row-size').trim();
  const { fontSize } = getComputedStyle(el);

  return Number.parseInt(rowRems, 10) * Number.parseFloat(fontSize);
}

function getInlineDisplayValue(styleText = '') {
  const displayMatch = styleText.match(/(?:^|;)\s*display\s*:\s*([^;]+)/i);
  return displayMatch?.[1]?.trim() || '';
}

const topOutOfBounds = computed(() => {
  const keyOpacity = '--grid-top-shadow-opacity';
  const keySize = '--grid-header-size';
  const limit = 100;
  const headerHeight = headerSize.height?.value || 0;

  if (!container.value || !header.value) {
    return `${keyOpacity}: 0; ${keySize}: ${headerHeight}px;`;
  }

  const v = bounding.top ? bounding.top.value - calculateOffset(container.value) : 0;

  if (v < 0 - limit) {
    return `${keyOpacity}: 1; ${keySize}: ${headerHeight}px;`;
  }
  if (v < 0) {
    return `${keyOpacity}: ${(0 - v) / limit}; ${keySize}: ${headerHeight}px;`;
  }
  return `${keyOpacity}: 0; ${keySize}: ${headerHeight}px;`;
});

const fullBleedMargin = computed(() => {
  if (
    !props.fullBleed ||
    !props.scrollable ||
    !props.showAllColumns ||
    !lxElement ||
    dataGridWrapperRef.value?.closest('#modals') ||
    dataGridWrapperRef.value?.closest('.lx-form-grid') ||
    width.value <= 1920
  ) {
    return `--grid-left-margin: var(--space-0); --grid-right-margin: var(--space-0);`;
  }

  const bodyColWidth = Number.parseFloat(
    getComputedStyle(lxElement).getPropertyValue('--body-column-size')
  );

  const isDefaultLayout = !!lxElement.querySelector('.lx-layout-default');

  const gapRem = isDefaultLayout ? 1 : 3;
  const gapPx = gapRem * rootFontSize;

  const navBarWidth = isDefaultLayout
    ? Number.parseFloat(getComputedStyle(lxElement).getPropertyValue('--aside-size')) *
        rootFontSize || 0
    : 0;

  const baseMargin = -((width.value - bodyColWidth) / 2 - gapPx);

  const leftMargin = isDefaultLayout ? baseMargin + navBarWidth : baseMargin;
  const rightMargin = baseMargin;

  return `--grid-left-margin: ${leftMargin}px; --grid-right-margin: ${rightMargin}px;`;
});

const reactiveSearchString = computed({
  get() {
    return props.searchString;
  },
  set(value) {
    emits('update:searchString', value);
  },
});

function search(string) {
  if (props.searchSide === 'server') {
    emits('search', string);
  }
}

watch(
  [
    columnsComputed,
    () => hasActionButtons.value,
    () => props.showAllColumns,
    () => props.hasSelecting,
  ],
  () => {
    updateGridTemplateColumns();
    nextTick(() => {
      syncColumnWidths();
    });
  },
  { immediate: true }
);

watch(
  [() => props.scrollable, () => props.loading],
  () => {
    nextTick(() => {
      syncColumnWidths();
    });
  },
  { immediate: true }
);

watch(wantsDataGridVirtualization, async (value) => {
  if (!value) {
    clearDataGridVirtualization();
    return;
  }

  await nextTick();
  syncDataGridLayoutVisibility();
  if (!wantsDataGridVirtualization.value) return;
  await syncDataGridVirtualizationContext({ reloadOnScrollParentChange: true });
});

watch([rows, () => props.loading], async () => {
  await nextTick();
  syncDataGridLayoutVisibility();
  if (!wantsDataGridVirtualization.value) return;
  updateDataGridScrollContext();
  dataGridVirtualizer.value?.value.measure();
  scheduleFrame(() => remeasureRenderedDataGridRows());
});

watch([width, height], async () => {
  await nextTick();
  syncDataGridLayoutVisibility();
  syncColumnWidths();
  if (!wantsDataGridVirtualization.value) return;
  await syncDataGridVirtualizationContext({ reloadOnScrollParentChange: true });
  scheduleFrame(() => remeasureRenderedDataGridRows());
});

useMutationObserver(
  dataGridWrapperRef,
  (mutations) => {
    const mutation = mutations[0];
    const target = mutation?.target;
    const previousDisplay = getInlineDisplayValue(mutation?.oldValue || '');
    const nextDisplay = target instanceof HTMLElement ? target.style.display : '';

    if (
      mutation &&
      mutation.attributeName === 'style' &&
      previousDisplay !== nextDisplay &&
      nextDisplay === ''
    ) {
      syncDataGridLayoutVisibility();
      syncColumnWidths();
      if (wantsDataGridVirtualization.value) {
        updateDataGridScrollContext();
        dataGridVirtualizer.value?.value.measure();
      }
    }
  },
  { attributes: true, childList: false, attributeFilter: ['style'], attributeOldValue: true }
);

watch(
  () => props.items,
  () => {
    if (props.hasSelecting) {
      Object.keys(selectedRowsRaw.value).forEach((key) => {
        if (!props.items.some((x) => x[props.idAttribute].toString() === key)) {
          delete selectedRowsRaw.value[key];
        }
      });
    }
  }
);

onMounted(() => {
  if (props.items && !props.idAttribute) {
    throw new Error(`LxDataGrid [${props.id}]: "idAttribute" prop is required`);
  }

  globalThis.addEventListener('resize', handleDataGridResize);
  globalThis.addEventListener('scroll', scheduleBoundingUpdate, {
    capture: true,
    passive: true,
  });

  watch(
    () => props.loading,
    (newValue, oldValue) => {
      if (oldValue !== undefined) {
        showLoadingAlert.value = true;
      }
      if (!newValue) {
        nextTick(() => {
          syncContainerScroll();
        });
      }
    },
    { immediate: false }
  );

  nextTick(async () => {
    syncDataGridLayoutVisibility();
    if (!wantsDataGridVirtualization.value) return;
    await syncDataGridVirtualizationContext({ reloadOnScrollParentChange: true });
    // Settle initial row heights after the first layout frame and after web
    // fonts finish loading, both of which can change row height after the
    // virtualizer's first measurement.
    scheduleFrame(() => remeasureRenderedDataGridRows());
    globalThis.document?.fonts?.ready?.then(() => remeasureRenderedDataGridRows());
  });
});

onBeforeUnmount(() => {
  globalThis.removeEventListener('resize', handleDataGridResize);
  globalThis.removeEventListener('scroll', scheduleBoundingUpdate, { capture: true });

  if (pendingHeaderScrollRaf !== null) {
    globalThis.cancelAnimationFrame(pendingHeaderScrollRaf);
    pendingHeaderScrollRaf = null;
  }
  if (pendingContainerScrollRaf !== null) {
    globalThis.cancelAnimationFrame(pendingContainerScrollRaf);
    pendingContainerScrollRaf = null;
  }
  if (pendingBoundingRaf !== null) {
    globalThis.cancelAnimationFrame(pendingBoundingRaf);
    pendingBoundingRaf = null;
  }
  cleanupDataGridVirtualization();
});

const isMenuOpen = computed(() =>
  Array.from(dropDownMenus.values()).some((menu) => menu?.menuOpen)
);

const manyRowsSelected = computed(
  () => Object.values(selectedRowsRaw.value).filter(Boolean).length > 1
);

const isDateType = (type) => type === 'date' || type === 'dateTime' || type === 'dateTimeFull';

const isRenderableTextType = (type) =>
  !['state', 'rating', 'array', 'flag', 'country', 'person', 'icon'].includes(type);

const handleClick = (col, row) => {
  if (props.defaultActionName && col.kind === 'clickable' && !isDisabled.value) {
    defaultActionClicked(row[props.idAttribute], row);
  }
};

const handleKey = (col, row) => {
  if (props.defaultActionName && col.kind === 'clickable') {
    defaultActionClicked(row[props.idAttribute], row);
  }
};

const handleCellKey = (event, col, row) => {
  if (event.target !== event.currentTarget) return;

  if (isRenderableTextType(col.type) && col.kind === 'clickable') {
    handleKey(col, row);
  }
};

function handleHeaderClick(colId, colIndex) {
  sortColumn(colId);
  setActiveFromClick(0, props.hasSelecting ? colIndex + 1 : colIndex);
}

function getGridRowIndex(rowIndex) {
  return props.hasSorting ? Number(rowIndex) + 1 : Number(rowIndex);
}

function handleMenuClick(rowIndex, rowKey) {
  setActiveFromClick(
    getGridRowIndex(rowIndex),
    props.hasSelecting ? colCount.value + 2 : colCount.value + 1,
    false
  );

  dropDownMenus.get(rowKey)?.openMenu();
}

watch(
  () => props.selectionKind,
  (newKind) => {
    if (newKind === 'single' && props.hasSelecting && manyRowsSelected.value) {
      selectedRowsRaw.value = {};
      emits('selectionChange', []);
    }
  }
);

const isToolbarVisible = computed(() => {
  const hasValidToolbarActionDefinitions =
    props.toolbarActionDefinitions && props.toolbarActionDefinitions.length > 0;
  const isToolbarSlotUsed = !!slots.toolbar;

  return (
    props.hasSelecting ||
    (props.showToolbar &&
      (hasValidToolbarActionDefinitions || isToolbarSlotUsed || props.hasSearch))
  );
});

const computedGridHeaderColumnCount = computed(() => {
  const selectingColumn = props.hasSelecting ? 0 : 1;
  const actionButtonsColumn = hasActionButtons.value ? 1 : 0;
  return colCount.value + actionButtonsColumn - selectingColumn;
});

const computedGridColumnCount = computed(() => {
  const actionColumns = hasActionButtons.value ? Math.min(props.actionDefinitions.length, 2) : 0;
  const selectingColumn = props.hasSelecting ? 0 : 1;
  return colCount.value + actionColumns - selectingColumn;
});

const toolbarRef = ref(null);
const { height: toolbarHeight } = useElementSize(toolbarRef);

const stickyToolbarAdditionalHeight = computed(() => {
  if (!props.stickyToolbar) return '';
  return `--sticky-toolbar-additional-height: calc(${Math.floor(
    toolbarHeight.value
  )}px - var(--row-size));`;
});
defineExpose({ cancelSelection, selectRows, sortBy });
</script>
<template>
  <div
    ref="dataGridWrapperRef"
    class="lx-data-grid-wrapper"
    :style="`${topOutOfBounds} ${fullBleedMargin} ${stickyToolbarAdditionalHeight}`"
    :class="[{ 'lx-grid-sticky': stickyHeader }, { 'lx-grid-sticky-toolbar': props.stickyToolbar }]"
  >
    <header v-if="showHeader">
      <div class="heading-2" :id="`${id}-label`">{{ label }}</div>
      <p :id="`${id}-description`" class="lx-description">{{ description }}</p>
      <div v-if="badgeDefinitions?.length > 0" class="lx-grid-badge-wrapper">
        <LxBadge
          v-for="badge in badgeDefinitions"
          :key="badge?.id"
          :id="badge?.id"
          :icon="badge?.icon"
          :iconSet="badge?.iconSet"
          :value="badge?.name || badge?.label || badge?.value"
          :tooltip="badge?.title || badge?.tooltip"
          :type="badge?.type"
        />
      </div>
    </header>

    <div
      v-if="isToolbarVisible"
      ref="toolbarRef"
      :class="[{ 'lx-sticky-toolbar-list-wrapper': props.stickyToolbar }]"
    >
      <LxToolbar
        class="lx-grid-toolbar lx-floating-toolbar"
        :class="[{ 'lx-selection-toolbar': hasSelecting && selectedRows && selectedRows.length }]"
        :id="`${id}-toolbar`"
        :actionDefinitions="toolbarActions"
        :disabled="busy"
        :loading="loading"
        :busy="busy"
        :hasSearch="hasSearch"
        :searchSide="searchSide"
        :searchMode="autoSearchMode"
        v-model:searchString="reactiveSearchString"
        :hasSelectAll="hasSelecting && (selectionKind !== 'single' || selectedRows.length > 0)"
        :selectionState="selectionState"
        selectAllSide="left"
        :texts="{
          ...displayTexts,
          clear: displayTexts.clearSearch,
          clearSelected: displayTexts.clear,
        }"
        :sticky="stickyToolbar"
        :wrapperRef="dataGridWrapperRef"
        @actionClick="toolbarClick"
        @search="search"
        @selectAll="selectRows"
        @deselectAll="cancelSelection"
      >
        <template #leftArea>
          <slot
            v-if="(hasSelecting && selectedRows?.length === 0) || !hasSelecting"
            name="leftToolbar"
          />

          <p v-if="hasSelecting && selectedRows && selectedRows.length !== 0">
            {{ selectedLabel }}
          </p>
        </template>

        <template
          #rightArea
          v-if="(!hasSelecting && props.showToolbar) || (hasSelecting && selectedRows.length === 0)"
        >
          <slot name="toolbar" />
        </template>

        <template #rightArea v-else-if="hasSelecting && selectedRows.length > 0">
          <div class="selection-action-button-toolbar">
            <div class="selection-action-buttons">
              <LxButton
                v-for="selectAction in selectionActionDefinitions"
                :key="selectAction.id"
                :id="selectAction.id"
                :label="selectAction.name || selectAction.label"
                :title="selectAction.title || selectAction.tooltip"
                :icon="selectAction.icon"
                :iconSet="selectAction.iconSet"
                :loading="selectAction.loading"
                :busy="selectAction.busy"
                :destructive="selectAction.destructive"
                :disabled="selectAction.disabled || busy || loading"
                :active="selectAction.active"
                :badge="selectAction.badge"
                :badge-type="selectAction.badgeType"
                :badgeIcon="selectAction.badgeIcon"
                :badgeTitle="selectAction.badgeTitle"
                kind="ghost"
                @click="handleSelectionActionClick(selectAction.id, selectedRows)"
              />
            </div>
            <div
              class="selection-action-buttons-small"
              v-if="selectionActionDefinitions?.length > 0"
            >
              <LxDropDownMenu
                :actionDefinitions="selectionActionDefinitions"
                :disabled="isDisabled"
                @actionClick="(id) => handleSelectionActionClick(id, selectedRows)"
              >
                <LxButton
                  icon="menu"
                  kind="ghost"
                  :label="displayTexts.overflowMenu"
                  variant="icon-only"
                  tabindex="-1"
                  :disabled="isDisabled"
                />
              </LxDropDownMenu>
            </div>
          </div>
        </template>
      </LxToolbar>
    </div>

    <div
      class="lx-grid-header-wrapper"
      aria-hidden="false"
      @keydown="(e) => onKeydown(e, rowCount, computedGridHeaderColumnCount)"
    >
      <div
        ref="header"
        class="lx-grid-row"
        role="toolbar"
        :style="{ gridTemplateColumns: !loading ? gridTemplateColumns : '' }"
        :tabindex="-1"
        @scroll="scheduleContainerScroll"
      >
        <div
          v-if="hasSelecting"
          class="lx-cell-header lx-cell-selector"
          :tabindex="hasSorting ? getTabIndex(0, 0) : null"
          :ref="(el) => (hasSorting ? registerCell(el, 0, 0) : null)"
        />
        <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
        <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus-->
        <div
          v-for="(col, colIndex) in gridColumnsDisplay"
          :key="col.id"
          :title="formatTooltip(col.name, col.title, sortedColumns[col.id], col.sortingTooltips)"
          class="lx-cell-header"
          :aria-sort="getAriaSorting(sortedColumns[col.id])"
          :aria-label="
            formatTooltip(col.name, col.title, sortedColumns[col.id], col.sortingTooltips)
          "
          role="button"
          :tabindex="hasSorting ? getTabIndex(0, hasSelecting ? colIndex + 1 : colIndex) : null"
          :ref="
            (el) =>
              hasSorting ? registerCell(el, 0, hasSelecting ? colIndex + 1 : colIndex) : null
          "
          :class="[
            {
              'lx-cell-number':
                col.type === 'number' || col.type === 'decimal' || col.type === 'float',
            },
            {
              'lx-cell-sortable': hasSorting,
            },
            {
              'lx-cell-sorted': sortedColumns[col.id],
            },
            {
              'lx-cell-extra': col.kind === 'extra',
            },
            {
              'lx-cell-xs': col.size === 'xs',
            },
            {
              'lx-cell-s': col.size === 's',
            },
            {
              'lx-cell-m': col.size === 'm',
            },
            {
              'lx-cell-l': col.size === 'l',
            },
            {
              'lx-cell-xl': col.size === 'xl',
            },
            {
              'lx-cell-stretch': col.size === '*',
            },
          ]"
          @click="handleHeaderClick(col.id, colIndex)"
          @keyup.space.prevent="sortColumn(col.id)"
          @keyup.enter="sortColumn(col.id)"
        >
          <div>
            <p class="lx-primary" v-if="col.size !== 'xs'">{{ col.name }}</p>
            <LxIcon
              value="sort-down"
              v-if="sortedColumns[col.id] === 'desc'"
              :title="
                formatTooltip(col.name, col.title, sortedColumns[col.id], col.sortingTooltips)
              "
            />
            <LxIcon
              value="sort-up"
              v-if="sortedColumns[col.id] === 'asc'"
              :title="
                formatTooltip(col.name, col.title, sortedColumns[col.id], col.sortingTooltips)
              "
            />
            <LxIcon
              value="sort-default"
              v-if="!sortedColumns[col.id]"
              :title="
                formatTooltip(col.name, col.title, sortedColumns[col.id], col.sortingTooltips)
              "
            />
          </div>
        </div>

        <div
          v-if="hasActionButtons"
          class="lx-cell-header lx-cell-action"
          :title="displayTexts.actions"
          :tabindex="hasSorting ? getTabIndex(0, hasSelecting ? colCount + 1 : colCount) : null"
          :ref="
            (el) =>
              hasSorting ? registerCell(el, 0, hasSelecting ? colCount + 1 : colCount) : null
          "
        />
      </div>
    </div>

    <article
      ref="container"
      :id="id"
      class="lx-data-grid"
      :class="[
        { 'lx-scrollable': scrollable === true || autoScrollable === true },
        { 'lx-data-grid-full': showAllColumns },
        { 'lx-loading': loading },
      ]"
      :tabindex="-1"
      @scroll="scheduleHeaderScroll()"
      @keydown="(e) => onKeydown(e, rowCount, computedGridColumnCount, isMenuOpen)"
    >
      <div
        class="lx-grid-table"
        v-show="!loading"
        role="table"
        :aria-labelledby="`${id}-label`"
        :aria-describedby="`${id}-description`"
      >
        <div class="lx-invisible" role="row">
          <div v-if="hasSelecting" class="lx-cell-header" role="columnheader" />
          <div
            v-for="col in gridColumnsDisplay"
            :key="col.id"
            :aria-label="
              formatTooltip(col.name, col.title, sortedColumns[col.id], col.sortingTooltips)
            "
            role="columnheader"
          >
            {{ col.name }}
          </div>
          <div v-if="hasActionButtons" role="columnheader" />
        </div>

        <div
          class="lx-grid-content"
          :class="[{ 'lx-grid-content-virtualized': shouldVirtualizeDataGrid }]"
          :style="dataGridContentStyle"
        >
          <!-- Row focus is handled programmatically by the grid roving-focus manager. -->
          <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
          <div
            v-for="{ row, rowIndex, rowKey, style } in displayedRows"
            class="lx-grid-row"
            :class="[{ 'lx-selected': selectedRowsRaw[row[idAttribute]] && hasSelecting }]"
            :id="`row-${row[idAttribute]}`"
            :style="style"
            :ref="shouldVirtualizeDataGrid ? measureDataGridVirtualElement : null"
            :tabindex="-1"
            role="row"
            :key="rowKey"
            :data-index="shouldVirtualizeDataGrid ? rowIndex : null"
            @dblclick="defaultActionClicked(row[idAttribute], row)"
          >
            <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
            <div
              v-if="hasSelecting"
              class="lx-cell lx-cell-selector"
              role="cell"
              @click="setActiveFromClick(getGridRowIndex(rowIndex), 0)"
            >
              <LxCheckbox
                v-if="selectionKind === 'multiple'"
                :id="`select-${id}-${row[idAttribute]}`"
                v-model="selectedRowsRaw[row[idAttribute]]"
                :value="row[idAttribute]?.toString()"
                :disabled="isDisabled"
                :tabindex="getTabIndex(getGridRowIndex(rowIndex), 0).toString()"
                :ref="(el) => registerCell(el, getGridRowIndex(rowIndex), 0)"
              />
              <LxRadioButton
                v-if="selectionKind === 'single'"
                :id="`select-${id}-${row[idAttribute]}`"
                v-model="selectedRowsRaw[row[idAttribute]]"
                :value="row[idAttribute]?.toString()"
                :disabled="isDisabled"
                :tabindex="getTabIndex(getGridRowIndex(rowIndex), 0)"
                :ref="(el) => registerCell(el, getGridRowIndex(rowIndex), 0)"
                @click="selectRow(row[idAttribute])"
              />
            </div>
            <!-- Since key events are assigned to the whole <div> (lx-grid-row) already -->
            <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
            <div
              v-for="(col, colIndex) in gridColumnsDisplay"
              :key="col.id"
              v-memo="[row, col, gridActiveRow, gridActiveCol, gridActiveItem, isDisabled]"
              class="lx-cell"
              role="cell"
              :tabindex="
                cellIsInteractive(row, col)
                  ? getTabIndex(getGridRowIndex(rowIndex), hasSelecting ? colIndex + 1 : colIndex)
                  : -1
              "
              :ref="
                cellIsInteractive(row, col)
                  ? (el) =>
                      registerCell(
                        el,
                        getGridRowIndex(rowIndex),
                        hasSelecting ? colIndex + 1 : colIndex
                      )
                  : null
              "
              :class="[
                col.cellStaticClass,
                {
                  'lx-cell-link-disabled':
                    (col.kind === 'clickable' && !checkEnableByAttributeName(row)) || isDisabled,
                  'lx-cell-not-delegated': cellIsInteractive(row, col),
                },
              ]"
              @click="
                setActiveFromClick(
                  getGridRowIndex(rowIndex),
                  hasSelecting ? colIndex + 1 : colIndex
                )
              "
              @keydown.space.prevent
              @keyup.enter="(event) => handleCellKey(event, col, row)"
              @keyup.space="(event) => handleCellKey(event, col, row)"
            >
              <component
                v-if="isRenderableTextType(col.type)"
                :is="isDateType(col.type) ? 'time' : 'span'"
                :aria-label="getAriaLabel(col, row)"
                :title="getTextTooltip(col, row)"
                :class="{
                  'lx-cell-tooltip':
                    col.type === 'tooltip-text' || ['xs', 's', 'm'].includes(col.size),
                  'lx-cell-clickable-button':
                    props.clickableRole === 'button' && col.kind === 'clickable',
                  'lx-cell-clickable': col.kind === 'clickable',
                }"
                :tabindex="
                  isCellDelegated(col) &&
                  !(col.kind === 'clickable' && isRenderableTextType(col.type))
                    ? getTabIndex(getGridRowIndex(rowIndex), hasSelecting ? colIndex + 1 : colIndex)
                    : -1
                "
                :role="col.kind === 'clickable' ? props.clickableRole : null"
                :datetime="isDateType(col.type) ? row[col.attributeName] : null"
                :ref="
                  isCellDelegated(col) &&
                  !(col.kind === 'clickable' && isRenderableTextType(col.type))
                    ? (el) =>
                        registerCell(
                          el ?? null,
                          getGridRowIndex(rowIndex),
                          hasSelecting ? colIndex + 1 : colIndex
                        )
                    : null
                "
                @keyup.space="handleKey(col, row)"
                @keyup.enter="handleKey(col, row)"
                @click="handleClick(col, row)"
              >
                <LxEmptyValue
                  v-if="
                    formatValue(row[col.attributeName], col.type, col.options?.fractionDigits) ===
                    '—'
                  "
                  :texts="{ emptyValue: displayTexts.emptyValue }"
                />
                <template v-else>{{
                  formatValue(row[col.attributeName], col.type, col.options?.fractionDigits)
                }}</template>
              </component>

              <LxStateDisplay
                v-if="col.type === 'state'"
                :value="row[col?.attributeName]"
                :dictionary="col?.dictionary ? col?.dictionary : col?.options"
                :texts="{ emptyValue: displayTexts.emptyValue }"
              />
              <LxRating
                v-if="col.type === 'rating'"
                v-model="row[col.attributeName]"
                readOnly
                :disabled="props.busy"
                :focusable="
                  isCellDelegated(col)
                    ? getFocusable(
                        getGridRowIndex(rowIndex),
                        hasSelecting ? colIndex + 1 : colIndex
                      )
                    : false
                "
                :ref="
                  isCellDelegated(col)
                    ? (el) =>
                        registerCell(
                          el ?? null,
                          getGridRowIndex(rowIndex),
                          hasSelecting ? colIndex + 1 : colIndex
                        )
                    : null
                "
                :texts="{ ...displayTexts.rating, emptyValue: displayTexts.emptyValue }"
              />

              <template v-if="col.type === 'icon'">
                <template
                  v-if="
                    isObject(row?.[col?.attributeName]) && !isValueEmpty(row?.[col?.attributeName])
                  "
                >
                  <div
                    class="lx-grid-icon-wrapper"
                    :class="{
                      'lx-icon-has-tooltip':
                        row?.[col?.attributeName]?.title || row?.[col?.attributeName]?.label,
                      'only-icon': !isValidString(row?.[col?.attributeName]?.label),
                    }"
                  >
                    <template
                      v-if="
                        isValidString(row?.[col?.attributeName]?.icon) ||
                        isValidString(row?.[col?.attributeName]?.label)
                      "
                    >
                      <LxInfoWrapper
                        :focusable="
                          isCellDelegated(
                            col,
                            isObject(row?.[col?.attributeName]) &&
                              !isValueEmpty(row?.[col?.attributeName])
                          )
                            ? getFocusable(
                                getGridRowIndex(rowIndex),
                                hasSelecting ? colIndex + 1 : colIndex
                              )
                            : false
                        "
                        :ref="
                          isCellDelegated(
                            col,
                            isObject(row?.[col?.attributeName]) &&
                              !isValueEmpty(row?.[col?.attributeName])
                          )
                            ? (el) =>
                                registerCell(
                                  el ?? null,
                                  getGridRowIndex(rowIndex),
                                  hasSelecting ? colIndex + 1 : colIndex
                                )
                            : null
                        "
                        :disabled="
                          !isValidString(row?.[col?.attributeName]?.title) &&
                          !isValidString(row?.[col?.attributeName]?.label)
                        "
                      >
                        <div
                          class="lx-grid-icon-content-wrapper lx-aligned-row lx-aligned-row-inverse lx-aligned-row-4"
                        >
                          <LxIcon
                            :value="
                              isValidString(row?.[col?.attributeName]?.icon)
                                ? row?.[col?.attributeName]?.icon
                                : 'default'
                            "
                            :icon-set="row?.[col?.attributeName]?.iconSet"
                            :customClass="`lx-grid-column-icon ${
                              row?.[col?.attributeName]?.category
                            }`"
                          />
                          <p
                            v-if="
                              col.size !== 'xs' && isValidString(row?.[col?.attributeName]?.label)
                            "
                            class="lx-grid-icon-text"
                          >
                            {{ row?.[col?.attributeName].label }}
                          </p>
                        </div>
                        <template #panel>
                          <p class="lx-data">
                            {{
                              row?.[col?.attributeName]?.title || row?.[col?.attributeName]?.label
                            }}
                          </p>
                        </template>
                      </LxInfoWrapper>
                    </template>
                    <LxEmptyValue
                      class="empty-icon-value"
                      v-else
                      :texts="{ emptyValue: displayTexts.emptyValue }"
                    />
                  </div>
                </template>

                <template
                  v-else-if="
                    !isObject(row?.[col?.attributeName]) && !isValueEmpty(row?.[col?.attributeName])
                  "
                >
                  <div class="lx-grid-icon-wrapper">
                    <LxIcon :value="row?.[col?.attributeName]" customClass="lx-grid-column-icon" />
                  </div>
                </template>
                <LxEmptyValue
                  class="empty-icon-value"
                  v-else
                  :texts="{ emptyValue: displayTexts.emptyValue }"
                />
              </template>

              <template v-if="col.type === 'flag' || col.type === 'country'">
                <div
                  class="flag-column"
                  v-if="
                    typeof row[col.attributeName] === 'string' &&
                    isValidString(row[col.attributeName])
                  "
                >
                  <LxFlag
                    size="s"
                    :value="row[col.attributeName]"
                    :locale="locale"
                    :meaningful="row[col.attributeName]?.meaningful || true"
                  />
                </div>

                <div class="flag-column" v-else-if="typeof row[col.attributeName] === 'object'">
                  <LxFlagItemDisplay
                    :value="row[col.attributeName]"
                    nameAttribute="name"
                    idAttribute="id"
                    :locale="locale"
                    :meaningful="row[col.attributeName]?.meaningful || false"
                    :texts="{ emptyValue: displayTexts.emptyValue }"
                  />
                </div>
                <LxEmptyValue
                  class="empty-flag-value"
                  v-else
                  :texts="{ emptyValue: displayTexts.emptyValue }"
                />
              </template>

              <template v-if="col.type === 'person'">
                <div class="lx-cell-person-wrapper">
                  <LxPersonDisplay
                    :value="row[col.attributeName]"
                    :kind="col.options?.avatarKind"
                    :customAttributes="col.options?.customAttributes"
                    :texts="
                      row[col.attributeName]?.texts || {
                        ...displayTexts.personDisplay,
                        emptyValue: displayTexts.emptyValue,
                      }
                    "
                    size="s"
                    :customRole="col.kind === 'clickable' ? clickableRole : null"
                    :focusable="
                      isCellDelegated(col, !isValueEmpty(row?.[col?.attributeName]))
                        ? getFocusable(
                            getGridRowIndex(rowIndex),
                            hasSelecting ? colIndex + 1 : colIndex,
                            0
                          )
                        : false
                    "
                    :ref="
                      isCellDelegated(col, !isValueEmpty(row?.[col?.attributeName]))
                        ? (el) =>
                            registerCell(
                              el ?? null,
                              getGridRowIndex(rowIndex),
                              hasSelecting ? colIndex + 1 : colIndex,
                              0
                            )
                        : null
                    "
                    @click="
                      defaultActionName && col.kind === 'clickable'
                        ? defaultActionClicked(row[idAttribute], row)
                        : null
                    "
                    @keyup.enter.space="
                      defaultActionName && col.kind === 'clickable'
                        ? defaultActionClicked(row[idAttribute], row)
                        : null
                    "
                  />
                  <LxButton
                    v-if="
                      col?.options?.actionDefinitions?.[0] &&
                      (!col.options.actionDefinitions[0]?.visibleByAttribute ||
                        row[col.options.actionDefinitions[0]?.visibleByAttribute])
                    "
                    :id="`${id}-${row[idAttribute]}-action-${col.options.actionDefinitions[0]?.id}`"
                    variant="icon-only"
                    kind="ghost"
                    :label="
                      col.options.actionDefinitions[0]?.name ||
                      col.options.actionDefinitions[0]?.label
                    "
                    :title="
                      col.options.actionDefinitions[0]?.title ||
                      col.options.actionDefinitions[0]?.tooltip
                    "
                    :icon="col.options.actionDefinitions[0]?.icon"
                    :iconSet="col.options.actionDefinitions[0]?.iconSet"
                    :loading="col.options.actionDefinitions[0]?.loading"
                    :busy="col.options.actionDefinitions[0]?.busy"
                    :destructive="col.options.actionDefinitions[0]?.destructive"
                    :disabled="
                      isDisabled ||
                      col.options.actionDefinitions[0]?.disabled ||
                      (col.options.actionDefinitions[0]?.enableByAttribute
                        ? !row[col.options.actionDefinitions[0]?.enableByAttribute]
                        : false)
                    "
                    :active="col.options.actionDefinitions[0]?.active"
                    :badge="col.options.actionDefinitions[0]?.badge"
                    :badgeType="col.options.actionDefinitions[0]?.badgeType"
                    :badgeIcon="col.options.actionDefinitions[0]?.badgeIcon"
                    :badgeTitle="col.options.actionDefinitions[0]?.badgeTitle"
                    :tabindex="
                      getTabIndex(
                        getGridRowIndex(rowIndex),
                        hasSelecting ? colIndex + 1 : colIndex,
                        1
                      )
                    "
                    :ref="
                      (el) =>
                        registerCell(
                          el ?? null,
                          getGridRowIndex(rowIndex),
                          hasSelecting ? colIndex + 1 : colIndex,
                          1
                        )
                    "
                    @click.stop="
                      handleActionClick(
                        col?.options?.actionDefinitions[0]?.id,
                        row[idAttribute],
                        actionAdditionalParameter
                      )
                    "
                  />
                </div>
              </template>
              <template v-if="col.type === 'array'">
                <LxInfoWrapper
                  v-if="
                    row[col.attributeName] &&
                    row[col.attributeName].length >
                      (col.options?.displayItemsCount ? col.options?.displayItemsCount : 1)
                  "
                  :focusable="
                    isCellDelegated(
                      col,
                      row[col.attributeName] &&
                        row[col.attributeName].length >
                          (col.options?.displayItemsCount ? col.options?.displayItemsCount : 1)
                    )
                      ? getFocusable(
                          getGridRowIndex(rowIndex),
                          hasSelecting ? colIndex + 1 : colIndex
                        )
                      : false
                  "
                  :ref="
                    isCellDelegated(
                      col,
                      row[col.attributeName] &&
                        row[col.attributeName].length >
                          (col.options?.displayItemsCount ? col.options?.displayItemsCount : 1)
                    )
                      ? (el) =>
                          registerCell(
                            el ?? null,
                            getGridRowIndex(rowIndex),
                            hasSelecting ? colIndex + 1 : colIndex
                          )
                      : null
                  "
                >
                  <div class="lx-indicator">
                    <LxEmptyValue
                      v-if="
                        formatValue(
                          row[col.attributeName],
                          col.type,
                          col.options?.displayItemsCount
                        ) === '—'
                      "
                      :texts="{ emptyValue: displayTexts.emptyValue }"
                    />
                    <template v-else>{{
                      formatValue(row[col.attributeName], col.type, col.options?.displayItemsCount)
                    }}</template>
                  </div>

                  <template #panel>
                    <ul class="array-type-list">
                      <li v-for="i in row[col.attributeName]" v-bind:key="i">
                        <div class="lx-row">
                          <p class="lx-data">{{ i }}</p>
                        </div>
                      </li>
                    </ul>
                  </template>
                </LxInfoWrapper>

                <template v-else>
                  <template
                    v-for="(i, index) in formatValue(
                      row[col.attributeName],
                      col.type,
                      col.options?.displayItemsCount
                    )"
                    :key="index"
                  >
                    <LxEmptyValue
                      v-if="i === '—'"
                      :texts="{ emptyValue: displayTexts.emptyValue }"
                    />
                    <template v-else>{{ `${i} ` }}</template>
                  </template>
                </template>
              </template>
            </div>

            <div
              v-if="hasActionButtons"
              class="lx-cell-action"
              :class="[{ 'show-cell-borders': scrollable === true || autoScrollable === true }]"
              role="cell"
            >
              <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
              <div
                class="lx-toolbar"
                v-if="getRowVisibleActions(row).length <= 2"
                role="toolbar"
                @click="
                  setActiveFromClick(
                    getGridRowIndex(rowIndex),
                    hasSelecting ? colCount + 1 : colCount
                  )
                "
              >
                <LxButton
                  v-for="action in getRowVisibleActions(row)"
                  :key="action.id"
                  :id="`${id}-${row[idAttribute]}-action-${action.id}`"
                  :label="action.name || action.label"
                  :title="action.title || action.tooltip"
                  :icon="action.icon"
                  :iconSet="action.iconSet"
                  :loading="action.loading"
                  :busy="action.busy"
                  kind="ghost"
                  variant="icon-only"
                  :destructive="action.destructive"
                  :disabled="
                    isDisabled ||
                    action.disabled ||
                    (action.enableByAttribute ? !row[action.enableByAttribute] : false)
                  "
                  :active="action.active"
                  :badge="action.badge"
                  :badgeType="action.badgeType"
                  :badgeIcon="action.badgeIcon"
                  :badgeTitle="action.badgeTitle"
                  :tabindex="
                    getTabIndex(getGridRowIndex(rowIndex), hasSelecting ? colCount + 1 : colCount)
                  "
                  :ref="
                    (el) =>
                      registerCell(
                        el ?? null,
                        getGridRowIndex(rowIndex),
                        hasSelecting ? colCount + 1 : colCount
                      )
                  "
                  :href="action.href"
                  @click="handleActionClick(action.id, row[idAttribute], actionAdditionalParameter)"
                />
              </div>

              <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
              <div
                v-if="getRowVisibleActions(row).length > 2"
                class="lx-toolbar"
                role="toolbar"
                @click="
                  setActiveFromClick(
                    getGridRowIndex(rowIndex),
                    hasSelecting ? colCount + 1 : colCount
                  )
                "
              >
                <LxButton
                  v-if="
                    !actionDefinitions?.[0]?.visibleByAttribute ||
                    row[actionDefinitions?.[0]?.visibleByAttribute]
                  "
                  :id="`${id}-${row[idAttribute]}-action-${actionDefinitions?.[0]?.id}`"
                  :label="actionDefinitions?.[0]?.name || actionDefinitions?.[0]?.label"
                  :title="actionDefinitions?.[0]?.title || actionDefinitions?.[0]?.tooltip"
                  :icon="actionDefinitions?.[0]?.icon"
                  :iconSet="actionDefinitions?.[0]?.iconSet"
                  :loading="actionDefinitions?.[0]?.loading"
                  :busy="actionDefinitions?.[0]?.busy"
                  :destructive="actionDefinitions?.[0]?.destructive"
                  :disabled="
                    isDisabled ||
                    actionDefinitions?.[0]?.disabled ||
                    (actionDefinitions?.[0]?.enableByAttribute
                      ? !row[actionDefinitions?.[0]?.enableByAttribute]
                      : false)
                  "
                  kind="ghost"
                  variant="icon-only"
                  :active="actionDefinitions?.[0]?.active"
                  :badge="actionDefinitions?.[0]?.badge"
                  :badgeType="actionDefinitions?.[0]?.badgeType"
                  :badgeIcon="actionDefinitions?.[0]?.badgeIcon"
                  :badgeTitle="actionDefinitions?.[0]?.badgeTitle"
                  :tabindex="
                    getTabIndex(getGridRowIndex(rowIndex), hasSelecting ? colCount + 1 : colCount)
                  "
                  :ref="
                    (el) =>
                      registerCell(
                        el ?? null,
                        getGridRowIndex(rowIndex),
                        hasSelecting ? colCount + 1 : colCount
                      )
                  "
                  :href="actionDefinitions?.[0]?.href"
                  @click="
                    handleActionClick(
                      actionDefinitions?.[0]?.id,
                      row[idAttribute],
                      actionAdditionalParameter
                    )
                  "
                />

                <LxDropDownMenu
                  :ref="dropDownMenuRefFor(rowKey)"
                  placement="bottom-end"
                  :disabled="isDisabled"
                  :tabindex="-1"
                  :actionDefinitions="getRowActionDefinitionsGroup(row)"
                  @actionClick="
                    (id) => handleActionClick(id, row[idAttribute], actionAdditionalParameter)
                  "
                >
                  <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
                  <div
                    class="lx-toolbar grid-actions-menu"
                    :tabindex="
                      getTabIndex(
                        getGridRowIndex(rowIndex),
                        hasSelecting ? colCount + 2 : colCount + 1
                      )
                    "
                    :ref="
                      (el) =>
                        registerCell(
                          el ?? null,
                          getGridRowIndex(rowIndex),
                          hasSelecting ? colCount + 2 : colCount + 1
                        )
                    "
                    @click.stop.prevent="handleMenuClick(rowIndex, rowKey)"
                  >
                    <LxButton
                      :id="`${id}-${row[idAttribute]}-action`"
                      icon="overflow-menu"
                      kind="ghost"
                      :disabled="isDisabled"
                      :label="displayTexts.moreActions"
                      variant="icon-only"
                      :tabindex="-1"
                    />
                  </div>
                </LxDropDownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="lx-skeleton lx-grid-table"
        v-show="loading"
        :aria-labelledby="`${id}-label`"
        :aria-describedby="`${id}-description`"
        :style="{
          gridTemplateColumns: skeletonGridTemplateColumns,
        }"
      >
        <div class="lx-grid-row">
          <div class="lx-cell-header"><div class="lx-skeleton-placeholder"></div></div>
          <div class="lx-cell-header"><div class="lx-skeleton-placeholder"></div></div>
          <div class="lx-cell-header"><div class="lx-skeleton-placeholder"></div></div>
        </div>

        <div class="lx-grid-row" v-for="index in props.skeletonRowCount" :key="index">
          <div class="lx-cell lx-cell-s"><div class="lx-skeleton-placeholder"></div></div>
          <div class="lx-cell lx-cell-m"><div class="lx-skeleton-placeholder"></div></div>
          <div class="lx-cell lx-cell"><div class="lx-skeleton-placeholder"></div></div>
        </div>
        <p v-if="loading && showLoadingAlert" class="lx-invisible" aria-live="polite" role="status">
          {{ displayTexts.loadingStart }}
        </p>
        <p
          v-if="!loading && showLoadingAlert"
          class="lx-invisible"
          aria-live="polite"
          role="status"
        >
          {{ displayTexts.loadingEnd }}
        </p>
      </div>
    </article>

    <LxEmptyState
      v-if="items?.length < 1 && !(loading || busy)"
      :label="displayTexts.noItems"
      :description="displayTexts.noItemsDescription"
      :icon="emptyStateIcon"
      :actionDefinitions="emptyStateActionDefinitions"
      @actionClick="emptyStateActionClicked"
    />

    <LxAppendableList
      v-if="isResponsiveLayout"
      :modelValue="rows"
      :expandable="true"
      :nameAttribute="primaryColumnDisplayAttribute()"
      kind="compact"
      :readOnly="true"
      :hasSelecting="hasSelecting"
      :selectionKind="selectionKind"
      :actionDefinitions="actionDefinitions"
      :uppercase="false"
      :columnCount="2"
      :defaultExpanded="false"
      :idAttribute="idAttribute"
      v-model:selectedValues="selectedRowsRaw"
      @actionClick="(val, item) => handleActionClick(val, item, actionAdditionalParameter)"
      :class="[{ 'lx-data-grid-full': showAllColumns }]"
    >
      <template #customItem="{ item }">
        <template v-if="$slots.customResponsiveItem">
          <slot name="customResponsiveItem" v-bind="{ item }" />
        </template>

        <template v-else>
          <LxRow
            :label="col.name"
            v-for="col in columnsComputed?.filter((col) => col.type !== 'icon')"
            :key="col.id"
            columnSpan="2"
            :class="[
              {
                'lx-cell-clickable': col.kind === 'clickable',
              },
              {
                'lx-cell-primary': col.kind === 'primary',
              },
              {
                'lx-cell-secondary': col.kind === 'secondary',
              },
              {
                'lx-cell-extra': col.kind === 'extra',
              },
              {
                'lx-cell-link-disabled':
                  col.kind === 'clickable' && !checkEnableByAttributeName(item),
              },
            ]"
          >
            <component
              v-if="isRenderableTextType(col.type)"
              :is="isDateType(col.type) ? 'time' : 'span'"
              :tabindex="col.kind === 'clickable' ? 0 : -1"
              :datetime="isDateType(col.type) ? item[col.attributeName] : null"
              @click="handleClick(col, item)"
              @keydown.enter="handleKey(col, item)"
            >
              <LxEmptyValue
                v-if="
                  formatValue(item[col.attributeName], col.type, col.options?.fractionDigits) ===
                  '—'
                "
                :texts="{ emptyValue: displayTexts.emptyValue }"
              />
              <template v-else>{{
                formatValue(item[col.attributeName], col.type, col.options?.fractionDigits)
              }}</template>
            </component>

            <template v-if="col.type === 'array'">
              <LxInfoWrapper
                v-if="
                  item[col.attributeName] &&
                  item[col.attributeName].length >
                    (col.options?.displayItemsCount ? col.options?.displayItemsCount : 1)
                "
              >
                <div class="lx-indicator">
                  <LxEmptyValue
                    v-if="
                      formatValue(
                        item[col.attributeName],
                        col.type,
                        col.options?.displayItemsCount
                      ) === '—'
                    "
                    :texts="{ emptyValue: displayTexts.emptyValue }"
                  />
                  <template v-else>{{
                    formatValue(item[col.attributeName], col.type, col.options?.displayItemsCount)
                  }}</template>
                </div>
                <template #panel>
                  <ul>
                    <li v-for="i in item[col.attributeName]" v-bind:key="i">
                      <div class="lx-row">
                        <p class="lx-data">{{ i }}</p>
                      </div>
                    </li>
                  </ul>
                </template>
              </LxInfoWrapper>
              <template v-else>
                <template
                  v-for="(i, index) in formatValue(
                    item[col.attributeName],
                    col.type,
                    col.options?.displayItemsCount
                  )"
                  :key="index"
                >
                  <LxEmptyValue v-if="i === '—'" :texts="{ emptyValue: displayTexts.emptyValue }" />
                  <template v-else>{{ `${i} ` }}</template>
                </template>
              </template>
            </template>

            <LxStateDisplay
              v-else-if="col.type === 'state'"
              :value="item[col?.attributeName]"
              :dictionary="col?.dictionary ? col?.dictionary : col?.options"
              :texts="{ emptyValue: displayTexts.emptyValue }"
            />

            <LxRating
              v-else-if="col.type === 'rating'"
              :disabled="props.busy"
              readOnly
              v-model="item[col.attributeName]"
              :texts="{ ...displayTexts.rating, emptyValue: displayTexts.emptyValue }"
            />

            <template v-if="col.type === 'flag' || col.type === 'country'">
              <div
                class="flag-column"
                v-if="
                  typeof item[col.attributeName] === 'string' &&
                  item[col.attributeName].trim() !== ''
                "
              >
                <LxFlag size="s" :value="item[col.attributeName]" :locale="locale" />
              </div>

              <div class="flag-column" v-else-if="typeof item[col.attributeName] === 'object'">
                <LxFlagItemDisplay
                  :value="item[col.attributeName]"
                  nameAttribute="name"
                  idAttribute="id"
                  :texts="{ emptyValue: displayTexts.emptyValue }"
                />
              </div>
              <LxEmptyValue
                class="empty-flag-value"
                v-else
                :texts="{ emptyValue: displayTexts.emptyValue }"
              />
            </template>
            <template v-else-if="col.type === 'person'">
              <div class="lx-cell-person-wrapper">
                <LxPersonDisplay
                  :value="item[col.attributeName]"
                  :kind="col.options?.avatarKind"
                  :customAttributes="col.options?.customAttributes"
                  :texts="
                    item[col.attributeName]?.texts || {
                      ...displayTexts.personDisplay,
                      emptyValue: displayTexts.emptyValue,
                    }
                  "
                  size="s"
                  :customRole="col.kind === 'clickable' ? clickableRole : null"
                  @click="
                    defaultActionName && col.kind === 'clickable'
                      ? defaultActionClicked(item[idAttribute], item)
                      : null
                  "
                  @keydown.enter="
                    defaultActionName && col.kind === 'clickable'
                      ? defaultActionClicked(item[idAttribute], item)
                      : null
                  "
                />
                <LxButton
                  v-if="
                    col?.options?.actionDefinitions?.[0] &&
                    (!col.options.actionDefinitions[0]?.visibleByAttribute ||
                      item[col.options.actionDefinitions[0]?.visibleByAttribute])
                  "
                  :id="`${id}-${item[idAttribute]}-action-${col.options.actionDefinitions[0]?.id}`"
                  variant="icon-only"
                  kind="ghost"
                  :label="
                    col.options.actionDefinitions[0]?.name ||
                    col.options.actionDefinitions[0]?.label
                  "
                  :title="
                    col.options.actionDefinitions[0]?.title ||
                    col.options.actionDefinitions[0]?.tooltip
                  "
                  :icon="col.options.actionDefinitions[0]?.icon"
                  :iconSet="col.options.actionDefinitions[0]?.iconSet"
                  :loading="col.options.actionDefinitions[0]?.loading"
                  :busy="col.options.actionDefinitions[0]?.busy"
                  :destructive="col.options.actionDefinitions[0]?.destructive"
                  :disabled="
                    isDisabled ||
                    col.options.actionDefinitions[0]?.disabled ||
                    (col.options.actionDefinitions[0]?.enableByAttribute
                      ? !item[col.options.actionDefinitions[0]?.enableByAttribute]
                      : false)
                  "
                  :active="col.options.actionDefinitions[0]?.active"
                  :badge="col.options.actionDefinitions[0]?.badge"
                  :badgeType="col.options.actionDefinitions[0]?.badgeType"
                  :badgeIcon="col.options.actionDefinitions[0]?.badgeIcon"
                  :badgeTitle="col.options.actionDefinitions[0]?.badgeTitle"
                  @click.stop="
                    handleActionClick(
                      col?.options?.actionDefinitions[0]?.id,
                      item[idAttribute],
                      actionAdditionalParameter
                    )
                  "
                />
              </div>
            </template>
          </LxRow>

          <LxRow
            v-if="shouldShowIconRow"
            class="lx-responsive-grid-icons-row"
            columnSpan="2"
            :label="displayTexts.iconsResponsiveRowLabel"
          >
            <div
              v-for="col in columnsComputed?.filter((col) => col.type === 'icon')"
              :key="col.id"
              :class="[
                {
                  'lx-cell-clickable': col.kind === 'clickable',
                },
                {
                  'lx-cell-primary': col.kind === 'primary',
                },
                {
                  'lx-cell-secondary': col.kind === 'secondary',
                },
                {
                  'lx-cell-extra': col.kind === 'extra',
                },
                {
                  'lx-cell-link-disabled':
                    col.kind === 'clickable' && !checkEnableByAttributeName(item),
                },
              ]"
            >
              <template
                v-if="
                  isObject(item?.[col?.attributeName]) && !isValueEmpty(item?.[col?.attributeName])
                "
              >
                <div
                  class="lx-grid-icon-wrapper"
                  :class="{
                    'lx-icon-has-tooltip':
                      item?.[col?.attributeName]?.title || item?.[col?.attributeName]?.label,
                    'only-icon': !isValidString(item?.[col?.attributeName]?.label),
                  }"
                >
                  <LxInfoWrapper
                    :disabled="
                      !isValidString(item?.[col?.attributeName]?.title) &&
                      !isValidString(item?.[col?.attributeName]?.label)
                    "
                  >
                    <div class="lx-grid-icon-content-wrapper lx-aligned-row">
                      <LxIcon
                        :value="item?.[col?.attributeName]?.icon"
                        :icon-set="item?.[col?.attributeName]?.iconSet"
                        :customClass="`lx-grid-column-icon ${item?.[col?.attributeName]?.category}`"
                      />
                      <p v-if="col.size !== 'xs'" class="lx-grid-icon-text">
                        {{ item?.[col?.attributeName].label }}
                      </p>
                    </div>
                    <template #panel>
                      <p class="lx-data">
                        {{ item?.[col?.attributeName]?.title || item?.[col?.attributeName]?.label }}
                      </p>
                    </template>
                  </LxInfoWrapper>
                </div>
              </template>
              <template
                v-else-if="
                  !isObject(item?.[col?.attributeName]) && !isValueEmpty(item?.[col?.attributeName])
                "
              >
                <div class="lx-grid-icon-wrapper">
                  <LxIcon :value="item?.[col?.attributeName]" customClass="lx-grid-column-icon" />
                </div>
              </template>
              <LxEmptyValue
                class="empty-icon-value"
                v-else
                :texts="{ emptyValue: displayTexts.emptyValue }"
              />
            </div>
          </LxRow>
        </template>
      </template>
      <template #customHeader="{ item, expanded }" v-if="$slots.customResponsiveHeader">
        <slot name="customResponsiveHeader" v-bind="{ item, expanded }" />
      </template>
    </LxAppendableList>

    <footer class="lx-statusbar" v-if="showStatusbar">
      <div
        class="lx-group lx-group-paging count-selector"
        v-if="hasPaging && showItemsCountSelector && !loading"
      >
        {{ displayTexts.itemsPerPage }}
        <LxDropDownMenu :disabled="isDisabled">
          <LxButton
            :label="itemsPerPage.toString()"
            icon="chevron-down"
            kind="ghost"
            customClass="lx-chip"
            tabindex="-1"
          />
          <template #panel>
            <div class="lx-button-set">
              <LxButton
                v-for="i in itemsCountSelector"
                :key="i"
                :label="`${i.toString()} ${displayTexts.itemsPerPageLabel}`"
                :disabled="itemsPerPage === i || isDisabled"
                @click="changeItemsPerPage(i)"
              />
            </div>
          </template>
        </LxDropDownMenu>
      </div>

      <div class="lx-group count-display" v-if="!loading">
        {{ itemsLabel }}
      </div>

      <div class="lx-group lx-group-paging" v-if="hasPaging && !loading">
        <LxButton
          :id="`${id}-action-first-page`"
          kind="ghost"
          icon="first-page"
          :label="displayTexts.firstPage"
          variant="icon-only"
          :disabled="pageCurrent < 1 || isDisabled"
          @click="selectFirstPage()"
        />
        <div class="lx-divider"></div>
        <LxButton
          :id="`${id}-action-previous-page`"
          kind="ghost"
          icon="previous-page"
          :label="displayTexts.previousPage"
          variant="icon-only"
          :disabled="pageCurrent < 1 || isDisabled"
          @click="selectPreviousPage"
        />
        <div class="lx-divider"></div>
        <LxButton
          :id="`${id}-action-next-page`"
          kind="ghost"
          icon="next-page"
          :label="displayTexts.nextPage"
          variant="icon-only"
          :disabled="Number(pageCurrent) + 1 >= Number(pagesTotal) || isDisabled"
          @click="selectNextPage"
        />
      </div>
    </footer>
  </div>
</template>
