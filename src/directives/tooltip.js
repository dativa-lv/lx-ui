// Handlers reference each other mutually (hide <-> unbindGlobals), so ordering cannot satisfy this
/* eslint-disable no-use-before-define */
import useLx from '@/hooks/useLx';
import { logWarn } from '@/utils/devUtils';
import { safeMatchMedia } from '@/utils/accessibilityUtils';

// v-tooltip: hover tooltip that does not wrap its trigger. Single source of the tooltip markup –
// LxTooltip (src/components/Tooltip.vue) renders through it too.
// Registered globally by createLx. See docs/Directives.md.

export const OPEN_DELAY = 300;
export const CLOSE_DELAY = 100;
export const MOVE_THRESHOLD = 20;
// Pseudo height of the cursor – the panel is offset this far below the pointer
export const CURSOR_HEIGHT = 18;
// Clearance kept between the panel and the viewport edges
export const VIEWPORT_MARGIN = 4;

const PANEL_ID = 'lx-tooltip-panel';
const MARKER_ATTR = 'data-lx-tooltip';
const HIGH_Z_INDEX = '9000';
const NESTED_TOOLTIP_SELECTOR = '.lx-info-wrapper-content.lx-tooltip-kind';

const registry = new WeakMap();
// Events already claimed by a nested trigger; weak so dispatched events stay collectable
const handledMoves = new WeakSet();

const state = {
  armedEl: null,
  currentEl: null,
  isOpen: false,
  openTimer: null,
  closeTimer: null,
  savedCursorPos: null,
  nodes: null,
  globalsBound: false,
  hitTestBound: false,
  hitTestFrame: null,
  disabledCount: 0,
};

function hasDocument() {
  return typeof document !== 'undefined';
}

function isElementDisabled(el) {
  return el.disabled === true || el.hasAttribute('disabled');
}

function normalizeValue(value) {
  let text = '';
  let suppressed = false;
  let onToggle = null;

  if (typeof value === 'string' || typeof value === 'number') {
    text = String(value);
  } else if (value && typeof value === 'object') {
    const raw = value.value;
    if (typeof raw === 'string' || typeof raw === 'number') text = String(raw);
    suppressed = Boolean(value.disabled);
    if (typeof value.onToggle === 'function') onToggle = value.onToggle;
  }

  return { text: text.trim() ? text : '', suppressed, onToggle };
}

// A MediaQueryList keeps itself up to date, so the query is built once instead of on every
// pointer move. It stays unset where matchMedia is missing, so a later call can still try
let hoverNoneQuery = null;

function isTouchOnly() {
  if (!hoverNoneQuery) hoverNoneQuery = safeMatchMedia('(hover: none)');
  return hoverNoneQuery?.matches === true;
}

function isInert(el, entry) {
  if (!entry?.text || entry.suppressed) return true;
  // Touch devices never get a hover tooltip
  if (isTouchOnly()) return true;
  // Already inside an LxTooltip – let the component own the hover
  if (el.parentElement?.closest(NESTED_TOOLTIP_SELECTOR)) return true;
  return false;
}

function resolveContainer(el) {
  if (!hasDocument()) return null;
  return document.getElementById('poppers') || el.closest('.lx-layout') || document.body;
}

function ensureNodes() {
  if (state.nodes) return state.nodes;

  const popper = document.createElement('div');
  popper.className = 'popper higher-z-index';
  popper.style.position = 'fixed';

  const wrapper = document.createElement('div');
  wrapper.className = 'lx-info-wrapper lx-tooltip-kind';

  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.className = 'lx-info-wrapper-panel';
  panel.setAttribute('role', 'tooltip');
  panel.setAttribute('aria-hidden', 'true');
  panel.style.setProperty('--info-popper-spacer-size', '13px');

  const area = document.createElement('div');
  area.className = 'lx-info-wrapper-panel-area';

  const text = document.createElement('p');
  text.className = 'lx-tooltip-text';

  // Resulting markup is documented in docs/Directives.md (Styling)
  area.appendChild(text);
  panel.appendChild(area);
  wrapper.appendChild(panel);
  popper.appendChild(wrapper);

  // Moving the pointer onto the panel dismisses it, same as LxTooltip
  wrapper.addEventListener('mousemove', hide);
  wrapper.addEventListener('mouseleave', handleLeave);
  panel.addEventListener('click', onPanelClick);

  state.nodes = { popper, wrapper, panel, text };
  return state.nodes;
}

