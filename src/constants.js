/**
 * MIME types used in the application.
 * @enum {string}
 */
export const MIME_TYPES = Object.freeze({
  PDF: 'application/pdf',
  ZIP: 'application/zip',
  XML: 'application/xml',
  Binary: 'application/octet-stream',
  Image: 'image/*',
});

/**
 * Constants for out-of-range event types.
 * @enum {string}
 */
export const DATE_VALIDATION_RESULT = Object.freeze({
  /** Value is too early (before the minimum allowed) */
  OUT_OF_RANGE_MIN: 'OUT_OF_RANGE_MIN',
  /** Value is too late (exceeds allowed period) */
  OUT_OF_RANGE_MAX: 'OUT_OF_RANGE_MAX',
  /** Value is within allowed range */
  VALID: 'VALID',
  /** Value to check has not been received */
  NO_VALUE: 'NO_VALUE',
});

/**
 * Maximum allowed input lengths by prefix (e.g., phone country code).
 * Key: string prefix, Value: max character count.
 */
export const PHONE_MAX_LENGTH_BY_PREFIX = new Map([
  // Latvia phone numbers: "+371" + 8 digits = 12 characters total
  ['+371', 12],
  // Latvia phone numbers: "00371" + 8 digits = 13 characters total
  ['00371', 13],
]);

/**
 * Duration conversion constants.
 */
export const DURATION_CONVERSION = Object.freeze({
  DAYS_IN_YEAR_APPROX: 365,
  DAYS_IN_MONTH_APPROX: 30,
  MONTHS_IN_YEAR: 12,
  HOURS_IN_DAY: 24,
  MINUTES_IN_HOUR: 60,
});

/**
 * Number of days in each month, leap-agnostic (February always allows 29).
 * Index is 0-based (0 = January).
 */
export const DAYS_IN_MONTH = Object.freeze([
  31, // January
  29, // February (leap-agnostic — keeps 29 selectable in yearless pickers)
  31, // March
  30, // April
  31, // May
  30, // June
  31, // July
  31, // August
  30, // September
  31, // October
  30, // November
  31, // December
]);

/**
 * Default input masks for the free-typing date/time picker modes,
 * used only when a mask isn't supplied by the locale/props.
 */
export const TYPED_INPUT_DEFAULT_MASKS = Object.freeze({
  input: 'dd.MM.yyyy.',
  inputTime24hr: 'HH:mm',
  inputTimeFull24hr: 'HH:mm:ss',
  inputDateTime24hr: 'dd.MM.yyyy. HH:mm',
  inputDateTimeFull24hr: 'dd.MM.yyyy. HH:mm:ss',
});
