import { describe, it, expect } from 'vitest';
import { getDates } from '../../../src/utils/dates.js';
import { parseISO } from 'date-fns';

describe('Testing getDates per period.', () => {

  it('should generate yearly dates', () => {
    const result = getDates(new Date('2020-01-01'), new Date('2024-01-01'), 'yearly');
    expect(result).toEqual([
      new Date('2020-01-01'),
      new Date('2021-01-01'),
      new Date('2022-01-01'),
      new Date('2023-01-01'),
      new Date('2024-01-01'),
    ]);
  });

  it('should generate monthly dates', () => {
    const result = getDates(new Date('2023-01-01'), new Date('2023-03-01'), 'monthly');
    expect(result).toEqual([
      new Date('2023-01-01'),
      new Date('2023-02-01'),
      new Date('2023-03-01'),
    ]);
  });

  it('should generate weekly dates', () => {
    const result = getDates(new Date('2023-01-01'), new Date('2023-01-15'), 'weekly');
    expect(result).toEqual([
      new Date('2023-01-01'),
      new Date('2023-01-08'),
      new Date('2023-01-15'),
    ]);
  });

  it('should generate daily dates', () => {
    const result = getDates(new Date('2023-01-01'), new Date('2023-01-03'), 'daily');
    expect(result).toEqual([
      new Date('2023-01-01'),
      new Date('2023-01-02'),
      new Date('2023-01-03'),
    ]);
  });

  it('should generate hourly dates', () => {
    const result = getDates(new Date('2023-01-01T00:00:00'), new Date('2023-01-01T02:00:00'), 'hourly');
    expect(result).toEqual([
      new Date('2023-01-01T00:00:00'),
      new Date('2023-01-01T01:00:00'),
      new Date('2023-01-01T02:00:00'),
    ]);
  });
});

