<script setup>
import { ref, computed, watch, onMounted, inject, nextTick } from 'vue';
import { useMediaQuery, useWindowSize } from '@vueuse/core';
import { getDisplayTexts } from '@/utils/generalUtils';

import {
  parseDate,
  getMonthNames,
  getWeekdayNames,
  getMonthYearString,
  isDateValid,
  isTimeValid,
  formatLocalizedDate,
  isTimeFullValid,
} from '@/utils/dateUtils';
import {
  getMonthNameByOrder,
  formatInputRawDate,
  formatInputRawDateTime,
  formatInputRawTime,
  canSelectDate,
  zeroPad,
  extractQuarterFromDate,
  validateDateByMask,
  removeLastNonAlphanumeric,
  sanitizeDateInput,
  formatInputRawTimeFull,
  formatInputRawDateTimeFull,
  validateDateRange,
  normalizeFlexibleTimeInput,
  isStandardTimeMask,
  isTimeWithinMinMax,
  normalizeFlexibleDateInput,
  constants,
} from '@/components/datePicker/helpers';
import { getKindConfig } from '@/components/datePicker/kindConfig';
import { DATE_VALIDATION_RESULT, TYPED_INPUT_DEFAULT_MASKS } from '@/constants';
import LxCalendarContainer from '@/components/datePicker/CalendarContainer.vue';
import LxDropDownMenu from '@/components/DropDownMenu.vue';
import LxIcon from '@/components/Icon.vue';

const props = defineProps({
  id: { type: String, default: null },
  modelValue: { type: [String, Date, Object], default: null },
  mode: { type: String, default: 'date' }, // 'date', 'time', 'time-full', 'date-time', 'date-time-full', 'month', 'year', 'month-year', 'quarters', ('day-month' is handled by LxDayMonthPicker, not here)
  variant: { type: String, default: 'default' }, // 'default', 'picker', 'full', 'full-rows', 'full-columns'
  masks: { type: Object, default: () => {} },
  placeholder: { type: String, default: null },
  disabled: { type: Boolean, default: false },
  invalid: { type: Boolean, default: false },
  invalidationMessage: { type: String, default: null },
  minDate: { type: [String, Date], default: null },
  maxDate: { type: [String, Date], default: null },
  required: { type: Boolean, default: false },
  locale: { type: String, default: 'lv-LV' },
  firstDayOfTheWeek: { type: Number, default: 2 },
  specialDatesAttributes: { type: Array, default: null },
  clearIfNotExact: { type: Boolean, default: false },
  cadenceOfMinutes: { type: Number, default: 1 }, // 1, 5, 15
  cadenceOfSeconds: { type: Number, default: 1 }, // 1, 5, 15
  pickerType: { type: String, default: 'single' }, // 'single', 'range'
  labelledBy: { type: String, default: null },
  legacyMode: { type: Boolean, default: false }, // legacy mode flag to separate logic without breaking date mode flow and validations
  texts: {
    type: Object,
    default: () => ({}),
  },
});

const textsDefault = {
  clear: 'Attīrīt',
  clearButton: 'Attīrīt vērtību',
  todayButton: 'Atgriezties uz šodienu',
  specialDatesButton: 'Atvērt notikumus',
  closeSpecialDatesButton: 'Aizvērt notikumus',
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
  noSpecialDates: 'Šajā mēnesī nav ieplānotu notikumu',
  inputManual: 'Ievadīt manuāli',
  bottomSheetClose: 'Paslēpt paneli',
  scrollUpDown: 'Ritināt uz augšu vai leju',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));

const emits = defineEmits(['update:modelValue', 'outOfRange']);

const containerRef = ref();
const dropDownMenuRef = ref();
// Localized month and week days lists
const localizedMonthsList = ref([]);
const weekDaysList = ref([]);

// Refs for min and max date range local use
const minDateRef = ref(null);
const maxDateRef = ref(null);

const modelInput = ref(null);
const modelEndDateInput = ref(null);

// Refs for active input state handling
const activeInput = ref(null);
const startInputRefs = ref({});
const endInputRefs = ref({});

const liveMessage = ref('');

const tapStage = ref(0);
const openSource = ref(null);

// touch tracking (to prevent triggering sheet when trying to scroll)
const touchStartX = ref(0);
const touchStartY = ref(0);
const touchStartTime = ref(0);
const pendingTouchType = ref(null);
const touchCancelled = ref(false);
const TOUCH_MOVE_THRESHOLD = 10; // pixels
const TOUCH_TIME_THRESHOLD = 500; // ms

const windowSize = useWindowSize();

const responsiveView = computed(() => windowSize.width.value <= 500);

const isTouchSensitive = inject('isTouchMode', ref(false));
const isTouchMode = useMediaQuery('(pointer: coarse), (pointer: none)');

// Computed model value for selected date handling
const model = computed({
  get() {
    if (!props.modelValue) return null;
    return props.modelValue;
  },
  set(value) {
    emits('update:modelValue', value);
  },
});

function setActiveInput(type, id, defaultFocus = false) {
  const shouldSkipInputFocusOnMobileTouch =
    responsiveView.value &&
    (isTouchSensitive.value || isTouchMode.value || openSource.value === 'touch');

  if (shouldSkipInputFocusOnMobileTouch) {
    activeInput.value = type;
    return;
  }

  if (!responsiveView.value) {
    activeInput.value = type;
  }

  const shouldPreservePickerFocus =
    props.pickerType === 'range' &&
    dropDownMenuRef.value?.menuOpen &&
    openSource.value === 'keyboard';

  if (shouldPreservePickerFocus) return;

  if (defaultFocus) return;

  if (startInputRefs.value[id] && type === 'startInput') {
    startInputRefs.value[id].focus();
    return;
  }
  if (endInputRefs.value[id] && type === 'endInput') {
    endInputRefs.value[id].focus();
  }
}

// Range-focus side effect shared by the valid-date range branches.
function applyRangeFocus(type, rangeValue) {
  if (props.pickerType !== 'range') return;

  const hasStart = Boolean(rangeValue?.start);
  const hasEnd = Boolean(rangeValue?.end);

  if (hasStart && !hasEnd) {
    setActiveInput('endInput', props.id);
    return;
  }

  if (!hasStart && hasEnd) {
    setActiveInput('startInput', props.id);
    return;
  }

  if (hasStart && hasEnd) {
    setActiveInput(type, props.id);
  }
}

