<script setup>
import { ref, computed, watch, nextTick, defineAsyncComponent } from 'vue';
import { useElementSize, useResizeObserver } from '@vueuse/core';
import { generateUUID } from '@/utils/stringUtils';
import { getTexts } from '@/utils/visualPickerUtils';
import { getDisplayTexts } from '@/utils/generalUtils';
import LxContentSwitcher from '@/components/ContentSwitcher.vue';
import LxDataGrid from '@/components/DataGrid.vue';
import LxLoader from '@/components/Loader.vue';
import { formatDecimal } from '@/utils/format/number';
import { shortenValue } from '@/utils/format/string';
import LxInfoWrapper from '@/components/InfoWrapper.vue';
import LxListItem from '@/components/list/ListItem.vue';
import LxBadge from '@/components/Badge.vue';
import { logWarn } from '@/utils/devUtils';
import useLx from '@/hooks/useLx';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  kind: { type: String, default: 'bars-horizontal' }, // bars-horizontal || bars-vertical || latvia || latvia2024 || donut || gauge || lines
  items: { type: Array, default: () => [] },
  thresholds: { type: Array, default: () => [] },
  showValues: { type: String, default: 'default' }, // default || always || never
  idAttribute: { type: String, default: 'id' },
  nameAttribute: { type: String, default: 'name' },
  colorAttribute: { type: String, default: 'color' },
  valueAttribute: { type: String, default: 'value' },
  showLegend: { type: Boolean, default: false },
  targets: { type: Array, default: () => [] },
  maxValue: { type: Number, default: null },
  stepValue: { type: Number, default: null }, // kind-lines: interval between Y-axis labels
  gridStepValue: { type: Number, default: null }, // kind-lines: interval between horizontal grid lines
  mode: { type: String, default: 'default' }, // default || compact
  texts: { type: Object, default: () => ({}) },
});

const textsDefault = {
  graph: 'Grafiks',
  table: 'Tabula',
  from: 'no',
  to: 'līdz',
  target: 'Mērķis',
  nameColumn: 'Nosaukums',
  groupColumn: 'Grupa',
  valueColumn: 'Vērtība',
  iconColumn: 'Ikona',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault, 'LxDataVisualizer'));

const emits = defineEmits(['click']);

const latviaTexts = computed(() =>
  props.kind === 'latvia2024' ? getTexts('latvia2024') : getTexts('latvia')
);

const globalEnvironment = useLx().getGlobals()?.environment;

const maxValue = computed(() => {
  const flattenedItems = props.items.flatMap((item) =>
    Array.isArray(item?.[props.valueAttribute]) ? item?.[props.valueAttribute] : [item]
  );
  const maxItemValue = Math.max(...flattenedItems.map((item) => item?.[props.valueAttribute] || 0));
  const maxTargetValue = Math.max(...props.targets, 0);
  const maxCombinedValue = Math.max(maxItemValue, maxTargetValue);

  if (props.maxValue) {
    if (props.maxValue >= maxCombinedValue) {
      return props.maxValue + props.maxValue * 0.05;
    }
    logWarn(
      `LxDataVisualizer [${props.id}]: "maxValue" is smaller than the biggest value in items and targets`,
      globalEnvironment
    );
  }

  return maxCombinedValue + maxCombinedValue * 0.05;
});

function getBarWidth(item) {
  const value = item[props.valueAttribute];

  if (Array.isArray(value)) {
    return '--bar-width: 100%;';
  }

  return `--bar-width: ${
    value !== undefined && !Number.isNaN(value) ? (value / maxValue.value) * 100 : 0
  }%;`;
}

function getBarHeight(item) {
  const value = item[props.valueAttribute];

  if (Array.isArray(value)) {
    return '--bar-height: 100%;';
  }

  return `--bar-height: ${
    value !== undefined && !Number.isNaN(value) ? (value / maxValue.value) * 100 : 0
  }%;`;
}

function getTargetPosition(item) {
  return `--target-position: ${(item / maxValue.value) * 100}%`;
}

function getSubItemCount(subItems) {
  return Array.isArray(subItems) ? `--sub-item-count: ${subItems.length}` : '';
}

function checkValue(item, cloneThreshold, grid) {
  if (!cloneThreshold) return null;

  const { excludes, min, max, color } = cloneThreshold;
  const value = item[props.valueAttribute];
  const getColor = () => (grid ? color : `var(--color-${color}-background)`);

  if (
    (!excludes && value >= min && value <= max) ||
    (excludes === 'max' && value >= min && value < max) ||
    (excludes === 'min' && value > min && value <= max) ||
    (excludes === 'both' && value > min && value < max)
  ) {
    return getColor();
  }

  return null;
}

function resolveThresholdColor(item, grid) {
  let color = null;

  props.thresholds.forEach((threshold) => {
    const cloneThreshold = { ...threshold };
    if (!cloneThreshold.min) cloneThreshold.min = Number.MIN_SAFE_INTEGER;
    if (!cloneThreshold.max) cloneThreshold.max = Number.MAX_SAFE_INTEGER;

    const res = checkValue(item, cloneThreshold, grid);
    if (res) {
      color = res;
    }
  });

  return color;
}

function getBarColor(item, grid = false) {
  const isBarKind =
    props.kind === 'bars-horizontal' ||
    props.kind === 'bars-vertical' ||
    props.kind === 'donut' ||
    props.kind === 'gauge' ||
    props.kind === 'lines';
  let color = null;

  if (props.thresholds?.length > 0) {
    color = resolveThresholdColor(item, grid);
  } else if (grid && item[props.colorAttribute]) {
    color = item[props.colorAttribute];
  }

  if (grid && color) {
    return color;
  }

  if (grid && isBarKind) {
    return 'data';
  }

  if (color) {
    return isBarKind ? `--bar-color: ${color}` : color;
  }

  if (!item[props.colorAttribute]) {
    return isBarKind ? '--bar-color: var(--color-data)' : 'var(--color-data)';
  }

  if (isBarKind) {
    return `--bar-color: var(--color-${item[props.colorAttribute]}-background)`;
  }

  return `var(--color-${item[props.colorAttribute]}-background)`;
}

function getBackTextColor(item) {
  const color = getBarColor(item, true);
  if (color === 'data') return '--bar-text-color: var(--color-region)';
  return `--bar-text-color: var(--color-${color}-foreground)`;
}

