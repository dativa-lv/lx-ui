import { afterEach, describe, expect, test, vi } from 'vitest';
import { computed, reactive, ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';

import LxGlobalSearch from '@/components/shell/GlobalSearch.vue';
import { shellContextKey, useGlobalSearchPlacement } from '@/components/shell/shellContext';

vi.mock('@/components/AutoComplete.vue', async () => {
  const { h } = await import('vue');
  return {
    __esModule: true,
    default: {
      name: 'LxAutoComplete',
      props: [
        'id',
        'mode',
        'items',
        'loading',
        'modelValue',
        'searchString',
        'queryMinLength',
        'hasDetails',
        'detailMode',
        'placeholder',
        'texts',
      ],
      emits: ['update:modelValue', 'update:searchString', 'openDetails', 'search'],
      data: () => ({ shownItems: [] }),
      render() {
        return h('div', { class: 'lx-autocomplete' }, [
          h('input', { id: this.id }),
          h('button', { id: `${this.id}-detailsButton` }),
          ...this.shownItems.map((item) => this.$slots.customItem?.({ item })),
        ]);
      },
    },
  };
});

const items = [
  { id: 'users', name: 'Lietotāji', href: { name: 'users' }, icon: 'user' },
  { id: 'reports', name: 'Atskaites' },
  { id: 'settings', name: 'Iestatījumi', href: '/settings' },
];

let wrapper;

async function mountComponent({ globalSearchItems = items, screenWidth = 1024 } = {}) {
  const emits = vi.fn();
  const router = { push: vi.fn() };
  const props = reactive({
    hasGlobalSearch: true,
    globalSearchItems,
    globalSearchLoading: false,
    headerNavDisable: false,
  });

  const header = document.createElement('header');
  const mountPoint = document.createElement('div');
  const nextButton = document.createElement('button');
  nextButton.id = 'next-header-button';
  header.append(mountPoint, nextButton);
  document.body.append(header);

  wrapper = mount(LxGlobalSearch, {
    attachTo: mountPoint,
    global: {
      config: { globalProperties: { $router: router } },
      provide: {
        [shellContextKey]: {
          props,
          emits,
          header: ref(header),
          main: ref(document.body),
          poppers: ref(null),
          width: ref(screenWidth),
          navHiddenWidthBreakpoint: ref(800),
          displayTexts: computed(() => ({
            globalSearch: {
              open: 'Open',
              close: 'Close',
              placeholder: 'Search',
              hint: 'Hint',
              notFound: 'None',
              details: 'Details',
            },
          })),
        },
      },
    },
  });
  await flushPromises();
  return { emits, router, props, nextButton };
}

async function openPanel() {
  await wrapper.find('#lx-shell-global-search-button').trigger('click');
  await flushPromises();
  return vi.waitFor(() => {
    const autoComplete = wrapper.findComponent({ name: 'LxAutoComplete' });
    if (!autoComplete.exists()) throw new Error('autocomplete not mounted');
    return autoComplete;
  });
}

function isPanelOpen() {
  return !!document.querySelector('#lx-shell-global-search-panel');
}

function pressKey(element, key, options = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options });
  element.dispatchEvent(event);
  return event;
}

const getInput = () => document.querySelector('#lx-shell-global-search-input');
const getDetailsButton = () =>
  document.querySelector('#lx-shell-global-search-input-detailsButton');
const getToggleButton = () => document.querySelector('#lx-shell-global-search-button');

afterEach(() => {
  wrapper?.unmount();
  document.body.innerHTML = '';
});

