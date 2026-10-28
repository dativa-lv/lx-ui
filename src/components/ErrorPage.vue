<script setup>
import { computed } from 'vue';
import { getDisplayTexts } from '@/utils/generalUtils';
import { generateUUID } from '@/utils/stringUtils';
import {
  flattenNestedActions,
  limitPrimaryActions,
  resolveActionGroups,
} from '@/utils/actionDefinitionsUtils';
import LxIllustration from '@/components/Illustration.vue';
import LxActionButton from '@/components/ActionButton.vue';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  kind: { type: String, default: '400' },
  icon: { type: String, default: null },
  title: { type: String, default: null },
  description: { type: String, default: null },
  actionGroupDefinitions: { type: Array, default: null },
  actionDefinitions: { type: Array, default: () => [] },
  texts: { type: Object, default: () => ({}) },
});

const textsDefault = {
  defaultError400: {
    title: 'Notika negaidīta kļūda',
    description:
      'Šķiet, ka pieprasījums bija nepareizs. Lūdzu, pārbaudiet ievadīto informāciju un mēģiniet vēlreiz.',
  },
  defaultError401: {
    title: 'Lapa pieejama tikai autorizētiem lietotājiem',
    description: 'Pieeja liegta! Lai piekļūtu šai lapai, jāautorizējas.',
  },
  defaultError403: {
    title: 'Pietrūkst tiesību, lai piekļūtu šai lapai',
    description: 'Pieeja liegta! Lai piekļūtu šai lapai, nepieciešamas papildu tiesības.',
  },
  defaultError404: {
    title: 'Lapa nav atrasta',
    description:
      'Jūsu meklētā lapa nav atrasta. Lūdzu, pārbaudiet ievadīto informāciju un mēģiniet vēlreiz!',
  },
  defaultError500: {
    title: 'Notika negaidīta servera kļūda',
    description: 'Nedaudz uzgaidiet un mēģiniet vēlreiz!',
  },
  defaultErrorSessionTimeout: {
    title: 'Iestājies sesijas noilgums',
    description: 'Jūsu sesija ir beigusies. Lai turpinātu darbu, autorizējieties sistēmā vēlreiz!',
  },
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault, 'LxErrorPage'));

const pictogram = computed(() => {
  if (props.icon) {
    return props.icon;
  }
  switch (props.kind) {
    case '400':
      return 'error';
    case '401':
      return 'lock';
    case '403':
      return 'lock';
    case '404':
      return 'not-found';
    case '500':
      return 'error';
    case 'sessionTimeout':
      return 'timer';
    default:
      return 'error';
  }
});

const kindSanitized = computed(() => `${props.kind.charAt(0).toUpperCase()}${props.kind.slice(1)}`);

const emits = defineEmits(['actionClick']);

const BUTTON_KINDS = ['primary', 'secondary', 'tertiary'];

const actionDefinitionsResolved = computed(() =>
  limitPrimaryActions(
    flattenNestedActions(
      resolveActionGroups(props.actionDefinitions, props.actionGroupDefinitions),
      { inheritKind: true }
    )
  ).map((action) =>
    BUTTON_KINDS.includes(action?.kind) ? action : { ...action, kind: 'tertiary' }
  )
);

function handleActionClick(actionName) {
  emits('actionClick', actionName);
}

const titleText = computed(() => {
  if (props.title !== null) {
    return props.title;
  }
  const name = `defaultError${kindSanitized.value}`;
  return displayTexts.value[name]?.title;
});

const titleDescription = computed(() => {
  if (props.description !== null) {
    return props.description;
  }
  const name = `defaultError${kindSanitized.value}`;
  return displayTexts.value[name]?.description;
});
</script>
<template>
  <article :id="id" class="lx-error-landing">
    <div class="lx-header lx-error">
      <LxIllustration class="lx-illustration" :value="pictogram" />
      <div :id="`${id}-title`" class="heading-1">{{ titleText }}</div>
      <div :id="`${id}-description`" class="lx-description">
        <p>{{ titleDescription }}</p>
      </div>
    </div>
    <div class="lx-button-set">
      <slot name="toolbar"></slot>
      <div class="lx-error-action-definitions" v-if="actionDefinitionsResolved.length >= 1">
        <LxActionButton
          v-for="action in actionDefinitionsResolved"
          :key="action.id"
          :action="action"
          :id="`${id}-action-${action.id}`"
          variant="default"
          @click="handleActionClick(action.id)"
        />
      </div>
    </div>
  </article>
</template>
