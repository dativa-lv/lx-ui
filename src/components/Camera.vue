<script setup>
import {
  ref,
  onMounted,
  watch,
  computed,
  onUnmounted,
  inject,
  getCurrentInstance,
  nextTick,
} from 'vue';
import LxButton from '@/components/Button.vue';
import LxToolbar from '@/components/Toolbar.vue';
import LxEmptyState from '@/components/EmptyState.vue';
import LxLoader from '@/components/Loader.vue';
import { lxDevUtils } from '@/utils';
import { generateUUID } from '@/utils/stringUtils';
import { getDisplayTexts } from '@/utils/generalUtils';
import useLx from '@/hooks/useLx';
import { registerBuilderInstance } from '@/utils/builderUtils';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  modelValue: { type: String, default: null },
  cameraSwitcherMode: {
    type: String,
    default: 'toggle',
    options: ['toggle', 'list'],
    group: 'main',
    sequence: 1,
  }, // toggle || list
  hasFlashlightToggle: { type: Boolean, default: false, group: 'main', sequence: 2 },
  imageSize: {
    type: String,
    default: 'default',
    options: ['default', 'max'],
    group: 'main',
    sequence: 3,
  }, // default || max
  preferencesId: { type: String, default: 'lx-camera-settings' },
  labelId: { type: String, default: null },
  actionDefinitions: { type: Array, default: () => [] },
  texts: { type: Object, default: () => ({}) },
  builderOptions: {
    type: Object,
    default: () => ({
      innerComponent: false,
      componentStack: null,
      schemaPath: null,
      useRegistry: false,
    }),
  },
});

const textsDefault = {
  errorLabel: 'Notika kļūda',
  errorDescription: 'Nav piešķirta atļauja izmantot kameru',
  reloadPage: 'Pārlādēt lapu',
  changeCamera: 'Mainīt kameru',
  takePhoto: 'Uzņemt attēlu',
  deletePhoto: 'Mēģināt vēlreiz',
  toggleFlashlight: 'Zibspuldze',
  photoTaken: 'Attēls uzņemts',
  photoDeleted: 'Attēls dzēsts',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));

const system = useLx().getGlobals()?.systemId;

const emits = defineEmits(['update:modelValue', 'actionClick']);

const model = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emits('update:modelValue', value);
  },
});

const video = ref(null);
const canvas = ref(null);
const error = ref(false);
const loading = ref(true);
const announcementMessage = ref('');

const flashlight = ref(false);
const cameraHasFlashlight = ref(false);

function announce(message) {
  announcementMessage.value = '';
  nextTick(() => {
    announcementMessage.value = message;
  });
}

function captureImage() {
  const context = canvas.value.getContext('2d');
  if (props.imageSize === 'default') {
    canvas.value.width = video.value.videoWidth;
    canvas.value.height = video.value.videoHeight;
  }
  context.drawImage(video.value, 0, 0, canvas.value.width, canvas.value.height);
  model.value = canvas.value.toDataURL('image/jpeg');
  announce(displayTexts.value.photoTaken);
}

function deleteImage() {
  model.value = null;
  announce(displayTexts.value.photoDeleted);
}

const camerasList = ref([]);
const selectedCamera = ref({});
let stream = null;

async function getCameraDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const camerasListRaw = devices.filter((device) => device.kind === 'videoinput');
    camerasList.value = camerasListRaw;
  } catch (error_) {
    lxDevUtils.logError('Error getting camera devices', error_);
  }
}

async function stopStream() {
  if (stream) {
    stream.getTracks().forEach((track) => {
      track.stop();
    });
    stream = null;
  }
}

function initializeSwitching() {
  error.value = false;
  loading.value = true;
}

function getCameraConstraints(val) {
  if (props.cameraSwitcherMode === 'list') {
    selectedCamera.value = val || camerasList.value?.[0];
    return {
      video: selectedCamera.value?.deviceId ? { deviceId: selectedCamera.value.deviceId } : true,
    };
  }

  if (props.cameraSwitcherMode === 'toggle') {
    selectedCamera.value =
      !selectedCamera.value?.facingMode || selectedCamera.value?.facingMode === 'environment'
        ? { facingMode: 'user' }
        : { facingMode: 'environment' };

    return { video: { facingMode: selectedCamera.value?.facingMode || 'environment' } };
  }

  return { video: true };
}

