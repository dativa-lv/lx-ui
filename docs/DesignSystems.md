# Using Material Design

LX/UI uses styles based on the Carbon Design System (CDS) by default. An
alternative set of styles based on Material Design 3 is also available. To use
it, import `lx-pt-material.css` after the Carbon stylesheets in your app entry
file so the Material styles take precedence.

```js
// main.js
import '@dativa-lv/lx-ui/dist/styles/lx-pt-carbon.css';
import '@dativa-lv/lx-ui/dist/styles/lx-ut-carbon-light.css';
import '@dativa-lv/lx-ui/dist/styles/lx-ut-carbon-dark.css';
import '@dativa-lv/lx-ui/dist/styles/lx-ut-carbon-contrast.css';

import '@dativa-lv/lx-ui/dist/styles/lx-fonts-material.css'; // Optional: Material font
import '@dativa-lv/lx-ui/dist/styles/lx-pt-material.css';
```

Include only the `lx-ut-carbon-*.css` variants your application needs, but make
sure to import `lx-pt-material.css` after all of them.

## Font

`lx-fonts-material.css` is optional. Import it if you want to use the font
intended for Material Design styling. Place it as
shown in the example.

## Material icons

To make Material the default icon set for your app, pass `iconSet: 'material'`
to `createLx`:

```js
import { createApp } from 'vue';
import { createLx } from '@dativa-lv/lx-ui';
import App from './App.vue';

const app = createApp(App);
app.use(createLx, {
  iconSet: 'material',
});
```

This sets the default icon set; individual components or actions can still
specify a different icon set.