/**
 * Returns new date shifted by number of days.
 * @param {Date} date - Base date value.
 * @param {number} days - Day offset (can be negative).
 * @returns {Date} Shifted date instance.
 */
export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Returns new date shifted by number of minutes.
 * @param {Date} date - Base date value.
 * @param {number} minutes - Minute offset (can be negative).
 * @returns {Date} Shifted date instance.
 */
export function addMinutes(date, minutes) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}

export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
