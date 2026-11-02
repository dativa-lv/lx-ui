<script setup>
import { computed, onBeforeMount, ref, inject, onMounted, nextTick, watch } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import useLx from '@/hooks/useLx';
import { formatDate } from '@/utils/date/format';
import { getMonthNames, getMonthYearString } from '@/utils/date/intl';
import { formatDateJSON, formatJSON, isDateValid, parseDate } from '@/utils/date/parse';
import { generateUUID } from '@/utils/stringUtils';
import {
  dateFromYearAndQuarter,
  extractMonthFromDate,
  extractQuarterFromDate,
  extractYearFromDate,
  extractYearMonthFromDate,
  getMonthNameByOrder,
  applyTimeAdjust,
  parseTimeAdjust,
  getTimeAdjustWarnings,
  normalizeDate,
} from '@/components/datePicker/helpers';
import LxDatePicker from '@/components/datePicker/DatePicker.vue';
import LxEmptyValue from '@/components/EmptyValue.vue';
import { clampText, getDisplayTexts } from '@/utils/generalUtils';
import { lxDevUtils } from '@/utils';
import { DATE_VALIDATION_RESULT } from '@/constants';
import { useBuilderRegistration } from '@/utils/builderUtils';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  startDate: { type: String, default: null },
  endDate: { type: String, default: null },
  kind: {
    type: String,
    default: 'date',
    options: ['date', 'month', 'year', 'month-year', 'quarters'],
    group: 'main',
    sequence: 1,
  }, // 'date', 'month', 'year', 'month-year', 'quarters'
  placeholder: { type: String, default: null, group: 'main', sequence: 2 },
  minDate: { type: String, default: null, group: 'main', sequence: 3 },
  maxDate: { type: String, default: null, group: 'main', sequence: 4 },
  tooltip: { type: String, default: null, group: 'main', sequence: 5 },
  maxRangeLength: { type: Number, default: null },
  readOnly: { type: Boolean, default: false, group: 'mode', sequence: 1 },
  disabled: { type: Boolean, default: false, group: 'mode', sequence: 2 },
  required: { type: Boolean, default: null },
  invalid: { type: Boolean, default: false, sequence: 1 },
  invalidationMessage: { type: String, default: null, sequence: 2 },
  helperText: { type: String, default: null, group: 'main', sequence: 6 },
  helperTextKind: {
    type: String,
    default: 'label',
    options: ['label', 'icon'],
    group: 'main',
    sequence: 7,
  },
  timeAdjust: {
    type: [String, Object],
    default: null,
    group: 'additional',
    sequence: 8,
    validator: (v, p) => {
      getTimeAdjustWarnings(v).forEach((message) =>
        lxDevUtils.logWarn(
          `LxDateTimeRange [${p?.id}]: "timeAdjust" ${message}`,
          useLx().getGlobals()?.environment
        )
      );
      return true;
    },
  }, // 'HH:mm:ss', 'now' or { start, end }
  locale: { type: Object, default: () => useLx().getGlobals()?.locale },
  rangeMonth: {
    type: String,
    default: 'next',
    options: ['next', 'previous'],
    group: 'additional',
    sequence: 5,
  }, // next, previous
  clearIfNotExact: { type: Boolean, default: false, group: 'additional', sequence: 3 },
  labelId: { type: String, default: null },
  texts: { type: Object, default: () => ({}), group: 'additional', sequence: 100 },
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
  emptyValue: 'Nav norādīts',
  clear: 'Attīrīt',
  clearButton: 'Attīrīt vērtību',
  todayButton: 'Atgriezties uz šodienu',
  clearStart: 'Notīrīt sākuma vērtību',
  clearEnd: 'Notīrīt beigu vērtību',
  next: 'Nākamais',
  previous: 'Iepriekšējais',
  nextMonth: 'Nākamais mēnesis',
  previousMonth: 'Iepriekšējais mēnesis',
  nextYear: 'Nākamais gads',
  previousYear: 'Iepriekšējais gads',
  nextDecade: 'Nākamā dekāde',
  previousDecade: 'Iepriekšējā dekāde',
  doNotIndicateStart: 'Nenorādīt sākumu',
  doNotIndicateEnd: 'Nenorādīt beigas',
  scrollUp: 'Ritināt uz augšu',
  scrollDown: 'Ritināt uz leju',
  startDateLabel: 'Sākuma datums',
  endDateLabel: 'Beigu datums',
  dateFormatMessage: 'Datuma formāts ir diena, mēnesis, gads, atdalīts ar punktu',
  selectedStartDate: 'Izvēlēts sākuma datums',
  scrollUpDown: 'Ritināt uz augšu vai leju',
  helperTextLabel: 'Papildinformācija',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault, 'LxDateTimeRange'));
