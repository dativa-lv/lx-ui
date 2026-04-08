<script setup>
import { computed, ref, watch, nextTick } from 'vue';
import LxButton from '@/components/Button.vue';
import LxEmptyState from '@/components/EmptyState.vue';
import LxListItem from '@/components/list/ListItem.vue';
import { useWindowSize, useElementSize } from '@vueuse/core';
import { generateUUID } from '@/utils/stringUtils';
import { getDisplayTexts } from '@/utils/generalUtils';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  modelValue: { type: String, default: null },
  items: { type: Array, default: () => [] },
  readOnly: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  idAttribute: { type: String, default: 'id' },
  nameAttribute: { type: String, default: 'name' },
  descriptionAttribute: { type: String, default: null },
  categoryAttribute: { type: String, default: 'category' },
  invalidAttribute: { type: String, default: 'invalid' },
  texts: { type: Object, default: () => ({}) },
});

const textsDefault = {
  add: 'Pievienot ierakstu',
  noData: 'Nav datu',
  noDataDescription: 'Izvēlieties ierakstu, lai apskatītu datus',
  back: 'Atgriezties atpakaļ',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));

const emits = defineEmits(['update:modelValue', 'newItemAdded']);

const navRef = ref();
const detailRef = ref();
const backButtonRef = ref(null);
const lastSelectedId = ref(null);
const itemRefs = ref({});
const isNavBigger = ref(false);

function setItemRef(el, id) {
  if (el) itemRefs.value[id] = el;
  else delete itemRefs.value[id];
}

const navSize = useElementSize(navRef);
const detailSize = useElementSize(detailRef);
const windowSize = useWindowSize();

const windowWidth = computed(() => windowSize.width.value);

const model = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emits('update:modelValue', value);
  },
});

async function selectItem(id) {
  lastSelectedId.value = id;
  model.value = id;
  if (windowWidth.value < 1200) {
    await nextTick();
    backButtonRef.value?.focus();
  }
}

async function goBack() {
  const prevId = lastSelectedId.value;
  model.value = null;
  if (windowWidth.value < 1200) {
    await nextTick();
    itemRefs.value[prevId]?.focus();
  }
}

function addItem() {
  emits('newItemAdded');
}

watch([navSize.height, detailSize.height], ([navHeight, detailHeight]) => {
  if (navHeight > 0 && detailHeight > 0) {
    requestAnimationFrame(() => {
      isNavBigger.value = navHeight > detailHeight;
    });
  }
});
</script>
<template>
  <div class="lx-master-detail" :class="[{ 'nav-border': isNavBigger }]">
    <Transition :name="windowWidth < 1200 ? 'master-detail-slide-right' : ''">
      <nav class="lx-master" v-if="windowWidth >= 1200 || !model" ref="navRef">
        <LxButton
          v-if="!readOnly"
          :id="`${id}-action-add-item`"
          customClass="lx-master-detail-button"
          icon="add-item"
          kind="tertiary"
          :label="displayTexts.add"
          :disabled="busy"
          @click="addItem"
        />

        <ul class="lx-master-detail-list">
          <li v-for="item in items" :key="item?.[idAttribute]">
            <LxListItem
              :ref="(el) => setItemRef(el, item?.[idAttribute])"
              :id="item?.[idAttribute]"
              :label="item?.[nameAttribute]"
              :description="item?.[descriptionAttribute]"
              :category="item[categoryAttribute]"
              :invalid="item?.[invalidAttribute]"
              :tooltip="item?.[nameAttribute]"
              :selected="model === item?.[idAttribute]"
              icon="next"
              :clickable="true"
              :active="model === item?.[idAttribute]"
              :disabled="busy"
              @click="selectItem(item?.[idAttribute])"
            />
          </li>
        </ul>
      </nav>
    </Transition>

    <LxButton
      v-if="windowWidth < 1200 && model"
      ref="backButtonRef"
      :id="`${id}-action-back`"
      icon="back"
      variant="icon-only"
      :label="displayTexts.back"
      kind="ghost"
      :disabled="busy"
      @click="goBack()"
    />

    <Transition :name="windowWidth < 1200 ? 'master-detail-slide-left' : ''">
      <div class="lx-detail" v-if="windowWidth >= 1200 || model" ref="detailRef">
        <LxEmptyState
          v-if="!model"
          :label="displayTexts.noData"
          :description="displayTexts.noDataDescription"
        />
        <slot v-else />
      </div>
    </Transition>
  </div>
</template>
