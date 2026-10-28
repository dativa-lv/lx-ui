/**
 * Flattens the nested action structure (`nestedGroupId` / `groupId`) for components that cannot render submenus.
 * A trigger whose group has children is removed; its children inherit the trigger's
 * `visibleByAttribute`, `enableByAttribute` and `disabled` unless they define their own.
 * Arrays without nested triggers are returned unchanged.
 *
 * @param {Array<Object>} actions - Action definitions.
 * @param {Object} [options]
 * @param {boolean} [options.inheritKind=false] - Children also inherit the trigger's `kind`, for components that place actions by kind.
 * @returns {Array<Object>} Flattened action definitions.
 */
export function flattenNestedActions(actions, { inheritKind = false } = {}) {
  if (!Array.isArray(actions) || !actions.some((a) => a?.nestedGroupId)) return actions;

  const groupIds = new Set(actions.map((a) => a?.groupId).filter(Boolean));
  const triggers = new Map(
    actions
      .filter((a) => a?.nestedGroupId && groupIds.has(a.nestedGroupId))
      .map((a) => [a.nestedGroupId, a])
  );
  if (!triggers.size) return actions;

  const inherit = (action, seen = new Set()) => {
    const parent = triggers.get(action?.groupId);
    if (!parent || seen.has(parent)) return action;
    seen.add(parent);
    const resolvedParent = inherit(parent, seen);
    return {
      ...action,
      visibleByAttribute: action.visibleByAttribute ?? resolvedParent.visibleByAttribute,
      enableByAttribute: action.enableByAttribute ?? resolvedParent.enableByAttribute,
      disabled: action.disabled || resolvedParent.disabled,
      ...(inheritKind && { kind: action.kind ?? resolvedParent.kind }),
    };
  };

  return actions
    .filter((a) => !(a?.nestedGroupId && triggers.has(a.nestedGroupId)))
    .map((a) => inherit(a));
}

/**
 * Keeps only the first `max` actions with `kind: 'primary'` as primary; later ones are shown as secondary.
 * Arrays within the limit are returned unchanged.
 *
 * @param {Array<Object>} actions - Action definitions.
 * @param {number} [max=1] - Maximum number of primary actions.
 * @returns {Array<Object>} Action definitions with at most `max` primary actions.
 */
export function limitPrimaryActions(actions, max = 1) {
  if (!Array.isArray(actions)) return actions;
  if (actions.filter((a) => a?.kind === 'primary').length <= max) return actions;

  let primaryCount = 0;
  return actions.map((action) => {
    if (action?.kind !== 'primary') return action;
    primaryCount += 1;
    return primaryCount > max ? { ...action, kind: 'secondary' } : action;
  });
}

const GROUP_TRIGGER_FIELDS = [
  'name',
  'label',
  'title',
  'tooltip',
  'icon',
  'iconSet',
  'kind',
  'variant',
  'customClass',
  'badge',
  'badgeType',
  'badgeIcon',
  'badgeTitle',
  'disabled',
  'loading',
  'busy',
  'destructive',
  'visibleByAttribute',
  'enableByAttribute',
  'area',
  'priority',
];

/**
 * Applies action group definitions to action definitions. Without group definitions the actions are returned unchanged.
 * - Actions are ordered by the position of their group in `groupDefinitions`; actions without a known group go last.
 * - A group `area` is used for its actions that do not define their own.
 * - A group `kind` works the same as in `groupDefinitions` of LxDropDownMenu, for example `tags`.
 *   Button kinds (`primary`, `secondary`, ...) are also used by the nested group trigger.
 * - A group with `nested: true` and at least one action becomes a nested group trigger (`nestedGroupId`),
 *   shown as a dropdown in LxToolbar and flattened in components without submenus.
 *   A group can be placed inside another group with `groupId`.
 *
 * @param {Array<Object>} actions - Action definitions.
 * @param {Array<Object>} [groupDefinitions] - Action group definitions: `{ id, name, groupId, nested, area, icon, kind, ... }`.
 * @returns {Array<Object>} Action definitions to render.
 */
export function resolveActionGroups(actions, groupDefinitions) {
  if (!Array.isArray(actions) || !Array.isArray(groupDefinitions) || !groupDefinitions.length) {
    return actions;
  }

  const groups = new Map(groupDefinitions.filter((g) => g?.id != null).map((g) => [g.id, g]));
  const usedGroupIds = new Set(actions.map((a) => a?.groupId).filter((id) => id != null));

  const withChildren = (group, seen = new Set()) => {
    if (usedGroupIds.has(group.id)) return true;
    if (seen.has(group.id)) return false;
    seen.add(group.id);
    return groupDefinitions.some(
      (g) => g?.nested && g.groupId === group.id && withChildren(g, seen)
    );
  };

  const triggers = groupDefinitions
    .filter((g) => g?.nested && g.id != null && withChildren(g))
    .filter((g) => !actions.some((a) => a?.nestedGroupId === g.id))
    .map((g) => {
      const trigger = { id: g.id, nestedGroupId: g.id };
      if (g.groupId != null) trigger.groupId = g.groupId;
      GROUP_TRIGGER_FIELDS.forEach((key) => {
        if (g[key] !== undefined) trigger[key] = g[key];
      });
      // 'tags' is the kind of the group, not of its trigger button
      if (trigger.kind === 'tags') delete trigger.kind;
      return trigger;
    });

  const areaOf = (groupId, seen = new Set()) => {
    const group = groups.get(groupId);
    if (!group || seen.has(groupId)) return undefined;
    seen.add(groupId);
    return group.area ?? areaOf(group.groupId, seen);
  };

  const order = new Map(groupDefinitions.map((g, i) => [g?.id, i]));
  const rank = (action) => (order.has(action?.groupId) ? order.get(action.groupId) : Infinity);

  return [...actions, ...triggers]
    .map((action, index) => {
      const area = action?.area === undefined ? areaOf(action?.groupId) : undefined;
      return { action: area === undefined ? action : { ...action, area }, index };
    })
    .sort((a, b) => rank(a.action) - rank(b.action) || a.index - b.index)
    .map(({ action }) => action);
}
