<script setup>
import { ref, nextTick, provide, computed, watch, onUnmounted } from 'vue';
import LxButton from '@/components/Button.vue';
import LxActionButton from '@/components/ActionButton.vue';
import { logWarn } from '@/utils/devUtils';
import useLx from '@/hooks/useLx';
import { generateUUID } from '@/utils/stringUtils';
import { flattenNestedActions, resolveActionGroups } from '@/utils/actionDefinitionsUtils';
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap';
import { useElementSize } from '@vueuse/core';
import { useScrollShadows } from '@/hooks/useScrollShadows';
import { getDisplayTexts } from '@/utils/generalUtils';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  label: { type: String, default: '' },
  size: { type: String, default: 'default' }, // default, s, m, l, xl
  disableClosing: { type: Boolean, default: false },
  kind: { type: String, default: 'default' }, // default, native
  escEnabled: { type: Boolean, default: true },
  buttonSecondaryIsCancel: { type: Boolean, default: true },
  actionGroupDefinitions: { type: Array, default: null },
  actionDefinitions: { type: Array, default: () => [] },
  texts: { type: Object, default: () => ({}) },
});

const defaultTexts = {
  close: 'Aizvērt',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, defaultTexts, 'LxModal'));

const emits = defineEmits(['close', 'actionClick']);

const nativeModal = ref();
const isOpen = ref(false);
const isOpenModal = ref(false);
const modalRef = ref();
const insideModal = ref(true);
const modalHeader = ref();
const modalContent = ref();
const modalFooter = ref();

const headerSize = useElementSize(modalHeader, undefined, { box: 'border-box' });
const footerSize = useElementSize(modalFooter, undefined, { box: 'border-box' });

const { top: topShadowOpacity, bottom: bottomShadowOpacity } = useScrollShadows(modalContent);

let returnFocusElement = null;

const { activate, deactivate, pause, unpause } = useFocusTrap(modalRef, {
  allowOutsideClick: true,
  initialFocus: false,
  escapeDeactivates: false, // handled manually
  setReturnFocus: (nodeFocusedBeforeActivation) =>
    returnFocusElement?.isConnected ? returnFocusElement : nodeFocusedBeforeActivation,
});

function open() {
  if (isOpen.value || isOpenModal.value) {
    return;
  }
  returnFocusElement = document.activeElement;
  if (props.kind === 'default') {
    isOpen.value = true;

    nextTick(() => {
      activate();
      modalRef.value.focus();
    });
  } else {
    isOpenModal.value = true;

    nextTick(() => {
      const dialogId = document.getElementById(props.id);
      dialogId.showModal();
      modalRef.value = dialogId;
      nextTick(() => {
        activate();
        modalRef.value.focus();
      });
    });
  }
}

function close(source = null) {
  if (props.kind === 'default') {
    if ((source === 'esc' && !props.escEnabled) || isOpen.value === false) {
      return;
    }
    isOpen.value = false;
    emits('close');
  } else {
    if (isOpenModal.value === false) {
      return;
    }
    nativeModal.value?.close();
    isOpenModal.value = false;
    emits('close');
  }
  deactivate();
}

function handleKeyDown(event) {
  if (event.key === 'Escape') {
    if (props.escEnabled) {
      close('esc');
    } else {
      event.preventDefault();
    }
  }
}

function handleActionClick(action) {
  if (action?.kind === 'secondary' && props.buttonSecondaryIsCancel) {
    close();
    return;
  }
  emits('actionClick', action?.id);
}

const actionDefinitionsResolved = computed(
  () =>
    flattenNestedActions(
      resolveActionGroups(props.actionDefinitions, props.actionGroupDefinitions),
      { inheritKind: true }
    ) || []
);

const actionDefinitionsDisplay = computed(() => {
  let primary =
    actionDefinitionsResolved.value?.filter((action) => action?.kind === 'primary') || [];
  if (primary.length === 0) {
    primary = actionDefinitionsResolved.value?.filter((action) => !action?.kind) || [];
  }
  const secondary =
    actionDefinitionsResolved.value?.filter((action) => action?.kind === 'secondary') || [];

  const env = useLx().getGlobals()?.environment;
  if (primary.length > 1) {
    logWarn(
      `LxModal [${props.id}]: Only one primary action is allowed. All other primary actions will be ignored`,
      env
    );
  }
  if (secondary.length > 1) {
    logWarn(
      `LxModal [${props.id}]: Only one secondary action is allowed. All other secondary actions will be ignored`,
      env
    );
  }
  return [...primary.slice(0, 1), ...secondary.slice(0, 1)];
});

const topOutOfBounds = computed(() => {
  if (!modalContent.value || !modalHeader.value)
    return '--modal-top-shadow-opacity: 0; --modal-header-size: var(--row-size);';
  return `--modal-top-shadow-opacity: ${topShadowOpacity.value}; --modal-header-size: ${headerSize.height?.value}px;`;
});

const bottomOutOfBounds = computed(() => {
  if (!modalContent.value || !modalFooter.value)
    return '--modal-bottom-shadow-opacity: 0; --modal-footer-size: var(--row-size);';
  return `--modal-bottom-shadow-opacity: ${bottomShadowOpacity.value}; --modal-footer-size: ${footerSize.height?.value}px;`;
});

