/* eslint-disable no-restricted-imports */
import { describe, test, expect, afterEach, beforeEach } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import LxDataGrid from '@/components/DataGrid.vue';
import { checkButtonState } from './helpers/buttonHelpers';
import {
  actionDefinitionsCommon,
  checkActionDefinitionsButtonsPanel,
} from './helpers/actionDefinitionsHelpers';

let wrapper;

function mountComponent({ props = {} } = {}) {
  expect(LxDataGrid).toBeTruthy();

  return mount(LxDataGrid, {
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

test('LxDataGrid component mounts successfully', () => {
  wrapper = mountComponent();

  expect(wrapper.exists()).toBe(true);
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

    expect(wrapper.find('.lx-cell-action').exists()).toBe(false);
  });

  // TODO: use checkActionDefinitionsButtonsSingle instead
  describe('One action', () => {
    function initButton(action) {
      wrapper = mountComponent({ props: { ...props, actionDefinitions: [action] } });

      const button = wrapper.find('.lx-cell-action > .lx-toolbar > .lx-button');

      expect(button.exists()).toBe(true);
      expect(button.attributes('id')).toContain(action.id);
      expect(button.attributes('aria-label')).toContain(action.name);

      return button;
    }

    test('simple', () => {
      const action = {
        id: 'actionSimple',
        name: 'Simple action',
        icon: 'ai',
        title: 'This is a simple action',
      };

      const button = initButton(action);

      expect(button.attributes('title')).toBe(action.title);
    });

    test('destructive', () => {
      const action = {
        id: 'actionDestructive',
        name: 'Destructive action',
        icon: 'ai',
        destructive: true,
      };

      const button = initButton(action);

      checkButtonState(button, 'destructive');
    });

    // TODO: uncomment this test when issue with disabled buttons in LxDataGrid will be fixed
    // test('disabled', () => {
    //   const action = {
    //     id: 'actionDisabled',
    //     name: 'Disabled action',
    //     icon: 'ai',
    //     disabled: true,
    //   };

    //   const button = initButton(action);

    //   checkButtonState(button, 'disabled');
    // });

    test('busy', () => {
      const action = {
        id: 'actionBusy',
        name: 'Busy action',
        icon: 'ai',
        busy: true,
      };

      const button = initButton(action);

      checkButtonState(button, 'busy');
    });

    test('loading', () => {
      const action = {
        id: 'actionLoading',
        name: 'Loading action',
        icon: 'ai',
        loading: true,
      };

      const button = initButton(action);

      checkButtonState(button, 'loading');
    });

    test('active', () => {
      const action = {
        id: 'actionActive',
        name: 'Active action',
        icon: 'ai',
        active: true,
      };

      const button = initButton(action);

      checkButtonState(button, 'active');
    });

    test('with badge', () => {
      const action = {
        id: 'actionBadge',
        name: 'Action with badge',
        icon: 'ai',
        badge: '🌞',
      };

      const button = initButton(action);

      expect(button.find('.lx-badge').exists()).toBe(true);
    });
  });

  test('renders two actions as buttons', () => {
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
    // TODO: remove filtering of disabled action when issue with disabled buttons in LxDataGrid will be fixed
    const actionDefinitions = actionDefinitionsCommon.filter((action) => !action.disabled);

    wrapper = mountComponent({ props: { ...props, actionDefinitions } });

    const togglerElement = wrapper.find('.lx-cell-action > .lx-toolbar .lx-dropdown-toggler');

    expect(togglerElement.exists()).toBe(true);

    await togglerElement.trigger('click');

    const panelElement = document.body.querySelector('.lx-dropdown-panel-wrapper');
    const buttonElements = panelElement.querySelectorAll('.lx-button');
    const panelActions = actionDefinitions.slice(1);

    checkActionDefinitionsButtonsPanel(buttonElements, { actionDefinitionsOverride: panelActions });
  });
});
