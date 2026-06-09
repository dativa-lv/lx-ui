<script setup>
import { computed, inject, ref, getCurrentInstance, onUnmounted } from 'vue';
import {
  parseDate,
  formatJSON,
  formatDate,
  formatDateTime,
  formatDateJSON,
  isDateValid,
  isTimeValid,
  getMonthYearString,
  getMonthNames,
  formatFull,
} from '@/utils/dateUtils';
import { lxDateUtils } from '@/utils';
import useLx from '@/hooks/useLx';
import {
  dateFromYearAndQuarter,
  extractMonthFromDate,
  extractQuarterFromDate,
  extractYearFromDate,
  extractYearMonthFromDate,
  getMonthNameByOrder,
  parseExact,
} from '@/components/datePicker/helpers';
import { generateUUID } from '@/utils/stringUtils';
import LxDatePicker from '@/components/datePicker/DatePicker.vue';
import { getDisplayTexts } from '@/utils/generalUtils';
import { registerBuilderInstance, unregisterBuilderInstance } from '@/utils/builderUtils';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  modelValue: { type: [String, Date], default: null },
  kind: {
    type: String,
    default: 'date',
    options: ['date', 'time', 'date-time', 'month', 'year', 'month-year', 'quarters'],
    group: 'main',
    sequence: 1,
  }, // 'date', 'time', 'date-time', 'month', 'year', 'month-year', 'quarters'
  placeholder: { type: String, default: null, group: 'main', sequence: 8 },
  tooltip: { type: String, default: null, group: 'main', sequence: 7 },
  minDate: { type: Date, default: null, group: 'main', sequence: 3 },
  maxDate: { type: Date, default: null, group: 'main', sequence: 4 },
  required: { type: Boolean, default: false, group: 'additional', sequence: 4 },
  readOnly: { type: Boolean, default: false, group: 'mode', sequence: 1 },
  disabled: { type: Boolean, default: false, group: 'mode', sequence: 2 },
  invalid: { type: Boolean, default: false, sequence: 1 },
  invalidationMessage: { type: String, default: null, sequence: 2 },
  clearIfNotExact: { type: Boolean, default: false, group: 'additional', sequence: 3 },
  locale: { type: Object, default: () => useLx().getGlobals()?.locale },
  specialDates: { type: Array, default: () => [] },
  dictionary: { type: Array, default: () => [] },
  variant: {
    type: String,
    default: 'default',
    options: ['default', 'picker', 'full', 'full-rows', 'full-columns'],
    group: 'main',
    sequence: 2,
  }, // 'default', 'picker', 'full', 'full-rows', 'full-columns'
  cadenceOfMinutes: { type: Number, default: 1, options: [1, 5, 15], group: 'main', sequence: 5 }, // 1, 5, 15
  cadenceOfSeconds: { type: Number, default: 1, options: [1, 5, 15], group: 'main', sequence: 6 }, // 1, 5, 15
  labelId: { type: String, default: null },
  builderOptions: {
    type: Object,
    default: () => ({ schemaPath: null, componentStack: null, useRegistry: false }),
  },
  texts: { type: Object, default: () => ({}) },
});

const textsDefault = {
  clear: 'Attīrīt',
  todayButton: 'Atgriezties uz šodienu',
  clearButton: 'Attīrīt vērtību',
  next: 'Nākamais',
  previous: 'Iepriekšējais',
  nextMonth: 'Nākamais mēnesis',
  previousMonth: 'Iepriekšējais mēnesis',
  nextYear: 'Nākamais gads',
  previousYear: 'Iepriekšējais gads',
  nextDecade: 'Nākamā dekāde',
  previousDecade: 'Iepriekšējā dekāde',
  scrollUp: 'Ritināt uz augšu',
  scrollDown: 'Ritināt uz leju',
  noSpecialDates: 'Šajā mēnesī nav ieplānotu notikumu',
  specialDatesButton: 'Atvērt notikumus',
  closeSpecialDatesButton: 'Aizvērt notikumus',
  bottomSheetClose: 'Paslēpt paneli',
  scrollUpDown: 'Ritināt uz augšu vai leju',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));

const emits = defineEmits(['update:modelValue']);
const { dateFormat, dateTimeFormat, dateTimeFullFormat } = useLx().getGlobals();

