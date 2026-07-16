/* eslint-disable no-restricted-imports */
import { describe, test, expect, afterEach, beforeEach, vi } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import LxDataGrid from '@/components/DataGrid.vue';
import * as devUtils from '@/utils/devUtils';
import {
  actionDefinitionsCommon,
  checkActionDefinitionsButtonsSingle,
  checkActionDefinitionsButtonsMultiple,
} from './helpers/actionDefinitionsHelpers';

const tanstackVirtual = vi.hoisted(() => ({
  useVirtualizer: undefined,
  useWindowVirtualizer: undefined,
}));

vi.mock('@tanstack/vue-virtual', () => ({
  useVirtualizer: (...args) => tanstackVirtual.useVirtualizer?.(...args),
  useWindowVirtualizer: (...args) => tanstackVirtual.useWindowVirtualizer?.(...args),
}));

let wrapper;

async function flushVirtualizationSetup() {
  const flushStep = () => Promise.resolve().then(() => nextTick());

  return Array.from({ length: 5 }).reduce(
    (promise) => promise.then(() => flushStep()),
    Promise.resolve()
  );
}

function mountComponent({ props = {}, attachTo } = {}) {
  expect(LxDataGrid).toBeTruthy();

  return mount(LxDataGrid, {
    props,
    attachTo,
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
      },
    },
  });
}

beforeEach(() => {
  const el = document.createElement('div');
  el.id = 'poppers';
  document.body.appendChild(el);
});

afterEach(() => {
  vi.restoreAllMocks();
  tanstackVirtual.useVirtualizer = undefined;
  tanstackVirtual.useWindowVirtualizer = undefined;
  document.body.innerHTML = '';
  if (wrapper) {
    wrapper.unmount();
  }
});

test('LxDataGrid component mounts successfully', () => {
  wrapper = mountComponent();

  expect(wrapper.exists()).toBe(true);
});

describe('Scrollable performance', () => {
  const props = {
    idAttribute: 'id',
    items: [
      {
        id: 'testItem',
        name: 'Test item',
      },
    ],
    columnDefinitions: [
      {
        id: 'name',
        attributeName: 'name',
        name: 'Name',
      },
    ],
    scrollable: true,
    // These tests assert synchronous DOM and don't drive a real virtualizer
    // mock — opt out of virtualization so the grid renders rows immediately
    // (the F1 LCP guard otherwise correctly defers rendering until the
    // virtualizer initializes).
    hasVirtualization: false,
  };

  test('coalesces content scroll sync into one animation frame', async () => {
    const callbacks = [];
    const requestAnimationFrameSpy = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callbacks.push(callback);
        return callbacks.length;
      });
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});

    wrapper = mountComponent({ props });

    const grid = wrapper.find('.lx-data-grid');
    const header = wrapper.find('.lx-grid-header-wrapper > .lx-grid-row[role="toolbar"]');

    // Let the mount/virtualization setup (which schedules its own animation
    // frame to settle initial row heights) finish before measuring scroll sync.
    await flushVirtualizationSetup();

    callbacks.length = 0;
    requestAnimationFrameSpy.mockClear();

    grid.element.scrollLeft = 120;
    await grid.trigger('scroll');
    await grid.trigger('scroll');

    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(1);

    callbacks[0]();

    expect(header.element.scrollLeft).toBe(120);
  });

  test('does not write a stale header echo back onto the content during momentum', async () => {
    const callbacks = [];
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});

    wrapper = mountComponent({ props });

    const grid = wrapper.find('.lx-data-grid');
    const header = wrapper.find('.lx-grid-header-wrapper > .lx-grid-row[role="toolbar"]');

    await flushVirtualizationSetup();
    callbacks.length = 0;

    // Body scrolls; the header mirrors it.
    grid.element.scrollLeft = 120;
    await grid.trigger('scroll');
    callbacks.shift()();
    expect(header.element.scrollLeft).toBe(120);

    // Momentum carries the body further before the header's mirrored scroll
    // event is processed. That echo (header still at 120) must NOT drag the body
    // back — this is the Safari jiggle.
    grid.element.scrollLeft = 200;
    await header.trigger('scroll');
    callbacks.shift()();
    expect(grid.element.scrollLeft).toBe(200);
  });

  test('still mirrors a genuine header scroll onto the content', async () => {
    const callbacks = [];
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});

    wrapper = mountComponent({ props });

    const grid = wrapper.find('.lx-data-grid');
    const header = wrapper.find('.lx-grid-header-wrapper > .lx-grid-row[role="toolbar"]');

    await flushVirtualizationSetup();
    callbacks.length = 0;

    // A real header scroll (not an echo) still drives the content both ways.
    header.element.scrollLeft = 250;
    await header.trigger('scroll');
    callbacks.shift()();
    expect(grid.element.scrollLeft).toBe(250);
  });

  test('does not force a layout read on the grid own horizontal scroll', async () => {
    const callbacks = [];
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});

    wrapper = mountComponent({ props, attachTo: document.body });

    const grid = wrapper.find('.lx-data-grid');

    await flushVirtualizationSetup();

    const boundingRead = vi.spyOn(grid.element, 'getBoundingClientRect');
    const flush = () => callbacks.splice(0).forEach((cb) => cb());

    // Horizontal scroll of the grid itself must not trigger the vertical-shadow
    // bounding update — that getBoundingClientRect, interleaved with the scroll
    // sync, is wasted layout work every frame.
    flush();
    boundingRead.mockClear();
    grid.element.dispatchEvent(new Event('scroll'));
    flush();
    expect(boundingRead).not.toHaveBeenCalled();

    // A page/ancestor scroll still refreshes the bounding for the top shadow.
    document.dispatchEvent(new Event('scroll'));
    flush();
    expect(boundingRead).toHaveBeenCalled();
  });

  test('renders rows without transition wrappers', async () => {
    wrapper = mountComponent({ props });

    await flushVirtualizationSetup();

    const row = wrapper.find('.lx-grid-content .lx-grid-row');

    expect(row.exists()).toBe(true);
  });
});

