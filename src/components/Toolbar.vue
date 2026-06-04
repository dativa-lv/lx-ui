<script setup>
import {
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  onUpdated,
  inject,
  useSlots,
  Comment,
  Fragment,
  Text,
} from 'vue';
import { useDebounceFn, useElementSize, useElementBounding, useScroll } from '@vueuse/core';
import LxToolbarGroup from '@/components/ToolbarGroup.vue';
import LxButton from '@/components/Button.vue';
import LxDropDownMenu from '@/components/DropDownMenu.vue';
import LxTextInput from '@/components/TextInput.vue';
import LxToggle from '@/components/Toggle.vue';
import { generateUUID, foldToAscii } from '@/utils/stringUtils';
import { getDisplayTexts } from '@/utils/generalUtils';
import useLx from '@/hooks/useLx';
import { logWarn } from '@/utils/devUtils';
import { useToolbarResponsiveness } from '@/hooks/useToolbarResponsiveness';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  actionDefinitions: { type: Array, default: () => [] },
  noBorders: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  hasSearch: { type: Boolean, default: false },
  searchString: { type: String, default: '' },
  searchSide: { type: String, default: 'client' }, // client, server
  searchMode: { type: String, default: 'default' }, // default, compact, defaultForce
  useSearchDebounce: { type: Boolean, default: false },
  hasSelectAll: { type: Boolean, default: false },
  sticky: { type: Boolean, default: false },
  selectionState: { type: String, default: 'checkbox' }, // checkbox, checkbox-filled, checkbox-indeterminate, radiobutton-filled
  selectAllSide: { type: String, default: 'right' }, // right, left
  selectAllVariant: { type: String, default: 'icon-only' }, // icon-only, default
  defaultArea: { type: String, default: 'auto' }, // auto, right, left
  wrapperRef: { type: Object, default: null },
  texts: {
    type: Object,
    default: () => ({}),
  },
});

const emits = defineEmits([
  'actionClick',
  'search',
  'selectAll',
  'deselectAll',
  'update:searchString',
]);

const GROUP_ID_DEFAULT_RIGHT = 'lx_group_default_right';
const GROUP_ID_DEFAULT_LEFT = 'lx_group_default_left';
const GROUP_ID_EXTRA = 'lx_group_extra';
const ACTION_KINDS_SPECIAL = new Set(['toggle', 'slot']);

const textsDefault = {
  overflowMenu: 'Atvērt papildu iespējas',
  openSearch: 'Atvērt meklētāju',
  closeSearch: 'Aizvērt meklētāju',
  placeholder: 'Ievadiet nosaukuma vai apraksta daļu, lai sameklētu ierakstus',
  search: 'Meklēt',
  clear: 'Notīrīt',
  selectAllRows: 'Izvēlēties visu',
  clearSelected: 'Attīrīt izvēles',
};
const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));

const globalEnvironment = useLx().getGlobals()?.environment;
const slots = useSlots();

const hasSlotContent = (nodes = []) => {
  if (!Array.isArray(nodes)) {
    return false;
  }

  return nodes.some((node) => {
    if (!node || node.type === Comment) {
      return false;
    }
    if (node.type === Text) {
      return String(node.children ?? '').trim().length > 0;
    }
    if (node.type === Fragment) {
      return hasSlotContent(node.children);
    }
    return true;
  });
};

const hasDefaultSlotContent = ref(false);
const hasLeftAreaSlotContent = ref(false);
const hasRightAreaSlotContent = ref(false);
const hasSecondRowSlotContent = ref(false);

const isSearchExpanded = ref(false);
const searchInputCompact = ref();

function updateSlotContentFlags() {
  hasDefaultSlotContent.value = hasSlotContent(slots.default?.() ?? []);
  hasLeftAreaSlotContent.value = hasSlotContent(slots.leftArea?.() ?? []);
  hasRightAreaSlotContent.value = hasSlotContent(slots.rightArea?.() ?? []);
  hasSecondRowSlotContent.value = hasSlotContent(slots.secondRow?.() ?? []);
}

