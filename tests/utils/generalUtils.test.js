import { describe, test, expect, afterEach } from 'vitest';
import { getDisplayTexts } from '@/utils/generalUtils';
import { setComponentTexts } from '@/utils/global';

afterEach(() => {
  // Global component texts are a module-level singleton, reset between tests.
  setComponentTexts({});
});

describe('getDisplayTexts', () => {
  describe('without a componentKey (no global texts layer)', () => {
    test('returns defaults when nothing is passed', () => {
      const textsDefault = { valueYes: 'Jā', valueNo: 'Nē' };

      expect(getDisplayTexts(undefined, textsDefault)).toEqual(textsDefault);
      expect(getDisplayTexts({}, textsDefault)).toEqual(textsDefault);
    });

    test('overrides only the keys present on the passed texts, keeping the rest default', () => {
      const textsDefault = { valueYes: 'Jā', valueNo: 'Nē', emptyValue: 'Nav norādīts' };

      expect(getDisplayTexts({ valueYes: 'Yes' }, textsDefault)).toEqual({
        valueYes: 'Yes',
        valueNo: 'Nē',
        emptyValue: 'Nav norādīts',
      });
    });

    test('a key explicitly set (even to falsy values) still wins over the default', () => {
      const textsDefault = { label: 'Default label' };

      expect(getDisplayTexts({ label: '' }, textsDefault)).toEqual({ label: '' });
      expect(getDisplayTexts({ label: null }, textsDefault)).toEqual({ label: null });
    });

    test('recurses into nested default objects (e.g. badgeTypes), merging per key', () => {
      const textsDefault = {
        badgeTypes: {
          default: 'informatīvs paziņojums',
          success: 'sekmīgs paziņojums',
          error: 'svarīgs paziņojums',
        },
      };

      expect(getDisplayTexts({ badgeTypes: { success: 'Success!' } }, textsDefault)).toEqual({
        badgeTypes: {
          default: 'informatīvs paziņojums',
          success: 'Success!',
          error: 'svarīgs paziņojums',
        },
      });
    });

    test('a componentKey with no global override registered behaves like the plain merge', () => {
      const textsDefault = { valueYes: 'Jā', valueNo: 'Nē' };

      expect(getDisplayTexts({ valueYes: 'Yes' }, textsDefault, 'LxToggle')).toEqual({
        valueYes: 'Yes',
        valueNo: 'Nē',
      });
    });
  });

  describe('with a componentKey (global texts layer active)', () => {
    test('global override applies when no instance texts are passed', () => {
      const textsDefault = { valueYes: 'Jā', valueNo: 'Nē' };
      setComponentTexts({ LxToggle: { valueYes: 'Global Yes' } });

      expect(getDisplayTexts(undefined, textsDefault, 'LxToggle')).toEqual({
        valueYes: 'Global Yes',
        valueNo: 'Nē',
      });
    });

    test('a global override for one key does not affect a sibling key still on default', () => {
      const textsDefault = { valueYes: 'Jā', valueNo: 'Nē', emptyValue: 'Nav norādīts' };
      setComponentTexts({ LxToggle: { valueYes: 'Global Yes' } });

      const result = getDisplayTexts(undefined, textsDefault, 'LxToggle');
      expect(result.valueYes).toBe('Global Yes');
      expect(result.valueNo).toBe('Nē');
      expect(result.emptyValue).toBe('Nav norādīts');
    });

    test('instance texts win over the global override for the same key', () => {
      const textsDefault = { valueYes: 'Jā', valueNo: 'Nē' };
      setComponentTexts({ LxToggle: { valueYes: 'Global Yes', valueNo: 'Global No' } });

      const result = getDisplayTexts({ valueYes: 'Instance Yes' }, textsDefault, 'LxToggle');
      expect(result.valueYes).toBe('Instance Yes');
      expect(result.valueNo).toBe('Global No');
    });

    test('priority chain per key is instance > global > default with no overwrites bleeding across keys', () => {
      const textsDefault = { a: 'default-a', b: 'default-b', c: 'default-c' };
      // b overridden globally only, c overridden both globally and by instance, a untouched
      setComponentTexts({ LxWidget: { b: 'global-b', c: 'global-c' } });

      const result = getDisplayTexts({ c: 'instance-c' }, textsDefault, 'LxWidget');
      expect(result).toEqual({ a: 'default-a', b: 'global-b', c: 'instance-c' });
    });

    test('a global override registered for a different component key is ignored', () => {
      const textsDefault = { valueYes: 'Jā', valueNo: 'Nē' };
      setComponentTexts({ LxOtherComponent: { valueYes: 'Should not apply' } });

      expect(getDisplayTexts(undefined, textsDefault, 'LxToggle')).toEqual(textsDefault);
    });

    test('clearing the global override falls back to defaults again', () => {
      const textsDefault = { valueYes: 'Jā', valueNo: 'Nē' };
      setComponentTexts({ LxToggle: { valueYes: 'Global Yes' } });
      expect(getDisplayTexts(undefined, textsDefault, 'LxToggle').valueYes).toBe('Global Yes');

      setComponentTexts({});
      expect(getDisplayTexts(undefined, textsDefault, 'LxToggle')).toEqual(textsDefault);
    });

    test('global override merges into nested default objects per key too', () => {
      const textsDefault = {
        badgeTypes: {
          default: 'informatīvs paziņojums',
          success: 'sekmīgs paziņojums',
          error: 'svarīgs paziņojums',
        },
      };
      setComponentTexts({ LxButton: { badgeTypes: { success: 'Global success' } } });

      const result = getDisplayTexts(undefined, textsDefault, 'LxButton');
      expect(result.badgeTypes).toEqual({
        default: 'informatīvs paziņojums',
        success: 'Global success',
        error: 'svarīgs paziņojums',
      });
    });
  });
});
