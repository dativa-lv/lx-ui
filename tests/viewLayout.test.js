import { describe, test, expect, afterEach } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import LxViewLayout from '@/components/ViewLayout.vue';

let wrapper;

afterEach(() => {
  if (wrapper) {
    wrapper.unmount();
  }
});

describe('LxViewLayout nested actions', () => {
  test('places children of a nested trigger where the trigger would be', () => {
    wrapper = mount(LxViewLayout, {
      props: {
        actionDefinitions: [
          {
            id: 'export',
            name: 'Export',
            icon: 'download',
            kind: 'secondary',
            nestedGroupId: 'export',
            disabled: true,
          },
          { id: 'exportPdf', name: 'Export PDF', icon: 'download', groupId: 'export' },
          { id: 'refresh', name: 'Refresh', icon: 'refresh' },
        ],
      },
      global: { stubs: { RouterLink: RouterLinkStub } },
    });

    const buttons = wrapper.findAll('.header-container button');
    expect(buttons.map((b) => b.attributes('id'))).toEqual(['exportPdf', 'refresh']);
    expect(buttons[0].classes()).toContain('lx-button-secondary');
    expect(buttons[0].attributes('disabled')).toBeDefined();
  });

  test('shows only the first primary action as primary', () => {
    wrapper = mount(LxViewLayout, {
      props: {
        actionDefinitions: [
          { id: 'save', name: 'Save', icon: 'save', kind: 'primary', variant: 'default' },
          { id: 'send', name: 'Send', icon: 'email', kind: 'primary', variant: 'default' },
        ],
      },
      global: { stubs: { RouterLink: RouterLinkStub } },
    });

    expect(wrapper.find('#save').classes()).not.toContain('lx-button-secondary');
    expect(wrapper.find('#send').classes()).toContain('lx-button-secondary');
  });
});
