/* eslint-disable no-restricted-imports */
/* eslint-disable import/extensions */
import { defineConfig } from 'vite';
import vueConfig from './vite.vue.config.mjs';
import pluginConfig from './vite.plugin.config.mjs';
import {
  cssConfig,
  cssBundlesConfig,
  getCssBundlesChunkConfig,
  fontsConfig,
} from './vite.assets.config.mjs';

export default defineConfig(({ mode }) => {
  if (mode === 'lib') {
    return vueConfig;
  }
  if (mode === 'css') {
    return cssConfig;
  }
  if (mode === 'bundles') {
    const chunkCount = Number(process.env.BUNDLE_CHUNK_COUNT || 1);
    const chunkIndex = Number(process.env.BUNDLE_CHUNK_INDEX || 0);
    const emptyOutDir = process.env.BUNDLE_EMPTY_OUT_DIR !== 'false';

    if (chunkCount > 1) {
      return getCssBundlesChunkConfig({
        chunkIndex,
        chunkCount,
        emptyOutDir,
      });
    }

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
