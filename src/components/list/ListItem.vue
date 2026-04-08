<script setup>
import { ref, computed, watch } from 'vue';

import { generateUUID } from '@/utils/stringUtils';
import { getDisplayTexts } from '@/utils/generalUtils';
import { loadLibrary } from '@/utils/libLoader';

import LxIcon from '@/components/Icon.vue';
import LxDropDownMenu from '@/components/DropDownMenu.vue';
import LxButton from '@/components/Button.vue';
import LxSearchableText from '@/components/SearchableText.vue';
import useLx from '@/hooks/useLx';
import LxLoader from '@/components/Loader.vue';

const emits = defineEmits(['click', 'actionClick']);

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  parentId: { type: String, default: null },
  label: { type: String, required: true },
  description: { type: String, default: null },
  value: { type: Object, default: null },
  icon: { type: String, default: 'next' },
  iconSet: {
    type: String,
    default: () => useLx().getGlobals()?.iconSet,
  },
  href: { type: [String, Object], default: null },
  kind: { type: String, default: 'default' },
  category: { type: String, default: null },
  clickable: { type: [Boolean, String], default: false },
  selected: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  invalid: { type: Boolean, default: false },
  searchString: { type: String, default: '' },
  tooltip: { type: String, default: '' },
  actionDefinitions: { type: Array, default: () => [] },
  actionsLayout: { type: String, default: 'default' }, // default, vertical
  texts: { type: Object, default: () => ({}) },
});

const textsDefault = {
  overflowMenu: 'Atvērt papildu iespējas',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));

const itemRef = ref(null);
const safeTo = ref(null);

function performClick() {
  if (props.clickable && !props.disabled) {
    emits('click');
  }
}

function handleActionClick(actionId) {
  emits('actionClick', actionId, props.id);
}

function getItemId(id, parentId) {
  return `${parentId}-item-${id}`;
}

const visibleActionDefinitions = computed(() => {
  const actions = (props.actionDefinitions || [])
    .filter((action) => (action.visibleByAttribute ? props.value[action.visibleByAttribute] : true))
    .map((action) => ({
      ...action,
      disabled:
        action.disabled ||
        (action.enableByAttribute ? !props.value[action.enableByAttribute] : false),
    }));

  if (actions.length > 1) {
    actions.unshift({
      id: `${props.id}-action-open-menu`,
      label: displayTexts.value.overflowMenu,
      icon: 'overflow-menu',
      kind: 'main',
      variant: 'icon-only',
    });
  }

  return actions;
});

const tabIndex = computed(() => {
  if (props.disabled || props.busy || props.loading) {
    return -1;
  }
  if (props.href || props.clickable) {
    return 0;
  }
  return -1;
});

async function computeSafeTo() {
  if (typeof props.href !== 'string') {
    safeTo.value = props.href ?? null;
    return;
  }

  const lib = await loadLibrary('sanitizeUrl');
  const cleaned = lib.sanitizeUrl(props.href);

  safeTo.value = cleaned ?? null;
}

function focus() {
  itemRef.value?.focus();
}

watch(() => props.href, computeSafeTo, { immediate: true });

