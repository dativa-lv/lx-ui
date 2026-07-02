import { h, defineComponent, inject, nextTick } from 'vue';
import { describe, test, expect, afterEach, beforeEach, vi } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import LxModalForm from '@/components/ModalForm.vue';
import LxDropDownMenu from '@/components/DropDownMenu.vue';
import LxButton from '@/components/Button.vue';

let wrapper;
let capturedFocusTrap;

// Captures the `parentFocusTrap` that LxModalForm provides to its descendants.
// LxDropDownMenu (used by pop-ups such as LxDateTimePicker) relies on this
// injection to pause the modal's focus trap while its panel is open.
const FocusTrapProbe = defineComponent({
  name: 'FocusTrapProbe',
  setup() {
    capturedFocusTrap = inject('parentFocusTrap', null);
    return () => h('div', { class: 'focus-trap-probe' });
  },
});

function mountModal(slots = {}) {
  return mount(LxModalForm, {
    props: { label: 'Test modal' },
    slots,
    global: { stubs: { RouterLink: RouterLinkStub } },
  });
}

beforeEach(() => {
  capturedFocusTrap = undefined;
  ['modals', 'poppers'].forEach((id) => {
    const el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);
  });
});

afterEach(() => {
  if (wrapper) {
    wrapper.unmount();
  }
  document.body.innerHTML = '';
});

describe('LxModalForm focus trap provisioning', () => {
  // Regression: without a provided `parentFocusTrap`, nested pop-ups (e.g. the
  // LxDateTimePicker dropdown) could not pause the modal's focus trap, which
  // stole focus back and cleared partial mouse selections when
  // clear-if-not-exact was enabled.
  test('provides parentFocusTrap with pause/unpause to descendant pop-ups', async () => {
    wrapper = mountModal({ default: () => h(FocusTrapProbe) });

    wrapper.vm.open();
    await nextTick();

    expect(capturedFocusTrap).toBeTruthy();
    expect(typeof capturedFocusTrap.pause).toBe('function');
    expect(typeof capturedFocusTrap.unpause).toBe('function');
  });

  test('opening a nested LxDropDownMenu pauses the modal trap and closing unpauses it', async () => {
    wrapper = mountModal({
      default: () => [
        h(FocusTrapProbe),
        h(LxDropDownMenu, null, { default: () => h(LxButton, { label: 'Toggle' }) }),
      ],
    });

    wrapper.vm.open();
    await nextTick();

    expect(capturedFocusTrap).toBeTruthy();
    const pauseSpy = vi.spyOn(capturedFocusTrap, 'pause');
    const unpauseSpy = vi.spyOn(capturedFocusTrap, 'unpause');

    const toggler = document.querySelector('.lx-dropdown-toggler');
    expect(toggler).toBeTruthy();

    // Open the dropdown -> should pause the surrounding modal trap.
    toggler.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(pauseSpy).toHaveBeenCalled();

    // Close the dropdown -> should unpause it again.
    toggler.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(unpauseSpy).toHaveBeenCalled();
  });
});
