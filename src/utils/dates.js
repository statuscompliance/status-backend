import { addYears, addMonths, addWeeks, addDays, parseISO, isWithinInterval, add, setSeconds, isSameDay, getDay, getDaysInMonth, getYear, getMonth, isValid } from 'date-fns';


export const periodTypes = {
  yearly: addYears,
  monthly: addMonths,
  weekly: addWeeks,
  daily: addDays,
  hourly: (date) => new Date(date.setHours(date.getHours() + 1)),
};

export function getDates(from, to, period, customConfig) {

  if (!isValid(from)) {
    console.error("Invalid 'from' date provided.");
    return [];
  }

  if (!isValid(to)) {
    console.error("Invalid 'to' date provided.");
    return [];
  }
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

export function parseRule(rule) {
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

export function generateDatesForFrequency(ruleData, from, to) {
  const generatedDates = [];
  let currentDate = new Date(ruleData.startDate);
  const untilDate = ruleData.until ? parseISO(ruleData.until) : to;
  const byHour = Array.isArray(ruleData.byHour) ? ruleData.byHour : [0];

  if (ruleData.frequency === 'WEEKLY' && ruleData.byDay) {
    const firstOccurrence = findNextWeeklyDate(new Date(add(currentDate, { days: -7 })), ruleData.byDay, 1);
    if (firstOccurrence && firstOccurrence >= currentDate) {
      currentDate = firstOccurrence;
    } else if (firstOccurrence && firstOccurrence < currentDate) {
      currentDate = findNextWeeklyDate(new Date(currentDate), ruleData.byDay, 1);
    }
  }

  while (isWithinInterval(currentDate, { start: from, end: untilDate }) || isSameDay(currentDate, untilDate)) {

    byHour.forEach(hour => {
      const dateWithHour = adjustDateToHour(new Date(currentDate), hour);
      if (isDateWithinRange(dateWithHour, from, to)) {
        generatedDates.push(dateWithHour);
      } 
    });

    if (ruleData.frequency === 'DAILY') {
      currentDate = add(currentDate, { days: ruleData.interval || 1 });
    } else if (ruleData.frequency === 'WEEKLY' && ruleData.byDay) {
      const nextDate = findNextWeeklyDate(new Date(currentDate), ruleData.byDay, ruleData.interval || 1);
      if (!nextDate) break;
      currentDate = nextDate;
    } else if (ruleData.frequency === 'MONTHLY' && ruleData.byMonthDay !== undefined) {
      currentDate = advanceToMonthlyDate(new Date(currentDate), ruleData.byMonthDay, ruleData.interval || 1);
    } else if (ruleData.frequency === 'YEARLY' && ruleData.byMonth !== undefined && ruleData.byMonthDay !== undefined) {
      currentDate = advanceToYearlyDate(new Date(currentDate), ruleData.byMonth, ruleData.byMonthDay, ruleData.interval || 1);
    } else {
      console.warn(`Unsupported frequency or missing parameters: ${ruleData.frequency}`);
      break;
    }
  }
  return generatedDates.sort((a, b) => a.getTime() - b.getTime());
}

export function adjustDateToHour(date, hour) {
  const dateWithHour = setSeconds(new Date(date), 0);
  dateWithHour.setHours(hour);
  return dateWithHour;
}

export function isDateWithinRange(date, from, to) {
  return isWithinInterval(date, { start: from, end: to }) || isSameDay(date, to);
}

export function findNextWeeklyDate(currentDate, byDay, interval) {
  let foundDay = false;
  let nextDate = new Date(currentDate);
  for (let i = 1; i <= 7; i++) {
    const potentialDate = add(currentDate, { days: i });
    const dayOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][getDay(potentialDate)];
    if (byDay.includes(dayOfWeek)) {
      nextDate = potentialDate;
      foundDay = true;
      break;
    }
  }

  if (foundDay) {
    const currentDayIndex = getDay(currentDate);
    const nextDayIndex = getDay(nextDate);
    // Calculate the number of days to add for the interval
    let daysToAdd = (interval - 1) * 7;
    if (nextDayIndex <= currentDayIndex) {
      daysToAdd += (7 - currentDayIndex + nextDayIndex);
    } else {
      daysToAdd += (nextDayIndex - currentDayIndex);
    }
    const finalNextDate = add(currentDate, { days: daysToAdd });
    return finalNextDate;
  }
  return null;
}

export function advanceToMonthlyDate(currentDate, byMonthDay, interval) {
  const currentYear = getYear(currentDate);
  const currentMonth = getMonth(currentDate);
  const nextMonth = currentMonth + interval;
  const nextYearBasedOnMonth = currentYear + Math.floor(nextMonth / 12);
  const finalMonth = nextMonth % 12;
  const daysInNextMonth = getDaysInMonth(new Date(nextYearBasedOnMonth, finalMonth));
  const dayOfMonth = Math.min(byMonthDay, daysInNextMonth);
  return new Date(nextYearBasedOnMonth, finalMonth, dayOfMonth, currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds());
}

export function advanceToYearlyDate(currentDate, byMonth, byMonthDay, interval) {
  const nextYear = getYear(currentDate) + interval;
  const monthIndex = byMonth - 1;
  const daysInMonth = getDaysInMonth(new Date(nextYear, monthIndex));
  const dayOfMonth = Math.min(byMonthDay, daysInMonth);
  return new Date(nextYear, monthIndex, dayOfMonth, currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds());
}
