<script setup>
import { shallowRef, computed, watch } from 'vue';
import { lxDefineAsyncComponent, importWithRetry } from '@/utils/dynamicImportUtils';
import IconDefault from '@/components/icons/Default.vue';

const props = defineProps({
  value: { type: String, default: 'default' },
  class: { type: String, default: 'lx-illustration' },
  animation: { type: String, default: 'default' }, // 'default', 'spin'
});

const iconPath = shallowRef(null);

const icon = computed(() => {
  // Separate icon name by '-' if any
  const parts = props.value?.split('-');

  let ret = '';
  parts?.forEach((part) => {
    // Make first letter of each part uppercase and concat them to match icon file name
    ret += `${part.charAt(0).toUpperCase()}${part.slice(1)}`;
  });

  return ret;
});

function loadIcon() {
  const name = icon.value;
  if (name) {
    iconPath.value = lxDefineAsyncComponent({
      loader: importWithRetry(
        () => import(`@/components/pictograms/${name}.vue`),
        `pictograms/${name}`
      ),
      errorComponent: IconDefault,
    });
  }
}

watch(
  icon,
  () => {
    loadIcon();
  },
  { immediate: true }
);
</script>
<template>
  <div :class="props.class">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      style="enable-background: new 0 0 32 32"
      x="0px"
      y="0px"
      focusable="false"
    >
      <Transition :name="`illustration-${animation}`">
        <icon-path />
      </Transition>
    </svg>
  </div>
</template>
