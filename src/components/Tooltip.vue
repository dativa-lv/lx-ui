<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';

import LxPopper from '@/components/Popper.vue';
import { generateUUID } from '@/utils/stringUtils';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  value: { type: String, default: null },
  disabled: { type: Boolean, default: false },
  label: { type: String, default: null },
  description: { type: String, default: null },
  customRole: { type: String, default: null },
});

const popperRef = ref(null);

const TOOLTIP_CURSOR_OPEN_DELAY = 300;
const TOOLTIP_CURSOR_CLOSE_DELAY = 100;

let openTimeout = null;
// eslint-disable-next-line no-unused-vars
let closeTimeout = null;
let debounceTimeout = null;

const showPopper = ref(false);
const triggerRef = ref(null);

const resolvedPlacement = ref();
const tooltipOpenedOnce = ref(false);
const tooltipActive = ref(false);

const latestCursorPos = ref({ x: 0, y: 0 });
const hoverCursorPos = ref({ x: 0, y: 0 });
const savedCursorPos = ref({ x: 0, y: 0 });

// Pseudo height of cursor
const cursorHeight = 18;

const ariaLabel = computed(() => {
  if (props.label && props.description) {
    return `${props.label}. ${props.description}`;
  }
  return props.label || props.description || null;
});

const spacerStyle = computed(() => '--info-popper-spacer-size: 13px');

const handleOpen = () => {
  if (props.disabled) return;
  showPopper.value = true;
};

const handleClose = () => {
  showPopper.value = false;
};

const setCursorPosition = () => {
  hoverCursorPos.value = {
    x: latestCursorPos.value.x,
    y: latestCursorPos.value.y + cursorHeight,
  };
};

const calculateDistance = (pos1, pos2) => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const handleMouseMove = (event) => {
  if (props.disabled || window.matchMedia('(hover: none)').matches) {
    return;
  }

  latestCursorPos.value = {
    x: event.clientX,
    y: event.clientY,
  };

  if (tooltipOpenedOnce.value) {
    // Save zone distance 20px
    const distance = calculateDistance(savedCursorPos.value, latestCursorPos.value);
    if (distance > 20) {
      handleClose();
      tooltipOpenedOnce.value = false;
    }
    return;
  }

  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }

  debounceTimeout = setTimeout(() => {
    setCursorPosition();

    showPopper.value = true;
    tooltipOpenedOnce.value = true;

    // Save the cursor position when the tooltip opens
    savedCursorPos.value = { ...latestCursorPos.value };

    debounceTimeout = null;
  }, TOOLTIP_CURSOR_OPEN_DELAY);
};

const handleMouseLeave = (event) => {
  if (props.disabled) return;

  tooltipActive.value = false;

  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
    debounceTimeout = null;
  }

  if (openTimeout) {
    clearTimeout(openTimeout);
    openTimeout = null;
  }

  const { relatedTarget } = event;
  const triggerEl = triggerRef.value;
  const popperEl = popperRef.value;
  if (
    relatedTarget instanceof Element &&
    triggerEl instanceof HTMLElement &&
    popperEl instanceof HTMLElement &&
    !triggerEl.contains(relatedTarget) &&
    !popperEl.contains(relatedTarget)
  ) {
    closeTimeout = setTimeout(() => {
      tooltipOpenedOnce.value = false;
      showPopper.value = false;
      closeTimeout = null;
    }, TOOLTIP_CURSOR_CLOSE_DELAY);
  }
};

function handlePlacementChange(newPlacement) {
  resolvedPlacement.value = newPlacement;
}

function handleContextMenu() {
  handleClose();
}

const clientPosition = computed(() => hoverCursorPos.value);

function closeOnPopperTooltipMove() {
  handleClose();
}

onMounted(() => {
  const el = triggerRef.value?.firstElementChild;
  if (el && el instanceof HTMLElement) {
    el.setAttribute('aria-labelledby', `${props.id}-description`);
  }
});

defineExpose({ handleOpen, handleClose, showPopper });
</script>
<template>
  <LxPopper
    :id="`${id}-popper`"
    :client-position="clientPosition"
    placement="right-end"
    offset-distance="0"
    :arrowPointer="false"
    :disabled="disabled"
    :show="showPopper"
    emitPlacement
    @update:placement="handlePlacementChange"
  >
    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
    <div
      ref="triggerRef"
      class="lx-info-wrapper-content lx-tooltip-kind"
      :class="[{ 'lx-disabled': disabled }]"
      :aria-label="ariaLabel"
      :aria-describedby="`${id}-description`"
      :role="customRole"
      @mouseleave="handleMouseLeave"
      @mousemove="handleMouseMove"
      @contextmenu="handleContextMenu"
      @blur="handleClose"
    >
      <slot />
    </div>

    <template #content>
      <div
        ref="popperRef"
        class="lx-info-wrapper lx-tooltip-kind"
        @mouseleave="handleMouseLeave"
        @mousemove="closeOnPopperTooltipMove"
        @blur="handleClose"
      >
        <div
          ref="panelRef"
          :id="`${id}-description`"
          class="lx-info-wrapper-panel"
          :class="[
            {
              'info-popper-top':
                resolvedPlacement === 'top' ||
                resolvedPlacement === 'top-start' ||
                resolvedPlacement === 'top-end',
            },
            {
              'info-popper-bottom':
                resolvedPlacement === 'bottom' ||
                resolvedPlacement === 'bottom-start' ||
                resolvedPlacement === 'bottom-end',
            },
            {
              'info-popper-right':
                resolvedPlacement === 'right' ||
                resolvedPlacement === 'right-start' ||
                resolvedPlacement === 'right-end',
            },
            {
              'info-popper-left':
                resolvedPlacement === 'left' ||
                resolvedPlacement === 'left-start' ||
                resolvedPlacement === 'left-end',
            },
          ]"
          role="tooltip"
          :aria-hidden="!showPopper"
          :style="`${spacerStyle}`"
          @click.prevent="handleClose"
        >
          <div class="lx-info-wrapper-panel-area">
            <p class="lx-tooltip-text">{{ props.value }}</p>
          </div>
        </div>
      </div>
    </template>
  </LxPopper>
</template>
