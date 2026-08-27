import { describe, test, expect, afterEach, beforeEach, vi } from 'vitest';
import { makeIntegerValidator } from '@/utils/numberInputUtils';
import { setGlobalProperties } from '@/utils/global';

let consoleWarnSpy;

beforeEach(() => {
  consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  consoleWarnSpy.mockRestore();
  // Global properties are a module-level singleton, reset between tests.
  setGlobalProperties({});
});

describe('makeIntegerValidator', () => {
  describe('factory', () => {
    test('returns a validator function', () => {
      const validator = makeIntegerValidator('min');

      expect(validator).toBeTypeOf('function');
    });

    test('each validator keeps its own prop name in the warning', () => {
      setGlobalProperties({ environment: 'development' });

      makeIntegerValidator('min')(1.5, { id: 'slider-1' });
      makeIntegerValidator('stepMultiplier')(1.5, { id: 'slider-1' });

      expect(consoleWarnSpy.mock.calls[0][0]).toContain('"min"');
      expect(consoleWarnSpy.mock.calls[1][0]).toContain('"stepMultiplier"');
    });
  });

  describe('accepted values', () => {
    test('returns true for whole numbers', () => {
      const validator = makeIntegerValidator('modelValue');

      expect(validator(0, {})).toBe(true);
      expect(validator(1, {})).toBe(true);
      expect(validator(9999, {})).toBe(true);
      expect(validator(-42, {})).toBe(true);
      expect(validator(Number.MAX_SAFE_INTEGER, {})).toBe(true);
    });

    test('returns true for whole numbers passed as strings', () => {
      const validator = makeIntegerValidator('modelValue');

      expect(validator('0', {})).toBe(true);
      expect(validator('42', {})).toBe(true);
      expect(validator('-42', {})).toBe(true);
      // 5.0 has no fractional part, so it counts as whole
      expect(validator('5.0', {})).toBe(true);
    });

    test('returns true for values that coerce to 0 (null, empty string, false)', () => {
      const validator = makeIntegerValidator('modelValue');

      expect(validator(null, {})).toBe(true);
      expect(validator('', {})).toBe(true);
      expect(validator(false, {})).toBe(true);
    });

    test('does not warn for accepted values', () => {
      setGlobalProperties({ environment: 'development' });
      const validator = makeIntegerValidator('modelValue');

      validator(7, { id: 'slider-1' });

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('rejected values', () => {
    test('returns false for decimals', () => {
      const validator = makeIntegerValidator('step');

      expect(validator(1.5, {})).toBe(false);
      expect(validator(-1.5, {})).toBe(false);
      expect(validator(0.1, {})).toBe(false);
    });

    test('returns false for decimals passed as strings', () => {
      const validator = makeIntegerValidator('step');

      expect(validator('1.5', {})).toBe(false);
      expect(validator('-0.25', {})).toBe(false);
    });

    test('returns false for values that do not coerce to a number', () => {
      const validator = makeIntegerValidator('max');

      expect(validator(undefined, {})).toBe(false);
      expect(validator(NaN, {})).toBe(false);
      expect(validator('abc', {})).toBe(false);
      expect(validator({}, {})).toBe(false);
    });

    test('returns false for infinite values', () => {
      const validator = makeIntegerValidator('max');

      expect(validator(Infinity, {})).toBe(false);
      expect(validator(-Infinity, {})).toBe(false);
    });
  });

  describe('warning message', () => {
    beforeEach(() => {
      setGlobalProperties({ environment: 'development' });
    });

    test('warns once per rejected value', () => {
      const validator = makeIntegerValidator('modelValue');

      validator(1.5, { id: 'slider-1' });

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });

    test('names the component, the instance id and the offending prop', () => {
      const validator = makeIntegerValidator('modelValue');

      validator(1.5, { id: 'slider-1' });

      const message = consoleWarnSpy.mock.calls[0][0];
      expect(message).toContain('LxNumberInput');
      expect(message).toContain('[slider-1]');
      expect(message).toContain('"modelValue"');
      expect(message).toContain('only supports whole numbers');
    });

    test('does not throw when the props object has no id', () => {
      const validator = makeIntegerValidator('modelValue');

      expect(() => validator(1.5, {})).not.toThrow();
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('[undefined]');
    });
  });

  describe('environment gating', () => {
    test('logs the warning in dev-like environments', () => {
      const validator = makeIntegerValidator('min');

      ['development', 'local', 'staging'].forEach((environment, index) => {
        setGlobalProperties({ environment });

        expect(validator(1.5, { id: 'slider-1' })).toBe(false);
        expect(consoleWarnSpy).toHaveBeenCalledTimes(index + 1);
      });
    });

    test('stays silent in production but still rejects the value', () => {
      setGlobalProperties({ environment: 'production' });
      const validator = makeIntegerValidator('min');

      expect(validator(1.5, { id: 'slider-1' })).toBe(false);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    test('stays silent when no globals are registered but still rejects the value', () => {
      const validator = makeIntegerValidator('min');

      expect(validator(1.5, { id: 'slider-1' })).toBe(false);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });
});
