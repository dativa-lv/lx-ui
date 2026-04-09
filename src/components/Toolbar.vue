<script setup>
import {
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  inject,
  useSlots,
  Comment,
  Fragment,
  Text,
} from 'vue';
import { useWindowSize, useDebounceFn } from '@vueuse/core';
import LxToolbarGroup from '@/components/ToolbarGroup.vue';
import LxButton from '@/components/Button.vue';
import LxDropDownMenu from '@/components/DropDownMenu.vue';
import LxTextInput from '@/components/TextInput.vue';
import LxToggle from '@/components/Toggle.vue';
import { generateUUID, foldToAscii } from '@/utils/stringUtils';
import { getDisplayTexts } from '@/utils/generalUtils';
import useLx from '@/hooks/useLx';
import { logWarn } from '@/utils/devUtils';

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
  selectionState: { type: String, default: 'checkbox' }, // checkbox, checkbox-filled, checkbox-indeterminate, radiobutton-filled
  selectAllSide: { type: String, default: 'right' }, // right, left
  selectAllVariant: { type: String, default: 'icon-only' }, // icon-only, default
  defaultArea: { type: String, default: 'auto' }, // auto, right, left
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

const GROUP_ID_DEFAULT = 'lx_group_default';
const GROUP_ID_EXTRA = 'lx_group_extra';
const GROUP_ID_PROMOTED = 'lx_group_promoted';
const ACTION_KINDS_SPECIAL = ['toggle', 'slot'];
const CONTENT_SLOTS = ['default', 'leftArea', 'rightArea', 'secondRow'];

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
const { width } = useWindowSize();
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

const isToolbarEmpty = computed(
  () =>
    !props.actionDefinitions.length &&
    !props.hasSearch &&
    !props.hasSelectAll &&
    CONTENT_SLOTS.every((name) => !hasSlotContent(slots[name]?.() ?? []))
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
  if (action.kind === 'toggle' && action.value === undefined) {
    /* eslint-disable no-param-reassign */
    action.value = false;
  }

  if (action.extra) {
    return {
      ...action,
      icon: action.icon,
      area: getArea(action),
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
      area: getArea(action),
      groupId: action.groupId || GROUP_ID_DEFAULT,
      nonResponsive: true,
      ...overrides,
    };
  }

  return {
    ...action,
    icon: action.icon,
    area: getArea(action),
    kind: action.kind || 'ghost',
    variant: action.variant || 'icon-only',
    groupId: action.groupId || GROUP_ID_DEFAULT,
    disabled: action.disabled || props.disabled || props.loading || props.busy,
    ...overrides,
  };
}

