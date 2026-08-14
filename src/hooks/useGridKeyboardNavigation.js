import { ref, nextTick } from 'vue';

const SCROLL_INTO_VIEW_OPTIONS = { behavior: 'instant', block: 'nearest', inline: 'nearest' };

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

function createFocusableCandidate(currentRow, currentCol, row, col, target, item) {
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
}

function pickBestFocusableCandidate(bestMatch, candidate) {
  if (!bestMatch) return candidate;

  if (candidate.distance < bestMatch.distance) return candidate;
  if (candidate.distance > bestMatch.distance) return bestMatch;

  if (candidate.rowDistance < bestMatch.rowDistance) return candidate;
  if (candidate.rowDistance > bestMatch.rowDistance) return bestMatch;

  if (candidate.colDistance < bestMatch.colDistance) return candidate;

  return bestMatch;
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

export function useGridKeyboardNavigation({ getScrollMarginTop } = {}) {
  const activeRow = ref(0);
  const activeCol = ref(0);
  const activeItem = ref(0);

  const cellRefs = ref([]);

  function registerCell(el, row, col, item = 0) {
    if (!el) return;

    let target = null;

    const exposedElement = typeof el.getElement === 'function' ? el.getElement() : null;

    if (el instanceof HTMLElement) {
      target = el;
    } else if (exposedElement instanceof HTMLElement) {
      target = exposedElement;
    } else if (el.focusEl?.value instanceof HTMLElement) {
      target = el.focusEl.value;
    } else if (typeof el.focus === 'function') {
      target = el;
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

  function isMountedTarget(target) {
    return !(target instanceof HTMLElement) || target.isConnected;
  }

  function getFocusableCellTargets(row, col) {
    const targets = getCellTargets(row, col).filter(({ target }) => !isDisabledCell(target));
    const mounted = targets.filter(({ target }) => isMountedTarget(target));

    return mounted.length > 0 ? mounted : targets;
  }

  function collectCellFocusableCandidates(currentRow, currentCol, row, col) {
    return getCellTargets(currentRow, currentCol)
      .map(({ target, item }) =>
        createFocusableCandidate(currentRow, currentCol, row, col, target, item)
      )
      .filter(Boolean);
  }

  function collectRowFocusableCandidates(currentRow, rowCells, row, col) {
    return Object.keys(rowCells || {}).flatMap((colKey) =>
      collectCellFocusableCandidates(currentRow, Number(colKey), row, col)
    );
  }

  function collectFocusableCandidates(row, col) {
    return Object.entries(cellRefs.value).flatMap(([rowKey, rowCells]) =>
      collectRowFocusableCandidates(Number(rowKey), rowCells, row, col)
    );
  }

  function findClosestFocusableCell(row, col) {
    return collectFocusableCandidates(row, col).reduce(
      (bestMatch, candidate) => pickBestFocusableCandidate(bestMatch, candidate),
      null
    );
  }

  function resolveCellTarget(row, col, preferredItem) {
    const targets = getFocusableCellTargets(row, col);
    if (targets.length === 0) return null;

    const preferredTarget = targets.find(({ item }) => item === preferredItem);
    if (preferredTarget) {
      return { row, col, item: preferredTarget.item, target: preferredTarget.target };
    }

    const closestTarget = targets.reduce((best, candidate) =>
      Math.abs(candidate.item - preferredItem) < Math.abs(best.item - preferredItem)
        ? candidate
        : best
    );

    return { row, col, item: closestTarget.item, target: closestTarget.target };
  }

  function getStickyOverlap(target) {
    if (typeof getScrollMarginTop !== 'function' || !(target instanceof HTMLElement)) return 0;

    return getScrollMarginTop(target) || 0;
  }

  function scrollIntoViewReservingOverlap(element) {
    const reservedOverlap = getStickyOverlap(element);
    if (reservedOverlap > 0) {
      element.style.setProperty('scroll-margin-top', `${reservedOverlap}px`);
    }

    element.scrollIntoView(SCROLL_INTO_VIEW_OPTIONS);

    if (reservedOverlap > 0) element.style.removeProperty('scroll-margin-top');
  }

  function focusedElementSince(previouslyFocused) {
    const { activeElement } = document;
    const hasTakenFocus =
      activeElement instanceof HTMLElement &&
      activeElement !== previouslyFocused &&
      activeElement !== document.body;

    return hasTakenFocus ? activeElement : null;
  }

  function scrollResolvedTargetIntoView(target, targetElement, previouslyFocused) {
    if (targetElement) {
      targetElement.scrollIntoView(SCROLL_INTO_VIEW_OPTIONS);
      return;
    }

    const focusedElement = focusedElementSince(previouslyFocused);
    if (focusedElement) scrollIntoViewReservingOverlap(focusedElement);
    else target.scrollIntoView(SCROLL_INTO_VIEW_OPTIONS);
  }

  function focusCell(row, col, scroll = true, preferredItem = 0) {
    const resolvedCell =
      resolveCellTarget(row, col, preferredItem) ?? findClosestFocusableCell(row, col);

    if (!resolvedCell?.target) return null;

    activeRow.value = resolvedCell.row;
    activeCol.value = resolvedCell.col;
    activeItem.value = resolvedCell.item ?? 0;

    nextTick(() => {
      const { target } = resolvedCell;
      const targetElement = target instanceof HTMLElement ? target : null;
      const reservedOverlap = scroll && targetElement ? getStickyOverlap(targetElement) : 0;
      if (reservedOverlap > 0) {
        targetElement.style.setProperty('scroll-margin-top', `${reservedOverlap}px`);
      }

      const previouslyFocused = document.activeElement;
      target.focus({ preventScroll: !scroll });

      if (scroll) scrollResolvedTargetIntoView(target, targetElement, previouslyFocused);

      if (reservedOverlap > 0) targetElement.style.removeProperty('scroll-margin-top');
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
        if (getFocusableCellTargets(r, c).some(({ item }) => item === activeItem.value + 1)) {
          e.preventDefault();
          focusCell(r, c, true, activeItem.value + 1);
          return;
        }
        c += 1;
        break;
      case 'ArrowLeft':
        if (
          activeItem.value > 0 &&
          getFocusableCellTargets(r, c).some(({ item }) => item === activeItem.value - 1)
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

  return {
    activeRow,
    activeCol,
    activeItem,
    registerCell,
    getTabIndex,
    getFocusable,
    onKeydown,
    onGridFocus,
    setActiveFromClick,
    isCellDelegated,
  };
}
