import { describe, test, expect } from 'vitest';
import { formatAddress, pluralize } from '@/utils/formatUtils';

test('Format address city', async () => {
  const address = {
    country: 'LATVIJA',
    city: 'RĪGA',
    streetName: 'DUNTES IELA',
    buildingNumberNumeric: '28',
    unitId: '82',
    postalCode: 'LV1005',
  };

  const addressLine = formatAddress(address);
  expect(addressLine).toBe('DUNTES IELA 28-82, RĪGA, LV-1005, LATVIJA');
});

test('Format address outside city', async () => {
  const address = {
    country: 'LATVIJA',
    atvkName3: 'ILŪKSTES NOVADS',
    atvkName4: 'ILŪKSTE',
    streetName: 'MEŽA IELA',
    buildingNumberNumeric: '5',
    buildingNumberSuffix: '2',
    unitId: '33/35',
    postalCode: 'LV5477',
  };

  const addressLine = formatAddress(address);
  expect(addressLine).toBe('MEŽA IELA 5/2-33/35, ILŪKSTE, ILŪKSTES NOVADS, LV-5477, LATVIJA');
});

test('Format address street address line', async () => {
  const address = {
    country: 'LATVIJA',
    streetAddressLine: 'DUNTES IELA 28-82, RĪGA, LV-1005',
  };

  const addressLine = formatAddress(address);
  expect(addressLine).toBe('DUNTES IELA 28-82, RĪGA, LV-1005, LATVIJA');
});

test('Format address building number', async () => {
  const address = {
    country: 'LATVIJA',
    city: 'RĪGA',
    streetName: 'DUNTES IELA',
    buildingNumber: '28',
    unitId: '82',
    postalCode: 'LV1005',
  };

  const addressLine = formatAddress(address);
  expect(addressLine).toBe('DUNTES IELA 28-82, RĪGA, LV-1005, LATVIJA');
});

test('Format address named building', async () => {
  const address = {
    country: 'LATVIJA',
    atvkName3: 'TUKUMA NOVADS',
    atvkName4: 'ZENTENES PAGASTS',
    buildingNumber: 'CĪRULĪŠI',
    postalCode: 'LV3123',
  };

  const addressLine = formatAddress(address);
  expect(addressLine).toBe('CĪRULĪŠI, ZENTENES PAGASTS, TUKUMA NOVADS, LV-3123, LATVIJA');
});

test('Format address postal code with dash', async () => {
  const address = {
    country: 'LATVIJA',
    city: 'RĪGA',
    streetName: 'DUNTES IELA',
    buildingNumber: '28',
    unitId: '82',
    postalCode: 'LV-1005',
  };

  const addressLine = formatAddress(address);
  expect(addressLine).toBe('DUNTES IELA 28-82, RĪGA, LV-1005, LATVIJA');
});

test('Format address postal code numbers only', async () => {
  const address = {
    country: 'LATVIJA',
    city: 'RĪGA',
    streetName: 'DUNTES IELA',
    buildingNumber: '28',
    unitId: '82',
    postalCode: '1005',
  };

  const addressLine = formatAddress(address);
  expect(addressLine).toBe('DUNTES IELA 28-82, RĪGA, LV-1005, LATVIJA');
});

test('Format address no postal code', async () => {
  const address = {
    country: 'LATVIJA',
    city: 'RĪGA',
    streetName: 'DUNTES IELA',
    buildingNumber: '28',
    unitId: '82',
  };

  const addressLine = formatAddress(address);
  expect(addressLine).toBe('DUNTES IELA 28-82, RĪGA, LATVIJA');
});

test('Format address with atvk', async () => {
  const address = {
    country: 'LATVIJA',
    city: 'RĪGA',
    streetName: 'DUNTES IELA',
    buildingNumberNumeric: '28',
    unitId: '82',
    postalCode: 'LV1005',
    atvkCode: '010096',
  };

  const addressLine = formatAddress(address, true);
  expect(addressLine).toBe('DUNTES IELA 28-82, RĪGA, LV-1005, LATVIJA (010096)');
});

test('Format address no street', async () => {
  const address = {
    country: 'LATVIJA',
    city: 'RĪGA',
    postalCode: 'LV1005',
    atvkCode: '010096',
  };

  const addressLine = formatAddress(address, false);
  expect(addressLine).toBe('RĪGA, LV-1005, LATVIJA');
});

test('Format address no city', async () => {
  const address = {
    country: 'LATVIJA',
    atvkName3: 'LIMBAŽU NOVADS',
  };

  const addressLine = formatAddress(address, false);
  expect(addressLine).toBe('LIMBAŽU NOVADS, LATVIJA');
});

describe('pluralize', () => {
  const localeLv = 'lv';
  const localeEn = 'en';

  test('selects Latvian plural forms', () => {
    const forms = {
      zero: 'dienu',
      one: 'diena',
      other: 'dienas',
    };

    expect(pluralize(0, forms, localeLv)).toBe(forms.zero);
    expect(pluralize(1, forms, localeLv)).toBe(forms.one);
    expect(pluralize(2, forms, localeLv)).toBe(forms.other);
    expect(pluralize(11, forms, localeLv)).toBe(forms.zero);
    expect(pluralize(21, forms, localeLv)).toBe(forms.one);
  });

  test('selects English plural forms', () => {
    const forms = {
      one: 'day',
      other: 'days',
    };

    expect(pluralize(0, forms, localeEn)).toBe(forms.other);
    expect(pluralize(1, forms, localeEn)).toBe(forms.one);
    expect(pluralize(2, forms, localeEn)).toBe(forms.other);
    expect(pluralize(11, forms, localeEn)).toBe(forms.other);
    expect(pluralize(21, forms, localeEn)).toBe(forms.other);
  });

  test('supports numeric strings', () => {
    const forms = {
      one: 'month',
      other: 'months',
    };

    expect(pluralize('1', forms, localeEn)).toBe(forms.one);
    expect(pluralize('2', forms, localeEn)).toBe(forms.other);
  });

  test('supports negative values', () => {
    const forms = {
      one: 'day',
      other: 'days',
    };

    expect(pluralize(-1, forms, localeEn)).toBe(forms.one);
    expect(pluralize(-2, forms, localeEn)).toBe(forms.other);
  });

  test('falls back to other form', () => {
    const forms = {
      other: 'items',
    };

    expect(pluralize(1, forms, localeEn)).toBe(forms.other);
    expect(pluralize(Number.NaN, forms, localeEn)).toBe(forms.other);
    expect(pluralize(1, forms, 'invalid locale')).toBe(forms.other);
  });

  test('returns empty string when fallback is unavailable', () => {
    const invalidForms = [{}, null, /** @type {any} */ ([]), /** @type {any} */ ({ other: 123 })];
    const result = '';

    invalidForms.forEach((forms) => {
      expect(pluralize(1, forms)).toBe(result);
    });
  });

  test('falls back when selected plural form is not string', () => {
    const forms = /** @type {any} */ ({
      one: 123,
      other: 'items',
    });

    expect(pluralize(1, forms, localeEn)).toBe(forms.other);
  });

  test('does not throw for values that cannot be converted to numbers', () => {
    const forms = {
      other: 'items',
    };
    const value = {
      valueOf() {
        throw new Error('Cannot convert value');
      },
    };

    expect(pluralize(/** @type {any} */ (value), forms)).toBe(forms.other);
    expect(() => pluralize(/** @type {any} */ (Symbol('value')), forms)).not.toThrow();
  });
});
