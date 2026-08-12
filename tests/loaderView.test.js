/* eslint-disable no-restricted-imports */
import { describe, test, expect, afterEach, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import LxLoaderView from '@/components/LoaderView.vue';
import { checkLoadingAnnouncement } from './helpers/loadingAnnouncementHelpers';

let wrapper;

function mountComponent({ props = {} } = {}) {
  expect(LxLoaderView).toBeTruthy();

  return mount(LxLoaderView, { props });
}

beforeEach(() => {
  const el = document.createElement('div');
  el.id = 'poppers';
  document.body.appendChild(el);
});

afterEach(() => {
  document.body.innerHTML = '';
  if (wrapper) {
    wrapper.unmount();
  }
});

test('LxLoaderView component mounts successfully', () => {
  wrapper = mountComponent();

  expect(wrapper.exists()).toBe(true);
});

test('shows the visible label when one is given', () => {
  wrapper = mountComponent({ props: { loading: true, label: 'Loading users' } });

  expect(wrapper.get('.lx-loader-data .lx-primary').text()).toBe('Loading users');
});

test('shows no visible label when label is empty', () => {
  wrapper = mountComponent({ props: { loading: true, label: '' } });

  expect(wrapper.find('.lx-loader-data').exists()).toBe(false);
});

describe('Loading announcement', () => {
  checkLoadingAnnouncement(mountComponent, (w) => {
    wrapper = w;
  });
});
