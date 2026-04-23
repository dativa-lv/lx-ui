/* eslint-disable no-restricted-imports */
import { describe, test, expect, afterEach, beforeEach, vi } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import LxList from '@/components/list/List.vue';
import * as libLoader from '@/utils/libLoader';
import { lxDevUtils } from '@/utils';
import {
  actionDefinitionsCommon,
  checkActionDefinitionsButtonsSingle,
  checkActionDefinitionsButtonsMultiple,
} from './helpers/actionDefinitionsHelpers';

let wrapper;

function mountComponent({ props = {}, attachTo } = {}) {
  expect(LxList).toBeTruthy();

  return mount(LxList, {
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
  document.body.innerHTML = '';
  if (wrapper) {
    wrapper.unmount();
  }
});

test('LxList component mounts successfully', () => {
  wrapper = mountComponent();

  expect(wrapper.exists()).toBe(true);
});

test('default elements', () => {
  expect(LxList).toBeTruthy();

  const props = {
    items: [
      {
        id: 1,
        name: 'Test 1',
        group: 1,
        description: 'Test description 1',
      },
      {
        id: 2,
        name: 'Test 2',
        group: 1,
        description: 'Test description 2',
      },
      {
        id: 3,
        name: 'Test 3',
        group: 2,
        description: 'Test description 3',
      },
    ],
    listType: '1',
    kind: 'default',
    idAttribute: 'id',
    nameAttribute: 'name',
    groupAttribute: 'group',
  };

  wrapper = mountComponent({ props });

  // Check the number of items
  const items = wrapper.findAll('ul.lx-list > li');
  expect(items.length).toBe(3);

  // Check the labels of the items
  const labels = wrapper.findAll('.lx-primary');
  expect(labels.length).toBe(3);
  expect(labels[0].text()).toBe('Test 1');
  expect(labels[1].text()).toBe('Test 2');
  expect(labels[2].text()).toBe('Test 3');

  // Check the descriptions of the items
  const descriptions = wrapper.findAll('.lx-secondary');
  expect(descriptions.length).toBe(3);
  expect(descriptions[0].text()).toBe('Test description 1');
  expect(descriptions[1].text()).toBe('Test description 2');
  expect(descriptions[2].text()).toBe('Test description 3');
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
  };

  test('no actions', () => {
    wrapper = mountComponent({ props });

    expect(wrapper.find('.lx-list-item-actions').exists()).toBe(false);
  });

  describe('Single action variations', () => {
    checkActionDefinitionsButtonsSingle(
      mountComponent,
      (w) => {
        wrapper = w;
      },
      '.lx-list-item-actions .lx-button',
      { props }
    );
  });

  test('many actions', async () => {
    wrapper = mountComponent({ props: { ...props, actionDefinitions: actionDefinitionsCommon } });

    const togglerElement = wrapper.find('.lx-list-item-actions .lx-dropdown-toggler');

    expect(togglerElement.exists()).toBe(true);

    await togglerElement.trigger('click');

    const panelElement = document.body.querySelector('.lx-dropdown-panel-wrapper');
    const buttonElements = panelElement.querySelectorAll('.lx-button');

    checkActionDefinitionsButtonsMultiple(buttonElements, { wrapper });
  });
});

