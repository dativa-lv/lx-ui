<script setup>
import { computed, onBeforeUnmount, onMounted, provide, ref } from 'vue';
import { generateUUID } from '@/utils/stringUtils';
import { getDisplayTexts } from '@/utils/generalUtils';
import MessageList from '@/components/chat/MessageList.vue';
import MessageComposer from '@/components/chat/MessageComposer.vue';
import LxButton from '@/components/Button.vue';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  kind: {
    type: String,
    default: 'chat',
    options: ['chat', 'comments'],
  },
  userDefinitions: { type: Array, default: () => [] }, // Per-user info by message.userId: { id, name, isMe, isAi }.
  messageText: { type: String, default: null },
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  messageGrouping: { type: Number, default: 10 }, // minutes; 0 = no grouping
  clarifyingQuestionsBuilder: { type: Object, default: null }, // Optional LxFormBuilder when absent, message schemas are ignored.
  messageActionDefinitions: { type: Array, default: () => [] }, // Per-message actions, gate visibility via `visibleByAttribute`/`isAi`/`isMe`.
  typing: { type: Boolean, default: false }, // Global state: someone (from typingUsers) is currently typing/thinking. Independent of any message.
  typingUsers: { type: Array, default: () => [] }, // Ids of userDefinitions entries currently typing; resolved to names in the indicator.
  typingActionDefinitions: { type: Array, default: () => [] }, // Actions rendered alongside the typing indicator (e.g. a stop/cancel/reasoning action).
  texts: { type: Object, default: () => ({}) },
});

const textsDefault = {
  placeholder: 'Ierakstiet kaut ko...',
  empty: 'Sarakstē vēl nav ziņu',
  emptyDescription: 'Nosūtiet pirmo ziņu, lai sāktu sarunu',
  send: 'Sūtīt',
  answerSubmit: 'Iesniegt',
  error: 'Kļūda!',
  ai: 'AI',
  scrollToBottom: 'Atgriezties pie jaunākajām ziņām',
  statusText: 'domā',
  and: 'un',
  messageTimeLabel: 'Ziņas laiks',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault, 'LxChat'));

const emits = defineEmits([
  'send',
  'clarifying-questions-submit',
  'message-action-click',
  'typing-action-click',
]);

function send(value) {
  emits('send', value);
}

// Responsiveness is based on the component's own width, not the viewport.
const wrapperRef = ref(null);
const size = ref('l');
let observer = null;
let frame = null;

function resolveSize(width) {
  if (width > 900) return 'l';
  if (width >= 500) return 'm';
  return 's';
}

function updateSize(width) {
  if (width) {
    size.value = resolveSize(width);
  }
}

onMounted(() => {
  if (!wrapperRef.value) {
    return;
  }

  // Set the correct size immediately so the first paint is not stuck on the default.
  updateSize(wrapperRef.value.getBoundingClientRect().width);

  if (typeof ResizeObserver === 'undefined') {
    return;
  }

  observer = new ResizeObserver(([entry]) => {
    if (frame) {
      globalThis.cancelAnimationFrame(frame);
    }
    frame = globalThis.requestAnimationFrame(() => {
      updateSize(entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width);
    });
  });
  observer.observe(wrapperRef.value);
});

onBeforeUnmount(() => {
  if (frame) {
    globalThis.cancelAnimationFrame(frame);
  }
  observer?.disconnect();
});

const sizeClass = computed(() => `lx-chat-${size.value}`);
const kindClass = computed(() => `lx-chat-${props.kind}`);

// Scroll-to-bottom button + footer shadow opacity (state lives in MessageList; rendered here above the composer).
const messageListRef = ref(null);
const showScrollDown = ref(false);
const scrollShadowOpacity = ref(0);

function scrollToBottom(event) {
  messageListRef.value?.scrollToBottom();
  if (event?.detail === 0) {
    messageListRef.value?.focusLastMessage();
  }
}

const footerRef = ref(null);
const footerHeight = ref(0);
let footerObserver = null;

onMounted(() => {
  if (typeof ResizeObserver === 'undefined' || !footerRef.value) {
    return;
  }
  footerObserver = new ResizeObserver(([entry]) => {
    footerHeight.value = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
  });
  footerObserver.observe(footerRef.value);
});

onBeforeUnmount(() => {
  footerObserver?.disconnect();
});

// Consumer-defined actions rendered per bubble; click hands back the action id + message id (consumer looks up the message itself).
provide('lxChatMessageActionDefinitions', () => props.messageActionDefinitions);
provide('lxChatMessageActionClick', (id, message) =>
  emits('message-action-click', { id, messageId: message.id })
);

// Expose the optional form builder (as a getter, to stay reactive) and a submit callback.
provide('lxChatClarifyingQuestionsBuilder', () => props.clarifyingQuestionsBuilder);
provide('lxChatSubmitClarifyingQuestions', (message, values) =>
  emits('clarifying-questions-submit', { message, values })
);

// Actions rendered alongside the (message-independent) typing indicator.
provide('lxChatTypingActionDefinitions', () => props.typingActionDefinitions);
provide('lxChatTypingActionClick', (id) => emits('typing-action-click', { id }));
</script>

<template>
  <div
    ref="wrapperRef"
    class="lx-chat-wrapper"
    :class="[sizeClass, kindClass]"
    :id="id"
    data-component="lx-chat"
    :data-id="id"
  >
    <LxButton
      v-if="showScrollDown"
      class="lx-chat-scroll-down"
      kind="ghost"
      variant="icon-only"
      icon="scroll-down"
      :label="displayTexts.scrollToBottom"
      :style="{ '--lx-chat-footer-height': `${footerHeight}px` }"
      @click="scrollToBottom"
    />

    <MessageList
      ref="messageListRef"
      :id="id"
      :items="items"
      :userDefinitions="userDefinitions"
      :size="size"
      :kind="kind"
      :messageGrouping="messageGrouping"
      :busy="busy"
      :loading="loading"
      :typing="typing"
      :typingUsers="typingUsers"
      :texts="displayTexts"
      @scroll-down-change="(value) => (showScrollDown = value)"
      @scroll-shadow-change="(value) => (scrollShadowOpacity = value)"
    />

    <div
      ref="footerRef"
      class="lx-chat-footer"
      :style="{ '--lx-chat-footer-shadow-opacity': scrollShadowOpacity }"
    >
      <MessageComposer
        :id="id"
        :text="messageText"
        :loading="loading"
        :busy="busy"
        :texts="displayTexts"
        @send="send"
      />
    </div>
  </div>
</template>
