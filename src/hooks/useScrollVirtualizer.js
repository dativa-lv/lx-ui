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
  // When this resolves truthy, layout-driven scroll-margin/measure recalculation
  // is paused (e.g. while the compact search is expanded), so the toolbar growing
  // doesn't reflow the virtualized list and jump the scroll position.
  layoutUpdatesPaused = () => false,
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

  // Read/write the scroll offset of whatever is scrolling (element or window).
  function getScrollOffset() {
    const parent = scrollParent.value;
    if (parent) return parent.scrollTop || 0;
    return globalThis.scrollY ?? globalThis.pageYOffset ?? 0;
  }
  function setScrollOffset(value) {
    const parent = scrollParent.value;
    if (parent) {
      parent.scrollTop = value;
    } else if (typeof globalThis.scrollTo === 'function') {
      globalThis.scrollTo(globalThis.scrollX ?? 0, value);
    }
  }
  function measure() {
    virtualizer.value?.value.measure();
  }

  // The scroll margin is invariant under scrolling, so it must NOT be recomputed
  // mid-scroll: a ResizeObserver fire then reads anchor/offset a beat apart and
  // produces a wrong margin that flips every row's transform. Track scroll
  // activity and defer recompute until scrolling settles.
  let isScrolling = false;
  let scrollIdleFrames = 0;
  let scrollIdleRaf = null;
  let pendingLayoutUpdate = false;
  let scrollActivityTarget = null;
  // While the layout viewport is resizing, forbid scroll correction: a resize
  // fires scroll events that otherwise look like scrolling and let the re-measure
  // accumulate into a jump. Counts down a few frames after the last resize.
  let resizeSuppressFrames = 0;
  let resizeSuppressRaf = null;
  let resizeActivityAttached = false;
  let lastScrollParentHeight = null;
  let lastInnerHeight = null;

  // Correct scroll on row-size change only while actively scrolling (tanstack's
  // default — keeps the list from wobbling as rows enter); never during a
  // layout-viewport resize, where the mass re-measure would accumulate a jump.
  function shouldAdjustScrollPositionOnItemSizeChange(item, _delta, instance) {
    if (resizeSuppressFrames > 0) return false;
    if (!isScrolling) return false;
    const offset = typeof instance?.getScrollOffset === 'function' ? instance.getScrollOffset() : 0;
    return item.start < offset + (instance?.scrollAdjustments || 0);
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
          shouldAdjustScrollPositionOnItemSizeChange,
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

      const instance = virtualizer.value?.value;
      if (
        instance &&
        typeof virtualizerOptions.shouldAdjustScrollPositionOnItemSizeChange === 'function'
      ) {
        instance.shouldAdjustScrollPositionOnItemSizeChange =
          virtualizerOptions.shouldAdjustScrollPositionOnItemSizeChange;
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
    if (layoutUpdatesPaused()) return;

    layoutUpdateRaf = globalThis.requestAnimationFrame(() => {
      layoutUpdateRaf = null;

      // Defer while actively scrolling — the margin is scroll-invariant, and a
      // mid-scroll read would compute a wrong value and jump the list. The idle
      // watcher re-runs this once scrolling settles.
      if (isScrolling) {
        pendingLayoutUpdate = true;
        return;
      }

      const preservedScrollOffset = getScrollOffset();
      const { scrollMarginChanged, scrollParentChanged } = applyScrollContextUpdate();

      if (scrollMarginChanged && !scrollParentChanged) {
        setScrollOffset(preservedScrollOffset);
        let restoreFrames = 3;
        const pinScrollOffset = () => {
          setScrollOffset(preservedScrollOffset);
          restoreFrames -= 1;
          if (restoreFrames > 0) globalThis.requestAnimationFrame(pinScrollOffset);
        };
        globalThis.requestAnimationFrame(pinScrollOffset);
      }
    });
  }

  function runScrollIdleWatcher() {
    if (scrollIdleRaf !== null) return;
    const tick = () => {
      scrollIdleFrames -= 1;
      if (scrollIdleFrames > 0) {
        scrollIdleRaf = globalThis.requestAnimationFrame(tick);
        return;
      }
      scrollIdleRaf = null;
      isScrolling = false;
      if (pendingLayoutUpdate) {
        pendingLayoutUpdate = false;
        scheduleLayoutUpdate();
      }
    };
    scrollIdleRaf = globalThis.requestAnimationFrame(tick);
  }

  function markScrolling() {
    isScrolling = true;
    scrollIdleFrames = 4;
    runScrollIdleWatcher();
  }

  function runResizeSuppressWatcher() {
    if (resizeSuppressRaf !== null) return;
    const tick = () => {
      resizeSuppressFrames -= 1;
      if (resizeSuppressFrames > 0) {
        resizeSuppressRaf = globalThis.requestAnimationFrame(tick);
        return;
      }
      resizeSuppressRaf = null;
    };
    resizeSuppressRaf = globalThis.requestAnimationFrame(tick);
  }

  // Flag a layout-viewport resize so scroll correction stays off briefly after.
  function markResize() {
    resizeSuppressFrames = 12;
    runResizeSuppressWatcher();
  }

  function attachScrollActivityListener() {
    const target = scrollParent.value || globalThis;
    if (scrollActivityTarget === target) return;
    if (scrollActivityTarget?.removeEventListener) {
      scrollActivityTarget.removeEventListener('scroll', markScrolling);
    }
    target.addEventListener?.('scroll', markScrolling, { passive: true });
    scrollActivityTarget = target;
  }

  // Only a layout-viewport height change (window resize / rotation) suppresses
  // correction. A visual-viewport-only change (mobile keyboard) must not — its
  // content scroll needs correction to avoid flicker. So gate on innerHeight.
  function onWindowResize() {
    const height = globalThis.innerHeight;
    if (lastInnerHeight !== null && height !== lastInnerHeight) {
      markResize();
    }
    lastInnerHeight = height;
  }

  function attachResizeActivityListeners() {
    if (resizeActivityAttached) return;
    lastInnerHeight = globalThis.innerHeight;
    globalThis.addEventListener?.('resize', onWindowResize, { passive: true });
    resizeActivityAttached = true;
  }

  function clearVirtualizer() {
    if (layoutUpdateRaf !== null) {
      globalThis.cancelAnimationFrame(layoutUpdateRaf);
      layoutUpdateRaf = null;
    }

    positionObserver?.disconnect();
    positionObserver = null;

    if (scrollIdleRaf !== null) {
      globalThis.cancelAnimationFrame(scrollIdleRaf);
      scrollIdleRaf = null;
    }
    isScrolling = false;
    pendingLayoutUpdate = false;
    if (scrollActivityTarget?.removeEventListener) {
      scrollActivityTarget.removeEventListener('scroll', markScrolling);
      scrollActivityTarget = null;
    }

    if (resizeSuppressRaf !== null) {
      globalThis.cancelAnimationFrame(resizeSuppressRaf);
      resizeSuppressRaf = null;
    }
    resizeSuppressFrames = 0;
    lastScrollParentHeight = null;
    lastInnerHeight = null;
    if (resizeActivityAttached) {
      globalThis.removeEventListener?.('resize', onWindowResize);
      resizeActivityAttached = false;
    }

    if (virtualizerScope) {
      virtualizerScope.stop();
      virtualizerScope = null;
    }

    virtualizer.value = null;
  }

  function setupPositionObservers() {
    attachScrollActivityListener();
    attachResizeActivityListeners();

    const observerTarget = getPositionObserverTarget();
    if (!observerTarget) return;

    positionObserver?.disconnect();

    const RO = globalThis.ResizeObserver;

    if (RO) {
      positionObserver = new RO(() => {
        // A change in the scroll parent's own height is a viewport resize (as
        // opposed to the inner list content growing as rows are measured) — flag
        // it so scroll-position correction stays suppressed through the reflow.
        const parent = scrollParent.value;
        const parentHeight = parent ? parent.clientHeight : globalThis.innerHeight;
        if (lastScrollParentHeight !== null && parentHeight !== lastScrollParentHeight) {
          markResize();
        }
        lastScrollParentHeight = parentHeight;
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
