<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { generateUUID } from '@/utils/stringUtils';
import { parseDate, isDateValid, formatDateJSON } from '@/utils/dateUtils';
import MessageBubble from '@/components/chat/MessageBubble.vue';
import TypingIndicator from '@/components/chat/TypingIndicator.vue';
import LxEmptyState from '@/components/EmptyState.vue';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  items: { type: Array, default: () => [] },
  userDefinitions: { type: Array, default: () => [] },
  avatarKind: { type: String, default: null },
  size: { type: String, default: 'l' },
  kind: { type: String, default: 'chat' },
  messageGrouping: { type: Boolean, default: true },
  messageGroupingInterval: { type: Number, default: 10 },
  busy: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  typing: { type: Boolean, default: false },
  typingUsers: { type: Array, default: () => [] },
  texts: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['scroll-down-change', 'scroll-shadow-change', 'top-shadow-change']);

const listRef = ref(null);
const contentRef = ref(null);
const messageBubbleRefs = ref([]);

const NEAR_BOTTOM_THRESHOLD = 64;
const isNearBottom = ref(true);

const SHADOW_FADE_DISTANCE = 100;
const scrollShadowOpacity = ref(0);
const topShadowOpacity = ref(0);

function resolveDate(value) {
  const parsed = parseDate(value);
  return isDateValid(parsed) ? parsed : null;
}

const userDefinitionsById = computed(() => {
  const map = new Map();
  props.userDefinitions.forEach((definition) => map.set(definition.id, definition));
  return map;
});

// Clusters group same user + same day; sub-groups split on gaps over `messageGroupingInterval` minutes (always, if <= 0).
// When `messageGrouping` is false, each message becomes its own cluster and always shows a person header.
const clusters = computed(() => {
  const result = [];
  const groupingEnabled = props.messageGrouping;
  const groupingMs =
    (Number.isFinite(props.messageGroupingInterval) ? props.messageGroupingInterval : 10) * 60000;

  for (let index = 0; index < props.items.length; index += 1) {
    const message = props.items[index];
    const date = resolveDate(message.createdAt);
    const dayKey = date ? formatDateJSON(date) : '';
    const userDefinition = userDefinitionsById.value.get(message.userId) ?? {};
    const isMe = Boolean(userDefinition.isMe);
    const isAi = Boolean(userDefinition.isAi);
    const resolvedMessage = {
      ...message,
      userName: userDefinition.name,
      avatarIcon: userDefinition.icon,
      avatarIconSet: userDefinition.iconSet,
      description: userDefinition.description,
      role: userDefinition.role,
      institution: userDefinition.institution,
    };

    const lastCluster = result[result.length - 1] ?? null;
    const isNewCluster =
      !groupingEnabled ||
      !lastCluster ||
      lastCluster.userId !== message.userId ||
      lastCluster.dayKey !== dayKey;

    if (isNewCluster) {
      const category = !isMe && message.category ? message.category : null;
      result.push({
        id: `${props.id}-cluster-${index}`,
        userId: message.userId,
        dayKey,
        isMe,
        isAi,
        category,
        messages: [],
      });
    }

    const cluster = result[result.length - 1];
    const previous = cluster.messages[cluster.messages.length - 1] ?? null;
    const isClusterStart = !previous;

    let isSubGroupStart;
    if (!groupingEnabled || isClusterStart) {
      isSubGroupStart = true;
    } else if (groupingMs <= 0) {
      isSubGroupStart = true;
    } else {
      const previousDate = resolveDate(previous.message.createdAt);
      isSubGroupStart =
        !date || !previousDate || Math.abs(date.getTime() - previousDate.getTime()) > groupingMs;
    }

    cluster.messages.push({
      id: `${props.id}-message-${message.id}`,
      message: resolvedMessage,
      showPersonHeader: !groupingEnabled || isClusterStart,
      showTimestamp: isSubGroupStart && !isClusterStart,
    });
  }

  return result;
});

const hasMessages = computed(() => props.items.length > 0);

const typingUserNames = computed(() =>
  props.typingUsers
    .map((userId) => userDefinitionsById.value.get(userId))
    .filter(Boolean)
    .map((definition) => ({ name: definition.name, isAi: Boolean(definition.isAi) }))
);
const showTyping = computed(() => props.typing);

const showScrollDown = computed(
  () => (hasMessages.value || showTyping.value) && !isNearBottom.value
);

watch(showScrollDown, (value) => emit('scroll-down-change', value), { immediate: true });
watch(scrollShadowOpacity, (value) => emit('scroll-shadow-change', value), { immediate: true });
watch(topShadowOpacity, (value) => emit('top-shadow-change', value), { immediate: true });