// Reset a date/date-mask input to "today" (or clear it) when the entry is not exact.
function resetDateInputToFallback(e, inputMask, validationResult = null) {
  const updatedValue = props.clearIfNotExact ? null : new Date();

  if (
    validationResult &&
    [DATE_VALIDATION_RESULT.OUT_OF_RANGE_MAX, DATE_VALIDATION_RESULT.OUT_OF_RANGE_MIN].includes(
      // @ts-ignore TS2345:: value narrowed at runtime via includes();
      validationResult
    )
  ) {
    emits('outOfRange', validationResult);
  }

  emits('update:modelValue', updatedValue);

  const newDay = new Date().getDate();
  const newMonth = new Date().getMonth();
  const newYear = new Date().getFullYear();

  const newDateString = inputMask
    .replace('dd', zeroPad(newDay))
    .replace('MM', zeroPad(newMonth + 1))
    .replace('yyyy', newYear);

  e.target.value = props.clearIfNotExact ? null : newDateString;
}

// Range cleanup when the typed value fails the MASK check. Returns true if handled.
function clearRangeForInvalidDateMask(e, type) {
  if (type === 'startInput' && model.value.end) {
    emits('update:modelValue', { start: null, end: model.value.end });
    e.target.value = null;
    return true;
  }
  if (type === 'startInput' && !model.value.end) {
    emits('update:modelValue', { start: null, end: null });
    e.target.value = null;
    return true;
  }
  if (type === 'endInput' && model.value.start) {
    emits('update:modelValue', { start: model.value.start, end: null });
    e.target.value = null;
    return true;
  }
  // NOTE: intentionally keyed on `!model.value.end` (mirrors original mask-invalid branch).
  if (type === 'endInput' && !model.value.end) {
    emits('update:modelValue', { start: null, end: null });
    e.target.value = null;
    return true;
  }
  return false;
}

// Range cleanup when the value is well-formed but INVALID/out-of-range. Returns true if handled.
function clearRangeForInvalidDateValue(e, type) {
  if (type === 'startInput' && model.value.end) {
    emits('update:modelValue', { start: null, end: model.value.end });
    e.target.value = null;
    return true;
  }
  if (type === 'startInput' && !model.value.end) {
    emits('update:modelValue', { start: null, end: null });
    e.target.value = null;
    return true;
  }
  if (type === 'endInput' && model.value.start) {
    emits('update:modelValue', { start: model.value.start, end: null });
    e.target.value = null;
    return true;
  }
  // NOTE: intentionally keyed on `!model.value.start` (differs from the mask variant above).
  if (type === 'endInput' && !model.value.start) {
    emits('update:modelValue', { start: null, end: null });
    e.target.value = null;
    return true;
  }
  return false;
}

function parseDateInput(cleanedDate, cleanedMask) {
  const dayIndex = cleanedMask?.indexOf('dd');
  const monthIndex = cleanedMask?.indexOf('MM');
  const yearIndex = cleanedMask?.indexOf('yyyy');

  const day = Number(cleanedDate.substring(dayIndex, dayIndex + 2));
  const month = Number(cleanedDate.substring(monthIndex, monthIndex + 2));
  const year = Number(cleanedDate.substring(yearIndex, yearIndex + 4));

  const normalizedDay = zeroPad(day);
  const normalizedMonth = zeroPad(month);

  return {
    dateString: `${year}-${normalizedMonth}-${normalizedDay}`, // "YYYY-MM-DD"
    hasAllParts: Boolean(day && month && year),
    updatedValue: day && month && year ? new Date(year, month - 1, day) : null,
  };
}

// Apply a valid date to the START input of a range. (Branches merged where bodies are identical.)
function applyValidDateRangeStart(type, updatedValue) {
  if (!updatedValue && model.value.end) {
    const updatedDatesObject = { start: null, end: model.value.end };
    emits('update:modelValue', updatedDatesObject);
    applyRangeFocus(type, updatedDatesObject);
    return;
  }
  if (!updatedValue && !model.value.end) {
    emits('update:modelValue', { start: null, end: null });
    return;
  }
  if (updatedValue && model.value.end) {
    let updatedDatesObject = { start: updatedValue, end: model.value.end };
    if (updatedValue > model.value.end) {
      updatedDatesObject = { start: updatedValue, end: null };
    }
    emits('update:modelValue', updatedDatesObject);
    applyRangeFocus(type, updatedDatesObject);
    return;
  }
  if (updatedValue && !model.value.end) {
    const updatedDatesObject = { start: updatedValue, end: null };
    emits('update:modelValue', updatedDatesObject);
    applyRangeFocus(type, updatedDatesObject);
  }
}

// Apply a valid date to the END input of a range. (Branches merged where bodies are identical.)
function applyValidDateRangeEnd(type, updatedValue) {
  if (!updatedValue && model.value.start) {
    const updatedDatesObject = { start: model.value.start, end: null };
    emits('update:modelValue', updatedDatesObject);
    applyRangeFocus(type, updatedDatesObject);
    return;
  }
  if (!updatedValue && !model.value.start) {
    emits('update:modelValue', { start: null, end: null });
    return;
  }
  if (updatedValue && model.value.start) {
    let updatedDatesObject = { start: model.value.start, end: updatedValue };
    if (updatedValue < model.value.start) {
      updatedDatesObject = { start: updatedValue, end: null };
      liveMessage.value = `${displayTexts.value.selectedStartDate}: ${formatLocalizedDate(
        props.locale,
        updatedValue
      )}`;
    }
    emits('update:modelValue', updatedDatesObject);
    applyRangeFocus(type, updatedDatesObject);
    return;
  }
  if (updatedValue && !model.value.start) {
    const updatedDatesObject = { start: null, end: updatedValue };
    emits('update:modelValue', updatedDatesObject);
    applyRangeFocus(type, updatedDatesObject);
  }
}

function applyValidDateRange(type, updatedValue) {
  if (type === 'startInput') applyValidDateRangeStart(type, updatedValue);
  if (type === 'endInput') applyValidDateRangeEnd(type, updatedValue);
}

