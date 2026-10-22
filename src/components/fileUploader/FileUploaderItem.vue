<script setup>
import { ref, computed, watch } from 'vue';
import { useElementSize } from '@vueuse/core';
import * as fileUploaderUtils from '@/utils/fileUploaderUtils';
import { getDisplayTexts } from '@/utils/generalUtils';
import LxButton from '@/components/Button.vue';
import LxLoader from '@/components/Loader.vue';
import LxIcon from '@/components/Icon.vue';
import LxBadge from '@/components/Badge.vue';

const props = defineProps({
  customItem: { type: Object, default: () => ({}) },
  mode: { type: String, default: 'default' }, // default, compact
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  readOnly: { type: Boolean, default: false },
  hasDownloadButton: { type: Boolean, default: false },
  showMeta: { type: Boolean, default: true },
  defaultIcon: { type: String, default: 'file' },
  additionalIconAndType: { type: Array, default: null },
  imagePreview: { type: String, default: null },
  isUploading: { type: Boolean, default: false },
  texts: { type: Object, default: () => ({}) },
});

const textsDefault = {
  metaAdditionalInfoSizeTitle: 'Izmērs',
  metaAdditionalInfoExtensionTitle: 'Paplašinājums',
  metaAdditionalInfoResolutionTitle: 'Izšķirtspēja',
  metaAdditionalInfoFileCountTitle: 'Datņu skaits',
  metaAdditionalInfoFileCountLabelSingle: 'datne',
  metaAdditionalInfoFileCountLabelMulti: 'datnes',
  metaAdditionalInfoPageCountTitle: 'Lappušu skaits',
  metaAdditionalInfoSlideCountTitle: 'Slaidu skaits',
  metaAdditionalInfoPageCountLabelSingle: 'lappuse',
  metaAdditionalInfoPageCountLabelMulti: 'lappuses',
  metaAdditionalInfoSlideCountLabelSingle: 'slaids',
  metaAdditionalInfoSlideCountLabelMulti: 'slaidi',
  download: 'Lejupielādēt',
  clear: 'Noņemt',
  infoButton: 'Informācija',
  metaPreviewLabel: 'Priekšskatījums',
  metaPreviewDescription: 'priekšskatījums',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault, 'LxFileUploader'));

const emits = defineEmits(['downloadFile', 'openModal', 'removeFile']);
const isCompact = computed(() => props.mode === 'compact');
const isInvalid = computed(() => props.customItem.state === 'invalid');
const isItemBusy = computed(
  () => props.customItem.state === 'busy' || props.customItem.state === 'loading'
);
const isDisabled = computed(
  () => props.disabled || props.loading || props.busy || isItemBusy.value
);
const isDownloadInteractive = computed(() => props.hasDownloadButton && !isDisabled.value);
const invalidationMessageId = computed(() =>
  !isCompact.value && isInvalid.value && props.customItem.invalidDescription
    ? `${props.customItem.id}-invalidation-message`
    : null
);
const compactMetaText = computed(() =>
  [
    fileUploaderUtils.convertBytesToFormattedString(props.customItem.meta?.size),
    fileUploaderUtils.getFileExtension(props.customItem.meta?.name),
    fileUploaderUtils.getExtraParameter(props.customItem.meta, displayTexts.value),
  ]
    .filter(Boolean)
    .join('; ')
);

function getBadgeClasses(item, index) {
  return [
    { 'lx-compact-badge': isCompact.value },
    { 'lx-second-badge': index === 1 },
    { 'lx-third-badge': index === 2 },
    { 'lx-pass-protected-badge': item.type === 'pass-protected' },
    { 'lx-esign-badge': item.type === 'esign' },
    { 'lx-c2pa-sign-badge': item.type === 'c2pa-sign' },
    { 'lx-created-using-ai-badge': item.type === 'created-using-ai' },
  ];
}
const loaderValue = ref(props.customItem.value);

watch(
  () => props.customItem.value,
  (value) => {
    loaderValue.value = value;
  },
  { immediate: true }
);

function downloadFile(id) {
  if (!isDisabled.value) {
    emits('downloadFile', id);
  }
}
function openModal(id) {
  if (!isDisabled.value) {
    emits('openModal', id);
  }
}
function removeFile(id) {
  if (!isDisabled.value) {
    emits('removeFile', id);
  }
}
const wrapperContainer = ref();