function saveCameraSettings(constraints) {
  localStorage.setItem(
    `${system}-${props.preferencesId}`,
    JSON.stringify({ camera: constraints?.video, flashlight: flashlight.value })
  );
}

async function startCameraStream(constraints) {
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.value.srcObject = stream;
    saveCameraSettings(constraints);
  } catch {
    error.value = true;
  }
}

function applyStreamSettings(track, capabilities) {
  if (props.imageSize === 'max') {
    canvas.value.width = capabilities.width.max;
    canvas.value.height = capabilities.height.max;
  }

  if (props.hasFlashlightToggle) {
    cameraHasFlashlight.value = capabilities.torch || false;
    if (cameraHasFlashlight.value) {
      track.applyConstraints({ advanced: [{ torch: flashlight.value }] });
    }
  }
}

async function updateCameraSettings() {
  if (camerasList.value?.length <= 1) await getCameraDevices();
  if (!stream || (!props.hasFlashlightToggle && props.imageSize !== 'max')) return;

  const track = stream.getVideoTracks()[0];
  const capabilities = track.getCapabilities();

  applyStreamSettings(track, capabilities);
}

function handleCameraError() {
  error.value = true;
  lxDevUtils.logError('Error switching cameras', useLx().getGlobals()?.environment);
}

async function switchCamera(val) {
  await stopStream();
  await getCameraDevices();

  try {
    initializeSwitching();

    const constraints = getCameraConstraints(val);
    await startCameraStream(constraints);
    await updateCameraSettings();
  } catch (error_) {
    handleCameraError();
  } finally {
    loading.value = false;
  }
}

async function changeCamera(actionId) {
  const camera = camerasList.value.find((x) => x?.deviceId === actionId);
  if (camera) {
    await switchCamera(camera);
  }
}

function handleActionClick(actionId) {
  if (actionId === 'refresh') {
    localStorage.removeItem(`${system}-${props.preferencesId}`);
    globalThis.location.reload();
  }
}

function isSingleInvalidCamera() {
  return camerasList.value?.length === 1 && camerasList.value[0].deviceId === '';
}

function setCameraError() {
  loading.value = false;
  error.value = true;
}

function getStoredCameraSettings() {
  const settings = localStorage.getItem(`${system}-${props.preferencesId}`);
  return settings ? JSON.parse(settings) : null;
}

function determineCameraMode(settingsObj) {
  selectedCamera.value =
    settingsObj?.camera?.facingMode === 'user'
      ? { facingMode: 'environment' }
      : { facingMode: 'user' };
}

async function initializeCameraSettings(settingsObj) {
  if (settingsObj?.camera?.facingMode) {
    determineCameraMode(settingsObj);
    await switchCamera();
  } else {
    await switchCamera(settingsObj?.camera);
  }

  if (settingsObj?.flashlight) {
    flashlight.value = true;
  }
}

const rowId = inject('rowId', ref(null));
const labelledBy = computed(() => props.labelId || rowId.value);

const toolbarActions = computed(() => {
  const actionsDefault = [];

  if (props.hasFlashlightToggle && cameraHasFlashlight.value && !loading.value && !error.value) {
    actionsDefault.push({
      id: 'flashlight',
      name: displayTexts.value.toggleFlashlight,
      title: displayTexts.value.toggleFlashlight,
      groupId: 'flashlight',
      area: 'right',
      kind: 'toggle',
      value: flashlight.value,
    });
  }

  if (camerasList.value?.length > 1) {
    if (props.cameraSwitcherMode === 'toggle') {
      actionsDefault.push({
        id: 'switchCamera',
        name: displayTexts.value.changeCamera,
        icon: 'camera-switch',
        groupId: 'switchCamera',
        area: 'right',
      });
    } else if (props.cameraSwitcherMode === 'list') {
      const camerasGroupId = 'camerasList';

      const mainButton = {
        id: 'changeCamera',
        name: displayTexts.value.changeCamera,
        icon: 'menu',
        groupId: 'changeCamera',
        nestedGroupId: camerasGroupId,
        area: 'right',
      };

      const cameras = camerasList.value.map((camera) => ({
        id: `camera-${camera.deviceId}`,
        name: camera.label || camera.deviceId,
        groupId: camerasGroupId,
        active: selectedCamera.value?.deviceId === camera.deviceId,
      }));

      actionsDefault.push(mainButton, ...cameras);
    }
  }

  const actionsExtra = props.actionDefinitions.map((a) => ({ ...a, extra: true }));

  return [...actionsDefault, ...actionsExtra];
});