function computeNearBottom() {
  const el = listRef.value;
  if (!el) {
    return true;
  }
  return el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD;
}

function computeShadowOpacity() {
  const el = listRef.value;
  if (!el) {
    return 0;
  }
  const distanceFromBottom = Math.max(0, el.scrollHeight - el.scrollTop - el.clientHeight);
  return Math.min(1, distanceFromBottom / SHADOW_FADE_DISTANCE);
}

function computeTopShadowOpacity() {
  const el = listRef.value;
  if (!el) {
    return 0;
  }
  return Math.min(1, Math.max(0, el.scrollTop) / SHADOW_FADE_DISTANCE);
}

function scrollToBottom() {
  const el = listRef.value;
  if (!el) return;
  const reduceMotion = document.body.classList.contains('lx-no-animations');
  el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' });
}

function focusLastMessage() {
  const refs = messageBubbleRefs.value;
  refs[refs.length - 1]?.focus({ preventScroll: true });
}

// Lands on the start of the last message (so a long one shows its top), clamped to the bottom for short ones.
function scrollToLatest() {
  const el = listRef.value;
  if (!el) return;
  const items = el.querySelectorAll('.lx-chat-message');
  const last = items[items.length - 1];
  if (!last) return;
  el.scrollTop = Math.min(last.offsetTop, el.scrollHeight - el.clientHeight);
}

function onScroll() {
  isNearBottom.value = computeNearBottom();
  scrollShadowOpacity.value = computeShadowOpacity();
  topShadowOpacity.value = computeTopShadowOpacity();
}

// Keep new/streaming content in view, but only if the user was already at the bottom.
let contentObserver = null;

onMounted(() => {
  listRef.value?.addEventListener('scroll', onScroll, { passive: true });

  if (typeof ResizeObserver !== 'undefined') {
    contentObserver = new ResizeObserver(() => {
      if (isNearBottom.value) {
        scrollToLatest();
      }
      // Streaming/new content can shift the scroll-from-bottom distance without a scroll event.
      scrollShadowOpacity.value = computeShadowOpacity();
      topShadowOpacity.value = computeTopShadowOpacity();
    });
    if (contentRef.value) {
      contentObserver.observe(contentRef.value);
    }
  }

  nextTick(scrollToLatest);
});

onBeforeUnmount(() => {
  listRef.value?.removeEventListener('scroll', onScroll);
  contentObserver?.disconnect();
});

// (Re)attach the content observer whenever the list element appears (e.g. empty -> non-empty).
watch(contentRef, (el) => {
  if (!contentObserver) return;
  contentObserver.disconnect();
  if (el) contentObserver.observe(el);
});

watch(
  () => props.items,
  (newItems, oldItems) => {
    const addedCount = newItems.length - (oldItems?.length ?? 0);
    if (addedCount <= 0) return;

    const sentByMe = newItems
      .slice(-addedCount)
      .some((item) => userDefinitionsById.value.get(item.userId)?.isMe);
    if (sentByMe) {
      nextTick(scrollToBottom);
    }
  }
);

defineExpose({ scrollToBottom, focusLastMessage });
</script>

<template>
  <div ref="listRef" class="lx-chat-message-list">
    <ul v-if="hasMessages || showTyping" ref="contentRef" class="lx-chat-message-list-items">
      <li
        v-for="cluster in clusters"
        :key="cluster.id"
        class="lx-chat-user-group"
        :class="{
          'lx-chat-user-me': cluster.isMe,
          'lx-chat-user-ai': cluster.isAi,
        }"
      >
        <ul class="lx-chat-user-messages-group">
          <li
            v-for="message in cluster.messages"
            :key="message.id"
            :id="message.id"
            class="lx-chat-message"
          >
            <MessageBubble
              ref="messageBubbleRefs"
              :id="message.id"
              :message="message.message"
              :isMe="cluster.isMe"
              :isAi="cluster.isAi"
              :category="cluster.category"
              :messageGrouping="messageGrouping"
              :showPersonHeader="message.showPersonHeader"
              :showTimestamp="message.showTimestamp"
              :avatarKind="avatarKind"
              :size="size"
              :kind="kind"
              :busy="busy"
              :loading="loading"
              :texts="texts"
            />
          </li>
        </ul>
      </li>

      <li v-if="showTyping" :id="`${id}-typing`" class="lx-chat-message lx-chat-user-group">
        <TypingIndicator :id="`${id}-typing`" :typingUserNames="typingUserNames" :texts="texts" />
      </li>
    </ul>

    <LxEmptyState v-else :label="texts.empty" :description="texts.emptyDescription" />
  </div>
</template>
