/* eslint-disable no-restricted-imports */
import { describe, test, expect, afterEach, beforeEach } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import LxDataGrid from '@/components/DataGrid.vue';
import {
  actionDefinitionsCommon,
  checkActionDefinitionsButtonsSingle,
  checkActionDefinitionsButtonsMultiple,
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
    const actionDefinitions = actionDefinitionsCommon;

    wrapper = mountComponent({ props: { ...props, actionDefinitions } });

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