function extractTime(datetimeStr) {
  const timeRegex = /(\d{2}:\d{2}(:\d{2})?(\s?[APMapm]{2})?)/;
  const match = datetimeStr.match(timeRegex);
  if (match) return match[0];
  return null;
}

const localeComputed = computed(() => (props.locale?.locale ? props.locale?.locale : 'lv-LV'));
const localeFirstDay = computed(() =>
  props.locale?.firstDayOfTheWeek ? props.locale?.firstDayOfTheWeek : 2
);

const localeMasks = computed(() => {
  const dateFormatToUse = dateFormat || 'dd.MM.yyyy.';
  const dateTimeFormatToUse = dateTimeFormat || 'dd.MM.yyyy. HH:mm';
  const dateTimeFullFormatToUse = dateTimeFullFormat || 'dd.MM.yyyy. HH:mm:ss';

  const defaultMasks = {
    inputDateTime24hr: dateTimeFormatToUse,
    inputDateTimeFull24hr: dateTimeFullFormatToUse,
    input: dateFormatToUse,
    inputTime24hr: 'HH:mm',
    inputTimeFull24hr: 'HH:mm:ss',
    inputMonthYear: 'yyyy-MM',
    inputQuarters: 'yyyy-QQQ',
    inputYear: 'yyyy',
  };
  return props.locale?.masks ? props.locale.masks : defaultMasks;
});

const createFirstDayDate = () => {
  const newDate = new Date();
  newDate.setDate(1); // Set to the first day of the month
  return newDate;
};

const isStringWithLength = (value, length) => typeof value === 'string' && value?.length === length;

const parseTimeModelValue = (value) => {
  if (!isStringWithLength(value, 5)) return parseDate(value);

  const newDate = createFirstDayDate();
  newDate.setHours(Number(value?.slice(0, 2)));
  newDate.setMinutes(Number(value?.slice(3, 5)));

  return newDate;
};

const parseFullTimeModelValue = (value) => {
  if (!isStringWithLength(value, 8)) return parseDate(value);

  const newDate = createFirstDayDate();
  newDate.setHours(Number(value?.slice(0, 2)));
  newDate.setMinutes(Number(value?.slice(3, 5)));
  newDate.setSeconds(Number(value?.slice(6, 8)));

  return newDate;
};

const parseMonthModelValue = (value) => {
  if (!isStringWithLength(value, 2)) return parseDate(value);

  const newDate = createFirstDayDate();
  newDate.setMonth(Number(value) - 1);

  return newDate;
};

const parseYearModelValue = (value) => {
  if (!isStringWithLength(value, 4)) return parseDate(value);

  const newDate = createFirstDayDate();
  newDate.setFullYear(Number(value));

  return newDate;
};

const parseMonthYearModelValue = (value) => {
  if (!isStringWithLength(value, 7)) return parseDate(value);

  const newDate = createFirstDayDate();
  newDate.setFullYear(Number(value?.slice(0, 4)));
  newDate.setMonth(Number(value?.slice(5, 7)) - 1);

  return newDate;
};

const parseQuarterModelValue = (value) => {
  if (!isStringWithLength(value, 7)) return parseDate(value);

  const [year, quarter] = value.split('-');
  const normalizedQuarter = quarter.split('Q');
  const newDate = dateFromYearAndQuarter(year, normalizedQuarter[1]);

  return newDate;
};

const getModelValue = () => {
  switch (props.kind) {
    case 'time':
      return parseTimeModelValue(props.modelValue);
    case 'time-full':
      return parseFullTimeModelValue(props.modelValue);
    case 'month':
      return parseMonthModelValue(props.modelValue);
    case 'year':
      return parseYearModelValue(props.modelValue);
    case 'month-year':
      return parseMonthYearModelValue(props.modelValue);
    case 'quarters':
      return parseQuarterModelValue(props.modelValue);
    default:
      return parseExact(props.modelValue);
  }
};

const emitModelValue = (value) => {
  emits('update:modelValue', value);
};

const setTimeModelValue = (newValue) => {
  const nv = extractTime(formatDateTime(newValue));
  emitModelValue(nv);
};

const setFullTimeModelValue = (newValue) => {
  const nv = extractTime(formatFull(newValue));
  emitModelValue(nv);
};

