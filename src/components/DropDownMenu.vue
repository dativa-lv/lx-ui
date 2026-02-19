<script setup>
import { ref, computed, nextTick, inject, watch } from 'vue';
import { onClickOutside, useWindowSize } from '@vueuse/core';
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap';
import LxPopper from '@/components/Popper.vue';
import LxButton from '@/components/Button.vue';
import LxToggle from '@/components/Toggle.vue';
import LxValuePicker from '@/components/ValuePicker.vue';
import LxIcon from '@/components/Icon.vue';
import { logWarn } from '@/utils/devUtils';
import useLx from '@/hooks/useLx';
import {
  focusNextFocusableElement,
  focusFirstElementInContainer,
  focusLastElementInContainer,
  focusNextElementInContainer,
  focusPreviousElementInContainer,
  getDisplayTexts,
} from '@/utils/generalUtils';
import { generateUUID } from '@/utils/stringUtils';

const props = defineProps({
  placement: { type: String, default: 'bottom' },
  customClass: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  triggerClick: { type: String, default: 'left' },
  offsetSkid: { type: String, default: null },
  tabindex: { type: [String, Number], default: null },
  datePickerType: { type: String, default: null },
  actionDefinitions: { type: Array, default: () => [] },
  groupDefinitions: { type: Array, default: null },
  texts: { type: Object, default: () => ({}) },
});

const textsDefault = {
  inputManual: 'Ievadīt manuāli',
  bottomSheetClose: 'Paslēpt paneli',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));

const emits = defineEmits(['actionClick']);

const togglerRef = ref(null);
const togglerId = generateUUID();
const panelRef = ref(null);
const panelId = generateUUID();
const firstFocusableElement = ref(null);
const menuOpen = ref(false);
const isTouchSensitive = inject('isTouchMode', false);
const parentFocusTrap = inject('parentFocusTrap', null);
const dragThreshold = 50;

const windowSize = useWindowSize();

const responsiveView = computed(() => windowSize.width.value <= 500);

const { activate: activateFocusTrap, deactivate: deactivateFocusTrap } = useFocusTrap(panelRef, {
  initialFocus: false,
  escapeDeactivates: false,
  returnFocusOnDeactivate: false,
  clickOutsideDeactivates: true,
});

function openMenu({ source = 'default', focus = 'first' } = {}) {
  if (props.disabled) {
    return;
  }

  menuOpen.value = true;
  if (props.datePickerType && responsiveView.value) {
    document.body.classList.add('no-scroll');
  }

  nextTick(() => {
    parentFocusTrap?.pause();

    activateFocusTrap();
    if (!props.datePickerType) {
      switch (focus) {
        case 'first':
          firstFocusableElement.value = focusFirstElementInContainer(panelRef.value);

          if (source !== 'keyboard') {
            panelRef.value?.focus();
          }
          break;
        case 'last':
          focusLastElementInContainer(panelRef.value);
          break;
        default:
          break;
      }
    }
    if (props.datePickerType) {
      nextTick(() => {
        focusFirstElementInContainer(panelRef.value);
      });
    }
  });
}

const popperToClose = ref(false);
const hasReducedMotion = ref(document.body.classList.contains('lx-no-animations'));

function handleClose(hasAnimation = true) {
  popperToClose.value = true;

  // without animation
  if (hasReducedMotion.value || !hasAnimation) {
    menuOpen.value = false;
    popperToClose.value = false;
  } else {
    // with animation
    setTimeout(() => {
      menuOpen.value = false;
      popperToClose.value = false;
    }, 300);
  }

  nextTick(() => {
    deactivateFocusTrap();
  });
}

function closeMenu({ source = 'default' } = {}) {
  if (props.datePickerType && responsiveView.value) {
    handleClose();

    deactivateFocusTrap();

    parentFocusTrap?.unpause();

    if (source === 'keyboard') {
      togglerRef.value?.focus();
    }
    return;
  }
  menuOpen.value = false;

  deactivateFocusTrap();

  parentFocusTrap?.unpause();

  if (source === 'keyboard') {
    togglerRef.value?.focus();
  }
}

