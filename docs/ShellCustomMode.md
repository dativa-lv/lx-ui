# LxShell — `custom` mode

The `custom` mode lets you build your **own shell layout** while keeping all the built-in LX
shell functionality: dialogs, modals, notifications, the navigation loading indicator and
the ready-made page-header buttons.

Unlike the opinionated modes (`default`, `public`, `cover`, …), the `custom` mode renders
no fixed header or navigation bar. Instead it exposes a handful of slots, applies the
`lx-layout-custom` class so LX styles work inside it, and leaves the layout to you (CSS).

```vue
<LxShell mode="custom">
  <template #header>...</template>
  <template #aside-left>...</template>
  <template #aside-right>...</template>
  <template #footer>...</template>

  <router-view />
</LxShell>
```

## When to use it

Use `custom` mode when none of the built-in modes match your design and you want full
control over the page structure, while keeping the built-in LX behaviour (theming,
notifications, confirm/idle dialogs, spotlight, accessibility settings, the navigation
loader, etc.).

If a built-in mode is close enough to what you need, prefer it — `custom` mode trades
convenience for flexibility.

## Slots

| Slot          | Wrapper element & class                                        | Notes                                                      |
| ------------- | -------------------------------------------------------------- | ---------------------------------------------------------- | 
| `header`      | `<header class="lx-layout-custom-header">`                     | Your own top bar. Optional.                                |
| `aside-left`  | `<aside class="lx-layout-custom-aside-left">`                  | Left sidebar. Optional.                                    |
| `aside-right` | `<aside class="lx-layout-custom-aside-right">`                 | Right sidebar. Optional.                                   |
| `page-header` | `<div class="lx-layout-custom-page-header">` (inside `<main>`) | Your own page title/breadcrumbs. Optional. See note below. |
| `default`     | `<main class="lx-main">`                                       | Main page content.                                         |
| `footer`      | `<footer>`                                                     | Footer content.                                            |

Each region is rendered **only when you provide the slot**, so an empty `aside-right` slot
produces no empty column. Every region has its own class so you can target it from CSS.

### Why a `page-header` slot (and not just putting it in your view)

In the built-in modes, the page header sits **inside `<main>` but outside the route
transition**, so it stays stable while only the page content animates between routes. If you
put your own page header inside your routed view (the default slot), it lands **inside** the
`transition` and re-animates on every navigation. Use the `page-header` slot to get the same
stable placement as the built-in modes.

