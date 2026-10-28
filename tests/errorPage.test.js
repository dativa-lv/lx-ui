import { describe, test, expect, afterEach } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import LxErrorPage from '@/components/ErrorPage.vue';

let wrapper;

afterEach(() => {
  if (wrapper) {
    wrapper.unmount();
  }
});

describe('LxErrorPage nested actions', () => {
  test('places children of a nested trigger where the trigger would be', () => {
    wrapper = mount(LxErrorPage, {
      props: {
        id: 'error',
        actionDefinitions: [
          { id: 'home', name: 'Home', kind: 'secondary', nestedGroupId: 'home' },
          { id: 'homePortal', name: 'Portal home', groupId: 'home' },
          { id: 'back', name: 'Back', kind: 'tertiary' },
        ],
      },
      global: { stubs: { RouterLink: RouterLinkStub } },
    });

    const buttons = wrapper.findAll('.lx-error-action-definitions button');
    expect(buttons.map((b) => b.attributes('id'))).toEqual([
      'error-action-homePortal',
      'error-action-back',
    ]);
    expect(buttons[0].classes()).toContain('lx-button-secondary');
  });

  test('shows only the first primary action as primary', () => {
    wrapper = mount(LxErrorPage, {
      props: {
        id: 'error',
        actionDefinitions: [
          { id: 'home', name: 'Home', kind: 'primary' },
          { id: 'back', name: 'Back', kind: 'primary' },
        ],
      },
      global: { stubs: { RouterLink: RouterLinkStub } },
    });

    expect(wrapper.find('#error-action-home').classes()).not.toContain('lx-button-secondary');
    expect(wrapper.find('#error-action-back').classes()).toContain('lx-button-secondary');
  });

  test('shows actions without a button kind as tertiary', () => {
    wrapper = mount(LxErrorPage, {
      props: {
        id: 'error',
        actionDefinitions: [
          { id: 'back', name: 'Back' },
          { id: 'home', name: 'Home', kind: 'secondary' },
          { id: 'favorite', name: 'Favorite', kind: 'toggle' },
        ],
      },
      global: { stubs: { RouterLink: RouterLinkStub } },
    });

    expect(wrapper.find('#error-action-back').classes()).toContain('lx-button-tertiary');
    expect(wrapper.find('#error-action-home').classes()).toContain('lx-button-secondary');
    expect(wrapper.find('#error-action-favorite').classes()).toContain('lx-button-tertiary');
  });
});