const invalidationMessageClamped = computed(() => clampText(props.invalidationMessage));
const showInvalidationMessage = computed(() => props.invalid && props.invalidationMessage);
const rangeWrapper = ref();
const emits = defineEmits([
  'update:startDate',
  'update:endDate',
  'outOfRange:startDate',
  'outOfRange:endDate',
  'outOfRange',
]);

const { dateFormat, dateTimeFormat } = useLx().getGlobals();

const localeComputed = computed(() => (props.locale?.locale ? props.locale?.locale : 'lv-LV'));
const localeFirstDay = computed(() =>
  props.locale?.firstDayOfTheWeek ? props.locale?.firstDayOfTheWeek : 2
);

const localeMasks = computed(() => {
  const dateFormatToUse = dateFormat || 'dd.MM.yyyy.';
  const dateTimeFormatToUse = dateTimeFormat || 'dd.MM.yyyy. HH:mm';

  const defaultMasks = {
    inputDateTime24hr: dateTimeFormatToUse,
    input: dateFormatToUse,
    inputMonthYear: 'yyyy-MM',
    inputQuarters: 'yyyy-QQQ',
  };

  return props.locale?.masks ? props.locale.masks : defaultMasks;
});

// timeAdjust accepts a single time for both ends or { start, end } for each end separately
function resolveTimeAdjust(edge) {
  if (!props.timeAdjust) return null;
  const value = typeof props.timeAdjust === 'string' ? props.timeAdjust : props.timeAdjust[edge];
  return parseTimeAdjust(value) ? value : null;
}

const timeAdjustStart = computed(() => resolveTimeAdjust('start'));
const timeAdjustEnd = computed(() => resolveTimeAdjust('end'));

function formatDateValue(value, timeAdjust) {
  if (!timeAdjust) return formatDateJSON(value);
  const adjusted = applyTimeAdjust(parseDate(value), timeAdjust);
  return isDateValid(adjusted) ? formatJSON(adjusted) : null;
}

function syncTimeAdjustedValue(edge, value, timeAdjust) {
  if (!timeAdjust) return;
  const adjusted = formatDateValue(value, timeAdjust);
  if (adjusted && adjusted !== value) emits(`update:${edge}Date`, adjusted);
}

watch(
  () => [props.timeAdjust, props.startDate, props.endDate, props.kind, props.readOnly],
  () => {
    if (props.readOnly) return;
    if (props.kind !== 'date' && props.kind !== 'legacy') return;

    syncTimeAdjustedValue('start', props.startDate, timeAdjustStart.value);
    syncTimeAdjustedValue('end', props.endDate, timeAdjustEnd.value);
  },
  { immediate: true }
);

// The picker compares selections as plain days, so an adjusted time must not reach it — it
// belongs to the emitted value alone. Without this a same-day range needs two clicks, because
// the clicked day (midnight) never compares as >= a start already carrying a time.
function parseDayValue(value) {
  const parsed = parseDate(value);
  if (props.kind !== 'date' && props.kind !== 'legacy') return parsed;
  return normalizeDate(parsed, 'date');
}

function updateStartValue(startValue) {
  if (props.kind === 'date' || props.kind === 'legacy') {
    const nv = formatDateValue(startValue, timeAdjustStart.value);
    emits('update:startDate', nv);
  } else if (props.kind === 'month') {
    const nv = extractMonthFromDate(startValue);
    emits('update:startDate', nv);
  } else if (props.kind === 'year') {
    const nv = extractYearFromDate(startValue);
    emits('update:startDate', nv);
  } else if (props.kind === 'month-year') {
    const nv = extractYearMonthFromDate(startValue, localeMasks.value.monthYearFormat);
    emits('update:startDate', nv);
  } else if (props.kind === 'quarters') {
    const nv = extractQuarterFromDate(startValue);
    emits('update:startDate', nv);
  }
}

