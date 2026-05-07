/* eslint-disable import/extensions */
/* eslint-disable no-restricted-imports */
/* eslint-disable no-param-reassign */
/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import { commonStyles, bundles, bundlesWithoutCommonStyles } from './bundles.config.js';

function generateStylesRollupInput() {
  const input = {};
  const stylesDir = path.resolve(__dirname, 'src/styles');
  const files = fs.readdirSync(stylesDir);

  // Dynamically generate excluded files list from bundles config
  const excludedFiles = [...Object.keys(bundles).map((name) => `${name}.css`)];

  files.forEach((file) => {
    if (!excludedFiles.includes(file)) {
      const { name } = path.parse(file);
      input[name] = path.resolve(stylesDir, file);
    }
  });

  return input;
}

const BUNDLE_PREFIX = 'virtual:bundle:';
const BUNDLE_RESOLVED_PREFIX = `\0${BUNDLE_PREFIX}`;

function splitBundleEntries(allBundles, chunkIndex = 0, chunkCount = 1) {
  const names = Object.keys(allBundles).sort();
  const withoutCommon = new Set(bundlesWithoutCommonStyles || []);
  const safeChunkCount = Math.max(1, Number(chunkCount) || 1);
  const safeChunkIndex = Math.min(Math.max(0, Number(chunkIndex) || 0), safeChunkCount - 1);
  const chunks = Array.from({ length: safeChunkCount }, () => ({}));
  const signatureCount = new Map();

  names.forEach((bundleName) => {
    const bundleSpecificStyles = allBundles[bundleName] || [];
    const baseStyles = withoutCommon.has(bundleName) ? [] : commonStyles;
    const signature = [...new Set([...baseStyles, ...bundleSpecificStyles])].join('|');

    // Spread identical CSS bundles across different chunks to avoid same-run deduplication.
    const seen = signatureCount.get(signature) || 0;
    const preferredChunk = seen % safeChunkCount;
    signatureCount.set(signature, seen + 1);

    // Keep chunks relatively balanced by choosing the smallest among candidates.
    let targetChunk = preferredChunk;
    for (let idx = 0; idx < safeChunkCount; idx += 1) {
      const candidate = (preferredChunk + idx) % safeChunkCount;
      if (Object.keys(chunks[candidate]).length < Object.keys(chunks[targetChunk]).length) {
        targetChunk = candidate;
      }
    }

    chunks[targetChunk][bundleName] = allBundles[bundleName];
  });

  return chunks[safeChunkIndex];
}

function createBundlePlugin(bundlesMap) {
  const withoutCommonStyles = new Set(bundlesWithoutCommonStyles || []);
  const stylesDir = path.resolve(__dirname, 'src/styles');

  return {
    name: 'lx-css-bundles',
    resolveId(id) {
      if (id.startsWith(BUNDLE_PREFIX)) return `\0${id}`;
      return undefined;
    },
    load(id) {
      if (!id.startsWith(BUNDLE_RESOLVED_PREFIX)) return undefined;
      const bundleName = id.slice(BUNDLE_RESOLVED_PREFIX.length).replace(/\.css$/, '');
      const bundleSpecificStyles = bundlesMap[bundleName];
      if (!bundleSpecificStyles) return undefined;
      const baseStyles = withoutCommonStyles.has(bundleName) ? [] : commonStyles;
      const allStyles = [...new Set([...baseStyles, ...bundleSpecificStyles])];
      // Use absolute paths so postcss-import resolves correctly without a real file location
      return allStyles
        .map((style) => `@import '${path.resolve(stylesDir, `${style}.css`)}';`)
        .join('\n');
    },
  };
}

function generateBundlesRollupInput(bundlesMap) {
  const input = {};
  // Use virtual modules for bundle generation
  Object.keys(bundlesMap).forEach((bundleName) => {
    input[bundleName] = `${BUNDLE_PREFIX}${bundleName}.css`;
  });
  return input;
}

function createCssBundlesConfig(bundlesMap, emptyOutDir = true) {
  return defineConfig({
    base: './',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    plugins: [createBundlePlugin(bundlesMap)],
    build: {
      outDir: 'dist/bundles',
      rollupOptions: {
        input: generateBundlesRollupInput(bundlesMap),
        output: {
          inlineDynamicImports: false,
          assetFileNames: '[name][extname]',
        },
      },
      cssCodeSplit: true,
      copyPublicDir: false,
      emptyOutDir,
    },
  });
}

export function getCssBundlesChunkConfig(options = {}) {
  const { chunkIndex = 0, chunkCount = 1, emptyOutDir = true } = options;
  const chunkBundles = splitBundleEntries(bundles, chunkIndex, chunkCount);
  return createCssBundlesConfig(chunkBundles, emptyOutDir);
}

export function getCssBundlesChunkNames(options = {}) {
  const { chunkIndex = 0, chunkCount = 1 } = options;
  const chunkBundles = splitBundleEntries(bundles, chunkIndex, chunkCount);
  return Object.keys(chunkBundles).sort();
}

function generateFontsRollupInput(baseDir) {
  const input = {};
  const files = fs.readdirSync(baseDir);
  const allowedExtensions = new Set(['.ttf', '.woff', '.woff2', '.otf', '.txt']);

  files.forEach((file) => {
    const filePath = path.resolve(baseDir, file);
    const stat = fs.statSync(filePath);

    if (!stat.isFile()) {
      return;
    }

    const { name, ext } = path.parse(file);
    if (!allowedExtensions.has(ext.toLowerCase())) {
      return;
    }

    input[name] = filePath;
  });

  return input;
}

/** @type {import('vite').UserConfig} */
export const cssConfig = defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist/styles',
    rollupOptions: {
      input: generateStylesRollupInput(),
      output: {
        inlineDynamicImports: false,
        assetFileNames: '[name][extname]',
        format: 'commonjs',
      },
    },
    cssCodeSplit: true,
    copyPublicDir: false,
    target: 'esnext',
  },
});

/** @type {import('vite').UserConfig} */
export const cssBundlesConfig = createCssBundlesConfig(bundles, true);

/** @type {import('vite').UserConfig} */
export const fontsConfig = defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist/lx-fonts',
    rollupOptions: {
      input: generateFontsRollupInput(path.resolve(__dirname, 'src/lx-fonts')),
      output: {
        inlineDynamicImports: false,
        assetFileNames: '[name][extname]',
      },
    },
    copyPublicDir: false,
  },
});
