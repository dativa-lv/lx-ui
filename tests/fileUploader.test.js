/* eslint-disable no-restricted-imports */
import { describe, test, expect, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import LxFileUploader from '@/components/fileUploader/FileUploader.vue';
import LxFileUploaderItem from '@/components/fileUploader/FileUploaderItem.vue';

let wrapper;

const files = [
  {
    id: 'file-1',
    name: 'notes.txt',
    content: null,
    meta: { name: 'notes.txt', size: 2048, type: 'text/plain', lastModified: 1735689600000 },
  },
  {
    id: 'file-2',
    name: 'manual.pdf',
    content: null,
    meta: {
      name: 'manual.pdf',
      size: 524288,
      type: 'application/pdf',
      lastModified: 1735689600000,
    },
  },
];

function mountComponent(props = {}) {
  expect(LxFileUploader).toBeTruthy();

  return mount(LxFileUploader, { props: { id: 'uploader', ...props } });
}

afterEach(() => {
  if (wrapper) {
    wrapper.unmount();
    wrapper = null;
  }
});

describe('Test locator contract', () => {
  test('should expose data-component and data-id on the root', () => {
    wrapper = mountComponent();

    const root = wrapper.find('[data-component="lx-file-uploader"]');

    expect(root.exists()).toBe(true);
    expect(root.classes()).toContain('lx-file-upload-wrapper');
    expect(root.attributes('data-id')).toBe('uploader');
  });

  test('should expose the state that changes the rendered parts', () => {
    wrapper = mountComponent({
      selectionKind: 'single',
      mode: 'compact',
      draggable: true,
      readOnly: false,
    });

    const state = JSON.parse(
      wrapper.find('[data-component="lx-file-uploader"]').attributes('data-state')
    );

    expect(state).toEqual({
      selectionKind: 'single',
      mode: 'compact',
      draggable: true,
      readOnly: false,
    });
  });

  test('should style the upload button as a drop zone only when draggable', async () => {
    wrapper = mountComponent({ draggable: true });

    const dropZone = wrapper.find('.lx-draggable-drop-zone');
    expect(dropZone.exists()).toBe(true);
    const uploadButton = dropZone.find('[data-component="lx-button"]');
    expect(uploadButton.attributes('id')).toBe('uploader-action-file-upload');
    expect(uploadButton.classes()).toContain('lx-draggable-upload-button');

    await wrapper.setProps({ draggable: false });

    expect(wrapper.find('.lx-draggable-drop-zone').exists()).toBe(true);
    expect(
      wrapper.find('.lx-draggable-drop-zone [data-component="lx-button"]').classes()
    ).not.toContain('lx-draggable-upload-button');
  });

  test('should mark the items wrapper', () => {
    wrapper = mountComponent({ modelValue: files });

    expect(wrapper.find('[data-container="file-uploader-items-wrapper"]').exists()).toBe(true);
  });

  // LxList does not lay items out in jsdom, so the item contract is checked on the item itself
  test('should mark a file item with its id', () => {
    wrapper = mount(LxFileUploaderItem, { props: { customItem: files[0] } });

    const item = wrapper.find('[data-container="file-uploader-item"]');

    expect(item.element).toBe(wrapper.element);
    expect(item.attributes('id')).toBe('file-1');
    expect(item.text()).toContain('notes.txt');
  });
});
