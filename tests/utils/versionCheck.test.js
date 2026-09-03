import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetNavigationTracking, trackNavigationState } from '@/utils/navigationState';
import { restoreRouteAndNotify } from '@/utils/versionCheckUtils';

vi.mock('@/hooks/useLx', () => ({
  default: () => ({ getGlobals: () => ({ environment: 'test' }) }),
}));

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
