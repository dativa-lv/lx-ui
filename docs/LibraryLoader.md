# Library Loader Usage Guide

A reusable, performant utility for lazy-loading heavy JavaScript libraries (e.g., jsrsasign, pdfjs-dist, c2pa) in a Vite-based project. It handles dynamic imports safely, avoids duplicate loads, supports concurrent calls, and includes optional caching.

## Importing the Loader
```js
import { lxLibLoader } from '@wntr/lx-ui';
```

## Loading a Library (Caching Enabled by Default)
```js
// Loads once, caches for future calls
const X509 = await lxLibLoader.loadLibrary('x509');

// Use it immediately
const cert = new X509();
```

## Disabling Caching (e.g., for External State Management)
```js
// No caching – reloads every time
const pdfjs = await lxLibLoader.loadLibrary('pdfjs', false);
```

## Checking if a Library is Loaded
```js
if (lxLibLoader.isLibraryLoaded('pdfjs')) {
  console.log('pdfjs is already loaded!');
}
```

## Clearing the Cache (e.g., for Testing or Hot-Reload)
```js
lxLibLoader.clearLibraryCache();
```