/* eslint-disable no-restricted-imports */
import { describe, test, expect, afterEach, beforeEach } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import LxDataBlock from '@/components/DataBlock.vue';
import {
  actionDefinitionsCommon,
  checkActionDefinitionsButtonsSingle,
  checkActionDefinitionsButtonsPanel,
} from './helpers/actionDefinitionsHelpers';

let wrapper;

function mountComponent({ props = {} } = {}) {
  expect(LxDataBlock).toBeTruthy();

  return mount(LxDataBlock, {
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

test('LxDataBlock component mounts successfully', () => {
  wrapper = mountComponent();

  expect(wrapper.exists()).toBe(true);
});

describe('Action definitions', () => {
  const props = {
    actionDefinitions: [],
  };

  test('no actions', () => {
    wrapper = mountComponent({ props });

    expect(wrapper.find('.additional-buttons').exists()).toBe(false);
  });

  describe('Single action variations', () => {
    checkActionDefinitionsButtonsSingle(
      mountComponent,
      (w) => {
        wrapper = w;
      },
      '.additional-buttons > .lx-button'
    );
  });

  test('renders two actions in dropdown', async () => {
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

    const toggler = wrapper.find('.additional-buttons .lx-dropdown-toggler');

    await toggler.trigger('click');

    const panel = document.body.querySelector('.lx-dropdown-panel-wrapper');
    const panelButtons = panel.querySelectorAll('.lx-button');

    expect(panelButtons.length).toBe(2);

    panelButtons.forEach((button, i) => {
      expect(button.getAttribute('id')).toContain(actions[i].id);
      expect(button.getAttribute('aria-label')).toContain(actions[i].name);
    });
  });

  test('renders many actions in dropdown', async () => {
    wrapper = mountComponent({ props: { ...props, actionDefinitions: actionDefinitionsCommon } });

    const toggler = wrapper.find('.additional-buttons .lx-dropdown-toggler');

    await toggler.trigger('click');

    const panel = document.body.querySelector('.lx-dropdown-panel-wrapper');
    const panelButtons = panel.querySelectorAll('.lx-button');

    checkActionDefinitionsButtonsPanel(panelButtons);
  });
});
