<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed, useSlots, nextTick, watch } from 'vue';
import { generateUUID } from '@/utils/stringUtils';
import LxIcon from '@/components/Icon.vue';
import LxButton from '@/components/Button.vue';
import { useWindowSize } from '@vueuse/core';
import LxPopper from '@/components/Popper.vue';
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  placement: { type: String, default: 'bottom' },
  offsetSkid: { type: String, default: '0' },
  offsetDistance: { type: String, default: '12' },
  hover: { type: Boolean, default: true },
  arrow: { type: Boolean, default: true },
  arrowPadding: { type: String, default: '0' },
  disabled: { type: Boolean, default: false },
  content: { default: null },
  locked: { type: Boolean, default: false },
  focusable: { type: Boolean, default: true },
  label: { type: String, default: null },
  description: { type: String, default: null },
  customRole: { type: String, default: null },
});

const popperRef = ref(null);
const panelRef = ref(null);
const panelAreaRef = ref(null);

const { activate, deactivate } = useFocusTrap(panelRef, {
  allowOutsideClick: true,
  initialFocus: false,
});

const TOOLTIP_CURSOR_OPEN_DELAY = 300;
const TOOLTIP_CURSOR_CLOSE_DELAY = 100;
const TOOLTIP_FOCUS_OPEN_DELAY = 500;

let openTimeout = null;
let closeTimeout = null;
let debounceTimeout = null;

const slots = useSlots();

const showPopper = ref(false);
const triggerRef = ref(null);
const wrapperPanelRef = ref(null);

const resolvedPlacement = ref();
const tooltipOpenedOnce = ref(false);

const isDragging = ref(false);
const startY = ref(0);
const currentY = ref(0);
const dragThreshold = 50;
const maxHeightReached = ref(false);

const scrollState = ref({
  scrollTop: 0,
  scrollBottom: 0,
});
const windowSize = useWindowSize();

const responsiveView = computed(() => windowSize.width.value <= 500);

const ariaLabel = computed(() => {
  if (props.label && props.description) {
    return `${props.label}. ${props.description}`;
  }
  return props.label || props.description || null;
});

const spacerStyle = computed(() => {
  const correction = 1;
  const popperSpacerSize = Number(props.offsetDistance) + correction;
  if (Number(props.offsetDistance) > 0) {
    return `--info-popper-spacer-size: ${popperSpacerSize}px`;
  }
  return '';
});

const isPanelAvailable = computed(() => {
  const panelSlot = slots.panel?.();
  return (panelSlot && panelSlot.length > 0) || props.content;
});

const panelAreaScrolled = () => {
  if (!responsiveView.value) return;
  const panelArea = panelAreaRef.value;
  if (panelArea) {
    scrollState.value.scrollTop = panelArea.scrollTop;
    scrollState.value.scrollBottom =
      panelArea.scrollHeight - panelArea.scrollTop - panelArea.clientHeight;
  }
};

const handleOpen = () => {
  if (!isPanelAvailable.value || props.disabled) return;
  showPopper.value = true;

  if (responsiveView.value) {
    document.body.classList.add('no-scroll');
    nextTick(() => {
      panelAreaScrolled();
      panelRef.value?.focus();
      activate();
    });
  }
};

const hasReducedMotion = ref(document.body.classList.contains('lx-no-animations'));
const popperToClose = ref(false);

function handleClose(hasAnimation = true) {
  popperToClose.value = true;

  // without animation
  if (hasReducedMotion.value || !hasAnimation) {
    showPopper.value = false;
    popperToClose.value = false;
  } else {
    // with animation
    setTimeout(() => {
      showPopper.value = false;
      popperToClose.value = false;
    }, 300);
  }

  nextTick(() => {
    deactivate();
  });
}

const handleDragging = (event) => {
  if (!isDragging.value) return;

  if (event.touches) {
    event.preventDefault();
  }

  currentY.value = event.touches ? event.touches[0].clientY : event.clientY;
  const deltaY = currentY.value - startY.value;

  // Allowed dragging is slightly higher than the allowed position (48px)
  const clampedDeltaY = Math.max(deltaY, -48);
  const positiveClampedDeltaY = Math.abs(clampedDeltaY);
  const popperEl = popperRef.value;
  const wrapperEl = wrapperPanelRef.value;
  if (popperEl) {
    popperEl.style.transform = `translateY(${clampedDeltaY}px)`;
    maxHeightReached.value = clampedDeltaY <= 0;
  }
  if (wrapperEl && maxHeightReached.value) {
    popperEl.style.transform = '';
    wrapperEl.style.marginBottom = `${positiveClampedDeltaY}px`;
  }
};

