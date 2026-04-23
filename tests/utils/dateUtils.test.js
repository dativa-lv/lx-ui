import { describe, expect, it, vi } from 'vitest';
import {
  parseDate,
  formatJSON,
  isDateValid,
  isTimeValid,
  isTimeFullValid,
  isSameDate,
  formatDateJSON,
  formatDate,
  formatDateTime,
  formatFull,
  isLeapYear,
  getMonthNames,
  getWeekdayNames,
  formatLocalizedDate,
  getMonthYearString,
  extractTimeFromDate,
  extractMonthFromDate,
  humanizeDate,
} from '@/utils/dateUtils';

process.env.TZ = 'UTC';

// Mock useLx
vi.mock('@/hooks/useLx', () => ({
  default: () => ({
    getGlobals: () => ({
      dateFormat: 'dd.MM.yyyy.',
      dateTimeFormat: 'dd.MM.yyyy. HH:mm',
      dateTimeFullFormat: 'dd.MM.yyyy. HH:mm:ss',
    }),
  }),
}));

describe('Date Utils', () => {
  describe('parseDate', () => {
    it('returns null for falsy input', () => {
      expect(parseDate(null)).toBeNull();
      expect(parseDate('')).toBeNull();
      expect(parseDate(undefined)).toBeNull();
    });

    it('parses yyyy-MM-dd string (length 10)', () => {
      const d = parseDate('2025-11-24');
      expect(d).toBeInstanceOf(Date);
      expect(d?.getFullYear()).toBe(2025);
      expect(d?.getMonth()).toBe(10);
      expect(d?.getDate()).toBe(24);
    });

    it('parses full ISO strings with parseJSON', () => {
      const d = parseDate('2025-11-24T12:00:00.000Z');
      expect(d?.toISOString()).toBe('2025-11-24T12:00:00.000Z');
    });

    it('returns Date object unchanged', () => {
      const date = new Date();
      expect(parseDate(date)).toBe(date);
    });
  });

  describe('formatJSON', () => {
    it('returns null for falsy input', () => {
      expect(formatJSON(null)).toBeNull();
    });

    it('parses local formats by string length', () => {
      expect(formatJSON('24.11.2025')?.getDate()).toBe(24);
      expect(formatJSON('24.11.2025.')?.getDate()).toBe(24);
      expect(formatJSON('24.11.2025 14:30')?.getHours()).toBe(14);
      expect(formatJSON('24.11.2025. 14:30')?.getHours()).toBe(14);
      expect(formatJSON('24.11.2025 14:30:45')?.getSeconds()).toBe(45);
      expect(formatJSON('24.11.2025. 14:30:45')?.getSeconds()).toBe(45);
    });

    it('returns RFC3339 for Date objects (always in UTC with Z)', () => {
      const date = new Date(2019, 8, 18, 19, 0, 52);
      expect(formatJSON(date)).toBe('2019-09-18T19:00:52Z');
    });
  });

  describe('isDateValid', () => {
    it('returns true for valid dates', () => {
      expect(isDateValid('2025-11-24')).toBe(true);
      expect(isDateValid(new Date())).toBe(true);
    });

    it('returns false for invalid dates', () => {
      expect(isDateValid('invalid')).toBe(false);
      expect(isDateValid('')).toBe(false);
    });
  });

  describe('isTimeValid & isTimeFullValid', () => {
    it('validates HH:mm correctly', () => {
      expect(isTimeValid('12:30')).toBe(true);
      expect(isTimeValid('23:59')).toBe(true);
      expect(isTimeValid('24:00')).toBe(false);
      expect(isTimeValid('12:60')).toBe(false);
      expect(isTimeValid('abc')).toBe(false);
    });

    it('validates HH:mm:ss correctly', () => {
      expect(isTimeFullValid('12:30:45')).toBe(true);
      expect(isTimeFullValid('23:59:59')).toBe(true);
      expect(isTimeFullValid('24:00:00')).toBe(false);
    });
  });

  describe('isSameDate', () => {
    it('returns true when dates are the same day', () => {
      const d1 = new Date('2025-11-24');
      const d2 = new Date('2025-11-24');
      expect(isSameDate(d1, d2)).toBe(true);
    });

    it('returns false for different days', () => {
      const d1 = new Date('2025-11-24');
      const d2 = new Date('2025-11-25');
      expect(isSameDate(d1, d2)).toBe(false);
    });
  });

  describe('formatDateJSON', () => {
    it('returns yyyy-MM-dd string', () => {
      expect(formatDateJSON('24.11.2025.')).toBe('2025-11-24');
      expect(formatDateJSON(new Date('2025-11-24T12:00:00Z'))).toBe('2025-11-24');
    });

    it('returns null for invalid dates', () => {
      expect(formatDateJSON('invalid')).toBeNull();
    });
  });

  describe('formatDate', () => {
    it('formats full ISO string with timezone offset correctly', () => {
      expect(formatDate('2025-11-24T11:09:40.357731+00:00')).toBe('24.11.2025.');
    });

    it('formats full ISO string with Z (UTC) correctly', () => {
      expect(formatDate('2025-11-24T11:09:40Z')).toBe('24.11.2025.');
    });

    it('formats yyyy-MM-dd string correctly', () => {
      expect(formatDate('2025-11-24')).toBe('24.11.2025.');
    });

    it('formats native Date object correctly', () => {
      const date = new Date(2025, 10, 24); // Month is 0-based → November
      expect(formatDate(date)).toBe('24.11.2025.');
    });

    it('returns empty string for null or undefined', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
      expect(formatDate('')).toBe('');
    });

    it('returns empty string for invalid date strings', () => {
      expect(formatDate('invalid')).toBe('');
      expect(formatDate('2025-13-45')).toBe('');
      expect(formatDate('abc')).toBe('');
    });
  });

  describe('formatDateTime & formatFull', () => {
    it('formats with time using mocked globals', () => {
      expect(formatDateTime('2025-11-24T14:30:00')).toBe('24.11.2025. 14:30');
      expect(formatFull('2025-11-24T14:30:45')).toBe('24.11.2025. 14:30:45');
    });
  });

  describe('isLeapYear', () => {
    it('detects leap years correctly', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2020)).toBe(true);
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(1900)).toBe(false);
      expect(isLeapYear(2025)).toBe(false);
    });
  });

  describe('getMonthNames', () => {
    it('returns 12 months with correct names', () => {
      const months = getMonthNames('en-US');
      expect(months).toHaveLength(12);
      expect(months[0].fullName).toBe('January');
      expect(months[0].shortName).toBe('Jan');
    });

    it('handles locales with numeric short months (fallback)', () => {
      const months = getMonthNames('lt-LT');
      expect(months[0].shortName).toBe('saus.');
    });
  });

  describe('getWeekdayNames', () => {
    it('returns 7 weekdays starting from Monday when firstDayOfTheWeek = 2', () => {
      const days = getWeekdayNames('en-US', 2);
      expect(days[0].fullName).toBe('Monday');
      expect(days[6].fullName).toBe('Sunday');
    });
  });

  describe('formatLocalizedDate', () => {
    it('returns capitalized localized date', () => {
      const date = new Date(2025, 10, 24);
      const result = formatLocalizedDate('en-US', date);
      expect(result).toBe('Monday, November 24, 2025');
    });
  });

  describe('getMonthYearString', () => {
    it('returns localized month + year', () => {
      expect(getMonthYearString('lv-LV', 10, 2025)).toBe('2025. g. novembris');
      expect(getMonthYearString('en-US', 0, 2025)).toBe('January 2025');
    });
  });

  describe('extractTimeFromDate', () => {
    it('extracts time in locale format', () => {
      const time = extractTimeFromDate('lv-LV', '2025-11-24T14:30:45');
      expect(['14:30']).toContain(time);
      const time2 = extractTimeFromDate('en-US', '2025-11-24T14:30:45');
      expect(['02:30 PM']).toContain(time2);
    });
  });

  describe('extractMonthFromDate', () => {
    it('extracts month name, capitalized by default', () => {
      const month = extractMonthFromDate('lv-LV', '2025-11-24');
      expect(month).toBe('Novembris');

      const lower = extractMonthFromDate('lv-LV', '2025-11-24', false);
      expect(lower).toBe('novembris');
    });
  });

  describe('humanizeDate', () => {
    const unlimitedDays = 100000; // Or any other big number to get unlimited days

    const toUtcDate = (isoDate) => new Date(`${isoDate}T00:00:00.000Z`);

    const getDateRange = (fromIsoDate, toIsoDate) => {
      const dates = [];
      const current = toUtcDate(fromIsoDate);
      const end = toUtcDate(toIsoDate);

      while (current <= end) {
        dates.push(current.toISOString().slice(0, 10));
        current.setUTCDate(current.getUTCDate() + 1);
      }

      return dates;
    };

    const assertRows = (dateFrom, rows) => {
      const options = { dateFrom, limitDays: unlimitedDays, locale: 'lv' };

      rows.forEach(({ dates, from, to, label, labelNoun }) => {
        const values = dates || getDateRange(from, to);
        const expectedNoun = labelNoun || label;

        values.forEach((date) => {
          expect(humanizeDate(date, options)).toBe(label);
          expect(humanizeDate(date, { ...options, form: 'noun' })).toBe(expectedNoun);
        });
      });
    };

    it('returns empty value for invalid input', () => {
      const invalidInput = ['', '2026-13-13', 'invalid', null, undefined];
      const emptyValue = '—';

      invalidInput.forEach((input) => {
        expect(humanizeDate(input)).toBe(emptyValue);
      });
    });

    describe('falls back to formatted date when outside limitDays', () => {
      const dateFrom = '2026-04-13';

      it('any date (including today) if limitDays is 0', () => {
        const options = { dateFrom, limitDays: 0 };

        expect(humanizeDate(dateFrom, options)).toBe('13.04.2026.');
        expect(humanizeDate('2026-04-14', options)).toBe('14.04.2026.');
        expect(humanizeDate('2021-01-01', options)).toBe('01.01.2021.');
      });

      it('dates outside default limitDays (7)', () => {
        const options = { dateFrom };

        expect(humanizeDate('2026-04-20', options)).toBe('20.04.2026.');
        expect(humanizeDate('2026-04-06', options)).toBe('06.04.2026.');
        expect(humanizeDate('2026-04-19', options)).not.toBe('19.04.2026.');
        expect(humanizeDate('2026-04-07', options)).not.toBe('07.04.2026.');
      });
    });

    it('returns relative day label in en locale', () => {
      const options = { dateFrom: '2026-04-07', locale: 'en' };

      expect(humanizeDate('2026-04-05', options)).toBe('2 days ago');
      expect(humanizeDate('2026-04-06', options)).toBe('Yesterday');
      expect(humanizeDate('2026-04-07', options)).toBe('Today');
      expect(humanizeDate('2026-04-08', options)).toBe('Tomorrow');
      expect(humanizeDate('2026-04-09', options)).toBe('In 2 days');
    });

    it('returns relative day label in lv locale', () => {
      const options = { dateFrom: '2026-04-07', locale: 'lv' };

      expect(humanizeDate('2026-04-05', options)).toBe('Aizvakar');
      expect(humanizeDate('2026-04-06', options)).toBe('Vakar');
      expect(humanizeDate('2026-04-07', options)).toBe('Šodien');
      expect(humanizeDate('2026-04-08', options)).toBe('Rīt');
      expect(humanizeDate('2026-04-09', options)).toBe('Parīt');
    });

    it('returns weekday label for same-week date', () => {
      const options = { dateFrom: '2026-04-07', locale: 'lv' };

      expect(humanizeDate('2026-04-10', options)).toBe('Piektdien');
      expect(humanizeDate('2026-04-11', options)).toBe('Sestdien');
      expect(humanizeDate('2026-04-12', options)).toBe('Svētdien');
    });

    it('returns weekday label for next-week date', () => {
      const options = { dateFrom: '2026-04-07', locale: 'lv' };

      expect(humanizeDate('2026-04-13', options)).toBe('Nākamo pirmdien');
      expect(humanizeDate('2026-04-14', options)).not.toBe('Nākamo otrdien');
      expect(humanizeDate('2026-04-15', options)).not.toBe('Nākamo trešdien');
      expect(humanizeDate('2026-04-16', options)).not.toBe('Nākamo ceturtdien');
      expect(humanizeDate('2026-04-17', options)).not.toBe('Nākamo piektdien');
      expect(humanizeDate('2026-04-18', options)).not.toBe('Nākamo sestdien');
      expect(humanizeDate('2026-04-19', options)).not.toBe('Nākamo svētdien');
    });

    it('returns weekday label for previous-week date', () => {
      const options = { dateFrom: '2026-04-07', locale: 'lv' };

      expect(humanizeDate('2026-04-05', options)).not.toBe('Pagājušo svētdien');
      expect(humanizeDate('2026-04-04', options)).toBe('Pagājušo sestdien');
      expect(humanizeDate('2026-04-03', options)).toBe('Pagājušo piektdien');
      expect(humanizeDate('2026-04-02', options)).toBe('Pagājušo ceturtdien');
      expect(humanizeDate('2026-04-01', options)).toBe('Pagājušo trešdien');
      expect(humanizeDate('2026-03-31', options)).not.toBe('Pagājušo otrdien');
      expect(humanizeDate('2026-03-30', options)).not.toBe('Pagājušo pirmdien');
    });

    describe('matches various examples, covers every listed date/interval, includes noun form where applicable', () => {
      it('if today is 13.04.2026. (Monday, start of week, future dates)', () => {
        assertRows('2026-04-13', [
          { dates: ['2026-04-13'], label: 'Šodien', labelNoun: 'Šodiena' },
          { dates: ['2026-04-14'], label: 'Rīt', labelNoun: 'Rītdiena' },
          { dates: ['2026-04-15'], label: 'Parīt', labelNoun: 'Parītdiena' },
          { dates: ['2026-04-16'], label: 'Ceturtdien', labelNoun: 'Ceturtdiena' },
          { dates: ['2026-04-17'], label: 'Piektdien', labelNoun: 'Piektdiena' },
          { dates: ['2026-04-18'], label: 'Sestdien', labelNoun: 'Sestdiena' },
          { dates: ['2026-04-19'], label: 'Svētdien', labelNoun: 'Svētdiena' },
          {
            from: '2026-04-20',
            to: '2026-04-26',
            label: 'Nākamajā nedēļā',
            labelNoun: 'Nākamā nedēļa',
          },
          { from: '2026-04-27', to: '2026-05-03', label: 'Pēc 2 nedēļām' },
          { from: '2026-05-04', to: '2026-05-10', label: 'Pēc 3 nedēļām' },
          {
            from: '2026-05-11',
            to: '2026-05-31',
            label: 'Nākamajā mēnesī',
            labelNoun: 'Nākamais mēnesis',
          },
          { from: '2026-06-01', to: '2026-06-30', label: 'Pēc 2 mēnešiem' },
          { from: '2026-07-01', to: '2026-07-31', label: 'Pēc 3 mēnešiem' },
          { from: '2027-03-01', to: '2027-03-31', label: 'Pēc 11 mēnešiem' },
          {
            from: '2027-04-01',
            to: '2027-12-31',
            label: 'Nākamajā gadā',
            labelNoun: 'Nākamais gads',
          },
          { from: '2028-01-01', to: '2028-12-31', label: 'Pēc 2 gadiem' },
          { from: '2029-01-01', to: '2029-12-31', label: 'Pēc 3 gadiem' },
        ]);
      });

      it('if today is 13.04.2026. (Monday, start of week, past dates)', () => {
        assertRows('2026-04-13', [
          { dates: ['2026-04-13'], label: 'Šodien', labelNoun: 'Šodiena' },
          { dates: ['2026-04-12'], label: 'Vakar', labelNoun: 'Vakardiena' },
          { dates: ['2026-04-11'], label: 'Aizvakar', labelNoun: 'Aizvakardiena' },
          { dates: ['2026-04-10'], label: 'Pagājušo piektdien', labelNoun: 'Pagājušā piektdiena' },
          {
            dates: ['2026-04-09'],
            label: 'Pagājušo ceturtdien',
            labelNoun: 'Pagājušā ceturtdiena',
          },
          { dates: ['2026-04-08'], label: 'Pagājušo trešdien', labelNoun: 'Pagājušā trešdiena' },
          { dates: ['2026-04-07'], label: 'Pagājušo otrdien', labelNoun: 'Pagājušā otrdiena' },
          { dates: ['2026-04-06'], label: 'Pagājušajā nedēļā', labelNoun: 'Pagājušā nedēļa' },
          { from: '2026-03-30', to: '2026-04-05', label: 'Pirms 2 nedēļām' },
          { from: '2026-03-23', to: '2026-03-29', label: 'Pirms 3 nedēļām' },
          {
            from: '2026-03-01',
            to: '2026-03-22',
            label: 'Pagājušajā mēnesī',
            labelNoun: 'Pagājušais mēnesis',
          },
          { from: '2026-02-01', to: '2026-02-28', label: 'Pirms 2 mēnešiem' },
          { from: '2026-01-01', to: '2026-01-31', label: 'Pirms 3 mēnešiem' },
          { from: '2025-12-01', to: '2025-12-31', label: 'Pirms 4 mēnešiem' },
          { from: '2025-05-01', to: '2025-05-31', label: 'Pirms 11 mēnešiem' },
          {
            from: '2025-01-01',
            to: '2025-04-30',
            label: 'Pagājušajā gadā',
            labelNoun: 'Pagājušais gads',
          },
          { from: '2024-01-01', to: '2024-12-31', label: 'Pirms 2 gadiem' },
          { from: '2023-01-01', to: '2023-12-31', label: 'Pirms 3 gadiem' },
        ]);
      });

      it('if today is 30.04.2026. (Thursday, end of month, future dates)', () => {
        assertRows('2026-04-30', [
          { dates: ['2026-04-30'], label: 'Šodien', labelNoun: 'Šodiena' },
          { dates: ['2026-05-01'], label: 'Rīt', labelNoun: 'Rītdiena' },
          { dates: ['2026-05-02'], label: 'Parīt', labelNoun: 'Parītdiena' },
          { dates: ['2026-05-03'], label: 'Svētdien', labelNoun: 'Svētdiena' },
          { dates: ['2026-05-04'], label: 'Nākamo pirmdien', labelNoun: 'Nākamā pirmdiena' },
          { dates: ['2026-05-05'], label: 'Nākamo otrdien', labelNoun: 'Nākamā otrdiena' },
          { dates: ['2026-05-06'], label: 'Nākamo trešdien', labelNoun: 'Nākamā trešdiena' },
          {
            from: '2026-05-07',
            to: '2026-05-10',
            label: 'Nākamajā nedēļā',
            labelNoun: 'Nākamā nedēļa',
          },
          { from: '2026-05-11', to: '2026-05-17', label: 'Pēc 2 nedēļām' },
          { from: '2026-05-18', to: '2026-05-24', label: 'Pēc 3 nedēļām' },
          {
            from: '2026-05-25',
            to: '2026-05-31',
            label: 'Nākamajā mēnesī',
            labelNoun: 'Nākamais mēnesis',
          },
          { from: '2026-06-01', to: '2026-06-30', label: 'Pēc 2 mēnešiem' },
          { from: '2026-07-01', to: '2026-07-31', label: 'Pēc 3 mēnešiem' },
          { from: '2027-03-01', to: '2027-03-31', label: 'Pēc 11 mēnešiem' },
          {
            from: '2027-04-01',
            to: '2027-12-31',
            label: 'Nākamajā gadā',
            labelNoun: 'Nākamais gads',
          },
          { from: '2028-01-01', to: '2028-12-31', label: 'Pēc 2 gadiem' },
          { from: '2029-01-01', to: '2029-12-31', label: 'Pēc 3 gadiem' },
        ]);
      });

      it('if today is 01.01.2026. (Thursday, start of year, past dates)', () => {
        assertRows('2026-01-01', [
          { dates: ['2026-01-01'], label: 'Šodien', labelNoun: 'Šodiena' },
          { dates: ['2025-12-31'], label: 'Vakar', labelNoun: 'Vakardiena' },
          { dates: ['2025-12-30'], label: 'Aizvakar', labelNoun: 'Aizvakardiena' },
          { dates: ['2025-12-29'], label: 'Pirmdien', labelNoun: 'Pirmdiena' },
          { dates: ['2025-12-28'], label: 'Pagājušo svētdien', labelNoun: 'Pagājušā svētdiena' },
          { dates: ['2025-12-27'], label: 'Pagājušo sestdien', labelNoun: 'Pagājušā sestdiena' },
          { dates: ['2025-12-26'], label: 'Pagājušo piektdien', labelNoun: 'Pagājušā piektdiena' },
          {
            from: '2025-12-22',
            to: '2025-12-25',
            label: 'Pagājušajā nedēļā',
            labelNoun: 'Pagājušā nedēļa',
          },
          { from: '2025-12-15', to: '2025-12-21', label: 'Pirms 2 nedēļām' },
          { from: '2025-12-08', to: '2025-12-14', label: 'Pirms 3 nedēļām' },
          {
            from: '2025-12-01',
            to: '2025-12-07',
            label: 'Pagājušajā mēnesī',
            labelNoun: 'Pagājušais mēnesis',
          },
          { from: '2025-11-01', to: '2025-11-30', label: 'Pirms 2 mēnešiem' },
          { from: '2025-10-01', to: '2025-10-31', label: 'Pirms 3 mēnešiem' },
          { from: '2025-02-01', to: '2025-02-28', label: 'Pirms 11 mēnešiem' },
          {
            from: '2025-01-01',
            to: '2025-01-31',
            label: 'Pagājušajā gadā',
            labelNoun: 'Pagājušais gads',
          },
          { from: '2024-01-01', to: '2024-12-31', label: 'Pirms 2 gadiem' },
          { from: '2023-01-01', to: '2023-12-31', label: 'Pirms 3 gadiem' },
        ]);
      });
    });
  });
});
