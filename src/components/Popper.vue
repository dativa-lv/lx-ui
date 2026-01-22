<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue';
import { useFloating, flip, shift, arrow, offset, autoUpdate } from '@floating-ui/vue';
import { generateUUID } from '@/utils/stringUtils';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  placement: { type: String, default: 'bottom' },
  offsetDistance: { type: String, default: '12' },
  offsetSkid: { type: String, default: '0' },
  disabled: { type: Boolean, default: false },
  arrowPointer: { type: Boolean, default: false },
  panelClass: { type: String, default: '' },
  arrowPadding: { type: String, default: '5' },
  content: { default: null },
  show: { type: Boolean, default: null },
  locked: { type: Boolean, default: false },
  clientPosition: { type: Object, default: null },
  fullScreenPanel: { type: Boolean, default: false },
});

const emits = defineEmits(['update:placement', 'curtainTouched']);

const reference = ref(null);
const floating = ref(null);
const floatingArrow = ref(null);

const basePlacement = computed(() => {
  switch (props.placement) {
    case 'auto':
      return 'bottom';
    case 'auto-start':
      return 'bottom-start';
    case 'auto-end':
      return 'bottom-end';
    default:
      return props.placement;
  }
});

const fallbackPlacements = computed(() => {
  switch (props.placement) {
    case 'auto':
      return ['top', 'right', 'left'];
    case 'auto-start':
      return ['top-start', 'right-start', 'left-start'];
    case 'auto-end':
      return ['top-end', 'right-end', 'left-end'];
    case 'top':
      return ['bottom'];
    case 'top-start':
      return ['bottom-start'];
    case 'top-end':
      return ['bottom-end'];
    case 'bottom':
      return ['top'];
    case 'bottom-start':
      return ['top-start'];
    case 'bottom-end':
      return ['top-end'];
    case 'right':
      return ['left'];
    case 'right-start':
      return ['left-start'];
    case 'right-end':
      return ['left-end'];
    case 'left':
      return ['right'];
    case 'left-start':
      return ['right-start'];
    case 'left-end':
      return ['right-end'];
    default:
      return [];
  }
});

const middleware = computed(() => {
  const middlewares = [
    flip({
      mainAxis: !props.locked,
      crossAxis: !props.locked,
      // @ts-ignore
      fallbackPlacements: fallbackPlacements.value,
    }),
    shift({ padding: 16 }),
    arrow({
      element: floatingArrow,
      padding: Number(props.arrowPadding),
    }),
    offset({
      mainAxis: Number(props.offsetDistance),
      crossAxis: Number(props.offsetSkid),
    }),
  ];

  return middlewares;
});

const {
  floatingStyles: defaultFloatingStyles,
  middlewareData,
  placement: plc,
  update,
} = useFloating(reference, floating, {
  strategy: 'fixed',
  // @ts-ignore
  placement: basePlacement,
  middleware,
  whileElementsMounted: autoUpdate,
});

// Manually calculate floating styles if clientPosition is provided
const floatingStyles = computed(() => {
  if (props.clientPosition) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const popperWidth = floating.value?.offsetWidth || 0;
    const popperHeight = floating.value?.offsetHeight || 0;

    const adjustedX = Math.min(Math.max(props.clientPosition.x, 0), viewportWidth - popperWidth);
    const adjustedY = Math.min(Math.max(props.clientPosition.y, 0), viewportHeight - popperHeight);

    return {
      position: 'fixed',
      left: `${adjustedX}px`,
      top: `${adjustedY}px`,
    };
  }
  if (props.fullScreenPanel) {
    return {
      position: 'fixed',
      left: '0px',
      bottom: '0px',
    };
  }
  return defaultFloatingStyles.value;
});

watch(
  () => props.placement,
  () => {
    update();
  }
);

watch(plc, (newPlacement) => {
  emits('update:placement', newPlacement);
});

// Automatically detect if inside higher context
const insideHeader = inject('insideHeader', ref(false));
const insideNavBar = inject('insideNavBar', ref(false));
const insideModal = inject('insideModal', ref(false));
const insideFullscreenMap = inject('insideFullscreenMap', ref(false));

const needsHighZ = computed(
  () => insideModal.value || insideFullscreenMap.value || insideHeader.value || insideNavBar.value
);

onMounted(() => {
  emits('update:placement', basePlacement.value);
});

function emitCurtainTouched() {
  emits('curtainTouched');
}
</script>

<template>
  <div :id="id" ref="reference" class="popper-wrapper">
    <slot />

    <Teleport to="#poppers" v-if="show && !disabled">
      <div
        v-if="show && !disabled"
        ref="floating"
        :style="floatingStyles"
        class="popper"
        :class="[
          panelClass,
          { 'higher-z-index': needsHighZ },
          {
            'fullscreen-popper': props.fullScreenPanel,
          },
        ]"
      >
        <slot v-if="$slots.content" name="content" />
        <p v-else-if="content" class="lx-simple-popper-content">{{ content }}</p>

        <div
          v-if="arrowPointer"
          ref="floatingArrow"
          class="popper-floating-arrow"
          :style="{
            position: 'absolute',
            left: plc.startsWith('right')
              ? '-5px'
              : plc.startsWith('left')
              ? 'auto'
              : middlewareData.arrow?.x != null
              ? `${middlewareData.arrow.x - Number(props.offsetSkid)}px`
              : '',
            right: plc.startsWith('left') ? '-5px' : '',
            top: plc.startsWith('top')
              ? 'auto'
              : plc.startsWith('bottom')
              ? '-5px'
              : middlewareData.arrow?.y != null
              ? `${middlewareData.arrow.y}px`
              : '',
            bottom: plc.startsWith('top') ? '-5px' : '',
          }"
        />
      </div>
      <div
        v-if="props.fullScreenPanel && !needsHighZ"
        class="lx-curtain popper-curtain"
        @touchstart.prevent="emitCurtainTouched"
      ></div>
    </Teleport>
  </div>
</template>
