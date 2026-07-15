<script setup>
import { computed, ref } from 'vue';
import LxDropDownMenu from '@/components/DropDownMenu.vue';
import { getDisplayTexts } from '@/utils/generalUtils';
import { generateUUID } from '@/utils/stringUtils';
import { useBreadcrumbsResponsiveness } from '@/hooks/useBreadcrumbsResponsiveness';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  items: {
    type: Array,
    required: false,
    default: () => [], // [{ label: 'Home', to: { name: 'home' } }]
  },
  texts: { type: Object, default: () => ({}) },
});

const defaultTexts = {
  tooltip: 'Papildu sadaļas',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, defaultTexts));

const breadcrumbsRef = ref(null);

const { collapsed, overflowIndexes, trailingIndexes, truncateFirst } = useBreadcrumbsResponsiveness(
  {
    containerRef: breadcrumbsRef,
    crumbs: computed(() => props.items),
  }
);

const firstCrumb = computed(() => props.items[0] ?? null);

const overflowActions = computed(() =>
  overflowIndexes.value.map((index) => ({
    id: `${props.id}-crumb-${index}`,
    name: props.items[index]?.label,
    label: props.items[index]?.label,
    to: props.items[index]?.to,
  }))
);

const trailingCrumbs = computed(() =>
  trailingIndexes.value.map((index) => ({
    index,
    to: props.items[index]?.to,
    label: props.items[index]?.label,
  }))
);
</script>
<template>
  <ul
    ref="breadcrumbsRef"
    :id="id"
    class="lx-breadcrumbs"
    :class="{ 'lx-breadcrumbs-truncate-first': truncateFirst }"
  >
    <li class="lx-breadcrumb">
      <router-link :to="firstCrumb.to">{{ firstCrumb.label }}</router-link>
    </li>
    <li v-if="collapsed" class="lx-breadcrumb lx-breadcrumb-overflow">
      <LxDropDownMenu
        :actionDefinitions="overflowActions"
        placement="bottom-start"
        :texts="displayTexts"
      >
        <span
          class="lx-breadcrumb-overflow-toggle"
          :title="displayTexts.tooltip"
          :aria-label="displayTexts.tooltip"
          >...</span
        >
      </LxDropDownMenu>
    </li>
    <li v-for="crumb in trailingCrumbs" :key="crumb.index" class="lx-breadcrumb">
      <router-link :to="crumb.to">{{ crumb.label }}</router-link>
    </li>
  </ul>
</template>