function positionPanel(x, y) {
  const { popper } = state.nodes;
  // `innerWidth` counts a classic scrollbar, the layout viewport a fixed element sits in does
  // not – clamping to the larger number slides the panel under the bar and re-wraps it
  const doc = hasDocument() ? document.documentElement : null;
  const viewportWidth = doc?.clientWidth || globalThis.innerWidth || 0;
  const viewportHeight = doc?.clientHeight || globalThis.innerHeight || 0;

  // Measure at the origin – near the viewport edge the panel is already wrapped, and clamping
  // to that width would pin it there
  popper.style.left = '0px';
  popper.style.top = '0px';
  const rect = popper.getBoundingClientRect();
  // Round up – a lost fraction is enough to force another line break
  const popperWidth = Math.ceil(rect.width);
  const popperHeight = Math.ceil(rect.height);

  const maxLeft = Math.max(viewportWidth - popperWidth - VIEWPORT_MARGIN, VIEWPORT_MARGIN);
  const maxTop = Math.max(viewportHeight - popperHeight - VIEWPORT_MARGIN, VIEWPORT_MARGIN);
  const left = Math.min(Math.max(x, VIEWPORT_MARGIN), maxLeft);
  const top = Math.min(Math.max(y, VIEWPORT_MARGIN), maxTop);

  popper.style.left = `${left}px`;
  popper.style.top = `${top}px`;
}

function clearOpenTimer() {
  if (state.openTimer) {
    clearTimeout(state.openTimer);
    state.openTimer = null;
  }
  state.armedEl = null;
}

function clearCloseTimer() {
  if (state.closeTimer) {
    clearTimeout(state.closeTimer);
    state.closeTimer = null;
  }
}

function onKeydown(event) {
  // WCAG 1.4.13 – hover content must be dismissible without moving the pointer
  if (event.key === 'Escape') hide();
}

function bindGlobals() {
  if (state.globalsBound || !hasDocument()) return;
  document.addEventListener('scroll', hide, { capture: true, passive: true });
  document.addEventListener('contextmenu', hide);
  document.addEventListener('visibilitychange', hide);
  document.addEventListener('keydown', onKeydown);
  globalThis.addEventListener?.('resize', hide);
  state.globalsBound = true;
}

function unbindGlobals() {
  if (!state.globalsBound) return;
  document.removeEventListener('scroll', hide, { capture: true });
  document.removeEventListener('contextmenu', hide);
  document.removeEventListener('visibilitychange', hide);
  document.removeEventListener('keydown', onKeydown);
  globalThis.removeEventListener?.('resize', hide);
  state.globalsBound = false;
}

function show(el, cursorX, cursorY) {
  const entry = registry.get(el);
  if (!entry?.text) return;

  const container = resolveContainer(el);
  if (!container) return;

  const nodes = ensureNodes();

  nodes.text.textContent = entry.text;

  // LxButton already renders its own hidden description, so don't announce the text twice
  const ownsAria = !el.getAttribute('aria-describedby');
  entry.ownsAria = ownsAria;
  nodes.panel.setAttribute('aria-hidden', ownsAria ? 'false' : 'true');
  if (ownsAria) el.setAttribute('aria-describedby', PANEL_ID);

  // The z-index rules are scoped to `.lx .lx-layout .popper`; fall back to an inline value
  const styledByCss = Boolean(container.closest('.lx-layout')) && Boolean(container.closest('.lx'));
  nodes.popper.style.zIndex = styledByCss ? '' : HIGH_Z_INDEX;

  if (!nodes.popper.isConnected || nodes.popper.parentNode !== container) {
    container.appendChild(nodes.popper);
  }

  state.currentEl = el;
  state.isOpen = true;
  state.savedCursorPos = { x: cursorX, y: cursorY };
  el.addEventListener('blur', onTriggerBlur);

  // Must run after insertion – the clamp needs the panel's measured size
  positionPanel(cursorX, cursorY + CURSOR_HEIGHT);

  entry.onToggle?.(true);
}

function hide() {
  clearOpenTimer();
  clearCloseTimer();

  const el = state.currentEl;
  const entry = el ? registry.get(el) : null;
  if (entry?.ownsAria) {
    el.removeAttribute('aria-describedby');
    entry.ownsAria = false;
  }
  el?.removeEventListener('blur', onTriggerBlur);

  const { nodes } = state;
  if (nodes) {
    nodes.popper.remove();
    nodes.panel.setAttribute('aria-hidden', 'true');
    nodes.text.textContent = '';
  }

  state.currentEl = null;
  state.isOpen = false;
  state.savedCursorPos = null;

  unbindGlobals();

  // Notify last, so the callback sees the settled state
  if (el) entry?.onToggle?.(false);
}