function preventClose(event) {
  event.stopPropagation();
}

const groupMap = computed(() =>
  (props.groupDefinitions || []).reduce((acc, group) => {
    acc[group.id] = group;
    return acc;
  }, {})
);

function getGroupLabel(groupName) {
  return groupMap?.value[groupName]?.name || groupMap?.value[groupName]?.label || null;
}

const groupedItems = computed(() => {
  const res = props.actionDefinitions.reduce((acc, action) => {
    if (action?.kind === 'main') return acc; // skip 'main' items
    if (!action?.groupId) {
      if (!acc.lx_group) {
        acc.lx_group = [];
      }
      acc.lx_group.push(action);
    } else {
      if (!acc[action?.groupId]) acc[action?.groupId] = [];
      acc[action?.groupId].push(action);

      if (groupMap?.value[action?.groupId]?.kind === 'tags') {
        const selectedItem = acc[action?.groupId]?.find((a) => a.selected);
        if (selectedItem) {
          acc[action?.groupId][0].value = selectedItem.id;
        }
      }
    }

    if (action?.kind === 'toggle' && action?.value === undefined) {
      /* eslint-disable no-param-reassign */
      action.value = false;
    }

    return acc;
  }, {});
  return res;
});

const mainButton = computed(() => {
  const mainButtons = props.actionDefinitions?.filter((x) => x?.kind === 'main');
  if (mainButtons.length > 1) {
    logWarn(
      'LxDropDownMenu: More than one action with kind "main" defined. Only the first one will be used.',
      useLx()?.environment
    );
  }
  return mainButtons?.[0] || null;
});

function handleTogglerClick(e) {
  switch (props.triggerClick) {
    case 'left':
      if (e.type === 'click') {
        if (!menuOpen.value) {
          openMenu();
        } else {
          closeMenu();
        }
      }
      break;
    case 'right':
      if (e.type === 'contextmenu') {
        e.preventDefault();

        if (!menuOpen.value) {
          openMenu();
        } else {
          closeMenu();
        }
      }
      break;
    default:
      break;
  }
}

function handleTogglerKeyup(e) {
  switch (e.key) {
    case ' ':
    case 'Enter':
    case 'ArrowDown':
      e.preventDefault();
      openMenu({ source: 'keyboard' });
      break;
    case 'ArrowUp':
      e.preventDefault();
      openMenu({ source: 'keyboard', focus: 'last' });
      break;
    default:
      break;
  }
}

function handlePanelKeydown(e) {
  switch (e.key) {
    case ' ':
    case 'Enter':
    case 'ArrowDown':
    case 'ArrowUp':
    case 'Home':
    case 'End':
    case 'Escape':
      e.preventDefault();
      break;
    case 'Tab':
      e.preventDefault();
      closeMenu();
      if (e.shiftKey) {
        togglerRef.value.focus();
      } else {
        focusNextFocusableElement(togglerRef.value);
      }
      break;
    default:
      break;
  }
}

function handlePanelKeyup(e) {
  switch (e.key) {
    case ' ':
    case 'Enter':
      e.preventDefault();
      if (document.activeElement === panelRef.value) {
        firstFocusableElement.value?.click();
      } else if (panelRef.value?.contains(document.activeElement)) {
        document.activeElement.click();
      }
      break;
    case 'ArrowDown':
      e.preventDefault();
      if (document.activeElement === panelRef.value) {
        firstFocusableElement.value?.focus();
      }
      focusNextElementInContainer(panelRef.value);
      break;
    case 'ArrowUp':
      e.preventDefault();
      focusPreviousElementInContainer(panelRef.value);
      break;
    case 'Home':
      e.preventDefault();
      focusFirstElementInContainer(panelRef.value);
      break;
    case 'End':
      e.preventDefault();
      focusLastElementInContainer(panelRef.value);
      break;
    case 'Escape':
      e.preventDefault();
      closeMenu({ source: 'keyboard' });
      break;
    default:
      break;
  }
}

