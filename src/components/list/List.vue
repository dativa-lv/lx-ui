<script setup>
import {
  ref,
  computed,
  watch,
  onMounted,
  nextTick,
  inject,
  onBeforeUnmount,
  shallowRef,
  effectScope,
} from 'vue';
import LxButton from '@/components/Button.vue';
import LxExpander from '@/components/Expander.vue';
import LxIcon from '@/components/Icon.vue';
import LxListItem from '@/components/list/ListItem.vue';
import LxEmptyState from '@/components/EmptyState.vue';
import LxLoader from '@/components/Loader.vue';
import LxLoaderView from '@/components/LoaderView.vue';
import LxRadioButton from '@/components/RadioButton.vue';
import LxCheckbox from '@/components/Checkbox.vue';
import LxDropDownMenu from '@/components/DropDownMenu.vue';
import LxTreeList from '@/components/list/TreeList.vue';
import LxSkipLink from '@/components/SkipLink.vue';
import LxToolbar from '@/components/Toolbar.vue';
import TransitionGroupWrapper from '@/components/TransitionGroupWrapper.vue';
import useLx from '@/hooks/useLx';
import { generateUUID, foldToAscii, stringifyItemsByIdAttribute } from '@/utils/stringUtils';
import { lxDevUtils } from '@/utils';
import { focusNextFocusableElement, getDisplayTexts, isDefined } from '@/utils/generalUtils';
import { loadLibrary } from '@/utils/libLoader';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  items: { type: Array, default: null },
  hasSearch: { type: Boolean, default: false },
  groupDefinitions: { type: Array, default: null },
  icon: { type: String, default: 'open' },
  iconSet: { type: String, default: () => useLx().getGlobals()?.iconSet },
  kind: { type: String, default: 'default' }, // default, draggable, treelist
  idAttribute: { type: String, default: 'id' },
  nameAttribute: { type: String, default: 'name' },
  descriptionAttribute: { type: String, default: 'description' },
  hrefAttribute: { type: String, default: 'href' },
  groupAttribute: { type: String, default: 'group' },
  clickableAttribute: { type: String, default: 'clickable' },
  iconAttribute: { type: String, default: 'icon' },
  iconSetAttribute: { type: String, default: 'iconSet' },
  tooltipAttribute: { type: String, default: 'tooltip' },
  categoryAttribute: { type: String, default: 'category' },
  childrenAttribute: { type: String, default: 'children' },
  hasChildrenAttribute: { type: String, default: 'hasChildren' },
  selectableAttribute: { type: String, default: 'selectable' },
  orderAttribute: { type: String, default: 'order' },
  actionDefinitions: { type: Array, default: null },
  toolbarActionDefinitions: { type: Array, default: () => [] },
  actionsLayout: { type: String, default: 'default' }, // default, vertical
  emptyStateActionDefinitions: { type: Array, default: null },
  emptyStateIcon: { type: String, default: '' },
  listType: { type: String, default: '3' },
  searchString: { type: String, default: '' },
  searchSide: { type: String, default: 'client' }, // client, server
  showLoadMore: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  hideFilteredItems: { type: Boolean, default: false },
  hasSelecting: { type: Boolean, default: false },
  selectionKind: { type: String, default: 'single' }, // single, multiple
  selectionActionDefinitions: { type: Array, default: () => [] },
  includeUnspecifiedGroups: { type: Boolean, default: false },
  itemsStates: { type: Object, default: () => {} },
  mode: { type: String, default: 'client' }, // client, server
  searchMode: { type: String, default: 'default' }, // default, compact
  labelId: { type: String, default: null },
  hasSkipLink: { type: Boolean, default: false },
  hasVirtualization: { type: Boolean, default: true },
  texts: { type: Object, default: () => ({}) },
});

const textsDefault = {
  clear: 'Notīrīt',
  placeholder: 'Ievadiet nosaukuma vai apraksta daļu, lai sameklētu ierakstus',
  notFoundSearch: 'Nav atrasts:',
  noItems: 'Nav ierakstu',
  noItemsDescription: '',
  loadMore: 'Ielādēt vēl',
  search: 'Meklēt',
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
  clearSelected: 'Attīrīt izvēles',
  selectAllRows: 'Izvēlēties visu',
  selectWholeGroup: 'Izvēlēties visu grupu',
  loadingError: 'Notika ielādes kļūda',
  reload: 'Ielādēt atkārtoti',
  collapse: 'Sakļaut elementu',
  expand: 'Izvērst elementu',
  openSearch: 'Atvērt meklētāju',
  closeSearch: 'Aizvērt meklētāju',
  skipLinkLabel: 'Izlaist sarakstu',
  skipLinkTitle: 'Izlaist sarakstu',
  overflowMenu: 'Atvērt papildu iespējas',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));

const emits = defineEmits([
  'update:searchString',
  'update:itemsStates',
  'update:items',
  'search',
  'loadMore',
  'loadChildren',
  'selectionChange',
  'actionClick',
  'selectionActionClick',
  'toolbarActionClick',
  'emptyStateActionClick',
]);

const UNSPECIFIED_GROUP_CODE = 'lx_list_nullable_group';
const BASE_WIDTH = 300; // minimum space for layout
const WIDTH_PER_ACTION = 120; // average button width
const VIRTUALIZED_ESTIMATED_ITEM_HEIGHT = 72;

const responsiveGroupDefinitions = ref(props.groupDefinitions);
const itemsArray = ref([]);
const ungroupedItemsArray = ref();
const selectedItemsRaw = ref({});
const draggableIsDisabledByQuery = ref(false);
const dragging = ref(false);
const statesNotDefined = ref({});
const showInvisibleBlock = ref(false);
const draggable = ref(null);
const loadingLib = ref(false);
const listWrapper = ref(null);
const toolbarRef = ref(null);
const isNarrow = ref(false);

const defaultListRef = ref(null);
const defaultListScrollMargin = ref(0);
const defaultListGap = ref(8);
const defaultListVirtualizer = shallowRef(null);
const defaultListScrollParent = shallowRef(null);

const searchStringClient = ref(props.searchSide === 'client' ? props.searchString : '');
const searchStringClientRaw = ref('');
const searchStringServer = ref(props.searchSide === 'server' ? props.searchString : '');

let invisibleBlockTimeout;
let observer;
let defaultListPositionObserver = null;
let virtualizerScope = null;
let defaultListScrollOffsetRaf = null;
let defaultListScrollTarget = null;
let duplicateIdsWarningSignature = '';
let updateDefaultListScrollOffset = () => {};

const reactiveSearchString = computed({
  get() {
    return props.searchString;
  },
  set(value) {
    emits('update:searchString', value);
  },
});

const stringifiedItems = computed(() =>
  stringifyItemsByIdAttribute(props.items, props.idAttribute)
);

function prepareCode(value) {
  return value?.toString();
}

watch(
  () => props.groupDefinitions,
  (newValue) => {
    responsiveGroupDefinitions.value = newValue;
  }
);

function getDuplicateItemIds(items) {
  const counts = new Map();
  (items || []).forEach((item) => {
    const id = item?.[props.idAttribute];
    if (id == null) return;
    counts.set(id, (counts.get(id) || 0) + 1);
  });
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => `${id}`)
    .sort();
}

function validate() {
  const duplicates = getDuplicateItemIds(stringifiedItems.value);
  if (duplicates.length > 0) return 'LxList item codes are not unique!';
  return 0;
}

function isFiltered(value) {
  if (searchStringClient.value && !value) {
    return false;
  }
  if (searchStringClient.value && value) {
    return foldToAscii(value).toLowerCase().includes(searchStringClient.value.toLowerCase());
  }
  return true;
}

function handleActionClick(actionName, rowCode) {
  emits('actionClick', actionName, rowCode);
}

const filteredItems = computed(() => {
  if (stringifiedItems.value) {
    return stringifiedItems.value.filter(
      (o) => isFiltered(o[props.nameAttribute]) || isFiltered(o[props.descriptionAttribute])
    );
  }
  return [];
});

const filteredItemsWithVirtualKey = computed(() => {
  const seenById = new Map();
  return (filteredItems.value || []).map((item, index) => {
    const baseId = item?.[props.idAttribute] ?? index;
    const duplicateCount = (seenById.get(baseId) || 0) + 1;
    seenById.set(baseId, duplicateCount);
    return {
      item,
      virtualKey: duplicateCount === 1 ? `${baseId}` : `${baseId}__dup_${duplicateCount}`,
    };
  });
});

const normalizedListType = computed(() => {
  const listType = `${props.listType}`;
  if (['1', '2', '3'].includes(listType)) return listType;
  return '1';
});

const wantsDefaultListVirtualization = computed(
  () =>
    props.hasVirtualization &&
    props.kind === 'default' &&
    !props.groupDefinitions &&
    normalizedListType.value === '1'
);

function resolveScrollParent(el) {
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
  let fallback = null;
  while (parent && parent !== document.body && parent !== document.documentElement) {
    const style = globalThis.getComputedStyle(parent);
    const overflowY = style?.overflowY;

    if (isScrollableOverflow(overflowY)) {
      if (isConstrainedScrollableElement(parent, style)) {
        return parent;
      }

      if (!fallback) fallback = parent;
    }

    parent = parent.parentElement;
  }

  return fallback;
}

function resolveDefaultListScrollTarget(scrollParent = defaultListScrollParent.value) {
  if (scrollParent?.addEventListener) return scrollParent;
  if (globalThis?.addEventListener) return globalThis;
  return null;
}

async function loadVueVirtual() {
  const lib = await loadLibrary('vueVirtual');
  if (virtualizerScope) virtualizerScope.stop();
  virtualizerScope = effectScope();
  virtualizerScope.run(() => {
    // IMPORTANT: do NOT spread this object when passing it to the virtualizer.
    // Object spread evaluates the getters once and copies plain values, which
    // would freeze `scrollMargin`, `count` and `gap` at their initial values
    // and break reactivity.
    const virtualizerOptions = {
      get count() {
        if (!wantsDefaultListVirtualization.value) return 0;
        return filteredItems.value?.length || 0;
      },
      getItemKey: (index) => filteredItemsWithVirtualKey.value?.[index]?.virtualKey ?? index,
      get scrollMargin() {
        return defaultListScrollMargin.value;
      },
      estimateSize: () => VIRTUALIZED_ESTIMATED_ITEM_HEIGHT,
      get gap() {
        return defaultListGap.value;
      },
      overscan: 6, // The number of items to render above and below the visible area
    };

    if (defaultListScrollParent.value && lib.useVirtualizer) {
      // `getScrollElement` must only be defined for the element virtualizer.
      // Adding it to `useWindowVirtualizer` makes it try to read a (null)
      // element and produces zero virtual rows.
      Object.defineProperty(virtualizerOptions, 'getScrollElement', {
        enumerable: true,
        value: () => defaultListScrollParent.value,
      });
      defaultListVirtualizer.value = lib.useVirtualizer(virtualizerOptions);
    } else {
      defaultListVirtualizer.value = lib.useWindowVirtualizer(virtualizerOptions);
    }
  });
}

async function ensureDefaultListVirtualizer() {
  if (!wantsDefaultListVirtualization.value) return;
  await loadVueVirtual();
}

