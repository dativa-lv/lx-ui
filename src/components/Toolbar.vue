<script setup>
import { computed } from 'vue';
import LxToolbarGroup from '@/components/ToolbarGroup.vue';
import LxButton from '@/components/Button.vue';
import LxDropDownMenu from '@/components/DropDownMenu.vue';
import { generateUUID } from '@/utils/stringUtils';
import { getDisplayTexts } from '@/utils/generalUtils';
import useLx from '@/hooks/useLx';
import { logWarn } from '@/utils/devUtils';
import { useWindowSize } from '@vueuse/core';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  actionDefinitions: { type: Array, default: () => [] },
  noBorders: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  hasSearch: { type: Boolean, default: false },
  searchField: { type: Boolean, default: false },
  searchMode: { type: String, default: 'default' }, // default, compact
  hasSelecting: { type: Boolean, default: false },
  selectionKind: { type: String, default: 'single' }, // single, multiple
  selectAllSide: { type: String, default: 'right' }, // right, left
  defaultArea: { type: String, default: 'right' }, // right, left
  texts: {
    type: Object,
    default: () => ({}),
  },
});

const emits = defineEmits(['actionClick']);

const textsDefault = {
  overflowMenu: 'Atvērt papildu iespējas',
  openSearch: 'Atvērt meklētāju',
  closeSearch: 'Aizvērt meklētāju',
  selectAllRows: 'Izvēlēties visu',
};
const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));

const globalEnvironment = useLx().getGlobals()?.environment;
const { width } = useWindowSize();

const actionsProcessed = computed(() => {
  if (!props.actionDefinitions.length) {
    return [];
  }

  const getArea = (action) => {
    const parentAction = props.actionDefinitions.find(
      (a) => action.groupId && a.nestedGroupId && a.nestedGroupId === action.groupId
    );

    return parentAction ? parentAction.area ?? props.defaultArea : action.area ?? props.defaultArea;
  };

  const withDefaults = (action, overrides = {}) => ({
    ...action,
    icon: action.icon ?? 'fallback-icon',
    area: getArea(action),
    kind: action.kind ?? 'ghost',
    variant: action.variant ?? 'icon-only',
    groupId: action.groupId ?? 'lx-default',
    disabled: action.disabled || props.disabled || props.loading || props.busy,
    ...overrides,
  });

  const withKindAndVariant = (action, overrides = {}) => ({
    ...action,
    kind: 'ghost',
    variant: 'icon-only',
    ...overrides,
  });

  const normalizedActions = props.actionDefinitions.map((a) => withDefaults(a));

  let promotedAction = null;
  let demotedActions = [];

  const processGroup = (group) => {
    if (!group.length) {
      return;
    }

    const firstAction =
      group.find((a) => a.kind === 'primary') ??
      group.find((a) => a.kind === 'secondary') ??
      group.find((a) => a.kind === 'tertiary');

    if (!firstAction) {
      demotedActions = group.map((action) => withKindAndVariant(action));
      return;
    }

    const rest = group.filter((a) => a.id !== firstAction.id);

    promotedAction = withDefaults(firstAction, { kind: firstAction.kind, variant: 'default' });
    demotedActions = rest.map((action) => withKindAndVariant(action));
  };

  processGroup(normalizedActions);

  const result = [...demotedActions];

  if (promotedAction) {
    if (promotedAction.area === 'left') {
      result.unshift(promotedAction);
    } else {
      result.push(promotedAction);
    }

    if (!promotedAction.name) {
      logWarn('Promoted toolbar action must have a name.', globalEnvironment);
    }
  }

  // Add search button if needed
  if (props.hasSearch && (props.searchMode === 'compact' || props.hasSelecting)) {
    result.push({
      id: 'search',
      name: props.searchField ? displayTexts.value.closeSearch : displayTexts.value.openSearch,
      icon: props.searchField ? 'close' : 'search',
      area: 'right',
      variant: 'icon-only',
      kind: 'ghost',
      groupId: 'lx-search',
      disabled: props.disabled || props.loading || props.busy,
      customClass: props.searchField ? 'toolbar-search-button is-expanded' : '',
      nonResponsive: true,
    });
  }

  // Add select-all button if needed
  if (props.hasSelecting && props.selectionKind === 'multiple') {
    const selectAllAction = {
      id: 'select-all',
      name: displayTexts.value.selectAllRows,
      icon: 'checkbox',
      area: props.selectAllSide,
      variant: 'icon-only',
      kind: 'ghost',
      groupId: 'lx-select-all',
      disabled: props.disabled || props.loading || props.busy,
      nonResponsive: true,
    };

    if (props.selectAllSide === 'right') {
      result.push(selectAllAction);
    } else {
      result.unshift(selectAllAction);
    }
  }

  return result;
});

