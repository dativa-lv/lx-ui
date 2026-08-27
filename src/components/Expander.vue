<script setup>
import { shallowRef, watch, computed, ref } from 'vue';
import { generateUUID } from '@/utils/stringUtils';
import { clampText, getDisplayTexts } from '@/utils/generalUtils';
import LxIcon from '@/components/Icon.vue';
import LxButton from '@/components/Button.vue';
import LxDropDownMenu from '@/components/DropDownMenu.vue';
import LxInfoWrapper from '@/components/InfoWrapper.vue';
import LxBadge from '@/components/Badge.vue';
import useLx from '@/hooks/useLx';
import { lxDevUtils } from '@/utils';

const props = defineProps({
  ariaLabel: { type: String, default: null },
  modelValue: { type: Boolean, default: false },
  id: { type: String, default: () => generateUUID() },
  label: { type: String, default: null },
  description: { type: String, default: null },
  region: { type: Boolean, default: false },
  icon: { type: String, default: null },
  iconSet: { type: String, default: () => useLx().getGlobals()?.iconSet },
  tooltip: { type: String, default: null },
  kind: { type: String, default: 'row' }, // 'row' or 'column'
  disabled: { type: Boolean, default: false },
  invalid: { type: Boolean, default: false },
  invalidationMessage: { type: String, default: null },
  variant: { type: String, default: 'default' }, // 'default' or 'highlighted'
  renderMode: { type: String, default: 'default' }, // 'default' or 'dynamic'
  hasShortlistReset: { type: Boolean, default: false },
  badge: { type: String, default: '' },
  badgeIcon: { type: String, default: null },
  badgeType: { type: String, default: 'default' }, // default, info, success, warning, error
  badgeTitle: {
    type: String,
    default: null,
    validator: (v, p) => {
      // If badge or badgeIcon is non-empty, badgeTitle must be non-empty
      if ((p.badge || p.badgeIcon) && !v) {
        lxDevUtils.logWarn(
          `LxExpander [${p.id}]: "badgeTitle" is required when "badgeIcon" is provided`,
          useLx().getGlobals()?.environment
        );
        return false;
      }
      return true;
    },
  },

  customClass: { type: String, default: '' },
  texts: { type: Object, default: () => ({}) },
  actionDefinitions: { type: Array, default: () => [] },
});

const textsDefault = {
  badgeTypes: {
    default: 'informatīvs paziņojums',
    info: 'informatīvs paziņojums',
    success: 'sekmīgs paziņojums',
    warning: 'brīdinājums',
    error: 'svarīgs paziņojums',
  },
  clear: 'Notīrīt',
  clearTitle: '',
  overflowMenu: 'Atvērt papildu iespējas',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault, 'LxExpander'));
const invalidationMessageClamped = computed(() => clampText(props.invalidationMessage));
const showInvalidationMessage = computed(() => props.invalid && props.invalidationMessage);
const actionDefinitionsResolved = computed(() => props.actionDefinitions || []);

const emits = defineEmits(['update:modelValue', 'resetFilters', 'actionClick']);

const isExpandedRaw = shallowRef(props.modelValue);

function toggleExpander() {
  if (!props.disabled) {
    if (isExpandedRaw.value !== null) {
      isExpandedRaw.value = !isExpandedRaw.value;
      emits('update:modelValue', isExpandedRaw.value);
    }
  }
}
watch(
  () => props.modelValue,
  (newValue) => {
    if (isExpandedRaw.value !== newValue) {
      isExpandedRaw.value = newValue;
    }
  }
);

const selectedIcon = computed(() => {
  if (props.invalid) {
    return 'invalid';
  }
  if (isExpandedRaw.value) {
    return 'chevron-up';
  }
  return 'chevron-down';
});

const ariaLabelWithBadge = computed(() => {
  if (props.ariaLabel) return props.ariaLabel;

  if (!props.label) return null;

  if (!props.badge && !props.badgeIcon) return props.label;

  const badgeTypeText =
    displayTexts.value.badgeTypes[props.badgeType] || displayTexts.value.badgeTypes.default;

  if (props.badge && props.badge.trim() !== '') {
    if (props.badgeType === 'default') {
      return `${props.label} (${props.badge})`;
    }
    return `${props.label} (${badgeTypeText}, ${props.badge})`;
  }
  return `${props.label} (${badgeTypeText})`;
});

function handleActionClick(id) {
  emits('actionClick', id);
}
const expanderHeader = ref();

function focus() {
  expanderHeader.value.focus();
}

defineExpose({ focus });
</script>

