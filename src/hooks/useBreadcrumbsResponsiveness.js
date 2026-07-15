import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { hasOverflow } from '@/utils/overflowUtils';

export function breadcrumbVisibility(count, overflowCount) {
  if (count <= 1) {
    return { collapsed: false, overflowIndexes: [], trailingIndexes: [] };
  }

  const clamped = Math.max(0, Math.min(overflowCount, count - 1));

  const overflowIndexes = [];
  for (let i = 1; i <= clamped; i += 1) {
    overflowIndexes.push(i);
  }

  const trailingIndexes = [];
  for (let i = clamped + 1; i < count; i += 1) {
    trailingIndexes.push(i);
  }

  return { collapsed: clamped > 0, overflowIndexes, trailingIndexes };
}

export function useBreadcrumbsResponsiveness({ containerRef, crumbs }) {
  const overflowCount = ref(0);
  const truncateFirst = ref(false);

  const layout = computed(() =>
    breadcrumbVisibility(crumbs.value?.length ?? 0, overflowCount.value)
  );
  const collapsed = computed(() => layout.value.collapsed);
  const overflowIndexes = computed(() => layout.value.overflowIndexes);
  const trailingIndexes = computed(() => layout.value.trailingIndexes);

  let resizeObserver = null;
  let frame = null;
  let runId = 0;

  async function collapseUntilFits() {
    runId += 1;
    const generation = runId;
    const count = crumbs.value?.length ?? 0;

    overflowCount.value = 0;
    truncateFirst.value = false;
    await nextTick();

    const container = containerRef.value;
    if (generation !== runId || !(container instanceof HTMLElement) || count <= 1) {
      return;
    }

    while (hasOverflow(container) && overflowCount.value < count - 1) {
      overflowCount.value += 1;
      // eslint-disable-next-line no-await-in-loop
      await nextTick();
      if (generation !== runId) {
        return;
      }
    }

    truncateFirst.value = hasOverflow(container);
  }

  function recalculate() {
    if (frame) {
      cancelAnimationFrame(frame);
    }
    frame = requestAnimationFrame(collapseUntilFits);
  }

  watch(crumbs, recalculate, { deep: true });

  onMounted(() => {
    const container = containerRef.value;
    if (container instanceof HTMLElement && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(recalculate);
      resizeObserver.observe(container);
    }
    recalculate();
  });

  onBeforeUnmount(() => {
    resizeObserver?.disconnect();
    if (frame) {
      cancelAnimationFrame(frame);
    }
  });

  return { collapsed, overflowIndexes, trailingIndexes, truncateFirst };
}
