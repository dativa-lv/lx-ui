<script setup>
import { ref, computed, nextTick } from 'vue';
import LxList from '@/components/list/List.vue';
import useLx from '@/hooks/useLx';
import { getDisplayTexts } from '@/utils/generalUtils';
import { generateUUID, foldToAscii } from '@/utils/stringUtils';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  items: { type: Array, default: () => [] },
  searchString: { type: String, default: null },
  searchSide: { type: String, default: 'client' }, // client, server
  // { builder: LxFilterBuilder (lx-builders), schema, texts, columnCount }
  advancedSearchOptions: { type: Object, default: null },
  filters: { type: Object, default: null },
  filtersExpanded: { type: Boolean, default: undefined },
  idAttribute: { type: String, default: 'id' },
  nameAttribute: { type: String, default: 'name' },
  descriptionAttribute: { type: String, default: 'description' },
  hrefAttribute: { type: String, default: 'href' },
  clickableAttribute: { type: String, default: 'clickable' },
  iconAttribute: { type: String, default: 'icon' },
  iconSetAttribute: { type: String, default: 'iconSet' },
  tooltipAttribute: { type: String, default: 'tooltip' },
  categoryAttribute: { type: String, default: 'category' },
  icon: { type: String, default: 'open' },
  iconSet: { type: String, default: () => useLx().getGlobals()?.iconSet },
  listType: { type: String, default: '1' }, // 1, 2, 3
  actionDefinitions: { type: Array, default: null },
  showLoadMore: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  hasVirtualization: { type: Boolean, default: true },
  texts: { type: Object, default: () => ({}) },
});

const emits = defineEmits([
  'update:searchString',
  'update:filters',
  'update:filtersExpanded',
  'search',
  'filter',
  'resetFilters',
  'actionClick',
  'loadMore',
]);

const textsDefault = {
  placeholder: 'Ievadiet meklējamo tekstu',
  search: 'Meklēt',
  clear: 'Notīrīt',
  noItems: 'Nav ierakstu',
  noItemsDescription: '',
  notFoundSearch: 'Nav atrasts:',
  loadMore: 'Ielādēt vēl',
  openSearch: 'Atvērt meklētāju',
  closeSearch: 'Aizvērt meklētāju',
  overflowMenu: 'Atvērt papildu iespējas',
  loadingStart: 'Notiek ielāde',
  loadingEnd: 'Ielāde ir pabeigta',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault, 'LxSearchView'));

const advancedSearch = computed(() => ({
  columnCount: 2,
  ...props.advancedSearchOptions,
  texts: { filters: 'Izvērstā meklēšana', ...props.advancedSearchOptions?.texts },
}));

const internalSearchString = ref(props.searchString);
const query = computed({
  get() {
    return props.searchString ?? internalSearchString.value;
  },
  set(value) {
    internalSearchString.value = value;
    emits('update:searchString', value);
  },
});

const filtersModel = computed({
  get() {
    return props.filters;
  },
  set(value) {
    emits('update:filters', value);
  },
});

const internalFiltersExpanded = ref(false);
const isFiltersExpanded = computed({
  get() {
    return props.filtersExpanded === undefined
      ? internalFiltersExpanded.value
      : props.filtersExpanded;
  },
  set(value) {
    internalFiltersExpanded.value = value;
    emits('update:filtersExpanded', value);
  },
});

const hasAdvancedSearch = computed(() =>
  Boolean(props.advancedSearchOptions?.builder && props.advancedSearchOptions?.schema)
);

function matchesQuery(item, normalizedQuery) {
  return [item[props.nameAttribute], item[props.descriptionAttribute]].some((value) =>
    foldToAscii(value?.toString() || '')
      .toLowerCase()
      .includes(normalizedQuery)
  );
}

function hasValue(value) {
  if (value === null || value === undefined || value === '' || value === false) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.values(value).some(hasValue);
  return true;
}

// Filters count only after being applied; server side query counts only after being submitted
const appliedFilters = ref(null);
const submittedQuery = ref(query.value);

const activeQuery = computed(() =>
  (props.searchSide === 'client' ? query.value : submittedQuery.value)?.trim()
);
const isSearchActive = computed(() => Boolean(activeQuery.value) || hasValue(appliedFilters.value));

// Nothing shown until searched; client prefilter avoids a flash of all items before LxList's debounced search
const displayItems = computed(() => {
  if (!isSearchActive.value) return [];
  const normalizedQuery = foldToAscii(activeQuery.value || '').toLowerCase();
  const items = (props.items || []).map((item) => ({
    ...item,
    [props.clickableAttribute]: item[props.clickableAttribute] ?? true,
  }));
  if (props.searchSide !== 'client' || !normalizedQuery) return items;
  return items.filter((item) => matchesQuery(item, normalizedQuery));
});

// Emits only applied filters, not unconfirmed filter form edits
function search() {
  submittedQuery.value = query.value;
  emits('search', query.value, appliedFilters.value);
}

// LxList emits search before update:searchString (e.g. on clear), so wait for the model
function handleListSearch() {
  nextTick(search);
}

function filter() {
  appliedFilters.value = props.filters ? { ...props.filters } : null;
  emits('filter', appliedFilters.value);
  search();
}

function resetFilters() {
  appliedFilters.value = null;
  emits('resetFilters');
  search();
}

function focusToolbar() {
  document.getElementById(`${props.id}-list-toolbar-search-input`)?.focus();
}

defineExpose({ focusToolbar });
</script>

<template>
  <div :id="id" class="lx-search-view">
    <component
      v-if="hasAdvancedSearch"
      :is="advancedSearch.builder"
      :id="`${id}-filters`"
      v-model="filtersModel"
      v-model:expanded="isFiltersExpanded"
      :schema="advancedSearch.schema"
      :texts="advancedSearch.texts"
      :columnCount="advancedSearch.columnCount"
      :disabled="loading || busy"
      @filter="filter"
      @resetFilters="resetFilters"
    />

    <LxList
      :id="`${id}-list`"
      :items="displayItems"
      :hasSearch="true"
      :searchSide="searchSide"
      v-model:searchString="query"
      :idAttribute="idAttribute"
      :nameAttribute="nameAttribute"
      :descriptionAttribute="descriptionAttribute"
      :hrefAttribute="hrefAttribute"
      :clickableAttribute="clickableAttribute"
      :iconAttribute="iconAttribute"
      :iconSetAttribute="iconSetAttribute"
      :tooltipAttribute="tooltipAttribute"
      :categoryAttribute="categoryAttribute"
      :icon="icon"
      :iconSet="iconSet"
      :listType="listType"
      :actionDefinitions="actionDefinitions"
      :showLoadMore="showLoadMore"
      :loading="loading"
      :busy="busy"
      :hasVirtualization="hasVirtualization"
      :texts="displayTexts"
      @search="handleListSearch"
      @actionClick="(actionId, itemId) => emits('actionClick', actionId, itemId)"
      @loadMore="emits('loadMore')"
    />
  </div>
</template>
