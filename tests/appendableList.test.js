/* eslint-disable no-restricted-imports */
import { describe, test, expect, afterEach, beforeEach, vi } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import { nextTick, reactive, ref } from 'vue';
import LxAppendableList from '@/components/forms/AppendableList.vue';
import LxToolbar from '@/components/Toolbar.vue';
import LxDataBlock from '@/components/DataBlock.vue';
import * as libLoader from '@/utils/libLoader';
import {
  actionDefinitionsCommon,
  checkActionDefinitionsButtonsMultiple,
} from './helpers/actionDefinitionsHelpers';

const defaultDeleteAction = {
  id: 'appendableListDelete',
  name: 'Dzēst ierakstu',
  icon: 'remove-item',
};

let wrapper;

function mountComponent({ props = {} } = {}) {
  expect(LxAppendableList).toBeTruthy();

  return mount(LxAppendableList, {
    props,
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

test('LxAppendableList component mounts successfully', () => {
  wrapper = mountComponent();

  expect(wrapper.exists()).toBe(true);
});

describe('Action definitions', () => {
  const props = {
    modelValue: [
      {
        id: 'testItem',
        name: 'Test item',
      },
    ],
    expandable: true,
    actionDefinitions: [],
    // These tests assert synchronous DOM; virtualized items render async.
    hasVirtualization: false,
  };

  test('no actions - only default delete action', () => {
    wrapper = mountComponent({ props });

    expect(wrapper.find(`.additional-buttons #${defaultDeleteAction.id}`).exists()).toBe(true);
  });

  test('renders one action: in dropdown after default delete action', async () => {
    const action = {
      id: 'actionTest',
      name: 'Test action',
      icon: 'ai',
    };

    wrapper = mountComponent({ props: { ...props, actionDefinitions: [action] } });

    const toggler = wrapper.find('.additional-buttons .lx-dropdown-toggler');

    await toggler.trigger('click');

    const panel = document.body.querySelector('.lx-dropdown-panel-wrapper');
    const panelButtons = panel.querySelectorAll('.lx-button');

    expect(panelButtons.length).toBe(2);
    expect(panelButtons[0].getAttribute('id')).toContain(defaultDeleteAction.id);
    expect(panelButtons[1].getAttribute('id')).toContain(action.id);
    expect(panelButtons[1].getAttribute('aria-label')).toContain(action.name);
  });

  test('renders many actions: in dropdown after default delete action', async () => {
    wrapper = mountComponent({ props: { ...props, actionDefinitions: actionDefinitionsCommon } });

    const toggler = wrapper.find('.additional-buttons .lx-dropdown-toggler');

    await toggler.trigger('click');

    const panel = document.body.querySelector('.lx-dropdown-panel-wrapper');
    const panelButtons = panel.querySelectorAll('.lx-button');

    checkActionDefinitionsButtonsMultiple(panelButtons, {
      wrapper,
      actionDefinitionsOverride: [defaultDeleteAction, ...actionDefinitionsCommon],
    });
  });

  test('toolbar actions are shown as ghost next to the built-in add action', async () => {
    wrapper = mountComponent({
      props: {
        ...props,
        toolbarActionDefinitions: [{ id: 'save', name: 'Save', icon: 'save', kind: 'primary' }],
      },
    });
    await nextTick();

    const toolbarActions = wrapper.findComponent(LxToolbar).props('actionDefinitions');
    expect(toolbarActions.find((a) => a.id === 'save').extra).toBe(true);
    expect(wrapper.find('[id$="-action-add-item"]').classes()).toContain('lx-button-tertiary');
    expect(wrapper.find('[id$="-action-save"]').exists()).toBe(false);
  });

  test('without the add action the first primary toolbar action is promoted like in LxList', async () => {
    wrapper = mountComponent({
      props: {
        ...props,
        canAddItems: false,
        toolbarActionDefinitions: [
          { id: 'edit', name: 'Edit', icon: 'edit' },
          { id: 'save', name: 'Save', icon: 'save', kind: 'primary' },
        ],
      },
    });
    await nextTick();

    const toolbarActions = wrapper.findComponent(LxToolbar).props('actionDefinitions');
    expect(toolbarActions.some((a) => a.extra)).toBe(false);
    expect(wrapper.find('[id$="-action-add-item"]').exists()).toBe(false);
    expect(wrapper.find('[id$="-action-save"]').classes()).not.toContain('lx-button-ghost');
  });
});

describe('Virtualization', () => {
  // Wait for the lazily loaded virtualizer to render items.
  async function flushVirtualizationSetup() {
    const flushStep = () => Promise.resolve().then(() => nextTick());

    return Array.from({ length: 5 }).reduce(
      (promise) => promise.then(() => flushStep()),
      Promise.resolve()
    );
  }

  // Renders a two-item window out of however many items the list was given.
  function createVirtualizerRef(options) {
    return ref({
      getVirtualItems: () => [
        { index: 0, start: 0 },
        { index: 1, start: 72 },
      ],
      getTotalSize: () => 72 * (options?.count ?? 0),
      measure: () => {},
      measureElement: () => {},
      scrollToIndex: () => {},
      options,
    });
  }

  const items = Array.from({ length: 50 }, (_, index) => ({
    id: `item-${index}`,
    name: `Item ${index}`,
  }));

  let loadLibrarySpy;
  let useWindowVirtualizerMock;

  beforeEach(() => {
    useWindowVirtualizerMock = vi.fn((options) => createVirtualizerRef(options));
    loadLibrarySpy = vi.spyOn(libLoader, 'loadLibrary').mockResolvedValue({
      useWindowVirtualizer: useWindowVirtualizerMock,
    });
  });

  afterEach(() => {
    loadLibrarySpy.mockRestore();
  });

  test('virtualizes by default', async () => {
    wrapper = mountComponent({ props: { modelValue: items } });

    await flushVirtualizationSetup();

    expect(loadLibrarySpy).toHaveBeenCalled();
    expect(wrapper.find('.lx-appendable-list').classes()).toContain(
      'lx-appendable-list-virtualized'
    );
    expect(wrapper.findAll('.lx-appendable-list-item').length).toBe(2);
  });

  test('renders every item when virtualization is turned off', async () => {
    wrapper = mountComponent({ props: { modelValue: items, hasVirtualization: false } });

    await flushVirtualizationSetup();

    expect(wrapper.findAll('.lx-appendable-list-item').length).toBe(items.length);
    expect(loadLibrarySpy).not.toHaveBeenCalled();
  });

  test('never mounts the full model while the virtualizer is still loading', async () => {
    wrapper = mountComponent({
      props: { modelValue: items, hasVirtualization: true },
    });

    expect(wrapper.findAll('.lx-appendable-list-item').length).toBe(0);

    await flushVirtualizationSetup();

    expect(wrapper.findAll('.lx-appendable-list-item').length).toBe(2);
  });

  test('renders only the virtual window when virtualization is on', async () => {
    wrapper = mountComponent({
      props: { modelValue: items, hasVirtualization: true },
    });

    await flushVirtualizationSetup();

    const renderedItems = wrapper.findAll('.lx-appendable-list-item');

    expect(loadLibrarySpy).toHaveBeenCalled();
    expect(renderedItems.length).toBe(2);
    expect(renderedItems[0].attributes('style')).toContain('transform: translateY(0px)');
    expect(renderedItems[1].attributes('style')).toContain('transform: translateY(72px)');
  });

  test('sizes the list to the full item count so the scrollbar stays correct', async () => {
    wrapper = mountComponent({
      props: { modelValue: items, hasVirtualization: true },
    });

    await flushVirtualizationSetup();

    const list = wrapper.find('.lx-appendable-list');

    expect(list.classes()).toContain('lx-appendable-list-virtualized');
    expect(list.attributes('style')).toContain(`height: ${72 * items.length}px`);
    expect(list.attributes('style')).toContain('position: relative');
  });

  test('keeps the virtual index on each item so focus can find it', async () => {
    wrapper = mountComponent({
      props: { modelValue: items, hasVirtualization: true },
    });

    await flushVirtualizationSetup();

    const renderedItems = wrapper.findAll('.lx-appendable-list-item');

    expect(renderedItems[0].attributes('data-index')).toBe('0');
    expect(renderedItems[1].attributes('data-index')).toBe('1');
  });

  test('gives duplicate item ids distinct virtual keys', async () => {
    wrapper = mountComponent({
      props: {
        modelValue: [
          { id: 'duplicate', name: 'First' },
          { id: 'duplicate', name: 'Second' },
        ],
        hasVirtualization: true,
      },
    });

    await flushVirtualizationSetup();

    expect(wrapper.findAll('.lx-appendable-list-item').length).toBe(2);
  });
});

describe('Scrolling to an added item', () => {
  const ITEM_SIZE = 238;
  const VIEWPORT = 768;
  // Content below the list, e.g. a page footer.
  const BELOW_LIST = 557;

  let loadLibrarySpy;
  let scrollToSpy;
  let rafSpy;
  let cancelRafSpy;
  let frames;
  let scrollWrites;
  let lastScrollWriteAt;
  let scroll;
  let virtualizer;
  let estimate;
  let sizeOf;
  let clock;

  // Items take the list's estimate until they have been in view, like the real virtualizer.
  function createScrollingVirtualizer(options) {
    let itemSizeCache = new Map();
    const measurements = () => {
      let start = 0;
      return Array.from({ length: options.count }, (_, index) => {
        const size = itemSizeCache.get(index) ?? estimate ?? options.estimateSize(index);
        const item = { index, key: index, start, size, end: start + size, lane: 0 };
        start += size;
        return item;
      });
    };
    virtualizer = ref({
      getMeasurements: measurements,
      getVirtualItems: () => {
        const all = measurements();
        const inView = all.filter(
          (item) => item.end > scroll.y && item.start < scroll.y + VIEWPORT
        );
        if (!inView.length) return [];
        // Like tanstack, the rendered set comes from the range extractor.
        const range = {
          startIndex: inView[0].index,
          endIndex: inView.at(-1).index,
          overscan: 0,
          count: all.length,
        };
        const indexes = options.rangeExtractor?.(range) ?? inView.map((item) => item.index);
        const visible = indexes.map((index) => all[index]);
        visible.forEach((item) => {
          if (!itemSizeCache.has(item.index)) {
            itemSizeCache = new Map(itemSizeCache.set(item.index, sizeOf(item.index)));
          }
        });
        return visible;
      },
      getTotalSize: () => measurements().at(-1)?.end ?? 0,
      get itemSizeCache() {
        return itemSizeCache;
      },
      getSize: () => VIEWPORT,
      getMaxScrollOffset: () => (measurements().at(-1)?.end ?? 0) + BELOW_LIST - VIEWPORT,
      // Like tanstack, drops every measured height; the re-render then re-measures what's rendered.
      measure: vi.fn(() => {
        const rendered = measurements().filter(
          (item) => item.end > scroll.y && item.start < scroll.y + VIEWPORT
        );
        itemSizeCache = new Map(rendered.map((item) => [item.index, sizeOf(item.index)]));
      }),
      measureElement: () => {},
      options,
    });
    return virtualizer;
  }

  const itemAt = (index) => virtualizer.value.getMeasurements()[index];

  async function runFrames(count) {
    for (let i = 0; i < count; i += 1) {
      const batch = [...frames.values()];
      frames.clear();
      clock += 1000 / 60;
      const timestamp = clock;
      batch.forEach((callback) => callback(timestamp));
      // eslint-disable-next-line no-await-in-loop
      await nextTick();
    }
  }

  const makeItems = (count) =>
    Array.from({ length: count }, (_, index) => ({ id: `item-${index}`, name: `Item ${index}` }));

  function mountList(count) {
    let list = null;
    list = mount(LxAppendableList, {
      attachTo: document.body,
      props: {
        modelValue: makeItems(count),
        expandable: true,
        // The mount-time write-back arrives before `list` is assigned.
        'onUpdate:modelValue': (value) =>
          list
            ? list.setProps({ modelValue: value })
            : Promise.resolve().then(() => list.setProps({ modelValue: value })),
      },
      global: { stubs: { RouterLink: RouterLinkStub } },
    });
    return list;
  }

  beforeEach(() => {
    estimate = null;
    sizeOf = () => ITEM_SIZE;
    clock = 0;
    scroll = reactive({ y: 0 });
    scrollWrites = [];
    frames = new Map();
    let frameId = 0;
    Object.defineProperty(globalThis, 'scrollY', {
      get: () => scroll.y,
      configurable: true,
    });
    scrollToSpy = vi.spyOn(globalThis, 'scrollTo').mockImplementation(({ top }) => {
      scroll.y = top;
      scrollWrites.push(top);
      lastScrollWriteAt = clock;
    });
    rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
      frameId += 1;
      frames.set(frameId, callback);
      return frameId;
    });
    cancelRafSpy = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation((id) => {
      frames.delete(id);
    });
    loadLibrarySpy = vi.spyOn(libLoader, 'loadLibrary').mockResolvedValue({
      useWindowVirtualizer: (options) => createScrollingVirtualizer(options),
    });
  });

  afterEach(() => {
    loadLibrarySpy.mockRestore();
    scrollToSpy.mockRestore();
    rafSpy.mockRestore();
    cancelRafSpy.mockRestore();
    delete globalThis.scrollY;
  });

  test.each([10, 30, 100])(
    'lands on the new item, not the page bottom, with %i items',
    async (count) => {
      wrapper = mountList(count);
      await runFrames(10);

      wrapper.findComponent(LxToolbar).vm.$emit('actionClick', 'add-item');
      await runFrames(300);

      const newItem = wrapper.find(`.lx-appendable-list-item[data-index="${count}"]`);
      expect(newItem.exists()).toBe(true);
      const { start, end } = itemAt(count);
      expect(start).toBeGreaterThanOrEqual(scroll.y);
      expect(end).toBeLessThanOrEqual(scroll.y + VIEWPORT);
      // Centred, like a native focus scroll.
      expect(Math.abs((start + end) / 2 - (scroll.y + VIEWPORT / 2))).toBeLessThan(1);

      // Only ever moves towards the item.
      const reversals = scrollWrites.filter((top, i) => i > 0 && top < scrollWrites[i - 1]);
      expect(reversals).toEqual([]);

      expect(document.activeElement?.closest('.lx-appendable-list-item')).toBe(newItem.element);
    }
  );

  // Targeting the scroller's max offset lands below the list when content follows it.
  test('lands on the new item when item sizes are already known', async () => {
    estimate = ITEM_SIZE;
    wrapper = mountList(10);
    await runFrames(10);

    wrapper.findComponent(LxToolbar).vm.$emit('actionClick', 'add-item');
    await runFrames(300);

    const { start, end } = itemAt(10);
    expect(start).toBeGreaterThanOrEqual(scroll.y);
    expect(end).toBeLessThanOrEqual(scroll.y + VIEWPORT);
  });

  test("estimates unmeasured items at the first screen's median height, then locks it", async () => {
    wrapper = mountList(100);
    await runFrames(10);
    expect(virtualizer.value.options.estimateSize(99)).toBe(ITEM_SIZE);

    // Taller items further down, outnumbering the first screen, must not move the estimate.
    sizeOf = () => 600;
    for (let index = 20; index < 60; index += 1) {
      scroll.y = index * ITEM_SIZE;
      virtualizer.value.getVirtualItems();
    }
    const sizes = [...virtualizer.value.itemSizeCache.values()];
    expect(sizes.filter((size) => size === 600).length).toBeGreaterThan(sizes.length / 2);
    expect(virtualizer.value.options.estimateSize(99)).toBe(ITEM_SIZE);
  });

  test('jumps most of the way to a far item instead of rendering every screen', async () => {
    wrapper = mountList(1000);
    await runFrames(10);
    const measuredBefore = virtualizer.value.itemSizeCache.size;
    scrollWrites.length = 0;
    const startClock = clock;

    wrapper.findComponent(LxToolbar).vm.$emit('actionClick', 'add-item');
    await runFrames(300);

    const { start, end } = itemAt(1000);
    expect(start).toBeGreaterThanOrEqual(scroll.y);
    expect(end).toBeLessThanOrEqual(scroll.y + VIEWPORT);
    // One jump, then a normal glide; finished well before the timeout.
    const steps = scrollWrites.map((top, i) => top - (i ? scrollWrites[i - 1] : 0));
    expect(steps[0]).toBeGreaterThan(VIEWPORT);
    expect(steps.slice(1).every((step) => step <= VIEWPORT)).toBe(true);
    expect(lastScrollWriteAt - startClock).toBeLessThan(3000);
    // Roughly the last 20 screens get rendered, not all 1000 items.
    expect(virtualizer.value.itemSizeCache.size - measuredBefore).toBeLessThan(100);
  });

  function deleteItemAt(index) {
    const item = wrapper.find(`.lx-appendable-list-item[data-index="${index}"]`).element;
    const dataBlock = wrapper
      .findAllComponents(LxDataBlock)
      .find((component) => item.contains(component.element));
    dataBlock.vm.$emit('actionClick', 'appendableListDelete');
  }

  test('keeps the view and measured heights when deleting a partly visible item', async () => {
    wrapper = mountList(30);
    await runFrames(10);
    // Scroll down through the list, so the items above the view are measured.
    for (let index = 0; index <= 17; index += 1) {
      scroll.y = index * ITEM_SIZE;
      // eslint-disable-next-line no-await-in-loop
      await runFrames(1);
    }
    virtualizer.value.measure.mockClear();
    scrollWrites.length = 0;

    // Item 20 is cut off by the viewport's bottom edge; item 21 slides into its place.
    deleteItemAt(20);
    await runFrames(60);

    expect(scrollWrites).toEqual([]);
    expect(virtualizer.value.measure).not.toHaveBeenCalled();
    expect(virtualizer.value.itemSizeCache.get(0)).toBe(ITEM_SIZE);
    expect(document.activeElement?.closest('.lx-appendable-list-item')?.dataset.index).toBe('20');
  });

  test('re-measures only when the whole data set is replaced', async () => {
    wrapper = mountList(30);
    await runFrames(10);
    virtualizer.value.measure.mockClear();

    const edited = wrapper
      .props('modelValue')
      .map((item, i) => (i ? item : { ...item, name: 'x' }));
    await wrapper.setProps({ modelValue: edited });
    await runFrames(3);
    expect(virtualizer.value.measure).not.toHaveBeenCalled();

    await wrapper.setProps({
      modelValue: makeItems(30).map((item) => ({ ...item, id: `other-${item.id}` })),
    });
    await runFrames(3);
    expect(virtualizer.value.measure).toHaveBeenCalled();
  });

  test('applies scroll corrections instantly, ignoring CSS smooth scrolling', async () => {
    wrapper = mountList(10);
    await runFrames(10);
    scrollToSpy.mockClear();

    virtualizer.value.options.scrollToFn(100, { adjustments: 5 }, { scrollElement: globalThis });

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 105, behavior: 'instant' });
  });

  const itemElement = (index) => wrapper.find(`.lx-appendable-list-item[data-index="${index}"]`);
  const focusInside = (index) =>
    itemElement(index).element.querySelector('button, input, [tabindex="0"]').focus();
  const settleFocus = () =>
    new Promise((resolve) => {
      setTimeout(resolve);
    });

  test('keeps the focused item rendered and focused when scrolled out of view', async () => {
    wrapper = mountList(30);
    await runFrames(10);
    focusInside(1);

    scroll.y = 25 * ITEM_SIZE;
    await runFrames(3);

    expect(itemElement(1).exists()).toBe(true);
    expect(itemElement(1).element.contains(document.activeElement)).toBe(true);
    expect(itemElement(1).attributes('style')).toContain(`translateY(${ITEM_SIZE}px)`);
  });

  test('releases the focused item once focus leaves the list', async () => {
    wrapper = mountList(30);
    await runFrames(10);
    focusInside(1);
    scroll.y = 25 * ITEM_SIZE;
    await runFrames(3);

    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();
    await settleFocus();
    await runFrames(3);

    expect(itemElement(1).exists()).toBe(false);
  });

  test('keeps the focused item while focus is in its menu, which renders in #poppers', async () => {
    wrapper = mountList(30);
    await runFrames(10);
    focusInside(1);

    const menuButton = document.createElement('button');
    document.getElementById('poppers').appendChild(menuButton);
    menuButton.focus();
    await settleFocus();
    scroll.y = 25 * ITEM_SIZE;
    await runFrames(3);

    expect(itemElement(1).exists()).toBe(true);
  });

  test('keeps pinning the same item when items before it are removed', async () => {
    wrapper = mountList(30);
    await runFrames(10);
    focusInside(2);
    const focusedItem = wrapper.props('modelValue')[2];

    // Removed by the parent, so focus stays put while the item moves to index 1.
    await wrapper.setProps({ modelValue: wrapper.props('modelValue').slice(1) });
    scroll.y = 25 * ITEM_SIZE;
    await runFrames(3);

    expect(itemElement(1).exists()).toBe(true);
    expect(itemElement(1).element.contains(document.activeElement)).toBe(true);
    expect(wrapper.props('modelValue')[1]).toStrictEqual(focusedItem);
  });

  test('stops when the user scrolls', async () => {
    wrapper = mountList(100);
    await runFrames(10);

    wrapper.findComponent(LxToolbar).vm.$emit('actionClick', 'add-item');
    await runFrames(3);
    globalThis.dispatchEvent(new Event('wheel'));
    const stoppedAt = scroll.y;
    await runFrames(50);

    expect(scroll.y).toBe(stoppedAt);
    expect(stoppedAt).toBeLessThan(itemAt(100).end - VIEWPORT);
  });
});
