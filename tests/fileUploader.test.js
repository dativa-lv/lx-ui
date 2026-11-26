/* eslint-disable no-restricted-imports */
import { describe, test, expect, afterEach, vi } from 'vitest';
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

describe('Files with unreadable metadata', () => {
  // A real archive with one entry, encrypted with a password (ZipCrypto)
  const protectedZip =
    'UEsDBBQAAQAAAOtjeV1DvrfoDQAAAAEAAAAFAAAAYS50eHTWV4BIN5xKbh6I85eEUEsBAj8AFAABAAAA62N5XUO+t+gN' +
    'AAAAAQAAAAUAJAAAAAAAAAAgAAAAAAAAAGEudHh0CgAgAAAAAAABABgAD8MdHch83QEAAAAAAAAAAAAAAAAAAAAAUEsF' +
    'BgAAAAABAAEAVwAAADAAAAAAAA==';

  async function upload(file) {
    wrapper = mountComponent();

    const input = wrapper.find('input[type="file"]');
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true });
    await input.trigger('change');
    await vi.waitFor(() => expect(wrapper.emitted('update:modelValue')).toBeTruthy());

    return wrapper.emitted('update:modelValue').at(-1)[0][0];
  }

  test('should keep the content of a password-protected archive', async () => {
    const bytes = Uint8Array.from(atob(protectedZip), (char) => char.charCodeAt(0));
    const file = new File([bytes], 'protected.zip', { type: 'application/zip' });

    const item = await upload(file);

    expect(item.meta.passwordProtected).toBe(true);
    expect(item.content).toBeInstanceOf(File);
    expect(item.content.size).toBe(file.size);
    expect(wrapper.emitted('onError')).toBeUndefined();
  });

  test('should not keep the content of a damaged archive', async () => {
    const item = await upload(new File(['not a zip'], 'damaged.zip', { type: 'application/zip' }));

    expect(item.meta.passwordProtected).toBeUndefined();
    expect(item.content).toBeUndefined();
    expect(wrapper.emitted('onError')).toHaveLength(1);
  });
});
