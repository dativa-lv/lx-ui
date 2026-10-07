import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { config, flushPromises, mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import LxAutoComplete from '@/components/AutoComplete.vue';
import LxValuePicker from '@/components/ValuePicker.vue';
import useAutoCompleteSearch from '@/hooks/useAutoCompleteSearch';
import { textSearch } from '@/utils/stringUtils';
import 'regenerator-runtime/runtime';

config.global.stubs = { ...config.global.stubs, 'router-link': true };

const games = [
  { id: 'mt', name: 'Dishonored' },
  { id: 'de', name: 'Crysis' },
  { id: 'ma', name: 'Dota 2', icon: 'info' },
];

let wrapper;

beforeEach(() => {
  const el = document.createElement('div');
  el.id = 'poppers';
  document.body.appendChild(el);
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
  document.body.innerHTML = '';
  vi.useRealTimers();
});

function mountNew(props = {}, options = {}) {
  wrapper = mount(LxAutoComplete, {
    props: { id: 'ac', mode: 'new', items: games, ...props },
    attachTo: document.body,
    ...options,
  });
  return wrapper;
}

async function openMenu() {
  await wrapper.find('.lx-autocomplete').trigger('click');
  await flushPromises();
}

function listItems() {
  return [...document.querySelectorAll('#poppers [role="option"]')];
}

// Icons carry their own accessible title, so read only the text around them
function textOf(el) {
  const clone = el.cloneNode(true);
  clone.querySelectorAll('svg').forEach((svg) => svg.remove());
  return clone.textContent.trim();
}

function lastModelValue() {
  return wrapper.emitted('update:modelValue')?.at(-1)?.[0];
}

describe('LxAutoComplete mode', () => {
  test('uses the legacy implementation by default', () => {
    wrapper = mount(LxAutoComplete, { props: { items: games, modelValue: 'mt' } });
    expect(
      wrapper.find('[data-component="lx-auto-complete"]').attributes('data-state')
    ).not.toContain('"mode":"new"');
  });

  test('uses the new implementation with mode="new"', () => {
    mountNew();
    expect(wrapper.find('[data-component="lx-auto-complete"]').attributes('data-state')).toContain(
      '"mode":"new"'
    );
  });
});

describe('LxAutoComplete mode="new" model', () => {
  test('shows the selected object without it being in items', () => {
    mountNew({ items: [], modelValue: { id: 'mt', name: 'Dishonored' } });
    expect(wrapper.find('.lx-value').text()).toBe('Dishonored');
  });

  test('emits the selected object', async () => {
    mountNew();
    await openMenu();
    listItems()[0].click();
    await nextTick();
    expect(lastModelValue()).toEqual(games[0]);
  });

  test('accepts strings in items and returns strings', async () => {
    mountNew({ items: ['Dishonored', 'Crysis'] });
    await openMenu();
    expect(listItems().map(textOf)).toEqual(['Dishonored', 'Crysis']);
    listItems()[1].click();
    await nextTick();
    expect(lastModelValue()).toBe('Crysis');
  });

  test('resolves a string model value against object items', () => {
    mountNew({ modelValue: 'de' });
    expect(wrapper.find('.lx-value').text()).toBe('Crysis');
  });

  test('shows a string model value missing from items as itself', () => {
    mountNew({ modelValue: 'zz' });
    expect(wrapper.find('.lx-value').text()).toBe('zz');
  });

  test('clears to null', async () => {
    mountNew({ modelValue: games[0] });
    await wrapper.find('#ac-clearButton').trigger('click');
    expect(lastModelValue()).toBeNull();
  });

  test('uses idAttribute and nameAttribute', async () => {
    mountNew({
      items: [{ code: 'A', title: 'Alpha' }],
      idAttribute: 'code',
      nameAttribute: 'title',
      modelValue: { code: 'A', title: 'Alpha' },
    });
    expect(wrapper.find('.lx-value').text()).toBe('Alpha');
    await openMenu();
    expect(listItems()[0].getAttribute('aria-selected')).toBe('true');
  });

  test('multiple selection adds and removes objects', async () => {
    mountNew({ selectionKind: 'multiple', modelValue: [games[0]] });
    await openMenu();
    listItems()[1].click();
    await nextTick();
    expect(lastModelValue()).toEqual([games[0], games[1]]);

    await wrapper.setProps({ modelValue: [games[0], games[1]] });
    listItems()[0].click();
    await nextTick();
    expect(lastModelValue()).toEqual([games[1]]);
  });

  test('select all adds every item', async () => {
    mountNew({ selectionKind: 'multiple', hasSelectAll: true, modelValue: [] });
    await openMenu();
    document.querySelector('#poppers .select-all').click();
    await nextTick();
    expect(lastModelValue()).toEqual(games);
  });

  test('read-only shows the names of the selected objects', () => {
    mountNew({ readOnly: true, selectionKind: 'multiple', modelValue: games.slice(0, 2) });
    expect(wrapper.find('.lx-data').text()).toBe('Dishonored, Crysis');
  });

  test.each([
    ['comma', 'Dishonored, Crysis'],
    ['slash', 'Dishonored / Crysis'],
    ['arrow', 'Dishonored › Crysis'],
    ['dash', 'Dishonored - Crysis'],
    ['dot', 'Dishonored · Crysis'],
    ['pipe', 'Dishonored | Crysis'],
    ['unknown', 'Dishonored, Crysis'],
  ])('valueSeparator "%s" shows "%s"', (valueSeparator, text) => {
    mountNew({
      readOnly: true,
      selectionKind: 'multiple',
      valueSeparator,
      modelValue: games.slice(0, 2),
    });
    expect(wrapper.find('.lx-data').text()).toBe(text);
  });
});

describe('LxAutoComplete mode="new" search', () => {
  test('filters items locally', async () => {
    mountNew();
    await openMenu();
    await wrapper.find('input').setValue('dot');
    expect(listItems().map(textOf)).toEqual(['Dota 2']);
  });

  test('with @search it does not filter items and emits a debounced search', async () => {
    vi.useFakeTimers();
    mountNew({ onSearch: () => {}, queryDebounce: 100 });
    await openMenu();
    await wrapper.find('input').setValue('dot');
    expect(listItems()).toHaveLength(3);
    expect(wrapper.emitted('search')).toBeUndefined();

    vi.advanceTimersByTime(100);
    await nextTick();
    expect(wrapper.emitted('search')).toEqual([['dot']]);
  });

  test('shows the min length message for short server-side queries', async () => {
    mountNew({ onSearch: () => {}, queryMinLength: 3 });
    await openMenu();
    await wrapper.find('input').setValue('do');
    expect(listItems()).toHaveLength(0);
    expect(document.querySelector('#poppers .lx-empty').textContent).toContain('3');
  });

  test('does not hide local items because of queryMinLength', async () => {
    mountNew({ queryMinLength: 3 });
    await openMenu();
    expect(listItems()).toHaveLength(3);
    await wrapper.find('input').setValue('o');
    expect(listItems().map(textOf)).toEqual(['Dishonored', 'Dota 2']);
  });
});

describe('LxAutoComplete mode="new" template', () => {
  test('one customItem template renders both the value and the items', async () => {
    mountNew(
      { modelValue: games[0] },
      {
        slots: {
          customItem: ({ item, context }) => h('span', { class: `custom-${context}` }, item.id),
        },
      }
    );
    expect(wrapper.find('.lx-value .custom-value').text()).toBe('mt');

    await openMenu();
    expect(
      [...document.querySelectorAll('#poppers .custom-item')].map((el) => el.textContent)
    ).toEqual(['mt', 'de', 'ma']);
  });

  test('renders item icons from iconAttribute', async () => {
    mountNew({ modelValue: games[2] });
    expect(wrapper.find('.lx-value .lx-autocomplete-item-content svg').exists()).toBe(true);
    await openMenu();
    expect(listItems()[2].querySelector('.lx-autocomplete-item-content svg')).not.toBeNull();
    expect(listItems()[0].querySelector('.lx-autocomplete-item-content')).toBeNull();
  });
});

describe('useAutoCompleteSearch', () => {
  test('loads items and ignores stale responses', async () => {
    const resolvers = {};
    const fetchItems = vi.fn(
      (query) =>
        new Promise((resolve) => {
          resolvers[query] = resolve;
        })
    );
    const search = useAutoCompleteSearch(fetchItems, { immediate: false });

    search.search('a');
    search.search('ab');
    expect(search.bindings.loading).toBe(true);

    resolvers.ab([{ id: 2 }]);
    await flushPromises();
    resolvers.a([{ id: 1 }]);
    await flushPromises();

    expect(search.bindings.items).toEqual([{ id: 2 }]);
    expect(search.bindings.loading).toBe(false);
  });

  test('shows initial items for queries shorter than queryMinLength', async () => {
    const fetchItems = vi.fn(async () => [{ id: 'x' }]);
    const search = useAutoCompleteSearch(fetchItems, {
      queryMinLength: 2,
      initialItems: [{ id: 'initial' }],
    });

    expect(fetchItems).not.toHaveBeenCalled();
    await search.search('xy');
    expect(search.items.value).toEqual([{ id: 'x' }]);
    await search.search('x');
    expect(search.items.value).toEqual([{ id: 'initial' }]);
    expect(fetchItems).toHaveBeenCalledTimes(1);
  });

  test('bindings drive the component', async () => {
    const search = useAutoCompleteSearch(async () => [games[2]], { immediate: false });
    mountNew({ items: undefined, queryDebounce: 0, ...search.bindings });
    await openMenu();
    await wrapper.find('input').setValue('dot');
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });
    await flushPromises();
    await wrapper.setProps({ items: search.bindings.items });
    expect(listItems().map(textOf)).toEqual(['Dota 2']);
  });
});

