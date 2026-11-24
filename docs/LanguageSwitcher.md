# Language Switching

`createLxLanguageSwitcher` gives a portal language switching out of the box:

- the chosen language is kept in `localStorage` and restored on startup;
- the vue-i18n locale and `<html lang>` follow it;
- translations for extra locales can be loaded lazily;
- the `LxShell` language picker needs nothing more than two bindings.

Optionally (`urlPrefix: true`) every route lives under a locale prefix (`/lv/about`, `/en/about`): the locale in the URL wins, a path without one is redirected, switching rewrites the URL and `canonical` / `hreflang` links can be maintained. See [URL prefix mode](#url-prefix-mode).

vue-i18n is not a dependency of LX/UI, so the portal passes its own `i18n` instance in.

## 1. Create the switcher once

Put it in a module of its own (for example `src/hooks/useLanguage.js`) so layouts, services and the router share one instance.

```js
import { createLxLanguageSwitcher } from '@dativa-lv/lx-ui';
import i18n from '@/i18n';
import { APP_CONFIG } from '@/constants';

export const LANGUAGE_STORAGE_KEY = 'myportal-user-language';

export const languageSwitcher = createLxLanguageSwitcher({
  i18n,
  supportedLocales: APP_CONFIG.supportedLocales, // ['lv', 'en']
  defaultLocale: APP_CONFIG.defaultLocale, // 'lv'
  storageKey: LANGUAGE_STORAGE_KEY,
  // Only needed for locales not passed to createI18n({ messages })
  loadMessages: (locale) => import(`@/locales/${locale}.json`),
});
```

The stored language is applied right away. `languageSwitcher.ready` resolves once that (and the lazy message load, if any) is done, so a portal that wants the first paint already translated can wait for it:

```js
// main.js
await languageSwitcher.ready;
app.mount('#app');
```

### Options

| Option             | Default                               | Description                                                                                                                                                                                     |
| ------------------ | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `i18n`             | required                              | Instance returned by `createI18n` (legacy and composition modes both work)                                                                                                                      |
| `supportedLocales` | required                              | Locale codes the app ships, in picker order                                                                                                                                                     |
| `defaultLocale`    | first supported locale                | Used when the stored choice (and, in URL mode, the URL) holds no supported locale                                                                                                               |
| `storageKey`       | `'<systemId>-user-language'`          | `localStorage` key; the value is a plain string, so `localStorage.getItem(key)` works outside Vue (axios interceptors etc.). Without createLx `systemId` at creation time: `'lx-user-language'` |
| `urlPrefix`        | `false`                               | `true` enables [URL prefix mode](#url-prefix-mode)                                                                                                                                              |
| `paramName`        | `'lang'`                              | URL mode: name of the route param that holds the locale                                                                                                                                         |
| `loadMessages`     | none                                  | `(locale) => Promise<messages>`; called once for a locale missing from `i18n.global.availableLocales`, registered with `setLocaleMessage`                                                       |
| `languageName`     | `i18n.global.t('languages.<locale>')` | Display name of a locale for the picker                                                                                                                                                         |
| `onLocaleChange`   | none                                  | `(locale, previousLocale) => void`, called after the active locale really changed (not for the startup restore); custom follow-up work goes here                                                |
| `updateHtmlLang`   | `true`                                | Keep `<html lang>` in sync                                                                                                                                                                      |

## 2. Shell

```vue
<LxShell
  :has-language-picker="true"
  :languages="languageSwitcher.languages.value"
  v-model:selected-language="languageSwitcher.selectedLanguage.value"
/>
```

`languages` is `[{ id, name }]` translated in the active language and `selectedLanguage` is the `{ id, name }` of the active one. Picking a language updates vue-i18n, `<html lang>` and `localStorage` (and, in URL mode, the URL).

That is the whole setup when the URL is not involved.

### Storage key and createLx

The default key is built from the createLx `systemId` (`portal` -> `portal-user-language`), but only if createLx is already installed when the switcher is created. A switcher module imported by the router usually runs before `app.use(createLx)`, so pass `storageKey` explicitly there; using the `<systemId>-user-language` form keeps it consistent.

## Everyday pieces

### Language of API calls

```js
// axios interceptor
config.headers['Accept-Language'] = languageSwitcher.getPreferredLocale();
```

### Reacting to a change

```js
createLxLanguageSwitcher({
  ...,
  onLocaleChange: (locale) => questionsStore.refetch(locale),
});
```

or watch the id in a component:

```js
watch(() => languageSwitcher.selectedLanguageId.value, syncQuestionsLanguage);
```

### Switching programmatically

```js
languageSwitcher.setLocale('en');
```

## URL prefix mode

Enable it with `urlPrefix: true`. Then the locale lives in the URL (`/lv/about`), links can be shared and indexed per language, and the URL wins over the stored choice. Two more steps are needed.

### Routes

Put every localized route under `languageSwitcher.routePath` (`/:lang(lv|en)`) and add `languageSwitcher.catchAllRoute` so paths without a locale are redirected.

```js
import { languageSwitcher } from '@/hooks/useLanguage';

const routes = [
  languageSwitcher.catchAllRoute,
  {
    path: languageSwitcher.routePath,
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('@/views/Home.vue') },
      { path: 'about', name: 'about', component: () => import('@/views/About.vue') },
      {
        path: ':pathMatch(.*)*',
        name: 'notFound',
        component: () => import('@/views/NotFound.vue'),
      },
    ],
  },
];
```

Keep the `notFound` child: without it a wrong path under a locale would have nowhere to go.

### Router

`install` registers the `beforeEach` guard that resolves the locale of every navigation (this is what restores the language on startup in URL mode) and remembers the router for later language switches. Call it right after `createRouter`, before guards of your own, so the locale redirect runs first.

```js
import { languageSwitcher } from '@/hooks/useLanguage';

const router = createRouter({ history: createWebHistory(base), routes });
languageSwitcher.install(router);

router.beforeEach(async (to, from) => {
  // your own guards
});
```

`app.use(languageSwitcher)` after `app.use(router)` does the same.

### SEO links

Sets `<link rel="canonical">` and one `<link rel="alternate" hreflang>` per supported locale (plus `x-default`) for the given route. The router base path is taken into account.

```js
watch(route, () => languageSwitcher.updateSeoLinks(route), { immediate: true });
```

### Custom routers

A second router (a maintenance or "closed" build, for example) can reuse the pieces directly:

```js
const router = createRouter({
  history: createWebHistory(base),
  routes: [
    { path: `${languageSwitcher.routePath}/:pathMatch(.*)*`, component: EmptyRoute },
    { path: '/:pathMatch(.*)*', component: EmptyRoute },
  ],
});
languageSwitcher.install(router);
```

Or write the guard by hand with `handleLocaleRouting(to)`, which returns a redirect location or `null`:

```js
router.beforeEach(async (to) => (await languageSwitcher.handleLocaleRouting(to)) ?? true);
```

### Pure helpers

The path logic is available without the switcher as `lxLanguageUtils`:

```js
import { lxLanguageUtils } from '@dativa-lv/lx-ui';

lxLanguageUtils.localeRoutePath(['lv', 'en']); // '/:lang(lv|en)'
lxLanguageUtils.splitLocalePath('/en/about?x=1', ['lv', 'en']); // { locale: 'en', rest: '/about?x=1' }
lxLanguageUtils.localizePath('/en/about?x=1', 'lv', ['lv', 'en']); // '/lv/about?x=1'
lxLanguageUtils.localeRedirectLocation({ path: '/de/about' }, 'lv', ['lv', 'en']); // { path: '/lv/about', ... }
```

### Behaviour summary (URL mode)

| Navigation to               | Stored | Result                                   |
| --------------------------- | ------ | ---------------------------------------- |
| `/en/about`                 | any    | stays, locale becomes `en` and is stored |
| `/about`                    | `en`   | redirected to `/en/about`                |
| `/about`                    | none   | redirected to `/<defaultLocale>/about`   |
| `/de/about` (unknown)       | `lv`   | redirected to `/lv/about`                |
| picker: `lv` on `/en/x?q=1` | -      | URL replaced with `/lv/x?q=1`            |

## Portal without multiple languages

Nothing to do: do not create the switcher and leave `has-language-picker` off. The code is tree-shaken away.
