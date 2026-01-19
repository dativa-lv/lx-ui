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

  function focusCell(row, col) {
    const target = cellRefs.value[row]?.[col];
    if (!target) return;

    activeRow.value = row;
    activeCol.value = col;

    nextTick(() => {
      target.focus();
    });
  }

  function onGridFocus() {
    focusCell(activeRow.value, activeCol.value);
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

  function setActiveFromClick(row, col) {
    focusCell(row, col);
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
      col.type === 'person' ||
      col.kind === 'clickable' ||
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