describe('LxValuePicker dropdown with search', () => {
  test('keeps emitting ids', async () => {
    wrapper = mount(LxValuePicker, {
      props: {
        id: 'vp',
        variant: 'dropdown',
        hasSearch: true,
        items: games,
        modelValue: 'ma',
      },
      attachTo: document.body,
    });
    expect(wrapper.find('.lx-value').text()).toBe('Dota 2');
    expect(wrapper.find('.lx-value svg').exists()).toBe(false);

    await openMenu();
    listItems()[0].click();
    await nextTick();
    expect(lastModelValue()).toBe('mt');
  });

  test('shows an id missing from items as the id', () => {
    wrapper = mount(LxValuePicker, {
      props: { id: 'vp', variant: 'dropdown', hasSearch: true, items: games, modelValue: 'zz' },
      attachTo: document.body,
    });
    expect(wrapper.find('.lx-value').text()).toBe('zz');
  });

  test('keeps emitting id arrays for multiple selection', async () => {
    wrapper = mount(LxValuePicker, {
      props: {
        id: 'vp',
        variant: 'dropdown',
        hasSearch: true,
        selectionKind: 'multiple',
        items: games,
        modelValue: ['ma'],
      },
      attachTo: document.body,
    });
    await openMenu();
    listItems()[0].click();
    await nextTick();
    expect(lastModelValue()).toEqual(['ma', 'mt']);
  });
});