function handleActionClick(id, { value = undefined, close = false, event = undefined } = {}) {
  if (close) {
    closeMenu({ source: event?.detail === 0 ? 'keyboard' : 'mouse' });
  }

  emits('actionClick', id, value);
}

const isDragging = ref(false);
const startY = ref(0);
const currentY = ref(0);
const maxHeightReached = ref(false);
const wrapperPanelRef = ref(null);

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
  const popperEl = panelRef.value;
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

  const popperEl = panelRef.value;
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
  if (!responsiveView.value || props.disabled) return;

  isDragging.value = true;
  startY.value = event.touches ? event.touches[0].clientY : event.clientY;

  window.addEventListener('mousemove', handleDragging);
  window.addEventListener('mouseup', handleDragEnd);
  window.addEventListener('touchmove', handleDragging, { passive: false });
  window.addEventListener('touchend', handleDragEnd);
};

function onClickOutsideHandler() {
  if (!menuOpen.value) {
    return;
  }
  if (props.datePickerType && responsiveView.value) {
    handleClose();
  } else {
    closeMenu();
  }
}

watch(
  () => responsiveView.value,
  () => {
    handleClose();
  }
);

watch(
  () => menuOpen.value,
  (newVal) => {
    if (!newVal && responsiveView.value && props.datePickerType) {
      document.body.classList.remove('no-scroll');
    }
  }
);

function inputManual() {
  emits('actionClick', 'inputManual');
  handleClose();
}

onClickOutside(togglerRef, onClickOutsideHandler, {
  ignore: [panelRef],
});

defineExpose({ closeMenu, openMenu, preventClose, menuOpen });
</script>