function validateDateInput(e, type) {
  const rawDate = normalizeFlexibleDateInput(e.target.value, maxDateRef.value);
  const inputMask = props.masks?.input || 'dd.MM.yyyy.';

  const cleanedDate = removeLastNonAlphanumeric(rawDate);
  const cleanedMask = removeLastNonAlphanumeric(inputMask);

  if (!rawDate || !validateDateByMask(cleanedDate, cleanedMask)) {
    if (props.pickerType === 'range' && clearRangeForInvalidDateMask(e, type)) return;
    resetDateInputToFallback(e, inputMask);
    return;
  }

  const { dateString, hasAllParts, updatedValue } = parseDateInput(cleanedDate, cleanedMask);

  // Check if the constructed date is valid
  if (hasAllParts && !isDateValid(new Date(dateString))) {
    if (props.pickerType === 'range' && clearRangeForInvalidDateValue(e, type)) return;
    resetDateInputToFallback(e, inputMask);
    return;
  }

  const dateRangeValidationResult = validateDateRange(
    new Date(dateString),
    props.minDate,
    props.maxDate
  );

  // Check if the date is within the min/max range
  if (
    hasAllParts &&
    dateRangeValidationResult !== DATE_VALIDATION_RESULT.VALID &&
    dateRangeValidationResult !== DATE_VALIDATION_RESULT.NO_VALUE
  ) {
    resetDateInputToFallback(e, inputMask, dateRangeValidationResult);
    return;
  }

  if (props.pickerType === 'single') {
    emits('update:modelValue', updatedValue);
  }
  if (props.pickerType === 'range') {
    applyValidDateRange(type, updatedValue);
  }
}

function validateTimeInput(e) {
  const now = new Date();
  const inputTime24hrMask = props.masks?.inputTime24hr || 'HH:mm';

  const standardMask = isStandardTimeMask(inputTime24hrMask);

  const rawInput = e.target.value;
  const normalizedInput = standardMask ? normalizeFlexibleTimeInput(rawInput) : rawInput;

  if (!normalizedInput || !validateDateByMask(normalizedInput, inputTime24hrMask)) {
    const updatedValue = new Date();

    if (props.clearIfNotExact) {
      e.target.value = null;
      emits('update:modelValue', null);
      return;
    }

    if (!isTimeWithinMinMax(updatedValue, minDateRef.value, maxDateRef.value)) {
      e.target.value = null;
      emits('update:modelValue', null);
      return;
    }

    const newHours = zeroPad(updatedValue.getHours());
    const newMinutes = zeroPad(updatedValue.getMinutes());

    const newTimeString = inputTime24hrMask
      .replace('HH', zeroPad(newHours))
      .replace('mm', zeroPad(newMinutes));

    e.target.value = newTimeString;
    emits('update:modelValue', updatedValue);
    return;
  }

  const hoursIndex = inputTime24hrMask.indexOf('HH');
  const minutesIndex = inputTime24hrMask.indexOf('mm');

  const hours = Number(normalizedInput.substring(hoursIndex, hoursIndex + 2));
  const minutes = Number(normalizedInput.substring(minutesIndex, minutesIndex + 2));

  const normalizedHours = zeroPad(hours);
  const normalizedMinutes = zeroPad(minutes);

  if (!isTimeValid(`${normalizedHours}:${normalizedMinutes}`)) {
    const updatedValue = new Date();

    if (props.clearIfNotExact) {
      e.target.value = null;
      emits('update:modelValue', null);
      return;
    }

    const newHours = updatedValue.getHours();
    const newMinutes = updatedValue.getMinutes();

    const newTimeString = inputTime24hrMask
      .replace('HH', zeroPad(newHours))
      .replace('mm', zeroPad(newMinutes));

    e.target.value = newTimeString;
    emits('update:modelValue', updatedValue);
    return;
  }

  const updatedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);

  if (!isTimeWithinMinMax(updatedDate, minDateRef.value, maxDateRef.value)) {
    e.target.value = null;
    emits('update:modelValue', null);
    return;
  }

  emits('update:modelValue', updatedDate);
}

function validateTimeFullInput(e) {
  const now = new Date();
  const inputTimeFull24hrMask = props.masks?.inputTimeFull24hr || 'HH:mm:ss';

  const standardMask = isStandardTimeMask(inputTimeFull24hrMask);

  const rawInput = e.target.value;
  const normalizedInput = standardMask ? normalizeFlexibleTimeInput(rawInput, true) : rawInput;

  if (!normalizedInput || !validateDateByMask(normalizedInput, inputTimeFull24hrMask)) {
    const updatedValue = new Date();

    if (props.clearIfNotExact) {
      e.target.value = null;
      emits('update:modelValue', null);
      return;
    }

    if (!isTimeWithinMinMax(updatedValue, minDateRef.value, maxDateRef.value)) {
      e.target.value = null;
      emits('update:modelValue', null);
      return;
    }

    const newHours = updatedValue.getHours();
    const newMinutes = updatedValue.getMinutes();
    const newSeconds = updatedValue.getSeconds();

    const newTimeString = inputTimeFull24hrMask
      .replace('HH', zeroPad(newHours))
      .replace('mm', zeroPad(newMinutes))
      .replace('ss', zeroPad(newSeconds));

    e.target.value = newTimeString;
    emits('update:modelValue', updatedValue);
    return;
  }

  const hoursIndex = inputTimeFull24hrMask?.indexOf('HH');
  const minutesIndex = inputTimeFull24hrMask?.indexOf('mm');
  const secondsIndex = inputTimeFull24hrMask?.indexOf('ss');

  const hours = Number(normalizedInput.substring(hoursIndex, hoursIndex + 2));
  const minutes = Number(normalizedInput.substring(minutesIndex, minutesIndex + 2));
  const seconds = Number(normalizedInput.substring(secondsIndex, secondsIndex + 2));

  const normalizedHours = zeroPad(hours);
  const normalizedMinutes = zeroPad(minutes);
  const normalizedSeconds = zeroPad(seconds);

  if (!isTimeFullValid(`${normalizedHours}:${normalizedMinutes}:${normalizedSeconds}`)) {
    const updatedValue = new Date();

    if (props.clearIfNotExact) {
      e.target.value = null;
      emits('update:modelValue', null);
      return;
    }

    const newHours = updatedValue.getHours();
    const newMinutes = updatedValue.getMinutes();
    const newSeconds = updatedValue.getSeconds();

    const newTimeString = inputTimeFull24hrMask
      .replace('HH', zeroPad(newHours))
      .replace('mm', zeroPad(newMinutes))
      .replace('ss', zeroPad(newSeconds));

    e.target.value = newTimeString;
    emits('update:modelValue', updatedValue);
    return;
  }

  const updatedDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    seconds
  );

  if (!isTimeWithinMinMax(updatedDate, minDateRef.value, maxDateRef.value)) {
    e.target.value = null;
    emits('update:modelValue', null);
    return;
  }

  emits('update:modelValue', updatedDate);
}

