import { describe, it, expect } from 'vitest';
import { parseIsoDate } from './date-utils';

describe('parseIsoDate', () => {
  describe('Date instance handling', () => {
    it('should normalize Date instances with non-zero timestamps to midnight (00:00:00.000)', () => {
      const input = new Date(2026, 9, 17, 14, 35, 42, 512);
      const result = parseIsoDate(input);

      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(9);
      expect(result.getDate()).toBe(17);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should not mutate the original Date instance', () => {
      const input = new Date(2026, 5, 20, 18, 45, 12, 300);
      const originalTime = input.getTime();
      const result = parseIsoDate(input);

      expect(result).not.toBe(input);
      expect(input.getTime()).toBe(originalTime);
      expect(input.getHours()).toBe(18);
    });

    it('should preserve a Date instance that is already set to midnight', () => {
      const input = new Date(2026, 3, 10, 0, 0, 0, 0);
      const result = parseIsoDate(input);

      expect(result.getTime()).toBe(input.getTime());
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });
  });

  describe('string date parsing (YYYY-MM-DD)', () => {
    it('should parse YYYY-MM-DD string to local midnight Date', () => {
      const result = parseIsoDate('2026-10-17');

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(9); // 0-indexed October
      expect(result.getDate()).toBe(17);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should parse dates with leading zeros in month and day correctly', () => {
      const result = parseIsoDate('2026-01-05');

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(5);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });
  });

  describe('ISO string parsing with time components', () => {
    it('should parse ISO strings with time components (T...) to local midnight', () => {
      const result = parseIsoDate('2026-10-17T14:30:00.000Z');

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(9);
      expect(result.getDate()).toBe(17);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should parse ISO strings with timezone offsets to local midnight', () => {
      const resultPlus = parseIsoDate('2026-07-22T08:00:00+02:00');
      expect(resultPlus.getFullYear()).toBe(2026);
      expect(resultPlus.getMonth()).toBe(6);
      expect(resultPlus.getDate()).toBe(22);
      expect(resultPlus.getHours()).toBe(0);
      expect(resultPlus.getMinutes()).toBe(0);
      expect(resultPlus.getSeconds()).toBe(0);
      expect(resultPlus.getMilliseconds()).toBe(0);

      const resultMinus = parseIsoDate('2026-11-05T20:00:00-05:00');
      expect(resultMinus.getFullYear()).toBe(2026);
      expect(resultMinus.getMonth()).toBe(10);
      expect(resultMinus.getDate()).toBe(5);
      expect(resultMinus.getHours()).toBe(0);
      expect(resultMinus.getMinutes()).toBe(0);
      expect(resultMinus.getSeconds()).toBe(0);
      expect(resultMinus.getMilliseconds()).toBe(0);
    });
  });

  describe('boundary conditions and calendar edge cases', () => {
    it('should correctly parse leap day (2024-02-29)', () => {
      const result = parseIsoDate('2024-02-29');

      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(29);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should correctly parse non-leap February end (2026-02-28)', () => {
      const result = parseIsoDate('2026-02-28');

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(1);
      expect(result.getDate()).toBe(28);
      expect(result.getHours()).toBe(0);
    });

    it('should correctly parse month boundary transition (2026-03-01)', () => {
      const result = parseIsoDate('2026-03-01');

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(2);
      expect(result.getDate()).toBe(1);
      expect(result.getHours()).toBe(0);
    });

    it('should correctly parse year-end boundary (2026-12-31)', () => {
      const result = parseIsoDate('2026-12-31');

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(11);
      expect(result.getDate()).toBe(31);
      expect(result.getHours()).toBe(0);
    });

    it('should correctly parse new-year boundary (2027-01-01)', () => {
      const result = parseIsoDate('2027-01-01');

      expect(result.getFullYear()).toBe(2027);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(1);
      expect(result.getHours()).toBe(0);
    });
  });
});