function applyKindAndVariant(action, overrides = {}) {
  if (ACTION_KINDS_SPECIAL.includes(action.kind)) {
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
  return {
    promotedAction: applyDefaults(firstAction, {
      kind: firstAction.kind,
      variant: 'default',
      groupId: GROUP_ID_PROMOTED,
    }),
    demotedActions: rest.map((action) => applyKindAndVariant(action)),
  };
}

function placeActionByArea(result, action) {
  if (!action) return;

  if (action.area === 'left') {
    result.unshift(action);
  } else {
    result.push(action);
  }
}

function addPromotedAction(result, promotedAction) {
  placeActionByArea(result, promotedAction);

  if (!promotedAction?.name) {
    logWarn('Promoted toolbar action must have a name.', globalEnvironment);
  }
}

const actionsProcessed = computed(() => {
  if (!props.actionDefinitions.length) {
    return [];
  }

  const normalizedActions = props.actionDefinitions.map((a) => applyDefaults(a));
  const regularActions = normalizedActions.filter((a) => !a.extra);
  const extraActions = normalizedActions.filter((a) => a.extra);
  const sortedExtraActions = insideForm.value ? extraActions : [...extraActions].reverse();
  const { promotedAction, demotedActions } = processGroup(regularActions);
  const result = [...demotedActions, ...sortedExtraActions];

  if (promotedAction) {
    addPromotedAction(result, promotedAction);
  }

  return result;
});

const sortActionsByExtra = (actions, extraFirst) => {
  const extraWeight = extraFirst ? -1 : 1;
  return actions?.sort((a, b) => (a?.extra ? extraWeight : 0) - (b?.extra ? extraWeight : 0));
};

const leftActions = computed(() =>
  sortActionsByExtra(
    actionsProcessed.value?.filter((x) => x?.area === 'left'),
    false
  )
);
const leftActionsResponsive = computed(() => leftActions.value?.filter((x) => !x?.nonResponsive));
const leftActionsNonResponsive = computed(() => leftActions.value?.filter((x) => x?.nonResponsive));

const rightActions = computed(() =>
  sortActionsByExtra(
    actionsProcessed.value?.filter((x) => x?.area === 'right'),
    true
  )
);
const rightActionsResponsive = computed(() => rightActions.value?.filter((x) => !x?.nonResponsive));
const rightActionsNonResponsive = computed(() =>
  rightActions.value?.filter((x) => x?.nonResponsive)
);

const getUniqueGroupIds = (actions) => [...new Set(actions.map((a) => a.groupId))];

const getUniqueNestedGroupIds = (actions) =>
  new Set(actions?.map((a) => a.nestedGroupId).filter(Boolean));

const leftGroupIds = computed(() => getUniqueGroupIds(leftActions.value));
const rightGroupIds = computed(() => getUniqueGroupIds(rightActions.value));

const leftNestedGroupIds = computed(() => getUniqueNestedGroupIds(leftActions.value));
const rightNestedGroupIds = computed(() => getUniqueNestedGroupIds(rightActions.value));

const isNested = (groupId, side) => {
  const groupIds = side === 'right' ? rightNestedGroupIds.value : leftNestedGroupIds.value;

  return groupIds?.has(groupId) ?? false;
};

const isActionVisibleInGroup = (action, groupId, side) => {
  if (isNested(action.groupId, side)) {
    return false;
  }

  return action.groupId === groupId && !action.nestedGroupId;
};

function handleActionClick(id, { value = undefined } = {}) {
  emits('actionClick', id, value);
}

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

const autoSearchMode = computed(() => {
  if (
    (props.searchMode === 'default' && !props.hasSelectAll) ||
    props.searchMode === 'defaultForce'
  ) {
    return 'default';
  }

  return 'compact';
});

const isSearchExpanded = ref(false);
const searchInputCompact = ref();

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
    action.area === 'left' ? `${props.id}-overflow-left` : `${props.id}-overflow-right`;
  document.getElementById(overflowId)?.focus();
}

onMounted(() => {
  if (props.hasSearch && props.searchString) {
    if (props.searchSide === 'client') {
      clientSideSearch();
    } else if (props.searchSide === 'server') {
      serverSideSearch();
    }
  }
});

defineExpose({ toggleSearch, focusAction });
</script>

