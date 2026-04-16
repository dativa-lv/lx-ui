import { ref, nextTick } from 'vue';

export function useGridKeyboardNavigation() {
  const activeRow = ref(0);
  const activeCol = ref(0);

  const cellRefs = ref([]);

  function registerCell(el, row, col) {
    if (!el) return;

    let target = null;

    if (el instanceof HTMLElement || typeof el.focus === 'function') {
      target = el;
    } else if (el.focusEl?.value instanceof HTMLElement) {
      target = el.focusEl.value;
    }

    if (target) {
      cellRefs.value[row] ??= {};
      cellRefs.value[row][col] = target;
    }
  }

  function isActiveCell(row, col) {
    return activeRow.value === row && activeCol.value === col;
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

  function findClosestFocusableCell(row, col) {
    return Object.entries(cellRefs.value)
      .reduce((matches, [rowKey, rowCells]) => {
        const currentRow = Number(rowKey);

        return matches.concat(
          Object.entries(rowCells || {})
            .map(([colKey, target]) => {
              const currentCol = Number(colKey);

              if (isDisabledCell(target)) return null;

              const rowDistance = Math.abs(currentRow - row);
              const colDistance = Math.abs(currentCol - col);

              return {
                row: currentRow,
                col: currentCol,
                target,
                distance: rowDistance + colDistance,
                rowDistance,
                colDistance,
              };
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

  function focusCell(row, col, scroll = true) {
    const target = cellRefs.value[row]?.[col];
    const resolvedCell = !isDisabledCell(target)
      ? { row, col, target }
      : findClosestFocusableCell(row, col);

    if (!resolvedCell?.target) return null;

    activeRow.value = resolvedCell.row;
    activeCol.value = resolvedCell.col;

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
    return focusCell(activeRow.value, activeCol.value);
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
        c += 1;
        break;
      case 'ArrowLeft':
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

    focusCell(r, c);
  }

  function setActiveFromClick(row, col, scroll = true) {
    return focusCell(row, col, scroll);
  }

  function getTabIndex(row, col) {
    return isActiveCell(row, col) ? 0 : -1;
  }

  function getFocusable(row, col) {
    return !!isActiveCell(row, col);
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
