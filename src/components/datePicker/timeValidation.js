import { isDefined, isNil } from '@/utils/generalUtils';
import { isSameDay } from '@/components/datePicker/helpers';

// Below minDate
function isBeforeMinTime(hour, minute, second, minDateParsed, minTimeParts = null) {
  if (!minDateParsed) return false;

  const minHour = minTimeParts ? minTimeParts.hour : minDateParsed.getHours();
  const minMinute = minTimeParts ? minTimeParts.minute : minDateParsed.getMinutes();
  const minSecond = minTimeParts ? minTimeParts.second : minDateParsed.getSeconds();

  return (
    hour < minHour ||
    (hour === minHour && minute < minMinute) ||
    (hour === minHour && minute === minMinute && !isNil(second) && second < minSecond)
  );
}

// Above maxDate
function isAfterMaxTime(hour, minute, second, maxDateParsed, maxTimeParts = null) {
  if (!maxDateParsed) return false;

  const maxHour = maxTimeParts ? maxTimeParts.hour : maxDateParsed.getHours();
  const maxMinute = maxTimeParts ? maxTimeParts.minute : maxDateParsed.getMinutes();
  const maxSecond = maxTimeParts ? maxTimeParts.second : maxDateParsed.getSeconds();

  return (
    hour > maxHour ||
    (hour === maxHour && minute > maxMinute) ||
    (hour === maxHour && minute === maxMinute && !isNil(second) && second > maxSecond)
  );
}

function canSelectTimeOnlyHour(rawValue, bounds, selectedTime) {
  const { min: minDateParsed, max: maxDateParsed } = bounds;
  const { minutes: selectedMinutes, seconds: selectedSeconds } = selectedTime;
  const hour = Number(rawValue);

  const minTimeParts = {
    hour: minDateParsed?.getHours(),
    minute: minDateParsed?.getMinutes(),
    second: minDateParsed?.getSeconds(),
  };

  const maxTimeParts = {
    hour: maxDateParsed?.getHours(),
    minute: maxDateParsed?.getMinutes(),
    second: maxDateParsed?.getSeconds(),
  };

  if (isNil(selectedMinutes)) {
    return !(
      (minDateParsed && hour < minTimeParts.hour) ||
      (maxDateParsed && hour > maxTimeParts.hour)
    );
  }

  return !(
    isBeforeMinTime(hour, selectedMinutes, selectedSeconds, minDateParsed, minTimeParts) ||
    isAfterMaxTime(hour, selectedMinutes, selectedSeconds, maxDateParsed, maxTimeParts)
  );
}

function canSelectTimeOnlyMinute(rawValue, bounds, selectedTime) {
  const { min: minDateParsed, max: maxDateParsed } = bounds;
  const { hours: selectedHours, seconds: selectedSeconds } = selectedTime;

  if (isNil(selectedHours)) return true;

  const minute = Number(rawValue);

  if (isNil(selectedSeconds)) {
    return !(
      isBeforeMinTime(selectedHours, minute, null, minDateParsed) ||
      isAfterMaxTime(selectedHours, minute, null, maxDateParsed)
    );
  }

  return !(
    isBeforeMinTime(selectedHours, minute, selectedSeconds, minDateParsed) ||
    isAfterMaxTime(selectedHours, minute, selectedSeconds, maxDateParsed)
  );
}

function canSelectTimeOnlySecond(rawValue, bounds, selectedTime) {
  const { min: minDateParsed, max: maxDateParsed } = bounds;
  const { hours: selectedHours, minutes: selectedMinutes } = selectedTime;

  // If no hours or minutes selected yet, validate seconds normally
  if (isNil(selectedHours) || isNil(selectedMinutes)) {
    return true;
  }

  const second = Number(rawValue);

  const minHour = minDateParsed?.getHours();
  const minMinute = minDateParsed?.getMinutes();
  const minSecond = minDateParsed?.getSeconds();

  const maxHour = maxDateParsed?.getHours();
  const maxMinute = maxDateParsed?.getMinutes();
  const maxSecond = maxDateParsed?.getSeconds();

  const isAfterMinHours = !minDateParsed || selectedHours > minHour;
  const isBeforeMaxHours = !maxDateParsed || selectedHours < maxHour;

  if (isAfterMinHours && isBeforeMaxHours) return true;

  if (
    minDateParsed &&
    selectedHours === minHour &&
    selectedMinutes === minMinute &&
    second < minSecond
  ) {
    return false;
  }

  if (
    maxDateParsed &&
    selectedHours === maxHour &&
    selectedMinutes === maxMinute &&
    second > maxSecond
  ) {
    return false;
  }

  return !(selectedHours < minHour || selectedHours > maxHour);
}

