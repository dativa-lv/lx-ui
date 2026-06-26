<script setup>
import { computed } from 'vue';
import { getDisplayTexts } from '@/utils/generalUtils';

const props = defineProps({
  texts: { type: Object, default: () => ({}) },
});

const textsDefault = {
  emptyValue: 'Nav norādīts',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));
</script>

<template>
  <span>
    <span aria-hidden="true" :title="displayTexts.emptyValue">—</span>
    <span class="lx-invisible">{{ displayTexts.emptyValue }}</span>
  </span>
</template>
