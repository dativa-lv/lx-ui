import { isDate } from 'date-fns';
import { capitalizeFirstLetter } from '@/utils/stringUtils';

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
