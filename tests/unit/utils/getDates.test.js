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
  
  it('Generates daily dates with interval 2, by 10:00am', () => {
    const from = parseISO('2020-01-01T00:00:00');
    const to = parseISO('2020-01-10T00:00:00');
    const customConfig = {
      rules: 'DTSTART:20200101T100000Z\nRRULE:FREQ=DAILY;INTERVAL=2;BYHOUR=10',
      Wto: parseISO('2020-01-10T22:00:00'),
    };
    const expectedDates = [
      new Date('2020-01-01T10:00:00.000'),
      new Date('2020-01-03T10:00:00.000'),
      new Date('2020-01-05T10:00:00.000'),
      new Date('2020-01-07T10:00:00.000'),
      new Date('2020-01-09T10:00:00.000'),
    ];

    const generatedDates = getDates(from, to, 'customRules', customConfig);
    expect(generatedDates).toEqual(expectedDates);
  });

  it('Generates weekly dates with interval 2, by 10:00am', () => {
    const from = parseISO('2020-01-01T00:00:00');
    const to = parseISO('2020-02-29T00:00:00');
    const customConfig = {
      rules: 'DTSTART:20200101T100000Z\nRRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,FR;BYHOUR=10',
      Wto: parseISO('2020-02-29T22:00:00'),
    };
    const expectedDates = [
      new Date('2020-01-01T10:00:00.000'),
      new Date('2020-01-17T10:00:00.000'),
      new Date('2020-01-31T10:00:00.000'),
      new Date('2020-02-14T10:00:00.000'),
      new Date('2020-02-28T10:00:00.000'),
    ];

    const generatedDates = getDates(from, to, 'customRules', customConfig);
    expect(generatedDates).toEqual(expectedDates);
  });

  it('Generates monthly dates with interval 2, by 10:00am', () => {
    const from = parseISO('2020-01-01T00:00:00');
    const to = parseISO('2020-03-31T00:00:00');
    const customConfig = {
      rules: 'DTSTART:20200115T100000Z\nRRULE:FREQ=MONTHLY;INTERVAL=2;BYMONTHDAY=15;BYHOUR=10',
      Wto: parseISO('2020-03-31T22:00:00'),
    };
    const expectedDates = [
      new Date('2020-01-15T10:00:00.000'),
      new Date('2020-03-15T10:00:00.000'),
    ];

    const generatedDates = getDates(from, to, 'customRules', customConfig);
    expect(generatedDates).toEqual(expectedDates);
  });

  it('Generates yearly dates with interval 2, by 10:00am', () => {
    const from = parseISO('2020-01-01T00:00:00');
    const to = parseISO('2026-01-01T00:00:00');
    const customConfig = {
      rules: 'DTSTART:20200101T100000Z\nRRULE:FREQ=YEARLY;INTERVAL=2;BYMONTH=1;BYMONTHDAY=1;BYHOUR=10',
      Wto: parseISO('2026-01-01T22:00:00'),
    };
    const expectedDates = [
      new Date('2020-01-01T10:00:00.000'),
      new Date('2022-01-01T10:00:00.000'),
      new Date('2024-01-01T10:00:00.000'),
      new Date('2026-01-01T10:00:00.000'),
    ];

    const generatedDates = getDates(from, to, 'customRules', customConfig);
    expect(generatedDates).toEqual(expectedDates);
  });
});