const isToolbarEmpty = computed(
  () =>
    !props.actionDefinitions.length &&
    !props.hasSearch &&
    !props.hasSelectAll &&
    !hasDefaultSlotContent.value &&
    !hasLeftAreaSlotContent.value &&
    !hasRightAreaSlotContent.value &&
    !hasSecondRowSlotContent.value
);

const insideForm = inject('insideForm', ref(false));

const defaultAreaComputed = computed(() => {
  if (props.defaultArea === 'right' || props.defaultArea === 'left') {
    return props.defaultArea;
  }

  return insideForm.value ? 'left' : 'right';
});

function getArea(action) {
  const parentAction = props.actionDefinitions.find(
    (a) => action.groupId && a.nestedGroupId && a.nestedGroupId === action.groupId
  );

  return parentAction
    ? parentAction.area ?? defaultAreaComputed.value
    : action.area ?? defaultAreaComputed.value;
}

function applyDefaults(action, overrides = {}) {
  const area = getArea(action);
  const defaultGroupId = area === 'right' ? GROUP_ID_DEFAULT_RIGHT : GROUP_ID_DEFAULT_LEFT;

  if (action.kind === 'toggle' && action.value === undefined) {
    /* eslint-disable no-param-reassign */
    action.value = false;
  }

  if (action.extra) {
    return {
      ...action,
      icon: action.icon,
      area,
      kind: action.kind === 'toggle' ? 'toggle' : 'ghost',
      variant: 'icon-only',
      groupId: action.groupId || GROUP_ID_EXTRA,
      disabled: action.disabled || props.disabled || props.loading || props.busy,
      ...overrides,
    };
  }

  if (action.kind === 'slot') {
    return {
      ...action,
      area,
      groupId: action.groupId || defaultGroupId,
      nonResponsive: true,
      ...overrides,
    };
  }

  return {
    ...action,
    icon: action.icon,
    area,
    kind: action.kind || 'ghost',
    variant: action.variant || 'icon-only',
    groupId: action.groupId || defaultGroupId,
    disabled: action.disabled || props.disabled || props.loading || props.busy,
    ...overrides,
  };
}

function applyKindAndVariant(action, overrides = {}) {
  if (ACTION_KINDS_SPECIAL.has(action.kind)) {
    return {
      ...action,
      ...overrides,
    };
  }

  return {
    ...action,
    kind: 'ghost',
    variant: 'icon-only',
    ...overrides,
  };
}

function processGroup(group) {
  if (!group.length) {
    return { promotedAction: null, demotedActions: [] };
  }

  const firstAction =
    group.find((a) => a.kind === 'primary') ??
    group.find((a) => a.kind === 'secondary') ??
    group.find((a) => a.kind === 'tertiary');

  if (!firstAction) {
    return {
      promotedAction: null,
      demotedActions: group.map((action) => applyKindAndVariant(action)),
    };
  }

  const rest = group.filter((a) => a.id !== firstAction.id);

  const promotedAction = applyDefaults(firstAction, {
    kind: firstAction.kind,
    variant: 'default',
    promoted: true,
  });

  if (!promotedAction?.name) {
    logWarn('LxToolbar: promoted action must have name.', globalEnvironment);
  }

  return {
    promotedAction,
    demotedActions: rest.map((action) => applyKindAndVariant(action)),
  };
}

const actionsProcessed = computed(() => {
  if (!props.actionDefinitions.length) {
    return [];
  }

  const normalizedActions = props.actionDefinitions.map((a) => applyDefaults(a));
  const regularActions = normalizedActions.filter((a) => !a.extra);
  const extraActions = normalizedActions.filter((a) => a.extra);
  const sortedExtraActions = defaultAreaComputed.value ? extraActions : [...extraActions].reverse();
  const { promotedAction, demotedActions } = processGroup(regularActions);
  const result = [...demotedActions, ...sortedExtraActions];

  if (promotedAction) {
    result.push(promotedAction);
  }

  return result;
});

