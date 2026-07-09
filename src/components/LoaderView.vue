<script setup>
import { computed, onUnmounted, ref, watch } from 'vue';
import LxLoader from '@/components/Loader.vue';

import { generateUUID } from '@/utils/stringUtils';
import { LOADER_VIEW_CONSTANTS } from '@/constants';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  loading: { type: Boolean, default: false },
  size: { type: String, default: 'l' }, // 's' (small) or 'l' (large)
  variant: { type: String, default: 'default' }, // 'default' or 'bar'
  modelValue: { type: [Number, String], default: 0 },
  kind: { type: String, default: 'indeterminate' }, // 'indeterminate' or 'progress'
  label: { type: String, default: 'Notiek ielāde' },
  labelDone: { type: String, default: 'Ielāde ir pabeigta' },
  description: { type: String, default: '' },
  fakedDuration: { type: Number, default: 2000 },
  faked: { type: Boolean, default: false },
  state: { type: String, default: 'default' },
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

const shouldAnnounceLoading = ref(false);
const shouldAnnounceDone = ref(false);
const hasShownLoading = ref(false);
const canAnnounceDone = ref(false);
const pendingDoneAnnouncement = ref(false);
let loadingDelayTimer = null;
let minDoneDelayTimer = null;
let hasUsedInitialMountedLoadingThreshold = false;

const mountedWithLoading = props.loading;

watch(
  () => model.value,
  (newVal) => {
    if (Number(newVal) > 1) {
      model.value = 1;
    }
    if (Number(newVal) < 0) {
      model.value = 0;
    }
  }
);

watch(
  () => props.loading,
  (isLoading) => {
    if (loadingDelayTimer) {
      clearTimeout(loadingDelayTimer);
      loadingDelayTimer = null;
    }

    if (isLoading) {
      if (minDoneDelayTimer) {
        clearTimeout(minDoneDelayTimer);
        minDoneDelayTimer = null;
      }

      shouldAnnounceDone.value = false;
      shouldAnnounceLoading.value = false;
      hasShownLoading.value = false;
      canAnnounceDone.value = false;
      pendingDoneAnnouncement.value = false;

      const loadingAnnounceDelay =
        mountedWithLoading && !hasUsedInitialMountedLoadingThreshold
          ? LOADER_VIEW_CONSTANTS.INITIAL_MOUNTED_LOADING_DELAY
          : LOADER_VIEW_CONSTANTS.DEFAULT_LOADING_DELAY;

      if (mountedWithLoading && !hasUsedInitialMountedLoadingThreshold) {
        hasUsedInitialMountedLoadingThreshold = true;
      }

      loadingDelayTimer = setTimeout(() => {
        if (props.loading) {
          shouldAnnounceLoading.value = true;
          hasShownLoading.value = true;
          canAnnounceDone.value = false;

          minDoneDelayTimer = setTimeout(() => {
            canAnnounceDone.value = true;
            if (pendingDoneAnnouncement.value && !props.loading) {
              shouldAnnounceDone.value = true;
              hasShownLoading.value = false;
              pendingDoneAnnouncement.value = false;
            }
          }, LOADER_VIEW_CONSTANTS.MIN_BETWEEN_LOADING_DELAY);
        }
      }, loadingAnnounceDelay);
      return;
    }

    shouldAnnounceLoading.value = false;
    if (hasShownLoading.value) {
      if (canAnnounceDone.value) {
        shouldAnnounceDone.value = true;
        hasShownLoading.value = false;
        pendingDoneAnnouncement.value = false;
      } else {
        shouldAnnounceDone.value = false;
        pendingDoneAnnouncement.value = true;
      }
    } else {
      shouldAnnounceDone.value = false;
      pendingDoneAnnouncement.value = false;
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  if (loadingDelayTimer) {
    clearTimeout(loadingDelayTimer);
  }
  if (minDoneDelayTimer) {
    clearTimeout(minDoneDelayTimer);
  }
});
</script>

<template>
  <div class="lx-loader-view-wrapper" :id="props.id">
    <div v-if="props.loading" class="lx-loader-view-loader-wrapper" :aria-label="props.label">
      <div v-if="shouldAnnounceLoading" aria-live="polite" role="status" class="lx-invisible">
        {{ props.label }} <span v-if="kind === 'progress'">- {{ Number(model) * 100 }}%</span>
      </div>
      <LxLoader
        :modelValue="model"
        :loading="props.loading"
        :size="props.size"
        :variant="props.variant"
        :kind="props.kind"
        :label="props.label"
        :description="props.description"
        :faked-duration="props.fakedDuration"
        :faked="props.faked"
        :state="props.state"
        :aria-hidden="!props.loading"
      />
    </div>
    <div v-show="!props.loading" class="lx-loader-view-content-wrapper">
      <div v-if="shouldAnnounceDone" aria-live="polite" role="status" class="lx-invisible">
        {{ props.labelDone }}
      </div>
      <slot />
    </div>
  </div>
</template>
