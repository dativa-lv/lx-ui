<script setup>
import { computed, ref } from 'vue';
import LxDialog from '@/components/Dialog.vue';
import { generateUUID } from '@/utils/stringUtils';
import { getDisplayTexts } from '@/utils/generalUtils';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  label: { type: String, default: '' }, // label of the confirmed button
  destructive: { type: Boolean, default: false },
  kind: {
    type: String,
    default: 'warning',
    options: ['default', 'question', 'info', 'warning', 'error', 'success'],
  },
  texts: { type: Object, default: () => ({}) },
});

const textsDefault = {
  dialogLabel: 'Vai tiešām gribat {0}?', // {0} - button label (props.label)
  dialogDescription: null,
  dialogPrimaryLabel: 'Jā, {0}', // {0} - button label (props.label)
  dialogSecondaryLabel: 'Nē',
  dialogClose: 'Aizvērt',
};

const emits = defineEmits(['confirm', 'close']);

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault, 'LxConfirmButton'));

const dialogRef = ref(null);

// "Dzēst" -> "dzēst", but keep acronyms like "PDF" intact
const labelInSentence = computed(() => {
  const label = props.label?.trim() || '';
  if (
    label.length > 1 &&
    label[1] === label[1].toUpperCase() &&
    label[1] !== label[1].toLowerCase()
  )
    return label;
  return label.charAt(0).toLowerCase() + label.slice(1);
});

const dialogLabelDisplay = computed(() =>
  displayTexts.value.dialogLabel?.replace('{0}', labelInSentence.value)
);

const actionDefinitions = computed(() => [
  {
    id: 'primary',
    kind: 'primary',
    name: displayTexts.value.dialogPrimaryLabel?.replace('{0}', labelInSentence.value),
    destructive: props.destructive,
  },
  {
    id: 'secondary',
    kind: 'secondary',
    name: displayTexts.value.dialogSecondaryLabel,
  },
]);

function open() {
  dialogRef.value?.open();
}

function close() {
  dialogRef.value?.close();
}

function dialogActionClick(actionId) {
  if (actionId === 'primary') emits('confirm');
}

defineExpose({ open, close });
</script>
<template>
  <LxDialog
    ref="dialogRef"
    :id="id"
    :kind="kind"
    :label="dialogLabelDisplay"
    :description="displayTexts.dialogDescription"
    :actionDefinitions="actionDefinitions"
    :buttonSecondaryIsCancel="true"
    :texts="{ close: displayTexts.dialogClose }"
    @actionClick="dialogActionClick"
    @close="emits('close')"
  />
</template>
