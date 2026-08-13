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
import { sanitizeToPlainText } from '@/utils/formatUtils';
import useLx from '@/hooks/useLx';
import LxPersonDisplay from '@/components/PersonDisplay.vue';
import LxBadge from '@/components/Badge.vue';
import LxIcon from '@/components/Icon.vue';
import LxDropDownMenu from '@/components/DropDownMenu.vue';
import LxButton from '@/components/Button.vue';
import LxForm from '@/components/forms/Form.vue';
import LxRichTextDisplay from '@/components/RichTextDisplay.vue';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  message: { type: Object, required: true },
  isMe: { type: Boolean, default: false },
  isAi: { type: Boolean, default: false },
  category: { type: String, default: null },
  messageGrouping: { type: Boolean, default: true },
  showPersonHeader: { type: Boolean, default: false },
  showTimestamp: { type: Boolean, default: false },
  avatarKind: { type: String, default: null },
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
  id: props.message.userId,
  name: props.message.userName,
  fullTime: fullTimeText.value,
  description: props.message.description,
  role: props.message.role,
  institution: props.message.institution,
}));
const personCustomAttributes = computed(() => {
  const attributes = [{ name: props.texts.messageTimeLabel, attributeName: 'fullTime' }];
  if (props.message.description) {
    attributes.push({ name: props.texts.descriptionLabel, attributeName: 'description' });
  }
  if (props.message.role) {
    attributes.push({ name: props.texts.roleLabel, attributeName: 'role' });
  }
  if (props.message.institution) {
    attributes.push({ name: props.texts.institutionLabel, attributeName: 'institution' });
  }
  return attributes;
});

// Receivers show full header at cluster starts; current user shows it only in comments mode or large size.
const showFullPerson = computed(
  () =>
    (!props.isMe && !props.messageGrouping) ||
    (props.showPersonHeader && (!props.isMe || props.kind === 'comments' || props.size === 'l'))
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

const visibleMessageActions = computed(() => {
  const actions = (messageActions.value || [])
    .filter((action) =>
      action.visibleByAttribute ? listItemValue.value[action.visibleByAttribute] : true
    )
    .map((action) => ({
      ...action,
      disabled:
        action.disabled ||
        (action.enableByAttribute ? !listItemValue.value[action.enableByAttribute] : false),
    }));

  if (actions.length > 1) {
    actions.unshift({
      id: `${props.id}-action-open-menu`,
      label: props.texts.overflowMenu,
      icon: 'overflow-menu',
      kind: 'main',
      variant: 'icon-only',
    });
  }

  return actions;
});

const messageActionSingle = computed(() =>
  visibleMessageActions.value.length === 1 ? visibleMessageActions.value[0] : null
);

const bubbleCategoryClass = computed(() =>
  props.category ? `lx-category-${props.category}` : null
);

const isInvalid = computed(() => Boolean(props.message.invalid));
const invalidationMessage = computed(() => props.message.invalidationMessage || props.texts.error);
const plainMessageText = computed(() => sanitizeToPlainText(props.message.text ?? ''));

// A schema renders as a form via the injected builder (ignored when absent); otherwise text renders as markdown.
const builder = computed(() => clarifyingQuestionsBuilderGetter?.() || null);
const showForm = computed(() => Boolean(props.message.schema) && Boolean(builder.value));

const formModel = ref({});
const formBuilderRef = ref(null);

const formActions = computed(() => [
  {
    id: 'submit',
    name: props.texts.answerSubmit,
    icon: 'accept',
    kind: 'secondary',
    disabled: chatDisabled.value,
  },
]);

function sanitizeForm(value) {
  if (typeof value === 'string') {
    return sanitizeToPlainText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForm(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, sanitizeForm(nestedValue)])
    );
  }

  return value;
}

function submitForm() {
  const errors = formBuilderRef.value?.validateModel?.();
  if (Array.isArray(errors) && errors.length > 0) {
    return;
  }
  const sanitizedModel = sanitizeForm(formModel.value);
  submitClarifyingQuestions?.(props.message, sanitizedModel);
}

function onFormAction(actionName) {
  if (actionName === 'submit') {
    submitForm();
  }
}

function onActionClick(actionId) {
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
        :kind="avatarKind"
        :value="personValue"
        :description="timeText"
        :customAttributes="personCustomAttributes"
        :icon="message.avatarIcon"
        :iconSet="message.avatarIconSet"
      />
      <LxBadge v-if="isAi" icon="ai" :tooltip="texts.ai" />
    </div>

    <div v-else-if="showTimeLabel" class="lx-chat-bubble-time">{{ timeLabelText }}</div>

    <div class="lx-chat-bubble-content">
      <div class="lx-chat-bubble lx-list-item-wrapper" :id="`${id}-item`">
        <div
          ref="listItemRef"
          class="lx-list-item"
          :class="[bubbleCategoryClass, { 'lx-invalid': isInvalid }]"
          tabindex="-1"
          :aria-invalid="isInvalid"
        >
          <div class="lx-category-displayer" />
          <header>
            <template v-if="showForm">
              <LxRichTextDisplay
                v-if="message.text"
                class="lx-chat-form-prompt"
                :value="plainMessageText"
              />
              <LxForm
                :column-count="1"
                kind="compact"
                :showHeader="false"
                :stickyFooter="false"
                :actionDefinitions="formActions"
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
            <LxRichTextDisplay v-else :value="plainMessageText" />
          </header>

          <div v-if="isInvalid" class="lx-invalidation-icon-wrapper">
            <LxIcon value="invalid" customClass="lx-invalidation-icon" />
          </div>
        </div>

        <div v-if="messageActionSingle" class="lx-list-item-actions" @click.stop>
          <LxButton
            :id="`${id}-item-action-${messageActionSingle.id}`"
            :label="messageActionSingle.name || messageActionSingle.label"
            :title="messageActionSingle.title || messageActionSingle.tooltip"
            :icon="messageActionSingle.icon"
            :iconSet="messageActionSingle.iconSet"
            :loading="messageActionSingle.loading"
            :busy="messageActionSingle.busy"
            :destructive="messageActionSingle.destructive"
            :disabled="messageActionSingle.disabled"
            :active="messageActionSingle.active"
            :badge="messageActionSingle.badge"
            :badgeType="messageActionSingle.badgeType"
            :badgeIcon="messageActionSingle.badgeIcon"
            :badgeTitle="messageActionSingle.badgeTitle"
            :href="messageActionSingle.href"
            kind="ghost"
            variant="icon-only"
            @click.prevent.stop="onActionClick(messageActionSingle.id)"
          />
        </div>

        <div v-else-if="visibleMessageActions.length > 1" class="lx-list-item-actions" @click.stop>
          <LxDropDownMenu
            :actionDefinitions="visibleMessageActions"
            @actionClick="(actionId) => onActionClick(actionId)"
          />
        </div>
      </div>
    </div>

    <div v-if="isInvalid" :id="`${id}-error`" class="lx-chat-invalid-message" role="alert">
      {{ invalidationMessage }}
    </div>
  </div>
</template>
