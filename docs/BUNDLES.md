# Bundle Management System

## Overview

Bundle CSS files are generated dynamically during the Vite bundles build.

- `commonStyles` are shared by default across bundles.
- `bundles` adds bundle-specific styles.
- `bundlesWithoutCommonStyles` lets selected bundles opt out from shared styles.
- No `lx-bt-*.css` files are kept in `src/styles` anymore.

## Current Architecture

### 1. Bundle Configuration

File: `bundles.config.js` (project root)

It exports:

- `commonStyles`: styles included in all bundles by default.
- `bundlesWithoutCommonStyles`: bundle names that should use only their own styles.
- `bundles`: per-bundle style lists.

Example:

```javascript
export const commonStyles = [
  'lx-reset',
  'lx-fonts-carbon',
  'lx-pt-carbon',
  'lx-ut-carbon-light',
  'lx-ut-carbon-dark',
  'lx-ut-carbon-contrast',
];

export const bundles = {
  'lx-bt-digives': ['lx-fonts-digives', 'lx-pt-digives'],
  'lx-bt-shell-widget': ['lx-shell-widget', 'lx-pt-carbon', 'lx-ut-carbon-light'],
};

export const bundlesWithoutCommonStyles = [
  'lx-bt-shell-widget'
];
```

### 2. Bundle Generation in Vite

File: `vite.assets.config.mjs`

How it works:

- Uses a virtual-module plugin (`virtual:bundle:*`) to generate each bundle entry in memory.
- For each bundle, styles are resolved as:
  - `commonStyles + bundleSpecificStyles`, or
  - only `bundleSpecificStyles` if bundle is in `bundlesWithoutCommonStyles`.
- De-duplicates merged style lists before output.
- Emits final CSS only to `dist/bundles`.

### 3. Regular Styles Build Behavior

The normal styles build (`dist/styles`) excludes bundle outputs by bundle names from config, so bundle entries do not leak into the regular styles artifacts.

## Workflow

### Add a shared style to all bundles

1. Edit `bundles.config.js`.
2. Add the file to `commonStyles`.
3. Run `pnpm build`.

### Add a style to one bundle only

1. Edit `bundles.config.js`.
2. Add the file under that bundle in `bundles`.
3. Run `pnpm build`.

### Exclude a bundle from common styles

1. Edit `bundles.config.js`.
2. Add the bundle name to `bundlesWithoutCommonStyles`.
3. Keep only required files in that bundle's own array.
4. Run `pnpm build`.

## File Locations

- Config: `bundles.config.js`
- Build logic: `vite.assets.config.mjs`
- Output bundles: `dist/bundles/lx-bt-*.css`

## Notes

- If a style file is renamed, update references in `bundles.config.js`.