function warnAboutDuplicateItemIds(items) {
  const duplicateIds = getDuplicateItemIds(items);
  if (duplicateIds.length === 0) {
    duplicateIdsWarningSignature = '';
    return;
  }

  const signature = duplicateIds.join('|');
  if (signature === duplicateIdsWarningSignature) return;
  duplicateIdsWarningSignature = signature;

  lxDevUtils.log('LxList item codes are not unique!', useLx().getGlobals()?.environment, 'error');
}

const shouldVirtualizeDefaultList = computed(
  () => wantsDefaultListVirtualization.value && !!defaultListVirtualizer.value
);

const defaultListRows = computed(() => {
  const vRef = defaultListVirtualizer.value;
  if (!vRef) return [];
  return vRef.value
    .getVirtualItems()
    .map((virtualRow) => ({
      virtualRow,
      item: filteredItemsWithVirtualKey.value?.[virtualRow.index]?.item,
      virtualKey: filteredItemsWithVirtualKey.value?.[virtualRow.index]?.virtualKey,
    }))
    .filter((row) => row.item);
});

const defaultListTotalSize = computed(() => {
  const vRef = defaultListVirtualizer.value;
  if (!vRef) return 0;
  return vRef.value.getTotalSize();
});

function scheduleDefaultListScrollOffsetUpdate() {
  if (!shouldVirtualizeDefaultList.value || isDefined(defaultListScrollOffsetRaf)) return;

  defaultListScrollOffsetRaf = globalThis.requestAnimationFrame(() => {
    defaultListScrollOffsetRaf = null;
    updateDefaultListScrollOffset();
    globalThis.requestAnimationFrame(() => {
      updateDefaultListScrollOffset();
    });
  });
}

function setupDefaultListPositionObservers() {
  if (!listWrapper.value) return;
  defaultListPositionObserver?.disconnect();

  const RO = globalThis.ResizeObserver;

  if (RO) {
    defaultListPositionObserver = new RO(() => {
      scheduleDefaultListScrollOffsetUpdate();
    });
    defaultListPositionObserver.observe(listWrapper.value);
    if (listWrapper.value.parentElement) {
      defaultListPositionObserver.observe(listWrapper.value.parentElement);
    }
    if (defaultListScrollParent.value) {
      defaultListPositionObserver.observe(defaultListScrollParent.value);
    }
  }
}

updateDefaultListScrollOffset = () => {
  if (!shouldVirtualizeDefaultList.value || !defaultListRef.value) return;
  const resolvedParent = resolveScrollParent(listWrapper.value);
  if (resolvedParent !== defaultListScrollParent.value) {
    defaultListScrollParent.value = resolvedParent;
    const newTarget = resolveDefaultListScrollTarget(resolvedParent);
    if (defaultListScrollTarget && defaultListScrollTarget !== newTarget) {
      defaultListScrollTarget.removeEventListener('scroll', scheduleDefaultListScrollOffsetUpdate);
      newTarget?.addEventListener('scroll', scheduleDefaultListScrollOffsetUpdate, {
        passive: true,
      });
    }
    defaultListScrollTarget = newTarget;
    setupDefaultListPositionObservers();
    if (wantsDefaultListVirtualization.value) {
      loadVueVirtual();
    }
  }

  const listTop = defaultListRef.value.getBoundingClientRect().top;
  const parent = defaultListScrollParent.value;

  let next;
  if (parent) {
    const parentTop = parent.getBoundingClientRect().top;
    next = listTop - parentTop + parent.scrollTop;
  } else {
    next = listTop + globalThis.scrollY;
  }

  if (Math.abs(next - defaultListScrollMargin.value) < 0.5) return;
  defaultListScrollMargin.value = next;
  defaultListVirtualizer.value?.value.measure();
};

function updateDefaultListGap() {
  if (!shouldVirtualizeDefaultList.value || !defaultListRef.value) return;
  const computedStyle = globalThis.getComputedStyle(defaultListRef.value);
  const rowGap = Number.parseFloat(computedStyle.rowGap || computedStyle.gap || '0');
  defaultListGap.value = Number.isFinite(rowGap) ? rowGap : 0;
}

function handleDefaultListResize() {
  if (!shouldVirtualizeDefaultList.value) return;
  updateDefaultListGap();
  updateDefaultListScrollOffset();
  defaultListVirtualizer.value?.value.measure();
}

function measureDefaultListRow(element) {
  if (!shouldVirtualizeDefaultList.value || !element) return;
  defaultListVirtualizer.value?.value.measureElement(element);
}

function findObjectById(array) {
  const res = [];
  const queue = [...array];
  while (queue.length > 0) {
    const obj = queue.shift();
    if (isFiltered(obj[props.nameAttribute]) || isFiltered(obj[props.descriptionAttribute])) {
      res.push(obj);
    }
    if (obj?.[props.childrenAttribute]) {
      queue.unshift(...obj[props.childrenAttribute]);
    }
  }
  return res;
}

const filteredTreeItems = computed(() => {
  let res = [];
  if (stringifiedItems.value) {
    res = findObjectById(stringifiedItems.value);
  }
  return res;
});

function processTreeItems(items, addGroup = true) {
  const res = [];
  const queue = [...items];
  while (queue.length > 0) {
    const obj = queue.shift();
    const newObj = { ...obj };

    if (newObj[props.groupAttribute] == null && obj[props.groupAttribute]) {
      newObj[props.groupAttribute] = obj[props.groupAttribute];
    }

    res.push(newObj);
    if (newObj?.[props.childrenAttribute]) {
      if (
        addGroup &&
        props.groupDefinitions?.find(
          (group) => group.id?.toString() === newObj[props.groupAttribute]?.toString()
        )
      ) {
        newObj[props.childrenAttribute] = newObj[props.childrenAttribute].map((child) => {
          const newChild = { ...child };
          newChild[props.groupAttribute] = newObj[props.groupAttribute];
          return newChild;
        });
      }
      queue.unshift(...newObj[props.childrenAttribute]);
    }
  }
  return res;
}

const treeItemsWithGroups = computed(() => processTreeItems(stringifiedItems.value, true));
const treeItems = computed(() =>
  processTreeItems(stringifiedItems.value, searchStringClient.value.length > 0)
);

const filteredGroupedItems = computed(() => {
  let listItems = stringifiedItems.value;

  if (props.kind === 'treelist') {
    listItems = treeItems.value;
  }

  if (listItems && props.groupDefinitions) {
    const ret = {};
    props.groupDefinitions?.forEach((group) => {
      ret[prepareCode(group.id)] = listItems?.filter(
        (o) =>
          prepareCode(o[props.groupAttribute]) === prepareCode(group.id) &&
          (isFiltered(o[props.nameAttribute]) || isFiltered(o[props.descriptionAttribute]))
      );
    });
    return ret;
  }
  return [];
});

function loadMore() {
  emits('loadMore');
}

function fillItemsArray() {
  let listItems = stringifiedItems.value;
  if (!props.groupDefinitions) return listItems;

  if (props.kind === 'treelist' && searchStringClient.value.length > 0) {
    listItems = treeItems.value;
  }

  const array = props.groupDefinitions.reduce((acc, group) => {
    const groupItems = listItems
      .filter((item) => item.group?.toString() === group.id?.toString())
      .sort((a, b) => a[props.orderAttribute] - b[props.orderAttribute]);
    acc[group.id.toString()] = groupItems;
    return acc;
  }, {});

  if (props.includeUnspecifiedGroups) {
    const nullGroupItems = listItems?.filter(
      (item) =>
        !props.groupDefinitions.some((group) => item.group?.toString() === group.id?.toString())
    );
    array[UNSPECIFIED_GROUP_CODE] = nullGroupItems;
  }

  return array;
}

function convertItemsArray() {
  if (!props.groupDefinitions) return stringifiedItems.value;

  const array = Object.keys(itemsArray.value).reduce((acc, key) => {
    const items = itemsArray.value[key].map((item) => {
      const originalItem = stringifiedItems.value.find(
        (original) => original[props.idAttribute] === item[props.idAttribute]
      );
      if (originalItem && props.orderAttribute in originalItem) {
        return item;
      }

      const { [props.orderAttribute]: order, ...itemWithoutOrder } = item;
      return itemWithoutOrder;
    });

    return acc.concat(items);
  }, []);

  return array;
}

function setByOrders(array) {
  if (!props.groupDefinitions) return array;
  const ret = array.sort((a, b) => a[props.orderAttribute] - b[props.orderAttribute]);
  return ret;
}

function triggerItemsArray() {
  // @ts-ignore
  itemsArray.value = fillItemsArray();
}

function searchInItemsArray() {
  if (searchStringClient.value !== '') {
    // @ts-ignore
    itemsArray.value = fillItemsArray();

    let listItems = filteredItems.value;
    if (props.kind === 'treelist') {
      listItems = filteredTreeItems.value;
    }

    Object.keys(itemsArray.value).forEach((key) => {
      if (Array.isArray(itemsArray.value[key])) {
        itemsArray.value[key] = itemsArray.value[key].filter((item) =>
          listItems?.some((filteredItem) => JSON.stringify(filteredItem) === JSON.stringify(item))
        );
      }
    });

    return;
  }
  // @ts-ignore
  itemsArray.value = fillItemsArray();
}

function clientSideSearch() {
  searchInItemsArray();
  ungroupedItemsArray.value = filteredItems.value;
  if (searchStringClient.value === '') {
    draggableIsDisabledByQuery.value = false;
  } else {
    draggableIsDisabledByQuery.value = true;
  }

  clearTimeout(invisibleBlockTimeout);
  showInvisibleBlock.value = false;
  invisibleBlockTimeout = setTimeout(() => {
    showInvisibleBlock.value = true;
  }, 1000);

  emits('update:searchString', searchStringClientRaw.value);
}

function serverSideSearch() {
  emits('search', searchStringServer.value);
}

function search(string) {
  if (string == null || string === '') {
    searchStringClientRaw.value = '';
  }

  if (props.searchSide === 'client') {
    searchStringClient.value = string;
    clientSideSearch();
  } else if (props.searchSide === 'server') {
    searchStringServer.value = string;
    serverSideSearch();
  }
}

watch(filteredItems, () => {
  if (!shouldVirtualizeDefaultList.value) return;
  nextTick(() => {
    updateDefaultListGap();
    updateDefaultListScrollOffset();
    defaultListVirtualizer.value?.value.measure();
  });
});

watch(shouldVirtualizeDefaultList, (isEnabled) => {
  if (!isEnabled) return;
  nextTick(() => {
    updateDefaultListGap();
    updateDefaultListScrollOffset();
    defaultListVirtualizer.value?.value.measure();
  });
});

watch(
  wantsDefaultListVirtualization,
  async (wants) => {
    if (wants && !defaultListVirtualizer.value) {
      await loadVueVirtual();
    }
  },
  { immediate: true }
);

watch(
  stringifiedItems,
  (items) => {
    warnAboutDuplicateItemIds(items);
  },
  { immediate: true }
);