defineExpose({ focus });
</script>
<template>
  <div class="lx-list-item-wrapper" :id="id">
    <div
      v-if="!safeTo"
      ref="itemRef"
      :tabindex="tabIndex"
      class="lx-list-item"
      :id="getItemId(id, parentId)"
      @click="performClick"
      :role="clickable ? 'button' : null"
      :aria-labelledby="label && clickable ? `${id}-label` : null"
      :aria-describedby="description && clickable ? `${id}-desc` : null"
      :aria-invalid="invalid"
      v-on:keyup.enter="performClick"
      v-on:keyup.space="performClick"
      v-on:keydown.space.prevent
      :title="clickable ? tooltip : ''"
      :class="[
        { 'lx-list-item-interactive': href || clickable },
        { 'lx-list-item-has-description': description },
        { 'lx-list-item-disabled': disabled || busy || loading },
        { 'lx-selected': selected },
        { 'lx-inactive': kind === 'inactive' },
        { 'lx-list-item-tile': kind === 'tile' },
        { 'lx-list-item-active': active },
        { 'lx-category-red': category === 'red' },
        { 'lx-category-blue': category === 'blue' },
        { 'lx-category-teal': category === 'teal' },
        { 'lx-category-green': category === 'green' },
        { 'lx-category-purple': category === 'purple' },
        { 'lx-category-orange': category === 'orange' },
        { 'lx-category-yellow': category === 'yellow' },
        { 'lx-category-bad': category === 'bad' },
        { 'lx-category-new': category === 'new' },
        { 'lx-category-good': category === 'good' },
        { 'lx-category-draft': category === 'draft' },
        { 'lx-category-error': category === 'error' },
        { 'lx-category-edited': category === 'edited' },
        { 'lx-category-signed': category === 'signed' },
        { 'lx-category-ongoing': category === 'ongoing' },
        { 'lx-category-waiting': category === 'waiting' },
        { 'lx-category-deleted': category === 'deleted' },
        { 'lx-category-disabled': category === 'disabled' },
        { 'lx-category-inactive': category === 'inactive' },
        { 'lx-category-finished': category === 'finished' },
        { 'lx-category-incomplete': category === 'incomplete' },
        { 'lx-invalid': invalid },
        {
          'lx-list-item-compact-actions':
            visibleActionDefinitions?.length > 0 && actionsLayout === 'vertical',
        },
      ]"
    >
      <div class="lx-category-displayer" />
      <header>
        <template v-if="!$slots.customItem">
          <p :id="`${id}-label`" class="lx-primary">
            <LxSearchableText :value="label" :search-string="searchString" />
          </p>
          <p :id="`${id}-desc`" class="lx-secondary" v-if="description">
            <LxSearchableText :value="description" :search-string="searchString" />
          </p>
        </template>
        <slot name="customItem" v-bind="value" v-if="value && $slots.customItem"></slot>
      </header>
      <div class="lx-invalidation-icon-wrapper" v-if="invalid">
        <LxIcon value="invalid" customClass="lx-invalidation-icon" />
      </div>
      <div class="compact-actions">
        <div class="lx-list-icon-wrapper" v-if="clickable">
          <LxIcon :value="icon" :iconSet="iconSet" customClass="lx-list-icon" :title="tooltip" />
        </div>
        <div
          class="lx-list-item-actions"
          v-if="
            visibleActionDefinitions?.length &&
            visibleActionDefinitions?.length === 1 &&
            actionsLayout === 'vertical'
          "
        >
          <LxButton
            :id="`${id}-action-${visibleActionDefinitions[0].id}`"
            :label="visibleActionDefinitions[0].name || visibleActionDefinitions[0].label"
            :title="visibleActionDefinitions[0].title || visibleActionDefinitions[0].tooltip"
            :icon="visibleActionDefinitions[0].icon"
            :iconSet="visibleActionDefinitions[0].iconSet"
            :loading="visibleActionDefinitions[0].loading"
            :busy="visibleActionDefinitions[0].busy"
            :destructive="visibleActionDefinitions[0].destructive"
            :disabled="
              loading ||
              busy ||
              disabled ||
              (visibleActionDefinitions[0].disabled != null
                ? visibleActionDefinitions[0].disabled
                : visibleActionDefinitions[0].enableByAttribute
                ? !value[visibleActionDefinitions[0].enableByAttribute]
                : false)
            "
            :active="visibleActionDefinitions[0].active"
            :badge="visibleActionDefinitions[0].badge"
            :badgeType="visibleActionDefinitions[0].badgeType"
            :badgeIcon="visibleActionDefinitions[0].badgeIcon"
            :badgeTitle="visibleActionDefinitions[0].badgeTitle"
            :href="visibleActionDefinitions[0].href"
            kind="ghost"
            variant="icon-only"
            @click.prevent.stop="handleActionClick(visibleActionDefinitions[0].id)"
          />
        </div>
        <div
          v-else-if="actionDefinitions?.length && actionsLayout === 'vertical'"
          class="lx-list-item-actions"
          :class="{ 'lx-list-actions-hidden': !visibleActionDefinitions?.length }"
        >
          <LxDropDownMenu
            v-if="visibleActionDefinitions.length > 1"
            :disabled="loading || busy || disabled"
            :actionDefinitions="visibleActionDefinitions"
            @actionClick="(id) => handleActionClick(id)"
          />
        </div>
      </div>
    </div>

    <router-link
      v-if="safeTo"
      class="lx-list-item"
      :role="clickable ? 'button' : null"
      :aria-labelledby="label && clickable ? `${id}-label` : null"
      :aria-describedby="description && clickable ? `${id}-desc` : null"
      :aria-invalid="invalid"
      :to="safeTo"
      v-on:keydown.space.prevent
      :title="tooltip"
      :class="[
        { 'lx-list-item-interactive': href || clickable },
        { 'lx-list-item-has-description': description },
        { 'lx-list-item-disabled': disabled },
        { 'lx-selected': selected },
        { 'lx-inactive': kind === 'inactive' },
        { 'lx-list-item-tile': kind === 'tile' },
        { 'lx-list-item-active': active },
        { 'lx-category-red': category === 'red' },
        { 'lx-category-blue': category === 'blue' },
        { 'lx-category-teal': category === 'teal' },
        { 'lx-category-green': category === 'green' },
        { 'lx-category-purple': category === 'purple' },
        { 'lx-category-orange': category === 'orange' },
        { 'lx-category-yellow': category === 'yellow' },
        { 'lx-category-bad': category === 'bad' },
        { 'lx-category-new': category === 'new' },
        { 'lx-category-good': category === 'good' },
        { 'lx-category-draft': category === 'draft' },
        { 'lx-category-error': category === 'error' },
        { 'lx-category-edited': category === 'edited' },
        { 'lx-category-signed': category === 'signed' },
        { 'lx-category-ongoing': category === 'ongoing' },
        { 'lx-category-waiting': category === 'waiting' },
        { 'lx-category-deleted': category === 'deleted' },
        { 'lx-category-disabled': category === 'disabled' },
        { 'lx-category-inactive': category === 'inactive' },
        { 'lx-category-finished': category === 'finished' },
        { 'lx-category-incomplete': category === 'incomplete' },
        { 'lx-invalid': invalid },
        {
          'lx-list-item-compact-actions':
            visibleActionDefinitions?.length > 0 && actionsLayout === 'vertical',
        },
      ]"
      :tabindex="disabled ? -1 : href || clickable ? 0 : -1"
    >
      <div class="lx-category-displayer" />
      <header>
        <template v-if="!$slots.customItem">
          <p :id="`${id}-label`" class="lx-primary">
            <LxSearchableText :value="label" :search-string="searchString" />
          </p>
          <p :id="`${id}-desc`" class="lx-secondary" v-if="description">
            <LxSearchableText :value="description" :search-string="searchString" />
          </p>
        </template>
        <slot name="customItem" v-bind="value" v-if="value && $slots.customItem"></slot>
      </header>
      <div class="lx-invalidation-icon-wrapper" v-if="invalid">
        <LxIcon value="invalid" customClass="lx-invalidation-icon" />
      </div>
      <div class="compact-actions">
        <div class="lx-list-icon-wrapper" v-if="href">
          <LxIcon :value="icon" :icon-set="iconSet" customClass="lx-list-icon" :title="tooltip" />
        </div>
        <div
          class="lx-list-item-actions"
          v-if="
            visibleActionDefinitions?.length &&
            visibleActionDefinitions?.length === 1 &&
            actionsLayout === 'vertical'
          "
        >
          <LxButton
            :id="`${id}-action-${visibleActionDefinitions[0].id}`"
            :label="visibleActionDefinitions[0].name || visibleActionDefinitions[0].label"
            :title="visibleActionDefinitions[0].title || visibleActionDefinitions[0].tooltip"
            :icon="visibleActionDefinitions[0].icon"
            :iconSet="visibleActionDefinitions[0].iconSet"
            :loading="visibleActionDefinitions[0].loading"
            :busy="visibleActionDefinitions[0].busy"
            :destructive="visibleActionDefinitions[0].destructive"
            :disabled="
              loading ||
              busy ||
              disabled ||
              (visibleActionDefinitions[0].disabled != null
                ? visibleActionDefinitions[0].disabled
                : visibleActionDefinitions[0].enableByAttribute
                ? !value[visibleActionDefinitions[0].enableByAttribute]
                : false)
            "
            :active="visibleActionDefinitions[0].active"
            :badge="visibleActionDefinitions[0].badge"
            :badgeType="visibleActionDefinitions[0].badgeType"
            :badgeIcon="visibleActionDefinitions[0].badgeIcon"
            :badgeTitle="visibleActionDefinitions[0].badgeTitle"
            :href="visibleActionDefinitions[0].href"
            kind="ghost"
            variant="icon-only"
            @click.prevent.stop="handleActionClick(visibleActionDefinitions[0].id)"
          />
        </div>
        <div
          v-else-if="actionDefinitions?.length && actionsLayout === 'vertical'"
          class="lx-list-item-actions"
          :class="{ 'lx-list-actions-hidden': !visibleActionDefinitions?.length }"
        >
          <LxDropDownMenu
            v-if="visibleActionDefinitions.length > 1"
            :disabled="loading || busy || disabled"
            :actionDefinitions="visibleActionDefinitions"
            @actionClick="(id) => handleActionClick(id)"
          />
        </div>
      </div>
    </router-link>

    <div class="lx-list-item-loader" v-if="busy || loading">
      <LxLoader :loading="true" size="s" @click.stop />
    </div>

    <div
      class="lx-list-item-actions"
      v-if="
        visibleActionDefinitions?.length &&
        visibleActionDefinitions?.length === 1 &&
        actionsLayout !== 'vertical'
      "
    >
      <LxButton
        :id="`${id}-action-${visibleActionDefinitions[0].id}`"
        :label="visibleActionDefinitions[0].name || visibleActionDefinitions[0].label"
        :title="visibleActionDefinitions[0].title || visibleActionDefinitions[0].tooltip"
        :loading="visibleActionDefinitions[0].loading"
        :busy="visibleActionDefinitions[0].busy"
        :destructive="visibleActionDefinitions[0].destructive"
        :disabled="
          loading ||
          busy ||
          disabled ||
          (visibleActionDefinitions[0].disabled != null
            ? visibleActionDefinitions[0].disabled
            : visibleActionDefinitions[0].enableByAttribute
            ? !value[visibleActionDefinitions[0].enableByAttribute]
            : false)
        "
        :icon="visibleActionDefinitions[0].icon"
        :iconSet="visibleActionDefinitions[0].iconSet"
        :active="visibleActionDefinitions[0].active"
        :badge="visibleActionDefinitions[0].badge"
        :badgeType="visibleActionDefinitions[0].badgeType"
        :badgeIcon="visibleActionDefinitions[0].badgeIcon"
        :badgeTitle="visibleActionDefinitions[0].badgeTitle"
        :href="visibleActionDefinitions[0].href"
        kind="ghost"
        variant="icon-only"
        @click.prevent.stop="handleActionClick(visibleActionDefinitions[0].id)"
      />
    </div>

    <div
      v-else-if="actionDefinitions?.length && actionsLayout !== 'vertical'"
      class="lx-list-item-actions"
      :class="{ 'lx-list-actions-hidden': !visibleActionDefinitions?.length }"
    >
      <LxDropDownMenu
        v-if="visibleActionDefinitions.length > 1"
        :disabled="loading || busy || disabled"
        :actionDefinitions="visibleActionDefinitions"
        @actionClick="(id) => handleActionClick(id)"
      />
    </div>
  </div>
</template>