describe('useAutoCompleteSearch reactive options', () => {
  test('follows queryMinLength and initialItems given as getters', async () => {
    const { ref: vueRef } = await import('vue');
    const minLength = vueRef(3);
    const initial = vueRef([]);
    const fetchItems = vi.fn(async () => [{ id: 'x' }]);
    const search = useAutoCompleteSearch(fetchItems, {
      queryMinLength: () => minLength.value,
      initialItems: initial,
    });

    expect(search.bindings.queryMinLength).toBe(3);
    initial.value = [{ id: 'saved' }];
    await nextTick();
    expect(search.items.value).toEqual([{ id: 'saved' }]);

    minLength.value = 1;
    expect(search.bindings.queryMinLength).toBe(1);
    await search.search('a');
    expect(fetchItems).toHaveBeenCalledWith('a');
  });
});

describe('useAutoCompleteSearch searchString', () => {
  test('a restored searchString is shown, searched once and follows typing', async () => {
    vi.useFakeTimers();
    const { ref: vueRef } = await import('vue');
    const saved = vueRef('dis');
    const fetchItems = vi.fn(async (query) => games.filter((g) => textSearch(query, g.name)));
    const search = useAutoCompleteSearch(fetchItems, { searchString: saved });
    mountNew({ items: undefined, queryDebounce: 100, ...search.bindings });
    expect(wrapper.find('input').element.value).toBe('dis');

    vi.advanceTimersByTime(100);
    await flushPromises();
    expect(fetchItems.mock.calls).toEqual([['dis']]);

    await wrapper.find('input').setValue('cry');
    expect(saved.value).toBe('cry');
  });
});