describe('Item and action interactions', () => {
  const testItems = {
    simple: {
      id: 'itemSimple',
      name: 'Item simple',
    },
    href: {
      id: 'itemHref',
      name: 'Item href',
      href: { name: 'info' },
    },
    clickable: {
      id: 'itemClickable',
      name: 'Item clickable',
      clickable: true,
    },
  };

  const testActions = {
    simple1: {
      id: 'actionSimple1',
      name: 'Action simple 1',
      icon: 'ai',
    },
    simple2: {
      id: 'actionSimple2',
      name: 'Action simple 2',
      icon: 'ai',
    },
    href1: {
      id: 'actionHref1',
      name: 'Action href 1',
      icon: 'ai',
      href: { name: 'migration' },
    },
    href2: {
      id: 'actionHref2',
      name: 'Action href 2',
      icon: 'ai',
      href: { name: 'migration' },
    },
  };

  const layouts = ['horizontal', 'vertical'];

  const scenarios = [
    {
      name: 'single simple action',
      actions: [testActions.simple1],
    },
    {
      name: 'single href action',
      actions: [testActions.href1],
    },
    {
      name: 'multiple simple actions',
      actions: [testActions.simple1, testActions.simple2],
    },
    {
      name: 'multiple href actions',
      actions: [testActions.href1, testActions.href2],
    },
  ];

  async function checkActions(item, actions) {
    const itemClickEmits = wrapper.emitted('click')?.length ?? 0;

    if (actions.length === 1) {
      const actionButton = wrapper.get('.lx-list-item-actions .lx-button');
      await actionButton.trigger('click');

      // Ensure that item click event is not emitted when clicked on action button
      expect(wrapper.emitted('click')?.length ?? 0).toBe(itemClickEmits);

      expect(wrapper.emitted('actionClick').at(-1)).toEqual([actions[0].id, item.id]);

      if (actions[0].href) {
        const link = wrapper
          .findAllComponents({ name: 'RouterLinkStub' })
          .find((l) => l.attributes('id')?.includes(actions[0].id));

        expect(link?.exists()).toBe(true);
        expect(link?.props('to')?.name).toBe(actions[0].href.name);
      }
    } else if (actions.length > 1) {
      const dropdown = wrapper.get('.lx-list-item-actions .lx-dropdown-toggler');
      await dropdown.trigger('click');

      // Ensure that item click event is not emitted when clicked on dropdown
      expect(wrapper.emitted('click')?.length ?? 0).toBe(itemClickEmits);

      const panel = document.body.querySelector('.lx-dropdown-panel-wrapper');
      const buttons = panel.querySelectorAll('.lx-button');

      expect(buttons.length).toBe(actions.length);

      if (actions[0].href) {
        const link = wrapper
          .findAllComponents({ name: 'RouterLinkStub' })
          .find((l) => l.attributes('id')?.includes(actions[0].id));

        expect(link?.exists()).toBe(true);
        expect(link?.props('to')?.name).toBe(actions[0].href.name);
      }

      await buttons[0].click();

      expect(wrapper.emitted('actionClick').at(-1)).toEqual([actions[0].id, item.id]);
    }
  }

  describe('Simple item', () => {
    const testItem = testItems.simple;

    layouts.forEach((layout) => {
      describe(`Layout: ${layout}`, () => {
        scenarios.forEach(({ name, actions }) => {
          test(name, async () => {
            wrapper = mountComponent({
              props: {
                items: [testItem],
                actionDefinitions: actions,
                actionsLayout: layout,
              },
            });

            const itemElement = wrapper.get('.lx-list-item');
            await itemElement.trigger('click');

            expect(wrapper.emitted('actionClick')).toBeUndefined();

            await checkActions(testItem, actions);
          });
        });
      });
    });
  });

  describe('Item with href', () => {
    const testItem = testItems.href;

    layouts.forEach((layout) => {
      describe(`Layout: ${layout}`, () => {
        scenarios.forEach(({ name, actions }) => {
          test(name, async () => {
            wrapper = mountComponent({
              props: {
                items: [testItem],
                actionDefinitions: actions,
                actionsLayout: layout,
              },
            });

            const itemLink = wrapper.get('.lx-list-item');
            expect(itemLink.element.tagName).toBe('A');

            const link = wrapper
              .findAllComponents({ name: 'RouterLinkStub' })
              .find((l) => l.attributes('class')?.includes('lx-list-item'));

            expect(link?.exists()).toBe(true);
            expect(link?.props('to')?.name).toBe(testItem.href.name);

            await checkActions(testItem, actions);
          });
        });
      });
    });
  });

  describe('Clickable item', () => {
    const testItem = testItems.clickable;

    layouts.forEach((layout) => {
      describe(`Layout: ${layout}`, () => {
        scenarios.forEach(({ name, actions }) => {
          test(name, async () => {
            wrapper = mountComponent({
              props: {
                items: [testItem],
                actionDefinitions: actions,
                actionsLayout: layout,
              },
            });

            const item = wrapper.get('.lx-list-item');
            await item.trigger('click');

            expect(wrapper.emitted('actionClick')[0]).toEqual(['click', testItem.id]);

            await checkActions(testItem, actions);
          });
        });
      });
    });
  });
});