// If timeOnly is true, we ignore date validation and only focus on time validation
function canSelectTimeOnly(rawValue, bounds, timeUnit, selectedTime) {
  if (timeUnit === 'hour') {
    return canSelectTimeOnlyHour(rawValue, bounds, selectedTime);
  }

  if (timeUnit === 'minute') {
    return canSelectTimeOnlyMinute(rawValue, bounds, selectedTime);
  }

  if (timeUnit === 'second') {
    return canSelectTimeOnlySecond(rawValue, bounds, selectedTime);
  }

  // Allow any time if timeUnit isn't specified
  return true;
}

function isMinuteWithinSameDayHourBounds(selectedMinutes, minDateParsed, maxDateParsed) {
  return (
    selectedMinutes === minDateParsed.getMinutes() ||
    selectedMinutes === maxDateParsed.getMinutes() ||
    (selectedMinutes > minDateParsed.getMinutes() && selectedMinutes < maxDateParsed.getMinutes())
  );
}

function canSelectHourOnSameBoundaryDay(rawValue, selectedMinutes, minDateParsed, maxDateParsed) {
  if (!isMinuteWithinSameDayHourBounds(selectedMinutes, minDateParsed, maxDateParsed)) {
    return false;
  }

  return rawValue >= minDateParsed.getHours() && rawValue <= maxDateParsed.getHours();
}

function canSelectHourWithSelectedMinute(
  rawValue,
  selectedMinutes,
  minDateParsed,
  maxDateParsed,
  isMinDay,
  isMaxDay
) {
  if (isMinDay && isMaxDay) {
    return canSelectHourOnSameBoundaryDay(rawValue, selectedMinutes, minDateParsed, maxDateParsed);
  }

  if (isMinDay && selectedMinutes < minDateParsed.getMinutes()) {
    return rawValue > minDateParsed.getHours();
  }

  if (isMaxDay && selectedMinutes > maxDateParsed.getMinutes()) {
    return rawValue < maxDateParsed.getHours();
  }

  return null;
}

function canSelectDateTimeHour(rawValue, bounds, selectedDate, selectedTime) {
  const { min: minDateParsed, max: maxDateParsed } = bounds;
  const { day: selectedDay, month: selectedMonth, year: selectedYear } = selectedDate;
  const { minutes: selectedMinutes } = selectedTime;

  const hasMinute = selectedMinutes !== null && selectedMinutes !== undefined;
  const selectedDateObj = new Date(selectedYear, selectedMonth, selectedDay);
  const isMinDay = selectedDateObj?.toDateString() === minDateParsed?.toDateString();
  const isMaxDay = selectedDateObj?.toDateString() === maxDateParsed?.toDateString();

  // Validate when minute is selected
  if (hasMinute && minDateParsed && maxDateParsed) {
    const minuteValidation = canSelectHourWithSelectedMinute(
      rawValue,
      selectedMinutes,
      minDateParsed,
      maxDateParsed,
      isMinDay,
      isMaxDay
    );

    if (minuteValidation !== null) {
      return minuteValidation;
    }
  }

  // If no minute selected, fall back to basic min/max hour bounds
  return !(
    (isMinDay && rawValue < minDateParsed?.getHours()) ||
    (isMaxDay && rawValue > maxDateParsed?.getHours())
  );
}

function canSelectDateTimeMinute(rawValue, bounds, selectedDate, selectedTime) {
  const { min: minDateParsed, max: maxDateParsed } = bounds;
  const { day: selectedDay, month: selectedMonth, year: selectedYear } = selectedDate;
  const { hours: selectedHours, seconds: selectedSeconds } = selectedTime;

  if (selectedYear == null || selectedMonth == null || selectedDay == null) {
    return true;
  }

  if (isNil(selectedHours)) return true;

  const minute = Number(rawValue);

  const current = new Date(
    selectedYear,
    selectedMonth,
    selectedDay,
    selectedHours,
    minute,
    isNil(selectedSeconds) ? 0 : selectedSeconds
  );

  return !(
    (minDateParsed && current < minDateParsed) ||
    (maxDateParsed && current > maxDateParsed)
  );
}

function canSelectSecondSameDay(rawValue, selectedTime, bounds) {
  const { hours: selectedHours, minutes: selectedMinutes } = selectedTime;
  const { min: minDateParsed, max: maxDateParsed } = bounds;

  if (selectedHours > minDateParsed.getHours() && selectedHours < maxDateParsed.getHours()) {
    return true;
  }

  if (
    selectedHours === minDateParsed.getHours() &&
    selectedMinutes > minDateParsed.getMinutes() &&
    selectedHours < maxDateParsed.getHours()
  ) {
    return true;
  }

  if (
    selectedHours === maxDateParsed.getHours() &&
    selectedMinutes < maxDateParsed.getMinutes() &&
    selectedHours > minDateParsed.getHours()
  ) {
    return true;
  }

  // On min hour and min minute
  if (
    selectedHours === minDateParsed.getHours() &&
    selectedMinutes === minDateParsed.getMinutes()
  ) {
    return rawValue >= minDateParsed.getSeconds();
  }

  // On max hour and max minute
  if (
    selectedHours === maxDateParsed.getHours() &&
    selectedMinutes === maxDateParsed.getMinutes()
  ) {
    return rawValue <= maxDateParsed.getSeconds();
  }

  // Between min/max hour/minute
  return (
    selectedHours >= minDateParsed.getHours() &&
    selectedHours <= maxDateParsed.getHours() &&
    selectedMinutes >= minDateParsed.getMinutes() &&
    selectedMinutes <= maxDateParsed.getMinutes() &&
    rawValue >= minDateParsed.getSeconds() &&
    rawValue <= maxDateParsed.getSeconds()
  );
}

