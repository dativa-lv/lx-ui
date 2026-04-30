import { ref, nextTick } from 'vue';

export function useGridKeyboardNavigation() {
  const activeRow = ref(0);
  const activeCol = ref(0);
  const activeItem = ref(0);

  const cellRefs = ref([]);

  function registerCell(el, row, col, item = 0) {
    if (!el) return;

    let target = null;

    if (el instanceof HTMLElement || typeof el.focus === 'function') {
      target = el;
    } else if (el.focusEl?.value instanceof HTMLElement) {
      target = el.focusEl.value;
    }

    if (target) {
      cellRefs.value[row] ??= {};
      cellRefs.value[row][col] ??= [];
      cellRefs.value[row][col][item] = target;
    }
  }

  function isActiveCell(row, col, item = 0) {
    return activeRow.value === row && activeCol.value === col && activeItem.value === item;
  }

  function isDisabledCell(target) {
    if (!target) return true;

    if (target.disabled || target.getAttribute?.('aria-disabled') === 'true') {
      return true;
    }

    return [
      'lx-disabled-date',
      'lx-disabled-month',
      'lx-disabled-year',
      'lx-disabled-quarter',
      'is-disabled',
    ].some((className) => target.classList?.contains(className));
  }

  function getCellTargets(row, col) {
    const targets = cellRefs.value[row]?.[col];

    if (!targets) return [];
    if (Array.isArray(targets)) {
      return targets
        .map((target, item) => ({ target, item }))
        .filter((entry) => Boolean(entry.target));
    }

    return [{ target: targets, item: 0 }];
  }

  function findClosestFocusableCell(row, col) {
    return Object.entries(cellRefs.value)
      .reduce((matches, [rowKey, rowCells]) => {
        const currentRow = Number(rowKey);

        return matches.concat(
          Object.entries(rowCells || {})
            .flatMap(([colKey, targets]) => {
              const currentCol = Number(colKey);

              const normalizedTargets = Array.isArray(targets)
                ? targets.map((target, item) => ({ target, item }))
                : [{ target: targets, item: 0 }];

              return normalizedTargets
                .map(({ target, item }) => {
                  if (isDisabledCell(target)) return null;

                  const rowDistance = Math.abs(currentRow - row);
                  const colDistance = Math.abs(currentCol - col);

                  return {
                    row: currentRow,
                    col: currentCol,
                    item,
                    target,
                    distance: rowDistance + colDistance,
                    rowDistance,
                    colDistance,
                  };
                })
                .filter(Boolean);
            })
            .filter(Boolean)
        );
      }, [])
      .reduce((bestMatch, candidate) => {
        if (!bestMatch) return candidate;

        if (candidate.distance < bestMatch.distance) return candidate;
        if (candidate.distance > bestMatch.distance) return bestMatch;

        if (candidate.rowDistance < bestMatch.rowDistance) return candidate;
        if (candidate.rowDistance > bestMatch.rowDistance) return bestMatch;

        if (candidate.colDistance < bestMatch.colDistance) return candidate;

        return bestMatch;
      }, null);
  }

  function focusCell(row, col, scroll = true, preferredItem = 0) {
    const targets = getCellTargets(row, col);
    const preferredTarget = targets.find(
      ({ item, target }) => item === preferredItem && !isDisabledCell(target)
    );
    const fallbackTarget = targets.find(({ target }) => !isDisabledCell(target));

    let resolvedCell;
    if (preferredTarget) {
      resolvedCell = { row, col, item: preferredTarget.item, target: preferredTarget.target };
    } else if (fallbackTarget) {
      resolvedCell = { row, col, item: fallbackTarget.item, target: fallbackTarget.target };
    } else {
      resolvedCell = findClosestFocusableCell(row, col);
    }

    if (!resolvedCell?.target) return null;

    activeRow.value = resolvedCell.row;
    activeCol.value = resolvedCell.col;
    activeItem.value = resolvedCell.item ?? 0;

    nextTick(() => {
      resolvedCell.target.focus({ preventScroll: !scroll });
      if (scroll) {
        resolvedCell.target.scrollIntoView({
          behavior: 'instant',
          block: 'nearest',
          inline: 'nearest',
        });
      }
    });

    return resolvedCell;
  }

  function onGridFocus() {
    return focusCell(activeRow.value, activeCol.value, true, activeItem.value);
  }

  function onKeydown(e, rowCount, colCount, isMenuOpen = false) {
    if (e.key === 'Tab') return;

    if (isMenuOpen) return;

    const isAtLastCell = activeRow.value === rowCount && activeCol.value === colCount;
    const isArrowRightKey = e.key === 'ArrowRight';

    if (isAtLastCell && isArrowRightKey) return;

    let { activeRow: r, activeCol: c } = {
      activeRow: activeRow.value,
      activeCol: activeCol.value,
    };

    switch (e.key) {
      case 'ArrowRight':
        if (getCellTargets(r, c).some(({ item }) => item === activeItem.value + 1)) {
          e.preventDefault();
          focusCell(r, c, true, activeItem.value + 1);
          return;
        }
        c += 1;
        break;
      case 'ArrowLeft':
        if (
          activeItem.value > 0 &&
          getCellTargets(r, c).some(({ item }) => item === activeItem.value - 1)
        ) {
          e.preventDefault();
          focusCell(r, c, true, activeItem.value - 1);
          return;
        }
        c -= 1;
        break;
      case 'ArrowDown':
        r += 1;
        break;
      case 'ArrowUp':
        r -= 1;
        break;
      default:
        return;
    }

    e.preventDefault();

    r = Math.max(0, Math.min(r, rowCount));
    c = Math.max(0, Math.min(c, colCount));

    focusCell(r, c, true, e.key === 'ArrowLeft' ? Number.MAX_SAFE_INTEGER : 0);
  }

  function setActiveFromClick(row, col, scroll = true, item = 0) {
    return focusCell(row, col, scroll, item);
  }

  function getTabIndex(row, col, item = 0) {
    return isActiveCell(row, col, item) ? 0 : -1;
  }

  function getFocusable(row, col, item = 0) {
    return !!isActiveCell(row, col, item);
  }

  function isCellDelegated(col, customVal = false) {
    return (
      col.type === 'rating' ||
      col.kind === 'clickable' ||
      (col.type === 'person' && customVal) ||
      (col.type === 'icon' && customVal) ||
      (col.type === 'array' && customVal)
    );
  }

  return {
    activeRow,
    activeCol,
    registerCell,
    getTabIndex,
    getFocusable,
    onKeydown,
    onGridFocus,
    setActiveFromClick,
    isCellDelegated,
  };
}
