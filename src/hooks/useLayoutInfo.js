import { onBeforeUnmount, onMounted, ref, nextTick } from 'vue';
import { cssLengthToPx } from '@/utils/generalUtils';

const shellKind = ref('default');
const headerOverallHeight = ref(0);
const isHeaderSticky = ref(false);
const navWidth = ref(0);

const visibleHeightThreshold = 2;
const heightTolerance = 2;

const shellKindClasses = [
  ['public', 'lx-layout-public'],
  ['latvijalv', 'lx-layout-latvijalv'],
  ['digives-lite', 'lx-layout-digives-lite'],
  ['digives', 'lx-layout-digives'],
  ['cover-digives-lite', 'lx-layout-cover-digives-lite'],
  ['cover', 'lx-layout-cover'],
  ['digimaks', 'lx-layout-digimaks'],
  ['full-screen', 'lx-layout-full-screen'],
  ['default', 'lx-layout-default'],
];

let mutationObserver;
let resizeObserver;
let observedElement;
let resizeObservedElements = [];
let activeConsumers = 0;
let isWindowResizeObserved = false;
let rafId;

function getLayoutElement() {
  return document.querySelector('.lx-layout');
}

function getLayoutSiblings() {
  const layoutElement = getLayoutElement();

  if (!layoutElement?.parentElement) {
    return layoutElement ? [layoutElement] : [];
  }

  return Array.from(layoutElement.parentElement.children);
}

function calculateShellKind() {
  const siblingElements = getLayoutSiblings();
  const shellKindClass = shellKindClasses.find(([, className]) =>
    siblingElements.some((sibling) => sibling.classList.contains(className))
  );

  return shellKindClass?.[0] ?? 'default';
}

function getCssVariablePx(element, variableName) {
  return cssLengthToPx(getComputedStyle(element).getPropertyValue(variableName), element);
}

function getElementHeight(element) {
  return element?.getBoundingClientRect().height ?? 0;
}

function getElementWidth(element) {
  return element?.getBoundingClientRect().width ?? 0;
}

function matchesHeight(height, targetHeight) {
  return targetHeight > 0 && Math.abs(height - targetHeight) <= heightTolerance;
}

function findMatchedVariableHeight(height, variableHeights) {
  return variableHeights.find((variableHeight) => matchesHeight(height, variableHeight));
}

function getStickyElementBoundary(element, variableHeights) {
  if (!element) {
    return 0;
  }

  const { position, top } = getComputedStyle(element);

  if (position !== 'sticky' && position !== 'fixed') {
    return 0;
  }

  const elementHeight = getElementHeight(element);
  const matchedHeight = findMatchedVariableHeight(elementHeight, variableHeights);

  if (elementHeight <= visibleHeightThreshold || !matchedHeight) {
    return 0;
  }

  return cssLengthToPx(top, element) + matchedHeight;
}

function calculatePublicHeaderOverallHeight(layoutElement) {
  const headerElement = layoutElement.querySelector(':scope > header');
  const navElement = layoutElement.querySelector(':scope > nav');

  const navRowHeight = getCssVariablePx(layoutElement, '--nav-row-size');
  const rowHeight = getCssVariablePx(layoutElement, '--row-size');
  const variableHeights = [navRowHeight, rowHeight];

  const headerBoundary = getStickyElementBoundary(headerElement, variableHeights);
  const navBoundary = getStickyElementBoundary(navElement, variableHeights);

  return Math.max(headerBoundary, navBoundary);
}

function calculateHeaderOverallHeight(kind) {
  const layoutElement = getLayoutElement();

  if (!layoutElement) {
    return 0;
  }

  if (kind === 'public' || kind === 'latvijalv') {
    return calculatePublicHeaderOverallHeight(layoutElement);
  }

  return getCssVariablePx(layoutElement, '--nav-row-size');
}

function calculateIsHeaderSticky() {
  const headerElement = getLayoutElement()?.querySelector(':scope > header');
  const headerPosition = headerElement ? getComputedStyle(headerElement).position : '';

  return headerPosition === 'sticky' || headerPosition === 'fixed';
}

function calculateNavWidth(kind) {
  if (kind === 'public' || kind === 'latvijalv') {
    return 0;
  }

  const navPanelElement = getLayoutElement()?.querySelector(':scope > nav .lx-nav-panel');
  const width = getElementWidth(navPanelElement);

  return width > visibleHeightThreshold ? width : 0;
}

function updateLibData() {
  const nextShellKind = calculateShellKind();

  shellKind.value = nextShellKind;
  headerOverallHeight.value = calculateHeaderOverallHeight(nextShellKind);
  isHeaderSticky.value = calculateIsHeaderSticky();
  navWidth.value = calculateNavWidth(nextShellKind);
}

function updateResizeObserver() {
  const layoutElement = getLayoutElement();

  const elements = [
    layoutElement,
    layoutElement?.querySelector(':scope > header'),
    layoutElement?.querySelector(':scope > nav'),
    layoutElement?.querySelector(':scope > nav .lx-nav-panel'),
  ].filter(Boolean);

  const isSameElements =
    elements.length === resizeObservedElements.length &&
    elements.every((element, index) => element === resizeObservedElements[index]);

  if (isSameElements) {
    return;
  }

  resizeObserver?.disconnect();
  resizeObservedElements = elements;

  if (!elements.length) {
    return;
  }

  // eslint-disable-next-line no-use-before-define
  resizeObserver = new ResizeObserver(scheduleUpdate);
  elements.forEach((element) => resizeObserver.observe(element));
}

function updateMutationObserver() {
  const layoutElement = getLayoutElement();
  const elementToObserve = layoutElement?.parentElement ?? document.body;

  if (!elementToObserve || observedElement === elementToObserve) {
    return;
  }

  mutationObserver?.disconnect();
  observedElement = elementToObserve;
  // eslint-disable-next-line no-use-before-define
  mutationObserver = new MutationObserver(scheduleUpdate);

  mutationObserver.observe(elementToObserve, {
    attributes: true,
    attributeFilter: ['class'],
    childList: true,
    subtree: true,
  });
}

function scheduleUpdate() {
  if (rafId) {
    return;
  }

  rafId = requestAnimationFrame(() => {
    rafId = undefined;

    updateLibData();
    updateResizeObserver();
    updateMutationObserver();
  });
}

function startWindowResizeObserver() {
  if (isWindowResizeObserved) {
    return;
  }

  globalThis.addEventListener('resize', scheduleUpdate);
  isWindowResizeObserved = true;
}

function stopWindowResizeObserver() {
  if (!isWindowResizeObserved) {
    return;
  }

  globalThis.removeEventListener('resize', scheduleUpdate);
  isWindowResizeObserved = false;
}

function startLibDataObserver() {
  updateLibData();
  updateResizeObserver();
  updateMutationObserver();
  startWindowResizeObserver();
}

function stopLibDataObserver() {
  mutationObserver?.disconnect();
  resizeObserver?.disconnect();
  stopWindowResizeObserver();

  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = undefined;
  }

  mutationObserver = undefined;
  resizeObserver = undefined;
  observedElement = undefined;
  resizeObservedElements = [];
}

export function useLayoutInfo() {
  onMounted(() => {
    activeConsumers += 1;
    nextTick(startLibDataObserver);
  });

  onBeforeUnmount(() => {
    activeConsumers -= 1;

    if (activeConsumers <= 0) {
      activeConsumers = 0;
      stopLibDataObserver();
    }
  });

  return {
    shellKind,
    headerOverallHeight,
    isHeaderSticky,
    navWidth,
  };
}
