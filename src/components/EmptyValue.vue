<script setup>
import { computed } from 'vue';
import { getDisplayTexts } from '@/utils/generalUtils';
import { generateUUID } from '@/utils/stringUtils';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  texts: { type: Object, default: () => ({}) },
});

const textsDefault = {
  emptyValue: 'Nav norādīts',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));
</script>

<template>
  <span :data-id="id">
    <span aria-hidden="true" v-tooltip="displayTexts.emptyValue">—</span>
    <span class="lx-invisible">{{ displayTexts.emptyValue }}</span>
  </span>
</template>