const leftActions = computed(() => actionsProcessed.value?.filter((x) => x?.area === 'left'));
const leftActionsResponsive = computed(() => leftActions.value?.filter((x) => !x?.nonResponsive));
const leftActionsNonResponsive = computed(() => leftActions.value?.filter((x) => x?.nonResponsive));

const rightActions = computed(() => actionsProcessed.value?.filter((x) => x?.area === 'right'));
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

function handleActionClick(id) {
  emits('actionClick', id);
}
</script>

<template>
  <div
    class="lx-component-toolbar"
    :class="[
      { 'lx-toolbar-no-borders': noBorders },
      { 'lx-disabled': props.disabled || props.loading },
    ]"
    role="toolbar"
  >
    <div class="first-row">
      <div class="left-area">
        <template v-if="width > 800">
          <LxToolbarGroup
            v-for="groupId in leftGroupIds"
            :key="groupId"
            class="action-definitions-group"
          >
            <template v-for="action in leftActions" :key="action.id">
              <LxButton
                v-if="isActionVisibleInGroup(action, groupId, 'left')"
                :id="`${id}-action-${action.id}`"
                :kind="action?.kind || 'ghost'"
                :icon="action?.icon"
                :icon-set="action?.iconSet"
                :busy="action?.busy"
                :loading="action?.loading"
                :title="action?.title || action?.tooltip"
                :active="action?.active"
                :destructive="action?.destructive"
                :disabled="action?.disabled || props.disabled || props.loading"
                :label="action?.name || action?.label"
                :variant="
                  action?.variant ? action.variant : action?.label ? 'default' : 'icon-only'
                "
                :badge="action?.badge"
                :badgeType="action?.badgeType"
                :badgeIcon="action?.badgeIcon"
                :badgeTitle="action?.badgeTitle"
                @click="handleActionClick(action.id)"
              />

              <LxDropDownMenu
                v-if="action?.groupId === groupId && action.nestedGroupId"
                :disabled="action?.disabled || props.disabled || props.loading"
              >
                <LxButton
                  v-if="action?.groupId === groupId && action.nestedGroupId"
                  :id="`${id}-action-${action.id}`"
                  :label="action?.name || action?.label"
                  :title="action?.title || action?.tooltip"
                  :icon="action?.icon || 'menu'"
                  :icon-set="action?.iconSet"
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

                <template #panel>
                  <template v-for="button in leftActions" :key="button.id">
                    <LxButton
                      v-if="action?.nestedGroupId === button.groupId"
                      :id="`${id}-action-${button.id}`"
                      :label="button?.name || button?.label"
                      :title="button?.title || button?.tooltip"
                      :icon="button?.icon"
                      :icon-set="button?.iconSet"
                      :kind="button?.kind || 'ghost'"
                      :loading="button?.loading"
                      :busy="button?.busy"
                      :destructive="button?.destructive"
                      :disabled="button?.disabled || props.disabled || props.loading"
                      :active="button?.active"
                      :badge="button?.badge"
                      :badgeType="button?.badgeType"
                      :badgeIcon="button?.badgeIcon"
                      :badgeTitle="button?.badgeTitle"
                      @click="handleActionClick(button.id)"
                    />
                  </template>
                </template>
              </LxDropDownMenu>
            </template>
          </LxToolbarGroup>
        </template>

        <LxToolbarGroup
          class="action-definitions-small"
          v-if="width < 801 && leftActions?.length > 0"
        >
          <template v-if="leftActionsNonResponsive?.length > 0">
            <LxButton
              v-for="item in leftActionsNonResponsive"
              v-show="!item?.nestedGroupId"
              :key="item.id"
              :id="`${id}-action-${item.id}`"
              :label="item?.name || item?.label"
              :title="item?.title || item?.tooltip"
              :icon="item?.icon"
              :icon-set="item?.iconSet"
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
              @click="handleActionClick(item.id)"
            />
          </template>

          <LxDropDownMenu
            v-if="leftActionsResponsive?.length > 1"
            :disabled="props.disabled || props.loading"
          >
            <LxButton
              kind="ghost"
              :tabindex="-1"
              icon="menu"
              :label="displayTexts.overflowMenu"
              variant="icon-only"
              :disabled="props.disabled || props.loading"
            />

            <template #panel>
              <template v-for="button in leftActionsResponsive" :key="button.id">
                <LxButton
                  v-if="!button?.nestedGroupId"
                  :id="`${id}-action-${button.id}`"
                  :label="button?.name || button?.label"
                  :title="button?.title || button?.tooltip"
                  :icon="button?.icon"
                  :icon-set="button?.iconSet"
                  :kind="button?.kind || 'ghost'"
                  :loading="button?.loading"
                  :busy="button?.busy"
                  :destructive="button?.destructive"
                  :disabled="button?.disabled || props.disabled || props.loading"
                  :active="button?.active"
                  :badge="button?.badge"
                  :badgeType="button?.badgeType"
                  :badgeIcon="button?.badgeIcon"
                  :badgeTitle="button?.badgeTitle"
                  @click="handleActionClick(button.id)"
                />
              </template>
            </template>
          </LxDropDownMenu>

          <LxButton
            v-else-if="
              leftActionsResponsive?.length === 1 && !leftActionsResponsive?.[0]?.nestedGroupId
            "
            :id="`${id}-action-${leftActionsResponsive?.[0].id}`"
            :label="leftActionsResponsive?.[0]?.name || leftActionsResponsive?.[0]?.label"
            :title="leftActionsResponsive?.[0]?.title || leftActionsResponsive?.[0]?.tooltip"
            :icon="leftActionsResponsive?.[0]?.icon"
            :icon-set="leftActionsResponsive?.[0]?.iconSet"
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
            @click="handleActionClick(leftActionsResponsive?.[0].id)"
          />
        </LxToolbarGroup>

        <LxToolbarGroup v-if="$slots.leftArea">
          <slot name="leftArea" />
        </LxToolbarGroup>
      </div>

      <div class="right-area">
        <LxToolbarGroup v-if="$slots.default">
          <slot />
        </LxToolbarGroup>

        <LxToolbarGroup v-if="$slots.rightArea">
          <slot name="rightArea" />
        </LxToolbarGroup>

        <template v-if="width > 800">
          <LxToolbarGroup
            v-for="groupId in rightGroupIds"
            :key="groupId"
            class="action-definitions-group"
          >
            <template v-for="action in rightActions" :key="action.id">
              <LxButton
                v-if="isActionVisibleInGroup(action, groupId, 'right')"
                :id="`${id}-action-${action.id}`"
                :label="action?.name || action?.label"
                :title="action?.title || action?.tooltip"
                :icon="action?.icon"
                :icon-set="action?.iconSet"
                :kind="action?.kind || 'ghost'"
                :loading="action?.loading"
                :busy="action?.busy"
                :destructive="action?.destructive"
                :disabled="action?.disabled || props.disabled || props.loading"
                :active="action?.active"
                :variant="
                  action?.variant ? action.variant : action?.label ? 'default' : 'icon-only'
                "
                :custom-class="action?.customClass"
                :badge="action?.badge"
                :badgeType="action?.badgeType"
                :badgeIcon="action?.badgeIcon"
                :badgeTitle="action?.badgeTitle"
                @click="handleActionClick(action.id)"
              />

              <LxDropDownMenu
                v-if="action?.groupId === groupId && action.nestedGroupId"
                :disabled="action?.disabled || props.disabled || props.loading"
              >
                <LxButton
                  v-if="action?.groupId === groupId && action.nestedGroupId"
                  :id="`${id}-action-${action.id}`"
                  :label="action?.name || action?.label"
                  :title="action?.title || action?.tooltip"
                  :icon="action?.icon || 'menu'"
                  :icon-set="action?.iconSet"
                  :kind="action?.kind || 'ghost'"
                  :tabindex="-1"
                  :loading="action?.loading"
                  :busy="action?.busy"
                  :destructive="action?.destructive"
                  :disabled="action?.disabled || props.disabled || props.loading"
                  :active="action?.active"
                  variant="icon-only"
                  :badge="action?.badge"
                  :badgeType="action?.badgeType"
                  :badgeIcon="action?.badgeIcon"
                  :badgeTitle="action?.badgeTitle"
                />

                <template #panel>
                  <template v-for="button in rightActions" :key="button.id">
                    <LxButton
                      v-if="action?.nestedGroupId === button.groupId"
                      :id="`${id}-action-${button.id}`"
                      :label="button?.name || button?.label"
                      :title="button?.title || button?.tooltip"
                      :icon="button?.icon"
                      :icon-set="button?.iconSet"
                      :kind="button?.kind || 'ghost'"
                      :loading="button?.loading"
                      :busy="button?.busy"
                      :destructive="button?.destructive"
                      :disabled="button?.disabled || props.disabled || props.loading"
                      :active="button?.active"
                      :badge="button?.badge"
                      :badgeType="button?.badgeType"
                      :badgeIcon="button?.badgeIcon"
                      :badgeTitle="button?.badgeTitle"
                      @click="handleActionClick(button.id)"
                    />
                  </template>
                </template>
              </LxDropDownMenu>
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
          <LxDropDownMenu
            v-if="rightActionsResponsive?.length > 1"
            :disabled="props.disabled || props.loading"
          >
            <LxButton
              kind="ghost"
              :tabindex="-1"
              icon="menu"
              :label="displayTexts.overflowMenu"
              variant="icon-only"
              :disabled="props.disabled || props.loading"
            />

            <template #panel>
              <template v-for="button in rightActionsResponsive" :key="button.id">
                <LxButton
                  v-if="!button?.nestedGroupId"
                  :id="`${id}-action-${button.id}`"
                  :label="button?.name || button?.label"
                  :title="button?.title || button?.tooltip"
                  :icon="button?.icon"
                  :icon-set="button?.iconSet"
                  :kind="button?.kind || 'ghost'"
                  :loading="button?.loading"
                  :busy="button?.busy"
                  :destructive="button?.destructive"
                  :disabled="button?.disabled || props.disabled || props.loading"
                  :active="button?.active"
                  :badge="button?.badge"
                  :badgeType="button?.badgeType"
                  :badgeIcon="button?.badgeIcon"
                  :badgeTitle="button?.badgeTitle"
                  @click="handleActionClick(button.id)"
                />
              </template>
            </template>
          </LxDropDownMenu>

          <template
            v-if="
              (rightActionsResponsive?.length === 1 && !rightActions?.[0]?.nestedGroupId) ||
              rightActionsNonResponsive?.length > 0
            "
          >
            <LxButton
              v-for="item in rightActionsNonResponsive"
              v-show="!item?.nestedGroupId && item?.nonResponsive"
              :key="item.id"
              :id="`${id}-action-${item.id}`"
              :label="item?.name || item?.label"
              :title="item?.title || item?.tooltip"
              :icon="item?.icon"
              :icon-set="item?.iconSet"
              variant="icon-only"
              :kind="item?.kind || 'ghost'"
              :loading="item?.loading"
              :busy="item?.busy"
              :destructive="item?.destructive"
              :disabled="item?.disabled || props.disabled || props.loading"
              :active="item?.active"
              :badge="item?.badge"
              :badge-type="item?.badgeType"
              :badgeIcon="item?.badgeIcon"
              :badgeTitle="item?.badgeTitle"
              :custom-class="item?.customClass"
              @click="handleActionClick(item.id)"
            />
          </template>

          <LxButton
            v-if="
              rightActionsResponsive?.length === 1 && !rightActionsResponsive?.[0]?.nestedGroupId
            "
            :key="rightActionsResponsive?.[0]?.id"
            :id="`${id}-action-${rightActionsResponsive?.[0]?.id}`"
            :label="rightActionsResponsive?.[0]?.name || rightActionsResponsive?.[0]?.label"
            :title="rightActionsResponsive?.[0]?.title || rightActionsResponsive?.[0]?.tooltip"
            :icon="rightActionsResponsive?.[0]?.icon"
            :icon-set="rightActionsResponsive?.[0]?.iconSet"
            variant="icon-only"
            :kind="rightActionsResponsive?.[0]?.kind || 'ghost'"
            :loading="rightActionsResponsive?.[0]?.loading"
            :busy="rightActionsResponsive?.[0]?.busy"
            :destructive="rightActionsResponsive?.[0]?.destructive"
            :disabled="rightActionsResponsive?.[0]?.disabled || props.disabled || props.loading"
            :active="rightActionsResponsive?.[0]?.active"
            :badge="rightActionsResponsive?.[0]?.badge"
            :badge-type="rightActionsResponsive?.[0]?.badgeType"
            :badgeIcon="rightActionsResponsive?.[0]?.badgeIcon"
            :badgeTitle="rightActionsResponsive?.[0]?.badgeTitle"
            :custom-class="rightActionsResponsive?.[0]?.customClass"
            @click="handleActionClick(rightActionsResponsive?.[0]?.id)"
          />
        </LxToolbarGroup>
      </div>
    </div>

    <slot name="secondRow" />
  </div>
</template>
