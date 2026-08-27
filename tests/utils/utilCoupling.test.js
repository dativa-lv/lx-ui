// @ts-nocheck
import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import * as publicUtils from '@/utils';

const read = (p) => fs.readFileSync(path.resolve(__dirname, '../../src/utils', p), 'utf8');

// `lx*Utils` namespaces are exported as namespace objects, which bundlers cannot
// tree-shake per member: importing one function pulls the whole namespace and everything
// it depends on. So a heavy third-party dependency must not sit in a namespace whose other
// members are widely used — pulling `formatValue` used to cost DOMPurify (~32K) as well.
describe('util namespace coupling', () => {
  test('no format module depends on DOMPurify', () => {
    const dir = path.resolve(__dirname, '../../src/utils/format');
    fs.readdirSync(dir).forEach((f) => {
      expect(fs.readFileSync(path.join(dir, f), 'utf8'), f).not.toMatch(/dompurify/i);
    });
  });

  test('sanitisation lives in its own namespace', () => {
    expect(read('sanitizeUtils.js')).toMatch(/dompurify/i);
    expect(typeof publicUtils.lxSanitizeUtils.sanitizeToPlainText).toBe('function');
    expect(publicUtils.lxSanitizeUtils.sanitizeToPlainText('<b>hi</b>')).toBe('hi');
  });

  test('sanitizeToPlainText is no longer on lxFormatUtils', () => {
    expect(publicUtils.lxFormatUtils.sanitizeToPlainText).toBeUndefined();
  });

  test('formatUtils still works without the sanitiser', () => {
    expect(publicUtils.lxFormatUtils.formatValue('x')).toBe('x');
    expect(publicUtils.lxFormatUtils.formatUrl('www.example.com')).toBe('https://www.example.com');
  });
});

// The format utils are split into one module per concern, with `format/index.js` as a
// code-free re-export barrel. Two things must hold: the light modules must not reach the
// heavy dependencies, and internal code must import leaves rather than the barrel — if a
// component imports the barrel it inherits date-fns and the ISO country database again.
describe('format module split', () => {
  const PUBLIC_API = [
    'formatValueDefault',
    'formatValueDate',
    'formatPersonCode',
    'formatValueDateTime',
    'formatValueArray',
    'formatValueBool',
    'formatUrl',
    'formatValue',
    'formatFieldName',
    'objectClone',
    'shortenValue',
    'formatAddress',
    'formatDecimal',
    'formatCountryCode',
    'formatCurrency',
    'pluralize',
  ];
  const LIGHT = ['value.js', 'string.js', 'number.js', 'address.js', 'plural.js', 'object.js'];
  const importsOf = (rel) =>
    read(`format/${rel}`)
      .split('\n')
      .filter((l) => /^\s*import\b|^\s*export .* from /.test(l))
      .join('\n');

  test('lxFormatUtils still exposes its full API', () => {
    PUBLIC_API.forEach((name) => {
      expect(typeof publicUtils.lxFormatUtils[name], name).toBe('function');
    });
  });

  test('the light modules reach neither date-fns nor the country database', () => {
    LIGHT.forEach((m) => {
      expect(importsOf(m), m).not.toMatch(/dateUtils|date-fns/);
      expect(importsOf(m), m).not.toMatch(/countryCodeUtils|i18n-iso-countries|format\/country/);
    });
  });

  test('the barrel is a pure re-export — no code to inline into the entry', () => {
    const barrel = read('format/index.js')
      .split('\n')
      .filter((l) => l.trim() && !l.trim().startsWith('//'));
    barrel.forEach((l) => expect(l).toMatch(/^export \* from /));
  });

  test('no component imports the barrel', () => {
    const dir = path.resolve(__dirname, '../../src/components');
    const offenders = [];
    const walk = (p) => {
      fs.readdirSync(p, { withFileTypes: true }).forEach((e) => {
        const full = path.join(p, e.name);
        if (e.isDirectory()) walk(full);
        else if (/\.vue$/.test(e.name)) {
          const src = fs.readFileSync(full, 'utf8');
          if (/from '@\/utils\/format'/.test(src)) offenders.push(path.relative(dir, full));
        }
      });
    };
    walk(dir);
    expect(offenders).toEqual([]);
  });

  test('formatting still works through the public namespace', () => {
    expect(publicUtils.lxFormatUtils.formatValue('2007-05-22', 'date')).toBe('22.05.2007.');
    expect(publicUtils.lxFormatUtils.formatValue(true, 'bool')).toBe('Jā');
    expect(publicUtils.lxFormatUtils.formatValue('www.example.com', 'link')).toBe(
      'https://www.example.com'
    );
    expect(publicUtils.lxFormatUtils.formatCountryCode('LV', 'lv')).toBe('Latvija');
    expect(publicUtils.lxFormatUtils.objectClone({ a: [1] })).toEqual({ a: [1] });
  });
});