const isActionButton = (action) =>
  !action?.nestedGroupId && !ACTION_KINDS_SPECIAL.has(action?.kind);
const isActionDropDown = (action) =>
  !!action?.nestedGroupId && !ACTION_KINDS_SPECIAL.has(action?.kind);
const isActionToggle = (action) => !action?.nestedGroupId && action?.kind === 'toggle';
const isActionSlot = (action) => !action?.nestedGroupId && action?.kind === 'slot';

const sortActionsByExtra = (actions, extraFirst) => {
  const extraWeight = extraFirst ? -1 : 1;
  return actions?.sort((a, b) => (a?.extra ? extraWeight : 0) - (b?.extra ? extraWeight : 0));
};

const createAreaActions = (area, extraFirst) =>
  computed(() =>
    sortActionsByExtra(
      actionsProcessed.value?.filter((x) => x?.area === area && !x?.promoted),
      extraFirst
    )
  );

const leftActionsAll = createAreaActions('left', false);
const rightActionsAll = createAreaActions('right', true);

const actionsByGroupId = computed(() => {
  const groupMap = new Map();

  [...leftActionsAll.value, ...rightActionsAll.value].forEach((action) => {
    if (!groupMap.has(action.groupId)) {
      groupMap.set(action.groupId, []);
    }

    groupMap.get(action.groupId).push(action);
  });

  return groupMap;
});

function getActionId(actionId) {
  return `${props.id}-action-${actionId}`;
}

function handleActionClick(id, { value = undefined } = {}) {
  emits('actionClick', id, value);
}

const toolbarRef = ref(null);
const leftAreaRef = ref(null);
const defaultAreaRef = ref(null);
const rightAreaRef = ref(null);
const leftAreaSlotRef = ref(null);
const defaultAreaSlotRef = ref(null);
const rightAreaSlotRef = ref(null);

const {
  rightActionsVisibleGrouped,
  leftActionsVisibleGrouped,
  actionsOverflow,
  promotedAction,
  autoSearchMode,
} = useToolbarResponsiveness({
  toolbarRef,
  leftAreaRef,
  defaultAreaRef,
  rightAreaRef,
  leftAreaSlotRef,
  defaultAreaSlotRef,
  rightAreaSlotRef,
  defaultAreaComputed,
  actionsProcessed,
  leftActionsAll,
  rightActionsAll,
  actionsByGroupId,
  hasDefaultSlotContent,
  hasLeftAreaSlotContent,
  hasRightAreaSlotContent,
  hasSearch: computed(() => props.hasSearch),
  searchMode: computed(() => props.searchMode),
  hasSelectAll: computed(() => props.hasSelectAll),
  isSearchExpanded,
  getActionId,
  isActionDropDown,
});

const isLeftAreaEmpty = computed(
  () =>
    !(
      (props.hasSelectAll && props.selectAllSide === 'left') ||
      (props.hasSearch && autoSearchMode.value === 'default') ||
      promotedAction.value?.area === 'left' ||
      hasLeftAreaSlotContent.value ||
      leftActionsVisibleGrouped.value.length > 0 ||
      (defaultAreaComputed.value === 'right' && actionsOverflow.value.length > 0)
    )
);

const isRightAreaEmpty = computed(
  () =>
    !(
      (props.hasSelectAll && props.selectAllSide === 'right') ||
      (props.hasSearch && autoSearchMode.value === 'compact') ||
      promotedAction.value?.area === 'right' ||
      hasRightAreaSlotContent.value ||
      rightActionsVisibleGrouped.value.length > 0 ||
      (defaultAreaComputed.value === 'left' && actionsOverflow.value.length > 0)
    )
);

const searchStringRaw = ref(props.searchString);

const updateSearchString = useDebounceFn(() => {
  emits('search', foldToAscii(searchStringRaw.value));
}, 200);

