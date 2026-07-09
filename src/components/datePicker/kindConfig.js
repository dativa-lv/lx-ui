/**
 * Central configuration for every LxDateTimePicker `kind`.
 *
 * Historically the per-kind behaviour (how to parse the model value, how to
 * format it back, how to render it read-only, which calendar panel to show,
 * which css class to apply, …) was duplicated across a dozen switch/if-else
 * blocks in DateTimePicker.vue, DatePicker.vue and CalendarContainer.vue.
 *
 * This module gathers all of that into a single map keyed by `kind`, plus a
 * handful of capability helpers (isDateBasedMode, getCalendarLayout, …) that
 * CalendarContainer uses instead of repeating `mode === 'x' || mode === 'y'`.
 *
 * Adding a new kind should mostly be a matter of adding one entry here (and,
 * for a non-calendar kind such as `day-month`, a small dedicated component).
 */
import {
  parseDate,
  formatJSON,
  formatDate,
  formatDateTime,
  formatDateJSON,
  formatFull,
  isDateValid,
  isTimeValid,
  getMonthYearString,
  getMonthNames,
} from '@/utils/dateUtils';
import {
  parseExact,
  extractMonthFromDate,
  extractYearFromDate,
  extractYearMonthFromDate,
  extractQuarterFromDate,
  extractMonthDayFromDate,
  dateFromYearAndQuarter,
  getMonthNameByOrder,
} from '@/components/datePicker/helpers';

// A fixed leap year used as the internal reference when a kind has no year of
// its own (day-month). Using a leap year keeps 29 February selectable.
const REFERENCE_LEAP_YEAR = 2000;

const createFirstDayDate = () => {
  const newDate = new Date();
  newDate.setDate(1); // Set to the first day of the month
  return newDate;
};

const isStringWithLength = (value, length) => typeof value === 'string' && value?.length === length;

const extractTime = (datetimeStr) => {
  const timeRegex = /(\d{2}:\d{2}(:\d{2})?(\s?[APMapm]{2})?)/;
  const match = datetimeStr.match(timeRegex);
  if (match) return match[0];
  return null;
};

const identity = (value) => value;

/* ------------------------------------------------------------------ parse */
// (modelValue: string | Date) -> Date | null

const parseTime = (value) => {
  if (!isStringWithLength(value, 5)) return parseDate(value);
  const newDate = createFirstDayDate();
  newDate.setHours(Number(value?.slice(0, 2)));
  newDate.setMinutes(Number(value?.slice(3, 5)));
  return newDate;
};

const parseFullTime = (value) => {
  if (!isStringWithLength(value, 8)) return parseDate(value);
  const newDate = createFirstDayDate();
  newDate.setHours(Number(value?.slice(0, 2)));
  newDate.setMinutes(Number(value?.slice(3, 5)));
  newDate.setSeconds(Number(value?.slice(6, 8)));
  return newDate;
};

const parseMonth = (value) => {
  if (!isStringWithLength(value, 2)) return parseDate(value);
  const newDate = createFirstDayDate();
  newDate.setMonth(Number(value) - 1);
  return newDate;
};

const parseYear = (value) => {
  if (!isStringWithLength(value, 4)) return parseDate(value);
  const newDate = createFirstDayDate();
  newDate.setFullYear(Number(value));
  return newDate;
};

const parseMonthYear = (value) => {
  if (!isStringWithLength(value, 7)) return parseDate(value);
  const newDate = createFirstDayDate();
  newDate.setFullYear(Number(value?.slice(0, 4)));
  newDate.setMonth(Number(value?.slice(5, 7)) - 1);
  return newDate;
};

const parseQuarter = (value) => {
  if (!isStringWithLength(value, 7)) return parseDate(value);
  const [year, quarter] = value.split('-');
  const normalizedQuarter = quarter.split('Q');
  return dateFromYearAndQuarter(year, normalizedQuarter[1]);
};

