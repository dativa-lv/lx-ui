, group: 'main'
<script setup>
import { ref, onMounted, onUnmounted, watch, computed, inject, getCurrentInstance } from 'vue';
import { useThrottleFn } from '@vueuse/core';
import { logError, logWarn } from '@/utils/devUtils';
import useLx from '@/hooks/useLx';
import { getDisplayTexts } from '@/utils/generalUtils';
import LxButton from '@/components/Button.vue';
import LxToolbar from '@/components/Toolbar.vue';
import LxDropDownMenu from '@/components/DropDownMenu.vue';
import { registerBuilderInstance } from '@/utils/builderUtils';
import { generateUUID } from '@/utils/stringUtils';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  modelValue: { type: String, default: null },
  disabled: { type: Boolean, default: false, group: 'mode', sequence: 1 },
  width: { type: String, default: '500', group: 'additional', sequence: 2 },
  height: { type: String, default: '400', group: 'additional', sequence: 3 },
  instrument: {
    type: String,
    default: 'brush',
    options: ['brush'],
    group: 'additional',
    sequence: 1,
  }, // "brush"
  color: {
    type: String,
    default: 'black',
    options: ['black', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'label'],
    group: 'main',
    sequence: 1,
  }, // "black", "red", "orange", "yellow", "green", "teal", "blue", "purple", "label"
  showInstruments: { type: Boolean, default: false, group: 'main', sequence: 2 },
  showColorPicker: { type: Boolean, default: false, group: 'main', sequence: 3 },
  showClearAll: { type: Boolean, default: false, group: 'main', sequence: 4 },
  labelId: { type: String, default: null },
  actionDefinitions: { type: Array, default: () => [] },
  texts: { type: Object, default: () => ({}) },
  builderOptions: {
    type: Object,
    default: () => ({
      innerComponent: false,
      schemaPath: null,
      componentStack: null,
      useRegistry: false,
    }),
  },
});

const textsDefault = {
  paintbrush: 'Ota',
  color: 'Krāsas izvēle',
  clear: 'Notīrīt visu',
  black: 'Noklusētā krāsa',
  red: 'Sarkans',
  orange: 'Oranžs',
  yellow: 'Dzeltens',
  green: 'Zaļš',
  teal: 'Zilganzaļš',
  blue: 'Zils',
  purple: 'Violets',
  grey: 'Pelēks',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));

const emits = defineEmits([
  'update:modelValue',
  'update:instrument',
  'update:color',
  'actionClick',
]);

const colorsList = ref([
  { id: 1, label: 'black', value: '#000', variable: '--color-data' },
  { id: 2, label: 'red', value: 'rgb(218, 30, 40)', variable: '--color-red' },
  { id: 3, label: 'orange', value: 'rgb(255, 131, 43)', variable: '--color-orange' },
  { id: 4, label: 'yellow', value: '#f1c21b', variable: '--color-yellow' },
  { id: 5, label: 'green', value: 'rgb(25, 128, 56)', variable: '--color-green' },
  { id: 6, label: 'teal', value: '#00b8d9', variable: '--color-teal' },
  { id: 7, label: 'blue', value: '#2684ff', variable: '--color-blue' },
  { id: 8, label: 'purple', value: '#6554c0', variable: '--color-purple' },
  { id: 9, label: 'grey', value: '#6c6c6c', variable: '--color-grey' },
]);

const canvas = ref(null);
const canvasWidth = ref(Math.max(Number.parseInt(props.width || '0', 10), 200));
const canvasHeight = ref(Math.max(Number.parseInt(props.height || '0', 10), 200));
const context = ref(null);
const drawing = ref(false);
const lastX = ref(0);
const lastY = ref(0);
const selectedInstrument = ref(props.instrument);

const strokeWidth = ref(3);
const strokeLineJoint = ref('round');
const paths = ref([]);
const currentPath = ref([]);
const container = ref(null);

let observer = null;

const redrawPaths = () => {
  if (!context.value) return;

  context.value.clearRect(0, 0, canvas.value.width, canvas.value.height);

  paths.value.forEach(({ path, color }) => {
    const p = new Path2D(path);
    context.value.strokeStyle = color;
    context.value.lineWidth = strokeWidth.value;
    context.value.lineJoin = strokeLineJoint.value;
    context.value.stroke(p);
  });
};

const resizeCanvas = () => {
  if (!canvas.value) return;

  const rect = container.value?.getBoundingClientRect();
  if (!rect) return;

  const maxWidth = Math.max(Number.parseInt(props.width || '0', 10), 200);
  const newWidth = Math.min(rect.width, maxWidth);
  canvasWidth.value = newWidth;
  canvas.value.width = newWidth;

  context.value = canvas.value.getContext('2d');

  redrawPaths();
};

const getColorOrVariableByLabel = (label, returnType = 'color') => {
  const colorObj = colorsList.value.find((color) => color.label === label);
  if (returnType === 'color') {
    return colorObj?.value || colorsList.value[0].value;
  }
  return colorObj?.variable || colorsList.value[0].variable;
};

