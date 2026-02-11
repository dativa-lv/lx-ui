<script setup lang="ts">
import { ref, nextTick, provide, computed, watch } from 'vue';
import LxButton from '@/components/Button.vue';
import { logWarn } from '@/utils/devUtils';
import useLx from '@/hooks/useLx';
import { generateUUID } from '@/utils/stringUtils';
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap';
import { useElementSize, useScroll } from '@vueuse/core';
import { getDisplayTexts } from '@/utils/generalUtils';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  label: { type: String, default: '' },
  size: { type: String, default: 'default' }, // default, s, m, l, xl
  disableClosing: { type: Boolean, default: false },
  kind: { type: String, default: 'default' }, // default, native
  escEnabled: { type: Boolean, default: true },
  buttonSecondaryIsCancel: { type: Boolean, default: true },
  actionDefinitions: { type: Array, default: () => [] },
  texts: { type: Object, default: () => ({}) },
});

const defaultTexts = {
  close: 'Aizvērt',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, defaultTexts));

const emits = defineEmits(['close', 'actionClick']);

const nativeModal = ref();
const isOpen = ref(false);
const isOpenModal = ref(false);
const modalRef = ref();
const insideModal = ref(true);
const modalHeader = ref();
const modalContent = ref();
const modalFooter = ref();

const headerSize = useElementSize(modalHeader);
const footerSize = useElementSize(modalFooter);

const { y: scrollYPos } = useScroll(modalContent);

const { activate, deactivate, pause, unpause } = useFocusTrap(modalRef, {
  allowOutsideClick: true,
  initialFocus: false,
  escapeDeactivates: false, // handled manually
});

function open() {
  if (isOpen.value) {
    return;
  }
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
      isOpenModal.value = false;
      deactivate();
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

const actionDefinitionsDisplay = computed(() => {
  let primary = props.actionDefinitions?.filter((action) => action?.kind === 'primary') || [];
  if (primary.length === 0) {
    primary = props.actionDefinitions?.filter((action) => !action?.kind) || [];
  }
  const secondary = props.actionDefinitions?.filter((action) => action?.kind === 'secondary') || [];

  const env = useLx().getGlobals()?.environment;
  if (primary.length > 1) {
    logWarn(
      'LxModal: Only one primary action is allowed. All other primary actions will be ignored.',
      env
    );
  }
  if (secondary.length > 1) {
    logWarn(
      'LxModal: Only one secondary action is allowed. All other secondary actions will be ignored.',
      env
    );
  }
  return [...primary.slice(0, 1), ...secondary.slice(0, 1)];
});

const topOutOfBounds = computed(() => {
  const keyOpacity = '--modal-top-shadow-opacity';
  const keySize = '--modal-header-size';
  const limit = 100;
  const size = headerSize.height?.value;

  if (!modalContent.value || !modalHeader.value)
    return `${keyOpacity}: 0; ${keySize}: var(--row-size);`;

  const scrollTop = scrollYPos.value || 0;

  if (scrollTop > limit) {
    return `${keyOpacity}: 1; ${keySize}: ${size}px;`;
  }
  if (scrollTop > 0) {
    return `${keyOpacity}: ${scrollTop / limit}; ${keySize}: ${size}px;`;
  }
  return `${keyOpacity}: 0; ${keySize}: ${size}px;`;
});

const bottomOutOfBounds = computed(() => {
  const keyOpacity = '--modal-bottom-shadow-opacity';
  const keySize = '--modal-footer-size';
  const limit = 100;
  const size = footerSize.height?.value;

  if (!modalContent.value || !modalFooter.value)
    return `${keyOpacity}: 0; ${keySize}: var(--row-size);`;

  const maxScrollDistance = modalContent.value.scrollHeight - modalContent.value.clientHeight;
  const scrollTop = scrollYPos.value || 0;
  const v = maxScrollDistance - scrollTop;

  if (v > limit) {
    return `${keyOpacity}: 1; ${keySize}: ${size}px;`;
  }
  if (v > 0) {
    return `${keyOpacity}: ${v / limit}; ${keySize}: ${size}px;`;
  }
  return `${keyOpacity}: 0; ${keySize}: ${size}px;`;
});

watch([isOpen, isOpenModal], ([newIsOpen, newIsOpenModal]) => {
  if (newIsOpen || newIsOpenModal) {
    nextTick(() => {
      if (modalContent.value) {
        scrollYPos.value = 0;
      }
    });
  }
});

provide('insideModal', insideModal);
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
          class="lx-modal"
          :class="[
            { 'lx-modal-s': size === 's' || size === 'default' },
            { 'lx-modal-m': size === 'm' },
            { 'lx-modal-l': size === 'l' },
            { 'lx-modal-xl': size === 'xl' },
          ]"
          :style="`${topOutOfBounds}; ${bottomOutOfBounds}`"
        >
          <header ref="modalHeader">
            <p class="lx-primary" :title="label">{{ label }}</p>
            <LxButton
              v-if="!disableClosing"
              icon="close"
              kind="ghost"
              :label="displayTexts.close"
              variant="icon-only"
              @click="close()"
            />
          </header>

          <article class="lx-main" ref="modalContent">
            <slot />
          </article>

          <footer
            ref="modalFooter"
            class="lx-button-set"
            :class="[
              {
                'lx-two-buttons': actionDefinitionsDisplay?.length === 2,
              },
            ]"
          >
            <LxButton
              v-for="action in actionDefinitionsDisplay"
              :key="action?.id"
              :id="`${id}-action-${action?.id}`"
              :label="action?.name || action?.label"
              :title="action?.title || action?.tooltip"
              :kind="action?.kind"
              :loading="action?.loading"
              :busy="action?.busy"
              :destructive="action?.destructive"
              :active="action?.active"
              :disabled="action?.disabled"
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
          class="lx-modal"
          :class="[
            { 'lx-modal-s': size === 's' || size === 'default' },
            { 'lx-modal-m': size === 'm' },
            { 'lx-modal-l': size === 'l' },
            { 'lx-modal-xl': size === 'xl' },
          ]"
          tabindex="-1"
          :style="`${topOutOfBounds}; ${bottomOutOfBounds}`"
          @close="close"
          @keydown="handleKeyDown"
        >
          <header ref="modalHeader">
            <p class="lx-primary">{{ label }}</p>
            <LxButton
              v-if="!disableClosing"
              icon="close"
              kind="ghost"
              :label="displayTexts.close"
              variant="icon-only"
              @click="close()"
            />
          </header>

          <article class="lx-main" ref="modalContent">
            <slot />
          </article>

          <footer
            ref="modalFooter"
            class="lx-button-set"
            :class="[
              {
                'lx-two-buttons': actionDefinitionsDisplay?.length === 2,
              },
            ]"
          >
            <LxButton
              v-for="action in actionDefinitionsDisplay"
              :key="action?.id"
              :id="`${id}-action-${action?.id}`"
              :kind="action?.kind"
              :label="action?.name || action?.label"
              :title="action?.title"
              :loading="action?.loading"
              :busy="action?.busy"
              :destructive="action?.destructive"
              :disabled="action?.disabled"
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
