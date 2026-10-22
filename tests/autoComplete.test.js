import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { config, flushPromises, mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import LxAutoComplete from '@/components/AutoComplete.vue';
import LxValuePicker from '@/components/ValuePicker.vue';
import useAutoCompleteSearch from '@/hooks/useAutoCompleteSearch';
import { textSearch } from '@/utils/stringUtils';

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

  test('turns off browser autofill so it does not cover the suggestions', () => {
    mountNew();
    expect(wrapper.find('#ac').attributes('autocomplete')).toBe('off');
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

describe('LxAutoComplete mode="new" clear and details buttons', () => {
  test('kind="default" shows both once a value is selected, clear first', () => {
    mountNew({ modelValue: games[0], hasDetails: true });
    const ids = wrapper.findAll('.lx-input-wrapper .lx-button').map((b) => b.attributes('id'));
    expect(ids).toEqual(['ac-clearButton', 'ac-detailsButton']);
  });

  test('shows only the details button without a value', () => {
    mountNew({ hasDetails: true });
    const ids = wrapper.findAll('.lx-input-wrapper .lx-button').map((b) => b.attributes('id'));
    expect(ids).toEqual(['ac-detailsButton']);
  });
});

describe('LxAutoComplete mode="new" kind="search"', () => {
  function mountSearch(props = {}, options = {}) {
    return mountNew({ kind: 'search', queryDebounce: 0, ...props }, options);
  }

  async function type(text) {
    const input = wrapper.find('input');
    input.element.focus();
    await input.trigger('keydown', { key: text.at(-1) || 'Backspace' });
    await input.setValue(text);
    await nextTick();
  }

  async function typeAndEnter(text) {
    await type(text);
    await wrapper.find('input').trigger('keydown', { key: 'Enter' });
    await nextTick();
  }

  function searchForRow() {
    return document.querySelector('#poppers .lx-autocomplete-search-for');
  }

  test('looks like a search field and shows the value as input text', () => {
    mountSearch({ modelValue: games[0] });
    expect(wrapper.find('input').element.value).toBe('Dishonored');
    expect(wrapper.find('.lx-autocomplete-search').exists()).toBe(true);
    expect(wrapper.find('.lx-value').exists()).toBe(false);
  });

  test('is single selection only', async () => {
    mountSearch({ selectionKind: 'multiple', modelValue: games[0] });
    expect(wrapper.find('input').element.value).toBe('Dishonored');
    expect(wrapper.find('.lx-tag').exists()).toBe(false);
    await openMenu();
    expect(document.querySelector('#poppers .lx-checkbox')).toBeNull();
  });

  test('searchTrigger defaults to "confirm"', () => {
    mountSearch();
    expect(wrapper.findComponent({ name: 'AutoCompleteNew' }).props('searchTrigger')).toBe(
      'confirm'
    );
  });

  test('shows the clear and details buttons together once a value is selected', () => {
    mountSearch({ modelValue: games[0], hasDetails: true });
    const ids = wrapper.findAll('.lx-input-wrapper .lx-button').map((b) => b.attributes('id'));
    expect(ids).toEqual(['ac-clearButton', 'ac-detailsButton']);
  });

  describe('enterkeyhint', () => {
    test('is "search" in kind="search"', () => {
      mountSearch();
      expect(wrapper.find('input').attributes('enterkeyhint')).toBe('search');
    });

    test('is not set in kind="default"', () => {
      mountNew();
      expect(wrapper.find('input').attributes('enterkeyhint')).toBeUndefined();
    });

    test('enterKeyHint prop overrides it', () => {
      mountSearch({ enterKeyHint: 'go' });
      expect(wrapper.find('input').attributes('enterkeyhint')).toBe('go');
    });
  });

  describe('searchTrigger="confirm"', () => {
    test('typing filters the suggestions without changing the value or searching', async () => {
      mountSearch({ onSearch: () => {} });
      await type('cr');
      expect(listItems().map(textOf)).toEqual(['Crysis', 'Meklēt "cr"']);
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
      expect(wrapper.emitted('search')).toBeUndefined();
    });

    test('Enter confirms typed text that is not in items as an item object and searches', async () => {
      mountSearch({ onSearch: () => {} });
      await typeAndEnter('Half-Life');
      expect(lastModelValue()).toEqual({ id: 'Half-Life', name: 'Half-Life' });
      expect(wrapper.emitted('search')).toEqual([['Half-Life']]);
      expect(wrapper.find('.lx-autocomplete-default').classes()).not.toContain('lx-opened');
    });

    test('Enter confirms the item when the typed text is its name', async () => {
      mountSearch();
      await typeAndEnter('crysis');
      expect(lastModelValue()).toEqual(games[1]);
    });

    test('picking an item sets it and searches with its name', async () => {
      mountSearch({ onSearch: () => {} });
      await openMenu();
      listItems()[2].click();
      await nextTick();
      expect(lastModelValue()).toEqual(games[2]);
      expect(wrapper.emitted('search')).toEqual([['Dota 2']]);
    });

    test('the "Search for" row confirms the typed text and searches', async () => {
      mountSearch({ onSearch: () => {} });
      await type('blablabla');
      expect(listItems().map(textOf)).toEqual(['Meklēt "blablabla"']);
      searchForRow().click();
      await nextTick();
      expect(lastModelValue()).toEqual({ id: 'blablabla', name: 'blablabla' });
      expect(wrapper.emitted('search')).toEqual([['blablabla']]);
    });

    test('the "Search for" row is separated only when other items are listed', async () => {
      mountSearch();
      await type('cr');
      expect(
        document.querySelector('#poppers .lx-autocomplete-search-for-wrapper').className
      ).toContain('lx-separated');
      await type('blablabla');
      expect(
        document.querySelector('#poppers .lx-autocomplete-search-for-wrapper').className
      ).not.toContain('lx-separated');
    });

    test('shows the selected value with customItem until the field is focused', async () => {
      mountSearch(
        { modelValue: games[1] },
        { slots: { customItem: '<b class="custom">{{ params.item.name }}</b>' } }
      );
      expect(wrapper.find('.lx-value .custom').text()).toBe('Crysis');
      expect(wrapper.find('input').classes()).toContain('lx-autocomplete-text-hidden');
      await wrapper.find('input').trigger('focus');
      expect(wrapper.find('.lx-value').exists()).toBe(false);
      expect(wrapper.find('input').element.value).toBe('Crysis');
    });

    test('shows the icon of the selected value until the field is focused', async () => {
      mountSearch({ modelValue: games[2] });
      expect(wrapper.find('.lx-value .lx-autocomplete-item-content').exists()).toBe(true);
    });

    test('uses idAttribute and nameAttribute for typed text', async () => {
      mountSearch({ items: [], idAttribute: 'code', nameAttribute: 'title' });
      await typeAndEnter('Half-Life');
      expect(lastModelValue()).toEqual({ code: 'Half-Life', title: 'Half-Life' });
    });

    test('keeps typed text a string when items are strings', async () => {
      mountSearch({ items: ['Dishonored', 'Crysis'] });
      await typeAndEnter('Half-Life');
      expect(lastModelValue()).toBe('Half-Life');
    });

    test('Enter on an empty field only opens and closes the list', async () => {
      mountSearch();
      const input = wrapper.find('input');
      const container = () => wrapper.find('.lx-autocomplete-default').classes();

      await input.trigger('keydown', { key: 'Enter' });
      expect(container()).toContain('lx-opened');
      await input.trigger('keydown', { key: 'Enter' });
      expect(container()).not.toContain('lx-opened');
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    test('aria-expanded follows the visible list', async () => {
      mountSearch({ items: [] });
      await openMenu();
      expect(wrapper.find('input').attributes('aria-expanded')).toBe('false');
      await type('x');
      expect(wrapper.find('input').attributes('aria-expanded')).toBe('true');
    });

    test('clearing empties the text and searches with an empty query', async () => {
      mountSearch({ onSearch: () => {} });
      await typeAndEnter('dota');
      await wrapper.setProps({ modelValue: lastModelValue() });
      await wrapper.find('#ac-clearButton').trigger('click');
      expect(lastModelValue()).toBeNull();
      expect(wrapper.find('input').element.value).toBe('');
      expect(wrapper.emitted('search')).toEqual([['dota'], ['']]);
    });
  });

  describe('searchTrigger="input"', () => {
    function mountPlain(props = {}) {
      return mountSearch({ searchTrigger: 'input', queryDebounce: 100, ...props });
    }

    test('is a plain search field without a list', async () => {
      vi.useFakeTimers();
      mountPlain();
      await openMenu();
      await type('cr');
      expect(wrapper.find('.lx-autocomplete-default').classes()).not.toContain('lx-opened');
      expect(listItems()).toEqual([]);
      expect(wrapper.find('input').attributes('role')).toBe('searchbox');
    });

    test('sets the value and searches while typing', async () => {
      vi.useFakeTimers();
      mountPlain({ onSearch: () => {} });
      await type('dot');
      vi.advanceTimersByTime(100);
      await nextTick();
      expect(lastModelValue()).toEqual({ id: 'dot', name: 'dot' });
      expect(wrapper.emitted('search')).toEqual([['dot']]);
      await wrapper.setProps({ modelValue: lastModelValue() });

      await type('');
      vi.advanceTimersByTime(100);
      await nextTick();
      expect(lastModelValue()).toBeNull();
      expect(wrapper.emitted('search')).toEqual([['dot'], ['']]);
    });

    test('Enter sets the value and searches right away', async () => {
      vi.useFakeTimers();
      mountPlain({ onSearch: () => {} });
      await typeAndEnter('dot');
      expect(lastModelValue()).toEqual({ id: 'dot', name: 'dot' });
      expect(wrapper.emitted('search')).toEqual([['dot']]);

      vi.advanceTimersByTime(100);
      await nextTick();
      expect(wrapper.emitted('search')).toEqual([['dot']]);
      expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
    });

    test('keeps spaces at the end while typing more than one word', async () => {
      vi.useFakeTimers();
      mountPlain({ onSearch: () => {} });
      await type('half ');
      vi.advanceTimersByTime(100);
      await wrapper.setProps({ modelValue: lastModelValue() });
      expect(lastModelValue()).toEqual({ id: 'half', name: 'half' });
      expect(wrapper.find('input').element.value).toBe('half ');
    });

    test('deleted text is not restored when new items arrive', async () => {
      vi.useFakeTimers();
      mountPlain({ onSearch: () => {} });
      await type('d');
      vi.advanceTimersByTime(100);
      await wrapper.setProps({ modelValue: lastModelValue() });
      expect(wrapper.find('input').element.value).toBe('d');

      await type('');
      await wrapper.setProps({ items: [] });
      await flushPromises();
      expect(wrapper.find('input').element.value).toBe('');
    });

    test('pending typed text is not committed after unmount', async () => {
      vi.useFakeTimers();
      mountPlain();
      await type('dot');
      const emitted = wrapper.emitted();
      wrapper.unmount();
      wrapper = null;
      vi.advanceTimersByTime(100);
      expect(emitted['update:modelValue']).toBeUndefined();
    });
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

describe('LxAutoComplete mode="new" with @search before a search', () => {
  test('lists the selected value when reopened without results', async () => {
    mountNew({ onSearch: () => {}, items: [], queryMinLength: 1, modelValue: games[1] });
    await openMenu();
    expect(listItems().map(textOf)).toEqual(['Crysis']);
    expect(document.querySelector('#poppers .lx-empty')).toBeNull();
  });

  test('lists the selected values first, then the items, in multiple selection', async () => {
    mountNew({
      onSearch: () => {},
      items: [games[0]],
      selectionKind: 'multiple',
      modelValue: [games[1], games[0]],
    });
    await openMenu();
    const labels = listItems().map((el) => textOf(el.querySelector('.lx-checkbox-text-wrapper')));
    expect(labels).toEqual(['Crysis', 'Dishonored']);
  });

  test('shows only the results once a search runs', async () => {
    mountNew({ onSearch: () => {}, items: [games[2]], modelValue: games[1] });
    await openMenu();
    await wrapper.find('input').setValue('dot');
    expect(listItems().map(textOf)).toEqual(['Dota 2']);
  });
});

describe('LxAutoComplete mode="new" searchString', () => {
  test('kind="default" shows and searches an initial searchString', async () => {
    vi.useFakeTimers();
    mountNew({ onSearch: () => {}, searchString: 'dis', queryDebounce: 100 });
    expect(wrapper.find('input').element.value).toBe('dis');
    vi.advanceTimersByTime(100);
    await nextTick();
    expect(wrapper.emitted('search')).toEqual([['dis']]);
    expect(wrapper.emitted('update:searchString')).toBeUndefined();
  });

  test('kind="search" shows an initial searchString and searches it with searchTrigger="input"', async () => {
    vi.useFakeTimers();
    mountNew({
      kind: 'search',
      searchTrigger: 'input',
      onSearch: () => {},
      searchString: 'dis',
      queryDebounce: 100,
    });
    expect(wrapper.find('input').element.value).toBe('dis');
    vi.advanceTimersByTime(100);
    await nextTick();
    expect(wrapper.emitted('search')).toEqual([['dis']]);
  });

  test('kind="search" with searchTrigger="confirm" does not search an initial searchString', async () => {
    vi.useFakeTimers();
    mountNew({
      kind: 'search',
      searchTrigger: 'confirm',
      onSearch: () => {},
      searchString: 'dis',
      queryDebounce: 100,
    });
    vi.advanceTimersByTime(100);
    await nextTick();
    expect(wrapper.emitted('search')).toBeUndefined();
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
  test('kind="default": Enter does not pick from the hidden list', async () => {
    mountNew({ loading: true });
    await openMenu();
    await wrapper.find('input').setValue('cry');
    await wrapper.find('input').trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  test('kind="search": typing and Enter do not change the value', async () => {
    vi.useFakeTimers();
    mountNew({
      kind: 'search',
      searchTrigger: 'input',
      onSearch: () => {},
      loading: true,
      queryDebounce: 100,
    });
    await wrapper.find('input').setValue('cry');
    vi.advanceTimersByTime(100);
    await nextTick();
    await wrapper.find('input').trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    // Only the search from typing; Enter does nothing while loading
    expect(wrapper.emitted('search')).toEqual([['cry']]);
  });

  test('kind="search": text typed while loading is committed once loading ends', async () => {
    vi.useFakeTimers();
    mountNew({ kind: 'search', searchTrigger: 'input', loading: true, queryDebounce: 100 });
    await wrapper.find('input').setValue('cry');
    vi.advanceTimersByTime(100);
    await nextTick();
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();

    await wrapper.setProps({ loading: false });
    expect(lastModelValue()).toEqual({ id: 'cry', name: 'cry' });
    expect(wrapper.find('input').element.value).toBe('cry');
  });
});
