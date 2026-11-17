import { formatValueDefault, formatValueArray, formatValueBool } from '@/utils/format/value';
import { DEFAULT_BOOL_TEXTS } from '@/utils/format/constants';
import { formatUrl } from '@/utils/format/string';
import { formatValueDate, formatValueDateTime } from '@/utils/format/date';

// `formatValue` dispatches across the other modules, so it necessarily pulls the date ones.
// It lives apart from `value.js` so that components wanting only `formatValueBool` are not
// dragged into date-fns.

export function formatValue(value, type = 'default', texts = DEFAULT_BOOL_TEXTS) {
  switch (type) {
    case 'date':
      return formatValueDate(value);
    case 'dateTime':
      return formatValueDateTime(value);
    case 'array':
      return formatValueArray(value);
    case 'bool':
      return formatValueBool(value, texts);
    case 'link':
      return formatUrl(value);
    default:
      return formatValueDefault(value);
  }
}
