<script setup>
import { computed, watch } from 'vue';
import LxLoader from '@/components/Loader.vue';

import { generateUUID } from '@/utils/stringUtils';
import { getDisplayTexts } from '@/utils/generalUtils';
import { useLoadingAnnouncer } from '@/hooks/useLoadingAnnouncer';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  loading: { type: Boolean, default: false },
  size: { type: String, default: 'l' }, // 's' (small) or 'l' (large)
  variant: { type: String, default: 'default' }, // 'default' or 'bar'
  modelValue: { type: [Number, String], default: 0 },
  kind: { type: String, default: 'indeterminate' }, // 'indeterminate' or 'progress'
  label: { type: String, default: 'Notiek ielāde' }, // visible label under the loader
  labelDone: { type: String, default: 'Ielāde ir pabeigta' }, // TODO: replace with texts.loadingEnd
  description: { type: String, default: '' },
  fakedDuration: { type: Number, default: 2000 },
  faked: { type: Boolean, default: false },
  state: { type: String, default: 'default' },
  texts: { type: Object, default: () => ({}) },
});

// The announced texts fall back to the existing `label` / `labelDone` props, so
// nothing changes for consumers that only set those. An explicitly passed
// `texts` entry wins, which is what a caller with an empty visible `label`
// needs in order to still announce a start message.
const textsDefault = computed(() => ({
  loadingStart: props.label || 'Notiek ielāde',
  loadingEnd: props.labelDone || 'Ielāde ir pabeigta',
}));

const displayTexts = computed(() =>
  getDisplayTexts(props.texts, textsDefault.value, 'LxLoaderView')
);

const emits = defineEmits(['update:modelValue']);

const model = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emits('update:modelValue', value);
  },
});

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

const { shouldAnnounceLoading, shouldAnnounceDone } = useLoadingAnnouncer(() => props.loading);
</script>

<template>
  <div class="lx-loader-view-wrapper" :id="props.id">
    <p class="lx-invisible" role="status" aria-live="polite" aria-atomic="true">
      <template v-if="shouldAnnounceLoading">
        {{ displayTexts.loadingStart }}
        <template v-if="kind === 'progress'">- {{ Number(model) * 100 }}%</template>
      </template>
      <template v-else-if="shouldAnnounceDone">{{ displayTexts.loadingEnd }}</template>
    </p>

    <div v-if="props.loading" class="lx-loader-view-loader-wrapper" :aria-label="props.label">
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
      <slot />
    </div>
  </div>
</template>
