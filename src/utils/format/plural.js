import useLx from '@/hooks/useLx';

// Plural form selection, via native Intl.PluralRules.

/**
 * Selects localized plural form for numeric value.
 *
 * Form keys should match `Intl.PluralRules` categories: `zero`, `one`, `two`, `few`, `many`, `other`.
 * The `other` form is used as fallback when no category-specific form is available.
 *
 * @param {number|string} value - Numeric value used for plural category selection.
 * @param {{
 *   zero?: string,
 *   one?: string,
 *   two?: string,
 *   few?: string,
 *   many?: string,
 *   other?: string,
 * }} forms - Plural forms by Intl category.
 * @param {string} [locale] - Locale identifier. Defaults to app locale or `lv-LV`.
 * @returns {string} Matching plural form, fallback form, or empty string.
 */
export function pluralize(value, forms, locale) {
  if (!forms || typeof forms !== 'object' || Array.isArray(forms)) {
    return '';
  }

  const fallback = typeof forms.other === 'string' ? forms.other : '';

  let numberValue;
  try {
    numberValue = Number(value);
  } catch {
    return fallback;
  }

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  try {
    const localeId = locale || useLx().getGlobals()?.locale?.locale || 'lv-LV';
    const category = new Intl.PluralRules(localeId).select(numberValue);
    const form = forms[category];

    return typeof form === 'string' ? form : fallback;
  } catch {
    return fallback;
  }
}
