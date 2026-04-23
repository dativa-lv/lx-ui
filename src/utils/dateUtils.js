import {
  parse,
  parseJSON,
  format,
  formatRFC3339,
  isDate,
  isValid,
  parseISO,
  differenceInCalendarDays,
  differenceInCalendarWeeks,
  differenceInCalendarMonths,
  differenceInCalendarYears,
  isSameWeek,
} from 'date-fns';
import useLx from '@/hooks/useLx';
import { capitalizeFirstLetter } from '@/utils/stringUtils';

const EMPTY_VALUE = '—';

export function parseDate(date) {
  if (!date) return null;
  if (date.length === 10) {
    return parse(date, 'yyyy-MM-dd', new Date());
  }

  return isDate(date) ? date : parseJSON(date);
}

export function formatJSON(date) {
  if (!date) return null;
  let d = date;
  if (typeof d === 'string') {
    if (d.length === 10) {
      d = parse(d, 'dd.MM.yyyy', new Date());
    } else if (d.length === 11) {
      d = parse(d, 'dd.MM.yyyy.', new Date());
    } else if (d.length === 16) {
      d = parse(d, 'dd.MM.yyyy HH:mm', new Date());
    } else if (d.length === 17) {
      d = parse(d, 'dd.MM.yyyy. HH:mm', new Date());
    } else if (d.length === 19) {
      d = parse(d, 'dd.MM.yyyy HH:mm:ss', new Date());
    } else if (d.length === 20) {
      d = parse(d, 'dd.MM.yyyy. HH:mm:ss', new Date());
    }
    return d;
  }
  return formatRFC3339(d);
}

export function isDateValid(date) {
  return parseDate(date) instanceof Date && !Number.isNaN(Number(parseDate(date)));
}