const isSearchActive = ref(false);

function clientSideSearch() {
  isSearchActive.value = !!searchStringRaw.value;

  if (props.useSearchDebounce) {
    updateSearchString();
  } else {
    emits('search', foldToAscii(searchStringRaw.value));
  }
}

function serverSideSearch() {
  isSearchActive.value = !!searchStringRaw.value;

  emits('search', foldToAscii(searchStringRaw.value));
}

const searchInputRefresh = ref(0);

function clear() {
  searchStringRaw.value = '';
  isSearchActive.value = false;
  searchInputRefresh.value += 1;

  if (props.searchSide === 'client') {
    clientSideSearch();
  } else if (props.searchSide === 'server') {
    serverSideSearch();
  }
}

const isSelectAllDisabled = computed(
  () => props.disabled || props.loading || props.busy || isSearchActive.value
);

watch(searchStringRaw, (value) => {
  if (props.hasSearch && props.searchSide === 'client') {
    clientSideSearch();
  }
  if (value !== props.searchString) {
    emits('update:searchString', value);
  }
});

watch(
  () => props.searchString,
  (value) => {
    if (value !== searchStringRaw.value) {
      searchStringRaw.value = value;
    }
  }
);

watch(
  () => props.searchSide,
  () => {
    searchInputRefresh.value += 1;
  }
);

function toggleSearch() {
  if (!props.hasSearch || autoSearchMode.value !== 'compact') {
    return;
  }

  searchStringRaw.value = '';
  isSearchExpanded.value = !isSearchExpanded.value;

  nextTick(() => {
    if (isSearchExpanded.value) {
      searchInputCompact.value?.focus();
    }
  });
}

function selectAll() {
  if (props.selectionState === 'checkbox') {
    emits('selectAll');
  } else {
    emits('deselectAll');
  }
}

function focusAction(actionId) {
  const action = actionsProcessed.value.find((a) => a.id === actionId);
  if (!action) {
    return;
  }

  const direct = document.getElementById(`${props.id}-action-${actionId}`);
  if (direct) {
    direct.focus();
    return;
  }

  const parentAction = actionsProcessed.value.find(
    (a) => a.nestedGroupId && a.nestedGroupId === action.groupId
  );
  if (parentAction) {
    const parentDirect = document.getElementById(`${props.id}-action-${parentAction.id}`);
    if (parentDirect) {
      parentDirect.focus();
      return;
    }
  }

  const overflowId =
    defaultAreaComputed.value === 'right'
      ? `${props.id}-overflow-left`
      : `${props.id}-overflow-right`;
  document.getElementById(overflowId)?.focus();
}

onMounted(() => {
  updateSlotContentFlags();

  if (props.hasSearch && props.searchString) {
    if (props.searchSide === 'client') {
      clientSideSearch();
    } else if (props.searchSide === 'server') {
      serverSideSearch();
    }
  }
});

const toolbarSize = useElementSize(toolbarRef);
const resolvedWrapperRef = computed(() => props.wrapperRef?.value ?? props.wrapperRef);
const { top: wrapperTop, update: updateWrapperBounding } = useElementBounding(resolvedWrapperRef);
const { y: wrapperScrollTop } = useScroll(resolvedWrapperRef, {
  behavior: 'auto',
  throttle: 16,
});
const baselineWrapperTop = ref(null);

watch(
  resolvedWrapperRef,
  (el) => {
    if (!el) {
      baselineWrapperTop.value = null;
      return;
    }

    baselineWrapperTop.value = wrapperTop.value;
    updateWrapperBounding();
  },
  { immediate: true }
);

watch(wrapperTop, (newTop) => {
  if (baselineWrapperTop.value === null) {
    baselineWrapperTop.value = newTop;
  }
});

