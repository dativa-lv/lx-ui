<script setup>
import { computed, inject } from 'vue';
import { generateUUID, capitalizeFirstLetter } from '@/utils/stringUtils';
import LxListItem from '@/components/list/ListItem.vue';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  typingUserNames: { type: Array, default: () => [] }, // Resolved { name, isAi } entries (from Chat's typingUsers ids).
  texts: { type: Object, default: () => ({}) },
});

const typingActionDefinitionsGetter = inject('lxChatTypingActionDefinitions', null);
const typingActionClick = inject('lxChatTypingActionClick', null);
const typingActions = computed(() => typingActionDefinitionsGetter?.() || []);

const namesText = computed(() => {
  const names = props.typingUserNames.map((user) => user.name).filter(Boolean);
  if (names.length === 0) {
    return '';
  }
  if (names.length === 1) {
    return names[0];
  }
  const and = props.texts.and || '';
  return `${names.slice(0, -1).join(', ')} ${and} ${names[names.length - 1]}`.trim();
});

const statusLabel = computed(() => {
  const status = props.texts.statusText || '';
  return namesText.value ? `${namesText.value} ${status}`.trim() : capitalizeFirstLetter(status);
});

function onAction(actionId) {
  typingActionClick?.(actionId);
}
</script>

<template>
  <div class="lx-chat-bubble-wrapper">
    <div class="lx-chat-bubble-content">
      <LxListItem
        class="lx-chat-bubble lx-chat-typing-bubble"
        :id="`${id}-item`"
        label=""
        :value="{}"
        :actionDefinitions="typingActions"
        @action-click="onAction"
      >
        <template #customItem>
          <div class="lx-chat-status" role="status" aria-live="polite">
            <span v-if="statusLabel" class="lx-chat-status-text">{{ statusLabel }}</span>
            <span class="lx-chat-typing" aria-hidden="true">
              <span>.</span><span>.</span><span>.</span>
            </span>
          </div>
        </template>
      </LxListItem>
    </div>
  </div>
</template>
