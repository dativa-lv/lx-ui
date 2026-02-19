/* eslint-disable no-restricted-imports */
import { describe, test, expect, afterEach, beforeEach } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import LxToolbar from '@/components/Toolbar.vue';
import {
  actionDefinitionsCommon,
  checkActionDefinitionsButtonsSingle,
  checkActionDefinitionsButtonsMultiple,
} from './helpers/actionDefinitionsHelpers';

let wrapper;

function mountComponent({ props = {} } = {}) {
  expect(LxToolbar).toBeTruthy();

  return mount(LxToolbar, {
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

test('LxToolbar component mounts successfully', () => {
  wrapper = mountComponent();

  expect(wrapper.exists()).toBe(true);
});

describe('Action definitions', () => {
  test('no actions', () => {
    wrapper = mountComponent();

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

  test('many actions in default (right) area', () => {
    wrapper = mountComponent({ props: { actionDefinitions: actionDefinitionsCommon } });

    const buttonElements = wrapper.findAll('.right-area .action-definitions-group .lx-button');

    checkActionDefinitionsButtonsMultiple(buttonElements, { areIconOnly: true });
  });

  test('many actions in left area (using defaultArea prop)', () => {
    wrapper = mountComponent({
      props: { actionDefinitions: actionDefinitionsCommon, defaultArea: 'left' },
    });

    const buttonElements = wrapper.findAll('.left-area .action-definitions-group .lx-button');

    checkActionDefinitionsButtonsMultiple(buttonElements, { areIconOnly: true });
  });

  test('many actions in left area (using area property for each action)', () => {
    const actionDefinitions = actionDefinitionsCommon.map((action) => ({
      ...action,
      area: 'left',
    }));

    wrapper = mountComponent({ props: { actionDefinitions } });

    const buttonElements = wrapper.findAll('.left-area .action-definitions-group .lx-button');

    checkActionDefinitionsButtonsMultiple(buttonElements, {
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

      wrapper = mountComponent({
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

    test('renders two parents, each in separate group', () => {
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

      wrapper = mountComponent({
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
});