const toolbarRef = ref(null);

function switchToolbarFocus(actionId) {
  nextTick(() => toolbarRef.value?.focusAction(actionId));
}

async function toolbarActionClick(id, value) {
  if (id === 'flashlight') {
    flashlight.value = value;
  } else if (id === 'switchCamera') {
    await switchCamera();
  } else if (id.startsWith('camera-')) {
    const cameraId = id.replace('camera-', '');
    await changeCamera(cameraId);
  } else {
    emits('actionClick', id, value);
  }
  switchToolbarFocus(id);
}

watch(
  () => flashlight.value,
  (newValue) => {
    if (stream && cameraHasFlashlight.value) {
      const [track] = stream.getVideoTracks();
      track.applyConstraints({ advanced: [{ torch: newValue }] });

      const settings = localStorage.getItem(`${system}-${props.preferencesId}`);
      const settingsObj = JSON.parse(settings);
      settingsObj.flashlight = newValue;

      localStorage.setItem(`${system}-${props.preferencesId}`, JSON.stringify(settingsObj));
    }
  }
);

watch(
  () => props.imageSize,
  (newValue) => {
    if (stream && newValue === 'max') {
      const [track] = stream.getVideoTracks();
      const capabilities = track.getCapabilities();
      canvas.value.width = capabilities.width.max;
      canvas.value.height = capabilities.height.max;
    }
  }
);

watch(
  () => props.cameraSwitcherMode,
  (newVal) => {
    if (newVal === 'toggle') {
      selectedCamera.value = { facingMode: 'user' };
    } else if (newVal === 'list') {
      switchCamera(camerasList.value?.[0]);
    }
  }
);

onMounted(async () => {
  if (isSingleInvalidCamera()) {
    setCameraError();
    return;
  }

  const settings = getStoredCameraSettings();
  if (settings) {
    await initializeCameraSettings(settings);
  } else {
    await switchCamera();
  }
});

onUnmounted(() => {
  stopStream();
});

if (!props.builderOptions?.innerComponent && props.builderOptions?.useRegistry) {
  const instance = getCurrentInstance();
  registerBuilderInstance({
    name: 'LxCamera',
    instance,
    props,
    builderName: props.builderOptions?.schemaPath,
    componentStack: props.builderOptions?.componentStack?.concat([
      { id: props?.id, name: 'LxCamera' },
    ]),
  });
}
</script>

<template>
  <div class="lx-camera" :aria-labelledby="labelledBy" :data-id="id">
    <div
      :id="`${id}-announce`"
      class="lx-invisible"
      aria-live="polite"
      role="status"
      aria-atomic="true"
    >
      {{ announcementMessage }}
    </div>

    <LxToolbar
      ref="toolbarRef"
      v-if="!modelValue"
      :id="`${id}-toolbar`"
      :disabled="error || loading"
      :actionDefinitions="toolbarActions"
      @actionClick="toolbarActionClick"
    />
    <LxLoader :loading="true" v-if="loading" />
    <div v-else-if="error" class="lx-camera-error">
      <LxEmptyState
        :label="displayTexts.errorLabel"
        icon="invalid"
        :description="displayTexts.errorDescription"
        :actionDefinitions="[{ id: 'refresh', name: displayTexts.reloadPage, icon: 'refresh' }]"
        @actionClick="handleActionClick"
      />
    </div>
    <div class="lx-camera-frame" v-show="!error && !loading">
      <!-- eslint-disable-next-line vuejs-accessibility/media-has-caption -->
      <video ref="video" autoplay playsinline muted v-show="!modelValue" />
      <canvas ref="canvas" style="display: none" />
      <img :src="modelValue" alt=" " v-if="modelValue" />
    </div>
    <div class="lx-camera-buttons" v-if="!error && !loading">
      <LxButton
        v-if="!modelValue"
        icon="camera"
        :label="displayTexts.takePhoto"
        @click="captureImage"
      />
      <LxButton
        v-else
        icon="cancel"
        :label="displayTexts.deletePhoto"
        kind="tertiary"
        @click="deleteImage"
      />
    </div>
  </div>
</template>