describe('Action definitions', () => {
  const props = {
    items: [
      {
        id: 'testItem',
        name: 'Test item',
      },
    ],
    actionDefinitions: [],
    // Sync DOM assertions; no real virtualizer mock — opt out of virtualization
    // so rows render immediately. The F1 LCP guard otherwise (correctly) defers.
    hasVirtualization: false,
  };

  test('no actions', () => {
    wrapper = mountComponent({ props });

    expect(wrapper.find('.lx-cell-action').exists()).toBe(false);
  });

  describe('Single action variations', () => {
    checkActionDefinitionsButtonsSingle(
      mountComponent,
      (w) => {
        wrapper = w;
      },
      '.lx-cell-action > .lx-toolbar > .lx-button',
      { props }
    );
  });

  test('renders two actions as buttons', async () => {
    const actions = [
      {
        id: 'actionOne',
        name: 'Action one',
        icon: 'ai',
      },
      {
        id: 'actionTwo',
        name: 'Action two',
        icon: 'ai',
      },
    ];

    wrapper = mountComponent({ props: { ...props, actionDefinitions: actions } });

    await flushVirtualizationSetup();

    const buttons = wrapper.findAll('.lx-cell-action > .lx-toolbar > .lx-button');

    expect(buttons.length).toBe(actions.length);

    buttons.forEach((button, i) => {
      expect(button.attributes('id')).toContain(actions[i].id);
      expect(button.attributes('aria-label')).toContain(actions[i].name);
    });
  });

  test('renders three actions: first as button, rest in dropdown', async () => {
    const actions = [
      {
        id: 'actionOne',
        name: 'Action one',
        icon: 'ai',
      },
      {
        id: 'actionTwo',
        name: 'Action two',
        icon: 'ai',
      },
      {
        id: 'actionThree',
        name: 'Action three',
        icon: 'ai',
      },
    ];

    wrapper = mountComponent({ props: { ...props, actionDefinitions: actions } });

    await flushVirtualizationSetup();

    const buttons = wrapper.findAll('.lx-cell-action > .lx-toolbar > .lx-button');

    expect(buttons.length).toBe(1);
    expect(buttons[0].attributes('id')).toContain(actions[0].id);
    expect(buttons[0].attributes('aria-label')).toContain(actions[0].name);

    const togglers = wrapper.findAll('.lx-cell-action > .lx-toolbar .lx-dropdown-toggler');

    expect(togglers.length).toBe(1);

    await togglers[0].trigger('click');

    const panel = document.body.querySelector('.lx-dropdown-panel-wrapper');
    const panelButtons = panel.querySelectorAll('.lx-button');

    expect(panelButtons.length).toBe(2);
    expect(panelButtons[0].getAttribute('id')).toContain(actions[1].id);
    expect(panelButtons[0].getAttribute('aria-label')).toContain(actions[1].name);
    expect(panelButtons[1].getAttribute('id')).toContain(actions[2].id);
    expect(panelButtons[1].getAttribute('aria-label')).toContain(actions[2].name);
  });

  test('renders many actions: first as button, rest in dropdown', async () => {
    const actionDefinitions = actionDefinitionsCommon;

    wrapper = mountComponent({ props: { ...props, actionDefinitions } });

    await flushVirtualizationSetup();

    const togglerElement = wrapper.find('.lx-cell-action > .lx-toolbar .lx-dropdown-toggler');

    expect(togglerElement.exists()).toBe(true);

    await togglerElement.trigger('click');

    const panelElement = document.body.querySelector('.lx-dropdown-panel-wrapper');
    const buttonElements = panelElement.querySelectorAll('.lx-button');
    const panelActions = actionDefinitions.slice(1);

    checkActionDefinitionsButtonsMultiple(buttonElements, {
      wrapper,
      actionDefinitionsOverride: panelActions,
    });
  });
});

