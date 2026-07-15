<script setup>
import LxButton from '@/components/Button.vue';
import LxBreadcrumbs from '@/components/Breadcrumbs.vue';
import { computed } from 'vue';
import { getDisplayTexts } from '@/utils/generalUtils';

const emits = defineEmits(['goBack']);

const props = defineProps({
  label: {
    type: String,
    required: true,
    default: null,
  },
  description: {
    type: String,
    required: false,
    default: null,
  },
  showBackButton: {
    type: Boolean,
    required: false,
    default: false,
  },
  backLabel: {
    type: String,
    required: false,
    default: null,
  },
  backPath: {
    type: [Object, String],
    required: false,
    default: null,
  },
  breadcrumbs: {
    type: Array,
    required: false,
    default: () => [], // { to: '{ name: 'home'}', label: 'Home' }],
  },
  hideHeaderText: { type: Boolean, default: false },
  texts: { type: Object, default: () => {} },
});

const defaultTexts = {
  defaultBack: 'Atpakaļ',
  defaultBackTooltip: 'Atgriezties uz',
  breadcrumbsTooltip: 'Papildu sadaļas',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, defaultTexts, 'LxShell'));

const goBackLabel = computed(() => {
  if (props.breadcrumbs.length === 1) {
    return props.breadcrumbs[0]?.label;
  }
  return props.backLabel ? props.backLabel : displayTexts.value.defaultBack;
});
const goBackTitle = computed(() => {
  if (props.breadcrumbs.length === 1) {
    return `${displayTexts.value.defaultBackTooltip} "${props.breadcrumbs[0]?.label}"`;
  }
  return props.backLabel ? props.backLabel : displayTexts.value.defaultBack;
});

const goBackPath = computed(() => {
  if (props.breadcrumbs.length === 1) {
    return props.breadcrumbs[0]?.to;
  }
  return props.backPath ? props.backPath : -1;
});

function goBack() {
  if (goBackPath.value) {
    emits('goBack', goBackPath.value);
    return;
  }
  emits('goBack', -1);
}

const showBreadcrumbs = computed(() => props.breadcrumbs.length > 1 && props.showBackButton);

const breadcrumbsTexts = computed(() => ({ tooltip: displayTexts.value.breadcrumbsTooltip }));
</script>
<template>
  <header class="lx-header lx-page-header">
    <div class="lx-toolbar">
      <div class="lx-group lx-back-button-group">
        <transition name="fade">
          <div v-if="showBackButton">
            <LxButton
              id="lx-page-header-back-button"
              icon="back"
              kind="ghost"
              :variant="breadcrumbs.length > 1 ? 'icon-only' : 'default'"
              :label="goBackLabel"
              :title="goBackTitle"
              @click="goBack"
            />
          </div>
        </transition>
      </div>
      <div class="lx-group lx-breadcrumbs-group">
        <LxBreadcrumbs v-if="showBreadcrumbs" :items="breadcrumbs" :texts="breadcrumbsTexts" />
      </div>

      <div class="lx-group">
        <!-- TODO: additionalActions -->
      </div>
    </div>
    <h1 v-if="!hideHeaderText">{{ label }}</h1>
    <p class="lx-description" v-if="!hideHeaderText">{{ description }}</p>
  </header>
</template>