function validateDateTimeInput(e) {
  const dateTime = e.target.value;
  const inputDateTime24hrMask = props.masks?.inputDateTime24hr || 'dd.MM.yyyy. HH:mm';

  let [date, time] = dateTime.split(' ');
  const [dateMask, timeMask] = inputDateTime24hrMask.split(' ');

  date = normalizeFlexibleDateInput(removeLastNonAlphanumeric(date), maxDateRef.value);
  time = normalizeFlexibleTimeInput(time);

  const cleanedDate = removeLastNonAlphanumeric(date);
  const cleanedMask = removeLastNonAlphanumeric(dateMask);

  const constructedDateTimeString = `${cleanedDate} ${time}`;
  const constructedMaskString = `${cleanedMask} ${timeMask}`;

  if (
    (dateTime && !validateDateByMask(constructedDateTimeString, constructedMaskString)) ||
    timeMask.length !== time.length ||
    cleanedDate.length !== cleanedMask.length
  ) {
    if (props.clearIfNotExact) {
      e.target.value = null;
      emits('update:modelValue', null);
      return;
    }

    const updatedValue = new Date();

    const newDay = new Date().getDate();
    const newMonth = new Date().getMonth();
    const newYear = new Date().getFullYear();
    const newHours = new Date().getHours();
    const newMinutes = new Date().getMinutes();

    const newDateTimeString = inputDateTime24hrMask
      .replace('dd', zeroPad(newDay))
      .replace('MM', zeroPad(newMonth + 1))
      .replace('yyyy', newYear)
      .replace('HH', newHours)
      .replace('mm', newMinutes);

    e.target.value = newDateTimeString;
    emits('update:modelValue', updatedValue);
    return;
  }

  const dayIndex = constructedMaskString?.indexOf('dd');
  const monthIndex = constructedMaskString?.indexOf('MM');
  const yearIndex = constructedMaskString?.indexOf('yyyy');
  const hoursIndex = constructedMaskString?.indexOf('HH');
  const minutesIndex = constructedMaskString?.indexOf('mm');

  const day = constructedDateTimeString?.substring(dayIndex, dayIndex + 2);
  const month = constructedDateTimeString?.substring(monthIndex, monthIndex + 2);
  const year = constructedDateTimeString?.substring(yearIndex, yearIndex + 4);
  const hours = constructedDateTimeString?.substring(hoursIndex, hoursIndex + 2);
  const minutes = constructedDateTimeString?.substring(minutesIndex, minutesIndex + 2);

  const normalizedDay = zeroPad(day);
  const normalizedMonth = zeroPad(month);
  const normalizedHours = zeroPad(hours);
  const normalizedMinutes = zeroPad(minutes);
  const normalizedSeconds = zeroPad(0);

  const dateString = `${year}-${normalizedMonth}-${normalizedDay}`; // "YYYY-MM-DD"
  const timeString = `${normalizedHours}:${normalizedMinutes}`; // "HH:mm"
  const fullTimeString = `${normalizedHours}:${normalizedMinutes}:${normalizedSeconds}`; // "HH:mm:ss"

  // Check if the constructed date and time is valid
  if (!isDateValid(dateString) || !isTimeValid(timeString)) {
    const updatedValue = props.clearIfNotExact ? null : new Date();
    emits('update:modelValue', updatedValue);
    return;
  }

  // Combine the date and time strings into a valid ISO string
  const dateTimeString = `${dateString}T${fullTimeString}`;

  // Check if the date is within the min/max range
  if (!canSelectDate(new Date(dateTimeString), props.minDate, props.maxDate, props.mode)) {
    const updatedValue = props.clearIfNotExact ? null : new Date();
    emits('update:modelValue', updatedValue);
    modelInput.value = null;
    return;
  }

  // Update the value with the valid date
  const updatedValue = new Date(dateTimeString);
  emits('update:modelValue', updatedValue);
}

function validateDateTimeFullInput(e) {
  const dateTimeFull = e.target.value;
  const inputDateTimeFull24hrMask = props.masks?.inputDateTimeFull24hr || 'dd.MM.yyyy. HH:mm:ss';

  let [date, time] = dateTimeFull.split(' ');
  const [dateMask, timeMask] = inputDateTimeFull24hrMask.split(' ');

  date = normalizeFlexibleDateInput(removeLastNonAlphanumeric(date), maxDateRef.value);
  time = normalizeFlexibleTimeInput(time, true);

  const cleanedDate = removeLastNonAlphanumeric(date);
  const cleanedMask = removeLastNonAlphanumeric(dateMask);

  const constructedDateTimeString = `${cleanedDate} ${time}`;
  const constructedMaskString = `${cleanedMask} ${timeMask}`;

  if (
    (dateTimeFull && !validateDateByMask(constructedDateTimeString, constructedMaskString)) ||
    timeMask.length !== time.length ||
    cleanedDate.length !== cleanedMask.length
  ) {
    if (props.clearIfNotExact) {
      e.target.value = null;
      emits('update:modelValue', null);
      return;
    }

    const updatedValue = new Date();

    const newDay = new Date().getDate();
    const newMonth = new Date().getMonth();
    const newYear = new Date().getFullYear();
    const newHours = new Date().getHours();
    const newMinutes = new Date().getMinutes();
    const newSeconds = new Date().getSeconds();

    const newDateTimeFullString = inputDateTimeFull24hrMask
      .replace('dd', zeroPad(newDay))
      .replace('MM', zeroPad(newMonth + 1))
      .replace('yyyy', newYear)
      .replace('HH', newHours)
      .replace('mm', newMinutes)
      .replace('ss', newSeconds);

    e.target.value = newDateTimeFullString;
    emits('update:modelValue', updatedValue);
    return;
  }

  const dayIndex = constructedMaskString?.indexOf('dd');
  const monthIndex = constructedMaskString?.indexOf('MM');
  const yearIndex = constructedMaskString?.indexOf('yyyy');
  const hoursIndex = constructedMaskString?.indexOf('HH');
  const minutesIndex = constructedMaskString?.indexOf('mm');
  const secondsIndex = constructedMaskString?.indexOf('ss');

  const day = constructedDateTimeString?.substring(dayIndex, dayIndex + 2);
  const month = constructedDateTimeString?.substring(monthIndex, monthIndex + 2);
  const year = constructedDateTimeString?.substring(yearIndex, yearIndex + 4);
  const hours = constructedDateTimeString?.substring(hoursIndex, hoursIndex + 2);
  const minutes = constructedDateTimeString?.substring(minutesIndex, minutesIndex + 2);
  const seconds = constructedDateTimeString?.substring(secondsIndex, secondsIndex + 2);

  const normalizedDay = zeroPad(day);
  const normalizedMonth = zeroPad(month);
  const normalizedHours = zeroPad(hours);
  const normalizedMinutes = zeroPad(minutes);
  const normalizedSeconds = zeroPad(seconds);

  const dateString = `${year}-${normalizedMonth}-${normalizedDay}`; // "YYYY-MM-DD"
  const fullTimeString = `${normalizedHours}:${normalizedMinutes}:${normalizedSeconds}`; // "HH:mm:ss"

  // Check if the constructed date and time is valid
  if (!isDateValid(dateString) || !isTimeFullValid(fullTimeString)) {
    const updatedValue = props.clearIfNotExact ? null : new Date();
    emits('update:modelValue', updatedValue);
    return;
  }

  // Combine the date and time strings into a valid ISO string
  const dateTimeString = `${dateString}T${fullTimeString}`;

  // Check if the date is within the min/max range
  if (!canSelectDate(new Date(dateTimeString), props.minDate, props.maxDate, props.mode)) {
    const updatedValue = props.clearIfNotExact ? null : new Date();
    emits('update:modelValue', updatedValue);
    modelInput.value = null;
    return;
  }

  // Update the value with the valid date
  const updatedValue = new Date(dateTimeString);
  emits('update:modelValue', updatedValue);
}