export function isTimeValid(value) {
  // Basic format check: HH:mm (two digits each)
  const timePattern = /^\d{2}:\d{2}$/;
  if (!timePattern.test(value)) return false;

  // Split into parts and convert to numbers
  const [hours, minutes] = value.split(':').map(Number);

  // Validate ranges
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export function isTimeFullValid(value) {
  // Basic format check: HH:mm:ss (two digits each)
  const timePattern = /^\d{2}:\d{2}:\d{2}$/;
  if (!timePattern.test(value)) return false;

  // Split into parts and convert to numbers
  const [hours, minutes, seconds] = value.split(':').map(Number);

  // Validate ranges
  return (
    hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59
  );
}

export function isSameDate(date1, date2) {
  // Check if both dates are dates
  if (!isDateValid(date1) || !isDateValid(date2)) return false;
  // Compare ISO date strings
  return date1.toISOString() === date2.toISOString();
}

export function formatDateJSON(date) {
  if (!date) return null;
  let d = date;
  if (typeof d === 'string') {
    d = formatJSON(d);
  }
  if (isDateValid(d)) return format(d, 'yyyy-MM-dd');
  return null;
}

export function formatDate(date, empty = '') {
  const { dateFormat } = useLx().getGlobals();
  const dateFormatToUse = dateFormat || 'dd.MM.yyyy.';

  if (!date) return empty;

  let d;
  if (typeof date === 'string') {
    d = parseISO(date);
  } else {
    d = date;
  }

  return isValid(d) ? format(d, dateFormatToUse) : empty;
}

export function formatDateTime(date, empty = '') {
  const { dateTimeFormat } = useLx().getGlobals();
  const dateTimeFormatToUse = dateTimeFormat || 'dd.MM.yyyy. HH:mm';

  if (!date) return empty;
  let d = date;

  if (typeof d === 'string') {
    d = new Date(date);
  }

  return format(d, dateTimeFormatToUse);
}

export function formatFull(date, empty = '') {
  const { dateTimeFullFormat } = useLx().getGlobals();
  const dateTimeFullFormatToUse = dateTimeFullFormat || 'dd.MM.yyyy. HH:mm:ss';

  if (!date) return empty;
  let d = date;

  if (typeof d === 'string') {
    d = new Date(date);
  }

  return format(d, dateTimeFullFormatToUse);
}

export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getMonthNames(localeId = 'lv-LV') {
  const dates = [];
  for (let i = 0; i < 12; i += 1) {
    dates.push(new Date(2000, i));
  }

  const fullMonthDtf = new Intl.DateTimeFormat(localeId, {
    month: 'long',
  });
  const shortMonthDtf = new Intl.DateTimeFormat(localeId, {
    month: 'short',
  });

  return dates.map((d, orderIndex) => {
    const fullName = fullMonthDtf.format(d);
    let shortName = shortMonthDtf.format(d);

    // Fallback for locales like "lt-LT" where shortName might be numeric
    if (/^\d+$/.test(shortName)) {
      // Take the first 3 letters of the full name, check length for dots
      shortName = fullName.length === 5 ? fullName : `${fullName.substring(0, 4)}.`;
    }

    return {
      fullName,
      shortName,
      orderIndex,
    };
  });
}

export function getWeekdayNames(localeId = 'lv-LV', firstDayOfTheWeek = 2) {
  const dates = [];
  for (let i = 1; i <= 7; i += 1) {
    dates.push(new Date(2000, 0, i + firstDayOfTheWeek));
  }
  const fullWeekDtf = new Intl.DateTimeFormat(localeId, {
    weekday: 'long',
  });
  const shortWeekDtf = new Intl.DateTimeFormat(localeId, {
    weekday: 'short',
  });
  const narrowWeekDtf = new Intl.DateTimeFormat(localeId, {
    weekday: 'narrow',
  });

  return dates.map((d, orderIndex) => {
    const fullName = fullWeekDtf.format(d);
    const shortName = shortWeekDtf.format(d);
    const narrowName = narrowWeekDtf.format(d);

    return {
      fullName,
      shortName,
      narrowName,
      orderIndex,
    };
  });
}

// Examples: "Thursday, September 12, 2012"
export function formatLocalizedDate(localeId, date) {
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  let formattedDate = date.toLocaleDateString(localeId, options);
  formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  return formattedDate;
}

export function getMonthYearString(localeId, month, year) {
  if (month === null || month === undefined) return null;
  if (year === null || year === undefined) return null;

  const formatter = new Intl.DateTimeFormat(localeId, {
    year: 'numeric',
    month: 'long',
  });
  return formatter.format(new Date(year, month, 1));
}

export function extractTimeFromDate(localeId, dateString) {
  if (!dateString) return null;

  const dateObj = new Date(dateString);
  if (!isDate(dateObj)) return null;

  const time = dateObj.toLocaleTimeString(localeId, {
    hour: '2-digit',
    minute: '2-digit',
  });
  return time;
}

export function extractMonthFromDate(localeId, dateString, capitalize = true) {
  if (!dateString) return null;

  const dateObj = new Date(dateString);
  if (!isDate(dateObj)) return null;

  const month = dateObj.toLocaleDateString(localeId, {
    month: 'long',
  });
  return capitalize ? capitalizeFirstLetter(month) : month;
}

/**
 * Returns new date shifted by number of days.
 * @param {Date} date - Base date value.
 * @param {number} days - Day offset (can be negative).
 * @returns {Date} Shifted date instance.
 */
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Returns Latvian weekday-based relative label for a target date.
 * @param {Date} targetDate - Date that should be humanized.
 * @param {Date} referenceDate - Date used as comparison baseline.
 * @param {string} locale - Output language.
 * @param {string} form - Output style ('adverb' or 'noun') for lv locale.
 * @returns {string|null} Weekday-based relative label when supported, otherwise null.
 */
function getWeekdayLabel(targetDate, referenceDate, locale, form) {
  const weekday = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
  }).format(targetDate);

  const sameWeek = isSameWeek(targetDate, referenceDate, { weekStartsOn: 1 });
  const prevWeek = isSameWeek(targetDate, addDays(referenceDate, -7), { weekStartsOn: 1 });
  const nextWeek = isSameWeek(targetDate, addDays(referenceDate, 7), { weekStartsOn: 1 });

  if (sameWeek) {
    return form === 'adverb' ? weekday.slice(0, -1) : weekday;
  }

  if (prevWeek) {
    if (form === 'adverb') {
      return `Pagājušo ${weekday.slice(0, -1).toLocaleLowerCase(locale)}`;
    }

    return `Pagājušā ${weekday.toLocaleLowerCase(locale)}`;
  }

  if (nextWeek) {
    if (form === 'adverb') {
      return `Nākamo ${weekday.slice(0, -1).toLocaleLowerCase(locale)}`;
    }

    return `Nākamā ${weekday.toLocaleLowerCase(locale)}`;
  }

  return null;
}

/**
 * Returns Latvian noun-style relative date label for target date.
 * @param {Date} targetDate - Date that should be humanized.
 * @param {Date} referenceDate - Date used as comparison baseline.
 * @returns {string|null} Latvian noun label when supported, otherwise null.
 */
