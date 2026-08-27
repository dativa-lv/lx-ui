import { formatDate, formatDateTime } from '@/utils/date/format';
import { EMPTY_VALUE } from '@/utils/format/constants';

// The only format module that reaches dateUtils, and therefore date-fns.

export function formatValueDate(value) {
  return formatDate(value) || EMPTY_VALUE;
}

export function formatValueDateTime(value) {
  return formatDateTime(value) || EMPTY_VALUE;
}
