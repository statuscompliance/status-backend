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
  advanceToYearlyDate
} from '../../../src/utils/dates.js';
import { addYears, addMonths, addWeeks, addDays, setHours, setMinutes, setSeconds, setMilliseconds, startOfWeek } from 'date-fns';

const setTimeToZero = (date) => setMilliseconds(setSeconds(setMinutes(setHours(new Date(date), 0), 0), 0), 0);
const setTimeToHour = (date, hour) => setMilliseconds(setSeconds(setMinutes(setHours(new Date(date), hour), 0), 0), 0);

let today = new Date();
let tomorrow = addDays(today, 1);

today = setTimeToZero(today);
//Csutom Hours
let todayAt00 = setTimeToHour(today, 0);
let todayAt01 = setTimeToHour(today, 1);
let todayAt02 = setTimeToHour(today, 2);
let todayAt09 = setTimeToHour(today, 9);
let todayAt10 = setTimeToHour(today, 10)
let todayAt23 = setTimeToHour(today, 23);
let tomorrowAt10 = setTimeToHour(addDays(today, 1), 10);
let tomorrowAt00 = setTimeToHour(addDays(today, 1), 0);
let twoDaysFromNowAt00 = setTimeToHour(addDays(today, 2), 0);
let fourDaysFromNowAt00 = setTimeToHour(addDays(today, 4), 0)



const formatToRRuleUntil = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
};

describe('Simple getDates Tests', () => {

  it.each([
    { period: 'daily', from: today, to: addDays(today, 2), expected: [today, addDays(today, 1), addDays(today, 2)] },
    { period: 'weekly', from: today, to: addWeeks(today, 2), expected: [today, addWeeks(today, 1), addWeeks(today, 2)] },
    { period: 'monthly', from: today, to: addMonths(today, 2), expected: [today, addMonths(today, 1), addMonths(today, 2)] },
    { period: 'yearly', from: today, to: addYears(today, 2), expected: [today, addYears(today, 1), addYears(today, 2)] },
    { period: 'hourly', from: todayAt00, to: todayAt02, expected: [todayAt00, todayAt01, todayAt02] },
  ])('should generate $period dates correctly', ({ from, to, period, expected }) => {
    const result = getDates(from, to, period);
    expect(result.map(date => date.toISOString())).toEqual(expected.map(date => date.toISOString()));
  });

  it('should return empty array when from date is after to date', () => {
    const from = tomorrow;
    const to = today;
    const expected = [];
    const result = getDates(from, to, 'daily');
    expect(result).toEqual(expected);
  });

  it.each([
    { from: new Date('invalid date'), to: today, period: 'daily', expectedMessage: "Invalid 'from' date provided." },
    { from: today, to: new Date('invalid date'), period: 'daily', expectedMessage: "Invalid 'to' date provided." },
    { from: today, to: tomorrow, period: 'invalid-period', expectedMessage: 'Invalid period type: invalid-period' },
    {
      from: today,
      to: tomorrow,
      period: 'customRules',
      config: { Wto: tomorrow },
      expectedMessage: "Incomplete custom rules configuration: 'rules' and 'Wto' are required.",
    },
    {
      from: today,
      to: tomorrow,
      period: 'customRules',
      config: { rules: 'FREQ=DAILY' },
      expectedMessage: "Incomplete custom rules configuration: 'rules' and 'Wto' are required.",
    },
  ])('should handle invalid inputs correctly - $expectedMessage', ({ from, to, period, expectedMessage, config }) => {
    const consoleSpy = vi.spyOn(console, 'error');
    const result = getDates(from, to, period, config);
    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(expectedMessage);
    consoleSpy.mockRestore();
  });
});

describe('Simple generateDatesFromRules Tests', () => {

  it.each([
    {
      description: 'single simple daily rule',
      rules: [`DTSTART:${formatToRRuleUntil(todayAt00)}\nRRULE:FREQ=DAILY;UNTIL=${formatToRRuleUntil(twoDaysFromNowAt00)}`],
      from: todayAt00,
      to: twoDaysFromNowAt00,
      expected: [todayAt00, tomorrowAt00, twoDaysFromNowAt00],
    },
    {
      description: 'empty rules array',
      rules: [],
      from: todayAt00,
      to: tomorrowAt00,
      expected: [],
    },
    {
      description: 'ignore unparseable rules',
      rules: [
        'INVALID RULE STRING',
        `DTSTART:${formatToRRuleUntil(todayAt00)}\nRRULE:FREQ=DAILY;UNTIL=${formatToRRuleUntil(tomorrowAt00)}`,
      ],
      from: todayAt00,
      to: twoDaysFromNowAt00,
      expected: [todayAt00, tomorrowAt00],
    },
  ])('should handle $description correctly', ({ rules, from, to, expected }) => {
    const result = generateDatesFromRules(rules, from, to);
    expect(result.map(date => date.toISOString())).toEqual(expected.map(date => date.toISOString()));
  });
});

