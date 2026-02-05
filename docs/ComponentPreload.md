# Component Preloading in lx-ui

`lx-ui` exports most of its components as **async components** (`defineAsyncComponent`) to keep the initial bundle size small and improve load performance.

To make frequently used components feel instant (especially modals, forms, data grids, etc.), you can **preload** their chunks in the background right after the plugin is installed.

Preloading is configured via the `preload` option when installing `createLx`.

## Basic Usage

```js
// main.js / entry file
import { createApp } from 'vue';
import { createLx, LxSection, LxDataGrid } from '@dativa-lv/lx-ui';

const app = createApp(App);

app.use(createLx, {
  systemId: 'portal',
  authSessionKey: AUTH_KEY_TOKEN_SESSION,
  authUrl: APP_CONFIG.authUrl,
  authClientId: APP_CONFIG.clientId,
  publicUrl: APP_CONFIG.publicUrl,
  environment: APP_CONFIG.environment,

  preload: {
    // Pass actual imported component references
    components: [LxSection, LxDataGrid],
  },
});