watch(
  [filteredItems, filteredTreeItems],
  () => {
    if (
      searchStringClient.value &&
      ((props.kind !== 'treelist' && filteredItems.value.length === 0) ||
        (props.kind === 'treelist' && filteredTreeItems.value.length === 0))
    ) {
      clearTimeout(invisibleBlockTimeout);
      showInvisibleBlock.value = false;
      invisibleBlockTimeout = setTimeout(() => {
        showInvisibleBlock.value = true;
      }, 1000);
    } else {
      showInvisibleBlock.value = false;
    }
  },
  { immediate: true }
);

function handleEmptyStateActionClick(actionName) {
  emits('emptyStateActionClick', actionName);
}

function setGroupedListOrders() {
  Object.keys(itemsArray.value).forEach((key) => {
    if (Array.isArray(itemsArray.value[key])) {
      itemsArray.value[key] = itemsArray.value[key].map((element, index) => {
        const newElement = {
          ...element,
          [props.orderAttribute]: index + 1,
        };

        if (key === UNSPECIFIED_GROUP_CODE) {
          delete newElement[props.groupAttribute];
        } else {
          newElement[props.groupAttribute] =
            element[props.groupAttribute] === key ? element[props.groupAttribute] : key;
        }

        return newElement;
      });
    }
  });
}

function setListOrders() {
  ungroupedItemsArray.value = ungroupedItemsArray.value.map((element, index) => ({
    ...element,
    [props.orderAttribute]: index + 1,
  }));
}

function prepareUnGroupedItemsArray() {
  return ungroupedItemsArray.value.map((item) => {
    const originalItem = stringifiedItems.value.find(
      (propsItem) => propsItem[props.idAttribute] === item[props.idAttribute]
    );

    if (originalItem && !(props.orderAttribute in originalItem)) {
      const { [props.orderAttribute]: order, ...itemWithoutOrder } = item;
      return itemWithoutOrder;
    }

    return item;
  });
}

watch(
  () => props.includeUnspecifiedGroups,
  () => {
    triggerItemsArray();
  }
);

function onMoveItem() {
  if (props.groupDefinitions) {
    setGroupedListOrders();
    emits('update:items', convertItemsArray());
  } else {
    setListOrders();
    emits('update:items', prepareUnGroupedItemsArray());
  }
}

function changeDragging() {
  nextTick(() => {
    dragging.value = !dragging.value;
  });
}

function focusHandle(element) {
  nextTick(() => {
    document.getElementById(`handleId-${element[props.idAttribute]}`)?.focus();
  });
  onMoveItem();
}

async function moveUngroupedItem(element, direction) {
  if (props.loading || props.busy || draggableIsDisabledByQuery.value) {
    return;
  }
  const index = ungroupedItemsArray.value.findIndex(
    (obj) => obj[props.idAttribute] === element[props.idAttribute]
  );

  if (direction === 'forward' && index > 0) {
    // Move one position forward
    ungroupedItemsArray.value.splice(index, 1);
    ungroupedItemsArray.value.splice(index - 1, 0, element);
  } else if (direction === 'backward' && index < ungroupedItemsArray.value.length - 1) {
    // Move one position backward
    ungroupedItemsArray.value.splice(index, 1);
    ungroupedItemsArray.value.splice(index + 1, 0, element);
  } else if (direction === 'move-first' && index > 0) {
    // Move to the first position
    ungroupedItemsArray.value.splice(index, 1);
    ungroupedItemsArray.value.unshift(element);
  } else if (direction === 'move-last' && index < ungroupedItemsArray.value.length - 1) {
    // Move to the last position
    ungroupedItemsArray.value.splice(index, 1);
    ungroupedItemsArray.value.push(element);
  }

  focusHandle(element);
}

function calculateGroupCode(element) {
  if (element[props.groupAttribute]) {
    return prepareCode(element[props.groupAttribute]);
  }
  if (props.includeUnspecifiedGroups) {
    return UNSPECIFIED_GROUP_CODE;
  }
  return null;
}

function ensureUnspecifiedGroupExists() {
  if (props.includeUnspecifiedGroups && !itemsArray.value[UNSPECIFIED_GROUP_CODE]) {
    itemsArray.value[UNSPECIFIED_GROUP_CODE] = [];
  }
}

function getMoveContext(element) {
  const groupCode = calculateGroupCode(element);
  const groupKeys = Object.keys(itemsArray.value);
  const groupIndex = groupKeys.indexOf(groupCode);
  const itemIndex = itemsArray.value[groupCode]?.findIndex(
    (obj) => obj[props.idAttribute] === element[props.idAttribute]
  );

  return { groupCode, groupKeys, groupIndex, itemIndex };
}

function moveItem(fromGroupCode, toGroupCode, itemIndex, element, insertAtStart = false) {
  itemsArray.value[fromGroupCode].splice(itemIndex, 1);
  if (insertAtStart) {
    itemsArray.value[toGroupCode].unshift(element);
  } else {
    itemsArray.value[toGroupCode].push(element);
  }
}

function expandTargetGroup(groupCode, groupKeys) {
  const targetGroupIndex = groupKeys.indexOf(groupCode);
  if (responsiveGroupDefinitions.value[targetGroupIndex]) {
    responsiveGroupDefinitions.value[targetGroupIndex].expanded = true;
  }
}

function tryLoopMove(context, direction, element) {
  const { groupCode, groupKeys, groupIndex, itemIndex } = context;
  const isLastItemInLastGroup =
    groupIndex === groupKeys.length - 1 && itemIndex === itemsArray.value[groupCode].length - 1;
  const isFirstItemInFirstGroup = groupIndex === 0 && itemIndex === 0;

  if (isLastItemInLastGroup && direction === 'backward') {
    moveItem(groupCode, groupKeys[0], itemIndex, element);
    return true;
  }

  if (isFirstItemInFirstGroup && direction === 'forward') {
    moveItem(groupCode, groupKeys[groupKeys.length - 1], itemIndex, element, true);
    return true;
  }

  return false;
}

function tryMoveWithinGroup(context, direction, element) {
  const { groupCode, itemIndex } = context;
  const canMoveForward = direction === 'forward' && itemIndex > 0;
  const canMoveBackward =
    direction === 'backward' && itemIndex < itemsArray.value[groupCode].length - 1;

  if (!canMoveForward && !canMoveBackward) return false;

  itemsArray.value[groupCode].splice(itemIndex, 1);
  itemsArray.value[groupCode].splice(
    direction === 'forward' ? itemIndex - 1 : itemIndex + 1,
    0,
    element
  );
  return true;
}

function tryMoveAcrossGroups(context, direction, element) {
  const { groupCode, groupKeys, groupIndex, itemIndex } = context;
  const canMoveForward = direction === 'forward' && groupIndex > 0;
  const canMoveBackward = direction === 'backward' && groupIndex < groupKeys.length - 1;

  if (!canMoveForward && !canMoveBackward) return false;

  const newGroupCode = groupKeys[direction === 'forward' ? groupIndex - 1 : groupIndex + 1];
  moveItem(groupCode, newGroupCode, itemIndex, element);
  expandTargetGroup(newGroupCode, groupKeys);
  return true;
}

function tryMoveToEdge(context, direction, element) {
  const { groupCode, itemIndex } = context;
  const currentGroup = itemsArray.value[groupCode];

  if (direction === 'move-first' && itemIndex !== 0) {
    currentGroup.splice(itemIndex, 1);
    currentGroup.unshift(element);
    return true;
  }

  if (direction === 'move-last' && itemIndex !== currentGroup.length - 1) {
    currentGroup.splice(itemIndex, 1);
    currentGroup.push(element);
    return true;
  }

  return false;
}

async function moveGroupedItem(element, direction) {
  if (props.loading || props.busy || draggableIsDisabledByQuery.value) return;

  ensureUnspecifiedGroupExists();
  const context = getMoveContext(element);

  if (!context.groupCode || context.groupIndex === -1 || context.itemIndex === -1) {
    focusHandle(element);
    return;
  }

  if (tryLoopMove(context, direction, element)) {
    focusHandle(element);
    return;
  }

  if (tryMoveWithinGroup(context, direction, element)) {
    focusHandle(element);
    return;
  }

  if (tryMoveAcrossGroups(context, direction, element)) {
    focusHandle(element);
    return;
  }

  tryMoveToEdge(context, direction, element);
  focusHandle(element);
}

const dragOptions = computed(() => ({
  animation: 200,
  group: 'list',
  disabled: false,
  ghostClass: 'ghost',
}));

const filteredUngroupedItems = computed(() => {
  let listItems = filteredItems.value;
  if (props.kind === 'treelist') {
    listItems = filteredTreeItems.value;
  }
  return listItems?.filter((item) =>
    Object.values(filteredGroupedItems.value).every(
      (group) => !group?.some((groupedItem) => groupedItem.id === item.id)
    )
  );
});

const selectedItems = computed(() => {
  const ret = [];
  Object.keys(selectedItemsRaw.value).forEach((key) => {
    if (selectedItemsRaw.value[key]) {
      let isKeyValid;
      if (props.kind === 'treelist') {
        isKeyValid = treeItems?.value.some(
          (item) => item[props.idAttribute]?.toString() === key?.toString()
        );
      } else {
        isKeyValid = stringifiedItems?.value.some((item) => item[props.idAttribute] === key);
      }

      if (isKeyValid) {
        if (props.selectionKind === 'multiple' && key !== 'undefined') {
          ret.push(key);
        } else if (props.selectionKind === 'single') {
          ret[0] = key;
        }
      }
    }
  });
  emits('selectionChange', ret);
  return ret;
});

function selectRow(id) {
  selectedItemsRaw.value = {};
  selectedItemsRaw.value[id] = true;
}

function arrayToObject(arr) {
  const ret = {};
  arr.forEach((o) => {
    ret[o] = true;
  });
  return ret;
}

const isSelectable = (item) => {
  const attribute = props.selectableAttribute;
  if (item?.[attribute] === false) return false;
  return item?.[attribute] !== false;
};

const selectableItems = computed(() => stringifiedItems.value?.filter(isSelectable));
const selectableTreeItems = computed(() =>
  treeItemsWithGroups.value?.filter((item) => isSelectable(item))
);

const hasSelectableItemsInGroup = computed(() => {
  const selectableItemsMap = {};
  let listItems = stringifiedItems.value;
  if (props.kind === 'treelist') {
    listItems = treeItemsWithGroups.value;
  }

  props.groupDefinitions?.forEach((group) => {
    const groupItems = listItems?.filter(
      (o) => prepareCode(o[props.groupAttribute]) === prepareCode(group.id)
    );
    selectableItemsMap[group.id] = groupItems?.some(isSelectable) || false;
  });

  return selectableItemsMap;
});

const hasSelectAll = computed(() => {
  const items = props.kind === 'treelist' ? selectableTreeItems?.value : selectableItems?.value;

  return (
    props.hasSelecting &&
    items?.length > 0 &&
    props.kind !== 'draggable' &&
    (props.selectionKind !== 'single' || selectedItems.value.length > 0)
  );
});

