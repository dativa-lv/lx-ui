import { describe, test, expect, afterEach } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import LxEmptyState from '@/components/EmptyState.vue';

let wrapper;

afterEach(() => {
  if (wrapper) {
    wrapper.unmount();
  }
});

describe('LxEmptyState nested actions', () => {
  test('renders children of a nested trigger as buttons', () => {
    wrapper = mount(LxEmptyState, {
      props: {
        label: 'Empty',
        actionDefinitions: [
          { id: 'add', name: 'Add', icon: 'add', nestedGroupId: 'add', disabled: true },
          { id: 'addFile', name: 'Add file', icon: 'upload', groupId: 'add' },
          { id: 'addLink', name: 'Add link', icon: 'link', groupId: 'add' },
        ],
      },
      global: { stubs: { RouterLink: RouterLinkStub } },
    });

    const ids = wrapper.findAll('.lx-empty-state-buttons button').map((b) => b.attributes('id'));
    expect(ids).toEqual(['addFile', 'addLink']);
    expect(wrapper.find('#addFile').attributes('disabled')).toBeDefined();
  });
});