const setDateModelValue = (newValue) => {
  const nv = formatDateJSON(newValue);
  emitModelValue(nv);
};

const setDateTimeModelValue = (newValue) => {
  const nv = formatJSON(newValue);
  emitModelValue(nv);
};

const setMonthModelValue = (newValue) => {
  const nv = extractMonthFromDate(newValue);
  emitModelValue(nv);
};

const setYearModelValue = (newValue) => {
  const nv = extractYearFromDate(newValue);
  emitModelValue(nv);
};

const setMonthYearModelValue = (newValue) => {
  const nv = extractYearMonthFromDate(newValue, localeMasks.value.monthYearFormat);
  emitModelValue(nv);
};

const setQuarterModelValue = (newValue) => {
  const nv = extractQuarterFromDate(newValue);
  emitModelValue(nv);
};

const setDefaultModelValue = (newValue) => {
  const nv = formatJSON(newValue);

  if (nv === props.modelValue) return;

  emitModelValue(nv);
};

const setModelValue = (newValue) => {
  switch (props.kind) {
    case 'time':
      setTimeModelValue(newValue);
      break;
    case 'time-full':
      setFullTimeModelValue(newValue);
      break;
    case 'date':
      setDateModelValue(newValue);
      break;
    case 'dateTime':
    case 'date-time':
    case 'date-time-full':
      setDateTimeModelValue(newValue);
      break;
    case 'month':
      setMonthModelValue(newValue);
      break;
    case 'year':
      setYearModelValue(newValue);
      break;
    case 'month-year':
      setMonthYearModelValue(newValue);
      break;
    case 'quarters':
      setQuarterModelValue(newValue);
      break;
    default:
      setDefaultModelValue(newValue);
      break;
  }
};

const model = computed({
  get: getModelValue,
  set: setModelValue,
});

function getNameDate() {
  if (isDateValid(props.modelValue)) {
    return formatDate(props.modelValue);
  }
  if (typeof props.modelValue !== 'string') {
    return formatDate(props.modelValue);
  }
  return null;
}

function getNameTime() {
  if (isTimeValid(props.modelValue)) {
    return props.modelValue;
  }
  if (typeof props.modelValue !== 'string') {
    return extractTime(formatDateTime(props.modelValue));
  }
  return null;
}

function getNameDateTime() {
  if (isDateValid(props.modelValue)) {
    return formatDateTime(props.modelValue);
  }
  return null;
}

function getNameDateTimeFull() {
  if (isDateValid(props.modelValue)) {
    return formatFull(props.modelValue);
  }
  return null;
}

function getNameMonth() {
  if (typeof props.modelValue === 'string') {
    const monthsList = getMonthNames(localeComputed.value);
    return getMonthNameByOrder(monthsList, new Date(props.modelValue)?.getMonth(), true);
  }
  if (typeof props.modelValue !== 'string') {
    const monthsList = getMonthNames(localeComputed.value);
    return getMonthNameByOrder(monthsList, props.modelValue?.getMonth(), true);
  }
  return null;
}

function getNameMonthYear() {
  if (typeof props.modelValue === 'string') {
    return getMonthYearString(
      localeComputed.value,
      new Date(props.modelValue)?.getMonth(),
      new Date(props.modelValue)?.getFullYear()
    );
  }
  if (typeof props.modelValue !== 'string') {
    return getMonthYearString(
      localeComputed.value,
      props.modelValue?.getMonth(),
      props.modelValue?.getFullYear()
    );
  }
  return null;
}

function getName() {
  if (props.modelValue === '') return null;

  switch (props.kind) {
    case 'date':
      return getNameDate();

    case 'time':
      return getNameTime();

    case 'dateTime':
    case 'date-time':
      return getNameDateTime();

    case 'date-time-full':
      return getNameDateTimeFull();

    case 'month':
      return getNameMonth();

    case 'month-year':
      return getNameMonthYear();

    default:
      return props.modelValue;
  }
}

const modelValueIso = computed(() => {
  let res = props.modelValue;
  if (
    ((props.kind === 'date' || props.kind === 'dateTime' || props.kind === 'date-time') &&
      props.modelValue?.length !== 5) ||
    (props.modelValue?.length !== 5 && props.kind === 'time')
  ) {
    res = lxDateUtils.formatJSON(lxDateUtils.parseDate(props.modelValue));
  } else if (props.kind === 'time') {
    res = lxDateUtils.formatJSON(props.modelValue);
  }
  return res;
});

