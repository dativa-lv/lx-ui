<script setup>
import { computed, ref, useAttrs } from 'vue';
import LxButton from '@/components/Button.vue';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  action: { type: Object, required: true },
  // Action fields this component ignored before the shared button; skipped to keep the output unchanged
  omit: { type: Array, default: () => [] },
});

const attrs = useAttrs();
const buttonRef = ref(null);

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
function getButtonProps() {
  const { customClass, 'custom-class': customClassKebab, ...rest } = attrs;
  const classes = [actionProps.value.customClass, customClass ?? customClassKebab].filter(Boolean);
  return { ...actionProps.value, ...rest, customClass: classes.join(' ') || undefined };
}

defineExpose({
  focus: (...args) => buttonRef.value?.focus(...args),
  scrollIntoView: (...args) => buttonRef.value?.scrollIntoView(...args),
  getElement: () => buttonRef.value?.getElement(),
});
</script>

<template>
  <LxButton ref="buttonRef" v-bind="getButtonProps()" />
</template>