// Reset a year input to the current year (or clear it) when the entry is not exact.
function resetYearInputToFallback(e) {
  const updatedValue = props.clearIfNotExact ? null : new Date();
  emits('update:modelValue', updatedValue);
  e.target.value = props.clearIfNotExact ? null : new Date().getFullYear();
}

// b3 of year-end: clamp with focus side effect when the new end precedes the start.
function emitYearEndWithStart(updatedValue) {
  let updatedDatesObject = { start: model.value.start, end: updatedValue };
  if (updatedValue < model.value.start) {
    updatedDatesObject = { start: updatedValue, end: null };
    setActiveInput('endInput', props.id);
  }
  emits('update:modelValue', updatedDatesObject);
}

// b4 of year-end: clamp without the focus side effect.
function emitYearEndStartOnly(updatedValue) {
  let updatedDatesObject = { start: model.value.start, end: updatedValue };
  if (updatedValue < model.value.start) {
    updatedDatesObject = { start: updatedValue, end: null };
  }
  emits('update:modelValue', updatedDatesObject);
}

function resolveYearStartWithEnd(updatedValue) {
  if (updatedValue > model.value.end) {
    setActiveInput('endInput', props.id);
    return { start: updatedValue, end: null };
  }
  return { start: updatedValue, end: model.value.end };
}

function applyValidYearRangeStart(updatedValue) {
  if (!updatedValue && model.value.end) {
    emits('update:modelValue', { start: null, end: model.value.end });
    setActiveInput('endInput', props.id);
    return;
  }
  if (!updatedValue && !model.value.end) {
    emits('update:modelValue', { start: null, end: null });
    return;
  }
  if (updatedValue && model.value.start && model.value.end) {
    emits('update:modelValue', resolveYearStartWithEnd(updatedValue));
    setActiveInput('endInput', props.id);
    return;
  }
  if (updatedValue && !model.value.start && model.value.end) {
    emits('update:modelValue', resolveYearStartWithEnd(updatedValue));
    return;
  }
  if (updatedValue && !model.value.end) {
    emits('update:modelValue', { start: updatedValue, end: null });
    setActiveInput('endInput', props.id);
  }
}

function applyValidYearRangeEnd(updatedValue) {
  if (!updatedValue && model.value.start) {
    emits('update:modelValue', { start: props.modelValue.start, end: null });
    return;
  }
  if (!updatedValue && !model.value.start) {
    emits('update:modelValue', { start: null, end: null });
    return;
  }
  if (updatedValue && model.value.start && model.value.end) {
    emitYearEndWithStart(updatedValue);
    return;
  }
  if (updatedValue && model.value.start && !model.value.end) {
    emitYearEndStartOnly(updatedValue);
    return;
  }
  if (updatedValue && !model.value.start && model.value.end) {
    emits('update:modelValue', { start: null, end: updatedValue });
    setActiveInput('startInput', props.id);
    return;
  }
  if (updatedValue && !model.value.start && !model.value.end) {
    emits('update:modelValue', { start: null, end: updatedValue });
  }
}

function applyValidYearRange(type, updatedValue) {
  if (type === 'startInput') applyValidYearRangeStart(updatedValue);
  if (type === 'endInput') applyValidYearRangeEnd(updatedValue);
}

function validateYearInput(e, type) {
  const year = e.target.value;
  const inputYear = props.masks?.inputYear || 'yyyy';

  if (inputYear.length !== year.length || !validateDateByMask(year, inputYear)) {
    if (props.pickerType === 'range' && clearRangeForInvalidDateMask(e, type)) return;
    resetYearInputToFallback(e);
    return;
  }

  const dateString = `${year}-${1}-${1}`; // "YYYY-MM-DD"

  // Check if the year is within the min/max range
  if (year && !canSelectDate(new Date(dateString), props.minDate, props.maxDate, 'year')) {
    if (props.pickerType === 'range' && clearRangeForInvalidDateValue(e, type)) return;
    resetYearInputToFallback(e);
    return;
  }

  // Update the value with the valid date
  const updatedValue = new Date(year, 1, 1, 0, 0);

  if (props.pickerType === 'single') {
    emits('update:modelValue', updatedValue);
  }
  if (props.pickerType === 'range') {
    applyValidYearRange(type, updatedValue);
  }
}

function validateIfExact(e, type = 'startInput') {
  if (props.pickerType === 'single' && !e.target.value) {
    emits('update:modelValue', null);
    return;
  }

  if (props.mode === 'date') {
    validateDateInput(e, type);
    return;
  }
  if (props.mode === 'time') {
    validateTimeInput(e);
    return;
  }
  if (props.mode === 'time-full') {
    validateTimeFullInput(e);
    return;
  }
  if (props.mode === 'date-time') {
    validateDateTimeInput(e);
    return;
  }
  if (props.mode === 'date-time-full') {
    validateDateTimeFullInput(e);
    return;
  }
  if (props.mode === 'year') {
    validateYearInput(e, type);
  }
}

