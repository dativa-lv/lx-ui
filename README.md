<h1 align="center">lx/ui</h1>

<p align="center">
  Powerful and flexible <strong>Vue.js 3</strong> components and <strong>vanilla CSS</strong> styles library, originally developed for various enterprise apps.
</p>
<p align="center">
  Focus on business logic, not boilerplate.
</p>

<p align="center">
  <img alt="NPM Downloads" src="https://img.shields.io/npm/dw/%40dativa-lv%2Flx-ui?color=green" />
  <img alt="NPM Version" src="https://img.shields.io/npm/v/%40dativa-lv%2Flx-ui?color=green" />
  <img alt="NPM License" src="https://img.shields.io/npm/l/%40dativa-lv%2Flx-ui?color=white" />
</p>

<p align="center">
  <img src="https://img.shields.io/github/package-json/dependency-version/dativa-lv/lx-ui/peer/vue" alt="Vue.js Version" />
  <img src="https://img.shields.io/github/package-json/dependency-version/dativa-lv/lx-ui/dev/vite" alt="Vite Version" />
  <img src="https://img.shields.io/github/package-json/packageManager/dativa-lv/lx-ui?label=package%20manager" alt="Package Manager" />
</p>

![LX/UI](https://raw.githubusercontent.com/dativa-lv/lx-ui/main/public/imgs/cover.png)

## Play around

Check out our [🌐&nbsp;Demo](https://lx-ui.dev/) and [ℹ️&nbsp;List of Components](https://github.com/dativa-lv/lx-ui/blob/main/docs/Components.md) for live demo sandbox.

## Read the docs
- [ℹ️ Design Tokens](https://github.com/dativa-lv/lx-ui/blob/main/docs/DesignTokens.md)
- [ℹ️ CSS Bundling](https://github.com/dativa-lv/lx-ui/blob/main/docs/BUNDLES.md)
- [ℹ️ Action Definitions](https://github.com/dativa-lv/lx-ui/blob/main/docs/ActionDefinitions.md)
- [ℹ️ Progressive Web App](https://github.com/dativa-lv/lx-ui/blob/main/docs/PWA.md)
- [ℹ️ Component Preload](https://github.com/dativa-lv/lx-ui/blob/main/docs/ComponentPreload.md)
- [ℹ️ Library Preload](https://github.com/dativa-lv/lx-ui/blob/main/docs/LibraryLoader.md)
- [ℹ️ Shell Custom Mode](https://github.com/dativa-lv/lx-ui/blob/main/docs/ShellCustomMode.md)
- [🌐 Forms](https://lx-ui.dev/resources/forms)
- [🌐 Colors](https://lx-ui.dev/resources/colors)
- [🌐 Icons](https://lx-ui.dev/resources/icons)
- [🌐 Utils](https://lx-ui.dev/resources/utility/stringUtils)

## Get

Get using bun:
```bash
bun add '@dativa-lv/lx-ui@latest'
```

Get using pnpm:
```bash
pnpm i '@dativa-lv/lx-ui@latest'
```

For migration tips refer to [ℹ️&nbsp;Migration Guide](https://github.com/dativa-lv/lx-ui/blob/main/MIGRATION.md)

## Use

Install with pinia store:

```js
import { createPinia } from 'pinia';
import { createLx } from '@dativa-lv/lx-ui';
import App from '@/App.vue';
…
const myApp = createApp(App);
myApp.use(createPinia());
myApp.use(createLx());
…
```

Make sure to import a proper [CSS bundle](https://github.com/dativa-lv/lx-ui/blob/main/docs/BUNDLES.md) in your main entry file such as `main.js`:

```js
import '@dativa-lv/lx-ui/dist/bundles/lx-bt-demo.css';
```

LX/UI styles apply only within an element that has the `.lx` class. Usually, this should be the application root element:

```
<body class="lx">
  <div id="app"></div>
</body>
```
One can also embed LX inside another application by wrapping it in a `.lx` element

```
<div class="lx">
  <LxButton label="Click me" />
</div>
```


Most convenient way of using the components is by using them inside LxShell:

```vue
<template>
  <LxShell>
    <RouterView />
  </LxShell>
</template>
```

## Extend

 - [lx/builders](https://www.npmjs.com/package/@dativa-lv/lx-builders) - a companion library containing declarative design tools for views, forms, etc.

## Develop

```bash
bun install
bun run dev
```

Read more about development in [ℹ️&nbsp;Development manual](https://github.com/dativa-lv/lx-ui/blob/main/DEVELOPMENT.md)



### Vite Plugins

LX/UI now includes several Vite plugins to enhance your development experience and application security. These plugins are designed to seamlessly integrate with your Vite-based projects.

For detailed information on available plugins and their usage, please refer to our [ℹ️&nbsp;Vite Plugins Documentation](https://github.com/dativa-lv/lx-ui/blob/main/docs/VITE_PLUGINS.md).