<script setup>
import { computed } from 'vue';
import { generateUUID } from '@/utils/stringUtils';
import LxButton from '@/components/Button.vue';
import LxActionButton from '@/components/ActionButton.vue';
import LxDropDownMenu from '@/components/DropDownMenu.vue';
import { getDisplayTexts } from '@/utils/generalUtils';
import { flattenNestedActions, resolveActionGroups } from '@/utils/actionDefinitionsUtils';

const props = defineProps({
  id: {
    type: String,
    default: () => generateUUID(),
  },
  label: {
    type: String,
    default: '',
  },
  width: {
    type: String,
    default: 's',
  },
  height: {
    type: String,
    default: 's',
  },
  showHeader: {
    type: Boolean,
    default: true,
  },
  showFooter: {
    type: Boolean,
    default: false,
  },
  href: {
    type: Object,
    default: null,
  },
  actionGroupDefinitions: { type: Array, default: null },
  actionDefinitions: { type: Array, default: () => [] },
  kind: {
    type: String,
    default: 'default', // default, fancy
  },
  coverImage: {
    type: String,
    default: '',
  },
  texts: { type: Object, default: () => ({}) },
});

const textsDefault = { overflowMenu: 'Atvērt papildu iespējas' };
const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault, 'LxWidget'));

const emits = defineEmits(['actionClick']);

const actionDefinitionsResolved = computed(() =>
  flattenNestedActions(resolveActionGroups(props.actionDefinitions, props.actionGroupDefinitions))
);

const size = computed(() => `lx-widget-${props.width}-${props.height}`);

function handleActionClick(id) {
  emits('actionClick', id);
}
</script>
<template>
  <div
    :id="id"
    class="lx-widget"
    :class="[size, { 'fancy-background': kind === 'fancy' }]"
    :style="{ backgroundImage: kind === 'fancy' ? `url(${coverImage})` : 'none' }"
    v-if="!href"
  >
    <header v-if="showHeader">
      <p>{{ label }}</p>
      <div
        class="lx-widget-toolbar-button"
        v-if="actionDefinitionsResolved && actionDefinitionsResolved?.length === 1"
      >
        <LxActionButton
          :action="actionDefinitionsResolved?.[0]"
          :id="`${id}-action-${actionDefinitionsResolved?.[0]?.id}`"
          kind="ghost"
          variant="icon-only"
          @click="handleActionClick(actionDefinitionsResolved?.[0]?.id)"
        />
      </div>
      <LxDropDownMenu
        v-if="actionDefinitionsResolved && actionDefinitionsResolved?.length > 1"
        :actionDefinitions="actionDefinitionsResolved"
        :actionGroupDefinitions="actionGroupDefinitions"
        @actionClick="(id) => handleActionClick(id)"
      >
        <div class="lx-widget-toolbar-button">
          <LxButton
            :id="`${id}-overflow-button`"
            icon="overflow-menu"
            kind="ghost"
            :label="displayTexts.overflowMenu"
            variant="icon-only"
            tabindex="-1"
          />
        </div>
      </LxDropDownMenu>
    </header>
    <article class="lx-main">
      <slot />
    </article>
    <footer v-if="showFooter" />
  </div>
  <router-link
    :id="id"
    :to="href"
    class="lx-widget lx-widget-router"
    :class="size"
    v-else
    :style="{ backgroundImage: kind === 'fancy' ? `url(${coverImage})` : 'none' }"
  >
    <header v-if="showHeader">{{ label }}</header>
    <article class="lx-main">
      <slot />
    </article>
    <footer v-if="showFooter" />
  </router-link>
</template>
