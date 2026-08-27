import { format, parseISO, isValid } from 'date-fns';
import useLx from '@/hooks/useLx';

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