describe('Testing getDates using custom rules, geneerating the custom dates using generateDatesFromRules', () => {
  
  it('Generates daily dates from 2020-01-01T00:00:00 to 2020-01-05T00:00:00 , by 10:00am', () => {
    const from = parseISO('2020-01-01T00:00:00Z');
    const to = parseISO('2020-01-05T00:00:00Z');
    const customConfig = {
      rules: 'DTSTART:20200101T100000\nRRULE:FREQ=DAILY;INTERVAL=1;BYHOUR=10',
      Wto: parseISO('2020-01-05T22:00:00Z'),
    };
    const expectedDates = [
      parseISO('2020-01-01T09:00:00Z'),
      parseISO('2020-01-02T09:00:00Z'),
      parseISO('2020-01-03T09:00:00Z'),
      parseISO('2020-01-04T09:00:00Z'),
      parseISO('2020-01-05T09:00:00Z'),
    ];

    const generatedDates = getDates(from, to, 'customRules', customConfig);
    expect(generatedDates).toEqual(expectedDates);
  });

  it('Generates daily dates from 2020-01-01T00:00:00 to 2020-01-10T00:00:00, with an interval of 2 days, by 10:00am', () => {
    const from = parseISO('2020-01-01T00:00:00Z');
    const to = parseISO('2020-01-10T00:00:00Z');
    const customConfig = {
      rules: 'DTSTART:20200101T100000\nRRULE:FREQ=DAILY;INTERVAL=2;BYHOUR=10',
      Wto: parseISO('2020-01-10T22:00:00Z'),
    };
    const expectedDates = [
      parseISO('2020-01-01T09:00:00Z'),
      parseISO('2020-01-03T09:00:00Z'),
      parseISO('2020-01-05T09:00:00Z'),
      parseISO('2020-01-07T09:00:00Z'),
      parseISO('2020-01-09T09:00:00Z'),
    ];

    const generatedDates = getDates(from, to, 'customRules', customConfig);
    expect(generatedDates).toEqual(expectedDates);
  });

  it('Generates weekly dates from 2020-01-01T00:00:00 to 2020-02-29T00:00:00, with an interval of 2 weeks, on Monday, by 10:00am', () => {
    const from = parseISO('2020-01-01T00:00:00Z');
    const to = parseISO('2020-02-29T00:00:00Z');
    const customConfig = {
      rules: 'DTSTART:20200101T100000\nRRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,FR;BYHOUR=10',
      Wto: parseISO('2020-02-29T22:00:00'),
    };
    const expectedDates = [
      parseISO('2020-01-01T09:00:00Z'),
      parseISO('2020-01-17T09:00:00Z'),
      parseISO('2020-01-31T09:00:00Z'),
      parseISO('2020-02-14T09:00:00Z'),
      parseISO('2020-02-28T09:00:00Z'),
    ];

    const generatedDates = getDates(from, to, 'customRules', customConfig);
    expect(generatedDates).toEqual(expectedDates);
  });

  it('Generates monthly dates from 2020-01-01 to 2020-03-31', () => {
    const from = parseISO('2020-01-01T00:00:00Z');
    const to = parseISO('2020-03-31T00:00:00Z');
    const customConfig = {
      rules: 'DTSTART:20200110T100000\nRRULE:FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=10;BYHOUR=10',
      Wto: parseISO('2020-03-31T22:00:00Z'),
    };
    const expectedDates = [
      parseISO('2020-01-10T09:00:00Z'),
      parseISO('2020-02-10T09:00:00Z'),
      parseISO('2020-03-10T09:00:00Z'),
    ];

    const generatedDates = getDates(from, to, 'customRules', customConfig);
    expect(generatedDates).toEqual(expectedDates);
  });

  it('Generates monthly dates from 2020-01-01T00:00:00 to 2020-12-31T00:00:00, with an interval of 2, only on day 15, by 10:00am', () => {
    const from = parseISO('2020-01-01T00:00:00Z');
    const to = parseISO('2020-03-31T00:00:00Z');
    const customConfig = {
      rules: 'DTSTART:20200115T100000\nRRULE:FREQ=MONTHLY;INTERVAL=2;BYMONTHDAY=15;BYHOUR=10',
      Wto: parseISO('2020-03-31T22:00:00Z'),
    };
    const expectedDates = [
      parseISO('2020-01-15T09:00:00.000Z'),
      parseISO('2020-03-15T09:00:00.000Z')
    ];

    const generatedDates = getDates(from, to, 'customRules', customConfig);
    expect(generatedDates).toEqual(expectedDates);
  });

  it('Generates yearly dates from 2020-01-01T00:00:00 to 2023-01-01T00:00:00, on day 1, by 10:00am', () => {
    const from = parseISO('2020-01-01T00:00:00Z');
    const to = parseISO('2023-01-01T00:00:00Z');
    const customConfig = {
      rules: 'DTSTART:20200101T100000\nRRULE:FREQ=YEARLY;INTERVAL=1;BYMONTH=1;BYMONTHDAY=1;BYHOUR=10',
      Wto: parseISO('2023-01-01T22:00:00Z'),
    };
    const expectedDates = [
      parseISO('2020-01-01T09:00:00Z'),
      parseISO('2021-01-01T09:00:00Z'),
      parseISO('2022-01-01T09:00:00Z'),
      parseISO('2023-01-01T09:00:00Z'),
    ];

    const generatedDates = getDates(from, to, 'customRules', customConfig);
    expect(generatedDates).toEqual(expectedDates);
  });

  it('Generates yearly dates from 2020-01-01T00:00:00 to 2026-01-01T00:00:00, with an interval of 2, on day 1, by 10:00am', () => {
    
    const from = parseISO('2020-01-01T00:00:00Z');
    const to = parseISO('2026-01-01T00:00:00Z');
    const customConfig = {
      rules: 'DTSTART:20200101T100000\nRRULE:FREQ=YEARLY;INTERVAL=2;BYMONTH=1;BYMONTHDAY=1;BYHOUR=10',
      Wto: parseISO('2026-01-01T22:00:00'),
    };
    const expectedDates = [
      parseISO('2020-01-01T09:00:00Z'),
      parseISO('2022-01-01T09:00:00Z'),
      parseISO('2024-01-01T09:00:00Z'),
      parseISO('2026-01-01T09:00:00Z')
    ];

    const generatedDates = getDates(from, to, 'customRules', customConfig);
    expect(generatedDates).toEqual(expectedDates);
    });
});