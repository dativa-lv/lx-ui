<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import LxButton from '@/components/Button.vue';
import LxDialog from '@/components/Dialog.vue';
import useLx from '@/hooks/useLx';
import { generateUUID } from '@/utils/stringUtils';
import { getDisplayTexts } from '@/utils/generalUtils';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  label: { type: String, default: '', required: true },
  title: { type: String, default: '' },
  busyTooltip: { type: String, default: '' },
  icon: { type: String, default: '' },
  iconSet: { type: String, default: () => useLx().getGlobals()?.iconSet }, // cds, material, brand, phosphor
  iconVariant: { type: String, default: 'default' },
  kind: {
    type: String,
    default: 'primary',
    options: ['primary', 'secondary', 'tertiary', 'ghost', 'menuitem'],
  },
  variant: { type: String, default: 'default', options: ['default', 'icon-only'] },
  destructive: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  ariaLabel: { type: String, default: null },
  badge: { type: String, default: '' },
  badgeIcon: { type: String, default: null },
  badgeType: {
    type: String,
    default: 'default',
    options: ['default', 'info', 'success', 'warning', 'error'],
  },
  badgeTitle: { type: String, default: null },
  active: { type: Boolean, default: false },
  tabindex: { type: [Number, String], default: 0 },
  customClass: { type: String, default: '' },
  dialogKind: {
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
  badgeTypes: {
    default: 'informatīvs paziņojums',
    info: 'informatīvs paziņojums',
    success: 'sekmīgs paziņojums',
    warning: 'brīdinājums',
    error: 'svarīgs paziņojums',
  },
};

const emits = defineEmits(['click', 'cancel']);

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault, 'LxConfirmButton'));

const buttonRef = ref(null);
const dialogRef = ref(null);
const pendingClickArgs = ref(null);

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

const HOLD_START_DELAY = 300;
const HOLD_DURATION = 1500;
const HOLD_DONE_DURATION = 1000;

const holdState = ref('idle'); // idle, pressed, holding, done
let holdTimers = [];
let suppressClick = false;

const isHoldDisabled = computed(() => props.disabled || props.loading || props.busy);

const holdClass = computed(() =>
  [
    props.customClass,
    'lx-confirm-button-hold',
    holdState.value === 'holding' && 'lx-confirm-button-holding',
    holdState.value === 'done' && 'lx-confirm-button-hold-done',
  ]
    .filter(Boolean)
    .join(' ')
);

const holdStyle = { '--lx-confirm-hold-duration': `${HOLD_DURATION - HOLD_START_DELAY}ms` };

function clearHoldTimers() {
  holdTimers.forEach(clearTimeout);
  holdTimers = [];
}

function holdStart(e) {
  if (isHoldDisabled.value || holdState.value !== 'idle') return;
  suppressClick = false;
  holdState.value = 'pressed';
  holdTimers.push(
    setTimeout(() => {
      holdState.value = 'holding';
    }, HOLD_START_DELAY),
    setTimeout(() => {
      clearHoldTimers();
      holdState.value = 'done';
      suppressClick = true;
      emits('click', e);
      holdTimers.push(
        setTimeout(() => {
          holdState.value = 'idle';
        }, HOLD_DONE_DURATION)
      );
    }, HOLD_DURATION)
  );
}

function holdEnd() {
  if (holdState.value === 'holding') suppressClick = true;
  if (holdState.value === 'pressed' || holdState.value === 'holding') {
    clearHoldTimers();
    holdState.value = 'idle';
  }
}

function pointerDown(e) {
  if (e.button !== 0) return;
  holdStart(e);
}

function keyDown(e) {
  if (e.repeat || (e.key !== 'Enter' && e.key !== ' ')) return;
  holdStart(e);
}

function keyUp(e) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  holdEnd();
}

function contextMenu(e) {
  if (holdState.value !== 'idle') e.preventDefault();
}

function buttonClick(...args) {
  if (suppressClick || holdState.value === 'holding' || holdState.value === 'done') {
    suppressClick = false;
    return;
  }
  pendingClickArgs.value = args;
  open();
}

function dialogActionClick(actionId) {
  if (actionId !== 'primary') return;
  const args = pendingClickArgs.value || [];
  pendingClickArgs.value = null;
  close();
  emits('click', ...args);
}

function dialogClose() {
  if (pendingClickArgs.value) {
    pendingClickArgs.value = null;
    emits('cancel');
  }
  buttonRef.value?.focus();
}

onBeforeUnmount(clearHoldTimers);

defineOptions({ inheritAttrs: false });

defineExpose({
  open,
  close,
  focus: () => buttonRef.value?.focus(),
  scrollIntoView: (options = {}) => buttonRef.value?.scrollIntoView(options),
  getElement: () => buttonRef.value?.getElement() ?? null,
});
</script>
<template>
  <LxButton
    ref="buttonRef"
    :id="id"
    :label="label"
    :title="title"
    :busyTooltip="busyTooltip"
    :icon="holdState === 'done' && icon ? 'tick' : icon"
    :iconSet="iconSet"
    :iconVariant="iconVariant"
    :kind="kind"
    :variant="variant"
    :destructive="destructive"
    :disabled="disabled"
    :loading="loading"
    :busy="busy"
    :ariaLabel="ariaLabel"
    :badge="badge"
    :badgeIcon="badgeIcon"
    :badgeType="badgeType"
    :badgeTitle="badgeTitle"
    :active="active"
    :tabindex="tabindex"
    :customClass="holdClass"
    :style="holdStyle"
    :texts="{ badgeTypes: displayTexts.badgeTypes }"
    @click="buttonClick"
    @pointerdown="pointerDown"
    @pointerup="holdEnd"
    @pointerleave="holdEnd"
    @pointercancel="holdEnd"
    @keydown="keyDown"
    @keyup="keyUp"
    @blur="holdEnd"
    @contextmenu="contextMenu"
  />
  <LxDialog
    ref="dialogRef"
    :id="`${id}-dialog`"
    :kind="dialogKind"
    :label="dialogLabelDisplay"
    :description="displayTexts.dialogDescription"
    :actionDefinitions="actionDefinitions"
    :buttonSecondaryIsCancel="true"
    :texts="{ close: displayTexts.dialogClose }"
    @actionClick="dialogActionClick"
    @close="dialogClose"
  />
</template>