function ifModalsExist() {
  const modalsContainer = document.getElementById('modals');
  return modalsContainer && modalsContainer.children.length > 0;
}

watch([isOpen, isOpenModal], ([newIsOpen, newIsOpenModal]) => {
  if (newIsOpen || newIsOpenModal) {
    nextTick(() => {
      if (modalContent.value) {
        modalContent.value.scrollTop = 0;
      }
    });
    document.body.classList.add('no-scroll-modal');
  }
  nextTick(() => {
    if (!newIsOpen && !ifModalsExist()) {
      document.body.classList.remove('no-scroll-modal');
    }
  });
});

onUnmounted(() => {
  if (!ifModalsExist()) {
    document.body.classList.remove('no-scroll-modal');
  }
});

provide('insideModal', insideModal);
// Reset form context inherited from an ancestor LxForm; a nested LxForm re-provides it as true.
provide('insideForm', ref(false));
provide('parentFocusTrap', { pause, unpause });

defineExpose({ open, close });
</script>
<template>
  <teleport
    to="#modals"
    v-if="(kind === 'default' && isOpen) || (kind === 'native' && isOpenModal)"
  >
    <div>
      <div
        v-if="isOpen && kind === 'default'"
        class="lx-curtain"
        :class="[{ 'lx-visible': isOpen }]"
        ref="modalRef"
        tabindex="-1"
        @keydown.esc="close('esc')"
      >
        <div
          :id="id"
          class="lx-modal lx-region-component"
          :class="[
            { 'lx-modal-s': size === 's' || size === 'default' },
            { 'lx-modal-m': size === 'm' },
            { 'lx-modal-l': size === 'l' },
            { 'lx-modal-xl': size === 'xl' },
          ]"
          :style="`${topOutOfBounds}; ${bottomOutOfBounds}`"
          role="dialog"
          :aria-labelledby="`${id}-label`"
        >
          <header ref="modalHeader" class="lx-shadow-bottom">
            <div :id="`${id}-label`" class="lx-primary" v-tooltip="label">{{ label }}</div>
            <LxButton
              v-if="!disableClosing"
              :id="`${id}-close-button`"
              icon="close"
              kind="ghost"
              :label="displayTexts.close"
              variant="icon-only"
              @click="close()"
            />
          </header>

          <article class="lx-main" ref="modalContent" tabindex="-1">
            <slot />
          </article>

          <footer
            ref="modalFooter"
            class="lx-button-set lx-shadow-top"
            :class="[
              {
                'lx-two-buttons': actionDefinitionsDisplay?.length === 2,
              },
            ]"
          >
            <LxActionButton
              v-for="action in actionDefinitionsDisplay"
              :key="action?.id"
              :action="action"
              :confirmable="false"
              :omit="['icon', 'iconSet', 'variant']"
              :id="`${id}-action-${action?.id}`"
              @click="handleActionClick(action)"
            />
          </footer>

          <!-- Fallback focus anchor for focus trapping -->
          <div
            v-if="disableClosing && actionDefinitionsDisplay?.length === 0"
            class="lx-invisible"
            aria-hidden="true"
            tabindex="0"
          ></div>
        </div>
      </div>

      <div v-if="kind === 'native'" :class="[{ 'lx-visible': isOpenModal }]">
        <dialog
          ref="nativeModal"
          :id="id"
          class="lx-modal lx-region-component"
          :class="[
            { 'lx-modal-s': size === 's' || size === 'default' },
            { 'lx-modal-m': size === 'm' },
            { 'lx-modal-l': size === 'l' },
            { 'lx-modal-xl': size === 'xl' },
          ]"
          tabindex="-1"
          :style="`${topOutOfBounds}; ${bottomOutOfBounds}`"
          :aria-labelledby="`${id}-label`"
          @close="close"
          @keydown="handleKeyDown"
        >
          <header ref="modalHeader" class="lx-shadow-bottom">
            <p :id="`${id}-label`" class="lx-primary">{{ label }}</p>
            <LxButton
              v-if="!disableClosing"
              :id="`${id}-close-button`"
              icon="close"
              kind="ghost"
              :label="displayTexts.close"
              variant="icon-only"
              @click="close()"
            />
          </header>

          <article class="lx-main" ref="modalContent" tabindex="-1">
            <slot />
          </article>

          <footer
            ref="modalFooter"
            class="lx-button-set lx-shadow-top"
            :class="[
              {
                'lx-two-buttons': actionDefinitionsDisplay?.length === 2,
              },
            ]"
          >
            <LxActionButton
              v-for="action in actionDefinitionsDisplay"
              :key="action?.id"
              :action="action"
              :confirmable="false"
              :omit="['icon', 'iconSet', 'variant']"
              :id="`${id}-action-${action?.id}`"
              @click="handleActionClick(action)"
            />
          </footer>

          <!-- Fallback focus anchor for focus trapping -->
          <div
            v-if="disableClosing && actionDefinitionsDisplay?.length === 0"
            class="lx-invisible"
            aria-hidden="true"
            tabindex="0"
          ></div>
        </dialog>
      </div>
    </div>
  </teleport>
</template>
