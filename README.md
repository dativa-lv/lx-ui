<h1 align="center">lx/ui</h1>

<p align="center">
  Powerful and flexible <strong>Vue.js 3</strong> components and <strong>vanilla CSS</strong> styles library, originally developed for various enterprise apps.
</p>
<p align="center">
  Focus on business logic, not boilerplate.
</p>

<p align="center">
  <img alt="NPM Downloads" src="https://img.shields.io/npm/dw/%40dativa-lv%2Flx-ui" />
  <img alt="NPM Version" src="https://img.shields.io/npm/v/%40dativa-lv%2Flx-ui" />
  <img alt="NPM License" src="https://img.shields.io/npm/l/%40dativa-lv%2Flx-ui" />
</p>

![LX/UI](https://raw.githubusercontent.com/dativa-lv/lx-ui/main/public/imgs/cover.png)

## Play around

Check out our [🌐&nbsp;Demo](https://lx-ui.dev/) and 
[ℹ️&nbsp;List of Components](https://github.com/dativa-lv/lx-ui/blob/main/docs/Components.md) for live demo sandbox.

## Read the docs
- [ℹ️ Design Tokens](https://github.com/dativa-lv/lx-ui/blob/main/docs/DesignTokens.md)
- [ℹ️ Progressive Web App Guide](https://github.com/dativa-lv/lx-ui/blob/main/docs/PWA.md)
- [🌐 Forms](https://lx.zzdats.lv/resources/forms)
- [🌐 Colors](https://lx.zzdats.lv/resources/colors)
- [🌐 Icons](https://lx.zzdats.lv/resources/icons)
- [🌐 Utils](https://lx.zzdats.lv/resources/utility/stringUtils)
### Declarative Tools
- [🏗️ LxFormBuilder](https://github.com/dativa-lv/lx-ui/blob/main/docs/FormBuilder.md)
- [🏗️ LxViewBuilder](https://github.com/dativa-lv/lx-ui/blob/main/docs/ViewBuilder.md)
- 🛠️ LxFilterBuilder

## Get

```bash
pnpm i -w '@dativa-lv/lx-ui@latest'
```

For migration tips refer to [ℹ️&nbsp;Migration Guide](https://github.com/dativa-lv/lx-ui/blob/main/MIGRATION.md)

## Use

install with pinia store:

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

## Develop

```bash
pnpm
pnpm dev
```

Read more about development in [ℹ️&nbsp;Development manual](https://github.com/dativa-lv/lx-ui/blob/main/DEVELOPMENT.md)

### Vite Plugins

LX/UI now includes several Vite plugins to enhance your development experience and application security. These plugins are designed to seamlessly integrate with your Vite-based projects.

For detailed information on available plugins and their usage, please refer to our [ℹ️&nbsp;Vite Plugins Documentation](https://github.com/dativa-lv/lx-ui/blob/main/docs/VITE_PLUGINS.md).