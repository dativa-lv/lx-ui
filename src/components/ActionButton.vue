<script setup>
import { computed, inject, nextTick, ref, useAttrs } from 'vue';
import LxButton from '@/components/Button.vue';
import LxConfirmButton from '@/components/ConfirmButton.vue';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  action: { type: Object, required: true },
  // Action fields this component ignored before the shared button; skipped to keep the output unchanged
  omit: { type: Array, default: () => [] },
  // Dialogs and modals show their actions without `requiresConfirmation`
  confirmable: { type: Boolean, default: true },
});

const attrs = useAttrs();
const buttonRef = ref(null);

// Provided by components whose actions unmount on click (LxDropDownMenu), so the dialog lives outside them
const confirmationHost = inject('lxActionConfirmation', null);

const actionProps = computed(() => {
  const action = props.action || {};
  const res = {
    label: action.name || action.label,
    title: action.title || action.tooltip,
    icon: action.icon,
    iconSet: action.iconSet,
    kind: action.kind,
    variant: action.variant,
    loading: action.loading,
    busy: action.busy,
    destructive: action.destructive,
    disabled: action.disabled,
    active: action.active,
    badge: action.badge,
    badgeType: action.badgeType,
    badgeIcon: action.badgeIcon,
    badgeTitle: action.badgeTitle,
    href: action.href,
    customClass: action.customClass,
  };
  props.omit.forEach((key) => delete res[key]);
  return res;
});

// Classes from the action and from the parent component are both applied
const buttonProps = computed(() => {
  const { customClass, 'custom-class': customClassKebab, ...rest } = attrs;
  const classes = [actionProps.value.customClass, customClass ?? customClassKebab].filter(Boolean);
  return { ...actionProps.value, ...rest, customClass: classes.join(' ') || undefined };
});

const requiresConfirmation = computed(
  () => props.confirmable && !!props.action?.requiresConfirmation && !buttonProps.value.href
);

const confirmation = computed(() => ({
  label: buttonProps.value.label,
  destructive: buttonProps.value.destructive,
  dialogKind: props.action?.dialogKind,
  texts: props.action?.texts,
}));

function requestConfirmation(...args) {
  // Taken now, the button can be unmounted before the dialog is confirmed
  const handlers = [attrs.onClick].flat().filter(Boolean);
  confirmationHost.request(confirmation.value, () => handlers.forEach((h) => h(...args)));
}

// The opening click only shows the dialog, so it must not reach row or header click handlers
function stopPropagation(e) {
  e.stopPropagation();
}

let confirmElement = null;

function setConfirmButtonRef(el) {
  buttonRef.value = el;
  // The inner button ref is set after this one
  nextTick(() => {
    const element = buttonRef.value?.getElement() ?? null;
    if (element === confirmElement) return;
    confirmElement?.removeEventListener('click', stopPropagation);
    element?.addEventListener('click', stopPropagation);
    confirmElement = element;
  });
}

defineExpose({
  focus: (...args) => buttonRef.value?.focus(...args),
  scrollIntoView: (...args) => buttonRef.value?.scrollIntoView(...args),
  getElement: () => buttonRef.value?.getElement(),
});
</script>

<template>
  <LxButton
    v-if="requiresConfirmation && confirmationHost"
    ref="buttonRef"
    v-bind="{ ...buttonProps, onClick: requestConfirmation }"
  />
  <LxConfirmButton
    v-else-if="requiresConfirmation"
    :ref="setConfirmButtonRef"
    v-bind="{ ...buttonProps, dialogKind: confirmation.dialogKind, texts: confirmation.texts }"
  />
  <LxButton v-else ref="buttonRef" v-bind="buttonProps" />
</template>