const selectedColorLabel = ref(props.color);
const selectedColor = ref(getColorOrVariableByLabel(selectedColorLabel.value));
const selectedColorVariable = ref(getColorOrVariableByLabel(selectedColorLabel.value, 'variable'));
const backgroundColor = ref('#eee');

const generateSVG = () => {
  if (!canvas.value) return '';

  const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth.value}" height="${canvasHeight.value}">`;
  const svgPaths = paths.value
    .map(
      ({ path, color, variable }) =>
        `<path data-semantic-color="${variable}" fill="none" stroke="${color}" d="${path}" stroke-width="${strokeWidth.value}" stroke-linejoin="${strokeLineJoint.value}"/>`
    )
    .join('');
  const svgFooter = '</svg>';

  return `${svgHeader}<g>${svgPaths}</g>${svgFooter}`;
};

const emitSVG = () => {
  const svgString = generateSVG();
  emits('update:modelValue', svgString);
};

const throttledEmitSVG = useThrottleFn(() => {
  emitSVG();
}, 500);

const startDrawing = (event) => {
  // Left mouse button only
  if (
    (event.pointerType === 'mouse' && event.button !== 0) ||
    props.disabled ||
    selectedInstrument.value !== 'brush'
  )
    return;

  drawing.value = true;
  const { clientX, clientY } = event;
  lastX.value = Math.round(clientX - canvas.value.getBoundingClientRect().left);
  lastY.value = Math.round(clientY - canvas.value.getBoundingClientRect().top);

  currentPath.value = [];
  currentPath.value.push(`M ${lastX.value} ${lastY.value}`);
};

const draw = (event) => {
  if (!drawing.value || !context.value || props.disabled) return;

  const { clientX, clientY } = event;
  const x = Math.round(clientX - canvas.value.getBoundingClientRect().left);
  const y = Math.round(clientY - canvas.value.getBoundingClientRect().top);

  // Avoid adding the same coordinate twice in a row
  if (x !== lastX.value || y !== lastY.value) {
    context.value.beginPath();
    context.value.moveTo(lastX.value, lastY.value);
    context.value.lineTo(x, y);
    context.value.strokeStyle =
      selectedInstrument.value === 'eraser' ? backgroundColor.value : selectedColor.value;
    context.value.lineWidth = selectedInstrument.value === 'eraser' ? 20 : strokeWidth.value;
    context.value.lineJoin = 'round';
    context.value.stroke();

    if (selectedInstrument.value === 'eraser') {
      // TODO: Add eraser logic
    } else {
      currentPath.value.push(`L ${x} ${y}`);
    }

    lastX.value = x;
    lastY.value = y;
  }
};

const stopDrawing = () => {
  if (!drawing.value || !context.value || props.disabled) return;
  drawing.value = false;

  if (currentPath.value.length > 0) {
    paths.value.push({
      path: currentPath.value.join(' '),
      color: selectedColor.value,
      variable: selectedColorVariable.value,
    });
    currentPath.value = [];
  }
  throttledEmitSVG();
};

const updateColor = (color, label, variable) => {
  selectedColor.value = color;
  selectedColorVariable.value = variable;
  emits('update:color', {
    colorLabel: label,
    colorValue: color,
    colorVariable: variable,
  });
};

const updatedInstrument = (instrument) => {
  selectedInstrument.value = instrument;

  if (instrument === 'eraser') {
    context.value.strokeStyle = backgroundColor.value;
  } else {
    context.value.strokeStyle = selectedColor.value;
  }
  emits('update:instrument', instrument);
};

const clearCanvas = () => {
  context.value.clearRect(0, 0, canvas.value?.width || 0, canvas.value?.height || 0);
  paths.value = [];
  emits('update:modelValue', null);
};

const getPng = () => {
  if (!canvas.value) return '';
  return canvas.value.toDataURL('image/png');
};

const toolbarActions = computed(() => {
  const actionsDefault = [];

  if (props.showInstruments) {
    actionsDefault.push({
      id: 'brush',
      name: displayTexts.value.paintbrush,
      icon: 'brush',
      groupId: 'brush',
      area: 'left',
      active: selectedInstrument.value === 'brush',
      nonResponsive: true,
    });
  }

  if (props.showColorPicker) {
    actionsDefault.push({
      id: 'color',
      kind: 'slot',
      groupId: 'color',
      area: 'left',
    });
  }

  if (props.showClearAll) {
    actionsDefault.push({
      id: 'clear',
      name: displayTexts.value.clear,
      icon: 'reset',
      groupId: 'clear',
      area: 'right',
    });
  }

  const actionsBuiltIn = actionsDefault.map((a) => ({ ...a, builtIn: true }));
  const actionsExtra = props.actionDefinitions.map((a) => ({ ...Object(a), extra: true }));

  return [...actionsBuiltIn, ...actionsExtra];
});

