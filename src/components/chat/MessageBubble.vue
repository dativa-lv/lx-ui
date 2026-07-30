<script setup>
import { computed, inject, ref } from 'vue';
import { generateUUID } from '@/utils/stringUtils';
import {
  parseDate,
  isDateValid,
  formatDateJSON,
  extractTimeFromDate,
  humanizeDate,
  formatFull,
} from '@/utils/dateUtils';
import useLx from '@/hooks/useLx';
import LxPersonDisplay from '@/components/PersonDisplay.vue';
import LxBadge from '@/components/Badge.vue';
import LxListItem from '@/components/list/ListItem.vue';
import LxForm from '@/components/forms/Form.vue';
import LxRichTextDisplay from '@/components/RichTextDisplay.vue';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  message: { type: Object, required: true },
  isMe: { type: Boolean, default: false },
  isAi: { type: Boolean, default: false },
  category: { type: String, default: null },
  showPersonHeader: { type: Boolean, default: false },
  showTimestamp: { type: Boolean, default: false },
  size: { type: String, default: 'l' },
  kind: { type: String, default: 'chat' },
  busy: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  texts: { type: Object, default: () => ({}) },
});

const messageActionDefinitionsGetter = inject('lxChatMessageActionDefinitions', null);
const messageActionClick = inject('lxChatMessageActionClick', null);
const clarifyingQuestionsBuilderGetter = inject('lxChatClarifyingQuestionsBuilder', null);
const submitClarifyingQuestions = inject('lxChatSubmitClarifyingQuestions', null);

const timeText = computed(() => {
  const parsedDate = parseDate(props.message.createdAt);
  if (!isDateValid(parsedDate)) {
    return '';
  }

  const createdAtString = parsedDate.toISOString();
  const date = humanizeDate(createdAtString, { limitDays: 2 });
  const localeId = useLx().getGlobals()?.locale?.locale || 'lv-LV';
  const time = extractTimeFromDate(localeId, createdAtString);
  const showDate = formatDateJSON(parsedDate) !== formatDateJSON(new Date());

  return showDate ? `${date} ${time}` : time;
});

const fullTimeText = computed(() => {
  const parsedDate = parseDate(props.message.createdAt);
  return isDateValid(parsedDate) ? formatFull(parsedDate) : '';
});

const personValue = computed(() => ({
  name: props.message.userName,
  fullTime: fullTimeText.value,
}));
const personCustomAttributes = computed(() => [
  { name: props.texts.messageTimeLabel, attributeName: 'fullTime' },
]);

// Receivers always show the full header at a cluster start; the sender collapses to a time label in `chat` at m/s.
const showFullPerson = computed(
  () => props.showPersonHeader && (!props.isMe || props.kind === 'comments' || props.size === 'l')
);
const isCollapsedHeader = computed(() => props.showPersonHeader && !showFullPerson.value);
const showTimeLabel = computed(() => isCollapsedHeader.value || props.showTimestamp);

const timeOnly = computed(() => {
  const parsedDate = parseDate(props.message.createdAt);
  if (!isDateValid(parsedDate)) {
    return '';
  }
  const localeId = useLx().getGlobals()?.locale?.locale || 'lv-LV';
  return extractTimeFromDate(localeId, parsedDate.toISOString());
});

const timeLabelText = computed(() => (isCollapsedHeader.value ? timeText.value : timeOnly.value));

const chatDisabled = computed(() => props.busy || props.loading);

const messageActions = computed(() => messageActionDefinitionsGetter?.() || []);
// Item value is the message enriched with isAi/isMe (so visibleByAttribute can gate on role too)
// and notBusy (so an action opts into busy/loading gating with `enableByAttribute: 'notBusy'`).
const listItemValue = computed(() => ({
  ...props.message,
  isAi: props.isAi,
  isMe: props.isMe,
  notBusy: !chatDisabled.value,
}));

const isInvalid = computed(() => Boolean(props.message.invalid));
const invalidationMessage = computed(() => props.message.invalidationMessage || props.texts.error);

// A schema renders as a form via the injected builder (ignored when absent); otherwise text renders as markdown.
const builder = computed(() => clarifyingQuestionsBuilderGetter?.() || null);
const showForm = computed(() => Boolean(props.message.schema) && Boolean(builder.value));

const formModel = ref({});
const formBuilderRef = ref(null);

const formActions = computed(() => [
  {
    id: 'submit',
    name: props.texts.answerSubmit,
    icon: 'submit',
    kind: 'primary',
    disabled: chatDisabled.value,
  },
]);

function submitForm() {
  const errors = formBuilderRef.value?.validateModel?.();
  if (Array.isArray(errors) && errors.length > 0) {
    return;
  }
  submitClarifyingQuestions?.(props.message, formModel.value);
}

function onFormAction(actionName) {
  if (actionName === 'submit') {
    submitForm();
  }
}

function onAction(actionId) {
  messageActionClick?.(actionId, props.message);
}

const listItemRef = ref(null);
const personDisplayRef = ref(null);
function focus(options) {
  if (showFullPerson.value) {
    personDisplayRef.value?.focus(options);
    return;
  }
  listItemRef.value?.focus(options);
}
defineExpose({ focus });
</script>

<template>
  <div class="lx-chat-bubble-wrapper">
    <div v-if="showFullPerson" class="lx-chat-bubble-header">
      <LxPersonDisplay
        ref="personDisplayRef"
        size="l"
        :value="personValue"
        :description="timeText"
        :custom-attributes="personCustomAttributes"
      />
      <LxBadge v-if="isAi" icon="ai" :tooltip="texts.ai" />
    </div>

    <div v-else-if="showTimeLabel" class="lx-chat-bubble-time">{{ timeLabelText }}</div>

    <div class="lx-chat-bubble-content">
      <LxListItem
        ref="listItemRef"
        class="lx-chat-bubble"
        :id="`${id}-item`"
        :label="message.text || ''"
        :value="listItemValue"
        :category="isMe ? null : category"
        :invalid="isInvalid"
        :actionDefinitions="messageActions"
        @action-click="onAction"
      >
        <template #customItem>
          <template v-if="showForm">
            <LxRichTextDisplay
              v-if="message.text"
              class="lx-chat-form-prompt"
              :value="message.text"
            />
            <LxForm
              :column-count="1"
              kind="compact"
              :show-header="false"
              :sticky-footer="false"
              :action-definitions="formActions"
              @actionClick="onFormAction"
            >
              <component
                :is="builder"
                ref="formBuilderRef"
                v-model="formModel"
                :schema="message.schema"
              />
            </LxForm>
          </template>
          <LxRichTextDisplay v-else :value="message.text || ''" />
        </template>
      </LxListItem>
    </div>

    <div v-if="isInvalid" :id="`${id}-error`" class="lx-chat-invalid-message" role="alert">
      {{ invalidationMessage }}
    </div>
  </div>
</template>
