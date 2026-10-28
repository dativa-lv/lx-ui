<script setup>
import { computed } from 'vue';
import { getDisplayTexts } from '@/utils/generalUtils';
import { generateUUID } from '@/utils/stringUtils';
import { flattenNestedActions, resolveActionGroups } from '@/utils/actionDefinitionsUtils';
import LxIcon from '@/components/Icon.vue';
import LxButton from '@/components/Button.vue';
import LxActionButton from '@/components/ActionButton.vue';
import LxDropDownMenu from '@/components/DropDownMenu.vue';

const emits = defineEmits(['actionClick']);

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  label: { type: String, default: '' },
  description: { type: String, default: '' },
  icon: { type: String, default: '' },
  actionGroupDefinitions: { type: Array, default: null },
  actionDefinitions: { type: Array, default: null },
  texts: { type: Object, default: () => ({}) },
  announce: { type: Boolean, default: true },
});

const actionDefinitionsResolved = computed(() =>
  flattenNestedActions(resolveActionGroups(props.actionDefinitions, props.actionGroupDefinitions))
);

const textsDefault = {
  overflowMenu: 'Atvērt papildu iespējas',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault, 'LxEmptyState'));

function handleActionClick(actionName) {
  emits('actionClick', actionName);
}
</script>

<template>
  <div :id="id" class="lx-empty-state-wrapper">
    <div class="lx-empty-state-data">
      <LxIcon v-if="icon" :value="icon" />
      <p class="lx-primary">{{ label }}</p>
      <p v-if="description" class="lx-secondary">{{ description }}</p>
      <div
        class="lx-empty-state-buttons"
        v-if="actionDefinitionsResolved?.length && actionDefinitionsResolved?.length <= 3"
      >
        <LxActionButton
          v-for="action in actionDefinitionsResolved"
          :key="action?.id"
          :action="action"
          :omit="['variant']"
          :id="action?.id"
          kind="tertiary"
          @click="handleActionClick(action?.id)"
        />
      </div>
      <div v-if="actionDefinitionsResolved?.length && actionDefinitionsResolved?.length > 3">
        <LxDropDownMenu
          :actionDefinitions="actionDefinitionsResolved"
          :actionGroupDefinitions="actionGroupDefinitions"
          @actionClick="(id) => handleActionClick(id)"
        >
          <LxButton
            :id="`${id}-overflow-button`"
            icon="overflow-menu"
            kind="tertiary"
            :label="displayTexts.overflowMenu"
            variant="icon-only"
            tabindex="-1"
          />
        </LxDropDownMenu>
      </div>
    </div>
    <div v-if="announce" aria-live="polite" role="status" class="lx-invisible">
      {{ label }}
    </div>
  </div>
</template>