The standard LX pieces (notifications, dialogs, spotlight, the navigation loading indicator)
live in `LxShell` itself, not in the mode, so they keep working in `custom` mode — see
[Dialogs, modals & notifications](#dialogs-modals--notifications) and
[Navigation load indicator](#navigation-load-indicator) below.

## Styling

The library ships a minimal base grid as a separate stylesheet (`lx-shell-grid-custom.css`).
Like the other mode grids (e.g. `lx-shell-grid-public`), import it directly when you use `custom` mode:

```
header       header       header
aside-left   main         aside-right
footer       footer       footer
```

Override it in your app by targeting the region classes, e.g.:

```css
.lx-layout.lx-layout-custom {
  grid-template-columns: 16rem 1fr; /* sidebar + content */
  grid-template-areas:
    'header header'
    'aside-left main'
    'footer footer';
}
.lx-layout-custom-header { /* sticky bar, etc. */ }
.lx-layout-custom-aside-left { /* sidebar styling */ }
```

The `page-header` region ships with default spacing matching the built-in modes
(`margin-top: var(--space-3000)`, `margin-bottom: var(--space-1000)`); override
`.lx-layout-custom-page-header` to change it.

The `header` region also gets minimal defaults — a right-aligned flex row at the standard
`--nav-row-size` height with the nav background — so `LxShellHeaderButtons` lines up out of
the box. Override `.lx-layout-custom-header` (e.g. `justify-content: space-between` for a
left-side logo).

### Header height — set `--nav-row-size`

The header height, the reserved top grid row, **and every sticky element in the library**
(sticky data-grid headers, form toolbars/footers, file-viewer toolbars, etc.) all read the
same `--nav-row-size` variable. It defaults to `3rem`.

If you want a taller (or shorter) header, set `--nav-row-size` on the layout rather than
hardcoding a `height` — that keeps the header, the reserved row, and all sticky offsets in
sync:

```css
.lx-layout.lx-layout-custom {
  --nav-row-size: 6rem; /* header becomes 6rem AND sticky toolbars stick at 6rem */
}
```

> Don't set `height` on `.lx-layout-custom-header` directly while leaving `--nav-row-size` at
> its default — the header and the sticky offsets would desync (toolbars would stick under the
> header). Always drive the height through `--nav-row-size`.

## Dialogs, modals & notifications

These live in `LxShell` itself (as siblings of the mode component), so they work in `custom`
mode with **no extra wiring in the layout** — you just pass their props/events on `<LxShell>`,
exactly like in the other modes:

| Feature              |  Wire it with                                                                          |  Notes                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Notifications        | `v-model:notifications`                                                                |  Usually bound to `LxNotifyStore`.                                                                 |
| Confirm dialog       | `:confirm-dialog-data` + `@confirm-modal-close`                                        |  Pass your `LxConfirmStore` instance.                                                              |
| Idle / session modal | `:show-idle-modal`, `:seconds-to-live`, `@idle-modal-primary`, `@idle-modal-secondary` |                                                                                                    |
| Spotlight            | `:spotlight-items`, `@spotlight-show-more`                                             |  Trigger via the spotlight button (part of `LxShellHeaderButtons`) or `shellRef.spotlightStart()`. |

`LxShell` also exposes `spotlightStart()`, `spotlightEnd()` and `closeEverything()` via a
template ref:

```js
const shellRef = ref();
shellRef.value.spotlightStart();
```

**Accessibility settings:** the inline theme/accessibility picker is part of
`LxShellHeaderButtons` (enable with `:has-theme-picker`) and works in custom mode. The
separate full-screen *settings modal* only auto-opens in `full-screen` mode; in other modes
(including `custom`) `LxShell` emits `settingsClick` instead, so you can decide what to do.

## Navigation load indicator

The loading indicator is built into `custom` mode (inside `<main>`), gated by the
`:navigating` prop. When `true`, it shows a delayed full-area spinner overlay
(`.lx-loader-screen` + `LxLoader`), sets `aria-busy` on `<main>`, and announces progress to
screen readers (`texts.loadingInProgress` / `texts.loadingComplete`). The ~1s delay means
fast navigations don't flash a spinner.

Drive it by binding `:navigating`, typically from `LxAppStore.isNavigating` toggled in router
guards:

```js
const appStore = useAppStore();
router.beforeEach(() => { appStore.isNavigating = true; });
router.afterEach(()  => { appStore.isNavigating = false; });
// <LxShell mode="custom" :navigating="appStore.isNavigating" />
```

Leave `:navigating` unbound if you'd rather render your own indicator in a slot.

## Page header buttons — `LxShellHeaderButtons`

To reuse the standard LX header buttons (theme/accessibility picker, language, alerts,
help, mega menu, custom button, user menu, spotlight, login) inside your own `header` slot,
use the exported `LxShellHeaderButtons` component. It reads everything from the shell
context, so it must be used **inside** `LxShell`:

With the default header styling, just dropping `LxShellHeaderButtons` into the slot lines the
buttons up on the right — no extra CSS needed:

```vue
<script setup>
import { LxShellHeaderButtons } from '@dativa-lv/lx-ui';
</script>

<template>
  <LxShell mode="custom" ...all the usual header props (userInfo, alerts, languages, ...)>
    <template #header>
      <!-- logo on the left, buttons on the right -->
      <RouterLink to="/" class="lx-layout-custom-logo"><img src="/logo.svg" alt="Home" /></RouterLink>
      <LxShellHeaderButtons />
    </template>

    <router-view />
  </LxShell>
</template>

<style>
/* default header is justify-content: flex-end; push the logo to the left */
.lx-layout-custom-logo {
  margin-right: auto;
}
</style>
```

Put the slot children **directly** in `#header` (no wrapper element) so the default header
flexbox lays them out. With a single child (just `LxShellHeaderButtons`) the buttons sit on
the right; add a logo with `margin-right: auto` (above) or set the header to
`justify-content: space-between` for the same effect.

All the header-button behaviour (props like `:user-info`, `:alerts`, `:languages`,
`:has-theme-picker`, `has-custom-button`, … and the matching events) is configured on
`LxShell` exactly as in the other modes — `LxShellHeaderButtons` simply renders them.

### Building the full header

`LxShellHeaderButtons` is **only the right-hand action cluster** of the built-in main header.
The real header (`Header.vue`) is made of three parts, and in `custom` mode you build the
other two yourself:

| Part of the main header | What it contains                                     | In custom mode               |
| ----------------------- | ---------------------------------------------------- | ---------------------------- |
| Brand group (left)      | logo, system name, environment badge, nav toggle     | build it yourself            |
| Extra menu (center)     | back button + page label (appears on scroll)         | build it yourself (optional) |
| Action buttons (right)  | theme, language, alerts, help, user menu, spotlight… | `LxShellHeaderButtons`       |

A fuller header — brand on the left, a page title in the middle, the LX buttons on the right:

```vue
<script setup>
import { LxShellHeaderButtons, LxIcon } from '@dativa-lv/lx-ui';
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
  <LxShell mode="custom" :system-name-short="'LX'" :user-info="userInfo" :has-theme-picker="true" :has-alerts="true" :alerts="alerts">
    <template #header>
      <!-- left: brand -->
      <RouterLink to="/" class="my-brand">
        <img src="/logo.svg" alt="" class="my-brand-logo" />
        <span class="my-brand-name">My system</span>
      </RouterLink>

      <!-- center: current page title -->
      <span class="my-header-title">{{ route.meta?.title }}</span>

      <!-- right: standard LX action buttons -->
      <LxShellHeaderButtons />
    </template>

    <RouterView />
  </LxShell>
</template>

<style>
/* Switch the header from the default right-alignment to a 3-part row. */
.lx-layout-custom-header {
  justify-content: space-between;
}
.my-brand {
  display: flex;
  align-items: center;
  gap: var(--space-0500);
  text-decoration: none;
  color: inherit;
}
.my-brand-logo {
  height: calc(var(--nav-row-size) - var(--space-1000));
}
.my-brand-name {
  font-weight: var(--font-weight-bold);
}
.my-header-title {
  color: var(--color-nav-foreground);
}
</style>
```

The `LxShellHeaderButtons` cluster still inherits the row layout from the default
`.lx-layout-custom-header .lx-group` rule, so it lines up on the right while your brand and
title take the left and center.

## Navigation in your own layout

`custom` mode does not render a nav bar — you build navigation yourself in a slot (typically
`aside-left`) from the same `navItems` you pass to `LxShell`, and highlight the active item
using the current route:

```vue
<script setup>
import { useRoute } from 'vue-router';
const route = useRoute();
</script>

<template #aside-left>
  <nav>
    <RouterLink
      v-for="item in navItems"
      :key="item.to.name"
      :to="item.to"
      :class="{ 'is-active': route.name === item.to.name }"
    >
      {{ item.label }}
    </RouterLink>
  </nav>
</template>
```

For deeper trees you can match against the route's matched records (e.g.
`route.matched.some((r) => r.name === item.to.name)`) to also highlight parents.

## Full example

```vue
<script setup>
import { LxShell, LxShellHeaderButtons } from '@dativa-lv/lx-ui';
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
  <LxShell
    mode="custom"
    :system-name-short="'LX'"
    :system-name="'My system'"
    :nav-items="navItems"
    :page-breadcrumbs="breadcrumbs"
    :route-name="route.name.toString()"
    :navigating="isNavigating"
    :notifications="notifications"
    :user-info="userInfo"
    :has-theme-picker="true"
    :has-alerts="true"
    :alerts="alerts"
  >
    <template #header>
      <RouterLink to="/" class="lx-layout-custom-logo"><img src="/logo.svg" alt="Home" /></RouterLink>
      <LxShellHeaderButtons />
    </template>

    <template #aside-left>
      <nav>
        <RouterLink
          v-for="item in navItems"
          :key="item.to.name"
          :to="item.to"
          :class="{ 'is-active': route.name === item.to.name }"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </template>

    <RouterView />

    <template #footer>© My system</template>
  </LxShell>
</template>

<style>
/* default header is right-aligned; push the logo to the left */
.lx-layout-custom-logo {
  margin-right: auto;
}
/* sidebar nav from the default lx-shell-grid-custom grid */
.lx-layout-custom-aside-left {
  padding: var(--space-1000);
}
.lx-layout-custom-aside-left nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-0500);
}
.lx-layout-custom-aside-left .is-active {
  font-weight: var(--font-weight-bold);
}
</style>
```