function canSelectSecondMinDayOnly(rawValue, selectedTime, minDateParsed) {
  const { hours: selectedHours, minutes: selectedMinutes } = selectedTime;

  if (
    selectedHours === minDateParsed.getHours() &&
    selectedMinutes === minDateParsed.getMinutes()
  ) {
    return rawValue >= minDateParsed.getSeconds();
  }
  return (
    selectedHours > minDateParsed.getHours() ||
    (selectedHours === minDateParsed.getHours() && selectedMinutes > minDateParsed.getMinutes())
  );
}

function canSelectSecondMaxDayOnly(rawValue, selectedTime, maxDateParsed) {
  const { hours: selectedHours, minutes: selectedMinutes } = selectedTime;

  if (
    selectedHours === maxDateParsed.getHours() &&
    selectedMinutes === maxDateParsed.getMinutes()
  ) {
    return rawValue <= maxDateParsed.getSeconds();
  }
  return (
    selectedHours < maxDateParsed.getHours() ||
    (selectedHours === maxDateParsed.getHours() && selectedMinutes < maxDateParsed.getMinutes())
  );
}

function canSelectDateTimeSecond(rawValue, bounds, selectedDate, selectedTime) {
  const { min: minDateParsed, max: maxDateParsed } = bounds;
  const { day: selectedDay, month: selectedMonth, year: selectedYear } = selectedDate;
  const { hours: selectedHours, minutes: selectedMinutes } = selectedTime;

  const hasHour = isDefined(selectedHours);
  const hasMinute = isDefined(selectedMinutes);

  // If no hour or minute selected, allow all seconds
  if (!hasHour || !hasMinute) return true;

  const isMinDay = isSameDay(new Date(selectedYear, selectedMonth, selectedDay), minDateParsed);
  const isMaxDay = isSameDay(new Date(selectedYear, selectedMonth, selectedDay), maxDateParsed);

  if (isMinDay && isMaxDay) {
    return canSelectSecondSameDay(rawValue, selectedTime, bounds);
  }

  if (isMinDay) {
    return canSelectSecondMinDayOnly(rawValue, selectedTime, minDateParsed);
  }

  if (isMaxDay) {
    return canSelectSecondMaxDayOnly(rawValue, selectedTime, maxDateParsed);
  }

  return true;
}

// Regular date and time validation if timeOnly is false
function canSelectDateTime(rawValue, bounds, selectedDate, selectedTime, timeUnit) {
  if (timeUnit === 'hour') {
    return canSelectDateTimeHour(rawValue, bounds, selectedDate, selectedTime);
  }

  if (timeUnit === 'minute') {
    return canSelectDateTimeMinute(rawValue, bounds, selectedDate, selectedTime);
  }

  if (timeUnit === 'second') {
    return canSelectDateTimeSecond(rawValue, bounds, selectedDate, selectedTime);
  }

  // Allow everything if no unit is specified
  return true;
}

/**
 * Checks whether a given hour/minute/second value is selectable within the min/max bounds.
 * @param {number|string} rawValue - The hour, minute, or second value being validated.
 * @param {Date|string|null} minDate - Lower bound, as a `Date` or parseable string.
 * @param {Date|string|null} maxDate - Upper bound, as a `Date` or parseable string.
 * @param {object} selectedDate - Currently selected `{ day, month, year }`.
 * @param {object} selectedTime - Currently selected `{ hours, minutes, seconds }`.
 * @param {string} timeUnit - Which unit `rawValue` represents ('hour'|'minute'|'second').
 * @param {boolean} timeOnly - When true, validates the time only and ignores `selectedDate`.
 * @returns {boolean} Whether `rawValue` can be selected.
 */
export function canSelectTime(
  rawValue,
  minDate,
  maxDate,
  selectedDate,
  selectedTime,
  timeUnit,
  timeOnly
) {
  if (isNil(rawValue)) return false;

  // Parse minDate and maxDate if they are strings
  const bounds = {
    min: minDate ? new Date(minDate) : null,
    max: maxDate ? new Date(maxDate) : null,
  };

  if (timeOnly) {
    return canSelectTimeOnly(rawValue, bounds, timeUnit, selectedTime);
  }

  return canSelectDateTime(rawValue, bounds, selectedDate, selectedTime, timeUnit);
}