<template>
  <div class="lx-context-container" :class="[{ 'lx-selected': menuOpen }, customClass]">
    <LxPopper
      :placement="placement"
      :offset-skid="offsetSkid"
      :disabled="disabled"
      offset-distance="0"
      :show="menuOpen"
      :fullScreenPanel="datePickerType ? responsiveView : false"
      @curtainTouched="handleClose()"
    >
      <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
      <div
        ref="togglerRef"
        :id="togglerId"
        class="lx-dropdown-toggler"
        role="button"
        aria-haspopup="menu"
        :aria-expanded="menuOpen"
        :aria-controls="panelId"
        :aria-disabled="disabled"
        :tabindex="disabled ? null : tabindex || 0"
        @click="handleTogglerClick"
        @contextmenu="handleTogglerClick"
        @keydown.space.prevent
        @keydown.down.prevent
        @keydown.up.prevent
        @keyup="handleTogglerKeyup"
      >
        <LxButton
          v-if="!$slots.default && mainButton"
          :id="mainButton?.id"
          :label="mainButton?.name || mainButton?.label"
          :title="mainButton?.title || mainButton?.tooltip"
          :icon="mainButton?.icon"
          :iconSet="mainButton?.iconSet"
          :disabled="disabled || mainButton?.disabled"
          :loading="mainButton?.loading"
          :busy="mainButton?.busy"
          :destructive="mainButton?.destructive"
          :badge="mainButton?.badge"
          :badgeType="mainButton?.badgeType"
          :active="mainButton?.active"
          :badgeIcon="mainButton?.badgeIcon"
          :badgeTitle="mainButton?.badgeTitle"
          kind="ghost"
          variant="icon-only"
          tabindex="-1"
        />
        <slot v-else />
      </div>

      <template #content>
        <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
        <div
          :id="panelId"
          ref="panelRef"
          class="lx-dropdown-panel-wrapper"
          :class="[
            {
              'slide-up-animation': responsiveView && menuOpen && !popperToClose && datePickerType,
            },
            { 'slide-down-animation': responsiveView && popperToClose && datePickerType },
            { 'date-picker-type': datePickerType },
            { [`mode-${datePickerType}`]: datePickerType },
          ]"
          role="menu"
          tabindex="-1"
          :aria-labelledby="togglerId"
          @keydown="handlePanelKeydown"
          @keyup="handlePanelKeyup"
        >
          <div
            v-if="responsiveView && datePickerType"
            class="lx-info-wrapper-responsive-toolbar dropdown-handle-toolbar"
            :class="[
              { 'slide-up-animation': responsiveView && menuOpen && !popperToClose },
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
              <LxButton
                v-if="
                  datePickerType !== 'month' &&
                  datePickerType !== 'month-year' &&
                  datePickerType !== 'quarters'
                "
                :label="displayTexts.inputManual"
                kind="ghost"
                @click="inputManual"
              ></LxButton>
            </div>

            <LxButton
              kind="ghost"
              icon="chevron-down"
              variant="icon-only"
              :label="displayTexts.bottomSheetClose"
              @click="handleClose()"
            />
          </div>
          <div v-if="$slots.clickSafePanel" ref="wrapperPanelRef" class="lx-dropdown-panel">
            <div
              v-for="(group, groupName) in groupedItems"
              :key="groupName"
              class="lx-button-set lx-dropdown-menu-group"
              role="group"
              :aria-labelledby="`${groupName}-group`"
            >
              <div
                v-if="getGroupLabel(groupName)"
                :id="`${groupName}-group`"
                :title="getGroupLabel(groupName)"
                class="lx-label"
              >
                {{ getGroupLabel(groupName) }}
              </div>
              <template v-for="(action, index) in group" :key="action?.id">
                <div
                  v-if="groupMap[groupName]?.kind === 'tags' && index === 0"
                  class="lx-dropdown-menu-tag-wrapper"
                >
                  <LxValuePicker
                    role="menuitem"
                    v-model="group[0].value"
                    :items="group"
                    variant="tags-custom"
                    selectionKind="single"
                    :id="groupName"
                    @update:modelValue="
                      (newValue) => {
                        handleActionClick(groupName, { value: newValue });
                      }
                    "
                    @click="preventClose"
                  >
                    <template #customItem="{ icon, name, label, iconSet }">
                      <div class="lx-dropdown-menu-tag-content-wrapper">
                        <LxIcon v-if="icon" :value="icon" :iconSet="iconSet" />
                        <div class="lx-dropdown-menu-tag-label">
                          {{ name || label }}
                        </div>
                      </div>
                    </template>
                  </LxValuePicker>
                </div>
                <div v-else-if="action?.kind === 'toggle'" class="lx-dropdown-menu-toggle-wrapper">
                  <label
                    class="lx-dropdown-toggle-label"
                    :id="`${action.id}-label`"
                    :for="action?.id"
                    aria-hidden="true"
                  >
                    {{ action?.name || action?.label }}
                  </label>
                  <LxToggle
                    role="menuitem"
                    :id="action?.id"
                    :label="action?.name || action?.label"
                    :disabled="action?.disabled"
                    v-model="action.value"
                    :texts="action?.texts"
                    :tooltip="action?.title"
                    :size="isTouchSensitive ? 'm' : 's'"
                    @update:modelValue="
                      (newValue) => {
                        handleActionClick(action?.id, { value: newValue });
                      }
                    "
                    @click="preventClose"
                  />
                </div>

                <LxButton
                  v-else-if="groupMap[groupName]?.kind !== 'tags'"
                  :id="action?.id"
                  :label="action?.name || action?.label"
                  :title="action?.title || action?.tooltip"
                  kind="menuitem"
                  :icon="action?.icon"
                  :iconSet="action?.iconSet"
                  :disabled="action?.disabled"
                  :loading="action?.loading"
                  :busy="action?.busy"
                  :destructive="action?.destructive"
                  :badge="action?.badge"
                  :badge-type="action?.badgeType"
                  :active="action?.active"
                  :badgeIcon="action?.badgeIcon"
                  :badgeTitle="action?.badgeTitle"
                  :href="action?.href"
                  @click="handleActionClick(action?.id)"
                />
              </template>
            </div>
            <div v-if="responsiveView && datePickerType">
              <slot name="clickSafePanel" />
            </div>
            <slot v-else name="clickSafePanel" />
          </div>
          <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
          <div
            v-if="$slots.panel || (actionDefinitions?.length > 0 && !$slots.clickSafePanel)"
            class="lx-dropdown-panel"
            ref="wrapperPanelRef"
            @click="closeMenu"
          >
            <div
              v-for="(group, groupName) in groupedItems"
              :key="groupName"
              class="lx-button-set lx-dropdown-menu-group"
              :class="[
                { 'lx-dropdown-menu-no-panel': !$slots.panel && actionDefinitions?.length > 0 },
              ]"
              role="group"
              :aria-labelledby="`${groupName}-group`"
            >
              <div
                v-if="getGroupLabel(groupName)"
                :id="`${groupName}-group`"
                :title="getGroupLabel(groupName)"
                class="lx-label"
              >
                {{ getGroupLabel(groupName) }}
              </div>
              <template v-for="(action, index) in group" :key="action?.id">
                <div
                  v-if="groupMap[groupName]?.kind === 'tags' && index === 0"
                  class="lx-dropdown-menu-tag-wrapper"
                >
                  <LxValuePicker
                    v-model="group[0].value"
                    :items="group"
                    variant="tags-custom"
                    selectionKind="single"
                    :id="groupName"
                    @update:modelValue="
                      (newValue) => {
                        handleActionClick(groupName, { value: newValue });
                      }
                    "
                    @click="preventClose"
                  >
                    <template #customItem="{ icon, name, label, iconSet }">
                      <div class="lx-dropdown-menu-tag-content-wrapper">
                        <LxIcon v-if="icon" :value="icon" :iconSet="iconSet" />
                        <div class="lx-dropdown-menu-tag-label">
                          {{ name || label }}
                        </div>
                      </div>
                    </template>
                  </LxValuePicker>
                </div>
                <div v-else-if="action?.kind === 'toggle'" class="lx-dropdown-menu-toggle-wrapper">
                  <label
                    class="lx-dropdown-toggle-label"
                    :id="`${action.id}-label`"
                    :for="action?.id"
                    aria-hidden="true"
                  >
                    {{ action?.name || action?.label }}
                  </label>
                  <LxToggle
                    role="menuitem"
                    :id="action?.id"
                    :label="action?.name || action?.label"
                    :disabled="action?.disabled"
                    v-model="action.value"
                    :texts="action?.texts"
                    :tooltip="action?.title"
                    :size="isTouchSensitive ? 'm' : 's'"
                    @update:modelValue="
                      (newValue) => {
                        handleActionClick(action?.id, { value: newValue });
                      }
                    "
                    @click="preventClose"
                  />
                </div>

                <LxButton
                  v-else-if="groupMap[groupName]?.kind !== 'tags'"
                  :id="action?.id"
                  :label="action?.name || action?.label"
                  :title="action?.title || action?.tooltip"
                  kind="menuitem"
                  :icon="action?.icon"
                  :iconSet="action?.iconSet"
                  :disabled="action?.disabled"
                  :loading="action?.loading"
                  :busy="action?.busy"
                  :destructive="action?.destructive"
                  :badge="action?.badge"
                  :badge-type="action?.badgeType"
                  :active="action?.active"
                  :badgeIcon="action?.badgeIcon"
                  :badgeTitle="action?.badgeTitle"
                  :href="action?.href"
                  @click="handleActionClick(action?.id, { close: true, event: $event })"
                />
              </template>
            </div>

            <slot name="panel" />
          </div>
        </div>
      </template>
    </LxPopper>
  </div>
</template>
