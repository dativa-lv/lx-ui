import { describe, test, expect, afterEach, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import {
  vTooltip,
  closeTooltip,
  OPEN_DELAY,
  CLOSE_DELAY,
  MOVE_THRESHOLD,
  CURSOR_HEIGHT,
  VIEWPORT_MARGIN,
} from '@/directives/tooltip';

let wrapper;

// Triggers are mounted through a tiny host component so `v-tooltip` sits in a real template
function mountHost(value, { attrs = '', tag = 'button', directive = vTooltip } = {}) {
  return mount(
    {
      props: { tooltip: { default: null } },
      template: `<${tag} class="trigger" v-tooltip="tooltip" ${attrs}>Trigger</${tag}>`,
      directives: { tooltip: directive },
    },
    { props: { tooltip: value }, attachTo: document.body }
  );
}

function trigger() {
  return document.querySelector('.trigger');
}

function popper() {
  return document.querySelector('#poppers .popper, body > .popper');
}

function tooltipText() {
  return document.querySelector('.lx-tooltip-text')?.textContent ?? null;
}

function move(el, x, y) {
  el.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }));
}

function leave(el, relatedTarget = document.body) {
  el.dispatchEvent(new MouseEvent('mouseleave', { relatedTarget, bubbles: false }));
}

function open(el, x = 100, y = 100) {
  move(el, x, y);
  vi.advanceTimersByTime(OPEN_DELAY);
}

// happy-dom has no layout: a static block fills its container, a fixed box shrinks to fit and
// wraps into whatever space is left when it sits near the viewport edge
function stubShrinkToFitLayout({ naturalWidth = 120, height = 20 } = {}) {
  const original = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function getRect() {
    if (this.style.position !== 'fixed') {
      return { width: globalThis.innerWidth, height, x: 0, y: 0 };
    }
    const left = Number.parseFloat(this.style.left) || 0;
    const available = Math.max(globalThis.innerWidth - left, 0);
    const width = Math.min(naturalWidth, available);
    return { width, height: height * Math.ceil(naturalWidth / Math.max(width, 1)), x: left, y: 0 };
  };
  return () => {
    HTMLElement.prototype.getBoundingClientRect = original;
  };
}

beforeEach(() => {
  const poppers = document.createElement('div');
  poppers.id = 'poppers';
  document.body.appendChild(poppers);
  vi.useFakeTimers();
});

