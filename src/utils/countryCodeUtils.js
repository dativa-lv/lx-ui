import countries from 'i18n-iso-countries';

import lv from 'i18n-iso-countries/langs/lv.json';
import en from 'i18n-iso-countries/langs/en.json';

// register locales lazily so importing this module has no side effect
let localesRegistered = false;
function ensureLocales() {
  if (localesRegistered) return;
  countries.registerLocale(lv);
  countries.registerLocale(en);
  localesRegistered = true;
}

export function countryCodeToName(countryCode, lang = 'lv') {
  ensureLocales();
  const SUPPORTED_LANGUAGES = ['lv', 'en'];

  // check if lang is in format xx-XX
  let language = lang;
  if (language && language.length > 2 && language.includes('-')) {
    [language] = language.split('-');
  }

  // check if lang is supported
  language = SUPPORTED_LANGUAGES.includes(language) ? language : 'lv';
  return countries.isValid(countryCode) ? countries.getName(countryCode, language) : null;
}

/**
 * Resolves an ISO country code to its localized name, with a fallback.
 *
 * Lives here rather than in formatUtils so that module no longer has to import the country
 * database — every formatUtils consumer used to inherit it. Still re-exported from
 * formatUtils, so `lxFormatUtils.formatCountryCode` is unchanged.
 *
 * @param {string} value - ISO 3166 country code.
 * @param {string} [language='lv'] - `'lv'` or `'en'`.
 * @param {*} [notExistsValue=null] - Returned when the code has no name.
 * @returns {string|*} The localized name, or `notExistsValue`.
 */
export function formatCountryCode(value, language = 'lv', notExistsValue = null) {
  return countryCodeToName(value, language) || notExistsValue;
}