describe('Search', () => {
  const props = {
    items: [
      {
        id: 'item1',
        name: 'Item 1',
        description: 'This is item one',
      },
      {
        id: 'item2',
        name: 'Item 2',
        description: 'This is item two',
      },
    ],
    hasSearch: true,
  };

  describe('Client side', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    const searchDelay = 200;
    const itemSelector = '.lx-list-item-container';

    async function searchItems(searchValue) {
      wrapper = mountComponent({ props });

      const initialItems = wrapper.findAll(itemSelector);
      expect(initialItems.length).toBe(props.items.length);

      const searchInput = wrapper.get('.lx-component-toolbar .lx-search-input');
      await searchInput.setValue(searchValue);
      await vi.advanceTimersByTimeAsync(searchDelay);

      return wrapper.findAll(itemSelector);
    }

    test('gets one item and highlights match in name', async () => {
      const searchValue = '1';
      const items = await searchItems(searchValue);

      expect(items.length).toBe(1);
      expect(items[0].get('.lx-primary').text()).toBe(props.items[0].name);
      expect(items[0].get('.lx-secondary').text()).toBe(props.items[0].description);
      expect(items[0].get('.lx-primary').get('.lx-highlight').text()).toBe(searchValue);
      expect(items[0].get('.lx-secondary').find('.lx-highlight').exists()).toBe(false);
    });

    test('gets one item and highlights match in description', async () => {
      const searchValue = 'one';
      const items = await searchItems(searchValue);

      expect(items.length).toBe(1);
      expect(items[0].get('.lx-primary').text()).toBe(props.items[0].name);
      expect(items[0].get('.lx-secondary').text()).toBe(props.items[0].description);
      expect(items[0].get('.lx-primary').find('.lx-highlight').exists()).toBe(false);
      expect(items[0].get('.lx-secondary').get('.lx-highlight').text()).toBe(searchValue);
    });

    test('gets two items and highlights match in name and description', async () => {
      const searchValue = 'item';
      const items = await searchItems(searchValue);

      expect(items.length).toBe(2);
      expect(items[0].get('.lx-primary').text()).toBe(props.items[0].name);
      expect(items[0].get('.lx-secondary').text()).toBe(props.items[0].description);
      expect(items[0].get('.lx-primary').get('.lx-highlight').text().toLowerCase()).toBe(
        searchValue
      );
      expect(items[0].get('.lx-secondary').get('.lx-highlight').text()).toBe(searchValue);
      expect(items[1].get('.lx-primary').text()).toBe(props.items[1].name);
      expect(items[1].get('.lx-secondary').text()).toBe(props.items[1].description);
      expect(items[1].get('.lx-primary').get('.lx-highlight').text().toLowerCase()).toBe(
        searchValue
      );
      expect(items[1].get('.lx-secondary').get('.lx-highlight').text()).toBe(searchValue);
    });

    test('gets no items when query does not match any item', async () => {
      const searchValue = 'x';
      const items = await searchItems(searchValue);

      expect(items.length).toBe(0);
    });

    test('clear button restores all items and resets query', async () => {
      const searchValue = 'x';
      let items = await searchItems(searchValue);

      expect(items.length).toBe(0);

      const clearButton = wrapper.get('.lx-component-toolbar .lx-button[title="Notīrīt"]');
      await clearButton.trigger('click');
      await vi.advanceTimersByTimeAsync(searchDelay);

      items = wrapper.findAll(itemSelector);
      expect(items.length).toBe(props.items.length);

      const searchInput = wrapper.get('.lx-component-toolbar .lx-search-input');
      expect(searchInput.text()).toBe('');
    });
  });

  describe('Server side', () => {
    test('clear button resets query', async () => {
      wrapper = mountComponent({ props: { ...props, searchSide: 'server' } });

      const searchInput = wrapper.get('.lx-component-toolbar .lx-text-input');
      await searchInput.setValue('x');

      const clearButton = wrapper.get('.lx-component-toolbar .lx-button[title="Notīrīt"]');
      await clearButton.trigger('click');

      expect(searchInput.text()).toBe('');
    });
  });

  describe('Exposed function toggleSearch', () => {
    const searchInputCompactSelector = '.lx-component-toolbar .second-row .lx-text-input';

    test('toggleSearch expands and collapses compact search input', async () => {
      wrapper = mountComponent({ props: { ...props, searchMode: 'compact' } });

      let searchInput = wrapper.find(searchInputCompactSelector);

      expect(searchInput.exists()).toBe(false);

      wrapper.vm.toggleSearch();
      await wrapper.vm.$nextTick();

      searchInput = wrapper.find(searchInputCompactSelector);

      expect(searchInput.exists()).toBe(true);

      wrapper.vm.toggleSearch();
      await wrapper.vm.$nextTick();

      searchInput = wrapper.find(searchInputCompactSelector);

      expect(searchInput.exists()).toBe(false);
    });

    test('toggleSearch has no effect when search mode is not compact', async () => {
      wrapper = mountComponent({ props });

      let searchInput = wrapper.find(searchInputCompactSelector);

      expect(searchInput.exists()).toBe(false);

      wrapper.vm.toggleSearch();
      await wrapper.vm.$nextTick();

      searchInput = wrapper.find(searchInputCompactSelector);

      expect(searchInput.exists()).toBe(false);
    });
  });
});

