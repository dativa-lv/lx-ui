/* eslint-disable no-restricted-imports */
import { h } from 'vue';
import { describe, test, expect, afterEach, beforeEach } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import LxDropDownMenu from '@/components/DropDownMenu.vue';
import LxButton from '@/components/Button.vue';
import {
  actionDefinitionsCommon,
  checkActionDefinitionsButtonsPanel,
} from './helpers/actionDefinitionsHelpers';

let wrapper;

function mountComponent({ props = {}, slots = {} } = {}) {
  expect(LxDropDownMenu).toBeTruthy();

  return mount(LxDropDownMenu, {
    props,
    slots,
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
      },
    },
  });
}

function createActionDefinitions() {
  const mainButton = {
    id: 'mainButton',
    name: 'Open menu',
    icon: 'overflow-menu',
    title: 'This is main button',
    kind: 'main',
  };

  const actions = {
    buttons: actionDefinitionsCommon,
    toggles: [
      {
        id: 'actionToggle',
        name: 'Toggle action',
        title: 'This is a toggle action',
        kind: 'toggle',
      },
      {
        id: 'actionToggleDisabled',
        name: 'Disabled toggle action',
        kind: 'toggle',
        disabled: true,
      },
    ],
  };

  return {
    mainButton,
    actions,
    actionDefinitions: [mainButton, ...actions.buttons, ...actions.toggles],
  };
}

