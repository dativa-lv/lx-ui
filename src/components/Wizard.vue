<script setup>
import { ref, computed } from 'vue';
import LxSteps from '@/components/Steps.vue';
import { useElementBounding, useElementSize } from '@vueuse/core';
import { generateUUID } from '@/utils/stringUtils';
import { getStickyTopOffset, shadowOpacity } from '@/utils/shadowUtils';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  modelValue: { type: String, default: null },
  items: { type: Array, default: () => [] },
});

const emits = defineEmits(['update:modelValue']);

const model = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emits('update:modelValue', value);
  },
});

const wizardHeader = ref();
const wizard = ref();
const bounding = useElementBounding(wizard);
const headerSize = useElementSize(wizardHeader);

const wizardHeaderSize = computed(() => {
  const header = wizardHeader.value;
  const measuredHeight = headerSize.height.value ?? 0;
  if (!header) return measuredHeight;

  const dividerWidth = getComputedStyle(header, '::before').borderBottomWidth;
  return measuredHeight + Number.parseFloat(dividerWidth || '0');
});

const topOutOfBounds = computed(() => {
  if (!wizard.value || !wizardHeader.value)
    return `--wizard-shadow-opacity: 0; --wizard-header-size: var(--row-size);`;
  const v = bounding.top ? bounding.top.value - getStickyTopOffset(wizardHeader.value) : 0;
  return `--wizard-shadow-opacity: ${shadowOpacity(-v)}; --wizard-header-size: ${
    wizardHeaderSize.value
  }px;`;
});

const modifiedItems = computed(() =>
  props.items.map((item) => ({
    ...item,
    state: item.invalid ? 'invalid' : item.state,
  }))
);
</script>
<template>
  <div :id="id" class="lx-wizard lx-tab-wizard" :style="`${topOutOfBounds}`" ref="wizard">
    <header ref="wizardHeader" class="lx-tab-wizard-toolbar lx-shadow-bottom">
      <div class="lx-wizard-container lx-tab-wizard-container">
        <LxSteps :id="`${id}-steps`" v-model="model" :items="modifiedItems" kind="compact" />
      </div>
    </header>

    <article class="lx-wizard-body lx-tab-wizard-body">
      <transition name="nav">
        <slot name="body" />
      </transition>
    </article>
  </div>
</template>