function scheduleClose() {
  clearCloseTimer();
  state.closeTimer = setTimeout(() => {
    state.closeTimer = null;
    hide();
  }, CLOSE_DELAY);
}

function handleMove(el, clientX, clientY) {
  const entry = registry.get(el);
  if (isInert(el, entry)) return false;

  clearCloseTimer();

  if (state.currentEl === el && state.isOpen) {
    const saved = state.savedCursorPos;
    if (saved && Math.hypot(saved.x - clientX, saved.y - clientY) > MOVE_THRESHOLD) {
      hide();
    }
    return true;
  }

  if (state.currentEl && state.currentEl !== el) hide();

  clearOpenTimer();
  state.armedEl = el;
  bindGlobals();
  state.openTimer = setTimeout(() => {
    state.openTimer = null;
    state.armedEl = null;
    show(el, clientX, clientY);
  }, OPEN_DELAY);

  return true;
}

function handleLeave(event) {
  clearOpenTimer();

  const related = event?.relatedTarget;
  const triggerEl = state.currentEl;
  const panelEl = state.nodes?.popper;

  // Moving between the trigger and its panel must not dismiss it
  const stayingInside =
    related instanceof Element &&
    ((triggerEl instanceof Element && triggerEl.contains(related)) ||
      (panelEl instanceof Element && panelEl.contains(related)));

  if (stayingInside) return;

  scheduleClose();
}

function onPanelClick(event) {
  event.preventDefault();
  hide();
}

function nativeTitleOwner(target, trigger) {
  let node = target instanceof Element ? target : null;
  while (node && node !== trigger) {
    if (node.getAttribute('title')) return node;
    node = node.parentElement;
  }
  return null;
}

function onTriggerMove(event) {
  // mousemove bubbles, so the nearest trigger claims the event and ancestors stand down
  if (handledMoves.has(event)) return;

  // Let the browser draw its own tooltip for that descendant rather than stacking ours on top
  if (nativeTitleOwner(event.target, event.currentTarget)) {
    handledMoves.add(event);
    if (state.armedEl === event.currentTarget || state.currentEl === event.currentTarget) hide();
    return;
  }

  if (handleMove(event.currentTarget, event.clientX, event.clientY)) handledMoves.add(event);
}

function onTriggerLeave(event) {
  handleLeave(event);
}

function onTriggerBlur() {
  hide();
}

function runHitTest(clientX, clientY) {
  if (state.currentEl && !state.currentEl.isConnected) {
    hide();
    return;
  }

  const hit = document.elementFromPoint?.(clientX, clientY);
  const el = hit instanceof Element ? hit.closest(`[${MARKER_ATTR}]`) : null;

  if (el && registry.has(el) && isElementDisabled(el)) {
    handleMove(el, clientX, clientY);
    return;
  }

  // Disabled triggers get no mouseleave either, so dismiss from here – the countdown too, or it
  // opens where the pointer no longer is
  const engaged = state.currentEl || state.armedEl;
  if (engaged && engaged !== el && isElementDisabled(engaged)) {
    if (state.currentEl) {
      scheduleClose();
    } else {
      clearOpenTimer();
    }
  }
}

function onDocumentMove(event) {
  if (state.hitTestFrame) return;
  const { clientX, clientY } = event;
  state.hitTestFrame = globalThis.requestAnimationFrame(() => {
    state.hitTestFrame = null;
    runHitTest(clientX, clientY);
  });
}

function bindHitTest() {
  if (state.hitTestBound || !hasDocument() || !globalThis.requestAnimationFrame) return;
  document.addEventListener('mousemove', onDocumentMove, { passive: true });
  state.hitTestBound = true;
}

function unbindHitTest() {
  if (!state.hitTestBound) return;
  document.removeEventListener('mousemove', onDocumentMove);
  if (state.hitTestFrame) {
    globalThis.cancelAnimationFrame(state.hitTestFrame);
    state.hitTestFrame = null;
  }
  state.hitTestBound = false;
}

