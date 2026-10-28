import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetNavigationTracking, trackNavigationState } from '@/utils/navigationState';
import { isAppVersionChanged, restoreRouteAndNotify } from '@/utils/versionCheckUtils';

vi.mock('@/hooks/useLx', () => ({
  default: () => ({ getGlobals: () => ({ environment: 'test' }) }),
}));

vi.mock('axios', () => ({ default: { get: vi.fn() } }));

function mockRouter(currentName = 'home', hasRoute = true) {
  return {
    isReady: vi.fn(() => Promise.resolve()),
    hasRoute: vi.fn(() => hasRoute),
    currentRoute: { value: { name: currentName } },
    replace: vi.fn(() => Promise.resolve()),
  };
}

const mockNotify = () => ({ pushWarning: vi.fn() });

describe('navigationState', () => {
  beforeEach(() => sessionStorage.clear());

  it('stores the intended route while navigating', () => {
    trackNavigationState({ name: 'accessibility', params: { lang: 'lv' }, query: {} });

    expect(sessionStorage.getItem('is_navigating')).toBe('true');
    expect(JSON.parse(sessionStorage.getItem('intended_route'))).toEqual({
      name: 'accessibility',
      params: { lang: 'lv' },
      query: {},
    });
  });

  it('does not overwrite the route that is about to be restored', () => {
    sessionStorage.setItem('version_update_notification', 'true');
    sessionStorage.setItem('intended_route', JSON.stringify({ name: 'accessibility' }));

    trackNavigationState({ name: 'home', params: {}, query: {} });

    expect(JSON.parse(sessionStorage.getItem('intended_route')).name).toBe('accessibility');
  });

  it('clears tracking after a normal navigation', () => {
    trackNavigationState({ name: 'home', params: {}, query: {} });

    resetNavigationTracking();

    expect(sessionStorage.getItem('is_navigating')).toBeNull();
    expect(sessionStorage.getItem('intended_route')).toBeNull();
  });

  // Regression: afterEach used to wipe these keys on a 200ms timer, which fired long
  // before location.reload() unloaded the page - so the route was never restored
  it('keeps the intended route while a version reload is in flight', () => {
    vi.useFakeTimers();
    try {
      trackNavigationState({ name: 'accessibility', params: { lang: 'lv' }, query: {} });
      sessionStorage.setItem('version_reload_pending', 'true');
      sessionStorage.setItem('version_update_notification', 'true');

      resetNavigationTracking();
      // A real reload takes far longer than the old 200ms cleanup timer
      vi.advanceTimersByTime(2000);

      expect(sessionStorage.getItem('intended_route')).not.toBeNull();
      expect(sessionStorage.getItem('version_reload_pending')).toBe('true');
      expect(sessionStorage.getItem('version_update_notification')).toBe('true');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('restoreRouteAndNotify', () => {
  beforeEach(() => sessionStorage.clear());

  it('does nothing when no version reload is pending', async () => {
    const router = mockRouter();
    const notify = mockNotify();

    restoreRouteAndNotify(router, notify, 'reloaded');

    expect(notify.pushWarning).not.toHaveBeenCalled();
    expect(router.isReady).not.toHaveBeenCalled();
  });

  it('notifies and restores the saved route', async () => {
    sessionStorage.setItem('version_reload_pending', 'true');
    sessionStorage.setItem('version_update_notification', 'true');
    sessionStorage.setItem(
      'intended_route',
      JSON.stringify({ name: 'accessibility', params: { lang: 'lv' }, query: {} })
    );
    const router = mockRouter('home');
    const notify = mockNotify();

    restoreRouteAndNotify(router, notify, 'reloaded');
    await router.isReady.mock.results[0].value;

    expect(notify.pushWarning).toHaveBeenCalledWith('reloaded', null, 0);
    expect(router.replace).toHaveBeenCalledWith({
      name: 'accessibility',
      params: { lang: 'lv' },
      query: {},
    });
  });

  it('clears every version key up front', () => {
    sessionStorage.setItem('version_reload_pending', 'true');
    sessionStorage.setItem('version_update_notification', 'true');
    sessionStorage.setItem('is_navigating', 'true');
    sessionStorage.setItem('intended_route', JSON.stringify({ name: 'accessibility' }));

    restoreRouteAndNotify(mockRouter(), mockNotify(), 'reloaded');

    [
      'version_reload_pending',
      'version_update_notification',
      'is_navigating',
      'intended_route',
    ].forEach((key) => expect(sessionStorage.getItem(key)).toBeNull());
  });

  it('skips the replace when the reload already landed on the intended route', async () => {
    sessionStorage.setItem('version_reload_pending', 'true');
    sessionStorage.setItem('version_update_notification', 'true');
    sessionStorage.setItem('intended_route', JSON.stringify({ name: 'accessibility' }));
    const router = mockRouter('accessibility');

    restoreRouteAndNotify(router, mockNotify(), 'reloaded');
    await router.isReady.mock.results[0].value;

    expect(router.replace).not.toHaveBeenCalled();
  });

  it('does not restore an unknown route', async () => {
    sessionStorage.setItem('version_reload_pending', 'true');
    sessionStorage.setItem('version_update_notification', 'true');
    sessionStorage.setItem('intended_route', JSON.stringify({ name: 'removedInThisRelease' }));
    const router = mockRouter('home', false);

    restoreRouteAndNotify(router, mockNotify(), 'reloaded');
    await router.isReady.mock.results[0].value;

    expect(router.replace).not.toHaveBeenCalled();
  });

  it('resolves a text getter at notify time, so the locale is current', () => {
    sessionStorage.setItem('version_reload_pending', 'true');
    sessionStorage.setItem('version_update_notification', 'true');
    let locale = 'lv';
    const notify = mockNotify();

    locale = 'en';
    restoreRouteAndNotify(mockRouter(), notify, () => (locale === 'en' ? 'Reloaded' : 'Pārlādēts'));

    expect(notify.pushWarning).toHaveBeenCalledWith('Reloaded', null, 0);
  });

  it('clears the pending flag even when there is no saved route', () => {
    sessionStorage.setItem('version_reload_pending', 'true');
    sessionStorage.setItem('version_update_notification', 'true');
    const router = mockRouter();
    const notify = mockNotify();

    restoreRouteAndNotify(router, notify, 'reloaded');

    expect(notify.pushWarning).toHaveBeenCalled();
    expect(sessionStorage.getItem('version_reload_pending')).toBeNull();
    expect(router.isReady).not.toHaveBeenCalled();
  });
});

describe('isAppVersionChanged', () => {
  const { origin } = globalThis.location;

  // Skip the 1s throttle so every call reaches the request
  const check = (basePath) => isAppVersionChanged(undefined, undefined, false, 0, basePath, 0);
  const requestedPath = () => new URL(axios.get.mock.calls.at(-1)[0]).pathname;

  beforeEach(() => {
    sessionStorage.clear();
    axios.get.mockResolvedValue({ data: { version: '1.0.0' } });
  });

  afterEach(() => {
    delete globalThis.config;
    vi.clearAllMocks();
  });

  it('requests version.json under the publicUrl path', async () => {
    globalThis.config = { version: '1.0.0', publicUrl: `${origin}/demo/` };

    await check();

    expect(requestedPath()).toBe('/demo/version.json');
  });

  it('accepts a relative publicUrl', async () => {
    globalThis.config = { version: '1.0.0', publicUrl: '/demo/' };

    await check();

    expect(requestedPath()).toBe('/demo/version.json');
  });

  it('stays on the current origin when publicUrl points elsewhere', async () => {
    globalThis.config = { version: '1.0.0', publicUrl: 'https://other.example/demo/' };

    await check();

    expect(axios.get.mock.calls.at(-1)[0]).toMatch(new RegExp(`^${origin}/demo/version.json`));
  });

  it.each([
    ['a root publicUrl', `${origin}/`],
    ['an empty publicUrl', ''],
    ['no publicUrl', undefined],
  ])('falls back to the host root for %s', async (_, publicUrl) => {
    globalThis.config = { version: '1.0.0', publicUrl };

    await check();

    expect(requestedPath()).toBe('/version.json');
  });

  it('keeps an explicit basePath over publicUrl', async () => {
    globalThis.config = { version: '1.0.0', publicUrl: `${origin}/demo/` };

    await check('/other/');

    expect(requestedPath()).toBe('/other/version.json');
  });

  it('does not reload when the deployed version matches', async () => {
    globalThis.config = { version: '1.0.0', publicUrl: `${origin}/demo/` };
    sessionStorage.setItem('is_navigating', 'true');

    expect(await check()).toBe(false);
    expect(sessionStorage.getItem('version_reload_pending')).toBeNull();
  });
});
