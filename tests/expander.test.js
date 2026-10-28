import { test, expect, describe, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import LxExpander from '@/components/Expander.vue';

let wrapper;

afterEach(() => {
  if (wrapper) {
    wrapper.unmount();
  }
});

describe('LxExpander nested actions', () => {
  test('renders the only child of a nested trigger as a button', () => {
    wrapper = mount(LxExpander, {
      props: {
        label: 'Expander',
        actionDefinitions: [
          { id: 'share', name: 'Share', icon: 'share', nestedGroupId: 'share', disabled: true },
          { id: 'shareLink', name: 'Copy link', icon: 'link', groupId: 'share' },
        ],
      },
    });

    expect(wrapper.find('#share').exists()).toBe(false);
    const button = wrapper.find('#shareLink');
    expect(button.exists()).toBe(true);
    expect(button.attributes('disabled')).toBeDefined();
    expect(wrapper.find('.lx-dropdown-toggler').exists()).toBe(false);
  });

  test('keeps a nested trigger without children as a regular action', () => {
    wrapper = mount(LxExpander, {
      props: {
        label: 'Expander',
        actionDefinitions: [{ id: 'share', name: 'Share', icon: 'share', nestedGroupId: 'share' }],
      },
    });

    expect(wrapper.find('#share').exists()).toBe(true);
  });
});