const selectionState = computed(() => {
  const items = props.kind === 'treelist' ? selectableTreeItems?.value : selectableItems?.value;

  if (props.selectionKind === 'single') {
    return 'radiobutton-filled';
  }

  if (selectedItems.value.length === 0) {
    return 'checkbox';
  }

  if (selectedItems.value.length === items?.length) {
    return 'checkbox-filled';
  }

  return 'checkbox-indeterminate';
});

function selectRows(arr = null) {
  if (arr === null) {
    if (props.kind === 'treelist') {
      selectedItemsRaw.value = arrayToObject(
        treeItems.value?.filter(isSelectable)?.map((x) => x?.[props.idAttribute]?.toString())
      );
    } else {
      selectedItemsRaw.value = arrayToObject(
        stringifiedItems.value?.filter(isSelectable)?.map((x) => x?.[props.idAttribute]?.toString())
      );
    }
  } else {
    selectedItemsRaw.value = arrayToObject(
      arr?.filter(isSelectable)?.map((x) => x?.[props.idAttribute]?.toString())
    );
  }
}

function cancelSelection() {
  selectedItemsRaw.value = {};
}

const isItemSelected = (itemId) => !!selectedItemsRaw.value[itemId];

const selectedLabel = computed(() => {
  const selectableCount = stringifiedItems.value?.length?.toString();
  const selectableTreeListItems = treeItems.value?.length?.toString();
  const selectedCount = selectedItems.value?.length;
  const selectedCountDisplay = selectedCount?.toString();

  let label = displayTexts.value.items?.plural;
  let labelStart = displayTexts.value.selected?.plural;
  let ret = null;

  if (selectedCount === 1) {
    label = displayTexts.value.items?.singular;
    labelStart = displayTexts.value.selected?.singular;
  } else if (
    selectedCount > 20 &&
    (selectedCount % 10 === 2 || selectedCount % 10 === 3 || selectedCount % 10 === 4)
  ) {
    label = displayTexts.value.items?.endingWith234;
    labelStart = displayTexts.value.selected?.endingWith234;
  } else if (selectedCount > 11 && selectedCount % 10 === 1) {
    label = displayTexts.value.items?.endingWith1;
    labelStart = displayTexts.value.selected?.endingWith1;
  }

  if (props.kind === 'treelist') {
    ret = `${labelStart} ${selectedCountDisplay} ${label} ${displayTexts.value.of} ${selectableTreeListItems}`;
  } else {
    ret = `${labelStart} ${selectedCountDisplay} ${label} ${displayTexts.value.of} ${selectableCount}`;
  }
  return ret;
});

function selectionActionClick(actinoId, selectedItemsIds) {
  emits('selectionActionClick', actinoId, selectedItemsIds);
}

const states = computed({
  get() {
    // Šis vajadzīgs, jo, ja nav definēts, tad nez kāpēc props.itemsStates ir null, nevis {}
    // kā norādīts defaultā, līdz ar to komponenti nav iespējams izmantot bez props.itemsState definēšanas
    if (!props.itemsStates) return statesNotDefined.value;
    return props.itemsStates;
  },
  set(value) {
    emits('update:itemsStates', value);
  },
});

function loadChildren(id) {
  emits('loadChildren', id);
}

const groupSelectionStatuses = computed(() => {
  const res = {};
  let listItems = stringifiedItems.value;
  if (props.kind === 'treelist') {
    listItems = treeItemsWithGroups.value;
  }
  props.groupDefinitions?.forEach((group) => {
    const groupItems = listItems?.filter(
      (o) => prepareCode(o[props.groupAttribute]) === prepareCode(group.id)
    );
    const groupItemsIds = groupItems?.map((o) => o[props.idAttribute]);
    const selectedGroupItems = groupItemsIds.filter((id) => selectedItemsRaw.value[id]);
    const selectableGroupItems = groupItems?.filter((o) => isSelectable(o));

    if (selectedGroupItems?.length === 0) {
      res[group.id] = 'none';
    } else if (selectedGroupItems?.length === selectableGroupItems?.length) {
      res[group.id] = 'all';
    } else {
      res[group.id] = 'some';
    }
  });
  return res;
});

function selectSection(group) {
  const groupItems =
    props.kind === 'treelist'
      ? treeItemsWithGroups.value?.filter(
          (o) => prepareCode(o[props.groupAttribute]) === prepareCode(group.id)
        )
      : stringifiedItems.value?.filter(
          (o) => prepareCode(o[props.groupAttribute]) === prepareCode(group.id)
        );
  const groupItemsIds = groupItems.map((o) => o[props.idAttribute]);

  function selectChildren(item, select = true) {
    selectedItemsRaw.value[item[props.idAttribute]] = select;
    if (item[props.childrenAttribute]) {
      item[props.childrenAttribute].forEach((child) => {
        if (
          !child[props.groupAttribute] ||
          prepareCode(child[props.groupAttribute]) === prepareCode(group.id)
        ) {
          selectChildren(child, select);
        }
      });
    }
  }
  if (groupSelectionStatuses.value?.[group.id] === 'none') {
    groupItemsIds.forEach((id) => {
      const item = groupItems.find((o) => o[props.idAttribute] === id);
      if (isSelectable(item)) {
        selectChildren(item, true);
      }
    });
  } else {
    groupItemsIds.forEach((id) => {
      const item = groupItems.find((o) => o[props.idAttribute] === id);
      selectChildren(item, false);
    });
  }
}

function getTabIndex(id) {
  const firstSelectable = stringifiedItems.value.find((item) => isSelectable(item));
  const isFirstSelectable = firstSelectable && firstSelectable[props.idAttribute] === id;
  const hasSelectedItem = Object.keys(selectedItemsRaw.value).length > 0;

  if (selectedItemsRaw.value[id] || (isFirstSelectable && !hasSelectedItem)) {
    return 0;
  }
  return -1;
}