const topOutOfBounds = computed(() => {
  const keyOpacity = '--toolbar-top-shadow-opacity';
  const keySize = '--toolbar-header-size';

  const limit = 100;
  const toolbarHeight = toolbarSize.height.value || 0;
  const wrapper = props.wrapperRef;

  if (!wrapper || !toolbarRef.value) {
    return `${keyOpacity}: 0; ${keySize}: ${toolbarHeight}px;`;
  }

  const byWrapperScroll = Math.max(0, wrapperScrollTop.value || 0);
  const baselineTop = baselineWrapperTop.value ?? wrapperTop.value;
  const byBoundingDelta = Math.max(0, baselineTop - wrapperTop.value);
  const progress = Math.max(byWrapperScroll, byBoundingDelta);

  let opacity = Math.min(1, progress / limit);

  if (!props.sticky) {
    opacity = 0;
  }

  return `${keyOpacity}: ${opacity}; ${keySize}: ${toolbarHeight}px;`;
});

onUpdated(() => {
  updateSlotContentFlags();
});

defineExpose({ toggleSearch, focusAction });
</script>

<template>
  <div
    ref="toolbarRef"
    class="lx-component-toolbar"
    :class="[
      { 'lx-toolbar-no-borders': noBorders },
      { 'lx-toolbar-default-area-right': defaultAreaComputed === 'right' },
      { 'lx-toolbar-default-area-left': defaultAreaComputed === 'left' },
      { 'lx-toolbar-empty': isToolbarEmpty },
      { 'lx-disabled': disabled || loading },
      { 'lx-toolbar-sticky': sticky },
    ]"
    :style="`${topOutOfBounds}`"
    role="toolbar"
  >
    <div class="first-row">
      <div
        ref="leftAreaRef"
        class="left-area"
        :class="{ 'lx-toolbar-area-empty': isLeftAreaEmpty }"
      >
        <LxToolbarGroup v-if="hasSelectAll && selectAllSide === 'left'">
          <LxButton
            :id="`${id}-select-all`"
            :icon="selectionState"
            kind="ghost"
            :variant="selectAllVariant"
            :label="
              selectionState === 'checkbox'
                ? displayTexts.selectAllRows
                : displayTexts.clearSelected
            "
            :disabled="isSelectAllDisabled"
            :loading="loading"
            @click="selectAll"
          />
        </LxToolbarGroup>

        <LxToolbarGroup v-if="promotedAction?.area === 'left'" class="lx-toolbar-promoted-action">
          <LxButton
            :id="getActionId(promotedAction.id)"
            :label="promotedAction.name || promotedAction.label"
            :title="promotedAction.title || promotedAction.tooltip"
            :icon="promotedAction.icon"
            :iconSet="promotedAction.iconSet"
            :variant="promotedAction.variant"
            :kind="promotedAction.kind"
            :loading="promotedAction.loading"
            :busy="promotedAction.busy"
            :destructive="promotedAction.destructive"
            :disabled="promotedAction.disabled || props.disabled || props.loading"
            :active="promotedAction.active"
            :badge="promotedAction.badge"
            :badgeType="promotedAction.badgeType"
            :badgeIcon="promotedAction.badgeIcon"
            :badgeTitle="promotedAction.badgeTitle"
            :customClass="promotedAction.customClass"
            :href="promotedAction.href"
            @click="handleActionClick(promotedAction.id)"
          />
        </LxToolbarGroup>

        <!-- Both v-if and v-show are necessary -->
        <LxToolbarGroup
          v-if="defaultAreaComputed === 'right'"
          v-show="actionsOverflow.length > 0"
          :class="actionsOverflow.length === 0 ? 'lx-toolbar-overflow-hidden' : null"
        >
          <LxDropDownMenu
            :disabled="props.disabled || props.loading"
            :actionDefinitions="actionsOverflow"
            @actionClick="(id, value) => handleActionClick(id, { value })"
          >
            <LxButton
              :id="`${id}-overflow-left`"
              kind="ghost"
              :tabindex="-1"
              icon="overflow-menu"
              :label="displayTexts.overflowMenu"
              variant="icon-only"
              :disabled="props.disabled || props.loading"
            />
          </LxDropDownMenu>
        </LxToolbarGroup>

        <LxToolbarGroup
          v-for="group in leftActionsVisibleGrouped"
          :key="group.groupId"
          class="action-definitions-group"
        >
          <template v-for="action in group.actions" :key="action?.id">
            <LxButton
              v-if="isActionButton(action)"
              :id="getActionId(action?.id)"
              :label="action?.name || action?.label"
              :title="action?.title || action?.tooltip"
              :icon="action?.icon"
              :iconSet="action?.iconSet"
              :kind="action?.kind || 'ghost'"
              :loading="action?.loading"
              :busy="action?.busy"
              :destructive="action?.destructive"
              :disabled="action?.disabled || props.disabled || props.loading"
              :active="action?.active"
              variant="icon-only"
              :customClass="action?.customClass"
              :badge="action?.badge"
              :badgeType="action?.badgeType"
              :badgeIcon="action?.badgeIcon"
              :badgeTitle="action?.badgeTitle"
              :href="action?.href"
              @click="handleActionClick(action?.id)"
            />
            <LxToggle
              v-else-if="isActionToggle(action)"
              :id="getActionId(action?.id)"
              :label="action?.name || action?.label"
              :disabled="action?.disabled || props.disabled || props.loading"
              v-model="action.value"
              :texts="action?.texts"
              :tooltip="action?.title || action?.tooltip"
              :builderOptions="{
                innerComponent: true,
              }"
              @update:modelValue="(value) => handleActionClick(action?.id, { value })"
            />
            <LxDropDownMenu
              v-else-if="isActionDropDown(action)"
              :disabled="action?.disabled || props.disabled || props.loading"
              :actionDefinitions="actionsByGroupId.get(action?.nestedGroupId) ?? []"
              @actionClick="(id, value) => handleActionClick(id, { value })"
            >
              <LxButton
                v-if="isActionDropDown(action)"
                :id="getActionId(action?.id)"
                :label="action?.name || action?.label"
                :title="action?.title || action?.tooltip"
                :icon="action?.icon || 'menu'"
                :iconSet="action?.iconSet"
                :kind="action?.kind || 'ghost'"
                :tabindex="-1"
                :loading="action?.loading"
                :busy="action?.busy"
                :destructive="action?.destructive"
                :disabled="action?.disabled || props.disabled || props.loading"
                :active="action?.active"
                :badge="action?.badge"
                :badgeType="action?.badgeType"
                :badgeIcon="action?.badgeIcon"
                :badgeTitle="action?.badgeTitle"
                variant="icon-only"
              />
            </LxDropDownMenu>
            <div
              v-else-if="isActionSlot(action)"
              :id="getActionId(action?.id)"
              class="lx-toolbar-action-slot"
            >
              <slot :name="action?.id" />
            </div>
          </template>
        </LxToolbarGroup>

        <LxToolbarGroup v-if="hasSearch && autoSearchMode === 'default'" class="lx-toolbar-search">
          <LxTextInput
            ref="searchInputDefault"
            :key="searchInputRefresh"
            role="search"
            v-model="searchStringRaw"
            :kind="searchSide === 'server' ? 'default' : 'search'"
            :placeholder="displayTexts.placeholder"
            :disabled="disabled || loading || busy"
            :builderOptions="{
              innerComponent: true,
            }"
            @keydown.enter="serverSideSearch"
          />
          <LxButton
            v-if="searchSide === 'server'"
            icon="search"
            kind="ghost"
            variant="icon-only"
            :label="displayTexts.search"
            :disabled="disabled || loading || busy"
            :loading="loading"
            @click="serverSideSearch"
          />
          <LxButton
            v-if="searchStringRaw"
            icon="clear"
            kind="ghost"
            variant="icon-only"
            :label="displayTexts.clear"
            :disabled="disabled || loading || busy"
            :loading="loading"
            @click="clear"
          />
        </LxToolbarGroup>

        <LxToolbarGroup v-if="hasLeftAreaSlotContent" ref="leftAreaSlotRef">
          <slot name="leftArea" />
        </LxToolbarGroup>
      </div>

      <div ref="defaultAreaRef" class="default-area">
        <LxToolbarGroup v-if="hasDefaultSlotContent" ref="defaultAreaSlotRef">
          <slot />
        </LxToolbarGroup>
      </div>

      <div
        ref="rightAreaRef"
        class="right-area"
        :class="{ 'lx-toolbar-area-empty': isRightAreaEmpty }"
      >
        <LxToolbarGroup v-if="hasRightAreaSlotContent" ref="rightAreaSlotRef">
          <slot name="rightArea" />
        </LxToolbarGroup>

        <LxToolbarGroup
          v-for="group in rightActionsVisibleGrouped"
          :key="group.groupId"
          class="action-definitions-group"
        >
          <template v-for="action in group.actions" :key="action?.id">
            <LxButton
              v-if="isActionButton(action)"
              :id="getActionId(action?.id)"
              :label="action?.name || action?.label"
              :title="action?.title || action?.tooltip"
              :icon="action?.icon"
              :iconSet="action?.iconSet"
              :kind="action?.kind || 'ghost'"
              :loading="action?.loading"
              :busy="action?.busy"
              :destructive="action?.destructive"
              :disabled="action?.disabled || props.disabled || props.loading"
              :active="action?.active"
              variant="icon-only"
              :customClass="action?.customClass"
              :badge="action?.badge"
              :badgeType="action?.badgeType"
              :badgeIcon="action?.badgeIcon"
              :badgeTitle="action?.badgeTitle"
              :href="action?.href"
              @click="handleActionClick(action?.id)"
            />
            <LxToggle
              v-else-if="isActionToggle(action)"
              :id="getActionId(action?.id)"
              :label="action?.name || action?.label"
              :disabled="action?.disabled || props.disabled || props.loading"
              v-model="action.value"
              :texts="action?.texts"
              :tooltip="action?.title || action?.tooltip"
              :builderOptions="{
                innerComponent: true,
              }"
              @update:modelValue="(value) => handleActionClick(action?.id, { value })"
            />
            <LxDropDownMenu
              v-else-if="isActionDropDown(action)"
              :disabled="action?.disabled || props.disabled || props.loading"
              :actionDefinitions="actionsByGroupId.get(action?.nestedGroupId) ?? []"
              @actionClick="(id, value) => handleActionClick(id, { value })"
            >
              <LxButton
                v-if="isActionDropDown(action)"
                :id="getActionId(action?.id)"
                :label="action?.name || action?.label"
                :title="action?.title || action?.tooltip"
                :icon="action?.icon || 'menu'"
                :iconSet="action?.iconSet"
                :kind="action?.kind || 'ghost'"
                :tabindex="-1"
                :loading="action?.loading"
                :busy="action?.busy"
                :destructive="action?.destructive"
                :disabled="action?.disabled || props.disabled || props.loading"
                :active="action?.active"
                :badge="action?.badge"
                :badgeType="action?.badgeType"
                :badgeIcon="action?.badgeIcon"
                :badgeTitle="action?.badgeTitle"
                variant="icon-only"
              />
            </LxDropDownMenu>
            <div
              v-else-if="isActionSlot(action)"
              :id="getActionId(action?.id)"
              class="lx-toolbar-action-slot"
            >
              <slot :name="action?.id" />
            </div>
          </template>
        </LxToolbarGroup>

        <!-- Both v-if and v-show are necessary -->
        <LxToolbarGroup
          v-if="defaultAreaComputed === 'left'"
          v-show="actionsOverflow.length > 0"
          :class="actionsOverflow.length === 0 ? 'lx-toolbar-overflow-hidden' : null"
        >
          <LxDropDownMenu
            :disabled="props.disabled || props.loading"
            :actionDefinitions="actionsOverflow"
            @actionClick="(id, value) => handleActionClick(id, { value })"
          >
            <LxButton
              :id="`${id}-overflow-right`"
              kind="ghost"
              :tabindex="-1"
              icon="overflow-menu"
              :label="displayTexts.overflowMenu"
              variant="icon-only"
              :disabled="props.disabled || props.loading"
            />
          </LxDropDownMenu>
        </LxToolbarGroup>

        <LxToolbarGroup v-if="promotedAction?.area === 'right'" class="lx-toolbar-promoted-action">
          <LxButton
            :id="getActionId(promotedAction.id)"
            :label="promotedAction.name || promotedAction.label"
            :title="promotedAction.title || promotedAction.tooltip"
            :icon="promotedAction.icon"
            :iconSet="promotedAction.iconSet"
            :variant="promotedAction.variant"
            :kind="promotedAction.kind"
            :loading="promotedAction.loading"
            :busy="promotedAction.busy"
            :destructive="promotedAction.destructive"
            :disabled="promotedAction.disabled || props.disabled || props.loading"
            :active="promotedAction.active"
            :badge="promotedAction.badge"
            :badgeType="promotedAction.badgeType"
            :badgeIcon="promotedAction.badgeIcon"
            :badgeTitle="promotedAction.badgeTitle"
            :customClass="promotedAction.customClass"
            :href="promotedAction.href"
            @click="handleActionClick(promotedAction.id)"
          />
        </LxToolbarGroup>

        <LxToolbarGroup v-if="hasSearch && autoSearchMode === 'compact'">
          <div class="toolbar-search-button" :class="[{ 'is-expanded': isSearchExpanded }]">
            <LxButton
              class="toolbar-search-button"
              :class="[{ 'is-expanded': isSearchExpanded }]"
              kind="ghost"
              variant="icon-only"
              :icon="isSearchExpanded ? 'close' : 'search'"
              :label="isSearchExpanded ? displayTexts.closeSearch : displayTexts.openSearch"
              :disabled="disabled || loading || busy"
              :loading="loading"
              @click="toggleSearch"
            />
          </div>
        </LxToolbarGroup>

        <LxToolbarGroup v-if="hasSelectAll && selectAllSide === 'right'">
          <LxButton
            :id="`${id}-select-all`"
            :icon="selectionState"
            kind="ghost"
            :variant="selectAllVariant"
            :label="
              selectionState === 'checkbox'
                ? displayTexts.selectAllRows
                : displayTexts.clearSelected
            "
            :disabled="isSelectAllDisabled"
            :loading="loading"
            @click="selectAll"
          />
        </LxToolbarGroup>
      </div>
    </div>

    <div class="second-row">
      <div
        v-if="hasSearch && isSearchExpanded && autoSearchMode === 'compact'"
        class="toolbar-search"
      >
        <LxTextInput
          ref="searchInputCompact"
          role="search"
          v-model="searchStringRaw"
          :kind="searchSide === 'server' ? 'default' : 'search'"
          :placeholder="displayTexts.placeholder"
          :disabled="disabled || loading || busy"
          :builderOptions="{
            innerComponent: true,
          }"
          @keydown.enter="serverSideSearch"
        />

        <div class="lx-group lx-slot-wrapper">
          <LxButton
            v-if="searchSide === 'server'"
            icon="search"
            kind="ghost"
            variant="icon-only"
            :label="displayTexts.search"
            :disabled="disabled || loading || busy"
            :loading="loading"
            @click="serverSideSearch"
          />

          <LxButton
            v-if="searchStringRaw"
            icon="clear"
            kind="ghost"
            variant="icon-only"
            :label="displayTexts.clear"
            :disabled="disabled || loading || busy"
            :loading="loading"
            @click="clear"
          />
        </div>
      </div>

      <slot name="secondRow" />
    </div>
  </div>
</template>