describe('LxGlobalSearch', () => {
  test('opens an autocomplete in new mode with details on click', async () => {
    await mountComponent();
    expect(isPanelOpen()).toBe(false);

    const autoComplete = await openPanel();

    expect(isPanelOpen()).toBe(true);
    expect(autoComplete.props('mode')).toBe('new');
    expect(autoComplete.props('hasDetails')).toBe(true);
    expect(autoComplete.props('queryMinLength')).toBe(1);
    expect(autoComplete.props('texts').try).toBe('Hint');
  });

  test('toggle button opens on ArrowDown and shows opened state', async () => {
    await mountComponent();

    pressKey(getToggleButton(), 'ArrowDown');
    await flushPromises();

    expect(isPanelOpen()).toBe(true);
    expect(
      document
        .querySelector('.lx-global-search-toggle')
        .classList.contains('lx-global-search-opened')
    ).toBe(true);
  });

  test('passes items and loading as given and emits the query on search', async () => {
    const { emits, props } = await mountComponent();
    const autoComplete = await openPanel();

    autoComplete.vm.$emit('update:searchString', 'lie');
    await flushPromises();
    expect(autoComplete.props('items')).toEqual(items);
    props.globalSearchLoading = true;
    await flushPromises();
    expect(autoComplete.props('loading')).toBe(true);

    autoComplete.vm.$emit('search', 'lie');
    expect(emits).toHaveBeenCalledWith('globalSearch', 'lie');
  });

  test('empty query shows no items and is not emitted as a search', async () => {
    const { emits } = await mountComponent();
    const autoComplete = await openPanel();

    expect(autoComplete.props('items')).toEqual([]);
    autoComplete.vm.$emit('search', '');
    expect(emits).not.toHaveBeenCalledWith('globalSearch', '');
  });

  test('results show an optional icon and the name, aligned when some have icons', async () => {
    await mountComponent();
    const autoComplete = await openPanel();
    autoComplete.vm.$emit('update:searchString', 'a');
    autoComplete.vm.shownItems = items;
    await flushPromises();

    const rendered = [...document.querySelectorAll('.lx-global-search-result')];
    expect(rendered.map((el) => el.querySelector('span').textContent)).toEqual([
      'Lietotāji',
      'Atskaites',
      'Iestatījumi',
    ]);
    expect(rendered.map((el) => !!el.querySelector('svg'))).toEqual([true, false, false]);
    expect(rendered.every((el) => el.classList.contains('lx-global-search-result-with-icon'))).toBe(
      true
    );
  });

  test('selecting an item emits it, navigates to its href and closes the panel', async () => {
    const { emits, router } = await mountComponent();
    const autoComplete = await openPanel();

    autoComplete.vm.$emit('update:modelValue', items[2]);
    await flushPromises();

    expect(emits).toHaveBeenCalledWith('globalSearchItemClick', items[2]);
    expect(router.push).toHaveBeenCalledWith('/settings');
    expect(isPanelOpen()).toBe(false);
  });

  test('Tab from the input keeps the query and moves to the details button', async () => {
    const { emits } = await mountComponent();
    const autoComplete = await openPanel();
    autoComplete.vm.$emit('update:searchString', 'abc');
    getInput().focus();

    const event = pressKey(getInput(), 'Tab');

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(getDetailsButton());

    pressKey(getDetailsButton(), ' ');
    expect(emits).toHaveBeenCalledWith('globalSearchDetailsClick', 'abc');
  });

  test('details button emits the query and closes the panel', async () => {
    const { emits } = await mountComponent();
    const autoComplete = await openPanel();
    autoComplete.vm.$emit('update:searchString', 'abc');

    autoComplete.vm.$emit('openDetails');
    await flushPromises();

    expect(emits).toHaveBeenCalledWith('globalSearchDetailsClick', 'abc');
    expect(isPanelOpen()).toBe(false);
  });

  test('Enter on the details button is left to the button itself, so it emits only once', async () => {
    const { emits } = await mountComponent();
    await openPanel();

    const event = pressKey(getDetailsButton(), 'Enter');

    expect(event.defaultPrevented).toBe(true);
    expect(emits).not.toHaveBeenCalledWith('globalSearchDetailsClick', expect.anything());
  });

  test('Tab from the details button closes the panel and moves to the next header button', async () => {
    const { nextButton } = await mountComponent();
    await openPanel();
    getDetailsButton().focus();

    pressKey(getDetailsButton(), 'Tab');
    await flushPromises();

    expect(isPanelOpen()).toBe(false);
    expect(document.activeElement).toBe(nextButton);
  });

  test('Shift+Tab from the input closes the panel and focuses the toggle button', async () => {
    await mountComponent();
    await openPanel();
    getInput().focus();

    pressKey(getInput(), 'Tab', { shiftKey: true });
    await flushPromises();

    expect(isPanelOpen()).toBe(false);
    expect(document.activeElement).toBe(getToggleButton());
  });

  test('Escape closes the panel', async () => {
    await mountComponent();
    await openPanel();

    pressKey(getInput(), 'Escape');
    await flushPromises();

    expect(isPanelOpen()).toBe(false);
  });

  test('mobile view has a backdrop that closes the panel', async () => {
    await mountComponent({ screenWidth: 400 });
    await openPanel();

    const backdrop = document.querySelector('.lx-global-search-backdrop');
    expect(backdrop).not.toBeNull();

    backdrop.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    backdrop.click();
    await flushPromises();

    expect(isPanelOpen()).toBe(false);
  });

  test('desktop view has no backdrop', async () => {
    await mountComponent();
    await openPanel();

    expect(document.querySelector('.lx-global-search-backdrop')).toBeNull();
  });
});

describe('useGlobalSearchPlacement', () => {
  function getPlacement(context) {
    let placement;
    mount(
      {
        setup() {
          placement = useGlobalSearchPlacement();
          return () => null;
        },
      },
      { global: { provide: { [shellContextKey]: context } } }
    );
    return Object.fromEntries(Object.entries(placement).map(([key, value]) => [key, value.value]));
  }

  test('reads placement from the shell context', () => {
    expect(
      getPlacement({
        props: { hasGlobalSearch: true },
        globalSearchCanMoveToNav: ref(true),
        globalSearchInNav: ref(true),
      })
    ).toEqual({ hasGlobalSearch: true, canMoveToNav: true, inNav: true });
  });

  test('is off outside the shell', () => {
    expect(getPlacement(null)).toEqual({
      hasGlobalSearch: false,
      canMoveToNav: false,
      inNav: false,
    });
  });
});
