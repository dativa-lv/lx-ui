<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useElementSize, useMediaQuery } from '@vueuse/core';
import { generateUUID } from '@/utils/stringUtils';
import { sanitizeToPlainText } from '@/utils/formatUtils';
import LxTextArea from '@/components/TextArea.vue';
import LxToolbar from '@/components/Toolbar.vue';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  text: { type: String, default: null },
  loading: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  texts: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['send']);

const isTouchMode = useMediaQuery('(pointer: coarse), (pointer: none)');

const composerRef = ref(null);
const { width: composerWidth } = useElementSize(composerRef);
const rawText = ref(props.text ?? '');

watch(
  () => props.text,
  (value) => {
    rawText.value = value ?? '';
  }
);

const normalizedText = computed(() => sanitizeToPlainText(rawText.value ?? '').trim());
const canSend = computed(() => normalizedText.value.length > 0);
const isLoading = computed(() => props.loading);
const isBusy = computed(() => props.busy);

// Beside by default; flips to stacked (toolbar on its own row) once the text no longer fits at the beside width.
const isMultiline = ref(false);

const sendActions = computed(() => [
  {
    id: 'send',
    name: props.texts.send,
    icon: 'submit',
    kind: 'primary',
    variantForce: composerWidth.value < 500 ? 'icon-only' : 'default',
    area: 'right',
    disabled: !canSend.value,
    loading: isLoading.value,
    busy: isBusy.value,
  },
]);

function send() {
  if (!canSend.value || isLoading.value || isBusy.value) {
    return;
  }

  const value = {
    text: normalizedText.value,
    // other properties can be added here if needed, such as files, etc.
  };

  emit('send', value);

  rawText.value = '';
}

function onAction(actionId) {
  if (actionId === 'send') {
    send();
  }
}

function onKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey && !isTouchMode.value) {
    event.preventDefault();
    send();
  }
}

let resizeObserver = null;
let frame = null;
let mirror = null;
let textareaEl = null;
let reserved = 0;

function readGap() {
  if (!composerRef.value) {
    return 0;
  }
  const gap = Number.parseFloat(getComputedStyle(composerRef.value).columnGap);
  return Number.isFinite(gap) ? gap : 0;
}

function measure() {
  if (!composerRef.value) {
    return;
  }
  if (!textareaEl) {
    textareaEl = composerRef.value.querySelector('textarea.lx-text-area-dynamic');
  }
  if (!textareaEl || !mirror) {
    return;
  }

  // Explicit line breaks always stack.
  if (rawText.value.includes('\n')) {
    isMultiline.value = true;
    return;
  }

  // Measure the toolbar's reserved width only from the beside layout (where it is not stretched).
  if (!isMultiline.value) {
    const toolbarEl = composerRef.value.querySelector('.lx-chat-composer-toolbar');
    if (toolbarEl?.offsetWidth) {
      reserved = toolbarEl.offsetWidth + readGap();
    }
  }

  const fullWidth = composerWidth.value;
  if (!fullWidth || !reserved) {
    return;
  }

  // Mirror the textarea's box exactly so its wrapping matches the real field at the beside width.
  const cs = getComputedStyle(textareaEl);
  mirror.style.fontFamily = cs.fontFamily;
  mirror.style.fontSize = cs.fontSize;
  mirror.style.fontWeight = cs.fontWeight;
  mirror.style.lineHeight = cs.lineHeight;
  mirror.style.letterSpacing = cs.letterSpacing;
  mirror.style.paddingTop = cs.paddingTop;
  mirror.style.paddingBottom = cs.paddingBottom;
  mirror.style.paddingLeft = cs.paddingLeft;
  mirror.style.paddingRight = cs.paddingRight;
  mirror.style.borderTopWidth = cs.borderTopWidth;
  mirror.style.borderBottomWidth = cs.borderBottomWidth;
  mirror.style.borderLeftWidth = cs.borderLeftWidth;
  mirror.style.borderRightWidth = cs.borderRightWidth;
  mirror.style.width = `${Math.max(0, fullWidth - reserved)}px`;

  mirror.textContent = 'X';
  const singleLineHeight = mirror.scrollHeight;
  mirror.textContent = rawText.value || 'X';

  isMultiline.value = mirror.scrollHeight > singleLineHeight + 1;
}

function scheduleMeasure() {
  if (frame) {
    globalThis.cancelAnimationFrame(frame);
  }
  frame = globalThis.requestAnimationFrame(measure);
}

onMounted(() => {
  mirror = document.createElement('div');
  Object.assign(mirror.style, {
    position: 'absolute',
    top: '0',
    left: '-9999px',
    visibility: 'hidden',
    pointerEvents: 'none',
    boxSizing: 'border-box',
    borderStyle: 'solid',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
  });
  composerRef.value?.appendChild(mirror);

  if (typeof ResizeObserver !== 'undefined' && composerRef.value) {
    // React to width changes only — reacting to height (which the layout flip itself changes) would bounce at the boundary.
    let lastWidth = 0;
    resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width ?? 0;
      if (Math.abs(width - lastWidth) < 1) {
        return;
      }
      lastWidth = width;
      // On a real width change, re-measure the reserved toolbar width (only used while beside).
      if (!isMultiline.value) {
        reserved = 0;
      }
      scheduleMeasure();
    });
    resizeObserver.observe(composerRef.value);
  }

  nextTick(measure);
});

onBeforeUnmount(() => {
  if (frame) {
    globalThis.cancelAnimationFrame(frame);
  }
  resizeObserver?.disconnect();
  mirror?.remove();
});

watch(rawText, () => nextTick(measure));
</script>

<template>
  <div
    ref="composerRef"
    class="lx-chat-composer"
    :class="{ 'lx-chat-composer-multiline lx-complex-input': isMultiline }"
  >
    <LxTextArea
      v-model="rawText"
      :id="`${id}-input`"
      class="lx-chat-composer-field"
      :placeholder="texts.placeholder"
      :dynamicHeight="true"
      :disabled="isLoading || isBusy"
      @keydown="onKeydown"
    />
    <LxToolbar
      class="lx-chat-composer-toolbar"
      :id="`${id}-toolbar`"
      :actionDefinitions="sendActions"
      defaultArea="right"
      :noBorders="true"
      @actionClick="onAction"
    />
  </div>
</template>
