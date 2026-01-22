/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
import { logError } from '@/utils/devUtils';
import useLx from '@/hooks/useLx';

const libraryCache = new Map();
const pendingPromises = new Map();

const libraryLoaders = {
  x509: async () => {
    const module = await import('jsrsasign');
    if (module.X509) return module.X509;
    if (module.default?.X509) return module.default.X509;
    if (module.jsrsasign?.X509) return module.jsrsasign.X509;
    logError('Could not find X509 in jsrsasign module', useLx().getGlobals()?.environment);
    throw new Error('Could not find X509 in jsrsasign module');
  },

  exifreader: async () => {
    const module = await import('exifreader');
    return module;
  },

  jszip: async () => {
    const module = await import('jszip');
    return module.default || module;
  },

  pdfjs: async () => {
    const pdfjs = await import('pdfjs-dist');
    const workerUrl = (await import('pdfjs-dist/build/pdf.worker.mjs?url')).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    return pdfjs;
  },

  c2pa: async () => {
    const { createC2pa, selectProducer } = await import('c2pa');
    const wasmSrc = (await import('c2pa/dist/assets/wasm/toolkit_bg.wasm?url')).default;
    const workerSrc = (await import('c2pa/dist/c2pa.worker.js?url')).default;
    return { createC2pa, selectProducer, wasmSrc, workerSrc };
  },

  sanitizeUrl: async () => {
    const { sanitizeUrl } = await import('@braintree/sanitize-url');
    return { sanitizeUrl };
  },

  tiptap: async () => {
    const [
      vue3,
      heading,
      starterKit,
      placeholder,
      link,
      underline,
      characterCount,
      textStyle,
      color,
      markdown,
    ] = await Promise.all([
      import('@tiptap/vue-3'),
      import('@tiptap/extension-heading'),
      import('@tiptap/starter-kit'),
      import('@tiptap/extension-placeholder'),
      import('@tiptap/extension-link'),
      import('@tiptap/extension-underline'),
      import('@tiptap/extension-character-count'),
      import('@tiptap/extension-text-style'),
      import('@tiptap/extension-color'),
      import('tiptap-markdown'),
    ]);
    return {
      Editor: vue3.Editor,
      EditorContent: vue3.EditorContent,
      Heading: heading.Heading,
      StarterKit: starterKit.StarterKit,
      Placeholder: placeholder.Placeholder,
      Link: link.Link,
      Underline: underline.Underline,
      CharacterCount: characterCount.CharacterCount,
      TextStyle: textStyle.TextStyle,
      Color: color.Color,
      Markdown: markdown.Markdown,
    };
  },

  vueQrcodeReader: async () => {
    const module = await import('vue-qrcode-reader');
    return module;
  },

  draggable: async () => {
    const module = await import('vuedraggable/src/vuedraggable');
    return module.default || module;
  },

  marked: async () => {
    const module = await import('marked');
    return module;
  },

  vueLeaflet: async () => {
    const module = await import('@vue-leaflet/vue-leaflet');
    return module;
  },

  // Add more libraries here...
};

/**
 * Loads a library by name.
 * @param {string} name - e.g., 'x509', 'pdfjs'
 * @param {boolean} [caching=true] - If false, disables caching (useful when managing cache externally, e.g., in a store)
 * @returns {Promise<any>} - The loaded library
 */
async function loadLibrary(name, caching = true) {
  if (caching && libraryCache.has(name)) {
    return libraryCache.get(name);
  }

  if (pendingPromises.has(name)) {
    return pendingPromises.get(name);
  }

  const loader = libraryLoaders[name];

  if (!loader) {
    logError(`No loader registered for '${name}'`, useLx().getGlobals()?.environment);
    throw new Error(`No loader registered for '${name}'`);
  }

  const promise = (async () => {
    try {
      const loaded = await loader();
      if (caching) libraryCache.set(name, loaded);
      return loaded;
    } catch (error) {
      logError(`Failed to load '${name}': ${error}`, useLx().getGlobals()?.environment);
      throw new Error(`Failed to load '${name}': ${error.message}`);
    } finally {
      pendingPromises.delete(name);
    }
  })();

  pendingPromises.set(name, promise);
  return promise;
}

function clearLibraryCache() {
  libraryCache.clear();
}

function isLibraryLoaded(name) {
  return libraryCache.has(name);
}

export { loadLibrary, clearLibraryCache, isLibraryLoaded };
