// @ts-nocheck
import { mount } from '@vue/test-utils';
import { describe, test, expect, afterEach } from 'vitest';
import LxMarkdownTextArea from '@/components/MarkdownTextArea.vue';

let wrapper;

afterEach(() => {
  if (wrapper) {
    wrapper.unmount();
  }
});

describe('LxMarkdownTextArea', () => {
  test('should be a valid component', () => {
    expect(LxMarkdownTextArea).toBeTruthy();
  });

  describe('Test locator contract', () => {
    test('should expose data-component and data-id on the root', () => {
      wrapper = mount(LxMarkdownTextArea, { props: { id: 'test-id' } });

      const root = wrapper.find('[data-component="lx-markdown-text-area"]');

      expect(root.exists()).toBe(true);
      expect(root.attributes('data-id')).toBe('test-id');
      expect(root.attributes('id')).toBe('test-id');
    });

    test('should expose readOnly through data-state', () => {
      wrapper = mount(LxMarkdownTextArea, { props: { id: 'test-id', readOnly: false } });

      const root = wrapper.find('[data-component="lx-markdown-text-area"]');

      expect(JSON.parse(root.attributes('data-state'))).toStrictEqual({ readOnly: false });
    });

    test('should reflect readOnly changes in data-state', async () => {
      wrapper = mount(LxMarkdownTextArea, { props: { id: 'test-id', readOnly: false } });

      await wrapper.setProps({ readOnly: true });

      const root = wrapper.find('[data-component="lx-markdown-text-area"]');

      expect(JSON.parse(root.attributes('data-state'))).toStrictEqual({ readOnly: true });
    });
  });
});
