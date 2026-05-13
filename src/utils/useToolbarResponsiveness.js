import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';

/**
 * Composable for managing toolbar responsive layout behavior.
 * @param {Object} options - Configuration options.
 * @param {Object} options.toolbarRef - Toolbar root element ref.
 * @param {Object} options.leftAreaSlotRef - Left area slot ref.
 * @param {Object} options.defaultAreaSlotRef - Default area slot ref.
 * @param {Object} options.rightAreaSlotRef - Right area slot ref.
 * @param {Object} options.defaultAreaComputed - Computed reference for default area.
 * @param {Object} options.actionsProcessed - Computed reference for processed actions.
 * @param {Object} options.leftActionsAll - Computed reference for all left actions.
 * @param {Object} options.rightActionsAll - Computed reference for all right actions.
 * @param {Object} options.actionsByGroupId - Computed reference for actions by group.
 * @param {Object} options.hasDefaultSlotContent - Computed reference for default slot content.
 * @param {Object} options.hasLeftAreaSlotContent - Computed reference for left area slot content.
 * @param {Object} options.hasRightAreaSlotContent - Computed reference for right area slot content.
 * @param {Object} options.hasSearch - Computed reference for hasSearch.
 * @param {Object} options.searchMode - Computed reference for searchMode.
 * @param {Object} options.hasSelectAll - Computed reference for hasSelectAll.
 * @param {Function} options.getActionId - Function to get action ID.
 * @param {Function} options.isActionDropDown - Function to check if action is dropdown.
 * @returns {Object} Responsive state and refs.
 */