describe('LxAutoComplete mode="new" searchString', () => {
  test('shows and searches an initial searchString', async () => {
    vi.useFakeTimers();
    mountNew({ onSearch: () => {}, searchString: 'dis', queryDebounce: 100 });
    expect(wrapper.find('input').element.value).toBe('dis');
    vi.advanceTimersByTime(100);
    await nextTick();
    expect(wrapper.emitted('search')).toEqual([['dis']]);
    expect(wrapper.emitted('update:searchString')).toBeUndefined();
  });

  test('follows searchString changes from outside and reports typing', async () => {
    vi.useFakeTimers();
    mountNew({ onSearch: () => {}, queryDebounce: 100 });
    await openMenu();
    await wrapper.setProps({ searchString: 'cry' });
    expect(wrapper.find('input').element.value).toBe('cry');
    await wrapper.find('input').setValue('crys');
    expect(wrapper.emitted('update:searchString').at(-1)).toEqual(['crys']);
    vi.advanceTimersByTime(100);
    await nextTick();
    expect(wrapper.emitted('search')).toEqual([['crys']]);
  });
});

describe('LxAutoComplete builder registry', () => {
  const builderOptions = { useRegistry: true, schemaPath: 'test', componentStack: [] };
  // Only the wrapper declares "mode"; the legacy component is unchanged
  const registeredWrapper = (registry) => 'mode' in (registry.get('reg')?.node.type.props || {});

  test('legacy registers itself, as before', async () => {
    const { builderRegistry } = await import('@/stores/builderRegistry');
    wrapper = mount(LxAutoComplete, { props: { id: 'reg', items: games, builderOptions } });
    expect(builderRegistry.get('reg')).toBeDefined();
    expect(registeredWrapper(builderRegistry)).toBe(false);
    wrapper.unmount();
    wrapper = null;
    expect(builderRegistry.get('reg')).toBeUndefined();
  });

  test('mode new is not registered', async () => {
    const { builderRegistry } = await import('@/stores/builderRegistry');
    wrapper = mount(LxAutoComplete, {
      props: { id: 'reg', mode: 'new', items: games, builderOptions },
    });
    expect(builderRegistry.get('reg')).toBeUndefined();

    await wrapper.setProps({ mode: 'legacy' });
    await flushPromises();
    expect(builderRegistry.get('reg')).toBeDefined();

    await wrapper.setProps({ mode: 'new' });
    await flushPromises();
    expect(builderRegistry.get('reg')).toBeUndefined();
  });
});

describe('LxAutoComplete mode="new" while loading', () => {
  test('Enter does not pick from the hidden list', async () => {
    mountNew({ loading: true });
    await openMenu();
    await wrapper.find('input').setValue('cry');
    await wrapper.find('input').trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });
});