function colorSvg() {
  const rootElement = document.getElementById('LV_Region');
  Object.entries(latviaTexts.value)?.forEach(([key, value]) => {
    const element = rootElement?.querySelector(`#lx-${key}`);
    if (element) {
      element.style.fill = 'inherit';
      const res = element?.querySelector('title');
      if (res) res.textContent = value;
    }
  });
  props.items.forEach((item) => {
    if (Array.isArray(item?.[props.valueAttribute])) return;

    const country = document.getElementById(`lx-${item[props.idAttribute]}`);
    const color = getBarColor(item);
    if (country) {
      if (color) country.style.fill = color;
      if (props.showValues !== 'never') {
        const res = country?.querySelector('title');
        if (res) res.textContent = `${item[props.nameAttribute]} \n${item[props.valueAttribute]}`;
      }
    }
  });
}

function polarPoint(cx, cy, radius, degrees) {
  const radians = (degrees * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}

const toDegrees = (radians) => (radians * 180) / Math.PI;

function getRingPath({ cx, cy, outer, inner, start, end, gap = 0 }) {
  const sweep = end - start;

  if (sweep >= 360) {
    return `${getRingPath({ cx, cy, outer, inner, start, end: start + 180 })}
            ${getRingPath({ cx, cy, outer, inner, start: start + 180, end })}`;
  }

  const half = gap / 2;
  const outerOffset = toDegrees(Math.asin(half / outer));
  const innerOffset = toDegrees(Math.asin(half / inner));

  const outerSweep = sweep - 2 * outerOffset;
  const innerSweep = sweep - 2 * innerOffset;
  if (outerSweep <= 0 || innerSweep <= 0) return '';

  const outerStart = polarPoint(cx, cy, outer, start + outerOffset);
  const outerEnd = polarPoint(cx, cy, outer, end - outerOffset);
  const innerEnd = polarPoint(cx, cy, inner, end - innerOffset);
  const innerStart = polarPoint(cx, cy, inner, start + innerOffset);

  return `M ${outerStart.x} ${outerStart.y}
          A ${outer} ${outer} 0 ${outerSweep > 180 ? 1 : 0} 1 ${outerEnd.x} ${outerEnd.y}
          L ${innerEnd.x} ${innerEnd.y}
          A ${inner} ${inner} 0 ${innerSweep > 180 ? 1 : 0} 0 ${innerStart.x} ${innerStart.y}
          Z`;
}

const RING_STROKE = 24; // 1.5rem
const DONUT_RING = { cx: 112, cy: 112, outer: 112, inner: 112 - RING_STROKE };
const DONUT_GAP = 2; // 0.125rem

// Unit-circle arc (radius 1, centered on 0,0). CSS scales it to the real gauge radius.
function getUnitArcPath(start, end) {
  const from = polarPoint(0, 0, 1, start);
  const to = polarPoint(0, 0, 1, end);
  return `M ${from.x} ${from.y} A 1 1 0 0 1 ${to.x} ${to.y}`;
}

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

const totalValue = computed(() => {
  const flattenedItems = props.items.flatMap((item) =>
    Array.isArray(item?.[props.valueAttribute]) ? item?.[props.valueAttribute] : [item]
  );
  return flattenedItems.reduce(
    (sum, item) => sum + toFiniteNumber(item?.[props.valueAttribute]),
    0
  );
});

const DONUT_MIN_ANGLE = 3.6; // 1% of 360°

function getDonutAngles(values) {
  const total = values.reduce((sum, value) => sum + value, 0);
  const isTiny = (value) => value > 0 && (value / total) * 360 < DONUT_MIN_ANGLE;

  const tinyCount = values.filter(isTiny).length;
  const bigTotal = values.reduce((sum, value) => (isTiny(value) ? sum : sum + value), 0);
  const bigAngle = 360 - tinyCount * DONUT_MIN_ANGLE;

  return values.map((value) => {
    if (isTiny(value)) return DONUT_MIN_ANGLE;
    return bigTotal > 0 ? (value / bigTotal) * bigAngle : 0;
  });
}

const donutSegments = computed(() => {
  const total = totalValue.value;
  if (total === 0) return [];

  const entries = props.items
    .filter((item) => !Array.isArray(item?.[props.valueAttribute]))
    .map((item) => ({ item, value: toFiniteNumber(item?.[props.valueAttribute]) }));

  const angles = getDonutAngles(entries.map(({ value }) => value));

  let currentAngle = -90;

  return entries.map(({ item, value }, index) => {
    const startAngle = currentAngle;
    const endAngle = currentAngle + angles[index];
    currentAngle = endAngle;

    return {
      id: item[props.idAttribute],
      name: item[props.nameAttribute],
      value,
      color: getBarColor(item),
      startAngle,
      endAngle,
      item,
    };
  });
});

const donutVisibleCount = computed(
  () => donutSegments.value.filter((segment) => segment.value > 0).length
);

function getSvgPath(segment) {
  return getRingPath({
    ...DONUT_RING,
    start: segment.startAngle,
    end: segment.endAngle,
    gap: donutVisibleCount.value > 1 ? DONUT_GAP : 0,
  });
}

const donutCenterValue = computed(() => shortenValue(totalValue.value, 4, 'integer'));

function toPositiveNumber(value) {
  const number = toFiniteNumber(value);
  return number > 0 ? number : null;
}

// items[0] is the progress, the maxValue prop is the goal
const gaugeProgressItem = computed(() =>
  props.kind === 'gauge' && Array.isArray(props.items) ? props.items[0] || null : null
);

const gaugeGoalValue = computed(() => toPositiveNumber(props.maxValue) ?? 0);
const gaugeProgressValue = computed(() =>
  toFiniteNumber(gaugeProgressItem.value?.[props.valueAttribute])
);

const gaugeProgressRatio = computed(() => {
  if (gaugeGoalValue.value <= 0) return 0;
  return Math.min(Math.max(gaugeProgressValue.value / gaugeGoalValue.value, 0), 1);
});

const gaugePercentText = computed(() => `${formatDecimal(gaugeProgressRatio.value * 100, 0)}%`);

function getValueTooltip(name, value) {
  const label = name ?? '';
  if (props.showValues === 'never' || value == null) return label;
  return `${label} \n${formatDecimal(value)}`;
}

function getGaugeColor(item, defaultVar) {
  if (!item) return `--bar-color: var(${defaultVar})`;
  const hasColor = resolveThresholdColor(item, true) || item[props.colorAttribute];
  return hasColor ? getBarColor(item) : `--bar-color: var(${defaultVar})`;
}

const gaugeProgressStyle = computed(() =>
  getGaugeColor(gaugeProgressItem.value, '--gauge-progress-default')
);

const gaugeGoalStyle = computed(() => getGaugeColor(null, '--gauge-goal-default'));

const gaugeGoalTooltip = computed(() =>
  getValueTooltip(displayTexts.value?.target, gaugeGoalValue.value)
);

const gauge = computed(() => {
  const ratio = gaugeProgressRatio.value;
  const split = -180 + ratio * 180; // angle where progress ends and goal starts
  const progressItem = gaugeProgressItem.value;

  const segments = [
    {
      key: 'progress',
      id: progressItem?.[props.idAttribute],
      visible: !!progressItem && ratio > 0,
      path: getUnitArcPath(-180, split),
      style: gaugeProgressStyle.value,
      tooltip: progressItem
        ? getValueTooltip(progressItem[props.nameAttribute], progressItem[props.valueAttribute])
        : '',
    },
    {
      key: 'goal',
      id: null,
      visible: ratio < 1,
      path: getUnitArcPath(split, 0),
      style: gaugeGoalStyle.value,
      tooltip: gaugeGoalTooltip.value,
    },
  ].filter((segment) => segment.visible);

  return { segments };
});

function onGaugeClick(segment) {
  if (segment.id !== null && segment.id !== undefined) emits('click', segment.id);
}

const LINE_HEIGHT = 208; // 13rem
const LINE_HOVER_WIDTH = 8; // 0.5rem
const LINE_LABEL_MIN_GAP = 16; // 1rem, below this the X labels turn vertical
const LINE_LABEL_MAX_SIZE = 160; // 10rem, max length of a vertical label
const LINE_MAX_TICKS = 100; // protects against tiny steps
const LINE_MIN_STEP = 24; // 1.5rem, below this spacing between X labels the chart scrolls
const LINE_POINT_RADIUS = 4; // 0.25rem, point is 8px wide
const LINE_POINT_CENTER_RADIUS = 2; // 0.125rem, 8px minus the 2px ring on each side

const lineItems = computed(() => (props.kind === 'lines' ? props.items : []));
const isLineGroup = (item) => Array.isArray(item?.[props.valueAttribute]);

function getLineEntries(item) {
  return isLineGroup(item) ? item[props.valueAttribute] : [item];
}

const lineHasGroups = computed(() => lineItems.value.some(isLineGroup));

function getLineSeriesKey(item, entry) {
  return isLineGroup(item) ? entry?.[props.nameAttribute] : 'single';
}

function getLinePointStyle(entry) {
  return entry?.[props.colorAttribute]
    ? `--bar-color: var(--color-${entry[props.colorAttribute]}-background)`
    : '--bar-color: var(--color-brand)';
}

function getLineTooltip(item) {
  if (!isLineGroup(item)) {
    return getValueTooltip(item[props.nameAttribute], item[props.valueAttribute]);
  }
  const lines = item[props.valueAttribute].map((entry) =>
    props.showValues === 'never'
      ? entry[props.nameAttribute]
      : `${entry[props.nameAttribute]} ${formatDecimal(entry[props.valueAttribute] ?? 0)}`
  );
  return [item[props.nameAttribute], ...lines].join('\n');
}

// one value per click target, grouped columns are clicked through their points
function onLineClick(column) {
  if (column.points.length === 1) emits('click', column.points[0].entry[props.idAttribute]);
}

function getNiceStep(max) {
  const raw = max / 5;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((step) => step >= raw);
}

function getAxisTicks(max, step) {
  const count = Math.floor(max / step + 1e-9);
  return Array.from({ length: count + 1 }, (_, index) => Number((index * step).toFixed(10)));
}

// Missing, zero, negative or NaN steps fall back to defaults
const lineScale = computed(() => {
  const dataMax = Math.max(
    0,
    ...lineItems.value
      .flatMap(getLineEntries)
      .map((entry) => toFiniteNumber(entry?.[props.valueAttribute]))
  );
  const customMax = toPositiveNumber(props.maxValue);
  const useCustomMax = customMax !== null && customMax >= dataMax;

  if (customMax !== null && !useCustomMax) {
    logWarn(
      `LxDataVisualizer [${props.id}]: "maxValue" is smaller than the biggest value in items`,
      globalEnvironment
    );
  }

  const base = (useCustomMax ? customMax : dataMax) || 1;
  const step = Math.max(
    toPositiveNumber(props.stepValue) ?? getNiceStep(base),
    base / LINE_MAX_TICKS
  );
  const max = useCustomMax ? customMax : Math.ceil(base / step - 1e-9) * step;
  const gridStep = Math.max(toPositiveNumber(props.gridStepValue) ?? step, max / LINE_MAX_TICKS);

  return { max, step, gridStep };
});

const linePlot = ref();
const { width: linePlotWidth } = useElementSize(linePlot);
const lineLabelWidths = ref([]);
const lineXAxis = ref();
const lineLabelTexts = ref([]);

function measureLineLabels() {
  lineLabelWidths.value = Array.from(
    lineXAxis.value?.querySelectorAll('.lx-line-x-text') ?? []
  ).map((element) => element.scrollWidth);
}

useResizeObserver(lineLabelTexts, measureLineLabels);

watch(
  () => lineItems.value.map((item) => item?.[props.nameAttribute]).join('\n'),
  measureLineLabels,
  {
    flush: 'post',
  }
);

const lineChart = computed(() => {
  const { max, step, gridStep } = lineScale.value;
  const width = linePlotWidth.value;
  const count = lineItems.value.length;
  const getY = (value) =>
    Math.round(LINE_HEIGHT - (Math.min(Math.max(value, 0), max) / max) * LINE_HEIGHT);

  const columns = lineItems.value.map((item, index) => ({
    key: item[props.idAttribute],
    item,
    x: Math.round(count > 1 ? (index * width) / (count - 1) : width / 2),
    points: getLineEntries(item).map((entry) => ({
      key: entry[props.idAttribute],
      entry,
      seriesKey: getLineSeriesKey(item, entry),
      y: getY(toFiniteNumber(entry[props.valueAttribute])),
      style: getLinePointStyle(entry),
    })),
  }));

  const seriesMap = new Map();
  columns.forEach((column) =>
    column.points.forEach((point) => {
      if (!seriesMap.has(point.seriesKey)) {
        seriesMap.set(point.seriesKey, {
          key: point.seriesKey,
          name: point.entry[props.nameAttribute],
          style: point.style,
          coordinates: [],
        });
      }
      seriesMap.get(point.seriesKey).coordinates.push(`${column.x},${point.y}`);
    })
  );
  const series = [...seriesMap.values()].map(({ coordinates, ...rest }) => ({
    ...rest,
    path: coordinates.join(' '),
  }));

  return {
    columns,
    series,
    yTicks: getAxisTicks(max, step).map((value) => ({
      value,
      label: Number.isInteger(value) ? formatDecimal(value, 0) : formatDecimal(value),
      percent: (value / max) * 100,
    })),
    gridTicks: getAxisTicks(max, gridStep)
      .filter((value) => value < max)
      .map((value) => ({ value, y: getY(value) })),
  };
});

const lineYLongestLabel = computed(() =>
  lineChart.value.yTicks.reduce(
    (longest, tick) => (tick.label.length > longest.length ? tick.label : longest),
    ''
  )
);

const lineYAxisStyle = computed(() => `--line-y-width: ${lineYLongestLabel.value.length}ch`);

const lineChartEl = ref();
const lineYAxisEl = ref();
const { width: lineChartWidth } = useElementSize(lineChartEl, undefined, { box: 'border-box' });
const { width: lineYAxisWidth } = useElementSize(lineYAxisEl);

const getPx = (element, property) =>
  element ? Number.parseFloat(getComputedStyle(element)[property]) || 0 : 0;

const lineEdgeOverhang = computed(() => {
  const widths = lineLabelWidths.value;
  const edge = Math.max(widths[0] ?? 0, widths[widths.length - 1] ?? 0);
  return (Number.isFinite(edge) ? edge : 0) / 2;
});

const lineLabelStep = computed(() => {
  const widths = lineLabelWidths.value;
  const count = lineItems.value.length;
  if (count < 2 || widths.length !== count) return null;

  const padding = getPx(lineChartEl.value, 'paddingLeft');
  const yAxis =
    lineYAxisWidth.value > 0 ? lineYAxisWidth.value + getPx(lineYAxisEl.value, 'marginRight') : 0;
  const plotWidth =
    lineChartWidth.value - padding - yAxis - Math.max(padding, lineEdgeOverhang.value);

  return plotWidth / (count - 1);
});

const lineLabelsVertical = computed(() => {
  const step = lineLabelStep.value;
  if (step === null) return false;

  const widths = lineLabelWidths.value;
  return widths.some(
    (width, index) => index > 0 && step - (width + widths[index - 1]) / 2 < LINE_LABEL_MIN_GAP
  );
});

const lineScrollable = computed(
  () => lineLabelsVertical.value && lineLabelStep.value < LINE_MIN_STEP
);

const lineXOverhang = computed(() =>
  lineLabelsVertical.value ? '0px' : `${lineEdgeOverhang.value}px`
);

const lineXAxisStyle = computed(() =>
  lineLabelsVertical.value
    ? `--line-x-height: ${Math.min(Math.max(0, ...lineLabelWidths.value), LINE_LABEL_MAX_SIZE)}px`
    : ''
);

const lineActiveColumn = ref(null);

function calculateDimensions(obj) {
  const res = {};
  Object.entries(obj)?.forEach(([key, value]) => {
    const { width, height } = useElementSize(value);
    res[key] = { width, height };
  });
  return res;
}

const horizontalModalRefs = ref({});
const verticalModalRefs = ref({});
const horizontalTextRefs = ref({});
const verticalTextRefs = ref({});

const horizontalSubModalRefs = ref({});
const verticalSubModalRefs = ref({});
const horizontalSubTextRefs = ref({});
const verticalSubTextRefs = ref({});

const horizontalElemDimensions = computed(() => calculateDimensions(horizontalModalRefs.value));
const verticalElemDimensions = computed(() => calculateDimensions(verticalModalRefs.value));
const horizontalTextElemDimensions = computed(() => calculateDimensions(horizontalTextRefs.value));
const verticalTextElemDimensions = computed(() => calculateDimensions(verticalTextRefs.value));

const horizontalSubElemDimensions = computed(() =>
  calculateDimensions(horizontalSubModalRefs.value)
);
const verticalSubElemDimensions = computed(() => calculateDimensions(verticalSubModalRefs.value));
const horizontalTextSubElemDimensions = computed(() =>
  calculateDimensions(horizontalSubTextRefs.value)
);
const verticalTextSubElemDimensions = computed(() =>
  calculateDimensions(verticalSubTextRefs.value)
);

function isTextOutside(index) {
  return (
    (props.kind === 'bars-horizontal' &&
      horizontalElemDimensions.value?.[index]?.width?.value > 0 &&
      horizontalTextElemDimensions.value?.[index]?.width?.value > 0 &&
      // eslint-disable-next-line no-unsafe-optional-chaining
      horizontalTextElemDimensions.value?.[index]?.width?.value + 12 >=
        horizontalElemDimensions.value?.[index]?.width?.value) ||
    (props.kind === 'bars-vertical' &&
      verticalElemDimensions.value?.[index]?.height?.value > 0 &&
      verticalTextElemDimensions.value?.[index]?.width?.value > 0 &&
      // eslint-disable-next-line no-unsafe-optional-chaining
      verticalTextElemDimensions.value?.[index]?.width?.value + 12 >=
        verticalElemDimensions.value?.[index]?.height?.value)
  );
}

function isSubTextOutside(index) {
  return (
    (props.kind === 'bars-horizontal' &&
      horizontalSubElemDimensions.value?.[index]?.width?.value > 0 &&
      horizontalTextSubElemDimensions.value?.[index]?.width?.value > 0 &&
      // eslint-disable-next-line no-unsafe-optional-chaining
      horizontalTextSubElemDimensions.value?.[index]?.width?.value + 12 >=
        horizontalSubElemDimensions.value?.[index]?.width?.value) ||
    (props.kind === 'bars-vertical' &&
      verticalSubElemDimensions.value?.[index]?.height?.value > 0 &&
      verticalTextSubElemDimensions.value?.[index]?.width?.value > 0 &&
      // eslint-disable-next-line no-unsafe-optional-chaining
      verticalTextSubElemDimensions.value?.[index]?.width?.value + 12 >=
        verticalSubElemDimensions.value?.[index]?.height?.value)
  );
}

const hasSubBars = computed(() =>
  props.items.some((item) => Array.isArray(item?.[props.valueAttribute]))
);

const columnDef = computed(() => {
  const res = [];
  res.push({
    id: 'name',
    name: displayTexts.value?.nameColumn,
    attributeName: 'name',
    type: 'primary',
    kind: 'clickable',
    size: '*',
  });

  if (hasSubBars.value) {
    res.push({
      id: 'group',
      name: displayTexts.value?.groupColumn,
      attributeName: 'group',
      type: 'primary',
      size: '*',
    });
  }

  res.push(
    {
      id: 'value',
      name: displayTexts.value?.valueColumn,
      attributeName: 'value',
      type: 'decimal',
      size: 's',
    },
    {
      id: 'icon',
      name: ' ',
      attributeName: 'icon',
      title: displayTexts.value?.iconColumn,
      type: 'icon',
      size: 'xs',
    }
  );

  if (props.showValues === 'never') {
    res.splice(1, 1);
  }
  return res;
});

const dataGridItems = computed(() => {
  const items = props.kind === 'gauge' ? props.items.slice(0, 1) : props.items;

  const rows = items.flatMap((item) => {
    const itemWithSubBars = Array.isArray(item?.[props.valueAttribute]);

    // If kind is 'latvia' or 'latvia2024', exclude items that have sub-bars
    if ((props.kind === 'latvia' || props.kind === 'latvia2024') && itemWithSubBars) return [];
    if (props.kind === 'gauge' && itemWithSubBars) return [];

    if (itemWithSubBars) {
      const valueArray = item[props.valueAttribute];

      return valueArray.map((subItem) => ({
        id: subItem[props.idAttribute],
        name: subItem[props.nameAttribute],
        value: subItem[props.valueAttribute],
        group: item[props.nameAttribute],
        icon: {
          icon: 'color-swatch',
          category: getBarColor(subItem, true),
          label: subItem[props.valueAttribute]?.toString(),
        },
      }));
    }

    return {
      id: item[props.idAttribute],
      name: item[props.nameAttribute],
      value: item[props.valueAttribute],
      group: null,
      icon: {
        icon: 'color-swatch',
        category: getBarColor(item, true),
        label: item[props.valueAttribute]?.toString(),
      },
    };
  });

  // the goal comes from the maxValue prop
  if (props.kind === 'gauge') {
    rows.push({
      id: generateUUID(),
      name: displayTexts.value?.target,
      value: gaugeGoalValue.value,
      group: null,
      icon: {
        icon: 'color-swatch',
        category: 'data',
        label: gaugeGoalValue.value.toString(),
      },
    });
  }

  return rows;
});

function gridClick(a, b) {
  emits('click', b);
}

function imageClick(event) {
  let element = event.target?.id;
  if (!element) element = event.target?.parentNode?.id;
  if (element?.includes('-')) element = element?.split('-')[1];
  if (element) emits('click', element);
}

const contentModel = ref('default');

const contentItems = computed(() => [
  { id: 'default', name: displayTexts.value?.graph },
  { id: 'table', name: displayTexts.value?.table },
]);

const imagePath = ref(null);

function loadImage() {
  const images = {
    latvia: () => import('@/components/visualPickerPictures/Latvia.vue'),
    latvia2024: () => import('@/components/visualPickerPictures/Latvia2024.vue'),
  };

  return new Promise((resolve, reject) => {
    imagePath.value = defineAsyncComponent({
      loader: () =>
        images[props.kind]?.()
          .then(async (component) => {
            resolve(component);
            return component;
          })
          .catch((error) => {
            reject(error);
          }),
    });
  });
}

watch(
  () => [props.items, props.thresholds, props.showValues, contentModel.value],
  () => {
    if (
      (props.kind === 'latvia' || props.kind === 'latvia2024') &&
      contentModel.value === 'default'
    ) {
      nextTick(() => colorSvg());
    }
  },
  { deep: true, immediate: true }
);

const loading = ref(false);

async function getImage() {
  try {
    loading.value = true;
    await loadImage();
  } catch {
    return;
  } finally {
    setTimeout(() => {
      loading.value = false;
      colorSvg();
    }, 50);
  }
}

const horizontalBarsOnly = ref();
const verticalBarsOnly = ref();

const barsOnlyWidth = computed(() => useElementSize(horizontalBarsOnly).width);
const barsOnlyHeight = computed(() => useElementSize(verticalBarsOnly).height);

const targetsComputed = computed(() => {
  const objArray = [...props.targets]
    .sort((a, b) => a - b)
    .map((item) => ({ value: item, count: 1 }));

  const res = [];

  for (let i = 0, j = 0; i < objArray.length; i += 1) {
    let location;
    if (props.kind === 'bars-horizontal') {
      // item location in px
      location = (objArray[i].value / maxValue.value) * barsOnlyWidth.value.value;
    }
    if (props.kind === 'bars-vertical') {
      // item location in px
      location = (objArray[i].value / maxValue.value) * barsOnlyHeight.value.value;
    }

    // if gap smaller than 48px(3rem), than marge
    if (res[j - 1]?.value && location - res[j - 1].value < 48) {
      // value of items in px for comparison
      res[j - 1].value = (res[j - 1].value + location) / 2;
      // count of items in this location
      res[j - 1].count += 1;
      // absolute value of items in this location
      res[j - 1].absoluteValue = (res[j - 1].absoluteValue + objArray[i].value) / 2;
      // list of items in this location
      res[j - 1].list.push(objArray[i].value);
    } else {
      res.push({
        value: location,
        count: 1,
        locationRaw: (objArray[i].value / maxValue.value) * 100, // item location in %
        absoluteValue: objArray[i].value,
        list: [objArray[i].value],
      });
      j += 1;
    }
  }
  return res;
});

function getLegendLabel(item) {
  if (item?.min && item?.max) return `${formatDecimal(item?.min)} - ${formatDecimal(item?.max)}`;
  if (!item?.max) return `${displayTexts.value?.from} ${formatDecimal(item?.min)}`;
  return `${displayTexts.value?.to} ${formatDecimal(item?.max)}`;
}

const legendItems = computed(() => {
  if (props.kind === 'donut') {
    return donutSegments.value.map((segment) => ({
      key: segment.id,
      label: segment.name,
      tooltip: segment.name,
      style: segment.color,
    }));
  }

  if (props.kind === 'gauge') {
    const progressItem = gaugeProgressItem.value;
    return [
      ...(progressItem
        ? [
            {
              key: 'progress',
              label: progressItem[props.nameAttribute],
              tooltip: progressItem[props.nameAttribute],
              style: gaugeProgressStyle.value,
            },
          ]
        : []),
    ];
  }

  if (props.kind === 'lines' && lineHasGroups.value) {
    return lineChart.value.series.map((line) => ({
      key: line.key,
      label: line.name,
      tooltip: line.name,
      style: line.style,
    }));
  }

  return props.thresholds.map((item) => ({
    key: item.color,
    label: getLegendLabel(item),
    tooltip: getLegendLabel(item),
    style: `--bar-color: var(--color-${item.color}-background)`,
  }));
});

const targetsList = computed(() => {
  const res = [];
  props.targets.forEach((item) => {
    res.push({ id: item, name: item, description: displayTexts.value?.target });
  });
  return res;
});

const isRegularBar = (index) => !Array.isArray(props.items[index]?.[props.valueAttribute]);

const hasSubBarBefore = (index) => {
  if (!isRegularBar(index)) return false;
  return index > 0 && Array.isArray(props.items[index - 1]?.[props.valueAttribute]);
};

const hasSubBarAfter = (index) => {
  if (!isRegularBar(index)) return false;
  return (
    index < props.items.length - 1 && Array.isArray(props.items[index + 1]?.[props.valueAttribute])
  );
};

watch(
  () => props.kind,
  async (newValue) => {
    if (newValue === 'latvia' || newValue === 'latvia2024') {
      getImage();
    }
  },
  { deep: true, immediate: true }
);

watch(
  () => props.mode,
  async (newValue) => {
    if (newValue === 'compact' && contentModel.value === 'table') {
      contentModel.value = 'default';
    }
  }
);
</script>
<template>
  <div class="lx-data-visualizer" :id="id">
    <LxContentSwitcher
      :id="`${id}-view-switcher`"
      :items="contentItems"
      v-model="contentModel"
      v-if="mode === 'default' && items?.length > 0"
    />
    <div
      class="lx-bars-horizontal"
      v-if="kind === 'bars-horizontal' && contentModel === 'default'"
      :class="[{ 'show-legend': showLegend }, { 'has-targets': targets?.length > 0 }]"
      :style="`--item-count: ${items?.length}`"
    >
      <div class="bar-wrapper">
        <template v-for="(item, index) in items" :key="item[idAttribute]">
          <!-- If item has sub-items, render each subItem as its own <data> tag -->
          <div class="lx-bar-group" v-if="Array.isArray(item?.[valueAttribute])">
            <p
              v-if="Array.isArray(item?.[valueAttribute])"
              class="lx-bar-group-label"
              v-tooltip="item?.[nameAttribute]"
            >
              {{ item?.[nameAttribute] }}
            </p>

            <data
              v-for="subItem in item[valueAttribute]"
              :key="subItem[idAttribute]"
              :id="`${id}-${subItem[idAttribute]}`"
              class="bar-name sub-bar"
              v-tooltip="subItem?.[nameAttribute]"
              :value="subItem?.[valueAttribute]"
            >
              {{ subItem?.[nameAttribute] }}
            </data>
          </div>

          <!-- If item does not have sub-items, render normally -->
          <data
            v-else
            :id="`${id}-${item[idAttribute]}`"
            class="bar-name"
            :class="[
              {
                'sub-bar-before': hasSubBarBefore(index),
                'sub-bar-after': hasSubBarAfter(index),
              },
            ]"
            v-tooltip="item?.[nameAttribute]"
            :value="item?.[valueAttribute]"
          >
            {{ item?.[nameAttribute] }}
          </data>
        </template>
      </div>

      <div class="bar-wrapper bars-only" ref="horizontalBarsOnly">
        <div
          v-for="(item, index) in items"
          :key="item[idAttribute]"
          :ref="(el) => (horizontalModalRefs[index] = el)"
          class="bar"
          :class="[
            {
              'text-outside': isTextOutside(index),
              'with-sub-bars': Array.isArray(item?.[valueAttribute]),
              'sub-bar-before': hasSubBarBefore(index),
              'sub-bar-after': hasSubBarAfter(index),
            },
          ]"
          :style="`${getBarWidth(item)}; ${getBarColor(item)}; ${getSubItemCount(
            item?.[valueAttribute]
          )}; ${getBackTextColor(item)}`"
          v-tooltip="
            Array.isArray(item?.[valueAttribute])
              ? null
              : showValues === 'never'
              ? `${item?.[nameAttribute]}`
              : `${item?.[nameAttribute]} \n${formatDecimal(item?.[valueAttribute] ?? 0)}`
          "
          :aria-labelledby="`${id}-${item[idAttribute]}`"
          @click="
            !Array.isArray(item?.[valueAttribute]) ? $emit('click', item?.[idAttribute]) : null
          "
          @keydown.space="
            !Array.isArray(item?.[valueAttribute]) ? $emit('click', item?.[idAttribute]) : null
          "
        >
          <!-- Check if item value is an array -->
          <template v-if="Array.isArray(item?.[valueAttribute])">
            <div class="sub-bar-wrapper bars-only">
              <div
                v-for="(subItem, subIndex) in item?.[valueAttribute]"
                :key="subItem[idAttribute]"
                :ref="(el) => (horizontalSubModalRefs[`${index}-${subIndex}`] = el)"
                class="sub-bar"
                :class="[
                  {
                    'text-outside': isSubTextOutside(`${index}-${subIndex}`),
                  },
                ]"
                :style="`${getBarWidth(subItem)}; ${getBarColor(subItem)}; ${getBackTextColor(
                  subItem
                )}`"
                v-tooltip="
                  showValues === 'never'
                    ? `${subItem?.[nameAttribute]}`
                    : `${subItem?.[nameAttribute]} \n${formatDecimal(
                        subItem?.[valueAttribute] ?? 0
                      )}`
                "
                :aria-labelledby="`${id}-${subItem[idAttribute]}`"
                @click="$emit('click', subItem?.[idAttribute])"
                @keydown.space="$emit('click', subItem?.[idAttribute])"
              >
                <p
                  v-if="showValues === 'always'"
                  :ref="(el) => (horizontalSubTextRefs[`${index}-${subIndex}`] = el)"
                  :style="`--outside-padding: ${
                    horizontalSubElemDimensions?.[`${index}-${subIndex}`]?.width?.value
                  }px`"
                >
                  {{ subItem?.[valueAttribute] }}
                </p>
              </div>
            </div>
          </template>

          <!-- If it's a regular value, render it normally -->
          <template v-else>
            <p
              v-if="showValues === 'always'"
              :ref="(el) => (horizontalTextRefs[index] = el)"
              :style="`--outside-padding: ${horizontalElemDimensions?.[index]?.width?.value}px`"
            >
              {{ item?.[valueAttribute] }}
            </p>
          </template>
        </div>

        <div
          v-for="target in targetsComputed"
          class="lx-target-wrapper"
          :key="target?.value"
          :style="`${getTargetPosition(target.absoluteValue)}`"
          :class="[{ 'lx-target-wrapper-multiple': target.list?.length > 1 }]"
        >
          <div class="lx-target-header" v-if="showValues !== 'never' || target.list?.length > 1">
            <div
              class="target-value"
              v-if="target.list?.length === 1"
              v-tooltip="target.absoluteValue"
            >
              {{ target.absoluteValue }}
            </div>

            <div class="target-value-multiple" v-else>
              <LxInfoWrapper offsetDistance="8">
                <div class="target-value-multiple-inner">
                  {{ target.count }}
                </div>

                <template #panel>
                  <div>
                    <div v-for="item in target.list" :key="item">
                      {{ item }}
                    </div>
                  </div>
                </template>
              </LxInfoWrapper>
            </div>
          </div>

          <div class="lx-target" />
        </div>
      </div>
    </div>

    <div
      v-else-if="kind === 'bars-vertical' && contentModel === 'default'"
      class="lx-bars-vertical-container"
      :class="[{ 'show-legend': showLegend }]"
    >
      <div
        class="lx-bars-vertical"
        :class="[{ 'show-legend': showLegend }, { 'has-targets': targets?.length > 0 }]"
        :style="`--item-count: ${items?.length}`"
      >
        <div class="bar-wrapper bars-only" ref="verticalBarsOnly">
          <div
            v-for="(item, index) in items"
            :key="item[idAttribute]"
            :ref="(el) => (verticalModalRefs[index] = el)"
            class="bar"
            :class="[
              {
                'text-outside': isTextOutside(index),
                'with-sub-bars': Array.isArray(item?.[valueAttribute]),
                'sub-bar-before': hasSubBarBefore(index),
                'sub-bar-after': hasSubBarAfter(index),
              },
            ]"
            :style="`${getBarHeight(item)}; ${getBarColor(item)}; ${getSubItemCount(
              item?.[valueAttribute]
            )}; ${getBackTextColor(item)}`"
            v-tooltip="
              Array.isArray(item?.[valueAttribute])
                ? null
                : showValues === 'never'
                ? `${item?.[nameAttribute]}`
                : `${item?.[nameAttribute]} \n${formatDecimal(item?.[valueAttribute] ?? 0)}`
            "
            :aria-labelledby="`${id}-${item[idAttribute]}`"
            @click="
              !Array.isArray(item?.[valueAttribute]) ? $emit('click', item?.[idAttribute]) : null
            "
            @keydown.space="
              !Array.isArray(item?.[valueAttribute]) ? $emit('click', item?.[idAttribute]) : null
            "
          >
            <!-- Check if item value is an array -->
            <template v-if="Array.isArray(item?.[valueAttribute])">
              <div class="sub-bar-wrapper bars-only">
                <div
                  v-for="(subItem, subIndex) in item?.[valueAttribute]"
                  :key="subItem[idAttribute]"
                  :ref="(el) => (verticalSubModalRefs[`${index}-${subIndex}`] = el)"
                  class="sub-bar"
                  :class="[
                    {
                      'text-outside': isSubTextOutside(`${index}-${subIndex}`),
                    },
                  ]"
                  :style="`${getBarHeight(subItem)}; ${getBarColor(subItem)}; ${getBackTextColor(
                    subItem
                  )}`"
                  v-tooltip="
                    showValues === 'never'
                      ? `${subItem?.[nameAttribute]}`
                      : `${subItem?.[nameAttribute]} \n${formatDecimal(
                          subItem?.[valueAttribute] ?? 0
                        )}`
                  "
                  :aria-labelledby="`${id}-${subItem[idAttribute]}`"
                  @click="$emit('click', subItem?.[idAttribute])"
                  @keydown.space="$emit('click', subItem?.[idAttribute])"
                >
                  <p
                    v-if="showValues === 'always'"
                    :ref="(el) => (verticalSubTextRefs[`${index}-${subIndex}`] = el)"
                    :style="`--outside-padding: ${
                      verticalSubElemDimensions?.[`${index}-${subIndex}`]?.height?.value
                    }px`"
                  >
                    {{ subItem?.[valueAttribute] }}
                  </p>
                </div>
              </div>
            </template>

            <!-- If it's a regular value, render it normally -->
            <template v-else>
              <p
                v-if="showValues === 'always'"
                :ref="(el) => (verticalTextRefs[index] = el)"
                :style="`--outside-padding: ${verticalElemDimensions?.[index]?.height?.value}px`"
              >
                {{ item?.[valueAttribute] }}
              </p>
            </template>
          </div>

          <div
            class="lx-target-wrapper"
            v-for="target in targetsComputed"
            :key="target?.value"
            :style="`${getTargetPosition(target.absoluteValue)}`"
            :class="[{ 'lx-target-wrapper-multiple': target.list?.length > 1 }]"
          >
            <div class="lx-target-header" v-if="showValues !== 'never' || target.list?.length > 1">
              <div
                class="target-value"
                v-if="target.list?.length === 1"
                v-tooltip="target.absoluteValue"
              >
                {{ target.absoluteValue }}
              </div>

              <div class="target-value-multiple" v-else>
                <LxInfoWrapper offsetDistance="8">
                  <div class="target-value-multiple-inner">
                    {{ target.count }}
                  </div>

                  <template #panel>
                    <div>
                      <div v-for="item in target.list" :key="item">
                        {{ item }}
                      </div>
                    </div>
                  </template>
                </LxInfoWrapper>
              </div>
            </div>

            <div class="lx-target" />
          </div>
        </div>

        <div class="bar-wrapper legends">
          <template v-for="(item, index) in items" :key="item[idAttribute]">
            <!-- If item has sub-items, render each subItem as its own <data> tag -->
            <div class="lx-bar-group" v-if="Array.isArray(item?.[valueAttribute])">
              <p
                v-if="Array.isArray(item?.[valueAttribute])"
                class="lx-bar-group-label"
                v-tooltip="item?.[nameAttribute]"
              >
                {{ item?.[nameAttribute] }}
              </p>

              <data
                v-for="subItem in item[valueAttribute]"
                :key="subItem[idAttribute]"
                :id="`${id}-${subItem[idAttribute]}`"
                class="bar-name sub-bar"
                v-tooltip="subItem?.[nameAttribute]"
                :value="subItem?.[valueAttribute]"
              >
                {{ subItem?.[nameAttribute] }}
              </data>
            </div>

            <!-- If item does not have sub-items, render normally -->
            <data
              v-else
              :id="`${id}-${item[idAttribute]}`"
              class="bar-name"
              :class="[
                {
                  'sub-bar-before': hasSubBarBefore(index),
                  'sub-bar-after': hasSubBarAfter(index),
                },
              ]"
              v-tooltip="item?.[nameAttribute]"
              :value="item?.[valueAttribute]"
            >
              {{ item?.[nameAttribute] }}
            </data>
          </template>
        </div>
      </div>
    </div>

    <div
      v-else-if="(kind === 'latvia' || kind === 'latvia2024') && contentModel === 'default'"
      class="lx-latvia-visualizer"
      :class="[{ 'show-legend': showLegend }]"
    >
      <imagePath @click="imageClick($event)" v-show="!loading" />
      <LxLoader :loading="true" v-if="loading" />
    </div>

    <div
      v-else-if="kind === 'donut' && contentModel === 'default'"
      class="lx-donut-visualizer"
      :class="[{ 'show-legend': showLegend }]"
    >
      <div class="donut-container">
        <svg class="donut-chart" viewBox="0 0 224 224">
          <g
            v-for="segment in donutSegments"
            :key="segment.id"
            class="lx-ring-segment"
            @click="$emit('click', segment.id)"
            @keydown.space="$emit('click', segment.id)"
            tabindex="-1"
            v-tooltip="getValueTooltip(segment.name, segment.item?.[valueAttribute])"
          >
            <path :d="getSvgPath(segment)" :style="segment.color" class="lx-ring-path"></path>
          </g>
        </svg>
        <div class="donut-center">
          <p class="donut-center-value" v-tooltip="totalValue">{{ donutCenterValue }}</p>
        </div>
      </div>
    </div>

    <div
      v-else-if="kind === 'gauge' && contentModel === 'default'"
      class="lx-gauge-visualizer"
      :class="[{ 'show-legend': showLegend }]"
    >
      <div class="lx-gauge-container">
        <svg class="lx-gauge-chart" :style="{ '--gauge-stroke': RING_STROKE }">
          <g class="lx-gauge-origin">
            <g
              v-for="segment in gauge.segments"
              :key="segment.key"
              class="lx-ring-segment"
              :class="`is-${segment.key}`"
              :style="segment.style"
              tabindex="-1"
              v-tooltip="segment.tooltip"
              @click="onGaugeClick(segment)"
              @keydown.space="onGaugeClick(segment)"
            >
              <path class="lx-ring-path" :d="segment.path" />
            </g>
            <!-- end marker, only visible in the contrast theme -->
            <line
              class="lx-gauge-end-marker"
              :x1="-RING_STROKE / 2"
              :x2="RING_STROKE / 2"
              y1="0"
              y2="0"
            />
            <text class="lx-gauge-value" x="0" :y="-RING_STROKE">
              {{ gaugePercentText }}
            </text>
          </g>
        </svg>
      </div>
    </div>

    <div
      v-else-if="kind === 'lines' && contentModel === 'default'"
      class="lx-line-visualizer"
      :class="[{ 'show-legend': showLegend }]"
    >
      <div class="lx-line-chart" ref="lineChartEl" :style="`--line-x-overhang: ${lineXOverhang}`">
        <div v-if="showValues !== 'never'" class="lx-line-y-axis" :style="lineYAxisStyle">
          <span
            v-for="tick in lineChart.yTicks"
            :key="tick.value"
            class="lx-line-y-label"
            :style="`bottom: ${tick.percent}%`"
          >
            {{ tick.label }}
          </span>
        </div>
        <div class="lx-line-scroll" :class="{ 'is-scrollable': lineScrollable }">
          <div class="lx-line-scroll-content" :style="`--line-count: ${lineItems.length}`">
            <div class="lx-line-plot" ref="linePlot">
              <svg class="lx-line-svg" :width="linePlotWidth" :height="LINE_HEIGHT">
                <line
                  v-for="tick in lineChart.gridTicks"
                  :key="`h-${tick.value}`"
                  class="lx-line-grid"
                  x1="0"
                  :x2="linePlotWidth"
                  :y1="tick.y"
                  :y2="tick.y"
                />
                <line
                  v-for="column in lineChart.columns"
                  :key="`v-${column.key}`"
                  class="lx-line-grid"
                  :class="{ 'is-active': lineActiveColumn === column.key }"
                  :x1="column.x"
                  :x2="column.x"
                  y1="0"
                  :y2="LINE_HEIGHT"
                />
                <polyline
                  v-for="line in lineChart.series"
                  :key="line.key"
                  class="lx-line-path"
                  :points="line.path"
                  :style="line.style"
                />
                <g
                  v-for="column in lineChart.columns"
                  :key="column.key"
                  class="lx-line-column"
                  tabindex="-1"
                  v-tooltip="getLineTooltip(column.item)"
                  @mouseenter="lineActiveColumn = column.key"
                  @mouseleave="lineActiveColumn = null"
                  @focus="lineActiveColumn = column.key"
                  @blur="lineActiveColumn = null"
                  @click="onLineClick(column)"
                  @keydown.space="onLineClick(column)"
                >
                  <line
                    class="lx-line-hover-line"
                    :x1="column.x"
                    :x2="column.x"
                    y1="0"
                    :y2="LINE_HEIGHT"
                  />
                  <rect
                    class="lx-line-hover-area"
                    :x="column.x - LINE_HOVER_WIDTH / 2"
                    y="0"
                    :width="LINE_HOVER_WIDTH"
                    :height="LINE_HEIGHT"
                  />
                  <g
                    v-for="point in column.points"
                    :key="point.key"
                    class="lx-line-point"
                    :style="point.style"
                    @click.stop="$emit('click', point.entry[idAttribute])"
                    @keydown.enter.stop.prevent="$emit('click', point.entry[idAttribute])"
                    @keydown.space.stop.prevent="$emit('click', point.entry[idAttribute])"
                  >
                    <circle
                      class="lx-line-point-ring"
                      :cx="column.x"
                      :cy="point.y"
                      :r="LINE_POINT_RADIUS"
                    />
                    <circle
                      class="lx-line-point-center"
                      :cx="column.x"
                      :cy="point.y"
                      :r="LINE_POINT_CENTER_RADIUS"
                    />
                  </g>
                </g>
              </svg>
            </div>
            <div
              class="lx-line-x-axis"
              ref="lineXAxis"
              :class="{ 'is-vertical': lineLabelsVertical }"
              :style="lineXAxisStyle"
            >
              <span
                v-for="column in lineChart.columns"
                :key="column.key"
                class="lx-line-x-label"
                :style="`left: ${column.x}px`"
                v-tooltip="column.item[nameAttribute]"
              >
                <span class="lx-line-x-text" ref="lineLabelTexts">{{
                  column.item[nameAttribute]
                }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <LxDataGrid
      v-else-if="mode === 'default' && contentModel === 'table'"
      :id="`${id}-table`"
      :columnDefinitions="columnDef"
      :items="dataGridItems"
      :hasSorting="true"
      @actionClick="gridClick"
    />

    <div class="lx-legend" v-if="showLegend && contentModel === 'default'">
      <LxBadge
        v-for="entry in legendItems"
        :key="entry.key"
        icon="color-swatch"
        :value="entry.label"
        :tooltip="entry.tooltip"
        :style="`${entry.style}; --color-badge-icon: var(--bar-color)`"
      />
    </div>
    <div
      class="targets-list"
      v-if="
        contentModel === 'table' &&
        targets?.length > 0 &&
        showValues !== 'never' &&
        (kind === 'bars-horizontal' || kind === 'bars-vertical')
      "
    >
      <LxListItem
        v-for="item in targetsList"
        :key="item"
        :label="item.name"
        :description="item.description"
      />
    </div>
  </div>
</template>
