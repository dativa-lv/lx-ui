import { nextTick } from 'vue';
import { describe, test, expect, afterEach, beforeEach } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import LxDialog from '@/components/Dialog.vue';

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

describe('LxDialog nested actions', () => {
  test('places children of a nested trigger where the trigger would be', async () => {
    wrapper = mount(LxDialog, {
      props: {
        id: 'dialog',
        label: 'Test',
        actionDefinitions: [
          {
            id: 'confirm',
            name: 'Confirm',
            kind: 'primary',
            nestedGroupId: 'confirm',
            disabled: true,
          },
          { id: 'confirmSave', name: 'Save and confirm', groupId: 'confirm' },
          { id: 'cancel', name: 'Cancel', kind: 'secondary' },
        ],
      },
      global: { stubs: { RouterLink: RouterLinkStub } },
    });

    wrapper.vm.open();
    await nextTick();

    const ids = [...document.body.querySelectorAll('#modals button[id^="dialog-action-"]')].map(
      (b) => b.id
    );
    expect(ids).toEqual(['dialog-action-confirmSave', 'dialog-action-cancel']);
    expect(document.getElementById('dialog-action-confirmSave').disabled).toBe(true);
  });
});
