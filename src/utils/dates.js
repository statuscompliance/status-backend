import { addYears, addMonths, addWeeks, addDays, isBefore, isEqual, parseISO, isWithinInterval, add, setSeconds, isSameDay, getDay, getDaysInMonth, getYear, getMonth  } from 'date-fns';

export function getDates(from, to, period, customConfig) {
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

    while (isBefore(current, to) || isEqual(current, to)) {
      dates.push(new Date(current));
      current = periodFunction(current, 1);
    }
    
    return dates;
  }

  if (period === 'customRules') {
    
    if (!customConfig.rules || !customConfig.Wto) {
      throw new Error("Custom rules require both 'rules' and 'Wto' parameters.");
    }

    let rulesArr = customConfig.rules.split('---');
    let untilDate = `;UNTIL=${customConfig.Wto.toISOString().replace(/[.\-:]/g, '').substring(0, 15)}Z`;
    
    rulesArr = rulesArr.map(rule => rule + untilDate);

    return generateDatesFromRules(rulesArr, from, to);
  }

  throw new Error(`Invalid period type: ${period}`);
}

function generateDatesFromRules(rulesArr, from, to) {
  const generatedDates = [];

  rulesArr.forEach(rule => {
    const dtstartMatch = rule.match(/DTSTART:(\d+T\d+)/);
    const rruleMatch = rule.match(/RRULE:(.+)/);

    if (dtstartMatch && rruleMatch) {
      const startDate = parseISO(dtstartMatch[1]);
      const rrule = rruleMatch[1];
      const rruleParts = rrule.split(';');

      const frequency = rruleParts.find(part => part.startsWith('FREQ=')).split('=')[1];
      const interval = parseInt(rruleParts.find(part => part.startsWith('INTERVAL=')).split('=')[1] || '1');
      const hours = rruleParts.find(part => part.startsWith('BYHOUR=')).split('=')[1]?.split(',').map(Number) || [0];
      const until = rruleParts.find(part => part.startsWith('UNTIL='));
      let untilDate;
      if (until) {
        untilDate = parseISO(until.split('=')[1]);
      } else {
        untilDate = to;
      }

      let currentDate = startDate;

      while (isWithinInterval(currentDate, { start: from, end: untilDate }) || isSameDay(currentDate, untilDate)) {
        hours.forEach(hour => {
          let dateWithHour = setSeconds(new Date(currentDate), 0);
          dateWithHour.setHours(hour);
          if (isWithinInterval(dateWithHour, { start: from, end: to }) || isSameDay(dateWithHour, to)) {
            generatedDates.push(dateWithHour);
          }
        });

        if (frequency === 'DAILY') {
          currentDate = add(currentDate, { days: interval });
        } else if (frequency === 'WEEKLY') {
          const byDay = rruleParts.find(part => part.startsWith('BYDAY=')).split('=')[1].split(',');
          let foundDay = false;
          for (let i = 0; i < 7; i++) {
            const nextDay = add(currentDate, { days: i });
            if (byDay.includes(['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][getDay(nextDay)])) {
              currentDate = nextDay;
              foundDay = true;
              break;
            }
          }
          if (foundDay) {
            currentDate = add(currentDate, { weeks: interval });
          } else {
            break;
          }
        } else if (frequency === 'MONTHLY') {
          const byMonthDay = parseInt(rruleParts.find(part => part.startsWith('BYMONTHDAY=')).split('=')[1]);
          const daysInCurrentMonth = getDaysInMonth(currentDate);
          const dayOfMonth = Math.min(byMonthDay, daysInCurrentMonth);
          currentDate = new Date(getYear(currentDate), getMonth(currentDate) + interval, dayOfMonth, currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds());
        } else if (frequency === 'YEARLY') {
          const byMonth = parseInt(rruleParts.find(part => part.startsWith('BYMONTH=')).split('=')[1]) - 1;
          const byMonthDay = parseInt(rruleParts.find(part => part.startsWith('BYMONTHDAY=')).split('=')[1]);
          const daysInMonth = getDaysInMonth(new Date(getYear(currentDate) + interval, byMonth));
          const dayOfMonth = Math.min(byMonthDay, daysInMonth);
          currentDate = new Date(getYear(currentDate) + interval, byMonth, dayOfMonth, currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds());
        } else {
          console.log('no implementado para ' + frequency);
          break;
        }
      }
    }
  });

  return generatedDates;
}