/* eslint-disable no-restricted-imports */
import { describe, test, expect, afterEach, beforeEach } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import LxAppendableList from '@/components/forms/AppendableList.vue';
import {
  actionDefinitionsCommon,
  checkActionDefinitionsButtonsPanel,
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

    checkActionDefinitionsButtonsPanel(panelButtons, {
      actionDefinitionsOverride: [defaultDeleteAction, ...actionDefinitionsCommon],
    });
  });
});