describe('Simple generateDatesForFrequency Tests', () => {

  it('should generate daily dates with byHour', () => {
    const ruleData = { startDate: todayAt10, frequency: 'DAILY', interval: 1, byHour: [10] };
    const from = todayAt10;
    const to = tomorrowAt10;
    const expected = [todayAt10, tomorrowAt10];
    const result = generateDatesForFrequency(ruleData, from, to);
    expect(result.map(date => date.toISOString())).toEqual(expected.map(date => date.toISOString()));
  });

  it('should generate daily dates with interval of 2 days', () => {
    const ruleData = { startDate: todayAt00, frequency: 'DAILY', interval: 2, byHour: [0] };
    const from = todayAt00;
    const to = fourDaysFromNowAt00;
    const expected = [todayAt00, twoDaysFromNowAt00, fourDaysFromNowAt00];
    const result = generateDatesForFrequency(ruleData, from, to);
    expect(result.map(date => date.toISOString())).toEqual(expected.map(date => date.toISOString()));
  });

  it('should respect the until date in ruleData', () => {
    const ruleData = { startDate: todayAt10, frequency: 'DAILY', interval: 1, until: formatToRRuleUntil(tomorrowAt10), byHour: [10] };
    const from = addDays(todayAt00, -1); // Range starts before rule
    const to = addDays(todayAt00, 5); // Range ends after until date
    const expected = [todayAt10, tomorrowAt10]; // Should stop at tomorrowAt10
    const result = generateDatesForFrequency(ruleData, from, to);
    expect(result.map(date => date.toISOString())).toEqual(expected.map(date => date.toISOString()));
  });

  it('should use hour 0 if byHour is not provided', () => {
    const ruleData = { startDate: todayAt09, frequency: 'DAILY', interval: 1 }; // No byHour
    const from = todayAt00;
    const to = todayAt23; // Range for the current day
    const expected = [todayAt00]; // Expect only the start of the day
    const result = generateDatesForFrequency(ruleData, from, to);
    expect(result.map(date => date.toISOString())).toEqual(expected.map(date => date.toISOString()));
  });

  it('should handle unsupported frequency', () => {
    const consoleSpy = vi.spyOn(console, 'warn');
    const ruleData = { startDate: new Date(), frequency: 'BIWEEKLY' };
    const from = new Date();
    const to = addDays(new Date(), 14);
    const expected = [];
    const result = generateDatesForFrequency(ruleData, from, to);
    expect(result).toEqual(expected);
    expect(consoleSpy).toHaveBeenCalledWith('Unsupported frequency or missing parameters: BIWEEKLY');
    consoleSpy.mockRestore();
  });
});