describe('Badge definitions', () => {
  const props = {
    items: [
      {
        id: 'testItem',
        name: 'Test item',
      },
    ],
    showHeader: true,
  };
  const badgeDefinitions = [
    {
      id: 'actionOne',
      name: 'Action one',
      icon: 'bug',
    },
    {
      id: 'actionTwo',
      name: 'Action two',
      icon: 'flash',
    },
  ];

  test('renders two badges', () => {
    wrapper = mountComponent({ props: { ...props, badgeDefinitions } });
    const badges = wrapper.findAll('.lx-data-grid-wrapper .lx-grid-badge-wrapper > .lx-badge');

    expect(badges.length).toBe(badgeDefinitions.length);
  });

  test('badges when showHeader is false', () => {
    const propsOverride = { ...props, showHeader: false };

    wrapper = mountComponent({ props: { ...propsOverride, badgeDefinitions } });
    const badges = wrapper.findAll('.lx-data-grid-wrapper .lx-grid-badge-wrapper > .lx-badge');

    expect(badges.length).toBe(0);
  });

  test('badge labels', () => {
    wrapper = mountComponent({ props: { ...props, badgeDefinitions } });

    const badges = wrapper.findAll('.lx-data-grid-wrapper .lx-grid-badge-wrapper > .lx-badge');

    expect(badges.length).toBe(badgeDefinitions.length);
    expect(badges[0].find('.lx-badge-text').text()).toBe(badgeDefinitions[0].name);
    expect(badges[1].find('.lx-badge-text').text()).toBe(badgeDefinitions[1].name);
  });

  test('badge icons', () => {
    const badgeDef = [...badgeDefinitions];
    badgeDef[0].icon = null;

    wrapper = mountComponent({ props: { ...props, badgeDefinitions: badgeDef } });
    const badges = wrapper.findAll('.lx-data-grid-wrapper .lx-grid-badge-wrapper > .lx-badge');

    expect(badges.length).toBe(badgeDefinitions.length);
    expect(badges[0].find('desc').exists()).toBe(false);
    expect(badges[1].find('desc').text()).toBe('Piktogramma "Flash"');
  });
});