function getGroupedTabIndex(id, groupId) {
  let groupItems = [];
  if (groupId) {
    groupItems = stringifiedItems.value.filter(
      (o) => prepareCode(o[props.groupAttribute]) === prepareCode(groupId)
    );
  } else {
    groupItems = itemsArray.value[UNSPECIFIED_GROUP_CODE];
  }
  const firstSelectable = groupItems.find((item) => isSelectable(item));
  const isFirstSelectable = firstSelectable && firstSelectable[props.idAttribute] === id;

  const hasSelectedItemInGroup = groupItems.some(
    (item) => selectedItemsRaw.value[item[props.idAttribute]]
  );

  if (selectedItemsRaw.value[id] || (isFirstSelectable && !hasSelectedItemInGroup)) {
    return 0;
  }
  return -1;
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

function toggleSearch() {
  toolbarRef.value?.toggleSearch();
}

const draggableButtons = ref([
  {
    id: 'move-first',
    icon: 'move-first',
    name: 'Pārvietot sākumā',
  },
  {
    id: 'move-up',
    icon: 'move-up',
    name: 'Pārvietot uz augšu',
  },
  {
    id: 'move-down',
    icon: 'move-down',
    name: 'Pārvietot uz leju',
  },
  {
    id: 'move-last',
    icon: 'move-last',
    name: 'Pārvietot beigās',
  },
]);

function moveDraggableItem(direction, element, groupType) {
  if (props.loading || props.busy || draggableIsDisabledByQuery.value) {
    return;
  }
  switch (direction) {
    case 'move-first':
      if (groupType === 'grouped') {
        moveGroupedItem(element, 'move-first');
      } else {
        moveUngroupedItem(element, 'move-first');
      }
      break;
    case 'move-up':
      if (groupType === 'grouped') {
        moveGroupedItem(element, 'forward');
      } else {
        moveUngroupedItem(element, 'forward');
      }
      break;
    case 'move-down':
      if (groupType === 'grouped') {
        moveGroupedItem(element, 'backward');
      } else {
        moveUngroupedItem(element, 'backward');
      }
      break;
    case 'move-last':
      if (groupType === 'grouped') {
        moveGroupedItem(element, 'move-last');
      } else {
        moveUngroupedItem(element, 'move-last');
      }
      break;
    default:
      break;
  }
}

async function loadDraggable() {
  const lib = await loadLibrary('draggable');
  draggable.value = lib;
  loadingLib.value = false;
}

const rowId = inject('rowId', ref(null));
const labelledBy = computed(() => props.labelId || rowId.value);

watch(
  () => props.items,
  (newVal) => {
    triggerItemsArray();
    if (!props.groupDefinitions && props.kind === 'draggable') {
      ungroupedItemsArray.value = newVal;
    }
  },
  { deep: true }
);

watch(
  () => props.selectionKind,
  (newVal) => {
    if (newVal === 'single') {
      const selectedCount = Object.values(selectedItemsRaw.value).filter(
        (value) => value === true
      )?.length;
      if (selectedCount > 1) {
        const firstTrueKey = Object.keys(selectedItemsRaw.value).find(
          (key) => selectedItemsRaw.value[key] === true
        );
        selectedItemsRaw.value = { [firstTrueKey]: true };
      }
    }
  }
);

watch(
  () => props.kind,
  async () => {
    if (props.kind === 'draggable') {
      loadingLib.value = true;
      await loadDraggable();
    }
  },
  { immediate: true }
);

function isExpandable(item) {
  if (props.mode === 'client')
    return item[props.childrenAttribute] && item?.[props.childrenAttribute].length > 0;
  return item[props.hasChildrenAttribute];
}

const areSomeExpandable = computed(() => treeItems?.value.some((item) => isExpandable(item)));

function focusFirstFocusableElementAfter() {
  if (listWrapper.value) {
    focusNextFocusableElement(listWrapper.value);
  }
}

const insideForm = inject('insideForm', ref(false));

function handleToolbarActionClick(id) {
  emits('toolbarActionClick', id);
}

const toolbarActions = computed(() => {
  if (selectedItems.value?.length > 0) {
    return [];
  }
  return props.toolbarActionDefinitions;
});

onMounted(async () => {
  // @ts-ignore
  itemsArray.value = fillItemsArray();
  ungroupedItemsArray.value = setByOrders(filteredItems.value);

  if (!listWrapper.value) return;

  observer = new ResizeObserver(([entry]) => {
    globalThis.requestAnimationFrame(() => {
      const actionCount = props.selectionActionDefinitions.length;
      const breakpoint = BASE_WIDTH + actionCount * WIDTH_PER_ACTION;

      isNarrow.value = entry.contentRect.width <= breakpoint;
    });
  });

  observer.observe(listWrapper.value);

  defaultListScrollParent.value = resolveScrollParent(listWrapper.value);
  defaultListScrollTarget = resolveDefaultListScrollTarget(defaultListScrollParent.value);

  if (wantsDefaultListVirtualization.value) {
    await ensureDefaultListVirtualizer();
  }

  await nextTick();
  updateDefaultListGap();
  updateDefaultListScrollOffset();
  defaultListVirtualizer.value?.value.measure();

  setupDefaultListPositionObservers();

  defaultListScrollTarget?.addEventListener('scroll', scheduleDefaultListScrollOffsetUpdate, {
    passive: true,
  });
  globalThis.addEventListener('resize', handleDefaultListResize);
});

onBeforeUnmount(() => {
  virtualizerScope?.stop();
  observer?.disconnect();
  defaultListPositionObserver?.disconnect();
  defaultListPositionObserver = null;
  if (isDefined(defaultListScrollOffsetRaf)) {
    globalThis.cancelAnimationFrame(defaultListScrollOffsetRaf);
    defaultListScrollOffsetRaf = null;
  }
  defaultListScrollTarget?.removeEventListener('scroll', scheduleDefaultListScrollOffsetUpdate);
  defaultListScrollTarget = null;
  globalThis.removeEventListener('resize', handleDefaultListResize);
});

defineExpose({ validate, cancelSelection, selectRows, toggleSearch });
</script>

<template>
  <div
    ref="listWrapper"
    class="lx-list-wrapper"
    :class="{
      'is-narrow': isNarrow,
      'not-selectable': !hasSelecting,
      'list-inside-form': insideForm,
    }"
  >
    <LxLoaderView :loading="loadingLib" label="">
      <LxSkipLink
        v-if="props.hasSkipLink"
        :label="displayTexts.skipLinkLabel"
        :title="displayTexts.skipLinkTitle"
        :tabindex="0"
        @click="focusFirstFocusableElementAfter"
      />

      <div :class="[{ 'lx-selection-toolbar': hasSelecting && selectedItems?.length > 0 }]">
        <LxToolbar
          ref="toolbarRef"
          :id="`${id}-toolbar`"
          :actionDefinitions="toolbarActions"
          :disabled="busy"
          :loading="loading"
          :busy="busy"
          :hasSearch="hasSearch"
          v-model:searchString="reactiveSearchString"
          :searchSide="searchSide"
          :searchMode="autoSearchMode"
          :useSearchDebounce="true"
          :hasSelectAll="hasSelectAll"
          :selectionState="selectionState"
          :texts="displayTexts"
          @actionClick="handleToolbarActionClick"
          @search="search"
          @update:searchString="(searchString) => (searchStringClientRaw = searchString)"
          @selectAll="selectRows"
          @deselectAll="cancelSelection"
        >
          <template #leftArea>
            <slot
              v-if="(hasSelecting && selectedItems?.length === 0) || !hasSelecting"
              name="leftToolbar"
            />

            <div
              v-if="hasSelecting && insideForm && selectedItems?.length > 0"
              class="selection-action-button-toolbar"
            >
              <div class="selection-action-buttons">
                <LxButton
                  v-for="selectAction in selectionActionDefinitions"
                  :key="selectAction.id"
                  :id="selectAction.id"
                  :label="selectAction.name || selectAction.label"
                  :title="selectAction.title || selectAction.tooltip"
                  :loading="selectAction.loading"
                  :busy="selectAction.busy"
                  :icon="selectAction.icon"
                  :iconSet="selectAction.iconSet"
                  :destructive="selectAction.destructive"
                  :disabled="selectAction.disabled || busy || loading"
                  kind="ghost"
                  :active="selectAction.active"
                  :badge="selectAction.badge"
                  :badgeType="selectAction.badgeType"
                  :badgeIcon="selectAction.badgeIcon"
                  :badgeTitle="selectAction.badgeTitle"
                  :href="selectAction.href"
                  @click="selectionActionClick(selectAction.id, selectedItems)"
                />
              </div>

              <div
                v-if="selectionActionDefinitions?.length > 0"
                class="selection-action-buttons-small"
              >
                <LxDropDownMenu
                  :disabled="loading || busy"
                  :actionDefinitions="selectionActionDefinitions"
                  @actionClick="(id) => selectionActionClick(id, selectedItems)"
                >
                  <LxButton
                    icon="menu"
                    kind="ghost"
                    :label="displayTexts.overflowMenu"
                    variant="icon-only"
                    tabindex="-1"
                    :disabled="loading || busy"
                  />
                </LxDropDownMenu>
              </div>
            </div>

            <p
              v-if="hasSelecting && selectedItems?.length > 0 && !insideForm"
              class="lx-selection-status"
            >
              {{ selectedLabel }}
            </p>
          </template>

          <template #rightArea>
            <slot
              v-if="(hasSelecting && selectedItems?.length === 0) || !hasSelecting"
              name="toolbar"
            />

            <template v-if="selectedItems?.length > 0">
              <div v-if="hasSelecting && !insideForm" class="selection-action-button-toolbar">
                <div class="selection-action-buttons">
                  <LxButton
                    v-for="selectAction in selectionActionDefinitions"
                    :key="selectAction.id"
                    :id="selectAction.id"
                    :label="selectAction.name || selectAction.label"
                    :title="selectAction.title || selectAction.tooltip"
                    :loading="selectAction.loading"
                    :busy="selectAction.busy"
                    :icon="selectAction.icon"
                    :iconSet="selectAction.iconSet"
                    :destructive="selectAction.destructive"
                    :disabled="selectAction.disabled || busy || loading"
                    kind="ghost"
                    :active="selectAction.active"
                    :badge="selectAction.badge"
                    :badgeType="selectAction.badgeType"
                    :badgeIcon="selectAction.badgeIcon"
                    :badgeTitle="selectAction.badgeTitle"
                    :href="selectAction.href"
                    @click="selectionActionClick(selectAction.id, selectedItems)"
                  />
                </div>

                <div
                  v-if="selectionActionDefinitions?.length > 0"
                  class="selection-action-buttons-small"
                >
                  <LxDropDownMenu
                    :disabled="loading || busy"
                    :actionDefinitions="selectionActionDefinitions"
                    @actionClick="(id) => selectionActionClick(id, selectedItems)"
                  >
                    <LxButton
                      icon="menu"
                      kind="ghost"
                      :label="displayTexts.overflowMenu"
                      variant="icon-only"
                      tabindex="-1"
                      :disabled="loading || busy"
                    />
                  </LxDropDownMenu>
                </div>
              </div>

              <p
                v-if="hasSelecting && selectedItems?.length > 0 && insideForm"
                class="lx-selection-status"
              >
                {{ selectedLabel }}
              </p>
            </template>
          </template>
        </LxToolbar>
      </div>

      <div v-if="groupDefinitions && filteredUngroupedItems && filteredUngroupedItems.length > 0">
        <ul
          v-if="kind === 'default'"
          :id="id"
          class="lx-list"
          :class="[{ 'lx-list-3': listType === '3' }, { 'lx-list-2': listType === '2' }]"
          :aria-labelledby="labelledBy"
        >
          <li
            v-for="item in itemsArray[prepareCode(UNSPECIFIED_GROUP_CODE)]"
            :key="item[idAttribute]"
            class="lx-list-item-container"
          >
            <LxListItem
              :id="item[idAttribute]"
              :parentId="props.id"
              :label="item[nameAttribute]"
              :description="item[descriptionAttribute]"
              :value="item"
              :href="item[hrefAttribute]"
              :actionDefinitions="actionDefinitions"
              :actionsLayout="actionsLayout"
              :icon="item[iconAttribute] ? item[iconAttribute] : icon"
              :iconSet="item[iconSetAttribute] ? item[iconSetAttribute] : iconSet"
              :tooltip="item[tooltipAttribute]"
              :searchString="searchStringClient"
              :clickable="item[clickableAttribute]"
              :category="item[categoryAttribute]"
              :disabled="loading || busy"
              :selected="isItemSelected(item[idAttribute])"
              :texts="displayTexts"
              @click="item[hrefAttribute] ? null : handleActionClick('click', item[idAttribute])"
              @action-click="handleActionClick"
            >
              <template #customItem="item" v-if="$slots.customItem">
                <slot name="customItem" v-bind="item" v-if="$slots.customItem" />
              </template>
            </LxListItem>

            <div class="selecting-block" v-if="hasSelecting && selectableItems?.length !== 0">
              <template v-if="isSelectable(item)">
                <LxRadioButton
                  v-if="selectionKind === 'single'"
                  :id="`select-${id}-${item[idAttribute]}`"
                  v-model="selectedItemsRaw[item[idAttribute]]"
                  :value="item[idAttribute]"
                  :disabled="loading || busy"
                  :label="item[nameAttribute]"
                  :group-id="`selection-${id}`"
                  :tabindex="getGroupedTabIndex(item[idAttribute], null)"
                  @click="selectRow(item[idAttribute])"
                />
                <LxCheckbox
                  v-else
                  :id="`select-${id}-${item[idAttribute]}`"
                  v-model="selectedItemsRaw[item[idAttribute]]"
                  :value="item[idAttribute]"
                  :disabled="loading || busy"
                  :label="item[nameAttribute]"
                  :group-id="`selection-${id}`"
                />
              </template>
              <p v-else class="lx-checkbox-placeholder"></p>
            </div>
          </li>
        </ul>

        <div
          v-if="kind === 'draggable' && draggable"
          :id="id"
          class="lx-list"
          :class="[{ 'lx-list-3': listType === '3' }, { 'lx-list-2': listType === '2' }]"
        >
          <draggable
            :id="`draggable-list-${id}`"
            class="list-draggable-area"
            v-model="itemsArray[prepareCode(UNSPECIFIED_GROUP_CODE)]"
            handle=".lx-handle"
            drag-class="drag"
            v-bind="dragOptions"
            :item-key="idAttribute"
            group="list"
            tag="ul"
            :disabled="loading || busy || draggableIsDisabledByQuery"
            :aria-labelledby="labelledBy"
            @start="changeDragging"
            @end="changeDragging"
            @change="onMoveItem"
          >
            <template #item="{ element }">
              <TransitionGroupWrapper
                class="draggable-list-item-wrapper"
                type="transition"
                :name="!dragging ? 'flip-list' : null"
                tag="li"
              >
                <div class="lx-transition-layer" :key="element[idAttribute]">
                  <div v-if="!element.placeholder" class="lx-draggable-group-list-item">
                    <div class="lx-list-item-container">
                      <LxDropDownMenu
                        triggerClick="right"
                        :disabled="loading || busy || draggableIsDisabledByQuery"
                        :tabindex="-1"
                        :actionDefinitions="draggableButtons"
                        @actionClick="(id) => moveDraggableItem(id, element, 'grouped')"
                      >
                        <div
                          class="lx-handle"
                          :id="`handleId-${element[props.idAttribute]}`"
                          :tabindex="draggableIsDisabledByQuery || loading || busy ? -1 : 0"
                          :aria-label="displayTexts.draggableItem"
                          :class="[
                            {
                              'handle-disabled': draggableIsDisabledByQuery || loading || busy,
                            },
                          ]"
                          @keydown.up.prevent="moveGroupedItem(element, 'forward')"
                          @keydown.down.prevent="moveGroupedItem(element, 'backward')"
                          @keydown.right.prevent="moveGroupedItem(element, 'backward')"
                          @keydown.left.prevent="moveGroupedItem(element, 'forward')"
                        >
                          <LxIcon class="lx-icon" value="drag"></LxIcon>
                        </div>
                      </LxDropDownMenu>

                      <LxListItem
                        :id="element[idAttribute]"
                        :parentId="props.id"
                        :label="element[nameAttribute]"
                        :description="element[descriptionAttribute]"
                        :value="element"
                        :href="element[hrefAttribute]"
                        :actionDefinitions="actionDefinitions"
                        :actionsLayout="actionsLayout"
                        :icon="element[iconAttribute] ? element[iconAttribute] : icon"
                        :iconSet="element[iconSetAttribute] ? element[iconSetAttribute] : iconSet"
                        :tooltip="element[tooltipAttribute]"
                        :searchString="searchStringClient"
                        :clickable="element[clickableAttribute]"
                        :category="element[categoryAttribute]"
                        :disabled="loading || busy"
                        :texts="displayTexts"
                        @click="
                          element[hrefAttribute]
                            ? null
                            : handleActionClick('click', element[idAttribute])
                        "
                        @action-click="handleActionClick"
                      >
                        <template #customItem="item" v-if="$slots.customItem">
                          <slot name="customItem" v-bind="item" v-if="$slots.customItem" />
                        </template>
                      </LxListItem>
                    </div>
                  </div>
                </div>
              </TransitionGroupWrapper>
            </template>
          </draggable>
        </div>
      </div>

      <div v-if="groupDefinitions && kind === 'default'">
        <template v-for="group in groupDefinitions" :key="prepareCode(group.id)">
          <LxExpander
            v-if="
              (hideFilteredItems && filteredGroupedItems[prepareCode(group.id)].length > 0) ||
              !hideFilteredItems
            "
            v-model="group.expanded"
            :disabled="loading || busy"
            :badge="
              group?.badge ? group?.badge : `${filteredGroupedItems[prepareCode(group.id)].length}`
            "
            :badge-icon="group?.badgeIcon"
            :badge-type="group?.badgeType"
            :badge-title="group?.badgeTitle"
            :label="group.name"
            :id="group.id"
            :has-select-button="
              hasSelecting &&
              hasSelectableItemsInGroup[prepareCode(group.id)] &&
              selectionKind === 'multiple'
            "
            :select-status="groupSelectionStatuses?.[group.id]"
            :texts="{
              selectWholeGroup: displayTexts.selectWholeGroup,
              clearSelected: displayTexts.clearSelected,
            }"
            @select-all="selectSection(group)"
          >
            <template #customHeader v-if="$slots.customExpanderHeader">
              <slot
                name="customExpanderHeader"
                v-bind="{ item: group, expanded: group.expanded }"
              />
            </template>

            <ul
              v-if="
                filteredGroupedItems[prepareCode(group.id)] &&
                filteredGroupedItems[prepareCode(group.id)].length > 0
              "
              :id="`${id}-${prepareCode(group.id)}`"
              class="lx-list"
              :class="[{ 'lx-list-3': listType === '3' }, { 'lx-list-2': listType === '2' }]"
              :aria-labelledby="labelledBy"
            >
              <li
                v-for="item in filteredGroupedItems[prepareCode(group.id)]"
                :key="item[idAttribute]"
                class="lx-list-item-container"
              >
                <LxListItem
                  :id="item[idAttribute]"
                  :parentId="props.id"
                  :label="item[nameAttribute]"
                  :description="item[descriptionAttribute]"
                  :value="item"
                  :href="item[hrefAttribute]"
                  :actionDefinitions="actionDefinitions"
                  :actionsLayout="actionsLayout"
                  :icon="item[iconAttribute] ? item[iconAttribute] : icon"
                  :iconSet="item[iconSetAttribute] ? item[iconSetAttribute] : iconSet"
                  :tooltip="item[tooltipAttribute]"
                  :searchString="searchStringClient"
                  :clickable="item[clickableAttribute]"
                  :category="item[categoryAttribute]"
                  :disabled="loading || busy"
                  :selected="isItemSelected(item[idAttribute])"
                  :texts="displayTexts"
                  @click="
                    item[hrefAttribute] ? null : handleActionClick('click', item[idAttribute])
                  "
                  @action-click="handleActionClick"
                >
                  <template #customItem="item" v-if="$slots.customItem">
                    <slot name="customItem" v-bind="item" v-if="$slots.customItem" />
                  </template>
                </LxListItem>

                <div class="selecting-block" v-if="hasSelecting && selectableItems?.length !== 0">
                  <template v-if="isSelectable(item)">
                    <LxRadioButton
                      v-if="selectionKind === 'single'"
                      :id="`select-${id}-${item[idAttribute]}`"
                      v-model="selectedItemsRaw[item[idAttribute]]"
                      :value="item[idAttribute]"
                      :disabled="loading || busy"
                      :label="item[nameAttribute]"
                      :group-id="`selection-${id}`"
                      :tabindex="getGroupedTabIndex(item[idAttribute], group.id)"
                      @click="selectRow(item[idAttribute])"
                    />
                    <LxCheckbox
                      v-else
                      :id="`select-${id}-${item[idAttribute]}`"
                      v-model="selectedItemsRaw[item[idAttribute]]"
                      :value="item[idAttribute]"
                      :disabled="loading || busy"
                      :label="item[nameAttribute]"
                      :group-id="`selection-${id}`"
                    />
                  </template>
                  <p v-else class="lx-checkbox-placeholder"></p>
                </div>
              </li>
            </ul>
          </LxExpander>
        </template>
      </div>

      <div
        v-if="
          kind === 'treelist' &&
          itemsArray[prepareCode(UNSPECIFIED_GROUP_CODE)] &&
          filteredUngroupedItems &&
          filteredUngroupedItems.length > 0
        "
      >
        <LxTreeList
          v-if="searchStringClient?.length === 0"
          :items="itemsArray[prepareCode(UNSPECIFIED_GROUP_CODE)]"
          :idAttribute="idAttribute"
          :nameAttribute="nameAttribute"
          :descriptionAttribute="descriptionAttribute"
          :childrenAttribute="childrenAttribute"
          :hasChildrenAttribute="hasChildrenAttribute"
          :hrefAttribute="hrefAttribute"
          :clickableAttribute="clickableAttribute"
          :iconAttribute="iconAttribute"
          :iconSetAttribute="iconSetAttribute"
          :tooltipAttribute="tooltipAttribute"
          :categoryAttribute="categoryAttribute"
          :selectable-attribute="selectableAttribute"
          :action-definitions="actionDefinitions"
          :actionsLayout="actionsLayout"
          :groupDefinitions="groupDefinitions"
          :icon="icon"
          :iconSet="iconSet"
          :hasSelecting="hasSelecting"
          :selectionKind="selectionKind"
          :query="searchStringClient"
          :areSomeExpandable="areSomeExpandable"
          :disabled="busy || loading"
          v-model:selectedItems="selectedItemsRaw"
          v-model:itemsStates="states"
          :mode="mode"
          :texts="displayTexts"
          @action-click="handleActionClick"
          @loadChildren="loadChildren"
        >
          <template #customItem="items" v-if="$slots.customItem">
            <slot name="customItem" v-bind="items" />
          </template>
        </LxTreeList>

        <div class="tree-list-wrapper" v-else-if="searchStringClient?.length > 0">
          <div class="tree-list-search" role="list">
            <div
              v-for="item in itemsArray[prepareCode(UNSPECIFIED_GROUP_CODE)]"
              :key="item[idAttribute]"
              class="tree-list-search-item lx-list-item-container"
              role="listitem"
            >
              <LxListItem
                :id="item[idAttribute]"
                :parentId="props.id"
                :label="item[nameAttribute]"
                :description="item[descriptionAttribute]"
                :value="item"
                :href="item[hrefAttribute]"
                :actionDefinitions="actionDefinitions"
                :actionsLayout="actionsLayout"
                :icon="item[iconAttribute] ? item[iconAttribute] : icon"
                :iconSet="item[iconSetAttribute] ? item[iconSetAttribute] : iconSet"
                :tooltip="item[tooltipAttribute]"
                :searchString="searchStringClient"
                :clickable="item[clickableAttribute]"
                :category="item[categoryAttribute]"
                :disabled="loading || busy"
                :selected="isItemSelected(item[idAttribute])"
                :texts="displayTexts"
                @click="item[hrefAttribute] ? null : handleActionClick('click', item[idAttribute])"
                @action-click="handleActionClick"
              >
                <template #customItem="item" v-if="$slots.customItem">
                  <slot name="customItem" v-bind="item" v-if="$slots.customItem" />
                </template>
              </LxListItem>

              <div class="selecting-block" v-if="hasSelecting && selectableTreeItems?.length !== 0">
                <template v-if="isSelectable(item)">
                  <LxRadioButton
                    v-if="selectionKind === 'single'"
                    :id="`select-${id}-${item[idAttribute]}`"
                    v-model="selectedItemsRaw[item[idAttribute]]"
                    :value="item[idAttribute]"
                    :disabled="loading || busy"
                    :label="item[nameAttribute]"
                    :group-id="`selection-${id}`"
                    :tabindex="getGroupedTabIndex(item[idAttribute], null)"
                    @click="selectRow(item[idAttribute])"
                  />
                  <LxCheckbox
                    v-else
                    :id="`select-${id}-${item[idAttribute]}`"
                    v-model="selectedItemsRaw[item[idAttribute]]"
                    :value="item[idAttribute]"
                    :disabled="loading || busy"
                    :label="item[nameAttribute]"
                    :group-id="`selection-${id}`"
                  />
                </template>
                <p v-else class="lx-checkbox-placeholder"></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="kind === 'treelist' && groupDefinitions && searchStringClient?.length === 0">
        <template v-for="group in groupDefinitions" :key="prepareCode(group.id)">
          <LxExpander
            v-if="
              (hideFilteredItems && filteredGroupedItems[prepareCode(group.id)].length > 0) ||
              !hideFilteredItems
            "
            v-model="group.expanded"
            :disabled="loading || busy"
            :badge="group?.badge"
            :badge-icon="group?.badgeIcon"
            :badge-type="group?.badgeType"
            :badge-title="group?.badgeTitle"
            :label="group.name"
            :id="group.id"
            :has-select-button="
              hasSelecting &&
              hasSelectableItemsInGroup[prepareCode(group.id)] &&
              selectionKind === 'multiple'
            "
            :select-status="groupSelectionStatuses?.[group.id]"
            :texts="{
              selectWholeGroup: displayTexts.selectWholeGroup,
              clearSelected: displayTexts.clearSelected,
            }"
            @select-all="selectSection(group)"
          >
            <LxTreeList
              :items="filteredGroupedItems[prepareCode(group.id)]"
              :idAttribute="idAttribute"
              :nameAttribute="nameAttribute"
              :descriptionAttribute="descriptionAttribute"
              :childrenAttribute="childrenAttribute"
              :hasChildrenAttribute="hasChildrenAttribute"
              :hrefAttribute="hrefAttribute"
              :clickableAttribute="clickableAttribute"
              :iconAttribute="iconAttribute"
              :iconSetAttribute="iconSetAttribute"
              :tooltipAttribute="tooltipAttribute"
              :categoryAttribute="categoryAttribute"
              :selectable-attribute="selectableAttribute"
              :action-definitions="actionDefinitions"
              :actionsLayout="actionsLayout"
              :groupDefinitions="groupDefinitions"
              :icon="icon"
              :iconSet="iconSet"
              :hasSelecting="hasSelecting"
              :selectionKind="selectionKind"
              :query="searchStringClient"
              :areSomeExpandable="areSomeExpandable"
              :disabled="busy || loading"
              v-model:selectedItems="selectedItemsRaw"
              v-model:itemsStates="states"
              :mode="mode"
              :texts="displayTexts"
              @action-click="handleActionClick"
              @loadChildren="loadChildren"
            >
              <template #customItem="items" v-if="$slots.customItem">
                <slot name="customItem" v-bind="items" />
              </template>
            </LxTreeList>
          </LxExpander>
        </template>
      </div>

      <div v-if="kind === 'treelist' && groupDefinitions && searchStringClient?.length > 0">
        <template v-for="group in groupDefinitions" :key="prepareCode(group.id)">
          <LxExpander
            v-if="
              (hideFilteredItems && filteredGroupedItems[prepareCode(group.id)].length > 0) ||
              !hideFilteredItems
            "
            v-model="group.expanded"
            :disabled="loading || busy"
            :badge="group?.badge"
            :badge-icon="group?.badgeIcon"
            :badge-type="group?.badgeType"
            :badge-title="group?.badgeTitle"
            :label="group.name"
            :id="group.id"
            :has-select-button="
              hasSelecting &&
              hasSelectableItemsInGroup[prepareCode(group.id)] &&
              selectionKind === 'multiple'
            "
            :select-status="groupSelectionStatuses?.[group.id]"
            :texts="{
              selectWholeGroup: displayTexts.selectWholeGroup,
              clearSelected: displayTexts.clearSelected,
            }"
            @select-all="selectSection(group)"
          >
            <div class="tree-list-wrapper">
              <div class="tree-list-search" role="list">
                <div
                  v-for="item in filteredGroupedItems[prepareCode(group.id)]"
                  :key="item[idAttribute]"
                  class="tree-list-search-item lx-list-item-container"
                  role="listitem"
                >
                  <LxListItem
                    :id="item[idAttribute]"
                    :parentId="props.id"
                    :label="item[nameAttribute]"
                    :description="item[descriptionAttribute]"
                    :value="item"
                    :href="item[hrefAttribute]"
                    :actionDefinitions="actionDefinitions"
                    :actionsLayout="actionsLayout"
                    :icon="item[iconAttribute] ? item[iconAttribute] : icon"
                    :iconSet="item[iconSetAttribute] ? item[iconSetAttribute] : iconSet"
                    :tooltip="item[tooltipAttribute]"
                    :searchString="searchStringClient"
                    :clickable="item[clickableAttribute]"
                    :category="item[categoryAttribute]"
                    :disabled="loading || busy"
                    :selected="isItemSelected(item[idAttribute])"
                    :texts="displayTexts"
                    @click="
                      item[hrefAttribute] ? null : handleActionClick('click', item[idAttribute])
                    "
                    @action-click="handleActionClick"
                  >
                    <template #customItem="item" v-if="$slots.customItem">
                      <slot name="customItem" v-bind="item" v-if="$slots.customItem" />
                    </template>
                  </LxListItem>
                  <div
                    class="selecting-block"
                    v-if="hasSelecting && selectableTreeItems?.length !== 0"
                  >
                    <template v-if="isSelectable(item)">
                      <LxRadioButton
                        v-if="selectionKind === 'single'"
                        :id="`select-${id}-${item[idAttribute]}`"
                        v-model="selectedItemsRaw[item[idAttribute]]"
                        :value="item[idAttribute]"
                        :disabled="loading || busy"
                        :label="item[nameAttribute]"
                        :group-id="`selection-${id}`"
                        :tabindex="getGroupedTabIndex(item[idAttribute], group.id)"
                        @click="selectRow(item[idAttribute])"
                      />
                      <LxCheckbox
                        v-else
                        :id="`select-${id}-${item[idAttribute]}`"
                        v-model="selectedItemsRaw[item[idAttribute]]"
                        :value="item[idAttribute]"
                        :disabled="loading || busy"
                        :label="item[nameAttribute]"
                        :group-id="`selection-${id}`"
                      />
                    </template>
                    <p v-else class="lx-checkbox-placeholder"></p>
                  </div>
                </div>
              </div>
            </div>
          </LxExpander>
        </template>
      </div>

      <template v-if="!groupDefinitions && filteredItems && filteredItems.length > 0">
        <ul
          v-if="shouldVirtualizeDefaultList"
          ref="defaultListRef"
          :id="id"
          class="lx-list"
          :aria-labelledby="labelledBy"
          :style="{ height: `${defaultListTotalSize}px`, position: 'relative' }"
        >
          <li
            v-for="row in defaultListRows"
            :key="row.virtualKey"
            :data-index="row.virtualRow.index"
            class="lx-list-item-container"
            :ref="measureDefaultListRow"
            :style="{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              transform: `translateY(${row.virtualRow.start - defaultListScrollMargin}px)`,
            }"
          >
            <LxListItem
              :id="row.item[idAttribute]"
              :parentId="props.id"
              :label="row.item[nameAttribute]"
              :description="row.item[descriptionAttribute]"
              :value="row.item"
              :href="row.item[hrefAttribute]"
              :actionDefinitions="actionDefinitions"
              :actionsLayout="actionsLayout"
              :icon="row.item[iconAttribute] ? row.item[iconAttribute] : icon"
              :iconSet="row.item[iconSetAttribute] ? row.item[iconSetAttribute] : iconSet"
              :tooltip="row.item[tooltipAttribute]"
              :searchString="searchStringClient"
              :clickable="row.item[clickableAttribute]"
              :category="row.item[categoryAttribute]"
              :disabled="loading || busy"
              :selected="isItemSelected(row.item[idAttribute])"
              :texts="displayTexts"
              @click="
                row.item[hrefAttribute] ? null : handleActionClick('click', row.item[idAttribute])
              "
              @action-click="handleActionClick"
            >
              <template #customItem="item" v-if="$slots.customItem">
                <slot name="customItem" v-bind="item" v-if="$slots.customItem" />
              </template>
            </LxListItem>

            <div class="selecting-block" v-if="hasSelecting && selectableItems?.length !== 0">
              <template v-if="isSelectable(row.item)">
                <LxRadioButton
                  v-if="selectionKind === 'single'"
                  :id="`select-${id}-${row.item[idAttribute]}`"
                  v-model="selectedItemsRaw[row.item[idAttribute]]"
                  :value="row.item[idAttribute]"
                  :disabled="loading || busy"
                  :label="row.item[nameAttribute]"
                  :group-id="`selection-${id}`"
                  :tabindex="getTabIndex(row.item[idAttribute])"
                  @click="selectRow(row.item[idAttribute])"
                />
                <LxCheckbox
                  v-else
                  :id="`select-${id}-${row.item[idAttribute]}`"
                  v-model="selectedItemsRaw[row.item[idAttribute]]"
                  :value="row.item[idAttribute]"
                  :disabled="loading || busy"
                  :label="row.item[nameAttribute]"
                  :group-id="`selection-${id}`"
                />
              </template>
              <p v-else class="lx-checkbox-placeholder"></p>
            </div>
          </li>
        </ul>
        <ul
          v-else-if="kind === 'default'"
          :id="id"
          class="lx-list"
          :class="[
            { 'lx-list-2': normalizedListType === '2' },
            { 'lx-list-3': normalizedListType === '3' },
          ]"
          :aria-labelledby="labelledBy"
        >
          <li v-for="item in filteredItems" :key="item[idAttribute]" class="lx-list-item-container">
            <LxListItem
              :id="item[idAttribute]"
              :parentId="props.id"
              :label="item[nameAttribute]"
              :description="item[descriptionAttribute]"
              :value="item"
              :href="item[hrefAttribute]"
              :actionDefinitions="actionDefinitions"
              :actionsLayout="actionsLayout"
              :icon="item[iconAttribute] ? item[iconAttribute] : icon"
              :iconSet="item[iconSetAttribute] ? item[iconSetAttribute] : iconSet"
              :tooltip="item[tooltipAttribute]"
              :searchString="searchStringClient"
              :clickable="item[clickableAttribute]"
              :category="item[categoryAttribute]"
              :disabled="loading || busy"
              :selected="isItemSelected(item[idAttribute])"
              :texts="displayTexts"
              @click="item[hrefAttribute] ? null : handleActionClick('click', item[idAttribute])"
              @action-click="handleActionClick"
            >
              <template #customItem="item" v-if="$slots.customItem">
                <slot name="customItem" v-bind="item" v-if="$slots.customItem" />
              </template>
            </LxListItem>

            <div class="selecting-block" v-if="hasSelecting && selectableItems?.length !== 0">
              <template v-if="isSelectable(item)">
                <LxRadioButton
                  v-if="selectionKind === 'single'"
                  :id="`select-${id}-${item[idAttribute]}`"
                  v-model="selectedItemsRaw[item[idAttribute]]"
                  :value="item[idAttribute]"
                  :disabled="loading || busy"
                  :label="item[nameAttribute]"
                  :group-id="`selection-${id}`"
                  :tabindex="getTabIndex(item[idAttribute])"
                  @click="selectRow(item[idAttribute])"
                />
                <LxCheckbox
                  v-else
                  :id="`select-${id}-${item[idAttribute]}`"
                  v-model="selectedItemsRaw[item[idAttribute]]"
                  :value="item[idAttribute]"
                  :disabled="loading || busy"
                  :label="item[nameAttribute]"
                  :group-id="`selection-${id}`"
                />
              </template>
              <p v-else class="lx-checkbox-placeholder"></p>
            </div>
          </li>
        </ul>
        <div
          v-if="kind === 'draggable' && draggable"
          :id="id"
          class="lx-list"
          :class="[{ 'lx-list-3': listType === '3' }, { 'lx-list-2': listType === '2' }]"
        >
          <draggable
            :id="`draggable-list-${id}`"
            class="list-draggable-area"
            v-model="ungroupedItemsArray"
            handle=".lx-handle"
            tag="ul"
            drag-class="drag"
            v-bind="dragOptions"
            :item-key="idAttribute"
            group="list"
            :disabled="loading || busy || draggableIsDisabledByQuery"
            :aria-labelledby="labelledBy"
            @start="changeDragging"
            @end="changeDragging"
            @change="onMoveItem"
          >
            <template #item="{ element }">
              <TransitionGroupWrapper
                class="draggable-list-item-wrapper"
                type="transition"
                :name="!dragging ? 'flip-list' : null"
                tag="li"
              >
                <div class="lx-transition-layer" :key="element[idAttribute]">
                  <div v-if="!element.placeholder" class="lx-draggable-group-list-item">
                    <div class="lx-list-item-container">
                      <LxDropDownMenu
                        triggerClick="right"
                        :disabled="loading || busy || draggableIsDisabledByQuery"
                        :tabindex="-1"
                        :actionDefinitions="draggableButtons"
                        @actionClick="(id) => moveDraggableItem(id, element, 'ungrouped')"
                      >
                        <div
                          class="lx-handle"
                          :id="`handleId-${element[props.idAttribute]}`"
                          :tabindex="draggableIsDisabledByQuery || loading || busy ? -1 : 0"
                          :aria-label="displayTexts.draggableItem"
                          :class="[
                            {
                              'handle-disabled': draggableIsDisabledByQuery || loading || busy,
                            },
                          ]"
                          @keydown.up.prevent="moveUngroupedItem(element, 'forward')"
                          @keydown.down.prevent="moveUngroupedItem(element, 'backward')"
                          @keydown.right.prevent="moveUngroupedItem(element, 'backward')"
                          @keydown.left.prevent="moveUngroupedItem(element, 'forward')"
                        >
                          <LxIcon class="lx-icon" value="drag"></LxIcon>
                        </div>
                      </LxDropDownMenu>

                      <LxListItem
                        :id="element[idAttribute]"
                        :parentId="props.id"
                        :label="element[nameAttribute]"
                        :description="element[descriptionAttribute]"
                        :value="element"
                        :href="element[hrefAttribute]"
                        :actionDefinitions="actionDefinitions"
                        :actionsLayout="actionsLayout"
                        :icon="element[iconAttribute] ? element[iconAttribute] : icon"
                        :iconSet="element[iconSetAttribute] ? element[iconSetAttribute] : iconSet"
                        :tooltip="element[tooltipAttribute]"
                        :searchString="searchStringClient"
                        :clickable="element[clickableAttribute]"
                        :category="element[categoryAttribute]"
                        :disabled="loading || busy"
                        :texts="displayTexts"
                        @click="
                          element[hrefAttribute]
                            ? null
                            : handleActionClick('click', element[idAttribute])
                        "
                        @action-click="handleActionClick"
                      >
                        <template #customItem="item" v-if="$slots.customItem">
                          <slot name="customItem" v-bind="item" v-if="$slots.customItem" />
                        </template>
                      </LxListItem>
                    </div>
                  </div>
                </div>
              </TransitionGroupWrapper>
            </template>
          </draggable>
        </div>
      </template>

      <template v-for="group in responsiveGroupDefinitions" :key="prepareCode(group.id)">
        <LxExpander
          v-if="
            kind === 'draggable' &&
            ((hideFilteredItems && filteredGroupedItems[prepareCode(group.id)].length > 0) ||
              !hideFilteredItems)
          "
          v-model="group.expanded"
          :disabled="loading || busy"
          :badge="
            group?.badge ? group?.badge : `${filteredGroupedItems[prepareCode(group.id)]?.length}`
          "
          :badge-icon="group?.badgeIcon"
          :badge-type="group?.badgeType"
          :badge-title="group?.badgeTitle"
          :label="group.name"
        >
          <template #customHeader v-if="$slots.customExpanderHeader">
            <slot
              name="customExpanderHeader"
              v-bind="{ item: group, expanded: group.expanded }"
            ></slot>
          </template>

          <div
            v-if="kind === 'draggable' && draggable"
            :id="`${id}-${prepareCode(group.id)}`"
            class="lx-list"
            :class="[{ 'lx-list-3': listType === '3' }, { 'lx-list-2': listType === '2' }]"
          >
            <draggable
              class="list-draggable-area"
              :id="`draggable-list-${id}`"
              v-model="itemsArray[prepareCode(group.id)]"
              handle=".lx-handle"
              drag-class="drag"
              v-bind="dragOptions"
              :item-key="idAttribute"
              group="list"
              tag="ul"
              :disabled="loading || busy || draggableIsDisabledByQuery"
              :aria-labelledby="labelledBy"
              @start="changeDragging"
              @end="changeDragging"
              @change="onMoveItem"
            >
              <template #item="{ element }">
                <TransitionGroupWrapper
                  class="draggable-list-item-wrapper"
                  type="transition"
                  :name="!dragging ? 'flip-list' : null"
                  tag="li"
                >
                  <div class="lx-transition-layer" :key="element[idAttribute]">
                    <div v-if="!element.placeholder" class="lx-draggable-group-list-item">
                      <div class="lx-list-item-container">
                        <LxDropDownMenu
                          triggerClick="right"
                          :disabled="loading || busy || draggableIsDisabledByQuery"
                          :tabindex="-1"
                          :actionDefinitions="draggableButtons"
                          @actionClick="(id) => moveDraggableItem(id, element, 'grouped')"
                        >
                          <div
                            class="lx-handle"
                            :id="`handleId-${element[props.idAttribute]}`"
                            :tabindex="draggableIsDisabledByQuery || loading || busy ? -1 : 0"
                            :aria-label="displayTexts.draggableItem"
                            :class="[
                              {
                                'handle-disabled': draggableIsDisabledByQuery || loading || busy,
                              },
                            ]"
                            @keydown.up.prevent="moveGroupedItem(element, 'forward')"
                            @keydown.down.prevent="moveGroupedItem(element, 'backward')"
                            @keydown.right.prevent="moveGroupedItem(element, 'backward')"
                            @keydown.left.prevent="moveGroupedItem(element, 'forward')"
                          >
                            <LxIcon class="lx-icon" value="drag"></LxIcon>
                          </div>
                        </LxDropDownMenu>

                        <LxListItem
                          :id="element[idAttribute]"
                          :parentId="props.id"
                          :label="element[nameAttribute]"
                          :description="element[descriptionAttribute]"
                          :value="element"
                          :href="element[hrefAttribute]"
                          :actionDefinitions="actionDefinitions"
                          :actionsLayout="actionsLayout"
                          :icon="element[iconAttribute] ? element[iconAttribute] : icon"
                          :iconSet="element[iconSetAttribute] ? element[iconSetAttribute] : iconSet"
                          :tooltip="element[tooltipAttribute]"
                          :searchString="searchStringClient"
                          :clickable="element[clickableAttribute]"
                          :category="element[categoryAttribute]"
                          :disabled="loading || busy"
                          :selected="isItemSelected(element[idAttribute])"
                          :texts="displayTexts"
                          @click="
                            element[hrefAttribute]
                              ? null
                              : handleActionClick('click', element[idAttribute])
                          "
                          @action-click="handleActionClick"
                        >
                          <template #customItem="item" v-if="$slots.customItem">
                            <slot name="customItem" v-bind="item" v-if="$slots.customItem" />
                          </template>
                        </LxListItem>
                      </div>
                    </div>
                  </div>
                </TransitionGroupWrapper>
              </template>
            </draggable>
          </div>
        </LxExpander>
      </template>

      <div
        v-if="
          kind === 'treelist' &&
          (searchStringClient?.length === 0 || searchSide === 'server') &&
          !groupDefinitions
        "
      >
        <LxTreeList
          :items="items"
          :idAttribute="idAttribute"
          :nameAttribute="nameAttribute"
          :descriptionAttribute="descriptionAttribute"
          :childrenAttribute="childrenAttribute"
          :hasChildrenAttribute="hasChildrenAttribute"
          :hrefAttribute="hrefAttribute"
          :clickableAttribute="clickableAttribute"
          :iconAttribute="iconAttribute"
          :iconSetAttribute="iconSetAttribute"
          :tooltipAttribute="tooltipAttribute"
          :categoryAttribute="categoryAttribute"
          :selectable-attribute="selectableAttribute"
          :action-definitions="actionDefinitions"
          :actionsLayout="actionsLayout"
          :icon="icon"
          :iconSet="iconSet"
          :hasSelecting="hasSelecting"
          :selectionKind="selectionKind"
          :disabled="busy || loading"
          v-model:selected-items="selectedItemsRaw"
          v-model:itemsStates="states"
          :mode="mode"
          :texts="displayTexts"
          @actionClick="handleActionClick"
          @loadChildren="loadChildren"
        >
          <template #customItem="items" v-if="$slots.customItem">
            <slot name="customItem" v-bind="items" />
          </template>
        </LxTreeList>
      </div>

      <div
        v-else-if="
          kind === 'treelist' &&
          searchStringClient?.length > 0 &&
          searchSide === 'client' &&
          !groupDefinitions
        "
        class="tree-list-search"
        role="list"
      >
        <div
          v-for="element in filteredTreeItems"
          :key="element?.[idAttribute]"
          class="tree-list-search-item lx-list-item-container"
          role="listitem"
        >
          <LxListItem
            :id="element[idAttribute]"
            :parentId="props.id"
            :label="element[nameAttribute]"
            :description="element[descriptionAttribute]"
            :value="element"
            :href="element[hrefAttribute]"
            :actionDefinitions="actionDefinitions"
            :actionsLayout="actionsLayout"
            :icon="element[iconAttribute] ? element[iconAttribute] : icon"
            :iconSet="element[iconSetAttribute] ? element[iconSetAttribute] : iconSet"
            :tooltip="element[tooltipAttribute]"
            :searchString="searchStringClient"
            :clickable="element[clickableAttribute]"
            :category="element[categoryAttribute]"
            :disabled="loading || busy"
            :selected="isItemSelected(element[idAttribute])"
            :texts="displayTexts"
            @click="
              element[hrefAttribute] ? null : handleActionClick('click', element[idAttribute])
            "
            @action-click="handleActionClick"
          >
            <template #customItem="item" v-if="$slots.customItem">
              <slot name="customItem" v-bind="item" />
            </template>
          </LxListItem>

          <div class="selecting-block" v-if="hasSelecting && selectableTreeItems?.length !== 0">
            <template v-if="isSelectable(element)">
              <LxRadioButton
                v-if="selectionKind === 'single'"
                :id="`select-${id}-${element[idAttribute]}`"
                v-model="selectedItemsRaw[element[idAttribute]]"
                :value="element[idAttribute]"
                :disabled="loading || busy"
                :label="element[nameAttribute]"
                :group-id="`selection-${id}`"
                :tabindex="getTabIndex(element[idAttribute])"
                @click="selectRow(element[idAttribute])"
              />
              <LxCheckbox
                v-else
                :id="`select-${id}-${element[idAttribute]}`"
                v-model="selectedItemsRaw[element[idAttribute]]"
                :value="element[idAttribute]"
                :disabled="loading || busy"
                :label="element[nameAttribute]"
                :group-id="`selection-${id}`"
              />
            </template>
            <p v-else class="lx-checkbox-placeholder"></p>
          </div>
        </div>
      </div>

      <LxEmptyState
        v-if="items?.length === 0 && !(loading || busy) && !searchStringClientRaw"
        :label="displayTexts?.noItems"
        :description="displayTexts?.noItemsDescription"
        :icon="emptyStateIcon"
        :actionDefinitions="emptyStateActionDefinitions"
        @actionClick="handleEmptyStateActionClick"
      />
      <LxEmptyState
        v-if="
          searchStringClientRaw &&
          filteredItems &&
          ((props.kind !== 'treelist' && filteredItems.length === 0) ||
            (props.kind === 'treelist' && filteredTreeItems?.length === 0))
        "
        :label="`${displayTexts.notFoundSearch} ${JSON.stringify(searchStringClientRaw)}`"
        :announce="showInvisibleBlock"
      />
      <div class="lx-load-more-button" v-if="showLoadMore">
        <LxButton
          :label="displayTexts.loadMore"
          icon="add-item"
          kind="tertiary"
          :busy="loading"
          :loading="loading"
          :disabled="busy || items?.length === 0"
          @click="loadMore()"
        />
      </div>

      <div class="lx-list-loader" v-if="!showLoadMore && loading">
        <LxLoader :loading="loading" size="s" />
      </div>
    </LxLoaderView>
  </div>
</template>
