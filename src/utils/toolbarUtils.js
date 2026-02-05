export function processToolbarActions({
  actions,
  loading = false,
  busy = false,
  hasSearch = false,
  searchMode = 'default',
  hasSelecting = false,
  selectionKind,
  defaultToolbarArea,
  searchField,
  displayTexts,
  selectAllSide = 'right',
}) {
  if (!actions.length) return [];

  const withDefaults = (action, overrides = {}) => ({
    ...action,
    icon: action.icon ?? 'fallback-icon',
    area: action.area ?? defaultToolbarArea.value,
    kind: action.kind ?? 'ghost',
    variant: action.variant ?? 'icon-only',
    groupId: action.groupId ?? 'lx-default',
    disabled: action.disabled || loading || busy,
    ...overrides,
  });

  const withKindAndVariant = (action, overrides = {}) => ({
    ...action,
    kind: 'ghost',
    variant: 'icon-only',
    ...overrides,
  });

  const normalizedActions = actions.map((a) => withDefaults(a));

  let promotedAction = null;
  let demotedActions = [];

  const processGroup = (group) => {
    if (!group.length) return;

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
  }

  // Add search button if needed
  if (hasSearch && displayTexts && searchField && (searchMode === 'compact' || hasSelecting)) {
    result.push({
      id: 'search',
      name: searchField.value ? displayTexts.value.closeSearch : displayTexts.value.openSearch,
      icon: searchField.value ? 'close' : 'search',
      area: 'right',
      variant: 'icon-only',
      kind: 'ghost',
      groupId: 'lx-default',
      disabled: loading || busy,
      customClass: searchField.value ? 'toolbar-search-button is-expanded' : '',
      nonResponsive: true,
    });
  }

  // Add select-all button for right side
  if (hasSelecting && selectionKind === 'multiple' && displayTexts && selectAllSide === 'right') {
    result.push({
      id: 'select-all',
      name: displayTexts.value.selectAllRows,
      icon: 'checkbox',
      area: 'right',
      variant: 'icon-only',
      kind: 'ghost',
      groupId: 'lx-select-all',
      disabled: loading || busy,
      nonResponsive: true,
    });
  }

  // Add select-all button for left side
  if (hasSelecting && selectionKind === 'multiple' && displayTexts && selectAllSide === 'left') {
    result.unshift({
      id: `select-all`,
      name: displayTexts.value.selectAllRows,
      icon: 'checkbox',
      area: 'left',
      variant: 'icon-only',
      kind: 'ghost',
      groupId: 'lx-select-all',
      disabled: loading || busy,
      nonResponsive: true,
    });
  }

  return result;
}