const containerElementSize = useElementSize(wrapperContainer);
const infoButtonVariant = computed(() => {
  if (containerElementSize.width.value < 300) {
    return 'icon-only';
  }
  return 'default';
});

const reactiveContainerElementWidth = computed(() => containerElementSize.width.value);

const additionalInfoTitle = computed(() => {
  if (props.customItem.meta?.type?.startsWith('image/')) {
    return displayTexts.value.metaAdditionalInfoResolutionTitle;
  }
  if (props.customItem.meta?.type?.endsWith('/zip')) {
    return displayTexts.value.metaAdditionalInfoFileCountTitle;
  }
  if (props.customItem.meta?.type?.endsWith('.document')) {
    return displayTexts.value.metaAdditionalInfoPageCountTitle;
  }
  if (props.customItem.meta?.type?.endsWith('.presentation')) {
    return displayTexts.value.metaAdditionalInfoSlideCountTitle;
  }
  return '';
});
</script>
<template>
  <div
    class="lx-file-wrapper"
    :class="{
      'lx-invalid': isInvalid,
      'lx-disabled': isDisabled,
    }"
    data-container="file-uploader-item"
    :id="customItem.id"
    ref="wrapperContainer"
  >
    <!-- Mirrors the LxListItem structure, so the row is laid out and styled by the LxList tokens -->
    <div class="lx-file-main-part">
      <div
        v-if="isCompact && isUploading && !props.imagePreview"
        class="lx-skeleton-file-preview"
      />
      <div
        v-else
        class="lx-list-item"
        :class="{
          'lx-list-item-interactive': props.hasDownloadButton,
          'lx-list-item-disabled': isDisabled,
          'lx-invalid': isInvalid,
        }"
        :tabindex="isDownloadInteractive ? 0 : -1"
        :role="props.hasDownloadButton ? 'button' : null"
        :aria-label="
          props.hasDownloadButton ? `${displayTexts.download} ${props.customItem.name}` : null
        "
        :aria-disabled="props.hasDownloadButton && !isDownloadInteractive"
        v-tooltip="props.hasDownloadButton ? displayTexts.download : ''"
        :aria-invalid="isInvalid"
        :aria-errormessage="invalidationMessageId"
        :aria-describedby="invalidationMessageId"
        @keyup.space="downloadFile(props.customItem.id)"
        @keyup.enter="downloadFile(props.customItem.id)"
        @keydown.space.prevent
        @click="downloadFile(props.customItem.id)"
      >
        <div class="lx-category-displayer" />
        <header>
          <div class="lx-file-name-wrapper">
            <p class="lx-primary">{{ props.customItem.name }}</p>
            <template v-if="isCompact && props.additionalIconAndType?.length > 0">
              <LxBadge
                v-for="(item, index) in props.additionalIconAndType"
                :key="item.id"
                :icon="item.icon"
                :tooltip="item.title"
                :class="getBadgeClasses(item, index)"
              />
            </template>
          </div>
          <p v-if="isCompact" class="lx-secondary">{{ compactMetaText }}</p>
        </header>
        <div class="lx-invalidation-icon-wrapper" v-if="isInvalid">
          <LxIcon value="invalid" customClass="lx-invalidation-icon" />
        </div>
        <div class="compact-actions" v-if="props.hasDownloadButton">
          <div class="lx-list-icon-wrapper">
            <LxIcon value="download" customClass="lx-list-icon" />
          </div>
        </div>
      </div>

      <div class="lx-file-indicators" v-if="isItemBusy || props.customItem.state === 'draft'">
        <LxLoader
          v-if="isItemBusy"
          :kind="props.customItem.loaderKind"
          v-model="loaderValue"
          :faked="props.customItem.faked"
          :faked-duration="props.customItem.fakedDuration"
          :loading="true"
          size="s"
        />
        <div v-else class="lx-draft-indicator" />
      </div>

      <div class="lx-list-item-actions" v-if="!props.readOnly">
        <LxButton
          v-if="isCompact && props.showMeta"
          :id="`${customItem.id}-info-button`"
          kind="ghost"
          variant="icon-only"
          icon="info"
          :label="displayTexts.infoButton"
          :disabled="props.disabled || props.busy || isItemBusy"
          :loading="props.loading"
          @click="openModal(props.customItem.id)"
        />
        <LxButton
          :id="`${customItem.id}-remove-button`"
          kind="ghost"
          variant="icon-only"
          icon="remove"
          :label="displayTexts.clear"
          :destructive="true"
          :disabled="props.disabled || props.busy || isItemBusy"
          :loading="props.loading"
          @click="removeFile(props.customItem.id)"
        />
      </div>
    </div>

    <div class="lx-file-additional-part" v-if="!isCompact">
      <div
        class="lx-file-state-info"
        v-if="props.customItem.invalidDescription || props.customItem.description"
      >
        <div
          class="lx-invalidation-message"
          v-if="props.customItem.invalidDescription"
          :id="`${props.customItem.id}-invalidation-message`"
        >
          {{ props.customItem.invalidDescription }}
        </div>
        <p v-if="props.customItem.description" class="lx-secondary">
          {{ props.customItem.description }}
        </p>
      </div>

      <div
        class="lx-uploaded-file-preview-wrapper"
        :class="{ 'small-preview': reactiveContainerElementWidth < 280 }"
      >
        <div class="lx-file-preview-wrapper">
          <div class="lx-skeleton-file-preview" v-if="isUploading && !props.imagePreview" />
          <div class="lx-file-preview" v-else>
            <LxIcon v-if="!props.imagePreview" customClass="lx-icon" :value="props.defaultIcon" />

            <template v-if="props.additionalIconAndType?.length > 0">
              <LxBadge
                v-for="(item, index) in props.additionalIconAndType"
                :key="item.id"
                :icon="item.icon"
                :tooltip="item.title"
                :class="getBadgeClasses(item, index)"
              />
            </template>

            <img
              v-if="props.imagePreview"
              :src="props.imagePreview"
              :alt="
                customItem?.name
                  ? `${customItem?.name} ${displayTexts.metaPreviewDescription}`
                  : displayTexts.metaPreviewLabel
              "
            />
            <div
              class="lx-file-info-button"
              :class="{ 'lx-icon-only-button': infoButtonVariant === 'icon-only' }"
              v-if="props.showMeta && reactiveContainerElementWidth < 280"
            >
              <LxButton
                :id="`${customItem.id}-info-button`"
                kind="ghost"
                :label="displayTexts.infoButton"
                :disabled="props.disabled || props.busy || isItemBusy"
                :loading="props.loading"
                icon="info"
                :variant="infoButtonVariant"
                @click="openModal(props.customItem.id)"
              />
            </div>
          </div>
        </div>
        <div class="lx-file-addition-data-wrapper">
          <div class="lx-file-meta" v-if="props.customItem.meta">
            <p class="lx-data" v-tooltip="displayTexts.metaAdditionalInfoSizeTitle">
              {{ fileUploaderUtils.convertBytesToFormattedString(props.customItem.meta?.size) }}
            </p>
            <p class="lx-data" v-tooltip="displayTexts.metaAdditionalInfoExtensionTitle">
              {{ fileUploaderUtils.getFileExtension(props.customItem.name) }}
            </p>
            <p
              class="lx-data meta-description"
              v-tooltip="
                additionalInfoTitle ||
                fileUploaderUtils.getExtraParameter(props.customItem.meta, displayTexts)
              "
              v-if="fileUploaderUtils.getExtraParameter(props.customItem.meta, displayTexts)"
            >
              {{ fileUploaderUtils.getExtraParameter(props.customItem.meta, displayTexts) }}
            </p>
          </div>
          <div v-else></div>
          <div
            class="lx-file-info-button"
            :class="{ 'lx-icon-only-button': infoButtonVariant === 'icon-only' }"
          >
            <LxButton
              v-if="props.showMeta"
              :id="`${customItem.id}-info-button`"
              kind="ghost"
              :label="displayTexts.infoButton"
              :disabled="props.disabled || props.busy || isItemBusy"
              :loading="props.loading"
              icon="info"
              :variant="infoButtonVariant"
              @click="openModal(props.customItem.id)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