afterEach(() => {
  // The controller is module-level singleton state, so it must be reset between tests
  closeTooltip();
  if (wrapper) {
    wrapper.unmount();
    wrapper = null;
  }
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('v-tooltip opening', () => {
  test('nothing is shown before the open delay elapses', () => {
    wrapper = mountHost('Tooltip text');

    move(trigger(), 100, 100);
    vi.advanceTimersByTime(OPEN_DELAY - 1);
    expect(popper()).toBeNull();

    vi.advanceTimersByTime(1);
    expect(popper()).not.toBeNull();
  });

  test('renders the LxTooltip DOM structure inside #poppers', () => {
    wrapper = mountHost('Tooltip text');
    open(trigger());

    const node = document.querySelector('#poppers > .popper');
    expect(node).not.toBeNull();
    expect(node.classList.contains('higher-z-index')).toBe(true);

    const info = node.firstElementChild;
    expect(info.className).toBe('lx-info-wrapper lx-tooltip-kind');

    const panel = info.firstElementChild;
    expect(panel.className).toBe('lx-info-wrapper-panel');
    expect(panel.getAttribute('role')).toBe('tooltip');
    expect(panel.getAttribute('aria-hidden')).toBe('false');

    const area = panel.firstElementChild;
    expect(area.className).toBe('lx-info-wrapper-panel-area');
    expect(area.firstElementChild.className).toBe('lx-tooltip-text');
    expect(tooltipText()).toBe('Tooltip text');
  });

  test('is positioned below the cursor with fixed positioning', () => {
    wrapper = mountHost('Tooltip text');
    open(trigger(), 42, 84);

    const { style } = popper();
    expect(style.position).toBe('fixed');
    expect(style.left).toBe('42px');
    expect(style.top).toBe(`${84 + CURSOR_HEIGHT}px`);
  });

  test('negative cursor coordinates are clamped to the viewport', () => {
    wrapper = mountHost('Tooltip text');
    open(trigger(), -50, -50);

    const { style } = popper();
    expect(style.left).toBe(`${VIEWPORT_MARGIN}px`);
    expect(style.top).toBe(`${VIEWPORT_MARGIN}px`);
  });

  test('is not clamped hard left on the very first hover', async () => {
    const restore = stubShrinkToFitLayout();

    // the panel node is a module singleton, so a fresh module is what makes this the first show
    vi.resetModules();
    const fresh = await import('@/directives/tooltip');

    try {
      wrapper = mountHost('Tooltip text', { directive: fresh.vTooltip });
      open(trigger(), 100, 100);

      expect(popper().style.left).toBe('100px');
    } finally {
      fresh.closeTooltip();
      restore();
    }
  });

  test('keeps its natural width when the pointer is at the right edge', () => {
    const restore = stubShrinkToFitLayout();

    try {
      wrapper = mountHost('Tooltip text');
      // Well past the point where the panel no longer fits to the right of the pointer
      open(trigger(), globalThis.innerWidth - 10, 100);

      // Clamped by the full 120px, not by the sliver of space left at the cursor
      expect(popper().style.left).toBe(`${globalThis.innerWidth - 120 - VIEWPORT_MARGIN}px`);
    } finally {
      restore();
    }
  });

  test('a classic scrollbar does not eat into the panel', () => {
    const restore = stubShrinkToFitLayout();
    // Windows and Linux scrollbars take layout space, so the layout viewport is narrower
    // than `innerWidth` – the panel has to be clamped to the former
    const gutter = 17;
    Object.defineProperty(document.documentElement, 'clientWidth', {
      configurable: true,
      get: () => globalThis.innerWidth - gutter,
    });

    try {
      wrapper = mountHost('Tooltip text');
      open(trigger(), globalThis.innerWidth - 20, 100);

      const expected = globalThis.innerWidth - gutter - 120 - VIEWPORT_MARGIN;
      expect(popper().style.left).toBe(`${expected}px`);
    } finally {
      delete document.documentElement.clientWidth;
      restore();
    }
  });

  test('every mousemove restarts the open debounce', () => {
    wrapper = mountHost('Tooltip text');
    const el = trigger();

    move(el, 100, 100);
    vi.advanceTimersByTime(OPEN_DELAY - 50);
    move(el, 101, 100);
    vi.advanceTimersByTime(OPEN_DELAY - 50);
    expect(popper()).toBeNull();

    vi.advanceTimersByTime(50);
    expect(popper()).not.toBeNull();
  });

  test('sets the marker attribute and an empty title guard', () => {
    wrapper = mountHost('Tooltip text');
    expect(trigger().getAttribute('data-lx-tooltip')).toBe('Tooltip text');
    expect(trigger().getAttribute('title')).toBe('');
  });
});

describe('v-tooltip dismissing', () => {
  test('moving further than the threshold closes it and re-arms', () => {
    wrapper = mountHost('Tooltip text');
    const el = trigger();
    open(el, 100, 100);

    move(el, 100 + MOVE_THRESHOLD, 100);
    expect(popper()).not.toBeNull();

    move(el, 100 + MOVE_THRESHOLD + 1, 100);
    expect(popper()).toBeNull();

    // Re-arms, so the next dwell opens it again
    open(el, 200, 200);
    expect(popper()).not.toBeNull();
  });

  test('moving the pointer onto the panel closes it', () => {
    wrapper = mountHost('Tooltip text');
    open(trigger());

    document
      .querySelector('.lx-info-wrapper.lx-tooltip-kind')
      .dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 120 }));

    expect(popper()).toBeNull();
  });

  test('mouseleave closes after the close delay', () => {
    wrapper = mountHost('Tooltip text');
    const el = trigger();
    open(el);

    leave(el);
    vi.advanceTimersByTime(CLOSE_DELAY - 1);
    expect(popper()).not.toBeNull();

    vi.advanceTimersByTime(1);
    expect(popper()).toBeNull();
  });

  test('mouseleave into the panel keeps it open', () => {
    wrapper = mountHost('Tooltip text');
    const el = trigger();
    open(el);

    leave(el, document.querySelector('.lx-tooltip-text'));
    vi.advanceTimersByTime(CLOSE_DELAY * 5);
    expect(popper()).not.toBeNull();
  });

  test('leaving the window (relatedTarget null) closes it', () => {
    wrapper = mountHost('Tooltip text');
    const el = trigger();
    open(el);

    leave(el, null);
    vi.advanceTimersByTime(CLOSE_DELAY);
    expect(popper()).toBeNull();
  });

  test.each([
    ['contextmenu', () => document.dispatchEvent(new MouseEvent('contextmenu'))],
    ['scroll', () => document.dispatchEvent(new Event('scroll'))],
    ['Escape', () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))],
    ['blur', () => trigger().dispatchEvent(new FocusEvent('focusout', { bubbles: true }))],
  ])('%s closes it', (name, fire) => {
    wrapper = mountHost('Tooltip text');
    open(trigger());
    expect(popper()).not.toBeNull();

    fire();
    expect(popper()).toBeNull();
  });

  test('adds no focus listeners to the trigger, which would make SVG elements focusable', () => {
    wrapper = mountHost('Tooltip text');
    const spy = vi.spyOn(trigger(), 'addEventListener');
    open(trigger());

    const types = spy.mock.calls.map(([type]) => type);
    expect(types).not.toContain('blur');
    expect(types).not.toContain('focusout');
  });
});