function updateEndValue(endValue) {
  if (props.kind === 'date' || props.kind === 'legacy') {
    const nv = formatDateValue(endValue, timeAdjustEnd.value);
    emits('update:endDate', nv);
  } else if (props.kind === 'month') {
    const nv = extractMonthFromDate(endValue);
    emits('update:endDate', nv);
  } else if (props.kind === 'year') {
    const nv = extractYearFromDate(endValue);
    emits('update:endDate', nv);
  } else if (props.kind === 'month-year') {
    const nv = extractYearMonthFromDate(endValue, localeMasks.value.monthYearFormat);
    emits('update:endDate', nv);
  } else if (props.kind === 'quarters') {
    const nv = extractQuarterFromDate(endValue);
    emits('update:endDate', nv);
  }
}

function getMonthModel() {
  let newStartDate;
  let newEndDate;

  if (typeof props.startDate === 'string' && props.startDate?.length === 2) {
    newStartDate = new Date();
    newStartDate.setDate(1); // Set to the first day of the month
    newStartDate.setHours(0, 0, 0, 0);
    newStartDate.setMonth(Number(props.startDate) - 1);
  } else {
    newStartDate = props.startDate;
  }
  if (typeof props.endDate === 'string' && props.endDate?.length === 2) {
    newEndDate = new Date();
    newEndDate.setDate(1); // Set to the first day of the month
    newEndDate.setHours(0, 0, 0, 0);
    newEndDate.setMonth(Number(props.endDate) - 1);
  } else {
    newEndDate = props.endDate;
  }
  return {
    start: newStartDate ? parseDate(newStartDate) : null,
    end: newEndDate ? parseDate(newEndDate) : null,
  };
}

function getYearModel() {
  let newStartDate;
  let newEndDate;

  if (typeof props.startDate === 'string' && props.startDate?.length === 4) {
    newStartDate = new Date();
    newStartDate.setDate(1); // Set to the first day of the month
    newStartDate.setMonth(1);
    newStartDate.setHours(0, 0, 0, 0);
    newStartDate.setFullYear(Number(props.startDate));
  }
  if (typeof props.endDate === 'string' && props.endDate?.length === 4) {
    newEndDate = new Date();
    newEndDate.setDate(1); // Set to the first day of the month
    newEndDate.setMonth(1);
    newEndDate.setHours(0, 0, 0, 0);
    newEndDate.setFullYear(Number(props.endDate));
  }
  return {
    start: newStartDate ? parseDate(newStartDate) : null,
    end: newEndDate ? parseDate(newEndDate) : null,
  };
}

function getYearMonthModel() {
  let newStartDate;
  let newEndDate;

  if (typeof props.startDate === 'string' && props.startDate?.length === 7) {
    newStartDate = new Date();
    newStartDate.setDate(1); // Set to the first day of the month
    newStartDate.setHours(0, 0, 0, 0);
    newStartDate.setFullYear(Number(props.startDate?.slice(0, 4)));
    newStartDate.setMonth(Number(props.startDate?.slice(5, 7)) - 1);
  }
  if (typeof props.endDate === 'string' && props.endDate?.length === 7) {
    newEndDate = new Date();
    newEndDate.setDate(1); // Set to the first day of the month
    newEndDate.setHours(0, 0, 0, 0);
    newEndDate.setFullYear(Number(props.endDate?.slice(0, 4)));
    newEndDate.setMonth(Number(props.endDate?.slice(5, 7)) - 1);
  }
  return {
    start: newStartDate ? parseDate(newStartDate) : null,
    end: newEndDate ? parseDate(newEndDate) : null,
  };
}

function getQuarterModel() {
  let newStartDate;
  let newEndDate;

  if (typeof props.startDate === 'string' && props.startDate?.length === 7) {
    const [year, quarter] = props.startDate.split('-');
    const normalizedQuarter = quarter.split('Q');
    newStartDate = dateFromYearAndQuarter(year, normalizedQuarter[1]);
  }
  if (typeof props.endDate === 'string' && props.endDate?.length === 7) {
    const [year, quarter] = props.endDate.split('-');
    const normalizedQuarter = quarter.split('Q');
    newEndDate = dateFromYearAndQuarter(year, normalizedQuarter[1]);
  }
  return {
    start: newStartDate ? parseDate(newStartDate) : null,
    end: newEndDate ? parseDate(newEndDate) : null,
  };
}

