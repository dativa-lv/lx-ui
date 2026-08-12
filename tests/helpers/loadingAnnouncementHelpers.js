/* eslint-disable no-restricted-imports */
import { test, expect, beforeEach, afterEach, vi } from 'vitest';
import { nextTick } from 'vue';
import { LOADER_VIEW_CONSTANTS } from '@/constants';

const REGION_SELECTOR = 'p.lx-invisible[role="status"]';

export const loadingAnnouncementTexts = {
  loadingStart: 'Loading has started',
  loadingEnd: 'Loading has finished',
};

/**
 * Checks the shared `useLoadingAnnouncer` behaviour of a component that
 * announces its `loading` prop through an always-present live region.
 * @param {Function} mountComponent - Function to mount the component
 * @param {Function} setWrapper - Callback to store wrapper for cleanup (e.g., (w) => {wrapper = w;})
 * @param {Object} [options={}] - Configuration options
 * @param {Object} [options.props={}] - Additional props for component mounting
 * @param {Object} [options.texts] - `texts` prop to mount with; defaults to `loadingStart` / `loadingEnd`
 * @param {Object} [options.expected] - Expected `{ start, end }` announcements; derived from `texts` by default
 */
export function checkLoadingAnnouncement(
  mountComponent,
  setWrapper,
  { props = {}, texts = loadingAnnouncementTexts, expected } = {}
) {
  const expectedTexts = expected ?? { start: texts.loadingStart, end: texts.loadingEnd };

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  async function mountWithLoading(loading) {
    const wrapper = mountComponent({
      props: { ...props, loading, texts },
    });

    setWrapper(wrapper);
    await nextTick();

    return wrapper;
  }

  function getAnnouncement(wrapper) {
    const region = wrapper.get(REGION_SELECTOR);

    expect(region.attributes('aria-live')).toBe('polite');

    return region.text();
  }

  async function setLoading(wrapper, loading) {
    await wrapper.setProps({ loading });
  }

  async function advance(milliseconds) {
    await vi.advanceTimersByTimeAsync(milliseconds);
    await nextTick();
  }

  test('live region is always rendered and starts empty', async () => {
    const wrapper = await mountWithLoading(false);

    expect(getAnnouncement(wrapper)).toBe('');
  });

  test('announces start and end of a slow load', async () => {
    const wrapper = await mountWithLoading(false);

    await setLoading(wrapper, true);
    await advance(LOADER_VIEW_CONSTANTS.DEFAULT_LOADING_DELAY);

    expect(getAnnouncement(wrapper)).toBe(expectedTexts.start);

    await advance(LOADER_VIEW_CONSTANTS.MIN_BETWEEN_LOADING_DELAY);
    await setLoading(wrapper, false);

    expect(getAnnouncement(wrapper)).toBe(expectedTexts.end);
  });

  test('clears the finished announcement so it is not left behind', async () => {
    const wrapper = await mountWithLoading(false);

    await setLoading(wrapper, true);
    await advance(
      LOADER_VIEW_CONSTANTS.DEFAULT_LOADING_DELAY + LOADER_VIEW_CONSTANTS.MIN_BETWEEN_LOADING_DELAY
    );
    await setLoading(wrapper, false);

    expect(getAnnouncement(wrapper)).toBe(expectedTexts.end);

    await advance(LOADER_VIEW_CONSTANTS.DONE_ANNOUNCEMENT_CLEAR_DELAY);

    expect(getAnnouncement(wrapper)).toBe('');
  });

  test('stays silent for a load that finishes before the announcement delay', async () => {
    const wrapper = await mountWithLoading(false);

    await setLoading(wrapper, true);
    await advance(LOADER_VIEW_CONSTANTS.DEFAULT_LOADING_DELAY - 1);
    await setLoading(wrapper, false);

    expect(getAnnouncement(wrapper)).toBe('');

    await advance(LOADER_VIEW_CONSTANTS.DONE_ANNOUNCEMENT_CLEAR_DELAY);

    expect(getAnnouncement(wrapper)).toBe('');
  });

  test('holds back the end announcement until it cannot collide with the start', async () => {
    const wrapper = await mountWithLoading(false);

    await setLoading(wrapper, true);
    await advance(LOADER_VIEW_CONSTANTS.DEFAULT_LOADING_DELAY);
    await setLoading(wrapper, false);

    expect(getAnnouncement(wrapper)).toBe('');

    await advance(LOADER_VIEW_CONSTANTS.MIN_BETWEEN_LOADING_DELAY);

    expect(getAnnouncement(wrapper)).toBe(expectedTexts.end);
  });

  test('waits longer when mounted already loading', async () => {
    const wrapper = await mountWithLoading(true);

    await advance(LOADER_VIEW_CONSTANTS.DEFAULT_LOADING_DELAY);

    expect(getAnnouncement(wrapper)).toBe('');

    await advance(
      LOADER_VIEW_CONSTANTS.INITIAL_MOUNTED_LOADING_DELAY -
        LOADER_VIEW_CONSTANTS.DEFAULT_LOADING_DELAY
    );

    expect(getAnnouncement(wrapper)).toBe(expectedTexts.start);
  });
}
