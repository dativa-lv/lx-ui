import useLx from '@/hooks/useLx';
import { isEmpty } from '@/utils/generalUtils';
import { EMPTY_VALUE } from '@/utils/format/constants';

export function formatDecimal(value, precision = 2) {
  const language = useLx().getGlobals()?.locale?.locale || 'lv-LV';

  return Number.isInteger(value)
    ? value
    : new Intl.NumberFormat(language, {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      }).format(value);
}

export function formatCurrency(value, currency = null, language = null) {
  if (isEmpty(value) || Number.isNaN(Number(value))) {
    return EMPTY_VALUE;
  }

  const currencyCode = currency || useLx().getGlobals()?.currency || 'EUR';
  const locale = language || useLx().getGlobals()?.locale?.locale || 'lv-LV';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(value);
}
