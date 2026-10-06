import { computed, isRef, reactive, ref, toValue, watch } from 'vue';
import useLx from '@/hooks/useLx';
import { logError } from '@/utils/devUtils';

/**
 * Async search state for LxAutoComplete in `mode="new"`.
 * Bind `items`, `loading` and `@search` (or all of it with `v-bind="search.bindings"`); the component
 * emits `search` and this loads the items.
 *
 * @param {(query: string) => Promise<Array>} fetchItems - Returns items for the query
 * @param {Object} [options]
 * @param {number | import('vue').Ref<number> | (() => number)} [options.queryMinLength=0] - Shorter queries show `initialItems` instead of fetching
 * @param {Array | import('vue').Ref<Array> | (() => Array)} [options.initialItems=[]] - Items shown before the user types
 * @param {string | import('vue').Ref<string>} [options.searchString] - Typed text; a ref is kept in sync both ways
 * @param {boolean} [options.immediate] - Fetch for an empty query right away (default: when queryMinLength is 0 and there is no searchString)
 */
export default function useAutoCompleteSearch(fetchItems, options = {}) {
  const minLength = computed(() => toValue(options.queryMinLength) || 0);
  const initialItems = computed(() => toValue(options.initialItems) || []);
  // A ref is used as is, so the caller's value follows the typed text
  const searchString = isRef(options.searchString)
    ? options.searchString
    : ref(options.searchString || '');
  // An initial searchString is searched for by the component itself
  const immediate = options.immediate ?? (minLength.value <= 0 && !searchString.value);

  const items = ref([...initialItems.value]);
  const loading = ref(false);
  const query = ref('');
  let latestRequestId = 0;

  const isBelowMinLength = (value) => minLength.value > 0 && value.length < minLength.value;

  async function search(value = '') {
    query.value = value;
    latestRequestId += 1;
    const requestId = latestRequestId;

    if (isBelowMinLength(value)) {
      items.value = [...initialItems.value];
      loading.value = false;
      return;
    }

    loading.value = true;
    try {
      const result = await fetchItems(value);
      // Ignore responses that arrive after a newer request
      if (requestId === latestRequestId) items.value = Array.isArray(result) ? result : [];
    } catch (e) {
      if (requestId === latestRequestId) items.value = [];
      logError(`useAutoCompleteSearch: ${e?.message || e}`, useLx().getGlobals()?.environment);
    } finally {
      if (requestId === latestRequestId) loading.value = false;
    }
  }

  function reset() {
    latestRequestId += 1;
    query.value = '';
    items.value = [...initialItems.value];
    loading.value = false;
  }

  // Initial items that arrive later (e.g. loaded saved values) replace the shown ones before a search
  watch(initialItems, (value) => {
    if (isBelowMinLength(query.value)) items.value = [...value];
  });

  if (immediate) search('');

  const bindings = reactive({
    items,
    loading,
    queryMinLength: minLength,
    searchString,
    onSearch: search,
    'onUpdate:searchString': (value) => {
      searchString.value = value;
    },
  });

  return { items, loading, query, searchString, search, reset, bindings };
}
