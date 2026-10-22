<script setup>
import { computed, defineAsyncComponent, getCurrentInstance, inject, ref, watch } from 'vue';
import { useEventListener } from '@vueuse/core';

import LxIcon from '@/components/Icon.vue';
import { shellContextKey } from '@/components/shell/shellContext';

const LxAutoComplete = defineAsyncComponent(() => import('@/components/AutoComplete.vue'));

const componentProps = defineProps({
  id: { type: String, required: true },
  autoOpen: { type: Boolean, default: false },
  tabindex: { type: [Number, String], default: 0 },
});

const componentEmits = defineEmits(['select', 'openDetails']);

const { props, displayTexts, emits } = inject(shellContextKey, {});
const router = getCurrentInstance()?.appContext.config.globalProperties.$router;

const texts = computed(() => displayTexts.value.globalSearch);

const autoCompleteTexts = computed(() => ({
  try: texts.value.hint,
  tryEndingWith1: texts.value.hint,
  empty: texts.value.notFound,
  detailsButton: texts.value.details,
}));

const rootRef = ref(null);
const autoCompleteRef = ref(null);
const query = ref('');

const items = computed(() => (query.value?.trim() ? props.globalSearchItems : []));
const resultsHaveIcons = computed(() => items.value.some((item) => item?.icon));

function search(value) {
  if (value) emits('globalSearch', value);
}

// LxAutoComplete loads on demand, so open its menu once it actually mounts
watch(autoCompleteRef, (autoComplete) => {
  if (autoComplete && componentProps.autoOpen)
    rootRef.value?.querySelector('.lx-autocomplete')?.click();
});

const selectedModel = computed({
  get: () => null,
  set(item) {
    if (!item) return;
    emits('globalSearchItemClick', item);
    if (item.href) router?.push(item.href);
    componentEmits('select', item);
  },
});

function openDetails() {
  emits('globalSearchDetailsClick', query.value);
  componentEmits('openDetails');
}

function getDetailsButton() {
  return rootRef.value?.querySelector(`#${componentProps.id}-detailsButton`);
}

function isInSearch(target) {
  return (
    rootRef.value?.contains(target) ||
    !!target?.closest?.(`.popper:has(#${componentProps.id}-listbox)`)
  );
}

// Runs before LxAutoComplete's own handlers, which would clear the query on Tab
useEventListener(
  document,
  'keydown',
  (event) => {
    if (!isInSearch(event.target)) return;
    const detailsButton = getDetailsButton();
    const isOnDetails = event.target === detailsButton;

    if (isOnDetails && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === ' ') openDetails();
    } else if (event.key === 'Tab' && !event.shiftKey && !isOnDetails && detailsButton) {
      event.preventDefault();
      event.stopPropagation();
      detailsButton.focus();
    }
  },
  { capture: true }
);

defineExpose({ isInSearch, getDetailsButton });
</script>

<template>
  <div ref="rootRef" class="lx-global-search-input">
    <LxAutoComplete
      ref="autoCompleteRef"
      :id="componentProps.id"
      mode="new"
      :tabindex="componentProps.tabindex"
      v-model="selectedModel"
      v-model:searchString="query"
      :items="items"
      :loading="props.globalSearchLoading"
      :queryMinLength="1"
      :hasDetails="true"
      detailMode="simple"
      :placeholder="texts.placeholder"
      :texts="autoCompleteTexts"
      @search="search"
      @openDetails="openDetails"
    >
      <template #customItem="{ item }">
        <span
          class="lx-autocomplete-item-content lx-global-search-result"
          :class="{ 'lx-global-search-result-with-icon': resultsHaveIcons }"
        >
          <LxIcon v-if="item.icon" :value="item.icon" :iconSet="item.iconSet" />
          <span>{{ item.name }}</span>
        </span>
      </template>
    </LxAutoComplete>
  </div>
</template>
