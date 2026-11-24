import { describe, test, expect, vi, afterEach } from 'vitest';
import { nextTick, ref } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createLxLanguageSwitcher, lxLanguageUtils } from '@/lib';
import { setGlobalProperties } from '@/utils/global';

const SUPPORTED = ['lv', 'en', 'ru'];
const Page = { template: '<div />' };

let keyCounter = 0;

// Minimal stand-in for a vue-i18n (composition mode) instance
function fakeI18n(locale = 'lv', available = ['lv', 'en']) {
  const localeRef = ref(locale);
  const availableLocales = [...available];
  return {
    global: {
      locale: localeRef,
      availableLocales,
      setLocaleMessage: vi.fn((l) => availableLocales.push(l)),
      t: (key) => `${localeRef.value}:${key}`,
    },
  };
}

function setup(options = {}) {
  keyCounter += 1;
  const i18n = options.i18n ?? fakeI18n();
  const switcher = createLxLanguageSwitcher({
    i18n,
    supportedLocales: SUPPORTED,
    defaultLocale: 'lv',
    urlPrefix: true,
    storageKey: `test-language-${keyCounter}`,
    ...options,
  });

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      switcher.catchAllRoute,
      {
        path: switcher.routePath,
        component: Page,
        children: [
          { path: '', name: 'home', component: Page },
          { path: 'about', name: 'about', component: Page },
          { path: ':pathMatch(.*)*', name: 'notFound', component: Page },
        ],
      },
    ],
  });
  switcher.install(router);

  return { i18n, switcher, router };
}

describe('lxLanguageUtils', () => {
  test('localeRoutePath builds the prefixed parent route path', () => {
    expect(lxLanguageUtils.localeRoutePath(['lv', 'en'])).toBe('/:lang(lv|en)');
    expect(lxLanguageUtils.localeRoutePath(['lv', 'en'], 'locale')).toBe('/:locale(lv|en)');
  });

  test('splitLocalePath separates a supported locale from the rest', () => {
    expect(lxLanguageUtils.splitLocalePath('/en/foo?x=1', SUPPORTED)).toEqual({
      locale: 'en',
      rest: '/foo?x=1',
    });
    expect(lxLanguageUtils.splitLocalePath('/en', SUPPORTED)).toEqual({ locale: 'en', rest: '' });
    expect(lxLanguageUtils.splitLocalePath('/en/?x=1', SUPPORTED)).toEqual({
      locale: 'en',
      rest: '?x=1',
    });
    expect(lxLanguageUtils.splitLocalePath('/foo', SUPPORTED)).toEqual({
      locale: null,
      rest: '/foo',
    });
    // `/english` is not the `en` locale
    expect(lxLanguageUtils.splitLocalePath('/english', SUPPORTED).locale).toBeNull();
  });

  test('localizePath swaps or adds the locale prefix and keeps query and hash', () => {
    expect(lxLanguageUtils.localizePath('/en/foo?x=1#top', 'lv', SUPPORTED)).toBe(
      '/lv/foo?x=1#top'
    );
    expect(lxLanguageUtils.localizePath('/foo', 'lv', SUPPORTED)).toBe('/lv/foo');
    expect(lxLanguageUtils.localizePath('/', 'lv', SUPPORTED)).toBe('/lv');
  });

  test('localeRedirectLocation keeps a supported locale, drops an unknown one, adds the fallback', () => {
    const query = { q: '1' };
    expect(
      lxLanguageUtils.localeRedirectLocation({ path: '/foo', query }, 'lv', SUPPORTED)
    ).toEqual({ path: '/lv/foo', query, hash: '', locale: 'lv' });
    expect(
      lxLanguageUtils.localeRedirectLocation({ path: '/en/foo' }, 'lv', SUPPORTED)
    ).toMatchObject({ path: '/en/foo', locale: 'en' });
    expect(
      lxLanguageUtils.localeRedirectLocation({ path: '/de/foo' }, 'lv', SUPPORTED)
    ).toMatchObject({ path: '/lv/foo', locale: 'lv' });
    expect(lxLanguageUtils.localeRedirectLocation({ path: '/' }, 'lv', SUPPORTED).path).toBe('/lv');
  });
});

