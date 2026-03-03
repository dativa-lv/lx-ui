/* eslint-disable no-restricted-imports */
/* eslint-disable import/extensions */
import { defineConfig } from 'vite';
import vueConfig from './vite.vue.config.mjs';
import pluginConfig from './vite.plugin.config.mjs';
import { cssConfig, cssBundlesConfig, fontsConfig } from './vite.assets.config.mjs';

export default defineConfig(({ mode }) => {
  if (mode === 'lib') {
    return vueConfig;
  }
  if (mode === 'css') {
    return cssConfig;
  }
  if (mode === 'bundles') {
    return cssBundlesConfig;
  }
  if (mode === 'fonts') {
    return fontsConfig;
  }
  if (mode === 'vite') {
    return pluginConfig;
  }
  throw new Error('Unknown mode!');
});
