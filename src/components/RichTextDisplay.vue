<script setup>
import LxLoader from '@/components/Loader.vue';
import { buildVueDompurifyHTMLDirective } from 'vue-dompurify-html';
import { ref, watch } from 'vue';
import { loadLibrary } from '@/utils/libLoader';
import { generateUUID } from '@/utils/stringUtils';

const props = defineProps({
  value: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  id: { type: String, default: () => generateUUID() },
  // escapeHtml shows raw HTML in the markdown as text instead of rendering it.
  escapeHtml: { type: Boolean, default: false },
});

const htmlEntities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function escapeHtmlText(text) {
  return String(text ?? '').replace(/[&<>"']/g, (c) => htmlEntities[c]);
}

const markdownLoading = ref(false);
const markdown = ref('');

let headingCounter = 0;
let marked = null;

async function loadMarked() {
  const lib = await loadLibrary('marked');
  marked = lib.marked;
}

const vCleanHtml = buildVueDompurifyHTMLDirective({
  default: {
    // dompurify already strips unsafe tags like script; keep only app-specific UI bans.
    FORBID_TAGS: ['button', 'form', 'input', 'textarea', 'select', 'option'],
  },
  hooks: {
    afterSanitizeAttributes: (node) => {
      if (node.tagName === 'A') {
        node.setAttribute('target', '_blank');
      }
    },
  },
});

function wrapTables(container) {
  const parentClass = 'lx-rich-text-table-wrapper';

  container.querySelectorAll('table').forEach((table) => {
    if (table.parentElement?.classList.contains(parentClass)) {
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = parentClass;
    table.parentNode?.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
}

function transformMarkdownHtml(html, transforms = []) {
  if (!html || typeof document === 'undefined') {
    return html;
  }

  const container = document.createElement('div');
  container.innerHTML = html;

  transforms.forEach((transform) => {
    transform(container);
  });

  return container.innerHTML;
}

watch(
  () => [props.value, props.escapeHtml],
  async ([newMarkdown]) => {
    // marked() throws on null/undefined, and an explicit null from the parent skips the prop default
    if (!newMarkdown) {
      markdown.value = '';
      markdownLoading.value = false;
      return;
    }

    markdownLoading.value = true;
    await loadMarked();

    headingCounter = 0;
    const renderer = new marked.Renderer();

    // Render inline tokens so heading emphasis/code works and inline HTML goes through renderer.html.
    renderer.heading = function heading({ tokens, depth }) {
      headingCounter += 1;
      const content = this.parser.parseInline(tokens);
      return `<h${depth} id="markdown-section-${props.id}-${headingCounter}">${content}</h${depth}>`;
    };

    if (props.escapeHtml) {
      renderer.html = ({ text, block }) => {
        const escaped = escapeHtmlText(text);
        // Block HTML has no paragraph of its own, so wrap it and keep its line breaks.
        return block ? `<p>${escaped.trimEnd().replace(/\n/g, '<br>')}</p>\n` : escaped;
      };
    }

    try {
      const parsedMarkdown = await marked(String(newMarkdown), { renderer });
      markdown.value = transformMarkdownHtml(parsedMarkdown, [wrapTables]);
    } catch {
      // Show the source as text rather than leaving the loader or an empty block.
      markdown.value = escapeHtmlText(newMarkdown);
    } finally {
      markdownLoading.value = false;
    }
  },
  { immediate: true }
);
</script>

<template>
  <article
    v-if="!markdownLoading && !props.loading"
    :id="id"
    v-clean-html="markdown"
    class="lx-article lx-rich-text-wrapper"
  />

  <article v-else :id="id" class="lx-article lx-rich-text-loader">
    <LxLoader :loading="markdownLoading || props.loading" />
  </article>
</template>
