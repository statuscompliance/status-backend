import { vi, describe, it, expect } from 'vitest';
import { getDates } from '../../../src/utils/dates.js';
import { parseISO } from 'date-fns';

describe('getDates', () => {
  
  describe('Testing getDates per period.', () => {
    it.each([
      { from: new Date('2020-01-01'), to: new Date('2020-01-03'), period: 'yearly', expected: [new Date('2020-01-01')] },
      { from: new Date('2023-01-01'), to: new Date('2023-03-01'), period: 'monthly', expected: [new Date('2023-01-01'), new Date('2023-02-01'), new Date('2023-03-01')] },
      { from: new Date('2023-01-01'), to: new Date('2023-01-15'), period: 'weekly', expected: [new Date('2023-01-01'), new Date('2023-01-08'), new Date('2023-01-15')] },
      { from: new Date('2023-01-01'), to: new Date('2023-01-03'), period: 'daily', expected: [new Date('2023-01-01'), new Date('2023-01-02'), new Date('2023-01-03')] },
      { from: new Date('2023-01-01T00:00:00'), to: new Date('2023-01-01T02:00:00'), period: 'hourly', expected: [new Date('2023-01-01T00:00:00'), new Date('2023-01-01T01:00:00'), new Date('2023-01-01T02:00:00')] },
      { from: new Date('2023-01-02'), to: new Date('2023-01-01'), period: 'daily', expected: [] }, // Test when from > to
    ])('should generate $period dates correctly', ({ from, to, period, expected }) => {
      const result = getDates(from, to, period);
      expect(result).toEqual(expected);
    });

    it('should return an empty array and log an error for an invalid period type', () => {
      const from = new Date();
      const to = new Date();
      const consoleSpy = vi.spyOn(console, 'error');
      const result = getDates(from, to, 'invalid');
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Invalid period type: invalid');
      consoleSpy.mockRestore();
    });
  });

  describe('Testing getDates for invalid date inputs', () => {
    it.each([
      { from: new Date('invalid date'), to: new Date('2025-04-10'), period: 'daily', errorMsg: 'Invalid \'from\' date provided.' },
      { from: new Date('2025-04-09'), to: new Date('not a date'), period: 'weekly', errorMsg: 'Invalid \'to\' date provided.' },
    ])('should return an empty array and log an error for an invalid $', ({ from, to, period, errorMsg }) => {
      const consoleSpy = vi.spyOn(console, 'error');
      const result = getDates(from, to, period);
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(errorMsg);
      consoleSpy.mockRestore();
    });
  });

  describe('Testing getDates with custom rules', () => {
    
    it.each([
      { customConfig: { Wto: new Date() }, errorMsg: "Incomplete custom rules configuration: 'rules' and 'Wto' are required." },
      { customConfig: { rules: 'FREQ=DAILY' }, errorMsg: "Incomplete custom rules configuration: 'rules' and 'Wto' are required." },
      { customConfig: { rules: 'DTSTART:20250409T100000\nRRULE:FREQ=DAILY', Wto: new Date('not a valid date') }, errorArgs: ['Error generating dates with custom rules:', RangeError] },
      { customConfig: { rules: 'RRULE:FREQ=DAILY;BYHOUR=10', Wto: parseISO('2025-04-06T00:00:00') }, expected: [] }, // Missing DTSTART
      { customConfig: { rules: 'DTSTART:20250401T100000', Wto: parseISO('2025-04-06T00:00:00') }, expected: [] }, // Missing RRULE
      { customConfig: { rules: '', Wto: parseISO('2025-04-10T00:00:00') }, expected: [] }, // Empty rules
      { customConfig: { rules: 'DTSTART:20200101T100000\nRRULE:FREQ=DAILY;INTERVAL=2;BYHOUR=10', Wto: parseISO('2020-01-10T22:00:00') }, 
        expected: [] },
      { customConfig: { rules: 'DTSTART:20250401T100000\nRRULE:FREQ=DAILY;BYHOUR=10', Wto: parseISO('2025-04-06T00:00:00') }, 
        expected: [
          new Date('2025-04-01T10:00:00'), 
          new Date('2025-04-02T10:00:00'), 
          new Date('2025-04-03T10:00:00'), 
          new Date('2025-04-04T10:00:00'), 
          new Date('2025-04-05T10:00:00'), 
          new Date('2025-04-06T10:00:00')] },
      { customConfig: { rules: 'DTSTART:20250402T090000\nRRULE:FREQ=WEEKLY;BYDAY=TH;BYHOUR=9', Wto: parseISO('2025-04-25T00:00:00') }, 
        expected: [
          new Date('2025-04-02T09:00:00'), 
          new Date('2025-04-10T09:00:00'), 
          new Date('2025-04-17T09:00:00')] },
    ])('should handle custom rules correctly', ({ customConfig, expected, errorMsg, errorArgs }) => {
      const from = parseISO('2025-04-01T00:00:00');
      const to = parseISO('2025-04-20T00:00:00');
      const consoleSpy = vi.spyOn(console, 'error');
      const result = getDates(from, to, 'customRules', customConfig);
      if (errorMsg) {
        expect(result).toEqual([]);
        expect(consoleSpy).toHaveBeenCalledWith(errorMsg);
      } else if (errorArgs) {
        expect(result).toEqual([]);
        expect(consoleSpy).toHaveBeenCalledWith(errorArgs[0], expect.any(errorArgs[1]));
      } else {
        expect(result).toEqual(expected);
      }
      consoleSpy.mockRestore();
    });
  });

});