describe('Virtualization', () => {
  function createVirtualizerRef(options) {
    return ref({
      getVirtualItems: () => [
        {
          index: 0,
          start: 120,
        },
      ],
      getTotalSize: () => 72,
      measure: () => {},
      measureElement: () => {},
      options,
    });
  }

  test('updates virtual offsets independently for multiple lists after scroll', async () => {
    const getTopByListId = {
      'list-a': 100,
      'list-b': 300,
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
        const top = getTopByListId[elementId] ?? 0;

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

    const useWindowVirtualizerMock = vi.fn((options) => createVirtualizerRef(options));

    const loadLibrarySpy = vi.spyOn(libLoader, 'loadLibrary').mockResolvedValue({
      useWindowVirtualizer: useWindowVirtualizerMock,
    });

    const items = Array.from({ length: 5 }, (_, index) => ({
      id: `item-${index}`,
      name: `Item ${index}`,
    }));

    let wrapperB;
    try {
      const wrapperA = mountComponent({
        props: {
          id: 'list-a',
          items,
          kind: 'default',
          listType: '1',
          hasVirtualization: true,
        },
      });
      wrapper = wrapperA;

      wrapperB = mountComponent({
        props: {
          id: 'list-b',
          items,
          kind: 'default',
          listType: '1',
          hasVirtualization: true,
        },
      });

      await Promise.resolve();
      await nextTick();

      const firstRowA = wrapperA.find('li.lx-list-item-container');
      const firstRowB = wrapperB.find('li.lx-list-item-container');

      expect(firstRowA.exists()).toBe(true);
      expect(firstRowB.exists()).toBe(true);

      expect(firstRowA.attributes('style')).toContain('transform: translateY(');
      expect(firstRowB.attributes('style')).toContain('transform: translateY(');
      expect(loadLibrarySpy).toHaveBeenCalled();
      expect(useWindowVirtualizerMock.mock.calls.length).toBeGreaterThanOrEqual(2);

      const scrollMargins = useWindowVirtualizerMock.mock.calls
        .map(([options]) => options?.scrollMargin)
        .filter((value) => Number.isFinite(value));
      expect(scrollMargins).toContain(100);

      getTopByListId['list-a'] = 50;
      getTopByListId['list-b'] = 250;

      if (globalThis.dispatchEvent) {
        globalThis.dispatchEvent(new Event('resize'));
      }
      if (typeof window !== 'undefined' && window?.dispatchEvent) {
        window.dispatchEvent(new Event('resize'));
      }
      await nextTick();

      expect(firstRowA.exists()).toBe(true);
      expect(firstRowB.exists()).toBe(true);
    } finally {
      wrapperB?.unmount();
      getBoundingClientRectSpy.mockRestore();
      requestAnimationFrameSpy.mockRestore();
      cancelAnimationFrameSpy.mockRestore();
      loadLibrarySpy.mockRestore();
    }
  });

  test('recalculates virtual offset only after scroll when list position changes', async () => {
    const getTopByListId = {
      'list-scroll-check': 120,
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
        const top = getTopByListId[elementId] ?? 0;

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
    const useWindowVirtualizerMock = vi.fn((options) => createVirtualizerRef(options));

    const loadLibrarySpy = vi.spyOn(libLoader, 'loadLibrary').mockResolvedValue({
      useWindowVirtualizer: useWindowVirtualizerMock,
    });

    const items = Array.from({ length: 5 }, (_, index) => ({
      id: `item-${index}`,
      name: `Item ${index}`,
    }));

    let wrapperA;
    try {
      wrapperA = mountComponent({
        props: {
          id: 'list-scroll-check',
          items,
          kind: 'default',
          listType: '1',
          hasVirtualization: true,
        },
      });
      wrapper = wrapperA;

      await Promise.resolve();
      await nextTick();

      const firstRow = wrapperA.find('li.lx-list-item-container');
      expect(firstRow.exists()).toBe(true);

      getTopByListId['list-scroll-check'] = 60;

      if (globalThis.dispatchEvent) {
        globalThis.dispatchEvent(new Event('resize'));
      }
      if (typeof window !== 'undefined' && window?.dispatchEvent) {
        window.dispatchEvent(new Event('resize'));
      }
      await nextTick();

      expect(firstRow.exists()).toBe(true);
      expect(firstRow.attributes('style')).toContain('transform: translateY(');
      expect(loadLibrarySpy).toHaveBeenCalled();
      expect(useWindowVirtualizerMock.mock.calls.length).toBeGreaterThanOrEqual(1);
    } finally {
      wrapperA?.unmount();
      getBoundingClientRectSpy.mockRestore();
      requestAnimationFrameSpy.mockRestore();
      cancelAnimationFrameSpy.mockRestore();
      loadLibrarySpy.mockRestore();
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

    const useWindowVirtualizerMock = vi.fn((options) => createVirtualizerRef(options));
    const useVirtualizerMock = vi.fn((options) => createVirtualizerRef(options));

    const loadLibrarySpy = vi.spyOn(libLoader, 'loadLibrary').mockResolvedValue({
      useWindowVirtualizer: useWindowVirtualizerMock,
      useVirtualizer: useVirtualizerMock,
    });

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
      id: `item-${index}`,
      name: `Item ${index}`,
    }));

    try {
      wrapper = mountComponent({
        props: {
          id: 'list-modal',
          items,
          kind: 'default',
          listType: '1',
          hasVirtualization: true,
        },
        attachTo: modalMain,
      });

      await Promise.resolve();
      await nextTick();

      const rows = wrapper.findAll('li.lx-list-item-container');
      expect(rows.length).toBe(1);
      expect(useVirtualizerMock.mock.calls.length).toBeGreaterThan(0);
      expect(useWindowVirtualizerMock).toHaveBeenCalledTimes(0);
      expect(useVirtualizerMock.mock.calls.some(([options]) => options?.getScrollElement)).toBe(
        true
      );
      expect(loadLibrarySpy).toHaveBeenCalled();
    } finally {
      requestAnimationFrameSpy.mockRestore();
      cancelAnimationFrameSpy.mockRestore();
      loadLibrarySpy.mockRestore();
    }
  });

  test('uses element virtualizer when rendered inside modal form with content before list', async () => {
    const requestAnimationFrameSpy = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });
    const cancelAnimationFrameSpy = vi
      .spyOn(globalThis, 'cancelAnimationFrame')
      .mockImplementation(() => {});

    const useWindowVirtualizerMock = vi.fn((options) => createVirtualizerRef(options));
    const useVirtualizerMock = vi.fn((options) => createVirtualizerRef(options));

    const loadLibrarySpy = vi.spyOn(libLoader, 'loadLibrary').mockResolvedValue({
      useWindowVirtualizer: useWindowVirtualizerMock,
      useVirtualizer: useVirtualizerMock,
    });

    const curtain = document.createElement('div');
    curtain.className = 'lx-curtain';
    const modal = document.createElement('div');
    modal.className = 'lx-modal lx-modal-form';
    const modalMain = document.createElement('div');
    modalMain.className = 'lx-main';
    modalMain.style.overflowY = 'auto';
    modalMain.style.height = '300px';

    const formHeader = document.createElement('div');
    formHeader.className = 'lx-form-grid';
    formHeader.textContent = 'Header before list';
    modalMain.appendChild(formHeader);

    modal.appendChild(modalMain);
    curtain.appendChild(modal);
    document.body.appendChild(curtain);

    const items = Array.from({ length: 50 }, (_, index) => ({
      id: `item-${index}`,
      name: `Item ${index}`,
    }));

    try {
      wrapper = mountComponent({
        props: {
          id: 'list-modal-form',
          items,
          kind: 'default',
          listType: '1',
          hasVirtualization: true,
        },
        attachTo: modalMain,
      });

      await Promise.resolve();
      await nextTick();

      const rows = wrapper.findAll('li.lx-list-item-container');
      expect(rows.length).toBe(1);
      expect(useVirtualizerMock.mock.calls.length).toBeGreaterThan(0);
      expect(useWindowVirtualizerMock).toHaveBeenCalledTimes(0);
      expect(useVirtualizerMock.mock.calls.some(([options]) => options?.getScrollElement)).toBe(
        true
      );
      expect(loadLibrarySpy).toHaveBeenCalled();
    } finally {
      requestAnimationFrameSpy.mockRestore();
      cancelAnimationFrameSpy.mockRestore();
      loadLibrarySpy.mockRestore();
    }
  });

  test('renders duplicate IDs in virtualized list and logs warning', async () => {
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
      ref({
        getVirtualItems: () => [
          { index: 0, start: 0 },
          { index: 1, start: 72 },
        ],
        getTotalSize: () => 144,
        measure: () => {},
        measureElement: () => {},
        options,
      })
    );

    const loadLibrarySpy = vi.spyOn(libLoader, 'loadLibrary').mockResolvedValue({
      useWindowVirtualizer: useWindowVirtualizerMock,
    });
    const logSpy = vi.spyOn(lxDevUtils, 'log').mockImplementation(() => {});

    const items = [
      { id: 'dup', name: 'Item A' },
      { id: 'dup', name: 'Item B' },
    ];

    try {
      wrapper = mountComponent({
        props: {
          id: 'list-duplicate-ids',
          items,
          kind: 'default',
          listType: '1',
          hasVirtualization: true,
        },
      });

      await Promise.resolve();
      await nextTick();

      const rows = wrapper.findAll('li.lx-list-item-container');
      expect(rows.length).toBe(2);
      expect(loadLibrarySpy).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('item codes are not unique!'),
        undefined,
        'error'
      );
    } finally {
      requestAnimationFrameSpy.mockRestore();
      cancelAnimationFrameSpy.mockRestore();
      loadLibrarySpy.mockRestore();
      logSpy.mockRestore();
    }
  });
});
