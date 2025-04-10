import { vi, describe, it, expect } from 'vitest';
import {
  getDates,
  generateDatesFromRules,
  parseRule,
  generateDatesForFrequency,
  adjustDateToHour,
  isDateWithinRange,
  findNextWeeklyDate,
  advanceToMonthlyDate,
  advanceToYearlyDate,
} from '../../../src/utils/dates.js';
import { parseISO } from 'date-fns';

describe('getDates (no mocks, flexible date format)', () => {
  it.each([
    {
      from: new Date('2025-01-01T00:00'), to: new Date('2025-01-03T00:00'), period: 'yearly',
      expected: [new Date('2025-01-01T00:00')]
    },
    {
      from: new Date('2025-01-01T00:00'), to: new Date('2025-03-01T00:00'), period: 'monthly',
      expected: [
        new Date('2025-01-01T00:00:00'),
        new Date('2025-02-01T00:00:00'),
        new Date('2025-03-01T00:00:00')
      ]
    },
    {
      from: new Date('2025-01-01T00:00'), to: new Date('2025-01-15T00:00'), period: 'weekly',
      expected: [
        new Date('2025-01-01T00:00:00'),
        new Date('2025-01-08T00:00:00'),
        new Date('2025-01-15T00:00:00')
      ]
    },
    {
      from: new Date('2025-01-01T00:00'), to: new Date('2025-01-03T00:00'), period: 'daily',
      expected: [
        new Date('2025-01-01T00:00:00'),
        new Date('2025-01-02T00:00:00'),
        new Date('2025-01-03T00:00:00')]
    },
    {
      from: new Date('2025-01-01T00:00'), to: new Date('2025-01-01T02:00'), period: 'hourly',
      expected: [
        new Date('2025-01-01T00:00:00'),
        new Date('2025-01-01T01:00:00'),
        new Date('2025-01-01T02:00:00')]
    },
    {
      from: new Date('2025-01-02T00:00'), to: new Date('2025-01-01T00:00'), period: 'daily',
      expected: []
    },
  ])('should generate $period dates correctly for basic periods', ({ from, to, period, expected }) => {
    const result = getDates(from, to, period);
    expect(result.map(date => date.toISOString())).toEqual(expected.map(date => date.toISOString()));
  });

  it('should handle "customRules" with a single daily rule', () => {
    const from = new Date('2025-04-01T00:00');
    const to = new Date('2025-04-05T00:00');
    const customConfig = { rules: 'DTSTART:20250401T0000\nRRULE:FREQ=DAILY', Wto: new Date('2025-04-05T00:00') };
    const expected = [
      new Date('2025-04-01T00:00:00'),
      new Date('2025-04-02T00:00:00'),
      new Date('2025-04-03T00:00:00'),
      new Date('2025-04-04T00:00:00'),
      new Date('2025-04-05T00:00:00'),
    ];
    const result = getDates(from, to, 'customRules', customConfig);
    expect(result.map(date => date.toISOString())).toEqual(expected.map(date => date.toISOString()));
  });

  it('should handle "customRules" with multiple weekly rules', () => {
    const from = new Date('2025-04-14T00:00'); // Monday
    const to = new Date('2025-04-28T00:00'); // Monday two weeks later
    const customConfig = { rules: 'DTSTART:20250414T0000\nRRULE:FREQ=WEEKLY;BYDAY=MO,WE', Wto: new Date('2025-04-28T00:00') };
    const expected = [
      new Date('2025-04-16T00:00'),
      new Date('2025-04-21T00:00'),
      new Date('2025-04-23T00:00'),
      new Date('2025-04-28T00:00'),
    ];
    const result = getDates(from, to, 'customRules', customConfig);
    expect(result.map(date => date.toISOString())).toEqual(expected.map(date => date.toISOString()));
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

  it('should return an empty array and log an error for incomplete customRules config', () => {
    const from = new Date();
    const to = new Date();
    const consoleSpy = vi.spyOn(console, 'error');
    const result = getDates(from, to, 'customRules', { rules: 'FREQ=DAILY' });
    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith("Incomplete custom rules configuration: 'rules' and 'Wto' are required.");
    consoleSpy.mockRestore();
  });
});

describe('generateDatesFromRules (no mocks, flexible date format)', () => {
  
  it('should generate dates from a single daily rule', () => {
    const rules = ['DTSTART:20250401T0000\nRRULE:FREQ=DAILY;UNTIL=20250403T0000'];
    const from = new Date('2025-04-01T00:00');
    const to = new Date('2025-04-05T00:00');
    const expected = [
      new Date('2025-04-01T00:00'),
      new Date('2025-04-02T00:00'),
      new Date('2025-04-03T00:00'),
    ];
    const result = generateDatesFromRules(rules, from, to);
    expect(result.map(date => date.toISOString())).toEqual(expected.map(date => date.toISOString()));
  });

  it('should generate dates from a single weekly rule', () => {
    const rules = ['DTSTART:20250414T0000\nRRULE:FREQ=WEEKLY;BYDAY=MO;UNTIL=20250428T0000'];
    const from = new Date('2025-04-10T00:00');
    const to = new Date('2025-04-30T00:00');
    const expected = [
      new Date('2025-04-14T00:00'),
      new Date('2025-04-21T00:00'),
      new Date('2025-04-28T00:00'),
    ];
    const result = generateDatesFromRules(rules, from, to);
    expect(result.map(date => date.toISOString())).toEqual(expected.map(date => date.toISOString()));
  });

  it('should generate and combine dates from multiple rules', () => {
    const rules = [
      'DTSTART:20250401T0000\nRRULE:FREQ=DAILY;UNTIL=20250403T0000',
      'DTSTART:20250414T0000\nRRULE:FREQ=WEEKLY;BYDAY=MO;UNTIL=20250421T0000',
    ];
    const from = new Date('2025-04-01T00:00');
    const to = new Date('2025-04-25T00:00');
    const expected = [
      new Date('2025-04-01T00:00'),
      new Date('2025-04-02T00:00'),
      new Date('2025-04-03T00:00'),
      new Date('2025-04-14T00:00'),
      new Date('2025-04-21T00:00'),
    ];
    const result = generateDatesFromRules(rules, from, to);
    expect(result.map(date => date.toISOString()).sort()).toEqual(expected.map(date => date.toISOString()).sort());
  });

  it('should handle empty rules array', () => {
    const rules = [];
    const from = new Date('2025-04-01T00:00');
    const to = new Date('2025-04-05T00:00');
    const result = generateDatesFromRules(rules, from, to);
    expect(result).toEqual([]);
  });

  it('should ignore rules that parse to null', () => {
    const rules = ['DTSTART:20250401', 'DTSTART:20250405T0000\nRRULE:FREQ=DAILY;UNTIL=20250407T0000'];
    const from = new Date('2025-04-01T00:00');
    const to = new Date('2025-04-10T00:00');
    const expected = [
      new Date('2025-04-05T00:00'),
      new Date('2025-04-06T00:00'),
      new Date('2025-04-07T00:00'),
    ];
    const result = generateDatesFromRules(rules, from, to);
    expect(result.map(date => date.toISOString())).toEqual(expected.map(date => date.toISOString()));
  });
});

describe('parseRule', () => {

  it('should correctly parse a daily rule', () => {
    const rule = 'DTSTART:20250415T100000;RRULE:FREQ=DAILY;INTERVAL=2;UNTIL=20250420T100000Z;BYHOUR=10,12';
    expect(parseRule(rule)).toEqual({
      startDate: new Date('2025-04-15T10:00:00.00'),
      frequency: 'DAILY',
      interval: 2,
      byHour: [10, 12],
      until: '20250420T100000Z',
      byDay: undefined,
      byMonthDay: undefined,
      byMonth: undefined,
    });
  });

  it('should correctly parse a weekly rule with BYDAY', () => {
    const rule = 'DTSTART:20250414T090000;RRULE:FREQ=WEEKLY;BYDAY=MO,WE;INTERVAL=1;UNTIL=20250428T090000Z;BYHOUR=9';
    expect(parseRule(rule)).toEqual({
      startDate: new Date('2025-04-14T09:00:00.00'),
      frequency: 'WEEKLY',
      interval: 1,
      byHour: [9],
      until: '20250428T090000Z',
      byDay: ['MO', 'WE'],
      byMonthDay: undefined,
      byMonth: undefined,
    });
  });

  it('should correctly parse a monthly rule with BYMONTHDAY', () => {
    const rule = 'DTSTART:20250405T110000;RRULE:FREQ=MONTHLY;BYMONTHDAY=5;INTERVAL=3;UNTIL=20250705T110000Z;BYHOUR=11';
    expect(parseRule(rule)).toEqual({
      startDate: new Date('2025-04-05T11:00:00.00'),
      frequency: 'MONTHLY',
      interval: 3,
      byHour: [11],
      until: '20250705T110000Z',
      byDay: undefined,
      byMonthDay: 5,
      byMonth: undefined,
    });
  });

  it('should correctly parse a yearly rule with BYMONTH and BYMONTHDAY', () => {
    const rule = 'DTSTART:20250115T130000;RRULE:FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=15;INTERVAL=2;UNTIL=20290115T130000Z;BYHOUR=13';
    expect(parseRule(rule)).toEqual({
      startDate: new Date('2025-01-15T13:00:00.00'),
      frequency: 'YEARLY',
      interval: 2,
      byHour: [13],
      until: '20290115T130000Z',
      byDay: undefined,
      byMonthDay: 15,
      byMonth: 0,
    });
  });

  it('should handle missing optional parameters', () => {
    const rule = 'DTSTART:20250416T140000;RRULE:FREQ=DAILY';
    expect(parseRule(rule)).toEqual({
      startDate: new Date('2025-04-16T14:00:00.00'),
      frequency: 'DAILY',
      interval: 1,
      byHour: [0],
      until: undefined,
      byDay: undefined,
      byMonthDay: undefined,
      byMonth: undefined,
    });
  });

  it('should return null for a rule without DTSTART', () => {
    const rule = 'RRULE:FREQ=DAILY';
    expect(parseRule(rule)).toBeNull();
  });

  it('should return null for a rule without RRULE', () => {
    const rule = 'DTSTART:20250416T150000';
    expect(parseRule(rule)).toBeNull();
  });
});

describe('generateDatesForFrequency', () => {

  it('should generate correct daily dates with interval 1 and byHour', () => {
    const ruleData = {
      startDate: parseISO('2025-04-15T09:00:00'),
      frequency: 'DAILY',
      interval: 1,
      byHour: [10, 12],
    };
    const from = parseISO('2025-04-15T00:00:00');
    const to = parseISO('2025-04-16T00:00:00');
    const result = generateDatesForFrequency(ruleData, from, to);
    expect(result).toEqual([
      parseISO('2025-04-15T10:00:00'),
      parseISO('2025-04-15T12:00:00'),
      parseISO('2025-04-16T10:00:00'),
      parseISO('2025-04-16T12:00:00'),
    ]);
  });

  it('should generate correct daily dates with interval 2', () => {
    const ruleData = {
      startDate: parseISO('2025-04-15T10:00:00'),
      frequency: 'DAILY',
      interval: 2,
      byHour: [10],
    };
    const from = parseISO('2025-04-15T00:00:00');
    const to = parseISO('2025-04-19T00:00:00');
    const result = generateDatesForFrequency(ruleData, from, to);
    expect(result).toEqual([
      parseISO('2025-04-15T10:00:00'),
      parseISO('2025-04-17T10:00:00'),
      parseISO('2025-04-19T10:00:00'),
    ]);
  });

  it('should generate correct weekly dates with BYDAY', () => {
    const ruleData = {
      startDate: parseISO('2025-04-14T09:00:00'), // Monday
      frequency: 'WEEKLY',
      byDay: ['WE'],
      interval: 1,
      byHour: [9],
    };
    const from = parseISO('2025-04-14T00:00:00');
    const to = parseISO('2025-04-28T00:00:00');
    const result = generateDatesForFrequency(ruleData, from, to);
    expect(result).toEqual([
      parseISO('2025-04-16T09:00:00'), // Wednesday
      parseISO('2025-04-23T09:00:00'), // Wednesday
    ]);
  });

  it('should generate correct weekly dates with multiple BYDAYs', () => {
    const ruleData = {
      startDate: parseISO('2025-04-15T10:00:00'), // Tuesday
      frequency: 'WEEKLY',
      byDay: ['TH', 'SA'],
      interval: 1,
      byHour: [10],
    };
    const from = parseISO('2025-04-15T00:00:00');
    const to = parseISO('2025-04-29T00:00:00');
    const result = generateDatesForFrequency(ruleData, from, to);
    expect(result).toEqual([
      parseISO('2025-04-17T10:00:00'), // Thursday
      parseISO('2025-04-19T10:00:00'), // Saturday
      parseISO('2025-04-24T10:00:00'), // Thursday
      parseISO('2025-04-26T10:00:00'), // Saturday
    ]);
  });

  it('should generate correct monthly dates with BYMONTHDAY', () => {
    const ruleData = {
      startDate: parseISO('2025-04-05T11:00:00'),
      frequency: 'MONTHLY',
      byMonthDay: 5,
      interval: 1,
      byHour: [11],
    };
    const from = parseISO('2025-04-01T00:00:00');
    const to = parseISO('2025-06-10T00:00:00');
    const result = generateDatesForFrequency(ruleData, from, to);
    expect(result).toEqual([
      parseISO('2025-04-05T11:00:00'),
      parseISO('2025-05-05T11:00:00'),
      parseISO('2025-06-05T11:00:00'),
    ]);
  });

  it('should handle monthly dates where BYMONTHDAY is greater than the number of days in the month', () => {
    const ruleData = {
      startDate: parseISO('2025-01-31T10:00:00'),
      frequency: 'MONTHLY',
      byMonthDay: 31,
      interval: 1,
      byHour: [10],
    };
    const from = parseISO('2025-01-01T00:00:00');
    const to = parseISO('2025-03-31T00:00:00');
    const result = generateDatesForFrequency(ruleData, from, to);
    expect(result).toEqual([
      parseISO('2025-01-31T10:00:00'),
      parseISO('2025-02-28T10:00:00'),
      parseISO('2025-03-31T10:00:00'),
    ]);
  });

  it('should generate correct yearly dates with BYMONTH and BYMONTHDAY', () => {
    const ruleData = {
      startDate: parseISO('2025-01-15T13:00:00'),
      frequency: 'YEARLY',
      byMonth: 1,
      byMonthDay: 15,
      interval: 1,
      byHour: [13],
    };
    const from = parseISO('2025-01-01T00:00:00');
    const to = parseISO('2028-01-15T14:00:00');
    const result = generateDatesForFrequency(ruleData, from, to);
    expect(result).toEqual([
      parseISO('2025-01-15T13:00:00'),
      parseISO('2026-01-15T13:00:00'),
      parseISO('2027-01-15T13:00:00'),
      parseISO('2028-01-15T13:00:00'),
    ]);
  });

  it('should respect the until date in ruleData', () => {
    const ruleData = {
      startDate: parseISO('2025-04-15T10:00:00'),
      frequency: 'DAILY',
      interval: 1,
      until: '20250417T120000Z',
      byHour: [10],
    };
    const from = parseISO('2025-04-14T00:00:00');
    const to = parseISO('2025-04-20T00:00:00');
    const result = generateDatesForFrequency(ruleData, from, to);
    expect(result).toEqual([
      parseISO('2025-04-15T10:00:00'),
      parseISO('2025-04-16T10:00:00'),
      parseISO('2025-04-17T10:00:00'),
    ]);
  });

  it('should use hour 0 if byHour is not provided', () => {
    const ruleData = {
      startDate: parseISO('2025-04-16T09:00:00'),
      frequency: 'DAILY',
      interval: 1,
    };
    const from = parseISO('2025-04-16T00:00:00');
    const to = parseISO('2025-04-16T23:00:00');
    const result = generateDatesForFrequency(ruleData, from, to);
    expect(result).toEqual([parseISO('2025-04-16T00:00:00')]);
  });

  it('should log a warning and return empty array for unsupported frequency', () => {
    const ruleData = {
      startDate: new Date(),
      frequency: 'BIWEEKLY',
    };
    const from = new Date();
    const to = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const consoleSpy = vi.spyOn(console, 'warn');
    const result = generateDatesForFrequency(ruleData, from, to);
    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith('Unsupported frequency or missing parameters: BIWEEKLY');
    consoleSpy.mockRestore();
  });
});

describe('adjustDateToHour', () => {

  it('should set the correct hour and zero seconds', () => {
    const date = new Date(2025, 3, 16, 9, 30, 45);
    const hour = 11;
    const expected = new Date(2025, 3, 16, 11, 30, 0);
    expect(adjustDateToHour(date, hour)).toEqual(expected);
  });

  it('should handle different hours', () => {
    const date = new Date(2025, 3, 17, 15, 10, 20);
    expect(adjustDateToHour(date, 0)).toEqual(new Date(2025, 3, 17, 0, 10, 0));
    expect(adjustDateToHour(date, 23)).toEqual(new Date(2025, 3, 17, 23, 10, 0));
  });

  it('should not change the date part', () => {
    const date = new Date(2025, 5, 1, 8, 0, 0);
    expect(adjustDateToHour(date, 18).getDate()).toBe(1);
    expect(adjustDateToHour(date, 18).getMonth()).toBe(5);
    expect(adjustDateToHour(date, 18).getFullYear()).toBe(2025);
  });
});

describe('isDateWithinRange', () => {

  const from = parseISO('2025-04-15T00:00:00');
  const to = parseISO('2025-04-17T23:59:59');
  const middle = parseISO('2025-04-16T12:00:00');
  const before = parseISO('2025-04-14T23:59:59');
  const after = parseISO('2025-04-18T00:00:00');
  const sameAsFrom = parseISO('2025-04-15T00:00:00');
  const sameAsTo = parseISO('2025-04-17T23:59:59');

  it('should return true if the date is within the range', () => {
    expect(isDateWithinRange(middle, from, to)).toBe(true);
  });

  it('should return true if the date is the same as the from date', () => {
    expect(isDateWithinRange(sameAsFrom, from, to)).toBe(true);
  });

  it('should return true if the date is the same as the to date', () => {
    expect(isDateWithinRange(sameAsTo, from, to)).toBe(true);
  });

  it('should return false if the date is before the range', () => {
    expect(isDateWithinRange(before, from, to)).toBe(false);
  });

  it('should return false if the date is after the range', () => {
    expect(isDateWithinRange(after, from, to)).toBe(false);
  });

  it('should handle cases where from and to are the same date', () => {
    const same = parseISO('2025-04-16T00:00:00');
    expect(isDateWithinRange(same, same, same)).toBe(true);
    expect(isDateWithinRange(parseISO('2025-04-15T00:00:00'), same, same)).toBe(false);
    expect(isDateWithinRange(parseISO('2025-04-17T00:00:00'), same, same)).toBe(false);
  });
});

describe('findNextWeeklyDate', () => {

  it('should find the next specified day of the week', () => {
    const currentDate = parseISO('2025-04-16T12:00:00'); // Wednesday
    const byDay = ['SA'];
    expect(findNextWeeklyDate(currentDate, byDay, 1)).toEqual(parseISO('2025-04-19T12:00:00')); // Next Saturday
  });

  it('should find the next specified day of the week when it occurs later in the current week', () => {
    const currentDate = parseISO('2025-04-14T09:00:00'); // Monday
    const byDay = ['WE'];
    expect(findNextWeeklyDate(currentDate, byDay, 1)).toEqual(parseISO('2025-04-16T09:00:00')); // Next Wednesday
  });

  it('should handle multiple BYDAYs', () => {
    const currentDate = parseISO('2025-04-15T10:00:00'); // Tuesday
    const byDay = ['TH', 'SA'];
    expect(findNextWeeklyDate(currentDate, byDay, 1)).toEqual(parseISO('2025-04-17T10:00:00')); // Next Thursday
  });

  it('should handle interval greater than 1', () => {
    const currentDate = parseISO('2025-04-14T11:00:00'); // Monday
    const byDay = ['MO'];
    expect(findNextWeeklyDate(currentDate, byDay, 2)).toEqual(parseISO('2025-04-28T11:00:00')); // Monday in two weeks
  });

  it('should return the date in the next week if the specified day is the same as the current day', () => {
    const currentDate = parseISO('2025-04-14T15:00:00'); // Monday
    const byDay = ['MO'];
    expect(findNextWeeklyDate(currentDate, byDay, 1)).toEqual(parseISO('2025-04-21T15:00:00')); // Monday next week
  });

  it('should handle BYDAYs that appear earlier in the week than the current day', () => {
    const currentDate = parseISO('2025-04-18T08:00:00'); // Friday
    const byDay = ['TU'];
    expect(findNextWeeklyDate(currentDate, byDay, 1)).toEqual(parseISO('2025-04-22T08:00:00')); // Tuesday next week
  });
});

describe('advanceToMonthlyDate', () => {

  it('should advance to the same day of the next month', () => {
    const currentDate = parseISO('2025-04-10T10:00:00');
    expect(advanceToMonthlyDate(currentDate, 10, 1)).toEqual(parseISO('2025-05-10T10:00:00'));
  });

  it('should handle the end of the month (going to a shorter month)', () => {
    const currentDate = parseISO('2025-01-31T12:00:00');
    expect(advanceToMonthlyDate(currentDate, 31, 1)).toEqual(parseISO('2025-02-28T12:00:00'));
  });

  it('should handle the end of the month (staying within the same length or going to a longer month)', () => {
    const currentDate = parseISO('2025-03-30T09:00:00');
    expect(advanceToMonthlyDate(currentDate, 30, 1)).toEqual(parseISO('2025-04-30T09:00:00'));
    const currentDateFeb = parseISO('2025-02-28T18:00:00');
    expect(advanceToMonthlyDate(currentDateFeb, 28, 1)).toEqual(parseISO('2025-03-28T18:00:00'));
  });

  it('should handle interval greater than 1', () => {
    const currentDate = parseISO('2025-04-05T14:00:00');
    expect(advanceToMonthlyDate(currentDate, 5, 3)).toEqual(parseISO('2025-07-05T14:00:00'));
  });

  it('should handle cases where byMonthDay is in the past of the current month', () => {
    const currentDate = parseISO('2025-04-15T07:00:00');
    expect(advanceToMonthlyDate(currentDate, 10, 1)).toEqual(parseISO('2025-05-10T07:00:00'));
  });
});

describe('advanceToYearlyDate', () => {
  it('should advance to the same month and day of the next year', () => {
    const currentDate = parseISO('2025-04-15T11:00:00');
    expect(advanceToYearlyDate(currentDate, 4, 15, 1)).toEqual(parseISO('2026-04-15T11:00:00'));
  });

  it('should handle leap years when advancing from February 29th', () => {
    const currentDate = parseISO('2024-02-29T20:00:00');
    expect(advanceToYearlyDate(currentDate, 2, 29, 1)).toEqual(parseISO('2025-02-28T20:00:00'));
    expect(advanceToYearlyDate(currentDate, 2, 29, 4)).toEqual(parseISO('2028-02-29T20:00:00'));
  });

  it('should handle interval greater than 1', () => {
    const currentDate = parseISO('2025-06-20T16:00:00');
    expect(advanceToYearlyDate(currentDate, 6, 20, 2)).toEqual(parseISO('2027-06-20T16:00:00'));
  });

  it('should handle cases where byMonth and byMonthDay are in the past of the current year', () => {
    const currentDate = parseISO('2025-10-01T09:00:00');
    expect(advanceToYearlyDate(currentDate, 4, 15, 1)).toEqual(parseISO('2026-04-15T09:00:00'));
  });

  it('should handle advancing to February 29th on a leap year', () => {
    const currentDate = parseISO('2027-01-15T12:00:00');
    expect(advanceToYearlyDate(currentDate, 2, 29, 1)).toEqual(parseISO('2028-02-29T12:00:00'));
  });
});
