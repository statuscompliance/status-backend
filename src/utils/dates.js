import { addYears, addMonths, addWeeks, addDays, parseISO, isWithinInterval, add, setSeconds, isSameDay, getDay, getDaysInMonth, getYear, getMonth, isValid } from 'date-fns';

export function getDates(from, to, period, customConfig) {
  
  if (!isValid(from)) {
    console.error("Invalid 'from' date provided.");
    return [];
  }

  if (!isValid(to)) {
    console.error("Invalid 'to' date provided.");
    return [];
  }

  const periodTypes = {
    yearly: addYears,
    monthly: addMonths,
    weekly: addWeeks,
    daily: addDays,
    hourly: (date) => new Date(date.setHours(date.getHours() + 1)),
  };

  if (period in periodTypes) {
    const periodFunction = periodTypes[period];
    let current = new Date(from);
    const dates = [];
    try {
      while (current <= to) {
        dates.push(new Date(current));
        current = periodFunction(current, 1);
      }
      return dates;
    } catch (error) {
      console.error(`Error generating dates for period ${period}:`, error);
      return [];
    }
  }

  if (period === 'customRules') {
    if (!customConfig?.rules || !customConfig?.Wto) {
      console.error("Incomplete custom rules configuration: 'rules' and 'Wto' are required.");
      return [];
    }
    try {
      let rulesArr = customConfig.rules.split('---');
      let untilDate = `;UNTIL=${customConfig.Wto.toISOString().replace(/[.\-:]/g, '').substring(0, 15)}Z`;
      rulesArr = rulesArr.map(rule => rule + untilDate);
      return generateDatesFromRules(rulesArr, from, to);
    } catch (error) {
      console.error('Error generating dates with custom rules:', error);
      return [];
    }
  }

  console.error(`Invalid period type: ${period}`);
  return [];
}

export function generateDatesFromRules(rulesArr, from, to) {
  
  const generatedDates = [];

  rulesArr.forEach(rule => {
    const ruleData = parseRule(rule);
    if (ruleData) {
      generatedDates.push(...generateDatesForFrequency(ruleData, from, to));
    }
  });

  return generatedDates;
}

function parseRule(rule) {
  const dtstartMatch = rule.match(/DTSTART:(\d+T\d+)/);
  const rruleMatch = rule.match(/RRULE:(.+)/);

  if (!dtstartMatch || !rruleMatch) {
    return null;
  }

  const startDate = parseISO(dtstartMatch[1]);
  const rruleParts = rruleMatch[1].split(';');
  const frequency = rruleParts.find(part => part.startsWith('FREQ='))?.split('=')[1];
  const interval = parseInt(rruleParts.find(part => part.startsWith('INTERVAL='))?.split('=')[1] || '1');
  const byHour = rruleParts.find(part => part.startsWith('BYHOUR='))?.split('=')[1]?.split(',').map(Number) || [0];
  const until = rruleParts.find(part => part.startsWith('UNTIL='))?.split('=')[1];
  const byDay = rruleParts.find(part => part.startsWith('BYDAY='))?.split('=')[1]?.split(',');
  const byMonthDay = rruleParts.find(part => part.startsWith('BYMONTHDAY='))?.split('=')[1];
  const byMonth = rruleParts.find(part => part.startsWith('BYMONTH='))?.split('=')[1];

  return {
    startDate,
    frequency,
    interval,
    byHour,
    until,
    byDay,
    byMonthDay: byMonthDay ? parseInt(byMonthDay, 10) : undefined,
    byMonth: byMonth ? parseInt(byMonth, 10) - 1 : undefined, // Month in date-fns is 0-indexed
  };
}

function generateDatesForFrequency(ruleData, from, to) {
  const generatedDates = [];
  let currentDate = new Date(ruleData.startDate);
  const untilDate = ruleData.until ? parseISO(ruleData.until) : to;

  while (isWithinInterval(currentDate, { start: from, end: untilDate }) || isSameDay(currentDate, untilDate)) {
    ruleData.byHour.forEach(hour => {
      let dateWithHour = setSeconds(new Date(currentDate), 0);
      dateWithHour.setHours(hour);
      if (isWithinInterval(dateWithHour, { start: from, end: to }) || isSameDay(dateWithHour, to)) {
        generatedDates.push(dateWithHour);
      }
    });

    if (ruleData.frequency === 'DAILY') {
      currentDate = add(currentDate, { days: ruleData.interval });
    } else if (ruleData.frequency === 'WEEKLY' && ruleData.byDay) {
      let foundDay = false;
      for (let i = 0; i < 7; i++) {
        const nextDay = add(currentDate, { days: i });
        if (ruleData.byDay.includes(['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][getDay(nextDay)])) {
          currentDate = nextDay;
          foundDay = true;
          break;
        }
      }
      if (foundDay) {
        currentDate = add(currentDate, { weeks: ruleData.interval });
      } else {
        break;
      }
    } else if (ruleData.frequency === 'MONTHLY' && ruleData.byMonthDay !== undefined) {
      const daysInCurrentMonth = getDaysInMonth(currentDate);
      const dayOfMonth = Math.min(ruleData.byMonthDay, daysInCurrentMonth);
      currentDate = new Date(getYear(currentDate), getMonth(currentDate) + ruleData.interval, dayOfMonth, currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds());
    } else if (ruleData.frequency === 'YEARLY' && ruleData.byMonth !== undefined && ruleData.byMonthDay !== undefined) {
      const nextYear = getYear(currentDate) + ruleData.interval;
      const daysInMonth = getDaysInMonth(new Date(nextYear, ruleData.byMonth));
      const dayOfMonth = Math.min(ruleData.byMonthDay, daysInMonth);
      currentDate = new Date(nextYear, ruleData.byMonth, dayOfMonth, currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds());
    } else {
      console.warn(`Unsupported frequency or missing parameters: ${ruleData.frequency}`);
      break;
    }
  }
  return generatedDates;
}