function openMenu(type, source = null) {
  if (props.disabled) return;
  activeInput.value = type;
  openSource.value = source;
  dropDownMenuRef.value?.openMenu({ source });
}

function closeMenu() {
  activeInput.value = null;
  tapStage.value = 0;
  openSource.value = null;
  dropDownMenuRef.value?.closeMenu();
}

function blurActiveElement() {
  nextTick(() => {
    const el = document.activeElement;
    if (el && typeof el.blur === 'function') el.blur();
  });
}

function inputManualClick(id) {
  if (id !== 'inputManual') return;

  const targetType = activeInput.value || 'startInput';
  const target =
    targetType === 'startInput' ? startInputRefs.value[props.id] : endInputRefs.value[props.id];

  target?.focus();
  dropDownMenuRef.value?.closeMenu();
}

// Touch handling in responsive mode (need to fix issue with second touch for dateTimeRange)
function handleTouchResponsiveToggle(isOpen, type) {
  if (!isOpen) {
    openMenu(type, 'touch');
    return;
  }
  closeMenu();
  nextTick(() => setActiveInput(type, props.id, false));
}

function handleTouchToggle(isOpen, type) {
  if (!isOpen) {
    tapStage.value = 1;
    openMenu(type, 'touch');
    return;
  }

  switch (tapStage.value) {
    case 1:
      tapStage.value = 2;
      nextTick(() => setActiveInput(type, props.id, false));
      break;

    case 2:
      if (activeInput.value === type) {
        closeMenu();
        blurActiveElement();
      } else {
        nextTick(() => setActiveInput(type, props.id, false));
      }
      break;

    default:
      tapStage.value = 0;
      closeMenu();
      blurActiveElement();
      break;
  }
}

const previousClickedType = ref(null);

function handleDesktopToggle(isOpen, type) {
  if (props.pickerType === 'range' && isOpen && type !== previousClickedType.value) {
    previousClickedType.value = type;
    return;
  }
  if (isOpen) {
    closeMenu();
  } else {
    openMenu(type, 'click');
  }
  previousClickedType.value = type;
}

function toggleMenu(type, toggleType = null) {
  if (props.disabled || (isTouchMode.value && toggleType === 'click')) return;

  if (toggleType === 'enter') {
    return;
  }

  const menu = dropDownMenuRef.value;
  const isOpen = menu?.menuOpen;

  if (!isTouchSensitive.value) {
    handleDesktopToggle(isOpen, type);

    setTimeout(() => {
      setActiveInput(type, props.id, false);
    }, 0);

    return;
  }

  if (responsiveView.value && props.pickerType === 'range') {
    handleTouchResponsiveToggle(isOpen, type);
    return;
  }

  handleTouchToggle(isOpen, type);
}

function preventDefaultFocus(e) {
  if (isTouchSensitive.value) {
    e.preventDefault();
  }
}

function preventSpaceScrollInNonInputMode(e) {
  if (props.mode === 'month' || props.mode === 'month-year' || props.mode === 'quarters') {
    e.preventDefault();
  }
}

function preventCloseOnInputArea(e) {
  if (e.target !== e.currentTarget) {
    dropDownMenuRef.value?.preventClose(e);
    return;
  }
  e.stopPropagation();
  if (dropDownMenuRef.value?.menuOpen) {
    dropDownMenuRef.value.closeMenu();
  }
}

function onTouchStart(e, type) {
  const t = e.touches && e.touches[0];
  if (!t) return;

  touchStartX.value = t.clientX;
  touchStartY.value = t.clientY;
  touchStartTime.value = Date.now();
  pendingTouchType.value = type;
  touchCancelled.value = false;
}

function onTouchMove(e) {
  if (!pendingTouchType.value) return;
  const t = e.touches && e.touches[0];
  if (!t) return;

  const dx = Math.abs(t.clientX - touchStartX.value);
  const dy = Math.abs(t.clientY - touchStartY.value);
  if (dx > TOUCH_MOVE_THRESHOLD || dy > TOUCH_MOVE_THRESHOLD) {
    touchCancelled.value = true;
    pendingTouchType.value = null;
  }
}

function onTouchEnd(e, type) {
  if (!pendingTouchType.value || pendingTouchType.value !== type) {
    pendingTouchType.value = null;
    return;
  }

  const duration = Date.now() - touchStartTime.value;
  const cancelled = touchCancelled.value;

  pendingTouchType.value = null;
  touchCancelled.value = false;

  if (!cancelled && duration < TOUCH_TIME_THRESHOLD) {
    toggleMenu(type, 'touch');
  }
}

// Helper function to format date according to mode
function formatDateByMode(date) {
  switch (props.mode) {
    case 'date':
      return formatInputRawDate(props.masks.input, date);
    case 'date-time':
      return formatInputRawDateTime(props.masks.inputDateTime24hr, date);
    case 'date-time-full':
      return formatInputRawDateTimeFull(props.masks.inputDateTimeFull24hr, date);
    case 'time':
      return formatInputRawTime(props.masks.inputTime24hr, date);
    case 'time-full':
      return formatInputRawTimeFull(props.masks.inputTimeFull24hr, date);
    case 'month':
      return getMonthNameByOrder(localizedMonthsList.value, date.getMonth(), true);
    case 'year':
      return date.getFullYear();
    case 'month-year':
      return getMonthYearString(props.locale, date?.getMonth(), date?.getFullYear());
    case 'quarters':
      return extractQuarterFromDate(date, props.masks.inputQuarters);
    default:
      return formatInputRawDate(props.masks.input, date);
  }
}

const inputDescriptionMsg = computed(() => displayTexts.value.dateFormatMessage);

const placeholderComputed = computed(() => {
  if (props.placeholder !== null) {
    return props.placeholder;
  }
  return getKindConfig(props.mode).placeholder;
});

const isMobileScreen = computed(() => windowSize.width.value < constants.MOBILE_SCREEN_WIDTH);

const computedPlacement = computed(() => {
  if (isMobileScreen.value) return 'bottom';
  return 'bottom-start';
});

const mode = computed(() => props.mode);

const startInputIndex = computed(() => {
  if (activeInput.value === 'endInput' && dropDownMenuRef.value?.menuOpen) return '-1';
  return '0';
});

const endInputIndex = computed(() => {
  if (activeInput.value === 'startInput' && dropDownMenuRef.value?.menuOpen) return '-1';
  return '0';
});

