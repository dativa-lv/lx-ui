<script setup>
import { ref, computed, nextTick, inject } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap';
import LxPopper from '@/components/Popper.vue';
import LxButton from '@/components/Button.vue';
import LxToggle from '@/components/Toggle.vue';
import { logWarn } from '@/utils/devUtils';
import useLx from '@/hooks/useLx';
import {
  focusNextFocusableElement,
  focusFirstElementInContainer,
  focusLastElementInContainer,
  focusNextElementInContainer,
  focusPreviousElementInContainer,
} from '@/utils/generalUtils';
import { generateUUID } from '@/utils/stringUtils';

const props = defineProps({
  placement: { type: String, default: 'bottom' },
  customClass: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  triggerClick: { type: String, default: 'left' },
  offsetSkid: { type: String, default: null },
  tabindex: { type: [String, Number], default: null },
  actionDefinitions: { type: Array, default: () => [] },
});

const emits = defineEmits(['actionClick']);

const togglerRef = ref(null);
const togglerId = generateUUID();
const panelRef = ref(null);
const panelId = generateUUID();
const firstFocusableElement = ref(null);
const menuOpen = ref(false);
const isTouchSensitive = inject('isTouchMode', false);
const parentFocusTrap = inject('parentFocusTrap', null);

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

  nextTick(() => {
    parentFocusTrap?.pause();

    activateFocusTrap();

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
  });
}

function closeMenu({ source = 'default' } = {}) {
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

const groupedItems = computed(() => {
  const res = props.actionDefinitions.reduce((acc, action) => {
    if (action?.kind === 'main') return acc; // skip 'main' items
    if (!action?.group) {
      if (!acc.lx_group) {
        acc.lx_group = [];
      }
      acc.lx_group.push(action);
    } else {
      if (!acc[action?.group]) acc[action?.group] = [];
      acc[action?.group].push(action);
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
      openMenu({ source: 'keyboard' });
      break;
    case 'ArrowUp':
      openMenu({ source: 'keyboard', focus: 'last' });
      break;
    default:
      break;
  }
}

function handlePanelKeydown(e) {
  switch (e.key) {
    case 'Tab':
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
      if (document.activeElement === panelRef.value) {
        firstFocusableElement.value?.click();
      } else if (panelRef.value?.contains(document.activeElement)) {
        document.activeElement.click();
      }
      break;
    case 'ArrowDown':
      if (document.activeElement === panelRef.value) {
        firstFocusableElement.value?.focus();
      }
      focusNextElementInContainer(panelRef.value);
      break;
    case 'ArrowUp':
      focusPreviousElementInContainer(panelRef.value);
      break;
    case 'Home':
      focusFirstElementInContainer(panelRef.value);
      break;
    case 'End':
      focusLastElementInContainer(panelRef.value);
      break;
    case 'Escape':
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

function onClickOutsideHandler() {
  if (!menuOpen.value) {
    return;
  }

  closeMenu();
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
        @keyup.prevent="handleTogglerKeyup"
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
          role="menu"
          tabindex="-1"
          :aria-labelledby="togglerId"
          @keydown.prevent="handlePanelKeydown"
          @keyup.prevent="handlePanelKeyup"
        >
          <div v-if="$slots.clickSafePanel" class="lx-dropdown-panel" role="group">
            <div
              v-for="(group, groupName) in groupedItems"
              :key="groupName"
              class="lx-button-set lx-dropdown-menu-group"
            >
              <div v-for="action in group" :key="action?.id">
                <div v-if="action?.kind === 'toggle'" class="lx-dropdown-menu-toggle-wrapper">
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
                  v-else
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
              </div>
            </div>

            <slot name="clickSafePanel" />
          </div>
          <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
          <div
            v-if="$slots.panel || (actionDefinitions?.length > 0 && !$slots.clickSafePanel)"
            class="lx-dropdown-panel"
            role="group"
            @click="closeMenu"
          >
            <div
              v-for="(group, groupName) in groupedItems"
              :key="groupName"
              class="lx-button-set lx-dropdown-menu-group"
              :class="[
                { 'lx-dropdown-menu-no-panel': !$slots.panel && actionDefinitions?.length > 0 },
              ]"
            >
              <div v-for="action in group" :key="action?.id">
                <div v-if="action?.kind === 'toggle'" class="lx-dropdown-menu-toggle-wrapper">
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
                  v-else
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
              </div>
            </div>

            <slot name="panel" />
          </div>
        </div>
      </template>
    </LxPopper>
  </div>
</template>