// Disabled elements never dispatch mouse events, so they need the document-level hit test.
// It is installed only while at least one such trigger is registered.
function syncDisabledTracking(el) {
  const entry = registry.get(el);
  if (!entry) return;

  const tracked = Boolean(entry.text) && !entry.suppressed && isElementDisabled(el);
  if (tracked === entry.tracked) return;

  entry.tracked = tracked;
  state.disabledCount += tracked ? 1 : -1;
  if (state.disabledCount < 0) state.disabledCount = 0;

  if (state.disabledCount > 0) bindHitTest();
  else unbindHitTest();
}

// An empty title means "no advisory information" and stops the browser inheriting an ancestor's
// title, which inputs put on the wrapper that also holds their buttons
function syncTitleGuard(el, active) {
  const entry = registry.get(el);

  if (active && !el.hasAttribute('title')) {
    el.setAttribute('title', '');
    entry.ownsTitleGuard = true;
    return;
  }

  // The trigger went inert, or something wrote a real title over ours
  if (entry.ownsTitleGuard && (!active || el.getAttribute('title'))) {
    if (el.getAttribute('title') === '') el.removeAttribute('title');
    entry.ownsTitleGuard = false;
  }
}

function applyEntry(el) {
  const entry = registry.get(el);
  if (!entry) return;

  const active = Boolean(entry.text) && !entry.suppressed;
  if (active) el.setAttribute(MARKER_ATTR, entry.text);
  else el.removeAttribute(MARKER_ATTR);
  syncTitleGuard(el, active);
  syncDisabledTracking(el);
}

function warnOnTitleConflict(el, entry) {
  if (!entry.text || !el.getAttribute('title')) return;
  logWarn(
    'v-tooltip: element also has a "title" attribute, so the browser will show its own tooltip on top. Remove the "title" attribute.',
    useLx().getGlobals()?.environment
  );
}

function mounted(el, binding) {
  const entry = {
    ...normalizeValue(binding.value),
    ownsAria: false,
    ownsTitleGuard: false,
    tracked: false,
  };
  registry.set(el, entry);
  applyEntry(el);

  el.addEventListener('mousemove', onTriggerMove);
  el.addEventListener('mouseleave', onTriggerLeave);

  warnOnTitleConflict(el, entry);
}

function updated(el, binding) {
  const entry = registry.get(el);
  if (!entry) {
    mounted(el, binding);
    return;
  }

  const next = normalizeValue(binding.value);
  const textChanged = next.text !== entry.text;
  entry.text = next.text;
  entry.suppressed = next.suppressed;
  entry.onToggle = next.onToggle;
  applyEntry(el);

  if (state.currentEl !== el) return;

  if (isInert(el, entry)) {
    hide();
    return;
  }

  if (textChanged && state.isOpen) {
    state.nodes.text.textContent = entry.text;
    const saved = state.savedCursorPos;
    // Re-clamp – the new text may have changed the panel's width
    if (saved) positionPanel(saved.x, saved.y + CURSOR_HEIGHT);
  }
}

function unmounted(el) {
  if (state.armedEl === el) clearOpenTimer();
  if (state.currentEl === el) hide();

  const entry = registry.get(el);
  if (entry) {
    entry.text = '';
    syncTitleGuard(el, false);
    syncDisabledTracking(el);
  }

  el.removeEventListener('mousemove', onTriggerMove);
  el.removeEventListener('mouseleave', onTriggerLeave);
  el.removeAttribute(MARKER_ATTR);
  registry.delete(el);

  if (!state.armedEl && !state.currentEl) unbindGlobals();
}

/**
 * Opens the tooltip of a `v-tooltip` trigger without a hover, just below the element.
 * @param {HTMLElement} el
 */
export function openTooltip(el) {
  const entry = registry.get(el);
  if (!entry?.text || entry.suppressed || el.parentElement?.closest(NESTED_TOOLTIP_SELECTOR))
    return;
  if (state.currentEl === el && state.isOpen) return;

  hide();
  bindGlobals();
  const rect = el.getBoundingClientRect();
  show(el, rect.left, rect.bottom - CURSOR_HEIGHT);
}

/**
 * Dismisses the currently visible tooltip, if any.
 * @param {HTMLElement} [el] only close it when it belongs to this trigger
 */
export function closeTooltip(el) {
  if (el && state.currentEl !== el && state.armedEl !== el) return;
  hide();
}

/** @type {import('vue').ObjectDirective<HTMLElement, string | number | { value?: string, disabled?: boolean, onToggle?: (open: boolean) => void }>} */
export const vTooltip = {
  mounted,
  updated,
  unmounted,
  getSSRProps: () => ({}),
};

export default vTooltip;
