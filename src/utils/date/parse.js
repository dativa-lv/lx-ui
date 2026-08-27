import { parse, parseJSON, isDate, formatRFC3339, format } from 'date-fns';

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
