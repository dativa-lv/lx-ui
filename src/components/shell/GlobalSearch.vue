<script setup>
import { computed, inject, provide, ref, watch } from 'vue';
import { onClickOutside, useEventListener, useResizeObserver } from '@vueuse/core';

import LxButton from '@/components/Button.vue';
import LxGlobalSearchInput from '@/components/shell/GlobalSearchInput.vue';
import { shellContextKey } from '@/components/shell/shellContext';
import { remToPx, focusNextFocusableElement } from '@/utils/generalUtils';

const { props, displayTexts, header, main, poppers, width, navHiddenWidthBreakpoint } = inject(
  shellContextKey,
  {}
);
const closeSignal = inject('closeSignal', ref(false));

const texts = computed(() => displayTexts.value.globalSearch);

const isOpen = ref(false);
const buttonWrapperRef = ref(null);
const panelRef = ref(null);
const searchInputRef = ref(null);
const panelStyle = ref({});

const MIN_PANEL_WIDTH_REM = 30;
const COVER_MODES = new Set(['cover', 'cover-digives-lite']);
const FULL_WIDTH_MODES = new Set(['public', 'latvijalv', ...COVER_MODES]);

const isMobile = computed(() => width.value <= navHiddenWidthBreakpoint.value);

function updatePanelPosition() {
  const headerRect = header.value?.getBoundingClientRect();
  const content = COVER_MODES.has(props.mode)
    ? main.value?.querySelector('.lx-cover .lx-content')
    : main.value;
  const contentRect = content?.getBoundingClientRect();
  const buttonRect = buttonWrapperRef.value?.getBoundingClientRect();
  if (!headerRect || !contentRect || !buttonRect) return;

  let { left } = contentRect;
  let { right } = buttonRect;
  if (isMobile.value) {
    left = 0;
    right = document.documentElement.clientWidth;
  } else if (FULL_WIDTH_MODES.has(props.mode) || right - left < remToPx(MIN_PANEL_WIDTH_REM)) {
    right = contentRect.right;
  }

  panelStyle.value = {
    top: `${headerRect.bottom}px`,
    left: `${left}px`,
    width: `${right - left}px`,
  };
}

function updateOpenPanelPosition() {
  if (isOpen.value) updatePanelPosition();
}

watch(width, updateOpenPanelPosition);
useResizeObserver(header, updateOpenPanelPosition);
useEventListener(window, 'scroll', updateOpenPanelPosition, { passive: true });

function getToggleButton() {
  return buttonWrapperRef.value?.querySelector('button');
}

function open() {
  updatePanelPosition();
  isOpen.value = true;
}

function close(returnFocus = false) {
  if (!isOpen.value) return;
  isOpen.value = false;
  if (returnFocus) getToggleButton()?.focus();
}

function toggle() {
  if (isOpen.value) close();
  else open();
}

watch(closeSignal, () => close());

onClickOutside(panelRef, () => close(), { ignore: [buttonWrapperRef, '.popper'] });

function leaveSearch(event, onLeave) {
  event.preventDefault();
  event.stopImmediatePropagation();
  onLeave();
}

useEventListener(
  document,
  'keydown',
  (event) => {
    if (!isOpen.value || !searchInputRef.value?.isInSearch(event.target)) return;
    const isOnDetails = event.target === searchInputRef.value.getDetailsButton();

    if (event.key === 'Escape') {
      leaveSearch(event, () => close(true));
    } else if (event.key === 'Tab' && event.shiftKey && !isOnDetails) {
      leaveSearch(event, () => close(true));
    } else if (event.key === 'Tab' && !event.shiftKey && isOnDetails) {
      leaveSearch(event, () => {
        close();
        focusNextFocusableElement(getToggleButton());
      });
    }
  },
  { capture: true }
);

function onToggleKeydown(event) {
  if (event.key === 'ArrowDown' && !isOpen.value) {
    event.preventDefault();
    open();
  }
}

provide('insideHeader', ref(true));

defineExpose({ open, close });
</script>

<template>
  <div
    ref="buttonWrapperRef"
    class="lx-global-search-toggle"
    :class="{ 'lx-global-search-opened': isOpen }"
  >
    <LxButton
      id="lx-shell-global-search-button"
      customClass="lx-header-button"
      kind="ghost"
      :icon="isOpen ? 'close' : 'search'"
      :label="isOpen ? texts.close : texts.open"
      variant="icon-only"
      :disabled="props.headerNavDisable"
      :aria-expanded="isOpen"
      aria-controls="lx-shell-global-search-panel"
      @click="toggle"
      @keydown="onToggleKeydown"
    />
  </div>

  <Teleport v-if="isOpen" :to="poppers || 'body'">
    <div
      v-if="isMobile"
      class="lx-curtain lx-global-search-backdrop"
      :style="{ top: panelStyle.top }"
    />
    <div
      ref="panelRef"
      id="lx-shell-global-search-panel"
      class="lx-global-search-panel"
      role="search"
      :style="panelStyle"
    >
      <LxGlobalSearchInput
        ref="searchInputRef"
        id="lx-shell-global-search-input"
        :autoOpen="true"
        @select="close()"
        @openDetails="close()"
      />
    </div>
  </Teleport>
</template>