describe('parseRule Tests', () => {

  it.each([
    {
      description: 'simple daily rule',
      ruleString: `DTSTART:${formatToRRuleUntil(today)}\nRRULE:FREQ=DAILY;INTERVAL=2;BYHOUR=10,14;UNTIL=${formatToRRuleUntil(addWeeks(today, 1))}`,
      expected: {
        startDate: today,
        frequency: 'DAILY',
        interval: 2,
        byHour: [10, 14],
        until: formatToRRuleUntil(addWeeks(today, 1)),
        byDay: undefined,
        byMonthDay: undefined,
        byMonth: undefined,
      },
    },
    {
      description: 'simple weekly rule',
      ruleString: `DTSTART:${formatToRRuleUntil(today)}\nRRULE:FREQ=WEEKLY;BYDAY=MO,WE`,
      expected: {
        startDate: today,
        frequency: 'WEEKLY',
        interval: 1,
        byHour: [0],
        until: undefined,
        byDay: ['MO', 'WE'],
        byMonthDay: undefined,
        byMonth: undefined,
      },
    },
    {
      description: 'simple monthly rule',
      ruleString: `DTSTART:${formatToRRuleUntil(today)}\nRRULE:FREQ=MONTHLY;BYMONTHDAY=15`,
      expected: {
        startDate: today,
        frequency: 'MONTHLY',
        interval: 1,
        byHour: [0],
        until: undefined,
        byDay: undefined,
        byMonthDay: 15,
        byMonth: undefined,
      },
    },
    {
      description: 'simple yearly rule',
      ruleString: `DTSTART:${formatToRRuleUntil(today)}\nRRULE:FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1`,
      expected: {
        startDate: today,
        frequency: 'YEARLY',
        interval: 1,
        byHour: [0],
        until: undefined,
        byDay: undefined,
        byMonthDay: 1,
        byMonth: 0,
      },
    },
    {
      description: 'rule with only mandatory parts',
      ruleString: `DTSTART:${formatToRRuleUntil(today)}\nRRULE:FREQ=DAILY`,
      expected: {
        startDate: today,
        frequency: 'DAILY',
        interval: 1,
        byHour: [0],
        until: undefined,
        byDay: undefined,
        byMonthDay: undefined,
        byMonth: undefined,
      },
    },
  ])('should parse a $description correctly', ({ ruleString, expected }) => {
    const result = parseRule(ruleString);
    expect(formatToRRuleUntil(result.startDate)).toEqual(formatToRRuleUntil(expected.startDate));
    expect({ ...result, startDate: undefined }).toEqual({ ...expected, startDate: undefined });
  });

  it.each([
    { description: 'missing DTSTART', ruleString: 'RRULE:FREQ=DAILY', expected: null },
    { description: 'missing RRULE', ruleString: 'DTSTART:20250101T100000', expected: null },
  ])('should return null for a rule string $description', ({ ruleString, expected }) => {
    const result = parseRule(ruleString);
    expect(result).toBe(expected);
  });
});

//Other tests for coverage
describe('adjustDateToHour Tests', () => {
  it.each([
    {
      description: 'set the hour to 10',
      initialDate: today,
      hourToSet: 10,
      expectedDate: todayAt10,
    },
    {
      description: 'set the hour to 0',
      initialDate: today,
      hourToSet: 0,
      expectedDate: todayAt00,
    },
    {
      description: 'set the hour to 23',
      initialDate: today,
      hourToSet: 23,
      expectedDate: todayAt23,
    },
  ])('should $description, clearing minutes, seconds, and milliseconds', ({ initialDate, hourToSet, expectedDate }) => {
    const result = adjustDateToHour(initialDate, hourToSet);
    expect(result.toISOString()).toEqual(expectedDate.toISOString());
  });
});

describe('isDateWithinRange Tests', () => {

  it.each([
    { date: addDays(today, 1), from: today, to: addDays(today, 2), expected: true, description: 'date within interval' },
    { date: today, from: today, to: addDays(today, 2), expected: true, description: 'date is start date' },
    { date: addDays(today, 2), from: today, to: addDays(today, 2), expected: true, description: 'date is end date' },
    { date: addDays(today, -1), from: today, to: addDays(today, 2), expected: false, description: 'date before start date' },
    { date: addDays(today, 3), from: today, to: addDays(today, 2), expected: false, description: 'date after end date' },
    { date: setTimeToHour(todayAt00, 12), from: todayAt00, to: tomorrowAt00, expected: true, description: 'date with different time within range' },
    { date: setTimeToHour(addWeeks(today, 1), 12), from: todayAt00, to: tomorrowAt00, expected: false, description: 'date with different time outside range' },
    { date: setTimeToHour(todayAt00, 23), from: todayAt00, to: tomorrowAt00, expected: true, description: 'date with different time at the end of range' },
  ])('should return $expected if $description', ({ date, from, to, expected }) => {
    expect(isDateWithinRange(date, from, to)).toBe(expected);
  });
});