// Function to determine maxLength based on mode. Only the free-typing modes
// (date/time/…-full) get a limit; grid-based modes (month/year/…) return null.
const getMaxLength = computed(() => {
  const conf = getKindConfig(mode.value);
  const key = conf.maskKey;
  if (!key || !(conf.isDateBased || conf.hasTime)) return null;
  return (props.masks?.[key] || TYPED_INPUT_DEFAULT_MASKS[key])?.length ?? null;
});

function focusInput(type) {
  const shouldPreservePickerFocus =
    props.pickerType === 'range' &&
    dropDownMenuRef.value?.menuOpen &&
    openSource.value === 'keyboard';

  if (shouldPreservePickerFocus) {
    activeInput.value = type;
    return;
  }

  if (type === 'startInput') {
    startInputRefs.value[props.id]?.focus();
    activeInput.value = 'startInput';
  } else if (type === 'endInput') {
    endInputRefs.value[props.id]?.focus();
    activeInput.value = 'endInput';
  }
}

watch(
  () => [props.locale, props.firstDayOfTheWeek],
  /**
   * @param {[string, number]} newValues
   */
  ([newLocaleVal, newFirstDayVal]) => {
    localizedMonthsList.value = getMonthNames(newLocaleVal);
    weekDaysList.value = getWeekdayNames(newLocaleVal, newFirstDayVal);
  },
  { immediate: true }
);

function normalizeDate(date) {
  if (!date) return null;

  const parsed = parseDate(date);
  if (!parsed) return null;

  const timestamp =
    props.mode === 'time-full' || props.mode === 'date-time-full'
      ? parsed.setMilliseconds(0)
      : parsed.setSeconds(0, 0);

  return new Date(timestamp);
}

watch(
  () => [props.minDate, props.maxDate, props.mode],
  ([newMinDate, newMaxDate]) => {
    minDateRef.value = normalizeDate(newMinDate);
    maxDateRef.value = normalizeDate(newMaxDate);
  },
  { immediate: true }
);

// Watcher to modelValue changes to format input value
watch(
  () => props.modelValue,
  (newValue) => {
    if ((newValue === null || newValue === undefined) && props.pickerType === 'single') {
      modelInput.value = null;
      return;
    }
    if (
      (newValue === null || newValue === undefined || (!newValue.start && !newValue.end)) &&
      props.pickerType === 'range'
    ) {
      modelInput.value = null;
      modelEndDateInput.value = null;
      return;
    }

    // Handle single and range picker types
    if (props.pickerType === 'single') {
      // Process the single value based on mode
      modelInput.value = formatDateByMode(newValue);
    }
    if (props.pickerType === 'range') {
      // For range date picker, process both start and end dates
      if (newValue.start && newValue.end) {
        const formattedStart = formatDateByMode(newValue.start);
        const formattedEnd = formatDateByMode(newValue.end);
        modelInput.value = formattedStart;
        modelEndDateInput.value = formattedEnd;
      } else if (newValue.start && !newValue.end) {
        // When only the start date is selected
        const formattedStart = formatDateByMode(newValue.start);
        modelInput.value = formattedStart;
        modelEndDateInput.value = null;
      } else if (!newValue.start && newValue.end) {
        // When only the end date is selected
        const formattedEnd = formatDateByMode(newValue.end);
        modelInput.value = null;
        modelEndDateInput.value = formattedEnd;
      } else {
        // In case of no valid range, clear the input
        modelInput.value = null;
        modelEndDateInput.value = null;
      }
    }
  },
  { immediate: true }
);

watch(
  () => props.mode,
  () => {
    // Watch for mode change and reset input
    modelInput.value = null; // Clear input when switching modes
    modelEndDateInput.value = null;
    model.value = null;
  }
);

watch(
  () => dropDownMenuRef.value?.menuOpen,
  (newValue) => {
    if (!newValue) {
      const previousActiveInput = activeInput.value;
      const shouldRestoreInputFocusOnClose = openSource.value === 'keyboard';

      tapStage.value = 0;
      openSource.value = null;

      if (
        shouldRestoreInputFocusOnClose &&
        (previousActiveInput === 'startInput' || previousActiveInput === 'endInput')
      ) {
        nextTick(() => {
          focusInput(previousActiveInput);
        });
        return;
      }

      activeInput.value = null;
      nextTick(() => {
        focusInput(activeInput.value);
      });
    }
  }
);

onMounted(async () => {
  localizedMonthsList.value = getMonthNames(props.locale);
  weekDaysList.value = getWeekdayNames(props.locale, props.firstDayOfTheWeek);
});
</script>