function getNounForm(targetDate, referenceDate) {
  const diffDays = differenceInCalendarDays(targetDate, referenceDate);

  if (diffDays === 0) return 'Šodiena';
  if (diffDays === -1) return 'Vakardiena';
  if (diffDays === -2) return 'Aizvakardiena';
  if (diffDays === 1) return 'Rītdiena';
  if (diffDays === 2) return 'Parītdiena';

  const diffWeeks = differenceInCalendarWeeks(targetDate, referenceDate, { weekStartsOn: 1 });

  if (diffWeeks === -1) return 'Pagājušā nedēļa';
  if (diffWeeks === 1) return 'Nākamā nedēļa';

  const diffMonths = differenceInCalendarMonths(targetDate, referenceDate);

  if (diffMonths === -1) return 'Pagājušais mēnesis';
  if (diffMonths === 1) return 'Nākamais mēnesis';

  const diffYears = differenceInCalendarYears(targetDate, referenceDate);

  if (diffYears === -1) return 'Pagājušais gads';
  if (diffYears === 1) return 'Nākamais gads';

  return null;
}

/**
 * Formats date into natural human language. See more info in docs/HumanizeDateUtil.md.
 * @param {Date|string} date - Date to humanize.
 * @param {Object} [options={}]
 * @param {Date|string} [options.dateFrom] - Reference date used for comparison; defaults to current date.
 * @param {string} [options.form='adverb'] - Output style ('adverb' or 'noun') for lv locale.
 * @param {number} [options.limitDays] - Maximum day distance to keep relative wording before falling back to formatted date.
 * @param {string} [options.locale] - Output language.
 * @returns {string} Humanized relative date label, formatted absolute date, or EMPTY_VALUE for invalid input.
 */
export function humanizeDate(date, { dateFrom, form = 'adverb', limitDays, locale } = {}) {
  const targetDate = date instanceof Date ? date : parseDate(date);

  if (!targetDate || !isValid(targetDate)) {
    return EMPTY_VALUE;
  }

  // Use provided dateFrom or default to current date
  const referenceDate = dateFrom instanceof Date ? dateFrom : parseDate(dateFrom) || new Date();

  // Align time to avoid issues with day boundaries
  targetDate.setHours(
    referenceDate.getHours(),
    referenceDate.getMinutes(),
    referenceDate.getSeconds(),
    referenceDate.getMilliseconds()
  );

  const defaultLimitDays = 7;
  const normalizedLimitDays = Number(limitDays);
  const maxRelativeDays = Number.isFinite(normalizedLimitDays)
    ? normalizedLimitDays
    : defaultLimitDays;

  const diffDays = differenceInCalendarDays(targetDate, referenceDate);
  const absDays = Math.abs(diffDays);

  if (absDays >= maxRelativeDays) {
    return formatDate(targetDate);
  }

  const localeId = locale || useLx().getGlobals()?.locale?.locale || 'lv-LV';
  const isLv = localeId.startsWith('lv');
  const relativeTimeFormatter = new Intl.RelativeTimeFormat(localeId, { numeric: 'auto' });

  if (absDays < 7) {
    if (isLv) {
      if (form === 'noun' && absDays <= 2) {
        const noun = getNounForm(targetDate, referenceDate);
        if (noun) return noun;
      }

      if (absDays > 2) {
        const weekdayLabel = getWeekdayLabel(targetDate, referenceDate, localeId, form);
        if (weekdayLabel) return weekdayLabel;
      }
    }

    return capitalizeFirstLetter(relativeTimeFormatter.format(diffDays, 'day'));
  }

  const diffWeeks = differenceInCalendarWeeks(targetDate, referenceDate, { weekStartsOn: 1 });
  const absWeeks = Math.abs(diffWeeks);

  const diffMonths = differenceInCalendarMonths(targetDate, referenceDate);
  const absMonths = Math.abs(diffMonths);

  const diffYears = differenceInCalendarYears(targetDate, referenceDate);
  const absYears = Math.abs(diffYears);

  if (absWeeks < 4) {
    if (isLv && form === 'noun' && absWeeks === 1) {
      const noun = getNounForm(targetDate, referenceDate);
      if (noun) return noun;
    }

    return capitalizeFirstLetter(relativeTimeFormatter.format(diffWeeks, 'week'));
  }

  if (absMonths < 12) {
    if (isLv && form === 'noun' && absMonths === 1) {
      const noun = getNounForm(targetDate, referenceDate);
      if (noun) return noun;
    }

    return capitalizeFirstLetter(relativeTimeFormatter.format(diffMonths, 'month'));
  }

  if (absYears > 0) {
    if (isLv && form === 'noun' && absYears === 1) {
      const noun = getNounForm(targetDate, referenceDate);
      if (noun) return noun;
    }

    return capitalizeFirstLetter(relativeTimeFormatter.format(diffYears, 'year'));
  }

  return formatDate(targetDate);
}