const colors = [
  { id: 'draft', color: 'lx-draft' },
  { id: 'new', color: 'lx-new' },
  { id: 'editing', color: 'lx-editing' },
  { id: 'edited', color: 'lx-edited' },
  { id: 'disabling', color: 'lx-disabling' },
  { id: 'inactive', color: 'lx-inactive' },
  { id: 'finishing', color: 'lx-finishing' },
  { id: 'finished', color: 'lx-finished' },
  { id: 'deleting', color: 'lx-deleting' },
  { id: 'red-full', color: 'lx-red' },
  { id: 'red', color: 'lx-red' },
  { id: 'green-full', color: 'lx-green' },
  { id: 'green', color: 'lx-green' },
  { id: 'orange-full', color: 'lx-orange' },
  { id: 'orange', color: 'lx-orange' },
  { id: 'purple-full', color: 'lx-purple' },
  { id: 'purple', color: 'lx-purple' },
  { id: 'blue-full', color: 'lx-blue' },
  { id: 'blue', color: 'lx-blue' },
  { id: 'yellow-full', color: 'lx-yellow' },
  { id: 'yellow', color: 'lx-yellow' },
  { id: 'black-full', color: 'lx-black' },
  { id: 'black', color: 'lx-black' },
];

const attributesComputed = computed(() => {
  const res = [];
  props.specialDates.forEach((element) => {
    const found = props.dictionary.find((el) => el?.id === element?.category);
    if (found) {
      const colorFind = colors.find((el) => el.id === found?.displayType)?.color;
      res.push({
        barColor: colorFind || 'blue',
        dates: element?.dates,
        popoverLabel: found?.name,
      });
    }
  });
  return res;
});

const mode = computed(() => {
  switch (props.kind) {
    case 'date-time':
    case 'dateTime':
      return 'date-time';
    default:
      return props.kind;
  }
});

const rowId = inject('rowId', ref(null));
const labelledBy = computed(() => props.labelId || rowId.value);

if (props.builderOptions?.useRegistry) {
  const instance = getCurrentInstance();
  registerBuilderInstance({
    name: 'LxDateTimePicker',
    instance,
    props,
    builderName: props.builderOptions?.schemaPath,
    componentStack: props.builderOptions?.componentStack?.concat([
      { id: props?.id, name: 'LxDateTimePicker' },
    ]),
  });

  onUnmounted(() => {
    unregisterBuilderInstance(props?.id);
  });
}
</script>

<template>
  <div class="lx-field-wrapper" :data-id="id">
    <template v-if="readOnly">
      <p class="lx-data" :aria-labelledby="labelledBy">
        <time class="date-time-readonly" :datetime="modelValueIso">
          {{ getName() }}
          <span v-if="model === null || model === undefined">—</span>
        </time>
      </p>
    </template>

    <template v-else>
      <div
        class="lx-date-time-picker-wrapper"
        :class="{
          'lx-date': kind === 'date' || kind === 'month' || kind === 'year' || kind === 'quarters',
          'lx-time': kind === 'time' || kind === 'time-full',
          'lx-date-time': kind === 'dateTime' || kind === 'date-time' || kind === 'month-year',
          'lx-date-time-full': kind === 'dateTimeFull' || kind === 'date-time-full',
        }"
        :data-invalid="invalid ? '' : null"
        :data-disabled="disabled ? '' : null"
        :title="tooltip"
      >
        <LxDatePicker
          :id="id"
          v-model="model"
          :mode="mode"
          :variant="variant"
          :masks="localeMasks"
          :placeholder="placeholder"
          :disabled="disabled"
          :invalid="invalid"
          :invalidationMessage="invalidationMessage"
          :min-date="minDate"
          :max-date="maxDate"
          :locale="localeComputed"
          :first-day-of-the-week="localeFirstDay"
          :special-dates-attributes="attributesComputed"
          :clearIfNotExact="clearIfNotExact"
          :cadenceOfMinutes="cadenceOfMinutes"
          :cadenceOfSeconds="cadenceOfSeconds"
          :texts="displayTexts"
          :labelled-by="labelledBy"
        />
      </div>
    </template>
  </div>
</template>
