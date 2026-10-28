import { describe, test, expect, afterEach } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import LxActionButton from '@/components/ActionButton.vue';
import LxButton from '@/components/Button.vue';

let wrapper;

afterEach(() => {
  if (wrapper) {
    wrapper.unmount();
  }
});

function mountComponent(props, attrs = {}) {
  return mount(LxActionButton, {
    props,
    attrs,
    global: { stubs: { RouterLink: RouterLinkStub } },
  });
}

describe('LxActionButton', () => {
  test('passes action fields to the button', () => {
    wrapper = mountComponent({
      action: {
        id: 'save',
        name: 'Save',
        title: 'Save changes',
        icon: 'save',
        kind: 'secondary',
        destructive: true,
        badge: '2',
        badgeType: 'warning',
        customClass: 'extra',
      },
    });

    expect(wrapper.findComponent(LxButton).props()).toMatchObject({
      label: 'Save',
      title: 'Save changes',
      icon: 'save',
      kind: 'secondary',
      destructive: true,
      badge: '2',
      badgeType: 'warning',
      customClass: 'extra',
    });
  });

  test('supports label and tooltip aliases', () => {
    wrapper = mountComponent({ action: { id: 'a', label: 'Label', tooltip: 'Tooltip' } });

    expect(wrapper.findComponent(LxButton).props()).toMatchObject({
      label: 'Label',
      title: 'Tooltip',
    });
  });

  test('leaves out omitted fields', () => {
    wrapper = mountComponent({
      action: { id: 'a', name: 'A', icon: 'save', customClass: 'extra' },
      omit: ['icon', 'customClass'],
    });

    const button = wrapper.findComponent(LxButton).props();
    expect(button.icon).toBe('');
    expect(button.customClass).toBe('');
  });

  test('lets the parent override action fields', async () => {
    wrapper = mountComponent(
      { action: { id: 'a', name: 'A', kind: 'primary', disabled: false } },
      { id: 'my-button', kind: 'ghost', disabled: true }
    );

    const button = wrapper.findComponent(LxButton);
    expect(button.props()).toMatchObject({ id: 'my-button', kind: 'ghost', disabled: true });
  });

  test('applies classes from the action and the parent', () => {
    wrapper = mountComponent(
      { action: { id: 'a', name: 'A', customClass: 'from-action' } },
      {
        customClass: 'from-parent',
      }
    );

    expect(wrapper.findComponent(LxButton).props('customClass')).toBe('from-action from-parent');
  });

  test('forwards click and exposes the button element', async () => {
    let clicked = 0;
    wrapper = mountComponent(
      { action: { id: 'a', name: 'A' } },
      {
        onClick: () => {
          clicked += 1;
        },
      }
    );

    await wrapper.find('button').trigger('click');

    expect(clicked).toBe(1);
    expect(wrapper.vm.getElement()).toBe(wrapper.find('button').element);
  });
});