const handleDragEnd = () => {
  if (!isDragging.value) return;

  const deltaY = currentY.value - startY.value;

  isDragging.value = false;
  startY.value = 0;
  currentY.value = 0;

  const popperEl = popperRef.value;
  const wrapperEl = wrapperPanelRef.value;
  if (popperEl) {
    // Bounce back
    if (!hasReducedMotion.value) {
      popperEl.style.transition = 'transform 0.3s ease-out';
      wrapperEl.style.transition = 'margin-bottom 0.3s ease-out';
    }
    wrapperEl.style.marginBottom = '';
    popperEl.style.transform = '';
    setTimeout(() => {
      popperEl.style.transition = '';
    }, 300);
  }

  if (deltaY > dragThreshold) {
    handleClose(false);
  }

  window.removeEventListener('mousemove', handleDragging);
  window.removeEventListener('mouseup', handleDragEnd);
  window.removeEventListener('touchmove', handleDragging);
  window.removeEventListener('touchend', handleDragEnd);
};

const handleDragStart = (event) => {
  if (!responsiveView.value || props.disabled || !isPanelAvailable.value) return;

  isDragging.value = true;
  startY.value = event.touches ? event.touches[0].clientY : event.clientY;

  window.addEventListener('mousemove', handleDragging);
  window.addEventListener('mouseup', handleDragEnd);
  window.addEventListener('touchmove', handleDragging, { passive: false });
  window.addEventListener('touchend', handleDragEnd);
};

const handleClickOutside = (event) => {
  if (!showPopper.value || !responsiveView.value || props.disabled || !isPanelAvailable.value) {
    return;
  }

  const curtain = document.querySelector('.lx-curtain.popper-curtain');
  if (curtain && curtain.contains(event.target)) {
    handleClose();
  }
};

const handleMouseEnter = () => {
  if (!props.hover || props.disabled || !isPanelAvailable.value || responsiveView.value) return;

  if (closeTimeout) {
    clearTimeout(closeTimeout);
    closeTimeout = null;
  }

  openTimeout = setTimeout(() => {
    showPopper.value = true;
    openTimeout = null;
  }, TOOLTIP_CURSOR_OPEN_DELAY);
};