<template>
  <div ref="containerRef" class="lx-datepicker-default">
    <div :id="`${id}-lx-input-description`" class="lx-invisible">
      {{ inputDescriptionMsg }}
    </div>

    <div
      :id="`${id}-announce`"
      class="lx-invisible"
      aria-live="assertive"
      role="status"
      aria-atomic="true"
    >
      {{ liveMessage }}
    </div>

    <LxDropDownMenu
      v-if="variant === 'default'"
      ref="dropDownMenuRef"
      :placement="computedPlacement"
      :disabled="disabled"
      :datePickerType="props.mode"
      tabindex="-1"
      :texts="texts"
      @action-click="inputManualClick"
    >
      <div
        class="lx-datepicker-input-container"
        :class="[
          { 'lx-disabled': disabled },
          { 'lx-invalid': invalid },
          { range: pickerType === 'range' },
          { 'month-year': mode === 'month-year' },
        ]"
        :aria-labelledby="pickerType === 'range' ? labelledBy : null"
        @click="preventCloseOnInputArea"
        @keyup="dropDownMenuRef?.preventClose"
        @keydown="dropDownMenuRef?.preventClose"
      >
        <div
          class="lx-start-input-and-separator-wrapper lx-input-wrapper"
          :class="[{ 'lx-invalid': invalid }, { 'lx-disabled': disabled }]"
        >
          <div class="pseudo-input" />
          <input
            :ref="(el) => (startInputRefs[id] = el)"
            type="text"
            class="lx-date-time-picker lx-input-area"
            :class="[{ 'lx-invalid': invalid }, { 'input-active': activeInput === 'startInput' }]"
            :value="modelInput"
            :id="pickerType === 'range' ? `from-${id}` : id"
            :placeholder="placeholderComputed"
            :disabled="disabled"
            autocomplete="off"
            :readonly="mode === 'month' || mode === 'month-year' || mode === 'quarters'"
            :tabindex="startInputIndex"
            :maxlength="getMaxLength"
            :aria-invalid="invalid"
            :aria-errormessage="invalid ? `${id}-invalidation-message` : null"
            :aria-label="
              pickerType === 'range'
                ? displayTexts.startDateLabel
                : pickerType === 'single' && legacyMode
                ? labelledBy
                : null
            "
            :aria-labelledby="pickerType === 'single' && !legacyMode ? labelledBy : null"
            :aria-describedby="
              invalid
                ? `${id}-lx-input-description ${id}-invalidation-message`
                : `${id}-lx-input-description`
            "
            @mousedown="preventDefaultFocus"
            @touchstart="onTouchStart($event, 'startInput')"
            @touchmove="onTouchMove($event)"
            @touchend="onTouchEnd($event, 'startInput')"
            @click="toggleMenu('startInput', 'click')"
            @keydown.arrow-up.prevent
            @keydown.arrow-down.prevent
            @keydown.space="preventSpaceScrollInNonInputMode"
            @keyup.arrow-down.prevent="openMenu('startInput', 'keyboard')"
            @keyup.enter.stop="validateIfExact($event, 'startInput')"
            @keydown.esc.prevent="closeMenu"
            @change="validateIfExact($event, 'startInput')"
            @input="sanitizeDateInput($event, mode)"
          />
          <div v-if="invalid && variant === 'default'" class="lx-input-icon-wrapper">
            <LxIcon customClass="lx-invalidation-icon" value="invalid" />
          </div>
          <div
            v-if="!invalid && mode !== 'time' && variant === 'default'"
            class="lx-input-icon-wrapper"
          >
            <LxIcon customClass="lx-date-time-icon lx-modifier-icon" value="calendar" />
          </div>
          <div
            v-if="!invalid && mode === 'time' && variant === 'default'"
            class="lx-input-icon-wrapper"
          >
            <LxIcon customClass="lx-date-time-icon lx-modifier-icon" value="time" />
          </div>
        </div>

        <template v-if="pickerType === 'range'">
          <span class="lx-date-time-range-separator">–</span>
        </template>

        <template v-if="pickerType === 'range'">
          <div
            class="lx-input-wrapper"
            :class="[{ 'lx-invalid': invalid }, { 'lx-disabled': disabled }]"
          >
            <div class="pseudo-input" />
            <input
              :ref="(el) => (endInputRefs[id] = el)"
              type="text"
              class="lx-date-time-picker lx-input-area"
              :class="[{ 'lx-invalid': invalid }, { 'input-active': activeInput === 'endInput' }]"
              :value="modelEndDateInput"
              :id="`till-${id}`"
              :placeholder="placeholderComputed"
              :disabled="disabled"
              autocomplete="off"
              :readonly="mode === 'month' || mode === 'month-year' || mode === 'quarters'"
              :tabindex="endInputIndex"
              :maxlength="getMaxLength"
              :aria-invalid="invalid"
              :aria-errormessage="invalid ? `${id}-invalidation-message` : null"
              :aria-label="displayTexts.endDateLabel"
              :aria-describedby="
                invalid
                  ? `${id}-lx-input-description ${id}-invalidation-message`
                  : `${id}-lx-input-description`
              "
              @mousedown="preventDefaultFocus"
              @touchstart="onTouchStart($event, 'endInput')"
              @touchmove="onTouchMove($event)"
              @touchend="onTouchEnd($event, 'endInput')"
              @click="toggleMenu('endInput', 'click')"
              @keydown.arrow-up.prevent
              @keydown.arrow-down.prevent
              @keydown.space="preventSpaceScrollInNonInputMode"
              @keyup.arrow-down.prevent="openMenu('endInput', 'keyboard')"
              @keyup.enter.stop="validateIfExact($event, 'endInput')"
              @keydown.esc.prevent="closeMenu"
              @change="validateIfExact($event, 'endInput')"
              @input="sanitizeDateInput($event, mode)"
            />
            <div v-if="invalid" class="lx-input-icon-wrapper">
              <LxIcon customClass="lx-invalidation-icon" value="invalid" />
            </div>
            <div v-if="!invalid" class="lx-input-icon-wrapper">
              <LxIcon customClass="lx-date-time-icon lx-modifier-icon" value="calendar" />
            </div>
          </div>
        </template>
      </div>

      <template #clickSafePanel>
        <LxCalendarContainer
          :id="id"
          v-model="model"
          :mode="mode"
          :variant="variant"
          :disabled="disabled"
          :locale="locale"
          :special-dates-attributes="specialDatesAttributes"
          :first-day-of-the-week="firstDayOfTheWeek"
          :localized-months-list="localizedMonthsList"
          :week-days-list="weekDaysList"
          :minDateRef="minDateRef"
          :maxDateRef="maxDateRef"
          :closeMenu="dropDownMenuRef?.closeMenu"
          :openMenu="dropDownMenuRef?.openMenu"
          :menuState="dropDownMenuRef?.menuOpen"
          :cadenceOfMinutes="cadenceOfMinutes"
          :cadenceOfSeconds="cadenceOfSeconds"
          :clearIfNotExact="clearIfNotExact"
          :pickerType="pickerType"
          :activeInput="activeInput"
          :setActiveInput="setActiveInput"
          :openSource="openSource"
          :texts="displayTexts"
          @focusActiveInput="focusInput"
        />
      </template>
    </LxDropDownMenu>

    <LxCalendarContainer
      v-if="
        variant === 'picker' ||
        variant === 'full' ||
        variant === 'full-rows' ||
        variant === 'full-columns'
      "
      :id="id"
      v-model="model"
      :mode="mode"
      :variant="variant"
      :disabled="disabled"
      :locale="locale"
      :special-dates-attributes="specialDatesAttributes"
      :first-day-of-the-week="firstDayOfTheWeek"
      :localized-months-list="localizedMonthsList"
      :week-days-list="weekDaysList"
      :minDateRef="minDateRef"
      :maxDateRef="maxDateRef"
      :cadenceOfMinutes="cadenceOfMinutes"
      :cadenceOfSeconds="cadenceOfSeconds"
      :clearIfNotExact="clearIfNotExact"
      :pickerType="pickerType"
      :openSource="openSource"
      :texts="displayTexts"
      @focusActiveInput="focusInput"
    />
    <div
      v-if="invalid"
      class="lx-invalidation-message"
      :class="{ 'lx-invisible': legacyMode }"
      :id="`${id}-invalidation-message`"
    >
      {{ invalidationMessage }}
    </div>
  </div>
</template>
