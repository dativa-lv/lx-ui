<script setup>
import { computed } from 'vue';
import LxIcon from '@/components/Icon.vue';
import LxDropDownMenu from '@/components/DropDownMenu.vue';
import { getDisplayTexts } from '@/utils/generalUtils';
import LxButton from '@/components/Button.vue';
import LxActionButton from '@/components/ActionButton.vue';
import { generateUUID } from '@/utils/stringUtils';
import { flattenNestedActions, resolveActionGroups } from '@/utils/actionDefinitionsUtils';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  label: { type: String, default: null },
  description: { type: String, default: null },
  variant: {
    type: String,
    default: 'default',
    validator: (value) =>
      typeof value === 'string' &&
      ['info', 'default', 'warning', 'error', 'success'].includes(value),
  },
  kind: {
    type: String,
    default: 'default',
    validator: (value) =>
      typeof value === 'string' && ['default', 'clickable', 'button'].includes(value),
  },
  actionGroupDefinitions: { type: Array, default: null },
  actionDefinitions: { type: Array, default: () => [] },
  texts: { type: Object, default: () => ({}) },
});

const textsDefault = {
  overflowMenu: 'Atvērt papildu iespējas',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault, 'LxInfoBox'));

const iconName = computed(() => {
  switch (props.variant) {
    case 'error':
      return 'notification-error';
    case 'warning':
      return 'notification-warning';
    case 'success':
      return 'notification-success';
    case 'info':
    case 'default':
    default:
      return 'notification-info';
  }
});

const containerClasses = computed(() => {
  let baseClasses = '';
  switch (props.variant) {
    case 'error':
      baseClasses = 'lx-alert-error';
      break;
    case 'warning':
      baseClasses = 'lx-alert-warning';
      break;
    case 'info':
      baseClasses = 'lx-alert-info';
      break;
    case 'success':
      baseClasses = 'lx-alert-success';
      break;
    case 'default':
    default:
      baseClasses = 'lx-alert-info';
      break;
  }

  return props.kind === 'clickable' ? `${baseClasses} lx-alert-clickable` : baseClasses;
});

const emits = defineEmits(['actionClick']);

const actionDefinitionsResolved = computed(
  () =>
    flattenNestedActions(
      resolveActionGroups(props.actionDefinitions, props.actionGroupDefinitions)
    ) || []
);

function handleActionClick(actionName, selectedItemId = 'default') {
  emits('actionClick', actionName, selectedItemId);
}

function handleClick(event) {
  if (props.kind === 'clickable') {
    event.preventDefault();
    emits('actionClick', 'click', props.id);
  }
}
</script>

<template>
  <div
    :id="id"
    class="lx-info-box"
    :class="containerClasses"
    :role="kind === 'clickable' ? 'button' : undefined"
    :tabindex="kind === 'clickable' ? '0' : '-1'"
    data-component="lx-info-box"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space="handleClick"
  >
    <div class="lx-info-box-icon">
      <LxIcon :value="iconName" />
    </div>
    <div class="lx-info-box-content-wrapper">
      <div class="lx-primary">
        {{ label }}
      </div>
      <div class="lx-secondary" v-if="description">
        {{ description }}
      </div>
    </div>
    <div
      class="additional-buttons lx-info-box-action-icon"
      :class="{
        'lx-info-box-additional-buttons-hidden': kind === 'default' || kind === 'clickable',
      }"
      v-if="actionDefinitionsResolved?.length > 0 && props.kind === 'button'"
    >
      <LxActionButton
        v-if="actionDefinitionsResolved.length === 1"
        :action="actionDefinitionsResolved[0]"
        :id="actionDefinitionsResolved[0].id"
        kind="ghost"
        variant="icon-only"
        @click="handleActionClick(actionDefinitionsResolved[0].id, props.id)"
      />
      <LxDropDownMenu
        v-else
        :actionDefinitions="actionDefinitionsResolved"
        :actionGroupDefinitions="actionGroupDefinitions"
        @actionClick="(id) => handleActionClick(id, props.id)"
      >
        <div class="lx-toolbar">
          <LxButton
            :id="`${id}-overflow-button`"
            icon="overflow-menu"
            kind="ghost"
            :label="displayTexts.overflowMenu"
            variant="icon-only"
            tabindex="-1"
          />
        </div>
      </LxDropDownMenu>
    </div>
  </div>
</template>