const model = computed({
  get() {
    if (props.kind === 'month') {
      return getMonthModel();
    }

    if (props.kind === 'year') {
      return getYearModel();
    }
    if (props.kind === 'month-year') {
      return getYearMonthModel();
    }
    if (props.kind === 'quarters') {
      return getQuarterModel();
    }

    return { start: parseDayValue(props.startDate), end: parseDayValue(props.endDate) };
  },
  set(value) {
    if (!value || (!value.start && !value.end)) {
      emits('update:startDate', null);
      emits('update:endDate', null);
    }
    if (value) {
      if (value.start) {
        updateStartValue(value.start);
      } else {
        emits('update:startDate', null);
      }
      if (value.end) {
        updateEndValue(value.end);
      } else {
        emits('update:endDate', null);
      }
    }
  },
});

function getNameStart() {
  switch (props.kind) {
    case 'date':
    case 'legacy':
      if (props.startDate) {
        return formatDate(new Date(props.startDate));
      }
      break;

    case 'month':
      if (props.startDate) {
        const monthsList = getMonthNames(localeComputed.value);
        return getMonthNameByOrder(monthsList, new Date(props.startDate)?.getMonth(), true);
      }
      break;

    case 'month-year':
      if (props.startDate) {
        return getMonthYearString(
          localeComputed.value,
          new Date(props.startDate)?.getMonth(),
          new Date(props.startDate)?.getFullYear()
        );
      }
      break;

    default:
      return props.startDate;
  }

  return null;
}

function getNameEnd() {
  switch (props.kind) {
    case 'date':
    case 'legacy':
      if (props.endDate) {
        return formatDate(new Date(props.endDate));
      }
      break;

    case 'month':
      if (props.endDate) {
        const monthsList = getMonthNames(localeComputed.value);
        return getMonthNameByOrder(monthsList, new Date(props.endDate)?.getMonth(), true);
      }
      break;

    case 'month-year':
      if (props.endDate) {
        return getMonthYearString(
          localeComputed.value,
          new Date(props.endDate)?.getMonth(),
          new Date(props.endDate)?.getFullYear()
        );
      }
      break;

    default:
      return props.endDate;
  }

  return null;
}

const rowId = inject('rowId', ref(null));
const labelledBy = computed(() => props.labelId || rowId.value);

// Computed properties to handle individual updates for start and end dates
const modelStart = computed({
  get: () => parseDayValue(props.startDate),
  set: (value) => {
    if (value) {
      updateStartValue(value);
    } else {
      emits('update:startDate', null);
    }
  },
});

const modelEnd = computed({
  get: () => parseDayValue(props.endDate),
  set: (value) => {
    if (value) {
      updateEndValue(value);
    } else {
      emits('update:endDate', null);
    }
  },
});

// Conditional min and max dates for each picker
const startMaxDate = computed(() => modelEnd.value || props.maxDate);
const endMinDate = computed(() => modelStart.value || props.minDate);

function onOutOfRangeStartDate(payload) {
  if (
    [DATE_VALIDATION_RESULT.OUT_OF_RANGE_MIN, DATE_VALIDATION_RESULT.OUT_OF_RANGE_MAX].includes(
      payload
    )
  ) {
    emits('outOfRange:startDate', payload);
  }
}

function onOutOfRangeEndDate(payload) {
  if (
    [DATE_VALIDATION_RESULT.OUT_OF_RANGE_MIN, DATE_VALIDATION_RESULT.OUT_OF_RANGE_MAX].includes(
      payload
    )
  ) {
    emits('outOfRange:endDate', payload);
  }
}

function onOutOfRange(payload) {
  if (
    [DATE_VALIDATION_RESULT.OUT_OF_RANGE_MIN, DATE_VALIDATION_RESULT.OUT_OF_RANGE_MAX].includes(
      payload
    )
  ) {
    emits('outOfRange', payload);
  }
}

const forceColumnView = ref(false);

function updateColumnView() {
  const wrapper = rangeWrapper.value;
  if (!(wrapper instanceof HTMLElement)) return;

  const wrapperWidth = wrapper.clientWidth;

  if (wrapperWidth < 380) {
    forceColumnView.value = true;
  } else {
    forceColumnView.value = false;
  }
}