describe('v-tooltip nesting', () => {
  function mountNested(innerValue) {
    return mount(
      {
        props: { inner: { default: null } },
        template: `<div v-tooltip="'outer'">
            out
            <div class="trigger inner" v-tooltip="inner">in</div>
            out
          </div>`,
        directives: { tooltip: vTooltip },
      },
      { props: { inner: innerValue }, attachTo: document.body }
    );
  }

  test('the nearest trigger wins, like a native title attribute', () => {
    wrapper = mountNested('inner');

    open(document.querySelector('.inner'));

    expect(tooltipText()).toBe('inner');
  });

  test('an inert nested trigger falls through to its ancestor', () => {
    wrapper = mountNested('');

    open(document.querySelector('.inner'));

    expect(tooltipText()).toBe('outer');
  });
});

describe('v-tooltip inner native titles', () => {
  function mountInner(attrs) {
    return mount(
      {
        template: `<button class="trigger" v-tooltip="'Button tooltip'">
            <span class="inner" ${attrs}>x</span>
          </button>`,
        directives: { tooltip: vTooltip },
      },
      { attachTo: document.body }
    );
  }

  function inner() {
    return document.querySelector('.inner');
  }

  test('a descendant with its own title owns the hover', () => {
    wrapper = mountInner('title="Inner title"');

    open(inner());

    // The browser draws the descendant's title; ours would have stacked on top of it
    expect(popper()).toBeNull();
    expect(inner().getAttribute('title')).toBe('Inner title');
  });

  test('the trigger still opens everywhere else', () => {
    wrapper = mountInner('title="Inner title"');

    open(trigger());

    expect(tooltipText()).toBe('Button tooltip');
  });

  test('moving from the trigger onto it dismisses the open tooltip', () => {
    wrapper = mountInner('title="Inner title"');
    open(trigger());
    expect(popper()).not.toBeNull();

    move(inner(), 100, 100);

    expect(popper()).toBeNull();
  });

  test('an empty title is a guard, not an owner', () => {
    wrapper = mountInner('title=""');

    open(inner());

    expect(tooltipText()).toBe('Button tooltip');
  });

  test('a nested v-tooltip still wins over the trigger', () => {
    wrapper = mount(
      {
        template: `<button class="trigger" v-tooltip="'Button tooltip'">
            <span class="inner" v-tooltip="'Inner tooltip'">x</span>
          </button>`,
        directives: { tooltip: vTooltip },
      },
      { attachTo: document.body }
    );

    open(inner());

    expect(tooltipText()).toBe('Inner tooltip');
  });
});

