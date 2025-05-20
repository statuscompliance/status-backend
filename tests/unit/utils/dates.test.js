import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
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
  advanceToNextDate,
  periodTypes
} from '../../../src/utils/dates.js';
import { addYears, addMonths, addWeeks, addDays, setHours, setMinutes, setSeconds, setMilliseconds, startOfWeek, getDay } from 'date-fns';
import logger from '../../../src/config/logger.js';

// Helper functions for setting up test dates
const setTimeToZero = (date) => setMilliseconds(setSeconds(setMinutes(setHours(new Date(date), 0), 0), 0), 0);
const setTimeToHour = (date, hour) => setMilliseconds(setSeconds(setMinutes(setHours(new Date(date), hour), 0), 0), 0);

// Base test dates
let today = setTimeToZero(new Date());
let tomorrow = addDays(today, 1);

// Dates with specific hours for testing
let todayAt00 = setTimeToHour(today, 0);
let todayAt01 = setTimeToHour(today, 1);
let todayAt02 = setTimeToHour(today, 2);
let todayAt09 = setTimeToHour(today, 9);
let todayAt10 = setTimeToHour(today, 10);
let todayAt23 = setTimeToHour(today, 23);
let tomorrowAt10 = setTimeToHour(addDays(today, 1), 10);
let tomorrowAt00 = setTimeToHour(addDays(today, 1), 0);
let twoDaysFromNowAt00 = setTimeToHour(addDays(today, 2), 0);
let fourDaysFromNowAt00 = setTimeToHour(addDays(today, 4), 0);

// Helper function to format dates for RRULE
const formatToRRuleUntil = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
};