export function useToolbarResponsiveness({
  toolbarRef,
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
  hasSearch,
  searchMode,
  hasSelectAll,
  getActionId,
  isActionDropDown,
}) {
  // Width constants - must be synced with CSS
  const BUTTON_WIDTH = 48; // 48px = 6rem
  const TOGGLE_WIDTH = 64; // 64px = 8rem
  const OVERFLOW_BUTTON_WIDTH = BUTTON_WIDTH;
  const PROMOTED_BUTTON_WIDTH = BUTTON_WIDTH;
  const SEARCH_COMPACT_WIDTH = BUTTON_WIDTH;
  const SELECTION_BUTTON_WIDTH = BUTTON_WIDTH;

  const rightActionsVisible = ref([]);
  const leftActionsVisible = ref([]);
  const actionsOverflow = ref([]);
  const promotedActionVariant = ref('default');
  const forceCompactSearchByWidth = ref(false);

  let resizeObserver = null;
  let frame = null;

  function toActionGroups(actions = []) {
    const nestedGroupIds = new Set(actions?.map((a) => a.nestedGroupId).filter(Boolean));
    const groupMap = new Map();

    actions.forEach((action) => {
      if (nestedGroupIds.has(action.groupId)) {
        return;
      }

      if (!groupMap.has(action.groupId)) {
        groupMap.set(action.groupId, []);
      }

      groupMap.get(action.groupId).push(action);
    });

    return Array.from(groupMap.entries()).map(([groupId, actionsInGroup]) => ({
      groupId,
      actions: actionsInGroup,
    }));
  }

  const flattenActionGroups = (groups = []) => groups.flatMap((group) => group?.actions ?? []);

  const createActionGroups = (actionsRef) => computed(() => toActionGroups(actionsRef.value ?? []));
  const createFlatActions = (groupsRef) => computed(() => flattenActionGroups(groupsRef.value));

  const rightActionsTopLevelGrouped = createActionGroups(rightActionsAll);
  const rightActionsTopLevelFlat = createFlatActions(rightActionsTopLevelGrouped);

  const leftActionsTopLevelGrouped = createActionGroups(leftActionsAll);
  const leftActionsTopLevelFlat = createFlatActions(leftActionsTopLevelGrouped);

  const autoSearchMode = computed(() => {
    if (forceCompactSearchByWidth.value) {
      return 'compact';
    }

    if (
      (searchMode.value === 'default' && !hasSelectAll.value) ||
      searchMode.value === 'defaultForce'
    ) {
      return 'default';
    }

    return 'compact';
  });

  const promotedActionBase = computed(() => {
    const action = actionsProcessed.value?.find((x) => x?.promoted);

    if (!action) {
      return null;
    }

    return action;
  });

  const promotedAction = computed(() => {
    const action = promotedActionBase.value;

    if (!action) {
      return null;
    }

    return {
      ...action,
      variant: promotedActionVariant.value,
    };
  });

  function getClosestExceededParent(tolerance = 0) {
    const target = toolbarRef.value?.$el ?? toolbarRef.value;
    if (!(target instanceof HTMLElement)) {
      return null;
    }

    const targetRect = target.getBoundingClientRect();
    let parent = target.parentElement;

    while (parent) {
      const parentRect = parent.getBoundingClientRect();
      const exceedsHorizontally = targetRect.width > parentRect.width - tolerance;

      if (exceedsHorizontally) {
        return parent;
      }

      parent = parent.parentElement;
    }

    return null;
  }

  function hasInternalHorizontalOverflow(tolerance = 0) {
    const target = toolbarRef.value?.$el ?? toolbarRef.value;
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    // Detect overflow even when CSS clips content and parent boundaries are not exceeded.
    if (target.scrollWidth - target.clientWidth > tolerance) {
      return true;
    }

    const targetRect = target.getBoundingClientRect();

    return Array.from(target.children).some((child) => {
      if (!(child instanceof HTMLElement)) {
        return false;
      }

      const childRect = child.getBoundingClientRect();

      return childRect.width > targetRect.width - tolerance;
    });
  }

  function hasHorizontalOverflowPressure(tolerance = 0) {
    return Boolean(getClosestExceededParent(tolerance)) || hasInternalHorizontalOverflow(tolerance);
  }

  function getToolbarMaxWidth() {
    const target = toolbarRef.value?.$el ?? toolbarRef.value;
    if (!(target instanceof HTMLElement)) {
      return 0;
    }

    const exceededParent = getClosestExceededParent();
    const exceededParentWidth = Math.floor(exceededParent?.getBoundingClientRect?.()?.width ?? 0);
    const toolbarWidth = Math.floor(target?.getBoundingClientRect?.()?.width ?? 0);

    if (exceededParentWidth > 0) {
      return Math.min(exceededParentWidth, toolbarWidth);
    }

    return Math.max(0, toolbarWidth);
  }

  // Action priority configuration: Tiers define importance classes, Types define sub-categories.
  // Position in array = priority (lower index = stays visible longer).
  const ACTION_IMPORTANCE_TIERS = [
    { name: 'built-in', test: (action) => action?.builtIn === true },
    { name: 'regular', test: () => true }, // fallback - always matches
  ];
  const ACTION_TYPE_PRIORITY = [
    { name: 'dropdown', test: (action) => action?.nestedGroupId },
    { name: 'toggle', test: (action) => action?.kind === 'toggle' },
    { name: 'regular', test: () => true }, // fallback - always matches
  ];

  // Find which category index an action belongs to (with fallback to last entry).
  function findCategoryIndex(categories, action) {
    const index = categories.findIndex((cat) => cat.test(action));
    return index >= 0 ? index : categories.length - 1;
  }

  function normalizePriority(action) {
    const value = Number(action?.priority);

    // Explicit positive priorities: lower value = stronger, stays visible longer.
    // Mapped below fallback priorities so they override everything.
    if (Number.isFinite(value) && value > 0) {
      // Base for explicit user priorities. Ensures they always beat fallback priorities.
      const EXPLICIT_PRIORITY_OFFSET = -2000;

      return value + EXPLICIT_PRIORITY_OFFSET;
    }

    // Fallback priority when explicit priority is missing or invalid.
    // Combines tier and type indices into a single negative value.
    // Lower value = higher priority (stays visible longer).
    const tierIdx = findCategoryIndex(ACTION_IMPORTANCE_TIERS, action);
    const typeIdx = findCategoryIndex(ACTION_TYPE_PRIORITY, action);
    const tierCount = ACTION_IMPORTANCE_TIERS.length;
    const typeCount = ACTION_TYPE_PRIORITY.length;

    // Distribute priorities across tiers:
    // Each tier gets typeCount slots, most important tier uses lowest (most negative) values.
    return -((tierCount - tierIdx) * typeCount - typeIdx);
  }

  function getActionWidth(action) {
    if (!action) {
      return 0;
    }

    if (action.kind === 'toggle') {
      return TOGGLE_WIDTH;
    }

    if (action.kind === 'slot') {
      const slotElement = document.getElementById(getActionId(action.id));

      return Math.ceil(slotElement?.getBoundingClientRect?.()?.width ?? 0);
    }

    return BUTTON_WIDTH;
  }

  function getReservedPromotedActionWidth() {
    return promotedActionBase.value ? PROMOTED_BUTTON_WIDTH : 0;
  }

  function getReservedNonResponsiveActionsWidth() {
    const reservedWidth = [
      ...leftActionsTopLevelFlat.value,
      ...rightActionsTopLevelFlat.value,
    ].reduce(
      (acc, action) => {
        if (action?.kind === 'slot') {
          acc.slotWidth += getActionWidth(action);
          return acc;
        }

        if (action?.nonResponsive) {
          acc.nonResponsiveCount += 1;
        } else {
          acc.responsiveCount += 1;
        }

        return acc;
      },
      { slotWidth: 0, responsiveCount: 0, nonResponsiveCount: 0 }
    );

    if (reservedWidth.responsiveCount < 2) {
      return reservedWidth.slotWidth;
    }

    return reservedWidth.slotWidth + reservedWidth.nonResponsiveCount * BUTTON_WIDTH;
  }

  function getReservedSearchWidth() {
    return hasSearch.value ? SEARCH_COMPACT_WIDTH : 0;
  }

  function getReservedSelectionWidth() {
    return hasSelectAll.value ? SELECTION_BUTTON_WIDTH : 0;
  }

  function getReservedBuiltInSlotWidth() {
    const slotsElements = [
      {
        hasContent: hasDefaultSlotContent.value,
        element: defaultAreaSlotRef.value?.$el ?? defaultAreaSlotRef.value,
      },
      {
        hasContent: hasLeftAreaSlotContent.value,
        element: leftAreaSlotRef.value?.$el ?? leftAreaSlotRef.value,
      },
      {
        hasContent: hasRightAreaSlotContent.value,
        element: rightAreaSlotRef.value?.$el ?? rightAreaSlotRef.value,
      },
    ];

    return slotsElements.reduce((total, { hasContent, element }) => {
      if (!hasContent || !(element instanceof HTMLElement)) {
        return total;
      }

      return total + Math.ceil(element.getBoundingClientRect().width);
    }, 0);
  }

  function getAvailableWidthForActions(maxWidthOverride) {
    const maxWidth = maxWidthOverride ?? getToolbarMaxWidth();
    const promotedWidth = getReservedPromotedActionWidth();
    const nonResponsiveWidth = getReservedNonResponsiveActionsWidth();
    const searchWidth = getReservedSearchWidth();
    const selectionWidth = getReservedSelectionWidth();
    const builtInSlotWidth = getReservedBuiltInSlotWidth();

    return Math.max(
      0,
      maxWidth -
        promotedWidth -
        nonResponsiveWidth -
        searchWidth -
        selectionWidth -
        builtInSlotWidth
    );
  }

  function toActionDescriptors(actions, area) {
    return actions.map((action, index) => ({
      action,
      index,
      area,
    }));
  }

  function compareActionsForVisibility(a, b) {
    const priorityDiff = normalizePriority(a.action) - normalizePriority(b.action);

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    const defaultArea = defaultAreaComputed.value;
    const defaultAreaDiff = (b.area === defaultArea ? 1 : 0) - (a.area === defaultArea ? 1 : 0);

    if (defaultAreaDiff !== 0) {
      return defaultAreaDiff;
    }

    if (a.area !== b.area) {
      return a.area === 'left' ? -1 : 1;
    }

    // Left: keep from start (hide from end) → ascending index
    // Right: keep from end (hide from beginning) → descending index
    return a.area === 'left' ? a.index - b.index : b.index - a.index;
  }

  function collectVisibleActionIds(actions, availableWidthForActions) {
    const state = actions.reduce(
      (acc, item) => {
        if (item.action?.nonResponsive) {
          return acc;
        }

        const actionWidth = getActionWidth(item.action);

        if (acc.usedWidth + actionWidth > availableWidthForActions) {
          return acc;
        }

        acc.usedWidth += actionWidth;
        acc.ids.add(item.action.id);

        return acc;
      },
      { usedWidth: 0, ids: new Set() }
    );

    return state.ids;
  }

  function splitByVisibility(actions, visibleIds) {
    return actions.reduce(
      (acc, action) => {
        if (visibleIds.has(action.id) || action?.nonResponsive) {
          acc.visible.push(action);
        } else {
          acc.overflow.push(action);
        }

        return acc;
      },
      { visible: [], overflow: [] }
    );
  }

  function partitionOverflow(overflow) {
    return overflow.reduce(
      (acc, action) => {
        if (isActionDropDown(action)) {
          const children = actionsByGroupId.value.get(action.nestedGroupId) ?? [];

          if (defaultAreaComputed.value === 'right') {
            acc.nested.unshift(...children);
          } else {
            acc.nested.push(...children);
          }
        } else {
          acc.regular.push(action);
        }

        return acc;
      },
      { nested: [], regular: [] }
    );
  }

  async function applyOverflowLayout() {
    const passMax = 2; // Number of measurement and adjustment passes to ensure stable layout

    const runLayoutPass = async (passCurrent) => {
      const target = toolbarRef.value?.$el ?? toolbarRef.value;

      const renderedToolbarWidth = Math.floor(target?.getBoundingClientRect?.()?.width ?? 0);
      const maxWidthOverride = passCurrent > 1 ? renderedToolbarWidth : undefined;

      const allActions = [
        ...toActionDescriptors(leftActionsTopLevelFlat.value, 'left'),
        ...toActionDescriptors(rightActionsTopLevelFlat.value, 'right'),
      ];
      const sortedActions = [...allActions].sort(compareActionsForVisibility);

      const evaluateVisibility = ({ reserveOverflowButton = false } = {}) => {
        const baseWidth = getAvailableWidthForActions(maxWidthOverride);
        const availableWidthForActions = reserveOverflowButton
          ? baseWidth - OVERFLOW_BUTTON_WIDTH
          : baseWidth;

        const visibleIds = collectVisibleActionIds(sortedActions, availableWidthForActions);
        const hiddenCount = sortedActions.filter(
          (item) => !item.action?.nonResponsive && !visibleIds.has(item.action.id)
        ).length;

        return { visibleIds, hiddenCount };
      };

      const initialVisibility = evaluateVisibility();
      const { visibleIds } =
        initialVisibility.hiddenCount > 0
          ? evaluateVisibility({ reserveOverflowButton: true })
          : initialVisibility;

      const left = splitByVisibility(leftActionsTopLevelFlat.value, visibleIds);
      const right = splitByVisibility(rightActionsTopLevelFlat.value, visibleIds);

      leftActionsVisible.value = toActionGroups(left.visible);
      rightActionsVisible.value = toActionGroups(right.visible);

      const leftOverflow = partitionOverflow(left.overflow);
      const rightOverflow = partitionOverflow(right.overflow);

      rightOverflow.regular.reverse();

      const [first, second] =
        defaultAreaComputed.value === 'right'
          ? [rightOverflow, leftOverflow]
          : [leftOverflow, rightOverflow];

      actionsOverflow.value = [
        ...first.nested,
        ...second.nested,
        ...first.regular,
        ...second.regular,
      ];

      if (passCurrent >= passMax) {
        return;
      }

      await nextTick();
      await runLayoutPass(passCurrent + 1);
    };

    await runLayoutPass(1);
  }

  function resetLayout() {
    rightActionsVisible.value = rightActionsTopLevelGrouped.value;
    leftActionsVisible.value = leftActionsTopLevelGrouped.value;
    actionsOverflow.value = [];
    forceCompactSearchByWidth.value = false;
    promotedActionVariant.value = 'default';
  }

  function recalculateLayout() {
    if (frame) {
      cancelAnimationFrame(frame);
    }

    frame = requestAnimationFrame(async () => {
      if (!toolbarRef.value) {
        return;
      }

      resetLayout();
      await nextTick();

      if (!hasHorizontalOverflowPressure()) {
        return;
      }

      if (hasSearch.value && autoSearchMode.value === 'default') {
        forceCompactSearchByWidth.value = true;
        await nextTick();

        if (!hasHorizontalOverflowPressure()) {
          return;
        }
      }

      if (promotedActionBase.value) {
        promotedActionVariant.value = 'icon-only';
        await nextTick();

        if (!hasHorizontalOverflowPressure()) {
          return;
        }
      }

      await applyOverflowLayout();
    });
  }

  watch(
    [
      actionsProcessed,
      hasSearch,
      searchMode,
      hasSelectAll,
      hasDefaultSlotContent,
      hasLeftAreaSlotContent,
      hasRightAreaSlotContent,
      defaultAreaComputed,
    ],
    () => {
      recalculateLayout();
    },
    { flush: 'post' }
  );

  onMounted(() => {
    const toolbar = toolbarRef.value?.$el ?? toolbarRef.value;

    if (!(toolbar instanceof HTMLElement)) {
      return;
    }

    resizeObserver = new ResizeObserver(recalculateLayout);
    resizeObserver.observe(toolbar);

    globalThis.addEventListener('resize', recalculateLayout);

    recalculateLayout();
  });

  onBeforeUnmount(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }

    globalThis.removeEventListener('resize', recalculateLayout);

    if (frame) {
      cancelAnimationFrame(frame);
      frame = null;
    }
  });

  return {
    rightActionsVisible,
    leftActionsVisible,
    actionsOverflow,
    promotedAction,
    autoSearchMode,
  };
}
