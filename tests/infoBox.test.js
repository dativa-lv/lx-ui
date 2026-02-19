/* eslint-disable no-restricted-imports */
import { describe, test, expect, afterEach, beforeEach } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import LxInfoBox from '@/components/InfoBox.vue';
import {
  actionDefinitionsCommon,
  checkActionDefinitionsButtonsSingle,
  checkActionDefinitionsButtonsMultiple,
} from './helpers/actionDefinitionsHelpers';

let wrapper;

function mountComponent({ props = {} } = {}) {
  expect(LxInfoBox).toBeTruthy();

  return mount(LxInfoBox, {
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

test('LxInfoBox component mounts successfully', () => {
  wrapper = mountComponent();

  expect(wrapper.exists()).toBe(true);
});

describe('Action definitions', () => {
  const props = {
    kind: 'button',
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
      '.additional-buttons .lx-button',
      { props }
    );
  });

  test('many actions', async () => {
    wrapper = mountComponent({ props: { ...props, actionDefinitions: actionDefinitionsCommon } });

    const togglerElement = wrapper.find('.additional-buttons .lx-dropdown-toggler');

    expect(togglerElement.exists()).toBe(true);

    await togglerElement.trigger('click');

    const panelElement = document.body.querySelector('.lx-dropdown-panel-wrapper');
    const buttonElements = panelElement.querySelectorAll('.lx-button');

    checkActionDefinitionsButtonsMultiple(buttonElements);
  });
});
