<script setup>
import { computed } from 'vue';
import LxIcon from '@/components/Icon.vue';
import LxEmptyValue from '@/components/EmptyValue.vue';
import { getDisplayTexts } from '@/utils/generalUtils';
import { generateUUID } from '@/utils/stringUtils';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  value: { type: [Object, String, Number], default: null },
  dictionary: { type: Array, default: () => [{}] },
  texts: { type: Object, default: () => ({}) },
});

const textsDefault = {
  emptyValue: 'Nav norādīts',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));

const outlineTypes = new Set([
  'draft',
  'editing',
  'finishing',
  'disabling',
  'deleting',
  'red',
  'green',
  'blue',
  'black',
  'purple',
  'orange',
  'yellow',
  'teal',
]);

const availableIcons = new Set([
  'draft',
  'new',
  'edited',
  'disabled',
  'inactive',
  'finished',
  'deleted',
  'ongoing',
  'incomplete',
  'waiting',
  'signed',
  'error',
  'default',
]);

const numDictionary = {
  0: 'zero',
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
};

const definition = computed(() =>
  props.dictionary?.find((o) => o.value?.toString() === props.value?.toString())
);

function getStatusIcon(displayType) {
  let iconName = displayType;

  switch (displayType) {
    case 'finishing':
      iconName = 'finished';
      break;
    case 'editing':
      iconName = 'edited';
      break;
    case 'deleting':
      iconName = 'deleted';
      break;
    case 'disabling':
      iconName = 'disabled';
      break;
    default:
      break;
  }
  return availableIcons.has(iconName) ? `status-${iconName}` : 'status-default';
}

function getCustomStatusIcon(options, displayType) {
  const numIcon = numDictionary[options?.num];

  if (numIcon) {
    return outlineTypes.has(displayType) ? `status-${numIcon}-outline` : `status-${numIcon}-filled`;
  }
  return 'status-default';
}

// Shapes are drawn as icons so their size stays predictable across browsers
function getShapeIcon(displayShape, displayType) {
  const shape = displayShape === 'diamond' ? 'diamond' : 'circle';
  return outlineTypes.has(displayType) ? `status-${shape}-outline` : `status-${shape}-filled`;
}

const isIconOnly = computed(() => !String(definition.value?.displayName ?? '').trim());

const stateIcon = computed(() => {
  const { displayShape, displayType, options } = definition.value || {};

  if (displayShape === 'icon') return getStatusIcon(displayType);
  if (displayShape === 'custom') return getCustomStatusIcon(options, displayType);
  return getShapeIcon(displayShape, displayType);
});
</script>
<template>
  <!--
    displayTypes: 
        draft, new, editing, edited, disabling, disabled, inactive, finishing, finished, deleting, deleted, ongoing, incomplete, waiting, signed, error, default
        red, green, blue, black, purple, orange, yellow, teal,
        red-full, green-full, blue-full, black-full, purple-full, orange-full, yellow-full, teal-full;
    displayShapes: circle, diamond, icon, custom;
  -->

  <div
    v-if="definition"
    class="lx-state"
    :class="[
      `lx-state-${definition?.displayType} ${
        definition?.displayShape ? `lx-state-shape-${definition?.displayShape}` : ''
      }`,
      { 'lx-tooltip-state': definition?.title, 'lx-state-icon-only': isIconOnly },
    ]"
    v-tooltip="definition?.title"
    data-component="lx-state-display"
    :id="id"
  >
    <LxIcon
      class="lx-state-icon"
      :value="stateIcon"
      :title="definition?.title"
      :iconSet="definition?.iconSet"
    />
    <div v-if="!isIconOnly" class="lx-state-text">{{ definition?.displayName }}</div>
  </div>
  <LxEmptyValue v-else :texts="{ emptyValue: displayTexts.emptyValue }" />
</template>