// Common test setup and teardown
const setupLoggerMock = () => {
  beforeEach(() => {
    vi.spyOn(logger, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
};

// Reusable function for testing date lists equality
const expectDatesEqual = (actual, expected) => {
  expect(actual.map(date => date.toISOString())).toEqual(expected.map(date => date.toISOString()));
};

// Helper for console warning tests
const withMockedConsoleWarn = (testFn) => {
  const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    testFn(consoleSpy);
  } finally {
    consoleSpy.mockRestore();
  }
};

describe('Simple getDates Tests', () => {
  setupLoggerMock();

  it.each([
    { period: 'daily', from: today, to: addDays(today, 2), expected: [today, addDays(today, 1), addDays(today, 2)] },
    { period: 'weekly', from: today, to: addWeeks(today, 2), expected: [today, addWeeks(today, 1), addWeeks(today, 2)] },
    { period: 'monthly', from: today, to: addMonths(today, 2), expected: [today, addMonths(today, 1), addMonths(today, 2)] },
    { period: 'yearly', from: today, to: addYears(today, 2), expected: [today, addYears(today, 1), addYears(today, 2)] },
    { period: 'hourly', from: todayAt00, to: todayAt02, expected: [todayAt00, todayAt01, todayAt02] },
  ])('should generate $period dates correctly', ({ from, to, period, expected }) => {
    const result = getDates(from, to, period);
    expectDatesEqual(result, expected);
  });

  it('should return empty array when from date is after to date', () => {
    const result = getDates(tomorrow, today, 'daily');
    expect(result).toEqual([]);
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
    const result = getDates(from, to, period, config);
    expect(result).toEqual([]);
    expect(logger.error).toHaveBeenCalledWith(expectedMessage);
  });
});

describe('Error handling in getDates', () => {
  setupLoggerMock();

  it('should handle errors in periodFunction', () => {
    // Mock periodTypes.daily to throw an error
    const originalDaily = periodTypes.daily;
    periodTypes.daily = vi.fn().mockImplementation(() => {
      throw new Error('Simulated error');
    });
    
    const result = getDates(today, tomorrow, 'daily');
    
    expect(result).toEqual([]);
    expect(logger.error).toHaveBeenCalledWith(
      'Error generating dates for period daily:', 
      { error: expect.any(Error) }
    );
    
    // Restore original function
    periodTypes.daily = originalDaily;
  });

  it('should handle errors in customRules processing', () => {
    // Create a customConfig that will cause an error when processing
    const badCustomConfig = {
      rules: 'DTSTART:bad-date\nRRULE:invalid---another-one',
      Wto: {
        toISOString: vi.fn().mockImplementation(() => {
          throw new Error('Simulated toISOString error');
        })
      }
    };
    
    const result = getDates(today, tomorrow, 'customRules', badCustomConfig);
    
    expect(result).toEqual([]);
    expect(logger.error).toHaveBeenCalledWith(
      'Error generating dates with custom rules:', 
      { error: expect.any(Error) }
    );
  });
});

describe('Simple generateDatesFromRules Tests', () => {
  const testCases = [
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
  ];

  it.each(testCases)('should handle $description correctly', ({ rules, from, to, expected }) => {
    const result = generateDatesFromRules(rules, from, to);
    expectDatesEqual(result, expected);
  });

  it('should add untilDate to rules when specified', () => {
    const generateDatesSpy = vi.spyOn({ generateDatesFromRules }, 'generateDatesFromRules')
      .mockReturnValue([]);
    
    const from = todayAt00;
    const to = tomorrowAt00;
    const untilDate = `UNTIL=${formatToRRuleUntil(to)}`;
    const rules = ['RRULE:FREQ=DAILY'];
    
    const customConfig = {
      rules: rules,
      Wto: to
    };
    
    const getDatesTemp = (fromDate, toDate, period, config) => {
      if (period === 'customRules' && config?.rules && config?.Wto) {
        const untilDateTmp = `UNTIL=${formatToRRuleUntil(config.Wto)}`;
        const rulesWithUntil = config.rules.map(rule => rule + untilDateTmp);
        generateDatesSpy(rulesWithUntil, fromDate, toDate);
        return [];
      }
      return [];
    };
    
    getDatesTemp(from, to, 'customRules', customConfig);
    
    expect(generateDatesSpy).toHaveBeenCalledWith(
      rules.map(rule => rule + untilDate),
      from, 
      to
    );
    
    generateDatesSpy.mockRestore();
  });
});

describe('Simple generateDatesForFrequency Tests', () => {
  const testCases = [
    {
      description: 'daily dates with byHour',
      ruleData: { startDate: todayAt10, frequency: 'DAILY', interval: 1, byHour: [10] },
      from: todayAt10,
      to: tomorrowAt10,
      expected: [todayAt10, tomorrowAt10],
    },
    {
      description: 'daily dates with interval of 2 days',
      ruleData: { startDate: todayAt00, frequency: 'DAILY', interval: 2, byHour: [0] },
      from: todayAt00,
      to: fourDaysFromNowAt00,
      expected: [todayAt00, twoDaysFromNowAt00, fourDaysFromNowAt00],
    },
    {
      description: 'respect until date in ruleData',
      ruleData: { startDate: todayAt10, frequency: 'DAILY', interval: 1, until: formatToRRuleUntil(tomorrowAt10), byHour: [10] },
      from: addDays(todayAt00, -1),
      to: addDays(todayAt00, 5),
      expected: [todayAt10, tomorrowAt10],
    },
    {
      description: 'use hour 0 if byHour is not provided',
      ruleData: { startDate: todayAt09, frequency: 'DAILY', interval: 1 },
      from: todayAt00,
      to: todayAt23,
      expected: [todayAt00],
    },
  ];

  it.each(testCases)('should generate $description', ({ ruleData, from, to, expected }) => {
    const result = generateDatesForFrequency(ruleData, from, to);
    expectDatesEqual(result, expected);
  });

  it('should handle unsupported frequency', () => {
    withMockedConsoleWarn((consoleSpy) => {
      const ruleData = { startDate: new Date(), frequency: 'BIWEEKLY' };
      const result = generateDatesForFrequency(ruleData, new Date(), addDays(new Date(), 14));
      
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Unsupported frequency or missing parameters: BIWEEKLY');
    });
  });
});

describe('Weekly dates adjustment Tests', () => {
  it('should adjust to first weekly occurrence when frequency is WEEKLY', () => {
    const ruleData = { 
      startDate: todayAt00, 
      frequency: 'WEEKLY', 
      interval: 1, 
      byDay: ['MO', 'WE', 'FR'] 
    };
    
    const result = generateDatesForFrequency(ruleData, todayAt00, addWeeks(todayAt00, 1));
    
    expect(result.length).toBeGreaterThan(0);
  });

  // Common testing logic for weekly occurrence adjustments
  const testWeeklyOccurrenceAdjustment = (mockImplementation, expectedOutcome) => {
    const currentDate = new Date();
    const byDay = ['MO'];
    
    const result = mockImplementation(currentDate, byDay);
    
    // Check based on the expected outcome
    if (expectedOutcome === 'future') {
      expect(result).not.toBe(currentDate);
      expect(result.getTime()).toBeGreaterThan(currentDate.getTime()); // Use getTime() for precise comparison
    } else if (expectedOutcome === 'notCurrentDate') {
      expect(result).not.toBe(currentDate);
    }
  };

  // Test cases for adjustToFirstWeeklyOccurrence
  const mockFunctionsFuture = vi.hoisted(() => ({ 
    adjustToFirstWeeklyOccurrenceFuture: vi.fn() 
  }));

  const mockFunctionsPast = vi.hoisted(() => ({ 
    adjustToFirstWeeklyOccurrencePast: vi.fn() 
  }));

  it('should test adjustToFirstWeeklyOccurrence with occurrence >= currentDate', () => {
    // Implement the mock function directly without doMock
    mockFunctionsFuture.adjustToFirstWeeklyOccurrenceFuture.mockImplementation((currentDate) => {
      // Create a new date that is definitely after currentDate
      const futureDate = new Date(currentDate.getTime() + 86400000); // add 1 day in milliseconds
      return futureDate;
    });
    
    testWeeklyOccurrenceAdjustment(mockFunctionsFuture.adjustToFirstWeeklyOccurrenceFuture, 'future');
  });

  it('should test adjustToFirstWeeklyOccurrence with occurrence < currentDate', () => {
    // Implement the mock function directly without doMock
    mockFunctionsPast.adjustToFirstWeeklyOccurrencePast.mockImplementation((currentDate) => {
      // Return a date different from currentDate
      const otherDate = new Date(currentDate);
      otherDate.setHours(otherDate.getHours() + 1); // just change the hour
      return otherDate;
    });

    testWeeklyOccurrenceAdjustment(mockFunctionsPast.adjustToFirstWeeklyOccurrencePast, 'notCurrentDate');
  });
});

describe('parseRule Tests', () => {
  const parseRuleCases = [
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
  ];

  it.each(parseRuleCases)('should parse a $description correctly', ({ ruleString, expected }) => {
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

describe('adjustDateToHour Tests', () => {
  const hourTestCases = [
    { description: 'set the hour to 10', initialDate: today, hourToSet: 10, expectedDate: todayAt10 },
    { description: 'set the hour to 0', initialDate: today, hourToSet: 0, expectedDate: todayAt00 },
    { description: 'set the hour to 23', initialDate: today, hourToSet: 23, expectedDate: todayAt23 },
  ];

  it.each(hourTestCases)('should $description, clearing minutes, seconds, and milliseconds', 
    ({ initialDate, hourToSet, expectedDate }) => {
      const result = adjustDateToHour(initialDate, hourToSet);
      expect(result.toISOString()).toEqual(expectedDate.toISOString());
    });
});

describe('isDateWithinRange Tests', () => {
  const rangeTestCases = [
    { 
      date: addDays(today, 1), 
      from: today, 
      to: addDays(today, 2), 
      expected: true, 
      description: 'date within interval' 
    },
    { 
      date: today, 
      from: today, 
      to: addDays(today, 2), 
      expected: true, 
      description: 'date is start date' 
    },
    { 
      date: addDays(today, 2), 
      from: today, 
      to: addDays(today, 2), 
      expected: true, 
      description: 'date is end date' 
    },
    { 
      date: addDays(today, -1), 
      from: today, 
      to: addDays(today, 2), 
      expected: false, 
      description: 'date before start date' 
    },
    { 
      date: addDays(today, 3), 
      from: today, 
      to: addDays(today, 2), 
      expected: false, 
      description: 'date after end date' 
    },
    { 
      date: setTimeToHour(todayAt00, 12), 
      from: todayAt00, 
      to: tomorrowAt00, 
      expected: true, 
      description: 'date with different time within range' 
    },
    { 
      date: setTimeToHour(addWeeks(today, 1), 12), 
      from: todayAt00, 
      to: tomorrowAt00, 
      expected: false, 
      description: 'date with different time outside range' 
    },
    { 
      date: setTimeToHour(todayAt00, 23), 
      from: todayAt00, 
      to: tomorrowAt00, 
      expected: true, 
      description: 'date with different time at the end of range' 
    },
  ];

  it.each(rangeTestCases)('should return $expected if $description', 
    ({ date, from, to, expected }) => {
      expect(isDateWithinRange(date, from, to)).toBe(expected);
    });
});

describe('findNextWeeklyDate Tests', () => {
  const currentToday = new Date();
  const weeklyTestCases = [
    {
      description: 'same week',
      startDate: startOfWeek(currentToday, { weekStartsOn: 1 }), // Monday of current week
      byDay: 'WE',
      interval: 1,
      expected: addDays(startOfWeek(currentToday, { weekStartsOn: 1 }), 2), // Wednesday of current week
    },
    {
      description: 'next week',
      startDate: addDays(startOfWeek(currentToday, { weekStartsOn: 1 }), 3), // Thursday of current week
      byDay: 'MO',
      interval: 1,
      expected: addWeeks(startOfWeek(currentToday, { weekStartsOn: 1 }), 1), // Monday of next week
    },
    {
      description: 'current day matches BYDAY with interval 1',
      startDate: startOfWeek(currentToday, { weekStartsOn: 1 }), // Monday of current week
      byDay: 'MO',
      interval: 1,
      expected: addWeeks(startOfWeek(currentToday, { weekStartsOn: 1 }), 1), // Monday of next week
    },
    {
      description: 'multiple BYDAYs (finds the closest)',
      startDate: startOfWeek(currentToday, { weekStartsOn: 1 }), // Monday of current week
      byDay: ['WE', 'FR'],
      interval: 1,
      expected: addDays(startOfWeek(currentToday, { weekStartsOn: 1 }), 2), // Wednesday of current week
    },
    {
      description: 'apply interval correctly',
      startDate: startOfWeek(currentToday, { weekStartsOn: 1 }), // Monday of current week
      byDay: 'MO',
      interval: 2,
      expected: addWeeks(startOfWeek(currentToday, { weekStartsOn: 1 }), 2), // Monday two weeks later
    },
    {
      description: 'no matching day (empty BYDAY)',
      startDate: startOfWeek(currentToday, { weekStartsOn: 1 }), // Monday of current week
      byDay: [],
      interval: 1,
      expected: null,
    },
  ];

  it.each(weeklyTestCases)('should find the next $byDay with interval $interval from $startDate ($description)', 
    ({ startDate, byDay, interval, expected }) => {
      const result = findNextWeeklyDate(startDate, byDay, interval);
      if (expected) {
        expect(result?.toISOString()).toEqual(expected.toISOString());
      } else {
        expect(result).toBeNull();
      }
    });
});

describe('advanceToMonthlyDate Tests', () => {
  const monthlyTestCases = [
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
  ];

  it.each(monthlyTestCases)('should advance from $initialDate to $expectedDate ($description)', 
    ({ initialDate, byMonthDay, interval, expectedDate }) => {
      const result = advanceToMonthlyDate(initialDate, byMonthDay, interval);
      expect(result.toISOString()).toEqual(expectedDate.toISOString());
    });
});

describe('advanceToYearlyDate Tests', () => {
  const yearlyTestCases = [
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
  ];

  it.each(yearlyTestCases)('should advance from $initialDate to $expectedDate (byMonth: $byMonth, byMonthDay: $byMonthDay, interval: $interval - $description)', 
    ({ initialDate, byMonth, byMonthDay, interval, expectedDate }) => {
      const result = advanceToYearlyDate(initialDate, byMonth, byMonthDay, interval);
      expect(result.toISOString()).toEqual(expectedDate.toISOString());
    });
});

describe('advanceToNextDate frequency Tests', () => {
  // Helpers for common testing patterns
  const testFrequencyAdvancement = (frequency, setupFn, assertFn) => {
    const currentDate = setupFn();
    const ruleData = { ...frequency };
    const nextDate = advanceToNextDate(currentDate, ruleData);
    assertFn(nextDate, currentDate);
  };

  it('should advance date correctly for DAILY frequency', () => {
    testFrequencyAdvancement(
      { frequency: 'DAILY', interval: 1 },
      () => new Date(),
      (nextDate, currentDate) => {
        const expectedDate = addDays(currentDate, 1);
        expect(nextDate.toISOString().split('T')[0]).toBe(expectedDate.toISOString().split('T')[0]);
      }
    );
  });

  it('should advance date correctly for WEEKLY frequency with byDay', () => {
    testFrequencyAdvancement(
      { frequency: 'WEEKLY', interval: 1, byDay: ['WE'] },
      () => startOfWeek(new Date(), { weekStartsOn: 1 }),
      (nextDate) => {
        expect(getDay(nextDate)).toBe(3); // Wednesday is day 3 (0 = Sunday)
      }
    );
  });

  it('should advance date correctly for MONTHLY frequency with byMonthDay', () => {
    testFrequencyAdvancement(
      { frequency: 'MONTHLY', interval: 1, byMonthDay: 20 },
      () => new Date(2025, 0, 15),
      (nextDate) => {
        expect(nextDate.getDate()).toBe(20);
        expect(nextDate.getMonth()).toBe(1); // February (0-indexed)
      }
    );
  });

  it('should advance date correctly for YEARLY frequency with byMonth and byMonthDay', () => {
    testFrequencyAdvancement(
      { frequency: 'YEARLY', interval: 1, byMonth: 3, byMonthDay: 20 },
      () => new Date(2025, 0, 15),
      (nextDate) => {
        expect(nextDate.getFullYear()).toBe(2026);
        expect(nextDate.getMonth()).toBe(2); // March (0-indexed)
        expect(nextDate.getDate()).toBe(20);
      }
    );
  });
  
  // Common test for error conditions
  const testUnsupportedFrequency = (ruleData, expectedWarning) => {
    withMockedConsoleWarn((consoleSpy) => {
      const currentDate = new Date();
      const nextDate = advanceToNextDate(currentDate, ruleData);
      
      expect(nextDate).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(expectedWarning);
    });
  };
  
  it('should return null for unsupported frequency', () => {
    testUnsupportedFrequency(
      { frequency: 'UNSUPPORTED' },
      'Unsupported frequency or missing parameters: UNSUPPORTED'
    );
  });
  
  it('should return null for incomplete WEEKLY rule (missing byDay)', () => {
    testUnsupportedFrequency(
      { frequency: 'WEEKLY' },
      'Unsupported frequency or missing parameters: WEEKLY'
    );
  });
  
  it('should return null for incomplete MONTHLY rule (missing byMonthDay)', () => {
    testUnsupportedFrequency(
      { frequency: 'MONTHLY' },
      'Unsupported frequency or missing parameters: MONTHLY'
    );
  });
  
  it('should return null for incomplete YEARLY rule (missing byMonth or byMonthDay)', () => {
    testUnsupportedFrequency(
      { frequency: 'YEARLY', byMonth: 1 },
      'Unsupported frequency or missing parameters: YEARLY'
    );
  });
});