<template>
  <div
    class="lx-component-toolbar"
    :class="[
      { 'lx-toolbar-no-borders': noBorders },
      { 'lx-toolbar-default-area-right': defaultAreaComputed === 'right' },
      { 'lx-toolbar-default-area-left': defaultAreaComputed === 'left' },
      { 'lx-toolbar-empty': isToolbarEmpty },
      { 'lx-disabled': disabled || loading },
    ]"
    role="toolbar"
  >
    <div class="first-row">
      <div class="left-area">
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

        <template v-if="width > 800">
          <LxToolbarGroup
            v-for="groupId in leftGroupIds"
            :key="groupId"
            class="action-definitions-group"
          >
            <template v-for="action in leftActions" :key="action?.id">
              <LxButton
                v-if="
                  isActionVisibleInGroup(action, groupId, 'left') &&
                  !ACTION_KINDS_SPECIAL.includes(action?.kind)
                "
                :id="`${id}-action-${action?.id}`"
                :kind="action?.kind || 'ghost'"
                :icon="action?.icon"
                :iconSet="action?.iconSet"
                :busy="action?.busy"
                :loading="action?.loading"
                :title="action?.title || action?.tooltip"
                :active="action?.active"
                :destructive="action?.destructive"
                :disabled="action?.disabled || props.disabled || props.loading"
                :label="action?.name || action?.label"
                :variant="
                  action?.variant ? action?.variant : action?.label ? 'default' : 'icon-only'
                "
                :badge="action?.badge"
                :badgeType="action?.badgeType"
                :badgeIcon="action?.badgeIcon"
                :badgeTitle="action?.badgeTitle"
                :href="action?.href"
                @click="handleActionClick(action?.id)"
              />
              <LxToggle
                v-else-if="
                  isActionVisibleInGroup(action, groupId, 'left') && action?.kind === 'toggle'
                "
                :id="`${id}-action-${action?.id}`"
                :label="action?.name || action?.label"
                :disabled="action?.disabled || props.disabled || props.loading"
                v-model="action.value"
                :texts="action?.texts"
                :tooltip="action?.title || action?.tooltip"
                @update:modelValue="(value) => handleActionClick(action?.id, { value })"
              />
              <LxDropDownMenu
                v-else-if="
                  action?.groupId === groupId &&
                  action?.nestedGroupId &&
                  !ACTION_KINDS_SPECIAL.includes(action?.kind)
                "
                :disabled="action?.disabled || props.disabled || props.loading"
                :actionDefinitions="leftActions.filter((a) => action?.nestedGroupId === a.groupId)"
                @actionClick="(id, value) => handleActionClick(id, { value })"
              >
                <LxButton
                  v-if="
                    action?.groupId === groupId &&
                    action?.nestedGroupId &&
                    !ACTION_KINDS_SPECIAL.includes(action?.kind)
                  "
                  :id="`${id}-action-${action?.id}`"
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
              <slot
                v-else-if="
                  isActionVisibleInGroup(action, groupId, 'left') && action?.kind === 'slot'
                "
                :name="action?.id"
              />
            </template>
          </LxToolbarGroup>
        </template>

        <LxToolbarGroup
          class="action-definitions-small"
          v-if="width < 801 && leftActions?.length > 0"
        >
          <LxDropDownMenu
            v-if="leftActionsResponsive?.length > 1"
            :disabled="props.disabled || props.loading"
            :actionDefinitions="leftActionsResponsive.filter((a) => !a.nestedGroupId)"
            @actionClick="(id, value) => handleActionClick(id, { value })"
          >
            <LxButton
              :id="`${id}-overflow-left`"
              kind="ghost"
              :tabindex="-1"
              icon="menu"
              :label="displayTexts.overflowMenu"
              variant="icon-only"
              :disabled="props.disabled || props.loading"
            />
          </LxDropDownMenu>

          <template v-if="leftActionsNonResponsive?.length > 0">
            <template v-for="item in leftActionsNonResponsive" :key="item?.id">
              <LxButton
                v-if="!ACTION_KINDS_SPECIAL.includes(item?.kind)"
                v-show="!item?.nestedGroupId"
                :id="`${id}-action-${item?.id}`"
                :label="item?.name || item?.label"
                :title="item?.title || item?.tooltip"
                :icon="item?.icon"
                :iconSet="item?.iconSet"
                :kind="item?.kind || 'ghost'"
                :loading="item?.loading"
                :busy="item?.busy"
                :destructive="item?.destructive"
                :disabled="item?.disabled || props.disabled || props.loading"
                variant="icon-only"
                :active="item?.active"
                :badge="item?.badge"
                :badgeType="item?.badgeType"
                :badgeIcon="item?.badgeIcon"
                :badgeTitle="item?.badgeTitle"
                :href="item?.href"
                @click="handleActionClick(item?.id)"
              />
              <LxToggle
                v-else-if="item?.kind === 'toggle'"
                v-show="!item?.nestedGroupId"
                :id="`${id}-action-${item?.id}`"
                :label="item?.name || item?.label"
                :disabled="item?.disabled || props.disabled || props.loading"
                v-model="item.value"
                :texts="item?.texts"
                :tooltip="item?.title || item?.tooltip"
                @update:modelValue="(value) => handleActionClick(item?.id, { value })"
              />
              <slot v-else-if="item?.kind === 'slot'" :name="item?.id" />
            </template>
          </template>

          <template
            v-if="leftActionsResponsive?.length === 1 && !leftActionsResponsive?.[0]?.nestedGroupId"
          >
            <LxButton
              v-if="!ACTION_KINDS_SPECIAL.includes(leftActionsResponsive?.[0]?.kind)"
              :id="`${id}-action-${leftActionsResponsive?.[0].id}`"
              :label="leftActionsResponsive?.[0]?.name || leftActionsResponsive?.[0]?.label"
              :title="leftActionsResponsive?.[0]?.title || leftActionsResponsive?.[0]?.tooltip"
              :icon="leftActionsResponsive?.[0]?.icon"
              :iconSet="leftActionsResponsive?.[0]?.iconSet"
              :kind="leftActionsResponsive?.[0]?.kind || 'ghost'"
              :loading="leftActionsResponsive?.[0].loading"
              :busy="leftActionsResponsive?.[0].busy"
              :destructive="leftActionsResponsive?.[0]?.destructive"
              :disabled="leftActionsResponsive?.[0]?.disabled || props.disabled || props.loading"
              :active="leftActionsResponsive?.[0]?.active"
              variant="icon-only"
              :badge="leftActionsResponsive?.[0]?.badge"
              :badgeType="leftActionsResponsive?.[0]?.badgeType"
              :badgeIcon="leftActionsResponsive?.[0]?.badgeIcon"
              :badgeTitle="leftActionsResponsive?.[0]?.badgeTitle"
              :href="leftActionsResponsive?.[0]?.href"
              @click="handleActionClick(leftActionsResponsive?.[0].id)"
            />
            <LxToggle
              v-else-if="leftActionsResponsive?.[0]?.kind === 'toggle'"
              :id="`${id}-action-${leftActionsResponsive?.[0]?.id}`"
              :label="leftActionsResponsive?.[0]?.name || leftActionsResponsive?.[0]?.label"
              :disabled="leftActionsResponsive?.[0]?.disabled || props.disabled || props.loading"
              v-model="leftActionsResponsive[0].value"
              :texts="leftActionsResponsive?.[0]?.texts"
              :tooltip="leftActionsResponsive?.[0]?.title || leftActionsResponsive?.[0]?.tooltip"
              @update:modelValue="
                (value) => handleActionClick(leftActionsResponsive?.[0]?.id, { value })
              "
            />
          </template>
        </LxToolbarGroup>

        <LxToolbarGroup v-if="hasSearch && autoSearchMode === 'default'">
          <LxTextInput
            ref="searchInputDefault"
            :key="searchInputRefresh"
            role="search"
            v-model="searchStringRaw"
            :kind="searchSide === 'server' ? 'default' : 'search'"
            :placeholder="displayTexts.placeholder"
            :disabled="disabled || loading || busy"
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

        <LxToolbarGroup v-if="$slots.leftArea">
          <slot name="leftArea" />
        </LxToolbarGroup>
      </div>

      <div class="default-area">
        <LxToolbarGroup v-if="$slots.default">
          <slot />
        </LxToolbarGroup>
      </div>

      <div class="right-area">
        <LxToolbarGroup v-if="$slots.rightArea">
          <slot name="rightArea" />
        </LxToolbarGroup>

        <template v-if="width > 800">
          <LxToolbarGroup
            v-for="groupId in rightGroupIds"
            :key="groupId"
            class="action-definitions-group"
          >
            <template v-for="action in rightActions" :key="action?.id">
              <LxButton
                v-if="
                  isActionVisibleInGroup(action, groupId, 'right') &&
                  !ACTION_KINDS_SPECIAL.includes(action?.kind)
                "
                :id="`${id}-action-${action?.id}`"
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
                :variant="
                  action?.variant ? action?.variant : action?.label ? 'default' : 'icon-only'
                "
                :custom-class="action?.customClass"
                :badge="action?.badge"
                :badgeType="action?.badgeType"
                :badgeIcon="action?.badgeIcon"
                :badgeTitle="action?.badgeTitle"
                :href="action?.href"
                @click="handleActionClick(action?.id)"
              />
              <LxToggle
                v-else-if="
                  isActionVisibleInGroup(action, groupId, 'right') && action?.kind === 'toggle'
                "
                :id="`${id}-action-${action?.id}`"
                :label="action?.name || action?.label"
                :disabled="action?.disabled || props.disabled || props.loading"
                v-model="action.value"
                :texts="action?.texts"
                :tooltip="action?.title || action?.tooltip"
                @update:modelValue="(value) => handleActionClick(action?.id, { value })"
              />
              <LxDropDownMenu
                v-else-if="
                  action?.groupId === groupId &&
                  action?.nestedGroupId &&
                  !ACTION_KINDS_SPECIAL.includes(action?.kind)
                "
                :disabled="action?.disabled || props.disabled || props.loading"
                :actionDefinitions="rightActions.filter((a) => action?.nestedGroupId === a.groupId)"
                @actionClick="(id, value) => handleActionClick(id, { value })"
              >
                <LxButton
                  v-if="
                    action?.groupId === groupId &&
                    action?.nestedGroupId &&
                    !ACTION_KINDS_SPECIAL.includes(action?.kind)
                  "
                  :id="`${id}-action-${action?.id}`"
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
              <slot
                v-else-if="
                  isActionVisibleInGroup(action, groupId, 'right') && action?.kind === 'slot'
                "
                :name="action?.id"
              />
            </template>
          </LxToolbarGroup>
        </template>

        <LxToolbarGroup
          class="action-definitions-small"
          v-if="
            width < 801 &&
            (rightActionsResponsive?.length > 0 || rightActionsNonResponsive?.length > 0)
          "
        >
          <template
            v-if="
              (rightActionsResponsive?.length === 1 && !rightActions?.[0]?.nestedGroupId) ||
              rightActionsNonResponsive?.length > 0
            "
          >
            <template v-for="item in rightActionsNonResponsive" :key="item?.id">
              <LxButton
                v-if="!ACTION_KINDS_SPECIAL.includes(item?.kind)"
                v-show="!item?.nestedGroupId && item?.nonResponsive"
                :id="`${id}-action-${item?.id}`"
                :label="item?.name || item?.label"
                :title="item?.title || item?.tooltip"
                :icon="item?.icon"
                :iconSet="item?.iconSet"
                variant="icon-only"
                :kind="item?.kind || 'ghost'"
                :loading="item?.loading"
                :busy="item?.busy"
                :destructive="item?.destructive"
                :disabled="item?.disabled || props.disabled || props.loading"
                :active="item?.active"
                :badge="item?.badge"
                :badgeType="item?.badgeType"
                :badgeIcon="item?.badgeIcon"
                :badgeTitle="item?.badgeTitle"
                :customClass="item?.customClass"
                :href="item?.href"
                @click="handleActionClick(item?.id)"
              />
              <LxToggle
                v-else-if="item?.kind === 'toggle'"
                v-show="!item?.nestedGroupId && item?.nonResponsive"
                :id="`${id}-action-${item?.id}`"
                :label="item?.name || item?.label"
                :disabled="item?.disabled || props.disabled || props.loading"
                v-model="item.value"
                :texts="item?.texts"
                :tooltip="item?.title || item?.tooltip"
                @update:modelValue="(value) => handleActionClick(item?.id, { value })"
              />
              <slot v-else-if="item?.kind === 'slot'" :name="item?.id" />
            </template>
          </template>

          <template
            v-if="
              rightActionsResponsive?.length === 1 && !rightActionsResponsive?.[0]?.nestedGroupId
            "
          >
            <LxButton
              v-if="!ACTION_KINDS_SPECIAL.includes(rightActionsResponsive?.[0]?.kind)"
              :id="`${id}-action-${rightActionsResponsive?.[0]?.id}`"
              :label="rightActionsResponsive?.[0]?.name || rightActionsResponsive?.[0]?.label"
              :title="rightActionsResponsive?.[0]?.title || rightActionsResponsive?.[0]?.tooltip"
              :icon="rightActionsResponsive?.[0]?.icon"
              :iconSet="rightActionsResponsive?.[0]?.iconSet"
              variant="icon-only"
              :kind="rightActionsResponsive?.[0]?.kind || 'ghost'"
              :loading="rightActionsResponsive?.[0]?.loading"
              :busy="rightActionsResponsive?.[0]?.busy"
              :destructive="rightActionsResponsive?.[0]?.destructive"
              :disabled="rightActionsResponsive?.[0]?.disabled || props.disabled || props.loading"
              :active="rightActionsResponsive?.[0]?.active"
              :badge="rightActionsResponsive?.[0]?.badge"
              :badgeType="rightActionsResponsive?.[0]?.badgeType"
              :badgeIcon="rightActionsResponsive?.[0]?.badgeIcon"
              :badgeTitle="rightActionsResponsive?.[0]?.badgeTitle"
              :customClass="rightActionsResponsive?.[0]?.customClass"
              :href="rightActionsResponsive?.[0]?.href"
              @click="handleActionClick(rightActionsResponsive?.[0]?.id)"
            />
            <LxToggle
              v-else-if="rightActionsResponsive?.[0]?.kind === 'toggle'"
              :id="`${id}-action-${rightActionsResponsive?.[0]?.id}`"
              :label="rightActionsResponsive?.[0]?.name || rightActionsResponsive?.[0]?.label"
              :disabled="rightActionsResponsive?.[0]?.disabled || props.disabled || props.loading"
              v-model="rightActionsResponsive[0].value"
              :texts="rightActionsResponsive?.[0]?.texts"
              :tooltip="rightActionsResponsive?.[0]?.title || rightActionsResponsive?.[0]?.tooltip"
              @update:modelValue="
                (value) => handleActionClick(rightActionsResponsive?.[0]?.id, { value })
              "
            />
          </template>

          <LxDropDownMenu
            v-if="rightActionsResponsive?.length > 1"
            :disabled="props.disabled || props.loading"
            :actionDefinitions="rightActionsResponsive.filter((a) => !a.nestedGroupId)"
            @actionClick="(id, value) => handleActionClick(id, { value })"
          >
            <LxButton
              :id="`${id}-overflow-right`"
              kind="ghost"
              :tabindex="-1"
              icon="menu"
              :label="displayTexts.overflowMenu"
              variant="icon-only"
              :disabled="props.disabled || props.loading"
            />
          </LxDropDownMenu>
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