describe('createLxLanguageSwitcher', () => {
  test('requires an i18n instance and supported locales', () => {
    expect(() => createLxLanguageSwitcher({ supportedLocales: ['lv'] })).toThrow();
    expect(() => createLxLanguageSwitcher({ i18n: fakeI18n(), supportedLocales: [] })).toThrow();
  });

  test('redirects a path without a locale to the stored (or default) locale', async () => {
    const { router, i18n } = setup();

    await router.push('/about?x=1');

    expect(router.currentRoute.value.fullPath).toBe('/lv/about?x=1');
    expect(router.currentRoute.value.name).toBe('about');
    expect(i18n.global.locale.value).toBe('lv');
    expect(document.documentElement.getAttribute('lang')).toBe('lv');
  });

  test('the locale in the URL wins and is remembered', async () => {
    const { router, i18n, switcher } = setup();

    await router.push('/en/about');

    expect(i18n.global.locale.value).toBe('en');
    expect(switcher.selectedLanguageId.value).toBe('en');
    expect(localStorage.getItem(switcher.storageKey)).toBe('en');
    expect(switcher.selectedLanguage.value).toEqual({ id: 'en', name: 'en:languages.en' });

    // A later path without a locale now lands in the remembered language
    await router.push('/');
    expect(router.currentRoute.value.fullPath).toBe('/en');
  });

  test('an unsupported locale segment is dropped', async () => {
    const { router } = setup();

    await router.push('/de/about');

    expect(router.currentRoute.value.fullPath).toBe('/lv/about');
  });

  test('selecting a language changes i18n and rewrites the URL in place', async () => {
    const { router, i18n, switcher } = setup();
    await router.push('/lv/about?x=1');

    const replaceSpy = vi.spyOn(router, 'replace');
    switcher.selectedLanguage.value = { id: 'en', name: 'English' };
    await nextTick();
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/en/about?x=1'));

    expect(i18n.global.locale.value).toBe('en');
    expect(replaceSpy).toHaveBeenCalledTimes(1);
  });

  test('setLocale accepts a plain code and ignores unsupported ones', async () => {
    const { router, switcher } = setup();
    await router.push('/lv');

    switcher.setLocale('de');
    await nextTick();
    expect(switcher.selectedLanguageId.value).toBe('lv');

    switcher.setLocale('ru');
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/ru'));
  });

  test('loads messages for locales that were not registered up front', async () => {
    const i18n = fakeI18n('lv', ['lv', 'en']);
    const loadMessages = vi.fn(async (locale) => ({ default: { hello: locale } }));
    const { router } = setup({ i18n, loadMessages });

    await router.push('/en/about');
    expect(loadMessages).not.toHaveBeenCalled();

    await router.push('/ru/about');
    expect(loadMessages).toHaveBeenCalledWith('ru');
    expect(i18n.global.setLocaleMessage).toHaveBeenCalledWith('ru', { hello: 'ru' });

    await router.push('/ru');
    expect(loadMessages).toHaveBeenCalledTimes(1);
  });

  test('onLocaleChange fires only when the active locale really changes', async () => {
    const onLocaleChange = vi.fn();
    const { router } = setup({ onLocaleChange });

    await router.push('/lv/about');
    expect(onLocaleChange).not.toHaveBeenCalled();

    await router.push('/en/about');
    expect(onLocaleChange).toHaveBeenCalledWith('en', 'lv');
  });

  test('languages lists every supported locale with a name in the active language', async () => {
    const { router, switcher } = setup();
    await router.push('/en');

    expect(switcher.languages.value).toEqual([
      { id: 'lv', name: 'en:languages.lv' },
      { id: 'en', name: 'en:languages.en' },
      { id: 'ru', name: 'en:languages.ru' },
    ]);
  });

  test('works with a legacy (non-ref) i18n locale', async () => {
    const i18n = { global: { locale: 'lv', availableLocales: ['lv', 'en'], t: (k) => k } };
    const { router } = setup({ i18n });

    await router.push('/en');

    expect(i18n.global.locale).toBe('en');
  });

  test('updateSeoLinks sets canonical and hreflang alternates', async () => {
    const { router, switcher } = setup();
    await router.push('/en/about');

    switcher.updateSeoLinks(router.currentRoute.value);

    const href = (selector) => document.head.querySelector(selector)?.getAttribute('href');
    const { origin } = globalThis.location;
    expect(href('link[rel="canonical"]')).toBe(`${origin}/en/about`);
    expect(href('link[rel="alternate"][hreflang="lv"]')).toBe(`${origin}/lv/about`);
    expect(href('link[rel="alternate"][hreflang="ru"]')).toBe(`${origin}/ru/about`);
    expect(href('link[rel="alternate"][hreflang="x-default"]')).toBe(`${origin}/lv/about`);
  });

  test('install accepts a Vue app with the router installed', () => {
    const switcher = createLxLanguageSwitcher({
      i18n: fakeI18n(),
      supportedLocales: ['lv'],
      urlPrefix: true,
    });
    const router = createRouter({ history: createMemoryHistory(), routes: [] });
    const beforeEach = vi.spyOn(router, 'beforeEach');

    switcher.install({ config: { globalProperties: { $router: router } } });
    switcher.install(router);

    expect(beforeEach).toHaveBeenCalledTimes(1);
  });
});