// 'MM-dd' -> Date, using a fixed leap year so 02-29 stays valid.
const parseDayMonth = (value) => {
  if (!isStringWithLength(value, 5)) return parseDate(value);
  const month = Number(value?.slice(0, 2)) - 1;
  const day = Number(value?.slice(3, 5));
  return new Date(REFERENCE_LEAP_YEAR, month, day);
};

const parseDefault = (value) => parseExact(value);

/* ------------------------------------------------------------------- emit */
// (value: Date, ctx: { masks }) -> string

const emitTime = (date) => extractTime(formatDateTime(date));
const emitFullTime = (date) => extractTime(formatFull(date));
const emitDate = (date) => formatDateJSON(date);
const emitDateTime = (date) => formatJSON(date);
const emitMonth = (date) => extractMonthFromDate(date);
const emitYear = (date) => extractYearFromDate(date);
const emitMonthYear = (date, ctx) => extractYearMonthFromDate(date, ctx?.masks?.monthYearFormat);
const emitQuarter = (date) => extractQuarterFromDate(date);
const emitDayMonth = (date) => extractMonthDayFromDate(date);

/* --------------------------------------------------------------- getName */
// (value: string | Date, ctx: { locale }) -> string | null  (read-only display)

const getNameDate = (value) => {
  if (isDateValid(value)) return formatDate(value);
  if (typeof value !== 'string') return formatDate(value);
  return null;
};

const getNameTime = (value) => {
  if (isTimeValid(value)) return value;
  if (typeof value !== 'string') return extractTime(formatDateTime(value));
  return null;
};

const getNameDateTime = (value) => {
  if (isDateValid(value)) return formatDateTime(value);
  return null;
};

const getNameDateTimeFull = (value) => {
  if (isDateValid(value)) return formatFull(value);
  return null;
};

const getNameMonth = (value, ctx) => {
  const monthsList = getMonthNames(ctx?.locale);
  if (typeof value === 'string') {
    return getMonthNameByOrder(monthsList, new Date(value)?.getMonth(), true);
  }
  if (typeof value !== 'string') {
    return getMonthNameByOrder(monthsList, value?.getMonth(), true);
  }
  return null;
};

const getNameMonthYear = (value, ctx) => {
  if (typeof value === 'string') {
    return getMonthYearString(
      ctx?.locale,
      new Date(value)?.getMonth(),
      new Date(value)?.getFullYear()
    );
  }
  if (typeof value !== 'string') {
    return getMonthYearString(ctx?.locale, value?.getMonth(), value?.getFullYear());
  }
  return null;
};

const getNameDayMonth = (value, ctx) => {
  let month;
  let day;
  if (typeof value === 'string' && value.length === 5) {
    month = Number(value.slice(0, 2)) - 1;
    day = Number(value.slice(3, 5));
  } else if (value instanceof Date) {
    month = value.getMonth();
    day = value.getDate();
  } else {
    return null;
  }
  const monthName = getMonthNameByOrder(getMonthNames(ctx?.locale), month, false);
  return monthName ? `${day}. ${monthName}` : null;
};

/* ---------------------------------------------------------------- config */