onMounted(async () => {
  await nextTick();
  updateColumnView();
});

useResizeObserver(rangeWrapper, () => {
  updateColumnView();
});

onBeforeMount(() => {
  if (props.startDate && props.endDate && props.endDate < props.startDate) {
    model.value = {
      start: props.startDate,
      end: null,
    };
  }
});

useBuilderRegistration('LxDateTimeRange', props, { texts: textsDefault });
</script>

<template>
  <div
    ref="rangeWrapper"
    class="lx-field-wrapper lx-date-time-range-field-wrapper"
    :class="[{ 'lx-date-time-range-small-view': forceColumnView }]"
    :data-id="id"
    data-component="lx-date-time-range-picker"
  >
    <p v-if="readOnly" class="lx-data" :aria-labelledby="labelledBy">
      <LxEmptyValue
        v-if="!startDate && !endDate"
        :texts="{ emptyValue: displayTexts.emptyValue }"
      />
      <span v-else>
        <time :datetime="startDate">{{ getNameStart() }}</time
        >–<time :datetime="endDate">{{ getNameEnd() }}</time>
      </span>
    </p>
    <template v-else>
      <div
        class="lx-date-time-picker-wrapper lx-date-time-range-wrapper"
        :class="[
          {
            'lx-date':
              kind === 'date' ||
              kind === 'month' ||
              kind === 'year' ||
              kind === 'month-year' ||
              kind === 'quarters',
          },
          {
            'month-year': kind === 'month-year',
          },
        ]"
        :data-invalid="invalid ? '' : null"
        :data-disabled="disabled ? '' : null"
      >
        <LxDatePicker
          v-if="kind !== 'legacy'"
          :id="id"
          v-model="model"
          :mode="kind"
          :masks="localeMasks"
          :placeholder="placeholder"
          :disabled="disabled"
          :invalid="invalid"
          :invalidation-message="invalidationMessage"
          :helper-text="helperText"
          :helper-text-kind="helperTextKind"
          :min-date="minDate"
          :max-date="maxDate"
          :locale="localeComputed"
          :first-day-of-the-week="localeFirstDay"
          picker-type="range"
          :range-month="rangeMonth"
          :clearIfNotExact="clearIfNotExact"
          :texts="displayTexts"
          :required="required"
          :labelled-by="labelledBy"
          @outOfRange="onOutOfRange"
        />

        <div v-if="kind === 'legacy'" class="legacy-pickers-wrapper" :aria-labelledby="labelledBy">
          <LxDatePicker
            :id="`from-${id}`"
            v-model="modelStart"
            mode="date"
            :masks="localeMasks"
            :placeholder="placeholder"
            :disabled="disabled"
            :invalid="invalid"
            :invalidationMessage="invalidationMessage"
            :helper-text="helperText"
            :helper-text-kind="helperTextKind"
            :min-date="minDate"
            :max-date="startMaxDate"
            :locale="localeComputed"
            :first-day-of-the-week="localeFirstDay"
            :clearIfNotExact="clearIfNotExact"
            :texts="displayTexts"
            :required="required"
            :labelled-by="displayTexts.startDateLabel"
            @outOfRange="onOutOfRangeStartDate"
            legacy-mode
          />

          <span class="lx-date-time-range-separator">–</span>

          <LxDatePicker
            :id="`till-${id}`"
            v-model="modelEnd"
            mode="date"
            :masks="localeMasks"
            :placeholder="placeholder"
            :disabled="disabled"
            :invalid="invalid"
            :invalidationMessage="invalidationMessage"
            :helper-text="helperText"
            :helper-text-kind="helperTextKind"
            :min-date="endMinDate"
            :max-date="maxDate"
            :locale="localeComputed"
            :first-day-of-the-week="localeFirstDay"
            :clearIfNotExact="clearIfNotExact"
            :texts="displayTexts"
            :required="required"
            :labelled-by="displayTexts.endDateLabel"
            @outOfRange="onOutOfRangeEndDate"
            legacy-mode
          />
        </div>

        <div v-if="showInvalidationMessage && kind === 'legacy'" class="lx-invalidation-message">
          {{ invalidationMessageClamped }}
        </div>
      </div>
    </template>
  </div>
</template>
