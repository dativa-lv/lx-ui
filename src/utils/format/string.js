import { cutString, shortenUserName } from '@/utils/stringUtils';

export function formatPersonCode(value, country = 'LV') {
  if (country === 'LV') {
    return value ? value.replace(/(\d{6})-?(\d{5})/, '$1-$2') : '';
  }
  return value;
}

export function formatUrl(value) {
  let newUrl = globalThis.decodeURIComponent(value);
  newUrl = newUrl.trim().replace(/\s/g, '');

  if (/^[a-z][a-z0-9+.-]*:(?=.*[a-z0-9]).+$/i.test(newUrl)) {
    return newUrl;
  }

  return `https://${newUrl}`;
}

function formatWithUnit(absValue, isNegative, maxChars) {
  const units = [
    { limit: 1e45, suffix: 'Qd' },
    { limit: 1e42, suffix: 'Td' },
    { limit: 1e39, suffix: 'Dd' },
    { limit: 1e36, suffix: 'Ud' },
    { limit: 1e33, suffix: 'Dc' },
    { limit: 1e30, suffix: 'N' },
    { limit: 1e27, suffix: 'Oc' },
    { limit: 1e24, suffix: 'Sp' },
    { limit: 1e21, suffix: 'Sx' },
    { limit: 1e18, suffix: 'Qi' },
    { limit: 1e15, suffix: 'Q' },
    { limit: 1e12, suffix: 'T' },
    { limit: 1e9, suffix: 'B' },
    { limit: 1e6, suffix: 'M' },
    { limit: 1e3, suffix: 'K' },
  ];
  const unit = units.find(({ limit }) => absValue >= limit);

  if (unit) {
    const scaledValue = absValue / unit.limit;

    // Allow space for suffix and negative sign
    const maxNumericChars = isNegative
      ? maxChars - unit.suffix.length - 1
      : maxChars - unit.suffix.length;

    let numericPart = scaledValue.toFixed(maxNumericChars);

    // Reduce decimal places until the number fits within allowed length
    for (let decimals = maxNumericChars; decimals >= 0; decimals -= 1) {
      if (numericPart.length <= maxNumericChars) break;
      numericPart = scaledValue.toFixed(decimals);
    }

    if (numericPart.length > maxNumericChars) {
      const nextUnit = units[units.findIndex(({ limit }) => unit.limit === limit) - 1];
      return `0${nextUnit?.suffix}`;
    }
    return `${isNegative ? '-' : ''}${numericPart.replace('.', ',')}${unit.suffix}`;
  }
  return `${isNegative ? '-' : ''}${absValue.toString()}`;
}

function shortenInteger(value, maxChars) {
  const isNegative = value < 0;
  const absValue = Math.abs(value);
  const valueStr = absValue.toString().replace('.', '');

  if (valueStr.length <= maxChars) {
    return isNegative ? `-${valueStr}` : valueStr;
  }

  // Prevent showing undefined suffix
  const shouldHideSuffix =
    (Number(maxChars) === 3 && absValue >= (isNegative ? 1e45 : 1e46)) ||
    (Number(maxChars) === 4 && absValue >= (isNegative ? 1e46 : 1e47));

  if (absValue >= 1e48 || shouldHideSuffix) {
    // Prevent showing exponent if not enough space
    if (maxChars > 17) {
      return `${isNegative ? '-' : ''}${cutString(valueStr, 17)}`;
    }
    return isNegative ? `-${cutString(valueStr, maxChars - 1)}` : cutString(valueStr, maxChars);
  }

  return formatWithUnit(absValue, isNegative, maxChars);
}

function shortenName(name, maxChars) {
  const { firstName, lastName } = name;

  if (!firstName || !lastName) {
    return firstName || lastName || '';
  }

  const fullName = `${firstName} ${lastName}`;
  if (fullName.length <= maxChars) {
    return fullName;
  }

  if (maxChars >= 5) {
    const shortenedUserName = shortenUserName(firstName, lastName);
    return cutString(shortenedUserName, maxChars);
  }

  if (Number(maxChars) === 4) {
    return `${firstName[0]}.${lastName[0]}.`;
  }

  if (Number(maxChars) === 3) {
    return `${firstName[0]}${lastName[0]}`;
  }

  return fullName;
}

export function shortenValue(value, maxChars = 4, type = null) {
  if (maxChars < 3) {
    return value;
  }
  if (type === 'integer' || typeof value === 'number') {
    const intValue = Math.floor(value);
    return shortenInteger(intValue, maxChars);
  }
  if (type === 'name') {
    return shortenName(value, maxChars);
  }

  return value;
}
