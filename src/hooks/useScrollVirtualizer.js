import { computed, effectScope, nextTick, ref, shallowRef } from 'vue';
import { loadLibrary } from '@/utils/libLoader';

function resolveMaybeRef(valueOrRef) {
  if (valueOrRef && typeof valueOrRef === 'object' && 'value' in valueOrRef) {
    return valueOrRef.value;
  }
  return valueOrRef ?? null;
}

function isElementRenderable(element) {
  if (!element) return false;

  const computedStyle =
    typeof globalThis.getComputedStyle === 'function' ? globalThis.getComputedStyle(element) : null;

  if (computedStyle?.display === 'none' || computedStyle?.visibility === 'hidden') {
    return false;
  }

  if (typeof element.getClientRects === 'function' && element.getClientRects().length > 0) {
    return true;
  }

  if ((element.offsetWidth ?? 0) > 0 || (element.offsetHeight ?? 0) > 0) {
    return true;
  }

  return computedStyle ? computedStyle.display !== 'none' : true;
}

function normalizeScrollMargin(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value);
}

export default function useScrollVirtualizer({
  enabled,
  scrollParentSourceRef,
  scrollAnchorRef = scrollParentSourceRef,
  positionObserverRef = scrollParentSourceRef,
  resolveScrollParent = () => null,
  shouldUseElementVirtualizer = (scrollParent) => !!scrollParent,
  createVirtualizerOptions,
  reloadVirtualizerDuringScrollParentChange = false,
}) {
  const virtualizer = shallowRef(null);
  const scrollMargin = ref(0);
  const scrollParent = ref(null);

  let virtualizerScope = null;
  let positionObserver = null;
  // `@tanstack/vue-virtual` is lazy-loaded (code-split) the first time the
  // virtualizer is needed, then cached on this instance so `loadVirtualizer`
  // stays synchronous afterwards.
  let virtualLib = null;
  let applyScrollContextUpdate = () => ({
    scrollMarginChanged: false,
    scrollParentChanged: false,
  });

  const isEnabled = () => !!resolveMaybeRef(enabled);

  // The virtualizer is actually driving layout (enabled and instantiated).
  const isActive = computed(() => isEnabled() && !!virtualizer.value);

  // Generic virtualizer-derived state, so consumers don't reach into
  // `virtualizer.value.value.*` themselves.
  const totalSize = computed(() =>
    virtualizer.value ? virtualizer.value.value.getTotalSize() : 0
  );
  const virtualItems = computed(() =>
    virtualizer.value ? virtualizer.value.value.getVirtualItems() : []
  );

  const getScrollParentSource = () => resolveMaybeRef(scrollParentSourceRef);
  const getScrollAnchor = () => resolveMaybeRef(scrollAnchorRef) || getScrollParentSource();
  const getPositionObserverTarget = () =>
    resolveMaybeRef(positionObserverRef) || getScrollParentSource();

  function measure() {
    virtualizer.value?.value.measure();
  }

  async function ensureVirtualLib() {
    if (!virtualLib) {
      virtualLib = await loadLibrary('vueVirtual');
    }
    return virtualLib;
  }

  function loadVirtualizer() {
    // The lib must be loaded first (callers await `ensureVirtualLib`); skip if
    // a stray sync caller runs before that.
    if (!virtualLib) return;
    if (virtualizerScope) virtualizerScope.stop();
    virtualizerScope = effectScope();

    virtualizerScope.run(() => {
      // Keep the options object intact so getter-based fields stay reactive.
      const virtualizerOptions =
        createVirtualizerOptions?.({
          scrollMargin,
          scrollParent,
          virtualizer,
        }) || {};

      if (shouldUseElementVirtualizer(scrollParent.value)) {
        Object.defineProperty(virtualizerOptions, 'getScrollElement', {
          enumerable: true,
          value: () => scrollParent.value,
        });
        virtualizer.value = virtualLib.useVirtualizer(virtualizerOptions);
      } else {
        virtualizer.value = virtualLib.useWindowVirtualizer(virtualizerOptions);
      }
    });
  }

  async function ensureVirtualizer() {
    if (!isEnabled() || virtualizer.value) return;
    await ensureVirtualLib();
    loadVirtualizer();
  }

  // Layout-path rAF: recompute scroll margin / parent only on actual reflow
  // (driven by the ResizeObserver). Scroll itself is handled by the underlying
  // virtualizer, and the scroll margin is invariant under scrolling.
  let layoutUpdateRaf = null;
  function scheduleLayoutUpdate() {
    if (!isEnabled() || layoutUpdateRaf !== null) return;

    layoutUpdateRaf = globalThis.requestAnimationFrame(() => {
      layoutUpdateRaf = null;
      applyScrollContextUpdate();
    });
  }

  function clearVirtualizer() {
    if (layoutUpdateRaf !== null) {
      globalThis.cancelAnimationFrame(layoutUpdateRaf);
      layoutUpdateRaf = null;
    }

    positionObserver?.disconnect();
    positionObserver = null;

    if (virtualizerScope) {
      virtualizerScope.stop();
      virtualizerScope = null;
    }

    virtualizer.value = null;
  }

  function setupPositionObservers() {
    const observerTarget = getPositionObserverTarget();
    if (!observerTarget) return;

    positionObserver?.disconnect();

    const RO = globalThis.ResizeObserver;

    if (RO) {
      positionObserver = new RO(() => {
        scheduleLayoutUpdate();
      });
      const targets = new Set([observerTarget, observerTarget.parentElement, scrollParent.value]);

      targets.forEach((target) => {
        if (target) {
          positionObserver.observe(target);
        }
      });
    }
  }

  function updateScrollContext() {
    const scrollParentSource = getScrollParentSource();
    const scrollAnchor = getScrollAnchor();

    if (!scrollAnchor || !isElementRenderable(scrollAnchor)) {
      return {
        scrollMarginChanged: false,
        scrollParentChanged: false,
      };
    }

    const resolvedParent = resolveScrollParent(scrollParentSource || scrollAnchor);
    const scrollParentChanged = resolvedParent !== scrollParent.value;
    if (scrollParentChanged) {
      scrollParent.value = resolvedParent;
    }

    const anchorTop = scrollAnchor.getBoundingClientRect().top;
    const nextScrollMargin = normalizeScrollMargin(
      resolvedParent
        ? anchorTop - resolvedParent.getBoundingClientRect().top + (resolvedParent.scrollTop || 0)
        : anchorTop + (globalThis.scrollY ?? globalThis.pageYOffset ?? 0)
    );
    const scrollMarginChanged = Math.abs(nextScrollMargin - scrollMargin.value) >= 0.5;

    if (scrollMarginChanged) {
      scrollMargin.value = nextScrollMargin;
    }

    return {
      scrollMarginChanged,
      scrollParentChanged,
    };
  }

  applyScrollContextUpdate = function applyScrollContextUpdateImpl({
    reloadOnScrollParentChange = reloadVirtualizerDuringScrollParentChange,
  } = {}) {
    const { scrollMarginChanged, scrollParentChanged } = updateScrollContext();
    if (scrollParentChanged) {
      setupPositionObservers();
      if (reloadOnScrollParentChange && isEnabled()) {
        loadVirtualizer();
      }
    }
    if (scrollMarginChanged) {
      measure();
    }

    return {
      scrollMarginChanged,
      scrollParentChanged,
    };
  };

  async function syncVirtualizationContext({ reloadOnScrollParentChange = false } = {}) {
    if (!isEnabled()) return;

    await ensureVirtualLib();
    if (!isEnabled()) return;

    const { scrollParentChanged } = updateScrollContext();
    setupPositionObservers();
    if (!virtualizer.value || (reloadOnScrollParentChange && scrollParentChanged)) {
      loadVirtualizer();
      await nextTick();
      updateScrollContext();
      setupPositionObservers();
    }

    measure();
  }

  function measureElement(element) {
    if (!isEnabled() || !element) return;
    virtualizer.value?.value.measureElement(element);
  }

  // Re-measures a set of already-rendered elements in place (no estimate reset,
  // so no size flash) to settle their heights in the virtualizer.
  function measureElements(elements) {
    if (!isEnabled() || !elements) return;
    elements.forEach((element) => {
      if (element) virtualizer.value?.value.measureElement(element);
    });
  }

  function cleanup() {
    clearVirtualizer();
  }

  return {
    virtualizer,
    isActive,
    totalSize,
    virtualItems,
    scrollMargin,
    scrollParent,
    measure,
    loadVirtualizer,
    ensureVirtualizer,
    clearVirtualizer,
    updateScrollContext,
    scheduleLayoutUpdate,
    syncVirtualizationContext,
    measureElement,
    measureElements,
    cleanup,
  };
}
