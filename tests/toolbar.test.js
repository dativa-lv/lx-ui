/* eslint-disable no-restricted-imports */
import { describe, test, expect, afterEach, beforeEach } from 'vitest';
import { mount, RouterLinkStub, flushPromises } from '@vue/test-utils';
import LxToolbar from '@/components/Toolbar.vue';
import {
  actionDefinitionsCommon,
  checkActionDefinitionsButtonsSingle,
  checkActionDefinitionsButtonsMultiple,
} from './helpers/actionDefinitionsHelpers';

let wrapper;

async function mountComponent({ props = {}, slots = {} } = {}) {
  expect(LxToolbar).toBeTruthy();

  const mounted = mount(LxToolbar, {
    props,
    slots,
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
      },
    },
  });

  await flushPromises();

  return mounted;
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

test('LxToolbar component mounts successfully', async () => {
  wrapper = await mountComponent();

  expect(wrapper.exists()).toBe(true);
});

describe('Action definitions', () => {
  test('no actions', async () => {
    wrapper = await mountComponent();

    expect(wrapper.classes()).toContain('lx-toolbar-empty');
    expect(wrapper.findAll('.action-definitions-group')).toHaveLength(0);
  });

  describe('Single action variations in default (right) area', () => {
    checkActionDefinitionsButtonsSingle(
      mountComponent,
      (w) => {
        wrapper = w;
      },
      '.right-area .action-definitions-group .lx-button'
    );
  });

  describe('Single action variations in left area (using defaultArea prop)', () => {
    checkActionDefinitionsButtonsSingle(
      mountComponent,
      (w) => {
        wrapper = w;
      },
      '.left-area .action-definitions-group .lx-button',
      { props: { defaultArea: 'left' } }
    );
  });

  test('many actions in default (right) area', async () => {
    wrapper = await mountComponent({ props: { actionDefinitions: actionDefinitionsCommon } });

    const buttonElements = wrapper.findAll('.right-area .action-definitions-group .lx-button');

    checkActionDefinitionsButtonsMultiple(buttonElements, { wrapper, areIconOnly: true });
  });

  test('many actions in left area (using defaultArea prop)', async () => {
    wrapper = await mountComponent({
      props: { actionDefinitions: actionDefinitionsCommon, defaultArea: 'left' },
    });

    const buttonElements = wrapper.findAll('.left-area .action-definitions-group .lx-button');

    checkActionDefinitionsButtonsMultiple(buttonElements, { wrapper, areIconOnly: true });
  });

  test('many actions in left area (using area property for each action)', async () => {
    const actionDefinitions = actionDefinitionsCommon.map((action) => ({
      ...action,
      area: 'left',
    }));

    wrapper = await mountComponent({ props: { actionDefinitions } });

    const buttonElements = wrapper.findAll('.left-area .action-definitions-group .lx-button');

    checkActionDefinitionsButtonsMultiple(buttonElements, {
      wrapper,
      actionDefinitionsOverride: actionDefinitions,
      areIconOnly: true,
    });
  });

  describe('Nested actions', () => {
    test('renders one parent with two children', async () => {
      const parentGroupId = 'parentGroup';

      const parentAction = {
        id: 'parent',
        name: 'Parent button',
        icon: 'menu',
        nestedGroupId: parentGroupId,
      };

      const childrenActions = [
        {
          id: 'child1',
          name: 'Child button 1',
          icon: 'ai',
          groupId: parentGroupId,
        },
        {
          id: 'child2',
          name: 'Child button 2',
          icon: 'ai',
          groupId: parentGroupId,
        },
      ];

      wrapper = await mountComponent({
        props: { actionDefinitions: [parentAction, ...childrenActions] },
      });

      const parents = wrapper.findAll('.right-area .action-definitions-group .lx-button');

      expect(parents.length).toBe(1);
      expect(parents[0].attributes('id')).toContain(parentAction.id);
      expect(parents[0].attributes('aria-label')).toContain(parentAction.name);

      await parents[0].trigger('click');

      const panel = document.body.querySelector('.lx-dropdown-panel-wrapper');
      const children = panel.querySelectorAll('.lx-button');

      expect(children.length).toBe(2);

      children.forEach((child, i) => {
        expect(child.getAttribute('id')).toContain(childrenActions[i].id);
        expect(child.getAttribute('aria-label')).toContain(childrenActions[i].name);
        expect(child.querySelector('.lx-button-label').textContent).toBe(childrenActions[i].name);
      });
    });

    test('renders two parents, each in separate group', async () => {
      const parentGroupIds = ['parentGroup1', 'parentGroup2'];
      const groupIds = ['group1', 'group2'];

      const parentActions = [
        {
          id: 'parent1',
          name: 'Parent button 1',
          icon: 'menu',
          nestedGroupId: parentGroupIds[0],
          groupId: groupIds[0],
        },
        {
          id: 'parent2',
          name: 'Parent button 2',
          icon: 'menu',
          nestedGroupId: parentGroupIds[1],
          groupId: groupIds[1],
        },
      ];

      const childrenActions = [
        {
          id: 'child1',
          name: 'Child button 1',
          icon: 'ai',
          groupId: parentGroupIds[0],
        },
        {
          id: 'child2',
          name: 'Child button 2',
          icon: 'ai',
          groupId: parentGroupIds[1],
        },
      ];

      wrapper = await mountComponent({
        props: { actionDefinitions: [...parentActions, ...childrenActions] },
      });

      const parents = wrapper.findAll('.right-area .action-definitions-group .lx-button');

      expect(parents.length).toBe(2);

      parents.forEach((parent, i) => {
        expect(parent.attributes('id')).toContain(parentActions[i].id);
        expect(parent.attributes('aria-label')).toContain(parentActions[i].name);
      });
    });
  });

  describe("kind: 'toggle'", () => {
    test('renders toggle as action', async () => {
      const action = {
        id: 'testToggle',
        name: 'Test toggle',
        kind: 'toggle',
      };

      wrapper = await mountComponent({ props: { actionDefinitions: [action] } });

      const toggle = wrapper.find('.right-area .action-definitions-group .lx-toggle');

      expect(toggle.exists()).toBe(true);
      expect(toggle.attributes('id')).toContain(action.id);
      expect(toggle.attributes('aria-label')).toContain(action.name);
    });

    test('renders toggle as nested action', async () => {
      const parentGroupId = 'parentGroup';

      const parentAction = {
        id: 'parent',
        name: 'Parent button',
        icon: 'menu',
        nestedGroupId: parentGroupId,
      };

      const childAction = {
        id: 'testToggle',
        name: 'Test toggle',
        kind: 'toggle',
        groupId: parentGroupId,
      };

      wrapper = await mountComponent({ props: { actionDefinitions: [parentAction, childAction] } });

      const parent = wrapper.find('.right-area .action-definitions-group .lx-button');

      expect(parent.exists()).toBe(true);
      expect(parent.attributes('id')).toContain(parentAction.id);
      expect(parent.attributes('aria-label')).toContain(parentAction.name);

      await parent.trigger('click');

      const panel = document.body.querySelector('.lx-dropdown-panel-wrapper');
      const child = panel.querySelector('.lx-dropdown-menu-toggle-wrapper');
      const label = child.querySelector('.lx-dropdown-toggle-label');
      const toggle = child.querySelector('.lx-toggle');

      expect(label.getAttribute('id')).toContain(childAction.id);
      expect(label.textContent).toBe(childAction.name);
      expect(toggle.getAttribute('id')).toContain(childAction.id);
      expect(toggle.getAttribute('aria-label')).toContain(childAction.name);
    });
  });

  describe("kind: 'slot'", () => {
    const slotAction = {
      id: 'testSlot',
      kind: 'slot',
    };

    const slotInnerId = 'test-slot';
    const slotInnerText = 'Test slot';
    const slotContents = `<div id="${slotInnerId}">${slotInnerText}</div>`;

    test('renders slot as action', async () => {
      wrapper = await mountComponent({
        props: { actionDefinitions: [slotAction] },
        slots: { [slotAction.id]: slotContents },
      });

      const slotElement = wrapper.find(`.lx-toolbar-action-slot[id$="${slotAction.id}"]`);

      expect(slotElement.exists()).toBe(true);
      expect(slotElement.attributes('id').endsWith(slotAction.id)).toBe(true);
      expect(slotElement.find(`#${slotInnerId}`).text()).toBe(slotInnerText);
    });

    test('renders slot as action between other actions', async () => {
      const actions = [
        {
          id: 'action1',
          name: 'Action 1',
          icon: 'ai',
        },
        slotAction,
        {
          id: 'action2',
          name: 'Action 2',
          icon: 'ai',
        },
      ];

      wrapper = await mountComponent({
        props: { actionDefinitions: actions },
        slots: { [slotAction.id]: slotContents },
      });

      const elements = wrapper.get('.action-definitions-group').findAll(':scope > *');

      expect(elements.length).toBe(actions.length);
      expect(elements[0].attributes('id')).toContain(actions[0].id);
      expect(elements[1].attributes('id')).toContain(slotAction.id);
      expect(elements[1].find(`#${slotInnerId}`).text()).toBe(slotInnerText);
      expect(elements[2].attributes('id')).toContain(actions[2].id);
    });
  });
});
