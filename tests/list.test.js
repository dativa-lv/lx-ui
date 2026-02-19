/* eslint-disable no-restricted-imports */
import { describe, test, expect, afterEach, beforeEach } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import LxList from '@/components/list/List.vue';
import {
  actionDefinitionsCommon,
  checkActionDefinitionsButtonsSingle,
  checkActionDefinitionsButtonsMultiple,
} from './helpers/actionDefinitionsHelpers';

let wrapper;

function mountComponent({ props = {} } = {}) {
  expect(LxList).toBeTruthy();

  return mount(LxList, {
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

    checkActionDefinitionsButtonsMultiple(buttonElements);
  });
});