describe('v-tooltip inert states', () => {
  test('an empty value registers no marker and never opens', () => {
    wrapper = mountHost('');
    const el = trigger();
    expect(el.hasAttribute('data-lx-tooltip')).toBe(false);

    open(el);
    expect(popper()).toBeNull();
  });

  test('the object form can be disabled', () => {
    wrapper = mountHost({ value: 'Tooltip text', disabled: true });
    const el = trigger();
    expect(el.hasAttribute('data-lx-tooltip')).toBe(false);

    open(el);
    expect(popper()).toBeNull();
  });

  test('touch devices get no tooltip', async () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = (query) => ({
      matches: /hover:\s*none/.test(query),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    });

    // The query is built once and reused, so this needs a module that has not run it yet
    vi.resetModules();
    const fresh = await import('@/directives/tooltip');

    try {
      wrapper = mountHost('Tooltip text', { directive: fresh.vTooltip });
      open(trigger());
      expect(popper()).toBeNull();
    } finally {
      fresh.closeTooltip();
      window.matchMedia = originalMatchMedia;
    }
  });

  test('does not open when nested inside an LxTooltip trigger', () => {
    wrapper = mount(
      {
        template: `<div class="lx-info-wrapper-content lx-tooltip-kind">
            <button class="trigger" v-tooltip="'Tooltip text'">Trigger</button>
          </div>`,
        directives: { tooltip: vTooltip },
      },
      { attachTo: document.body }
    );

    open(trigger());
    expect(popper()).toBeNull();
  });

  test('does not open when nested inside an LxInfoWrapper trigger with a panel', () => {
    wrapper = mount(
      {
        template: `<div class="lx-info-wrapper-content lx-rich-kind">
            <button class="trigger" v-tooltip="'Tooltip text'">Trigger</button>
          </div>`,
        directives: { tooltip: vTooltip },
      },
      { attachTo: document.body }
    );

    open(trigger());
    expect(popper()).toBeNull();
  });

  test('opens inside an LxInfoWrapper trigger that has no panel', () => {
    wrapper = mount(
      {
        template: `<div class="lx-info-wrapper-content lx-rich-kind lx-disabled">
            <button class="trigger" v-tooltip="'Tooltip text'">Trigger</button>
          </div>`,
        directives: { tooltip: vTooltip },
      },
      { attachTo: document.body }
    );

    open(trigger());
    expect(tooltipText()).toBe('Tooltip text');
  });
});

describe('v-tooltip updates', () => {
  test('a changed value is swapped in place while visible', async () => {
    wrapper = mountHost('First text');
    open(trigger());
    expect(tooltipText()).toBe('First text');

    await wrapper.setProps({ tooltip: 'Second text' });
    expect(popper()).not.toBeNull();
    expect(tooltipText()).toBe('Second text');
    expect(trigger().getAttribute('data-lx-tooltip')).toBe('Second text');
  });

  test('clearing the value closes a visible tooltip', async () => {
    wrapper = mountHost('First text');
    open(trigger());

    await wrapper.setProps({ tooltip: null });
    expect(popper()).toBeNull();
    expect(trigger().hasAttribute('data-lx-tooltip')).toBe(false);
  });
});

