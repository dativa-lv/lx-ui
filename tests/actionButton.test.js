import { h, nextTick } from 'vue';
import { describe, test, expect, afterEach, beforeEach } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import LxActionButton from '@/components/ActionButton.vue';
import LxButton from '@/components/Button.vue';
import LxConfirmButton from '@/components/ConfirmButton.vue';

let wrapper;

beforeEach(() => {
  const el = document.createElement('div');
  el.id = 'modals';
  document.body.appendChild(el);
});

afterEach(() => {
  if (wrapper) {
    wrapper.unmount();
  }
  document.body.innerHTML = '';
});

function mountComponent(props, attrs = {}) {
  return mount(LxActionButton, {
    props,
    attrs,
    attachTo: document.body,
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

  describe('requiresConfirmation', () => {
    test('renders LxConfirmButton with action confirmation fields', () => {
      wrapper = mountComponent({
        action: {
          id: 'delete',
          name: 'Dzēst',
          destructive: true,
          requiresConfirmation: true,
          dialogKind: 'error',
          texts: { dialogLabel: 'Vai {0} ierakstu?' },
        },
      });

      expect(wrapper.findComponent(LxConfirmButton).props()).toMatchObject({
        label: 'Dzēst',
        destructive: true,
        dialogKind: 'error',
        texts: { dialogLabel: 'Vai {0} ierakstu?' },
      });
    });

    test('forwards click with its arguments only after confirmation', async () => {
      const calls = [];
      wrapper = mountComponent(
        { action: { id: 'delete', name: 'Dzēst', requiresConfirmation: true } },
        { id: 'del', onClick: (...args) => calls.push(args) }
      );

      await wrapper.find('#del').trigger('click');
      expect(calls).toHaveLength(0);
      expect(document.querySelector('#del-dialog-label').textContent).toBe(
        'Vai tiešām gribat dzēst?'
      );

      document.querySelector('#del-dialog-action-primary').click();
      await nextTick();

      expect(calls).toHaveLength(1);
      expect(calls[0][0]).toBeInstanceOf(Event);
    });

    test('does not let the opening click reach parent handlers', async () => {
      let parentClicks = 0;
      wrapper = mount(
        {
          render: () =>
            h(
              'div',
              {
                onClick: () => {
                  parentClicks += 1;
                },
              },
              [
                h(LxActionButton, {
                  id: 'del',
                  action: { id: 'delete', name: 'Dzēst', requiresConfirmation: true },
                }),
              ]
            ),
        },
        { attachTo: document.body }
      );

      await nextTick();
      await wrapper.find('#del').trigger('click');

      expect(parentClicks).toBe(0);
    });

    test('is ignored when not confirmable or with href', () => {
      wrapper = mountComponent({
        action: { id: 'a', name: 'A', requiresConfirmation: true },
        confirmable: false,
      });
      expect(wrapper.findComponent(LxConfirmButton).exists()).toBe(false);
      wrapper.unmount();

      wrapper = mountComponent({
        action: { id: 'a', name: 'A', requiresConfirmation: true, href: { name: 'home' } },
      });
      expect(wrapper.findComponent(LxConfirmButton).exists()).toBe(false);
    });
  });
});