export const KIND_CONFIG = {
  date: {
    mode: 'date',
    panel: 'calendar',
    cssClass: 'lx-date',
    placeholder: 'dd.mm.gggg.',
    maskKey: 'input',
    calendarLayout: 'day',
    hasTime: false,
    hasSeconds: false,
    isDateBased: true,
    parse: parseDefault,
    emit: emitDate,
    getName: getNameDate,
  },
  time: {
    mode: 'time',
    panel: 'calendar',
    cssClass: 'lx-time',
    placeholder: 'st:mi',
    maskKey: 'inputTime24hr',
    calendarLayout: 'day',
    hasTime: true,
    hasSeconds: false,
    isDateBased: false,
    parse: parseTime,
    emit: emitTime,
    getName: getNameTime,
  },
  'time-full': {
    mode: 'time-full',
    panel: 'calendar',
    cssClass: 'lx-time',
    placeholder: 'st:mi:ss',
    maskKey: 'inputTimeFull24hr',
    calendarLayout: 'day',
    hasTime: true,
    hasSeconds: true,
    isDateBased: false,
    parse: parseFullTime,
    emit: emitFullTime,
    getName: identity,
  },
  'date-time': {
    mode: 'date-time',
    panel: 'calendar',
    cssClass: 'lx-date-time',
    placeholder: 'dd.mm.gggg. st:mi',
    maskKey: 'inputDateTime24hr',
    calendarLayout: 'day',
    hasTime: true,
    hasSeconds: false,
    isDateBased: true,
    parse: parseDefault,
    emit: emitDateTime,
    getName: getNameDateTime,
  },
  'date-time-full': {
    mode: 'date-time-full',
    panel: 'calendar',
    cssClass: 'lx-date-time-full',
    placeholder: 'dd.mm.gggg. st:mi:ss',
    maskKey: 'inputDateTimeFull24hr',
    calendarLayout: 'day',
    hasTime: true,
    hasSeconds: true,
    isDateBased: true,
    parse: parseDefault,
    emit: emitDateTime,
    getName: getNameDateTimeFull,
  },
  month: {
    mode: 'month',
    panel: 'calendar',
    cssClass: 'lx-date',
    placeholder: null,
    maskKey: null,
    calendarLayout: 'month',
    hasTime: false,
    hasSeconds: false,
    isDateBased: false,
    parse: parseMonth,
    emit: emitMonth,
    getName: getNameMonth,
  },
  year: {
    mode: 'year',
    panel: 'calendar',
    cssClass: 'lx-date',
    placeholder: null,
    maskKey: 'inputYear',
    calendarLayout: 'year',
    hasTime: false,
    hasSeconds: false,
    isDateBased: false,
    parse: parseYear,
    emit: emitYear,
    getName: identity,
  },
  'month-year': {
    mode: 'month-year',
    panel: 'calendar',
    cssClass: 'lx-date-time',
    placeholder: null,
    maskKey: 'inputMonthYear',
    calendarLayout: 'month',
    hasTime: false,
    hasSeconds: false,
    isDateBased: false,
    parse: parseMonthYear,
    emit: emitMonthYear,
    getName: getNameMonthYear,
  },
  quarters: {
    mode: 'quarters',
    panel: 'calendar',
    cssClass: 'lx-date',
    placeholder: null,
    maskKey: 'inputQuarters',
    calendarLayout: 'quarters',
    hasTime: false,
    hasSeconds: false,
    isDateBased: false,
    parse: parseQuarter,
    emit: emitQuarter,
    getName: identity,
  },
  'day-month': {
    mode: 'day-month',
    panel: 'composite',
    cssClass: 'lx-day-month',
    placeholder: null,
    maskKey: null,
    calendarLayout: 'none',
    hasTime: false,
    hasSeconds: false,
    isDateBased: false,
    parse: parseDayMonth,
    emit: emitDayMonth,
    getName: getNameDayMonth,
  },
};

// camelCase aliases kept for backwards compatibility.
KIND_CONFIG.dateTime = KIND_CONFIG['date-time'];
KIND_CONFIG.dateTimeFull = KIND_CONFIG['date-time-full'];

export const getKindConfig = (kind) => KIND_CONFIG[kind] || KIND_CONFIG.date;

/* ------------------------------------------------- capability helpers ---- */
// These take a `mode` (the value passed down to CalendarContainer/DatePicker,
// which matches a KIND_CONFIG key for every real mode) and default safely.

export const isDateBasedMode = (mode) => !!KIND_CONFIG[mode]?.isDateBased;

export const getCalendarLayout = (mode) => KIND_CONFIG[mode]?.calendarLayout ?? 'day';

export const hasTimeColumns = (mode) => !!KIND_CONFIG[mode]?.hasTime;

export const modeHasSeconds = (mode) => !!KIND_CONFIG[mode]?.hasSeconds;