describe('Virtualization', () => {
  function createVirtualizerRef({
    rows,
    totalSize = 72,
    options,
    measure = () => {},
    measureElement = () => {},
  }) {
    return ref({
      getVirtualItems: () => rows,
      getTotalSize: () => totalSize,
      measure,
      measureElement,
      options,
      scrollToIndex: () => {},
    });
  }

  test('renders virtualized row subset when virtualization is enabled', async () => {
    const requestAnimationFrameSpy = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });
    const cancelAnimationFrameSpy = vi
      .spyOn(globalThis, 'cancelAnimationFrame')
      .mockImplementation(() => {});

    const useWindowVirtualizerMock = vi.fn((options) =>
      createVirtualizerRef({
        rows: [{ index: 1, start: 72 }],
        totalSize: 300,
        options,
      })
    );

    tanstackVirtual.useWindowVirtualizer = useWindowVirtualizerMock;

    try {
      wrapper = mountComponent({
        props: {
          hasVirtualization: true,
          idAttribute: 'id',
          items: [
            { id: 'row-1', name: 'Row 1' },
            { id: 'row-2', name: 'Row 2' },
            { id: 'row-3', name: 'Row 3' },
          ],
        },
      });

      await flushVirtualizationSetup();

      const renderedRows = wrapper.findAll('.lx-grid-content .lx-grid-row');
      expect(renderedRows.length).toBe(1);
      expect(renderedRows[0].attributes('id')).toBe('row-row-2');

      const content = wrapper.find('.lx-grid-content');
      expect(content.attributes('class')).toContain('lx-grid-content-virtualized');
      expect(content.attributes('style')).toContain('height: 300px');

      expect(useWindowVirtualizerMock).toHaveBeenCalled();
    } finally {
      requestAnimationFrameSpy.mockRestore();
      cancelAnimationFrameSpy.mockRestore();
    }
  });

  test('delegates rendered virtual row measurement to the virtualizer', async () => {
    const makeRect = ({ top = 0, height = 0, width = 100 } = {}) => ({
      x: 0,
      y: top,
      top,
      left: 0,
      right: width,
      bottom: top + height,
      width,
      height,
      toJSON: () => ({}),
    });

    const getBoundingClientRectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function mockGetBoundingClientRect() {
        if (this?.id === 'row-row-1') {
          return makeRect({ height: 48 });
        }

        if (this?.id === 'row-row-2') {
          return makeRect({ height: 80 });
        }

        if (this?.classList?.contains('lx-cell-header')) {
          return makeRect({ width: 120, height: 48 });
        }

        return makeRect();
      });

    const requestAnimationFrameSpy = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });
    const cancelAnimationFrameSpy = vi
      .spyOn(globalThis, 'cancelAnimationFrame')
      .mockImplementation(() => {});

    const measureElementSpy = vi.fn();
    const useWindowVirtualizerMock = vi.fn((options) =>
      createVirtualizerRef({
        rows: [
          { index: 0, start: 0 },
          { index: 1, start: 72 },
        ],
        // 3 rows / 216px => 72px average, below the tall-row threshold.
        totalSize: 216,
        options,
        measureElement: measureElementSpy,
      })
    );

    tanstackVirtual.useWindowVirtualizer = useWindowVirtualizerMock;

    try {
      wrapper = mountComponent({
        props: {
          id: 'grid-measured-estimate',
          hasVirtualization: true,
          idAttribute: 'id',
          items: [
            { id: 'row-1', name: 'Row 1' },
            { id: 'row-2', name: 'Row 2' },
            { id: 'row-3', name: 'Row 3' },
          ],
        },
      });

      await flushVirtualizationSetup();

      const [options] = useWindowVirtualizerMock.mock.calls[0];
      expect(options.overscan).toBe(6);
      expect(options.estimateSize(0)).toBe(72);
      expect(options.estimateSize(1)).toBe(72);
      expect(measureElementSpy).toHaveBeenCalled();
      expect(measureElementSpy).toHaveBeenCalledWith(expect.any(HTMLElement));
    } finally {
      getBoundingClientRectSpy.mockRestore();
      requestAnimationFrameSpy.mockRestore();
      cancelAnimationFrameSpy.mockRestore();
    }
  });

  test('applies scroll margin when window virtualization starts below the viewport top', async () => {
    Object.defineProperty(globalThis, 'scrollY', {
      value: 0,
      writable: true,
      configurable: true,
    });

    const getBoundingClientRectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function mockGetBoundingClientRect() {
        const top = this?.id === 'grid-scroll-margin' ? 100 : 0;

        return {
          x: 0,
          y: top,
          top,
          left: 0,
          right: 0,
          bottom: top,
          width: 0,
          height: 0,
          toJSON: () => ({}),
        };
      });

    const requestAnimationFrameSpy = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });
    const cancelAnimationFrameSpy = vi
      .spyOn(globalThis, 'cancelAnimationFrame')
      .mockImplementation(() => {});

    const useWindowVirtualizerMock = vi.fn((options) =>
      createVirtualizerRef({
        rows: [{ index: 1, start: 120 }],
        totalSize: 300,
        options,
      })
    );

    tanstackVirtual.useWindowVirtualizer = useWindowVirtualizerMock;

    try {
      wrapper = mountComponent({
        props: {
          id: 'grid-scroll-margin',
          hasVirtualization: true,
          idAttribute: 'id',
          items: [
            { id: 'row-1', name: 'Row 1' },
            { id: 'row-2', name: 'Row 2' },
            { id: 'row-3', name: 'Row 3' },
          ],
        },
      });

      await flushVirtualizationSetup();

      const renderedRows = wrapper.findAll('.lx-grid-content .lx-grid-row');
      expect(renderedRows.length).toBe(1);
      expect(renderedRows[0].attributes('style')).toContain('transform: translateY(20px)');

      const [options] = useWindowVirtualizerMock.mock.calls[0];
      expect(options.scrollMargin).toBe(100);
    } finally {
      getBoundingClientRectSpy.mockRestore();
      requestAnimationFrameSpy.mockRestore();
      cancelAnimationFrameSpy.mockRestore();
    }
  });

  test('updates virtual offsets independently for multiple grids after position changes', async () => {
    const getTopByGridId = {
      'grid-a': 100,
      'grid-b': 300,
    };

    Object.defineProperty(globalThis, 'scrollY', {
      value: 0,
      writable: true,
      configurable: true,
    });

    const getBoundingClientRectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function mockGetBoundingClientRect() {
        const elementId = this?.id;
        const top = getTopByGridId[elementId] ?? 0;

        return {
          x: 0,
          y: top,
          top,
          left: 0,
          right: 0,
          bottom: top,
          width: 0,
          height: 0,
          toJSON: () => ({}),
        };
      });

    const requestAnimationFrameSpy = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });
    const cancelAnimationFrameSpy = vi
      .spyOn(globalThis, 'cancelAnimationFrame')
      .mockImplementation(() => {});

    const useWindowVirtualizerMock = vi.fn((options) =>
      createVirtualizerRef({
        rows: [{ index: 0, start: 120 }],
        totalSize: 300,
        options,
      })
    );

    tanstackVirtual.useWindowVirtualizer = useWindowVirtualizerMock;

    const items = Array.from({ length: 5 }, (_, index) => ({
      id: `row-${index}`,
      name: `Row ${index}`,
    }));

    let wrapperB;
    try {
      const wrapperA = mountComponent({
        props: {
          id: 'grid-a',
          hasVirtualization: true,
          idAttribute: 'id',
          items,
        },
      });
      wrapper = wrapperA;

      wrapperB = mountComponent({
        props: {
          id: 'grid-b',
          hasVirtualization: true,
          idAttribute: 'id',
          items,
        },
      });

      await flushVirtualizationSetup();

      const initialScrollMargins = useWindowVirtualizerMock.mock.calls
        .map(([options]) => options?.scrollMargin)
        .filter((value) => Number.isFinite(value));
      expect(initialScrollMargins).toContain(100);
      expect(initialScrollMargins).toContain(300);

      getTopByGridId['grid-a'] = 50;
      getTopByGridId['grid-b'] = 250;

      if (globalThis.dispatchEvent) {
        globalThis.dispatchEvent(new Event('resize'));
      }
      if (typeof window !== 'undefined' && window?.dispatchEvent) {
        window.dispatchEvent(new Event('resize'));
      }
      await flushVirtualizationSetup();

      const updatedScrollMargins = useWindowVirtualizerMock.mock.calls
        .map(([options]) => options?.scrollMargin)
        .filter((value) => Number.isFinite(value));
      expect(updatedScrollMargins).toContain(50);
      expect(updatedScrollMargins).toContain(250);
    } finally {
      wrapperB?.unmount();
      getBoundingClientRectSpy.mockRestore();
      requestAnimationFrameSpy.mockRestore();
      cancelAnimationFrameSpy.mockRestore();
    }
  });

  test('disables virtualization while the desktop grid is hidden and restores it when visible again', async () => {
    const requestAnimationFrameSpy = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });
    const cancelAnimationFrameSpy = vi
      .spyOn(globalThis, 'cancelAnimationFrame')
      .mockImplementation(() => {});

    const useWindowVirtualizerMock = vi.fn((options) =>
      createVirtualizerRef({
        rows: [{ index: 0, start: 0 }],
        totalSize: 300,
        options,
      })
    );

    tanstackVirtual.useWindowVirtualizer = useWindowVirtualizerMock;

    try {
      wrapper = mountComponent({
        props: {
          id: 'grid-hidden-desktop',
          hasVirtualization: true,
          idAttribute: 'id',
          items: [
            { id: 'row-1', name: 'Row 1' },
            { id: 'row-2', name: 'Row 2' },
            { id: 'row-3', name: 'Row 3' },
          ],
        },
      });

      await flushVirtualizationSetup();

      const grid = wrapper.get('.lx-data-grid');
      expect(wrapper.get('.lx-grid-content').classes()).toContain('lx-grid-content-virtualized');

      grid.element.style.display = 'none';
      globalThis.dispatchEvent(new Event('resize'));
      await flushVirtualizationSetup();

      expect(wrapper.get('.lx-grid-content').classes()).not.toContain(
        'lx-grid-content-virtualized'
      );

      grid.element.style.display = '';
      globalThis.dispatchEvent(new Event('resize'));
      await flushVirtualizationSetup();

      expect(wrapper.get('.lx-grid-content').classes()).toContain('lx-grid-content-virtualized');
      expect(useWindowVirtualizerMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    } finally {
      requestAnimationFrameSpy.mockRestore();
      cancelAnimationFrameSpy.mockRestore();
    }
  });

  test('uses element virtualizer when rendered inside modal', async () => {
    const requestAnimationFrameSpy = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });
    const cancelAnimationFrameSpy = vi
      .spyOn(globalThis, 'cancelAnimationFrame')
      .mockImplementation(() => {});

    const useWindowVirtualizerMock = vi.fn((options) =>
      createVirtualizerRef({
        rows: [{ index: 0, start: 0 }],
        totalSize: 300,
        options,
      })
    );
    const useVirtualizerMock = vi.fn((options) =>
      createVirtualizerRef({
        rows: [{ index: 0, start: 0 }],
        totalSize: 300,
        options,
      })
    );
    tanstackVirtual.useWindowVirtualizer = useWindowVirtualizerMock;
    tanstackVirtual.useVirtualizer = useVirtualizerMock;

    const curtain = document.createElement('div');
    curtain.className = 'lx-curtain';
    const modal = document.createElement('div');
    modal.className = 'lx-modal';
    const modalMain = document.createElement('div');
    modalMain.className = 'lx-main';
    modalMain.style.overflowY = 'auto';
    modalMain.style.height = '300px';
    modal.appendChild(modalMain);
    curtain.appendChild(modal);
    document.body.appendChild(curtain);

    const items = Array.from({ length: 50 }, (_, index) => ({
      id: `row-${index}`,
      name: `Row ${index}`,
    }));

    try {
      wrapper = mountComponent({
        props: {
          id: 'grid-modal',
          hasVirtualization: true,
          idAttribute: 'id',
          items,
        },
        attachTo: modalMain,
      });

      await flushVirtualizationSetup();

      expect(useVirtualizerMock.mock.calls.length).toBeGreaterThan(0);
      expect(useWindowVirtualizerMock).toHaveBeenCalledTimes(0);
      expect(useVirtualizerMock.mock.calls.some(([options]) => options?.getScrollElement)).toBe(
        true
      );
    } finally {
      requestAnimationFrameSpy.mockRestore();
      cancelAnimationFrameSpy.mockRestore();
    }
  });

  test('uses element virtualizer for constrained overflow parents', async () => {
    const requestAnimationFrameSpy = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });
    const cancelAnimationFrameSpy = vi
      .spyOn(globalThis, 'cancelAnimationFrame')
      .mockImplementation(() => {});

    const useWindowVirtualizerMock = vi.fn((options) =>
      createVirtualizerRef({
        rows: [{ index: 0, start: 0 }],
        totalSize: 300,
        options,
      })
    );
    const useVirtualizerMock = vi.fn((options) =>
      createVirtualizerRef({
        rows: [{ index: 0, start: 0 }],
        totalSize: 300,
        options,
      })
    );
    tanstackVirtual.useWindowVirtualizer = useWindowVirtualizerMock;
    tanstackVirtual.useVirtualizer = useVirtualizerMock;

    const constrainedParent = document.createElement('div');
    constrainedParent.style.overflowY = 'auto';
    constrainedParent.style.height = '300px';
    document.body.appendChild(constrainedParent);

    const items = Array.from({ length: 50 }, (_, index) => ({
      id: `row-${index}`,
      name: `Row ${index}`,
    }));

    try {
      wrapper = mountComponent({
        props: {
          id: 'grid-constrained-parent',
          hasVirtualization: true,
          idAttribute: 'id',
          items,
        },
        attachTo: constrainedParent,
      });

      await flushVirtualizationSetup();

      expect(useVirtualizerMock.mock.calls.length).toBeGreaterThan(0);
      expect(useWindowVirtualizerMock).toHaveBeenCalledTimes(0);
      expect(useVirtualizerMock.mock.calls.some(([options]) => options?.getScrollElement)).toBe(
        true
      );
    } finally {
      requestAnimationFrameSpy.mockRestore();
      cancelAnimationFrameSpy.mockRestore();
    }
  });

  test('does not auto-adjust scroll position when row measurements change', async () => {
    const requestAnimationFrameSpy = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });
    const cancelAnimationFrameSpy = vi
      .spyOn(globalThis, 'cancelAnimationFrame')
      .mockImplementation(() => {});

    const useWindowVirtualizerMock = vi.fn((options) =>
      createVirtualizerRef({
        rows: [{ index: 0, start: 0 }],
        totalSize: 300,
        options,
      })
    );

    tanstackVirtual.useWindowVirtualizer = useWindowVirtualizerMock;

    try {
      wrapper = mountComponent({
        props: {
          hasVirtualization: true,
          idAttribute: 'id',
          items: [
            { id: 'row-1', name: 'Row 1' },
            { id: 'row-2', name: 'Row 2' },
            { id: 'row-3', name: 'Row 3' },
          ],
        },
      });

      await flushVirtualizationSetup();

      const [options] = useWindowVirtualizerMock.mock.calls[0];
      expect(options.shouldAdjustScrollPositionOnItemSizeChange()).toBe(false);
      expect(
        options.shouldAdjustScrollPositionOnItemSizeChange(null, 12, {
          scrollDirection: 'backward',
        })
      ).toBe(false);
      expect(
        options.shouldAdjustScrollPositionOnItemSizeChange(null, 12, { scrollDirection: 'forward' })
      ).toBe(false);
      expect(
        options.shouldAdjustScrollPositionOnItemSizeChange(null, 12, { scrollDirection: null })
      ).toBe(false);
    } finally {
      requestAnimationFrameSpy.mockRestore();
      cancelAnimationFrameSpy.mockRestore();
    }
  });

  test('keeps window scroll margin stable when scroll updates only introduce subpixel jitter', async () => {
    Object.defineProperty(globalThis, 'scrollY', {
      value: 0,
      writable: true,
      configurable: true,
    });

    const getBoundingClientRectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function mockGetBoundingClientRect() {
        if (this?.id === 'grid-scroll-jitter') {
          const top = globalThis.scrollY === 0 ? 100.2 : 49.6;
          return {
            x: 0,
            y: top,
            top,
            left: 0,
            right: 0,
            bottom: top,
            width: 0,
            height: 0,
            toJSON: () => ({}),
          };
        }

        return {
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: 0,
          height: 0,
          toJSON: () => ({}),
        };
      });

    const requestAnimationFrameSpy = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });
    const cancelAnimationFrameSpy = vi
      .spyOn(globalThis, 'cancelAnimationFrame')
      .mockImplementation(() => {});

    const measureSpy = vi.fn();
    const useWindowVirtualizerMock = vi.fn((options) =>
      createVirtualizerRef({
        rows: [{ index: 0, start: 100 }],
        totalSize: 300,
        options,
        measure: measureSpy,
      })
    );

    tanstackVirtual.useWindowVirtualizer = useWindowVirtualizerMock;

    try {
      wrapper = mountComponent({
        props: {
          id: 'grid-scroll-jitter',
          hasVirtualization: true,
          idAttribute: 'id',
          items: [
            { id: 'row-1', name: 'Row 1' },
            { id: 'row-2', name: 'Row 2' },
            { id: 'row-3', name: 'Row 3' },
          ],
        },
      });

      await flushVirtualizationSetup();

      const [options] = useWindowVirtualizerMock.mock.calls[0];
      expect(options.scrollMargin).toBe(100);

      const initialMeasureCalls = measureSpy.mock.calls.length;
      globalThis.scrollY = 50;
      globalThis.dispatchEvent(new Event('scroll'));
      await flushVirtualizationSetup();

      expect(measureSpy.mock.calls.length).toBe(initialMeasureCalls);
      expect(wrapper.get('.lx-grid-content .lx-grid-row').attributes('style')).toContain(
        'transform: translateY(0px)'
      );
    } finally {
      getBoundingClientRectSpy.mockRestore();
      requestAnimationFrameSpy.mockRestore();
      cancelAnimationFrameSpy.mockRestore();
    }
  });

  test('does not remeasure virtualizer when wrapper style only changes CSS variables', async () => {
    const requestAnimationFrameSpy = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });
    const cancelAnimationFrameSpy = vi
      .spyOn(globalThis, 'cancelAnimationFrame')
      .mockImplementation(() => {});

    const measureSpy = vi.fn();
    const useWindowVirtualizerMock = vi.fn((options) =>
      createVirtualizerRef({
        rows: [{ index: 0, start: 0 }],
        totalSize: 300,
        options,
        measure: measureSpy,
      })
    );

    tanstackVirtual.useWindowVirtualizer = useWindowVirtualizerMock;

    try {
      wrapper = mountComponent({
        props: {
          id: 'grid-style-only-mutation',
          hasVirtualization: true,
          idAttribute: 'id',
          items: [
            { id: 'row-1', name: 'Row 1' },
            { id: 'row-2', name: 'Row 2' },
            { id: 'row-3', name: 'Row 3' },
          ],
        },
      });

      await flushVirtualizationSetup();

      const initialMeasureCalls = measureSpy.mock.calls.length;
      const wrapperElement = wrapper.get('.lx-data-grid-wrapper').element;
      wrapperElement.style.setProperty('--grid-top-shadow-opacity', '0.75');

      await Promise.resolve();
      await nextTick();

      expect(measureSpy.mock.calls.length).toBe(initialMeasureCalls);
    } finally {
      requestAnimationFrameSpy.mockRestore();
      cancelAnimationFrameSpy.mockRestore();
    }
  });

  test('keeps window virtualizer for unconstrained overflow parents', async () => {
    const requestAnimationFrameSpy = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });
    const cancelAnimationFrameSpy = vi
      .spyOn(globalThis, 'cancelAnimationFrame')
      .mockImplementation(() => {});

    const useWindowVirtualizerMock = vi.fn((options) =>
      createVirtualizerRef({
        rows: [{ index: 0, start: 0 }],
        totalSize: 300,
        options,
      })
    );
    const useVirtualizerMock = vi.fn((options) =>
      createVirtualizerRef({
        rows: [{ index: 0, start: 0 }],
        totalSize: 300,
        options,
      })
    );
    tanstackVirtual.useWindowVirtualizer = useWindowVirtualizerMock;
    tanstackVirtual.useVirtualizer = useVirtualizerMock;

    const overflowParent = document.createElement('div');
    overflowParent.style.overflowY = 'auto';
    document.body.appendChild(overflowParent);

    const items = Array.from({ length: 50 }, (_, index) => ({
      id: `row-${index}`,
      name: `Row ${index}`,
    }));

    try {
      wrapper = mountComponent({
        props: {
          id: 'grid-overflow-parent',
          hasVirtualization: true,
          idAttribute: 'id',
          items,
        },
        attachTo: overflowParent,
      });

      await flushVirtualizationSetup();

      expect(useWindowVirtualizerMock.mock.calls.length).toBeGreaterThan(0);
      expect(useVirtualizerMock).toHaveBeenCalledTimes(0);
    } finally {
      requestAnimationFrameSpy.mockRestore();
      cancelAnimationFrameSpy.mockRestore();
    }
  });

  test('renders all rows when virtualization is disabled', async () => {
    const useWindowVirtualizerMock = vi.fn();
    const useVirtualizerMock = vi.fn();
    tanstackVirtual.useWindowVirtualizer = useWindowVirtualizerMock;
    tanstackVirtual.useVirtualizer = useVirtualizerMock;

    wrapper = mountComponent({
      props: {
        hasVirtualization: false,
        idAttribute: 'id',
        items: [
          { id: 'row-1', name: 'Row 1' },
          { id: 'row-2', name: 'Row 2' },
          { id: 'row-3', name: 'Row 3' },
        ],
      },
    });

    await nextTick();

    const renderedRows = wrapper.findAll('.lx-grid-content .lx-grid-row');
    expect(renderedRows.length).toBe(3);
    expect(wrapper.find('.lx-grid-content').attributes('class')).not.toContain(
      'lx-grid-content-virtualized'
    );
    expect(useWindowVirtualizerMock).not.toHaveBeenCalled();
    expect(useVirtualizerMock).not.toHaveBeenCalled();
  });

  test('renders duplicate ids in virtualized mode and keeps duplicate warning', async () => {
    const requestAnimationFrameSpy = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });
    const cancelAnimationFrameSpy = vi
      .spyOn(globalThis, 'cancelAnimationFrame')
      .mockImplementation(() => {});

    const useWindowVirtualizerMock = vi.fn((options) =>
      createVirtualizerRef({
        rows: [
          { index: 0, start: 0 },
          { index: 1, start: 72 },
        ],
        totalSize: 144,
        options,
      })
    );

    tanstackVirtual.useWindowVirtualizer = useWindowVirtualizerMock;
    const logErrorSpy = vi.spyOn(devUtils, 'logError').mockImplementation(() => {});

    try {
      wrapper = mountComponent({
        props: {
          hasVirtualization: true,
          idAttribute: 'id',
          items: [
            { id: 'dup', name: 'Row A' },
            { id: 'dup', name: 'Row B' },
          ],
        },
      });

      await flushVirtualizationSetup();

      const renderedRows = wrapper.findAll('.lx-grid-content .lx-grid-row');
      expect(renderedRows.length).toBe(2);
      expect(logErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Duplicate row IDs found in items'),
        undefined
      );
    } finally {
      requestAnimationFrameSpy.mockRestore();
      cancelAnimationFrameSpy.mockRestore();
      logErrorSpy.mockRestore();
    }
  });
});
