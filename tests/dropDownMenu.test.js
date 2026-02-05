import { h } from 'vue';
import { describe, test, expect, afterEach, beforeEach } from 'vitest';
import LxDropDownMenu from '@/components/DropDownMenu.vue';
import LxButton from '@/components/Button.vue';
import { mount, RouterLinkStub } from '@vue/test-utils';

let wrapper;

// Helper function to create test action definitions
function createActionDefinitions() {
  const groupIds = ['group1', 'group2'];

  const mainButton = {
    id: 'mainButton',
    name: 'Open menu',
    icon: 'overflow-menu',
    title: 'This is main button',
    kind: 'main',
  };

  const actions = {
    buttons: [
      {
        id: 'actionSimple',
        name: 'Simple action',
        icon: 'ai',
        title: 'This is a simple action',
        groupId: groupIds[0],
      },
      {
        id: 'actionDestructive',
        name: 'Destructive action',
        icon: 'ai',
        groupId: groupIds[0],
        destructive: true,
      },
      {
        id: 'actionDisabled',
        name: 'Disabled action',
        icon: 'ai',
        groupId: groupIds[1],
        disabled: true,
      },
      {
        id: 'actionBusy',
        name: 'Busy action',
        icon: 'ai',
        busy: true,
      },
      {
        id: 'actionLoading',
        name: 'Loading action',
        icon: 'ai',
        loading: true,
      },
      {
        id: 'actionActive',
        name: 'Active action',
        icon: 'ai',
        active: true,
      },
      {
        id: 'actionBadge',
        name: 'Action with badge',
        icon: 'ai',
        badge: '🌞',
      },
    ],
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
    groupIds,
    mainButton,
    actions,
    actionDefinitions: [mainButton, ...actions.buttons, ...actions.toggles],
  };
}

// Helper function to mount component
function mountComponent({ props = {}, slots = {} } = {}) {
  expect(LxDropDownMenu).toBeTruthy();

  return mount(LxDropDownMenu, {
    props: {
      actionDefinitions: [],
      ...props,
    },
    slots,
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
      },
    },
  });
}

// Helper function to open menu
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

describe('LxDropDownMenu', () => {
  describe('Component mounting', () => {
    test('mounts successfully', () => {
      wrapper = mountComponent();

      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('Action definitions', () => {
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

    test('renders buttons correctly', async () => {
      const {
        actions: { buttons },
        actionDefinitions,
      } = createActionDefinitions();

      wrapper = mountComponent({ props: { actionDefinitions } });

      const panelElement = await openMenu();
      const buttonElements = panelElement.querySelectorAll('.lx-button');

      expect(buttonElements.length).toBe(buttons.length);

      buttonElements.forEach((button, i) => {
        expect(button.getAttribute('id')).toBe(buttons[i].id);
        expect(button.getAttribute('aria-label')).toContain(buttons[i].name);
        expect(button.querySelector('.lx-button-label').textContent).toBe(buttons[i].name);

        if (buttons[i].title) {
          expect(button.getAttribute('title')).toBe(buttons[i].title);
        }

        if (buttons[i].destructive) {
          expect(button.classList.contains('lx-destructive')).toBe(true);
        }

        if (buttons[i].disabled) {
          expect(button.getAttribute('disabled')).toBeDefined();
          expect(button.getAttribute('aria-disabled')).toBe('true');
        }

        if (buttons[i].busy) {
          expect(button.classList.contains('lx-busy')).toBe(true);
        }

        if (buttons[i].loading) {
          expect(button.classList.contains('lx-disabled')).toBe(true);
        }

        if (buttons[i].active) {
          expect(button.classList.contains('lx-active')).toBe(true);
        }

        if (buttons[i].badge) {
          expect(button.querySelector('.lx-badge')).toBeTruthy();
        }
      });
    });

    test('renders toggles correctly', async () => {
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
      const { groupIds, actionDefinitions } = createActionDefinitions();

      wrapper = mountComponent({ props: { actionDefinitions } });

      const panelElement = await openMenu();
      const groupElements = panelElement.querySelectorAll('.lx-dropdown-menu-group');

      // +1 for ungrouped items
      expect(groupElements.length).toBe(groupIds.length + 1);
    });
  });

  describe('Slots', () => {
    describe('Default slot', () => {
      test('renders toggler correctly', async () => {
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
});
