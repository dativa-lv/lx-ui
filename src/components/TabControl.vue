<script setup lang="ts">
import { onMounted, ref, computed, nextTick, watch } from 'vue';
import LxIcon from '@/components/Icon.vue';
import LxButton from '@/components/Button.vue';
import LxDropDown from '@/components/Dropdown.vue';
import { useElementBounding, useElementSize } from '@vueuse/core';
import { getDisplayTexts } from '@/utils/generalUtils';
import { generateUUID } from '@/utils/stringUtils';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  modelValue: { type: String, default: '' },
  items: { type: Array, default: () => [] },
  level: { type: Number, default: 1 },
  kind: { type: String, default: 'default' }, // 'default', 'icon-only', 'combo'
  texts: { type: Object, default: () => ({}) },
});

const textsDefault = {
  previous: 'Iepriekšējais solis',
  next: 'Nākamais solis',
  tabSelected: 'Tika izvēlēta cilne',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));

const emits = defineEmits(['update:modelValue']);

const itemRefs = ref([]);
const tabHeader = ref();
const tabControl = ref();
const highlightedTabId = ref(null);
const announcementMessage = ref('');

const bounding = useElementBounding(tabControl);
const headerSize = useElementSize(tabHeader);

const model = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emits('update:modelValue', value);
  },
});

const activeItemName = computed(() => {
  const selectedItem = props.items.find((item) => item?.id === model.value);
  return selectedItem?.name ?? '';
});

function setAnnouncementMessage() {
  if (announcementMessage.value) announcementMessage.value = '';
  nextTick(() => {
    announcementMessage.value = `${displayTexts.value.tabSelected} "${activeItemName.value}"`;
  });
}

function setActiveTab(itemCode) {
  highlightedTabId.value = itemCode;
  model.value = itemCode;
  itemRefs.value
    .find((o) => o.id === `${props.id}-tab-${itemCode}`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function setNextTab() {
  const nextActiveTabId = props.items[props.items.findIndex((o) => o.id === model.value) + 1]?.id;
  highlightedTabId.value = nextActiveTabId;
  model.value = nextActiveTabId;
  setAnnouncementMessage();
}

function setPreviousTab() {
  const prevActiveTabId = props.items[props.items.findIndex((o) => o.id === model.value) - 1]?.id;
  highlightedTabId.value = prevActiveTabId;
  model.value = prevActiveTabId;
  setAnnouncementMessage();
}

function focusPreviousTab() {
  const index = props.items.findIndex((obj) => obj.id === highlightedTabId.value);
  if (index > 0) {
    highlightedTabId.value = props.items[index - 1].id;
  } else {
    highlightedTabId.value = props.items[props.items.length - 1].id;
  }
  document.getElementById(`${props.id}-tab-${highlightedTabId.value}`).focus();
}

function focusNextTab() {
  const index = props.items.findIndex((o) => o.id === highlightedTabId.value);
  if (index < props.items.length - 1) {
    highlightedTabId.value = props.items[index + 1].id;
  } else {
    highlightedTabId.value = props.items[0].id;
  }
  document.getElementById(`${props.id}-tab-${highlightedTabId.value}`).focus();
}

function calculateOffset(el) {
  const navRems = getComputedStyle(el).getPropertyValue('--nav-row-size').trim();
  const { fontSize } = getComputedStyle(el);
  return parseInt(navRems, 10) * parseFloat(fontSize);
}

const topOutOfBounds = computed(() => {
  const keyOpacity = '--tab-control-shadow-opacity';
  const keySize = '--tab-control-header-size';
  const limit = 100;
  const size = headerSize.height?.value;

  if (!tabControl.value || !tabHeader.value)
    return `${keyOpacity}: 0; ${keySize}: var(--row-size);`;

  const v = bounding.top ? bounding.top.value - calculateOffset(tabControl.value) : 0;
  if (v < 0 - limit) {
    return `${keyOpacity}: 1; ${keySize}: ${size}px;`;
  }
  if (v < 0) {
    return `${keyOpacity}: ${(0 - v) / limit}; ${keySize}: ${size}px;`;
  }
  return `${keyOpacity}: 0; ${keySize}: ${size}px;`;
});

watch(
  () => props.modelValue,
  (newVal, oldVal) => {
    if (oldVal && newVal !== highlightedTabId.value) {
      highlightedTabId.value = newVal;
      setAnnouncementMessage();
    }
  }
);

onMounted(() => {
  if (!model.value && props.items && props.items.length > 0) {
    model.value = props.items[0].id;
  }
  highlightedTabId.value = model.value;
});
</script>
<template>
  <div class="lx-tab-control" :style="`${topOutOfBounds}`" ref="tabControl">
    <header
      ref="tabHeader"
      class="lx-toolbar"
      :class="[
        { 'lx-sticky': level === 1 },
        { 'lx-sticky-2': level > 1 },
        { 'tab-control-default': kind === 'default' },
      ]"
    >
      <div class="lx-tab-container">
        <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
        <div
          v-for="t in props.items"
          :id="`${id}-tab-${t.id}`"
          :key="t.id"
          ref="itemRefs"
          class="lx-tab"
          :class="[{ 'lx-selected': t.id === model }, { 'lx-invalid': t.invalid }]"
          :title="t.invalid ? t.invalidationMessage : ''"
          :tabindex="t.id === model ? '0' : '-1'"
          role="tab"
          :aria-selected="t.id === model"
          @click="setActiveTab(t.id)"
          @keyup.enter="setActiveTab(t.id)"
          @keyup.space="setActiveTab(t.id)"
          @keydown.left.prevent="focusPreviousTab"
          @keydown.right.prevent="focusNextTab"
          @keydown.space.prevent
        >
          <p class="lx-primary" v-if="kind !== 'icon-only'">{{ t.name }}</p>
          <LxIcon :value="t.icon" customClass="item-icon" v-if="kind !== 'default' && !t.invalid" />
          <LxIcon
            value="invalid"
            customClass="invalid"
            v-show="!(kind !== 'default' && !t.invalid)"
          />
        </div>
      </div>

      <div class="lx-group">
        <LxButton
          icon="previous-page"
          kind="ghost"
          :label="displayTexts.previous"
          variant="icon-only"
          :disabled="items[0].id === model"
          @click="setPreviousTab"
        />

        <LxButton
          icon="next-page"
          kind="ghost"
          :label="displayTexts.next"
          variant="icon-only"
          :disabled="items[items.length - 1].id === model"
          @click="setNextTab"
        />
      </div>

      <div class="lx-dropdown-container">
        <LxDropDown :items="props.items" :modelValue="model" @update:modelValue="setActiveTab" />
      </div>
    </header>

    <article class="lx-tab-body">
      <transition name="nav">
        <slot name="body" />
      </transition>
    </article>

    <div aria-live="polite" class="lx-invisible">
      {{ announcementMessage }}
    </div>
  </div>
</template>
