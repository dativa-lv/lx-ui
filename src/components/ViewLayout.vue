<script setup>
import { computed, getCurrentInstance, onUnmounted } from 'vue';
import LxActionButton from '@/components/ActionButton.vue';
import { generateUUID } from '@/utils/stringUtils';
import {
  flattenNestedActions,
  limitPrimaryActions,
  resolveActionGroups,
} from '@/utils/actionDefinitionsUtils';
import { registerBuilderInstance, unregisterBuilderInstance } from '@/utils/builderUtils';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  kind: { type: String, default: 'default', group: 'main', options: ['default', 'form', 'list'] }, // default | form | list
  layout: { type: String, default: 'default' }, // default
  actionGroupDefinitions: { type: Array, default: null },
  actionDefinitions: { type: Array, default: () => [] },
  customClass: { type: String, default: '' },
  builderOptions: {
    type: Object,
    default: () => ({
      schemaPath: null,
      componentStack: [],
      useRegistry: false,
    }),
  },
});

const emits = defineEmits(['actionClick']);

const actionDefinitionsResolved = computed(() =>
  limitPrimaryActions(
    flattenNestedActions(
      resolveActionGroups(props.actionDefinitions, props.actionGroupDefinitions),
      { inheritKind: true }
    )
  )
);

if (props.builderOptions?.useRegistry) {
  const instance = getCurrentInstance();
  registerBuilderInstance({
    name: 'LxViewLayout',
    instance,
    props,
    builderName: props.builderOptions?.schemaPath,
    componentStack: props.builderOptions?.componentStack?.concat([
      { id: props?.id, name: 'LxViewLayout' },
    ]),
  });

  onUnmounted(() => {
    unregisterBuilderInstance(props?.id);
  });
}
</script>
<template>
  <div class="lx-view-layout" :class="[{ customClass }]" :data-id="id">
    <div class="header-container" v-if="actionDefinitionsResolved?.length > 0">
      <LxActionButton
        v-for="action in actionDefinitionsResolved"
        :key="action?.id"
        :action="action"
        :id="action?.id"
        :variant="action?.variant || 'icon-only'"
        :kind="action?.kind || 'ghost'"
        @click="emits('actionClick', action?.id)"
      />
    </div>
    <div v-if="kind !== 'form' && $slots?.filters" class="filters-container">
      <slot name="filters" />
    </div>
    <div v-if="$slots?.default" class="default-container"><slot /></div>
    <div v-if="$slots?.aside" class="aside-container"><slot name="aside" /></div>
    <div v-if="$slots?.footer" class="footer-container"><slot name="footer" /></div>
  </div>
</template>
