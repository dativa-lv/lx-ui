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
});

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

watch(
  () => props.value,
  async (newMarkdown) => {
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

    renderer.heading = ({ text, depth }) => {
      headingCounter += 1;
      return `<h${depth} id="markdown-section-${props.id}-${headingCounter}">${text}</h${depth}>`;
    };

    markdown.value = await marked(newMarkdown, { renderer });

    markdownLoading.value = false;
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