describe('createLxLanguageSwitcher without URL prefix (default)', () => {
  function setupPlain(options = {}) {
    keyCounter += 1;
    const { stored, ...rest } = options;
    const i18n = rest.i18n ?? fakeI18n();
    const storageKey = `test-plain-language-${keyCounter}`;
    if (stored) localStorage.setItem(storageKey, stored);
    const switcher = createLxLanguageSwitcher({
      i18n,
      supportedLocales: SUPPORTED,
      defaultLocale: 'lv',
      storageKey,
      ...rest,
    });
    return { i18n, switcher };
  }

  test('restores the stored locale on startup', async () => {
    const { i18n, switcher } = setupPlain({ stored: 'en' });

    expect(switcher.urlPrefix).toBe(false);
    await switcher.ready;

    expect(i18n.global.locale.value).toBe('en');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
    expect(switcher.selectedLanguage.value).toEqual({ id: 'en', name: 'en:languages.en' });
  });

  test('falls back to the default locale when nothing valid is stored', async () => {
    const { i18n, switcher } = setupPlain({ stored: 'de' });
    await switcher.ready;

    expect(i18n.global.locale.value).toBe('lv');
    expect(switcher.selectedLanguageId.value).toBe('lv');
    expect(localStorage.getItem(switcher.storageKey)).toBe('lv');
  });

  test('loads messages for the stored locale before ready resolves', async () => {
    const i18n = fakeI18n('lv', ['lv', 'en']);
    const loadMessages = vi.fn(async (locale) => ({ default: { hello: locale } }));
    const { switcher } = setupPlain({ i18n, stored: 'ru', loadMessages });
    await switcher.ready;

    expect(loadMessages).toHaveBeenCalledWith('ru');
    expect(i18n.global.setLocaleMessage).toHaveBeenCalledWith('ru', { hello: 'ru' });
    expect(i18n.global.locale.value).toBe('ru');
  });

  test('startup restore does not count as a locale change', async () => {
    const onLocaleChange = vi.fn();
    const { switcher } = setupPlain({ stored: 'en', onLocaleChange });
    await switcher.ready;
    expect(onLocaleChange).not.toHaveBeenCalled();

    switcher.setLocale('ru');
    await vi.waitFor(() => expect(onLocaleChange).toHaveBeenCalledWith('ru', 'en'));
  });

  test('switching changes i18n and storage but never touches the router', async () => {
    const { i18n, switcher } = setupPlain();
    await switcher.ready;
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/about', component: Page }],
    });
    await router.push('/about?x=1');

    const beforeEach = vi.spyOn(router, 'beforeEach');
    switcher.install(router); // no-op outside URL mode
    expect(beforeEach).not.toHaveBeenCalled();

    switcher.selectedLanguage.value = { id: 'en', name: 'English' };
    await vi.waitFor(() => expect(i18n.global.locale.value).toBe('en'));

    expect(localStorage.getItem(switcher.storageKey)).toBe('en');
    expect(router.currentRoute.value.fullPath).toBe('/about?x=1');
  });
});

describe('createLxLanguageSwitcher storage key', () => {
  afterEach(() => {
    setGlobalProperties({});
  });

  test('defaults to <systemId>-user-language', () => {
    setGlobalProperties({ systemId: 'portal' });
    const switcher = createLxLanguageSwitcher({ i18n: fakeI18n(), supportedLocales: SUPPORTED });
    expect(switcher.storageKey).toBe('portal-user-language');
  });

  test('falls back to lx-user-language without systemId', () => {
    const switcher = createLxLanguageSwitcher({ i18n: fakeI18n(), supportedLocales: SUPPORTED });
    expect(switcher.storageKey).toBe('lx-user-language');
  });

  test('an explicit storageKey wins over systemId', () => {
    setGlobalProperties({ systemId: 'portal' });
    const switcher = createLxLanguageSwitcher({
      i18n: fakeI18n(),
      supportedLocales: SUPPORTED,
      storageKey: 'custom-key',
    });
    expect(switcher.storageKey).toBe('custom-key');
  });
});