async function openMenu() {
  const togglerElement = wrapper.find('.lx-dropdown-toggler');
  await togglerElement.trigger('click');
  return document.body.querySelector('.lx-dropdown-panel-wrapper');
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

test('LxDropDownMenu component mounts successfully', () => {
  wrapper = mountComponent();

  expect(wrapper.exists()).toBe(true);
});

describe('Action definitions', () => {
  // TODO: uncomment this test when issue with empty actions in LxDropDownMenu will be fixed
  // test('renders with empty actions', async () => {
  //   wrapper = mountComponent();

  //   expect(wrapper.find('.lx-dropdown-toggler').exists()).toBe(true);

  //   const panelElement = await openMenu();

  //   expect(panelElement).toBeTruthy();
  // });

  test('renders main button correctly', async () => {
    const { mainButton, actionDefinitions } = createActionDefinitions();

    wrapper = mountComponent({ props: { actionDefinitions } });

    const togglerElement = wrapper.find('.lx-dropdown-toggler');
    const togglerButtonElement = togglerElement.find('.lx-button');

    expect(togglerButtonElement.attributes('id')).toBe(mainButton.id);
    expect(togglerButtonElement.attributes('title')).toBe(mainButton.title);
    expect(togglerButtonElement.attributes('aria-label')).toContain(mainButton.name);

    const panelElement = await openMenu();

    expect(panelElement.querySelector(`#${mainButton.id}`)).toBeNull();
  });

  test('renders action buttons correctly', async () => {
    const { actionDefinitions } = createActionDefinitions();

    wrapper = mountComponent({ props: { actionDefinitions } });

    const panelElement = await openMenu();
    const buttonElements = panelElement.querySelectorAll('.lx-button');

    checkActionDefinitionsButtonsPanel(buttonElements);
  });

  test('renders action toggles correctly', async () => {
    const {
      actions: { toggles },
      actionDefinitions,
    } = createActionDefinitions();

    wrapper = mountComponent({ props: { actionDefinitions } });

    const panelElement = await openMenu();
    const toggleElements = panelElement.querySelectorAll('.lx-dropdown-menu-toggle-wrapper');

    expect(toggleElements.length).toBe(toggles.length);

    toggleElements.forEach((toggle, i) => {
      const labelElement = toggle.querySelector('.lx-dropdown-toggle-label');
      const wrapperElement = toggle.querySelector('.lx-toggle-wrapper');
      const inputElement = wrapperElement.querySelector('.lx-toggle');

      expect(inputElement.getAttribute('id')).toBe(toggles[i].id);
      expect(labelElement.textContent).toBe(toggles[i].name);
      expect(inputElement.getAttribute('aria-label')).toContain(toggles[i].name);

      if (toggles[i].title) {
        expect(wrapperElement.getAttribute('title')).toContain(toggles[i].title);
      }

      if (toggles[i].disabled) {
        expect(inputElement.hasAttribute('disabled')).toBe(true);
      }
    });
  });

  test('renders groups correctly', async () => {
    const groupIds = ['group1', 'group2'];

    const actionsWithGroups = [
      {
        id: 'actionGrouped1',
        name: 'Grouped action 1',
        icon: 'ai',
        groupId: groupIds[0],
      },
      {
        id: 'actionGrouped2',
        name: 'Grouped action 2',
        icon: 'ai',
        groupId: groupIds[0],
      },
      {
        id: 'actionGrouped3',
        name: 'Grouped action 3',
        icon: 'ai',
        groupId: groupIds[1],
      },
    ];

    const { actionDefinitions } = createActionDefinitions();

    wrapper = mountComponent({
      props: { actionDefinitions: [...actionDefinitions, ...actionsWithGroups] },
    });

    const panelElement = await openMenu();
    const groupElements = panelElement.querySelectorAll('.lx-dropdown-menu-group');

    // +1 for ungrouped items
    expect(groupElements.length).toBe(groupIds.length + 1);
  });
});

describe('Group definitions', () => {
  const groupIds = ['group1', 'group2'];

  const actionDefinitions = [
    {
      id: 'action1',
      name: 'Action 1',
      groupId: groupIds[0],
    },
    {
      id: 'action2',
      name: 'Action 2',
      groupId: groupIds[0],
    },
    {
      id: 'action3',
      name: 'Action 3',
      groupId: groupIds[1],
    },
  ];

  test('renders tags in groups', async () => {
    const groupDefinitions = [
      {
        id: groupIds[0],
        kind: 'tags',
      },
      {
        id: groupIds[1],
        kind: 'tags',
      },
    ];

    wrapper = mountComponent({ props: { actionDefinitions, groupDefinitions } });

    const panelElement = await openMenu();
    const groups = panelElement.querySelectorAll('.lx-dropdown-menu-tag-wrapper');

    expect(groups.length).toBe(groupDefinitions.length);

    const action1 = groups[0].querySelector(`[id*="${actionDefinitions[0].id}"]`);
    const action2 = groups[0].querySelector(`[id*="${actionDefinitions[1].id}"]`);
    const action3 = groups[1].querySelector(`[id*="${actionDefinitions[2].id}"]`);

    expect(action1.querySelector('.lx-dropdown-menu-tag-label').textContent).toBe(
      actionDefinitions[0].name
    );
    expect(action2.querySelector('.lx-dropdown-menu-tag-label').textContent).toBe(
      actionDefinitions[1].name
    );
    expect(action3.querySelector('.lx-dropdown-menu-tag-label').textContent).toBe(
      actionDefinitions[2].name
    );
  });

  test('renders groups with labels', async () => {
    const groupDefinitions = [
      {
        id: groupIds[0],
        label: 'Label 1',
      },
      {
        id: groupIds[1],
        label: 'Label 2',
      },
    ];

    wrapper = mountComponent({ props: { actionDefinitions, groupDefinitions } });

    const panelElement = await openMenu();
    const groups = panelElement.querySelectorAll('.lx-dropdown-menu-group');

    expect(groups.length).toBe(groupDefinitions.length);
    expect(groups[0].querySelector(`[id*="${groupDefinitions[0].id}"]`).textContent).toBe(
      groupDefinitions[0].label
    );
    expect(groups[1].querySelector(`[id*="${groupDefinitions[1].id}"]`).textContent).toBe(
      groupDefinitions[1].label
    );

    const action1 = groups[0].querySelector(`[id*="${actionDefinitions[0].id}"]`);
    const action2 = groups[0].querySelector(`[id*="${actionDefinitions[1].id}"]`);
    const action3 = groups[1].querySelector(`[id*="${actionDefinitions[2].id}"]`);

    expect(action1.querySelector('.lx-button-label').textContent).toBe(actionDefinitions[0].name);
    expect(action2.querySelector('.lx-button-label').textContent).toBe(actionDefinitions[1].name);
    expect(action3.querySelector('.lx-button-label').textContent).toBe(actionDefinitions[2].name);
  });
});

describe('Slots', () => {
  describe('Default slot', () => {
    test('renders toggler correctly', () => {
      const { actionDefinitions } = createActionDefinitions();

      const toggler = {
        id: 'togglerButton',
        name: 'Open menu',
      };

      wrapper = mountComponent({
        props: { actionDefinitions },
        slots: { default: h(LxButton, { id: toggler.id, label: toggler.name }) },
      });

      const togglerButtonElement = wrapper.find(`#${toggler.id}`);

      expect(togglerButtonElement.exists()).toBe(true);
      expect(togglerButtonElement.attributes('id')).toBe(toggler.id);
      expect(togglerButtonElement.attributes('aria-label')).toContain(toggler.name);
      expect(togglerButtonElement.find('.lx-button-label').text()).toBe(toggler.name);
    });

    test('does not render main button', async () => {
      const { mainButton, actionDefinitions } = createActionDefinitions();

      const toggler = {
        id: 'togglerButton',
        name: 'Open menu',
      };

      wrapper = mountComponent({
        props: { actionDefinitions },
        slots: { default: h(LxButton, { id: toggler.id, label: toggler.name }) },
      });

      const panelElement = await openMenu();

      expect(panelElement.querySelector(`#${mainButton.id}`)).toBeNull();
    });
  });
});
