import {
  differenceInCalendarDays,
  differenceInCalendarWeeks,
  differenceInCalendarMonths,
  differenceInCalendarYears,
  isSameWeek,
  isValid,
} from 'date-fns';
import useLx from '@/hooks/useLx';
import { capitalizeFirstLetter } from '@/utils/stringUtils';
import { addDays } from '@/utils/date/arithmetic';
import { parseDate } from '@/utils/date/parse';
import { formatDate } from '@/utils/date/format';

const EMPTY_VALUE = '—';

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

function resolveLocaleId(locale) {
  return locale || useLx().getGlobals()?.locale?.locale || 'lv-LV';
}

function resolveMaxRelativeDays(limitDays, defaultLimitDays = 7) {
  const normalizedLimitDays = Number(limitDays);

  return Number.isFinite(normalizedLimitDays) ? normalizedLimitDays : defaultLimitDays;
}

function tryGetLvNounLabel({ form, isLv, targetDate, referenceDate, absValue, maxAbsValue }) {
  if (!(isLv && form === 'noun' && absValue === maxAbsValue)) {
    return null;
  }

  return getNounForm(targetDate, referenceDate);
}

function resolveDayLabel({
  absDays,
  diffDays,
  isLv,
  form,
  localeId,
  relativeTimeFormatter,
  targetDate,
  referenceDate,
}) {
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

function resolveWeekMonthYearLabel({
  diffWeeks,
  diffMonths,
  diffYears,
  absWeeks,
  absMonths,
  absYears,
  isLv,
  form,
  targetDate,
  referenceDate,
  relativeTimeFormatter,
}) {
  if (absWeeks < 4) {
    const noun = tryGetLvNounLabel({
      form,
      isLv,
      targetDate,
      referenceDate,
      absValue: absWeeks,
      maxAbsValue: 1,
    });

    if (noun) return noun;

    return capitalizeFirstLetter(relativeTimeFormatter.format(diffWeeks, 'week'));
  }

  if (absMonths < 12) {
    const noun = tryGetLvNounLabel({
      form,
      isLv,
      targetDate,
      referenceDate,
      absValue: absMonths,
      maxAbsValue: 1,
    });

    if (noun) return noun;

    return capitalizeFirstLetter(relativeTimeFormatter.format(diffMonths, 'month'));
  }

  if (absYears > 0) {
    const noun = tryGetLvNounLabel({
      form,
      isLv,
      targetDate,
      referenceDate,
      absValue: absYears,
      maxAbsValue: 1,
    });

    if (noun) return noun;

    return capitalizeFirstLetter(relativeTimeFormatter.format(diffYears, 'year'));
  }

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

  const maxRelativeDays = resolveMaxRelativeDays(limitDays);

  const diffDays = differenceInCalendarDays(targetDate, referenceDate);
  const absDays = Math.abs(diffDays);

  if (absDays >= maxRelativeDays) {
    return formatDate(targetDate);
  }

  const localeId = resolveLocaleId(locale);
  const isLv = localeId.startsWith('lv');
  const relativeTimeFormatter = new Intl.RelativeTimeFormat(localeId, { numeric: 'auto' });

  if (absDays < 7) {
    return resolveDayLabel({
      absDays,
      diffDays,
      isLv,
      form,
      localeId,
      relativeTimeFormatter,
      targetDate,
      referenceDate,
    });
  }

  const diffWeeks = differenceInCalendarWeeks(targetDate, referenceDate, { weekStartsOn: 1 });
  const absWeeks = Math.abs(diffWeeks);

  const diffMonths = differenceInCalendarMonths(targetDate, referenceDate);
  const absMonths = Math.abs(diffMonths);

  const diffYears = differenceInCalendarYears(targetDate, referenceDate);
  const absYears = Math.abs(diffYears);

  const periodLabel = resolveWeekMonthYearLabel({
    diffWeeks,
    diffMonths,
    diffYears,
    absWeeks,
    absMonths,
    absYears,
    isLv,
    form,
    targetDate,
    referenceDate,
    relativeTimeFormatter,
  });

  if (periodLabel) return periodLabel;

  return formatDate(targetDate);
}