describe('findNextWeeklyDate Tests', () => {
  const today = new Date();

  it.each([
    {
      description: 'same week',
      startDate: startOfWeek(today, { weekStartsOn: 1 }), // Monday of current week
      byDay: 'WE',
      interval: 1,
      expected: addDays(startOfWeek(today, { weekStartsOn: 1 }), 2), // Wednesday of current week
    },
    {
      description: 'next week',
      startDate: addDays(startOfWeek(today, { weekStartsOn: 1 }), 3), // Thursday of current week
      byDay: 'MO',
      interval: 1,
      expected: addWeeks(startOfWeek(today, { weekStartsOn: 1 }), 1), // Monday of next week
    },
    {
      description: 'current day matches BYDAY with interval 1',
      startDate: startOfWeek(today, { weekStartsOn: 1 }), // Monday of current week
      byDay: 'MO',
      interval: 1,
      expected: addWeeks(startOfWeek(today, { weekStartsOn: 1 }), 1), // Monday of next week
    },
    {
      description: 'multiple BYDAYs (finds the closest)',
      startDate: startOfWeek(today, { weekStartsOn: 1 }), // Monday of current week
      byDay: ['WE', 'FR'],
      interval: 1,
      expected: addDays(startOfWeek(today, { weekStartsOn: 1 }), 2), // Wednesday of current week
    },
    {
      description: 'apply interval correctly',
      startDate: startOfWeek(today, { weekStartsOn: 1 }), // Monday of current week
      byDay: 'MO',
      interval: 2,
      expected: addWeeks(startOfWeek(today, { weekStartsOn: 1 }), 2), // Monday two weeks later
    },
    {
      description: 'no matching day (empty BYDAY)',
      startDate: startOfWeek(today, { weekStartsOn: 1 }), // Monday of current week
      byDay: [],
      interval: 1,
      expected: null,
    },
  ])('should find the next $byDay with interval $interval from $startDate ($description)', ({ startDate, byDay, interval, expected }) => {
    const result = findNextWeeklyDate(startDate, byDay, interval);
    if (expected) {
      expect(result?.toISOString()).toEqual(expected.toISOString());
    } else {
      expect(result).toBeNull();
    }
  });
});

describe('advanceToMonthlyDate Tests', () => {
  it.each([
    {
      description: 'next month on the specified day',
      initialDate: new Date(2025, 0, 15, 10, 0, 0),
      byMonthDay: 15,
      interval: 1,
      expectedDate: new Date(2025, 1, 15, 10, 0, 0),
    },
    {
      description: 'handle month end (non-leap year)',
      initialDate: new Date(2025, 0, 31, 10, 0, 0),
      byMonthDay: 31,
      interval: 1,
      expectedDate: new Date(2025, 1, 28, 10, 0, 0),
    },
    {
      description: 'handle leap year for February',
      initialDate: new Date(2024, 0, 31, 10, 0, 0),
      byMonthDay: 31,
      interval: 1,
      expectedDate: new Date(2024, 1, 29, 10, 0, 0),
    },
    {
      description: 'advance by interval greater than 1',
      initialDate: new Date(2025, 0, 15, 10, 0, 0),
      byMonthDay: 15,
      interval: 3,
      expectedDate: new Date(2025, 3, 15, 10, 0, 0),
    },
    {
      description: 'wrap around years',
      initialDate: new Date(2025, 10, 15, 10, 0, 0),
      byMonthDay: 15,
      interval: 3,
      expectedDate: new Date(2026, 1, 15, 10, 0, 0),
    },
  ])('should advance from $initialDate to $expectedDate ($description)', ({ initialDate, byMonthDay, interval, expectedDate }) => {
    const result = advanceToMonthlyDate(initialDate, byMonthDay, interval);
    expect(result.toISOString()).toEqual(expectedDate.toISOString());
  });
});

describe('advanceToYearlyDate Tests', () => {
  it.each([
    {
      description: 'next year on the specified month and day',
      initialDate: new Date(2025, 0, 15, 10, 0, 0),
      byMonth: 1,
      byMonthDay: 15,
      interval: 1,
      expectedDate: new Date(2026, 0, 15, 10, 0, 0),
    },
    {
      description: 'handle month/day greater than days in that month (non-leap year)',
      initialDate: new Date(2025, 0, 10, 10, 0, 0),
      byMonth: 2,
      byMonthDay: 30,
      interval: 1,
      expectedDate: new Date(2026, 1, 28, 10, 0, 0),
    },
    {
      description: 'handle leap year for February',
      initialDate: new Date(2023, 0, 10, 10, 0, 0),
      byMonth: 2,
      byMonthDay: 30,
      interval: 1,
      expectedDate: new Date(2024, 1, 29, 10, 0, 0),
    },
    {
      description: 'advance by interval greater than 1',
      initialDate: new Date(2025, 0, 15, 10, 0, 0),
      byMonth: 1,
      byMonthDay: 15,
      interval: 3,
      expectedDate: new Date(2028, 0, 15, 10, 0, 0),
    },
  ])('should advance from $initialDate to $expectedDate (byMonth: $byMonth, byMonthDay: $byMonthDay, interval: $interval - $description)', ({ initialDate, byMonth, byMonthDay, interval, expectedDate }) => {
    const result = advanceToYearlyDate(initialDate, byMonth, byMonthDay, interval);
    expect(result.toISOString()).toEqual(expectedDate.toISOString());
  });
});