function toolbarActionClick(id, value) {
  if (id === 'brush') {
    updatedInstrument('brush');
  } else if (id === 'clear') {
    clearCanvas();
  } else {
    emits('actionClick', id, value);
  }
}

watch(
  [() => props.modelValue, () => props.width, () => props.height],
  ([newSVGData, newWidth, newHeight]) => {
    canvasWidth.value = Math.max(Number.parseInt(newWidth || '0', 10), 200);
    canvasHeight.value = Math.max(Number.parseInt(newHeight || '0', 10), 200);

    if (newWidth) {
      resizeCanvas();
    }

    if (newSVGData) {
      const img = new Image();
      img.src = `data:image/svg+xml;base64,${btoa(newSVGData)}`;
      img.onload = () => {
        context.value.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
        context.value.drawImage(img, 0, 0, canvasWidth.value, canvasHeight.value);

        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(newSVGData, 'image/svg+xml');

        paths.value = Array.from(svgDoc.querySelectorAll('path')).map((pathElement) => {
          const strokeColor = pathElement.getAttribute('stroke') || colorsList.value[0].value;
          const colorDataAttribute =
            pathElement.dataset.semanticColor || colorsList.value[0].variable;

          return {
            path: pathElement.getAttribute('d') || '',
            color: strokeColor,
            variable: colorDataAttribute,
          };
        });
        emitSVG();
      };

      img.onerror = (error) => {
        logError(error, useLx().getGlobals()?.environment);
      };
    }
  },
  { immediate: true }
);

watch(
  () => props.instrument,
  (newInstrument) => {
    selectedInstrument.value = newInstrument;
  }
);

watch(
  () => props.color,
  (newColorLabel) => {
    if (colorsList.value.some((c) => c.label === newColorLabel)) {
      selectedColor.value = getColorOrVariableByLabel(newColorLabel);
      selectedColorLabel.value = newColorLabel;
      selectedColorVariable.value = getColorOrVariableByLabel(newColorLabel, 'variable');
    } else {
      logWarn(
        `Color not found, defaulting to: ${colorsList.value[0].label}`,
        useLx().getGlobals()?.environment
      );

      const defaultColor = colorsList.value[0];
      updateColor(defaultColor.value, defaultColor.label, defaultColor.variable);
    }
  }
);

const rowId = inject('rowId', ref(null));
const labelledBy = computed(() => props.labelId || rowId.value);

onMounted(async () => {
  const maxWidth = Math.max(Number.parseInt(props.width || '0', 10), 200);
  canvasWidth.value = maxWidth;
  canvas.value.width = maxWidth;
  context.value = canvas.value.getContext('2d');

  observer = new ResizeObserver(() => {
    globalThis.requestAnimationFrame(() => {
      resizeCanvas();
    });
  });

  if (container.value) {
    observer.observe(container.value);
  }
});

onUnmounted(() => {
  if (observer && container.value) {
    observer.unobserve(container.value);
  }
});

defineExpose({ getPng });

if (props.builderOptions?.useRegistry) {
  const instance = getCurrentInstance();
  registerBuilderInstance({
    name: 'LxDrawPad',
    instance,
    props,
    builderName: props.builderOptions?.schemaPath,
    componentStack: props.builderOptions?.componentStack?.concat([
      { id: props?.id, name: 'LxDrawPad' },
    ]),
  });
}
</script>

<template>
  <div class="lx-field-wrapper" :data-id="id">
    <div ref="container" class="lx-drawpad-wrapper">
      <LxToolbar
        :disabled="props.disabled"
        :actionDefinitions="toolbarActions"
        @actionClick="toolbarActionClick"
      >
        <template #color>
          <LxDropDownMenu :disabled="props.disabled">
            <LxButton
              icon="color"
              kind="ghost"
              variant="icon-only"
              tabindex="-1"
              :label="displayTexts.color"
              :disabled="props.disabled"
            />
            <template #panel>
              <ul class="lx-color-list">
                <li
                  v-for="color in colorsList"
                  :key="color.id"
                  class="lx-color-item"
                  :class="[
                    {
                      'lx-selected': selectedColorVariable === color.variable,
                    },
                    color.label,
                  ]"
                  :title="displayTexts[color.label]"
                  tabindex="0"
                  @click="updateColor(color.value, color.label, color.variable)"
                  @keydown.enter.prevent="updateColor(color.value, color.label, color.variable)"
                >
                  <div></div>
                </li>
              </ul>
            </template>
          </LxDropDownMenu>
        </template>
      </LxToolbar>
      <div class="lx-input-wrapper" :class="{ 'lx-disabled': disabled }">
        <canvas
          ref="canvas"
          class="lx-canvas-element lx-input-area"
          :height="canvasHeight"
          :aria-labelledby="labelledBy"
          @pointerdown.prevent="startDrawing"
          @pointermove.prevent="draw"
          @pointerup.prevent="stopDrawing"
          @pointerleave.prevent="stopDrawing"
          @pointercancel.prevent="stopDrawing"
          @contextmenu.prevent
        />
      </div>
    </div>
  </div>
</template>
