// @ts-nocheck
import { mount } from '@vue/test-utils';
import { test, expect, afterEach } from 'vitest';
import LxBadge from '@/components/Badge.vue';

let wrapper;

afterEach(() => {
  if (wrapper) {
    wrapper.unmount();
  }
});

test('LxBadge default type', () => {
  wrapper = mount(LxBadge, { props: { value: 'test' } });
  expect(wrapper.find('.lx-badge .lx-badge-text').classes()).not.toContain('lx-badge-type-number');
});

test('LxBadge number type', () => {
  wrapper = mount(LxBadge, { props: { value: '123' } });
  expect(wrapper.find('.lx-badge .lx-badge-text').classes()).toContain('lx-badge-type-number');
});

test('LxBadge number type by prop', () => {
  wrapper = mount(LxBadge, { props: { value: 'test', type: 'number' } });
  expect(wrapper.find('.lx-badge .lx-badge-text').classes()).toContain('lx-badge-type-number');
});

test('LxBadge with icon', () => {
  wrapper = mount(LxBadge, { props: { value: 'test', icon: 'flash' } });
  expect(wrapper.find('.lx-badge svg').exists()).toBe(true);
  expect(wrapper.find('.lx-badge').classes()).not.toContain('lx-badge-icon-only');
});

test('LxBadge icon-only', () => {
  wrapper = mount(LxBadge, { props: { value: '', icon: 'flash' } });
  expect(wrapper.find('.lx-badge svg').exists()).toBe(true);
  expect(wrapper.find('.lx-badge').classes()).toContain('lx-badge-icon-only');
});
