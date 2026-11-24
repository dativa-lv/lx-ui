import { computed, isRef, nextTick, unref } from 'vue';
import { useStorage, watchIgnorable } from '@vueuse/core';
import useLx from '@/hooks/useLx';
import { logWarn } from '@/utils/devUtils';

export const LANGUAGE_STORAGE_KEY_SUFFIX = '-user-language';
export const DEFAULT_LANGUAGE_STORAGE_KEY = `lx${LANGUAGE_STORAGE_KEY_SUFFIX}`;
export const DEFAULT_LOCALE_PARAM = 'lang';

/** Catch-all path used for the locale redirect route */
export const CATCH_ALL_PATH = '/:pathMatch(.*)*';

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function localeAlternation(supportedLocales) {
  return supportedLocales.map(escapeRegExp).join('|');
}

// Something that looks like a language code (`de`, `pt-BR`) but is not supported by the app
function looksLikeLocale(segment) {
  return /^[a-z]{2}(-[a-zA-Z]{2,4})?$/.test(segment);
}

// '' | '/foo' | '?x=1' | '#top' - what comes after the locale segment, in a form that can be
// appended to `/${locale}` directly
function normalizeRest(rest) {
  const trimmed = (rest || '').replace(/^\/+/, '');
  if (!trimmed) return '';
  if (trimmed.startsWith('?') || trimmed.startsWith('#')) return trimmed;
  return `/${trimmed}`;
}

/**
 * Path of the locale-prefixed parent route, e.g. `/:lang(lv|en)`.
 *
 * @param {string[]} supportedLocales
 * @param {string} [paramName='lang'] route param that holds the locale
 * @returns {string}
 */
export function localeRoutePath(supportedLocales, paramName = DEFAULT_LOCALE_PARAM) {
  return `/:${paramName}(${localeAlternation(supportedLocales)})`;
}

/**
 * Split a path (or full path with query/hash) into its leading supported locale and the rest.
 * `/en/foo?x=1` → `{ locale: 'en', rest: '/foo?x=1' }`, `/foo` → `{ locale: null, rest: '/foo' }`.
 *
 * @param {string} path
 * @param {string[]} supportedLocales
 * @returns {{ locale: string | null, rest: string }}
 */
export function splitLocalePath(path, supportedLocales) {
  const value = path || '';
  const match = value.match(new RegExp(`^/?(${localeAlternation(supportedLocales)})(?=/|\\?|#|$)`));
  if (!match) return { locale: null, rest: normalizeRest(value) };
  return { locale: match[1], rest: normalizeRest(value.slice(match[0].length)) };
}

/**
 * Same path (or full path) under another locale: `/en/foo?x=1` + `lv` → `/lv/foo?x=1`.
 * A path without a locale prefix gets one: `/foo` + `lv` → `/lv/foo`.
 *
 * @param {string} path
 * @param {string} locale
 * @param {string[]} supportedLocales
 * @returns {string}
 */
export function localizePath(path, locale, supportedLocales) {
  const { rest } = splitLocalePath(path, supportedLocales);
  return `/${locale}${rest}`;
}

/**
 * Where a navigation target without a (valid) locale prefix should go. A supported locale already
 * in the path is kept; an unsupported one that looks like a language code (`/de/foo`) is dropped;
 * `locale` is used otherwise. Query and hash are preserved.
 *
 * @param {{ path: string, query?: Object, hash?: string }} to vue-router route location
 * @param {string} locale locale to use when the path has none
 * @param {string[]} supportedLocales
 * @returns {{ path: string, query: Object, hash: string, locale: string }}
 */
export function localeRedirectLocation(to, locale, supportedLocales) {
  const segments = (to?.path || '').split('/').filter(Boolean);
  let targetLocale = locale;

  if (supportedLocales.includes(segments[0])) {
    [targetLocale] = segments;
    segments.shift();
  } else if (segments[0] && looksLikeLocale(segments[0])) {
    segments.shift();
  }

  return {
    path: `/${targetLocale}${normalizeRest(segments.join('/'))}`,
    query: to?.query ?? {},
    hash: to?.hash ?? '',
    locale: targetLocale,
  };
}