const handleMouseLeave = (event) => {
  if (props.disabled || !isPanelAvailable.value || responsiveView.value) return;

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

const handleFocusIn = () => {
  if (openTimeout !== null) {
    return;
  }

  if (props.disabled || !isPanelAvailable.value || responsiveView.value || !props.focusable) {
    return;
  }
  if (closeTimeout) {
    clearTimeout(closeTimeout);
    closeTimeout = null;
  }

  openTimeout = setTimeout(() => {
    showPopper.value = true;
    openTimeout = null;
  }, TOOLTIP_FOCUS_OPEN_DELAY);
};

const handleGlobalKeydown = (e) => {
  if (e.key === 'Escape' && showPopper.value) {
    handleClose();
  }
};

function handlePlacementChange(newPlacement) {
  resolvedPlacement.value = newPlacement;
}

function popperClick() {
  if (!responsiveView.value) {
    closeTimeout = setTimeout(() => {
      showPopper.value = false;
      closeTimeout = null;
    }, TOOLTIP_CURSOR_CLOSE_DELAY);
  }
}

function togglePopperOnMobile() {
  if (
    (window.matchMedia('(hover: none)').matches && isPanelAvailable.value) ||
    responsiveView.value
  ) {
    showPopper.value = !showPopper.value;
    if (showPopper.value && responsiveView.value) {
      document.body.classList.add('no-scroll');
      nextTick(() => {
        panelAreaScrolled();
        panelRef.value?.focus();
        activate();
      });
    }
  }
}

const showArrow = computed(() => {
  if (responsiveView.value) {
    return false;
  }
  return props.arrow;
});

const handleClickOnKey = () => {
  if (responsiveView.value) {
    handleOpen();
  }
};

function curtainTouched() {
  if (responsiveView.value) {
    handleClose();
  }
}

const topOutOfBounds = computed(() => {
  const keyOpacity = '--info-wrapper-top-shadow-opacity';
  const { scrollTop } = scrollState.value;
  const opacity = scrollTop > 0 ? Math.min(1, scrollTop / 100) : 0;
  return `${keyOpacity}: ${opacity};`;
});

const bottomOutOfBounds = computed(() => {
  const keyOpacity = '--info-wrapper-bottom-shadow-opacity';
  const { scrollBottom } = scrollState.value;
  const opacity = scrollBottom > 0 ? Math.min(1, scrollBottom / 100) : 0;
  return `${keyOpacity}: ${opacity};`;
});

watch(
  () => responsiveView.value,
  () => {
    handleClose();
  }
);

watch(
  () => showPopper.value,
  (newVal) => {
    if (!newVal) {
      document.body.classList.remove('no-scroll');
    }
  }
);

function focus() {
  if (props.focusable) {
    triggerRef.value?.focus();
  }
}

const tabIndex = computed(() => {
  if (props.disabled) return null;
  if (!slots.panel && !props.content) return -1;
  return props.focusable ? 0 : -1;
});

onMounted(() => {
  const el = triggerRef.value?.firstElementChild;
  if (el && el instanceof HTMLElement) {
    el.setAttribute('aria-labelledby', `${props.id}-description`);
  }
  window.addEventListener('keydown', handleGlobalKeydown);
  window.addEventListener('click', handleClickOutside);

  const observer = new MutationObserver(() => {
    hasReducedMotion.value = document.body.classList.contains('lx-no-animations');
  });

  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  onBeforeUnmount(() => {
    observer.disconnect();
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
  window.removeEventListener('click', handleClickOutside);

  if (!props.disabled) {
    document.body.classList.remove('no-scroll');
  }
});

defineExpose({ handleOpen, handleClose, showPopper, focus });
</script>
<template>
  <LxPopper
    :id="`${id}-popper`"
    :placement="props.placement"
    :offset-skid="props.offsetSkid"
    :offset-distance="props.offsetDistance"
    :hover="hover"
    :arrowPointer="showArrow"
    :arrow-padding="arrowPadding"
    :disabled="disabled || !isPanelAvailable"
    :content="content"
    :show="showPopper"
    :locked="locked"
    emitPlacement
    :fullScreenPanel="responsiveView"
    @update:placement="handlePlacementChange"
    @curtainTouched="curtainTouched"
  >
    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
    <div
      ref="triggerRef"
      class="lx-info-wrapper-content lx-rich-kind"
      :class="[
        { 'lx-disabled': disabled || !isPanelAvailable },
        { 'lx-responsive-view': responsiveView },
      ]"
      :aria-label="ariaLabel"
      :aria-describedby="`${id}-description`"
      :tabindex="tabIndex"
      :role="customRole"
      @focusin="handleFocusIn"
      @focusout="handleMouseLeave"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      @click="togglePopperOnMobile"
      @keydown.enter="handleClickOnKey"
    >
      <slot />
    </div>

    <template #content v-if="isPanelAvailable">
      <div
        ref="popperRef"
        class="lx-info-wrapper lx-rich-kind"
        :class="[
          { 'lx-responsive-view': responsiveView },
          { 'slide-up-animation': responsiveView && showPopper && !popperToClose },
          { 'slide-down-animation': responsiveView && popperToClose },
        ]"
        @focusout="handleMouseLeave"
        @mouseleave="handleMouseLeave"
        @click="popperClick"
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
          @click.prevent
        >
          <div
            v-if="responsiveView"
            class="lx-info-wrapper-responsive-toolbar"
            :class="[
              { 'slide-up-animation': responsiveView && showPopper && !popperToClose },
              { 'slide-down-animation': responsiveView && popperToClose },
            ]"
          >
            <div
              class="handle-wrapper"
              @click.stop
              @mousedown="handleDragStart"
              @touchstart="handleDragStart"
            >
              <LxIcon class="handle-icon" value="handle" />
            </div>

            <LxButton kind="ghost" icon="close" @click="handleClose()" />
          </div>
          <div
            ref="wrapperPanelRef"
            class="lx-info-wrapper-panel-area"
            :style="`${topOutOfBounds}; ${bottomOutOfBounds}`"
          >
            <div ref="panelAreaRef" class="scrollable-container" @scroll="panelAreaScrolled">
              <slot name="panel" />
              <p v-if="!$slots.panel && props.content" class="lx-data">{{ props.content }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </LxPopper>
</template>