<template>
  <div
    :id="id"
    class="lx-expander"
    :class="[
      { 'lx-expanded': isExpandedRaw },
      { 'lx-expander-row': kind === 'row' },
      { 'lx-expander-column': kind === 'column' },
      { 'lx-expander-highlighted': variant === 'highlighted' },
      { 'lx-region': region },
      { 'lx-invalid': invalid },
      customClass,
    ]"
    :data-disabled="disabled ? '' : null"
    data-component="lx-expander"
  >
    <div class="lx-expander-head">
      <header
        ref="expanderHeader"
        :class="[{ 'lx-head': !$slots.customHeader }, { 'lx-custom-header': $slots.customHeader }]"
        :for="id"
        :title="tooltip"
        :tabindex="disabled ? null : 0"
        role="button"
        :aria-label="ariaLabelWithBadge"
        :aria-describedby="
          ((badge || badgeIcon) && badgeTitle) || description || invalid
            ? [
                (badge || badgeIcon) && badgeTitle ? `${id}-label` : null,
                description ? `${id}-desc` : null,
                showInvalidationMessage ? `${id}-invalidation-message` : null,
              ]
                .filter(Boolean)
                .join(' ')
            : null
        "
        :aria-expanded="isExpandedRaw"
        :aria-invalid="invalid"
        :aria-errormessage="showInvalidationMessage ? `${id}-invalidation-message` : null"
        aria-controls="lx-body"
        @click="toggleExpander"
        @keydown.space.prevent="toggleExpander"
        @keydown.enter.prevent="toggleExpander"
      >
        <template v-if="$slots.customHeader">
          <slot name="customHeader" v-bind="props"> </slot>
        </template>

        <template v-else>
          <div class="lx-group">
            <template v-if="icon">
              <div class="lx-icon-wrapper">
                <LxIcon customClass="lx-modifier-icon" :value="icon" :icon-set="iconSet" />
                <div class="lx-indicator"></div>
              </div>
            </template>
            <div class="lx-header-data">
              <div :id="`${id}-label`" v-if="label" class="heading-4">
                {{ label }}
              </div>
              <legend :id="`${id}-desc`" v-if="description" class="lx-description">
                {{ description }}
              </legend>
            </div>
            <div class="lx-expander-additional-info" v-if="$slots.additionalInfo">
              <LxInfoWrapper :disabled="disabled">
                <LxIcon value="info" :icon-set="iconSet" customClass="lx-info-icon" />
                <template #panel>
                  <slot name="additionalInfo"> </slot>
                </template>
              </LxInfoWrapper>
            </div>
          </div>

          <LxBadge
            :id="`${id}-badge`"
            :icon="badgeIcon"
            :icon-set="iconSet"
            :value="badge"
            :tooltip="badgeTitle"
            :class="[
              { 'lx-badge-info': badgeType === 'info' },
              { 'lx-badge-success': badgeType === 'success' },
              { 'lx-badge-warning': badgeType === 'warning' },
              { 'lx-badge-error': badgeType === 'error' },
            ]"
          />

          <div class="lx-chevron-icon">
            <LxIcon :value="selectedIcon" />
          </div>
          <LxButton
            v-if="hasShortlistReset && !isExpandedRaw"
            :id="`${id}-clear-button`"
            customClass="lx-expander-action"
            kind="ghost"
            variant="icon-only"
            :label="displayTexts.clear"
            :title="displayTexts.clearTitle"
            icon="filters-reset"
            :disabled="disabled"
            @click.stop="emits('resetFilters')"
            @keydown.space.stop
          />
        </template>
      </header>
      <div
        class="lx-expander-head-actions"
        v-if="actionDefinitionsResolved && actionDefinitionsResolved.length > 0"
      >
        <div class="additional-buttons">
          <LxButton
            v-if="actionDefinitionsResolved.length === 1"
            :id="actionDefinitionsResolved[0]?.id"
            :label="actionDefinitionsResolved[0]?.name || actionDefinitionsResolved[0]?.label"
            :title="actionDefinitionsResolved[0]?.title || actionDefinitionsResolved[0]?.tooltip"
            :icon="actionDefinitionsResolved[0]?.icon"
            :iconSet="actionDefinitionsResolved[0]?.iconSet"
            :loading="actionDefinitionsResolved[0]?.loading"
            :busy="actionDefinitionsResolved[0]?.busy"
            :disabled="actionDefinitionsResolved[0]?.disabled || disabled"
            :destructive="actionDefinitionsResolved[0]?.destructive"
            :active="actionDefinitionsResolved[0]?.active"
            :badge="actionDefinitionsResolved[0]?.badge"
            :badgeType="actionDefinitionsResolved[0]?.badgeType"
            :badgeIcon="actionDefinitionsResolved[0]?.badgeIcon"
            :badgeTitle="actionDefinitionsResolved[0]?.badgeTitle"
            :href="actionDefinitionsResolved[0]?.href"
            variant="icon-only"
            kind="ghost"
            @click.stop="handleActionClick(actionDefinitionsResolved[0]?.id)"
          />
          <LxDropDownMenu
            v-else
            :actionDefinitions="actionDefinitionsResolved"
            :disabled="disabled"
            @actionClick="handleActionClick"
          >
            <LxButton
              icon="overflow-menu"
              kind="ghost"
              :label="displayTexts.overflowMenu"
              variant="icon-only"
              tabindex="-1"
              :disabled="disabled"
            />
          </LxDropDownMenu>
        </div>
      </div>
    </div>
    <transition name="expander-transition">
      <article
        v-if="renderMode === 'dynamic' ? isExpandedRaw : true"
        v-show="renderMode === 'default' ? isExpandedRaw : true"
        class="lx-body"
      >
        <div
          v-if="showInvalidationMessage"
          class="lx-invalidation-message"
          :id="`${id}-invalidation-message`"
        >
          {{ invalidationMessageClamped }}
        </div>
        <slot></slot>
      </article>
    </transition>
  </div>
</template>