function setLinkHref(selector, href, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('link');
    Object.entries(attrs).forEach(([name, value]) => el.setAttribute(name, value));
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function createLanguageSwitcher(options) {
  const {
    i18n,
    supportedLocales,
    urlPrefix = false,
    paramName = DEFAULT_LOCALE_PARAM,
    loadMessages,
    languageName,
    onLocaleChange,
    updateHtmlLang = true,
  } = options || {};

  if (!i18n?.global) {
    throw new Error('createLxLanguageSwitcher: `i18n` (vue-i18n instance) option is required');
  }
  if (!Array.isArray(supportedLocales) || supportedLocales.length === 0) {
    throw new Error('createLxLanguageSwitcher: `supportedLocales` must be a non-empty array');
  }

  const defaultLocale = options.defaultLocale ?? supportedLocales[0];
  const environment = () => useLx().getGlobals()?.environment;
  const systemId = useLx().getGlobals()?.systemId;
  const storageKey =
    options.storageKey ??
    (systemId ? `${systemId}${LANGUAGE_STORAGE_KEY_SUFFIX}` : DEFAULT_LANGUAGE_STORAGE_KEY);

  let router = null;
  let resolved = false;

  function isLocaleSupported(locale) {
    return typeof locale === 'string' && supportedLocales.includes(locale);
  }

  function getActiveLocale() {
    return unref(i18n.global.locale);
  }

  function setActiveLocale(locale) {
    if (isRef(i18n.global.locale)) {
      i18n.global.locale.value = locale;
    } else {
      i18n.global.locale = locale;
    }
  }

  const resolveName = languageName ?? ((locale) => i18n.global.t(`languages.${locale}`));

  const selectedLanguageId = useStorage(storageKey, getActiveLocale()?.toString() || defaultLocale);

  function getPreferredLocale() {
    return isLocaleSupported(selectedLanguageId.value) ? selectedLanguageId.value : defaultLocale;
  }

  async function loadLocaleMessages(locale) {
    if (!loadMessages) return;
    if (i18n.global.availableLocales?.includes(locale)) return;
    const messages = await loadMessages(locale);
    if (messages) {
      i18n.global.setLocaleMessage(locale, messages.default ?? messages);
    }
  }

  async function applyLocale(locale) {
    const previous = getActiveLocale();
    await loadLocaleMessages(locale);
    setActiveLocale(locale);
    if (updateHtmlLang && typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', locale);
    }
    await nextTick();
    if (resolved && previous !== locale) {
      onLocaleChange?.(locale, previous);
    }
    resolved = true;
  }

  // The picker (or another tab) changed the stored locale: apply it and, in URL mode, move the
  // URL along
  const { ignoreUpdates } = watchIgnorable(selectedLanguageId, async (newLocale) => {
    if (!isLocaleSupported(newLocale)) return;
    await applyLocale(newLocale);
    if (!urlPrefix || !router) return;

    const current = router.currentRoute.value;
    if (current.params?.[paramName] === newLocale) return;

    try {
      await router.replace(localizePath(current.fullPath, newLocale, supportedLocales));
    } catch (e) {
      logWarn(`Language switch navigation failed: ${e}`, environment());
    }
  });

  function syncStoredLocale(locale) {
    ignoreUpdates(() => {
      selectedLanguageId.value = locale;
    });
  }

  // Without a URL prefix nothing else applies the remembered language, so do it right away.
  // In URL mode the first navigation resolves it (the URL wins over the stored choice).
  const ready = urlPrefix
    ? Promise.resolve()
    : (async () => {
        const locale = getPreferredLocale();
        try {
          await applyLocale(locale);
        } catch (e) {
          logWarn(`Could not apply the stored locale "${locale}": ${e}`, environment());
        }
        syncStoredLocale(locale);
      })();

  const selectedLanguage = computed({
    get() {
      return { id: selectedLanguageId.value, name: resolveName(selectedLanguageId.value) };
    },
    set(value) {
      const id = typeof value === 'string' ? value : value?.id;
      if (isLocaleSupported(id)) {
        selectedLanguageId.value = id;
      } else {
        logWarn(`Unsupported locale selected: ${id}`, environment());
      }
    },
  });

  const languages = computed(() => supportedLocales.map((id) => ({ id, name: resolveName(id) })));

  function setLocale(locale) {
    selectedLanguage.value = locale;
  }

  function getLocaleRedirect(to) {
    return localeRedirectLocation(to, getPreferredLocale(), supportedLocales);
  }

  async function handleLocaleRouting(to) {
    const paramLocale = to?.params?.[paramName]?.toString();

    if (isLocaleSupported(paramLocale)) {
      await applyLocale(paramLocale);
      syncStoredLocale(paramLocale);
      return null;
    }

    const redirect = getLocaleRedirect(to);
    await applyLocale(redirect.locale);
    syncStoredLocale(redirect.locale);

    // Nothing to prefix (route without the locale param) - never redirect to the same place
    if (redirect.path === to?.path) return null;
    return { path: redirect.path, query: redirect.query, hash: redirect.hash };
  }

  function updateSeoLinks(routeOrPath) {
    if (typeof document === 'undefined') return;
    const path = typeof routeOrPath === 'string' ? routeOrPath : routeOrPath?.path || '';
    const origin = globalThis.location?.origin ?? '';
    const base = (router?.options?.history?.base ?? '').replace(/\/+$/, '');
    const { locale, rest } = splitLocalePath(path, supportedLocales);
    const buildUrl = (l) => `${origin}${base}/${l}${rest}`;

    setLinkHref('link[rel="canonical"]', buildUrl(locale ?? getPreferredLocale()), {
      rel: 'canonical',
    });
    supportedLocales.forEach((l) => {
      setLinkHref(`link[rel="alternate"][hreflang="${l}"]`, buildUrl(l), {
        rel: 'alternate',
        hreflang: l,
      });
    });
    setLinkHref('link[rel="alternate"][hreflang="x-default"]', buildUrl(defaultLocale), {
      rel: 'alternate',
      hreflang: 'x-default',
    });
  }

  function install(target) {
    if (!urlPrefix) {
      logWarn(
        'createLxLanguageSwitcher: install() does nothing without `urlPrefix: true` - the language is restored on startup already',
        environment()
      );
      return;
    }

    const candidate =
      typeof target?.beforeEach === 'function' ? target : target?.config?.globalProperties?.$router;

    if (!candidate) {
      logWarn(
        'createLxLanguageSwitcher: install() expects a vue-router instance or a Vue app with the router already installed',
        environment()
      );
      return;
    }
    if (router === candidate) return;

    router = candidate;
    router.beforeEach(async (to) => (await handleLocaleRouting(to)) ?? true);
  }

  return {
    supportedLocales,
    defaultLocale,
    storageKey,
    urlPrefix,
    paramName,
    /** Resolves once the startup locale (and its messages) is applied; already resolved in URL mode */
    ready,
    /** URL mode: `/:lang(lv|en)` - path of the route all localized routes are children of */
    routePath: localeRoutePath(supportedLocales, paramName),
    /** URL mode: route that sends any path without a locale prefix to its localized twin */
    catchAllRoute: { path: CATCH_ALL_PATH, redirect: (to) => getLocaleRedirect(to) },
    /** Stored locale code (localStorage backed ref) */
    selectedLanguageId,
    /** `{ id, name }` of the active language - bind to LxShell `v-model:selected-language` */
    selectedLanguage,
    /** `[{ id, name }]` in the active language - bind to LxShell `languages` */
    languages,
    isLocaleSupported,
    /** Stored locale when it is supported, otherwise `defaultLocale` */
    getPreferredLocale,
    /** Switch language programmatically (locale code or `{ id }`) */
    setLocale,
    /** URL mode: guard body, resolves the locale of `to`, returns a redirect location or `null` */
    handleLocaleRouting,
    /** URL mode: redirect target for a path without a locale prefix (used by `catchAllRoute`) */
    getLocaleRedirect,
    /** Same path under another locale (defaults to the stored one) */
    localizePath: (path, locale = getPreferredLocale()) =>
      localizePath(path, locale, supportedLocales),
    /** Set `canonical` and `hreflang` alternate links for the given route/path */
    updateSeoLinks,
    /** URL mode: register the `beforeEach` guard; accepts the router or the app (after `app.use(router)`) */
    install,
  };
}