describe('v-tooltip teardown', () => {
  test('unmounting while visible removes the panel and all timers', () => {
    wrapper = mountHost('Tooltip text');
    open(trigger());
    expect(popper()).not.toBeNull();

    wrapper.unmount();
    wrapper = null;

    expect(popper()).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  test('only one panel node exists no matter how many triggers are hovered', () => {
    wrapper = mount(
      {
        template: `<div>
            <button class="trigger first" v-tooltip="'First'">First</button>
            <button class="trigger second" v-tooltip="'Second'">Second</button>
          </div>`,
        directives: { tooltip: vTooltip },
      },
      { attachTo: document.body }
    );

    open(document.querySelector('.first'), 10, 10);
    open(document.querySelector('.second'), 200, 200);

    expect(document.querySelectorAll('.popper').length).toBe(1);
    expect(tooltipText()).toBe('Second');
  });

  test('falls back to another container and an inline z-index without #poppers', () => {
    document.getElementById('poppers').remove();
    wrapper = mountHost('Tooltip text');

    open(trigger());

    const node = document.querySelector('.popper');
    expect(node).not.toBeNull();
    expect(node.parentElement).toBe(document.body);
    expect(node.style.zIndex).toBe('9000');
  });
});

describe('v-tooltip native titles', () => {
  // Inputs title the wrapper that also holds their buttons; without a guard the browser draws
  // its own tooltip for the wrapper next to ours
  function mountWrapped() {
    return mount(
      {
        template: `<div class="wrap" title="Selected value">
            <button class="trigger" v-tooltip="'Clear selection'">x</button>
          </div>`,
        directives: { tooltip: vTooltip },
      },
      { attachTo: document.body }
    );
  }

  function wrap() {
    return document.querySelector('.wrap');
  }

  test('the guard is static and the ancestor title is never touched', () => {
    wrapper = mountWrapped();
    const el = trigger();
    expect(el.getAttribute('title')).toBe('');

    open(el);
    expect(wrap().getAttribute('title')).toBe('Selected value');

    leave(el);
    vi.advanceTimersByTime(CLOSE_DELAY);
    expect(wrap().getAttribute('title')).toBe('Selected value');
    expect(el.getAttribute('title')).toBe('');
  });

  test('a real title on the trigger is left alone', () => {
    wrapper = mountHost('Tooltip text', { attrs: 'title="Own title"' });

    expect(trigger().getAttribute('title')).toBe('Own title');
  });

  test('the guard is dropped when the value goes inert', async () => {
    wrapper = mountHost('Tooltip text');

    await wrapper.setProps({ tooltip: '' });

    expect(trigger().hasAttribute('title')).toBe(false);
  });

  test('the guard is dropped on unmount', () => {
    wrapper = mountWrapped();
    const el = trigger();

    wrapper.unmount();
    wrapper = null;

    expect(el.hasAttribute('title')).toBe(false);
  });
});

describe('v-tooltip disabled triggers', () => {
  // Disabled controls dispatch no mouse events – the directive drives them from a hit test
  function hover(target, x = 100, y = 100) {
    document.elementFromPoint = () => target;
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }));
    vi.advanceTimersByTime(16);
  }

  let originalElementFromPoint;

  beforeEach(() => {
    originalElementFromPoint = document.elementFromPoint;
  });

  afterEach(() => {
    document.elementFromPoint = originalElementFromPoint;
  });

  test('a pending open is cancelled when the pointer moves off', () => {
    wrapper = mountHost('Tooltip text', { attrs: 'disabled' });

    hover(trigger());
    hover(document.body, 400, 400);
    vi.advanceTimersByTime(OPEN_DELAY);

    expect(popper()).toBeNull();
  });

  test('dwelling on one still opens the tooltip', () => {
    wrapper = mountHost('Tooltip text', { attrs: 'disabled' });

    hover(trigger());
    vi.advanceTimersByTime(OPEN_DELAY);

    expect(tooltipText()).toBe('Tooltip text');
  });

  test('a visible tooltip is dismissed when the pointer moves off', () => {
    wrapper = mountHost('Tooltip text', { attrs: 'disabled' });

    hover(trigger());
    vi.advanceTimersByTime(OPEN_DELAY);
    expect(popper()).not.toBeNull();

    hover(document.body, 400, 400);
    vi.advanceTimersByTime(CLOSE_DELAY);

    expect(popper()).toBeNull();
  });
});

describe('v-tooltip accessibility', () => {
  test('wires aria-describedby when the trigger has none', () => {
    wrapper = mountHost('Tooltip text');
    const el = trigger();
    open(el);

    expect(el.getAttribute('aria-describedby')).toBe('lx-tooltip-panel');
    expect(document.querySelector('#lx-tooltip-panel').getAttribute('aria-hidden')).toBe('false');

    closeTooltip();
    expect(el.hasAttribute('aria-describedby')).toBe(false);
  });

  test('leaves an existing aria-describedby alone and hides the panel from AT', () => {
    wrapper = mountHost('Tooltip text', { attrs: 'aria-describedby="own-description"' });
    const el = trigger();
    open(el);

    expect(el.getAttribute('aria-describedby')).toBe('own-description');
    expect(document.querySelector('#lx-tooltip-panel').getAttribute('aria-hidden')).toBe('true');
  });
});
