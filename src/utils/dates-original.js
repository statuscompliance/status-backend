import { addYears, addMonths, addWeeks, addDays, isBefore, isEqual, getDay, getWeekOfMonth, getDate } from 'date-fns';

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
    
    rulesArr[0] += untilDate;
    rulesArr[1] += untilDate;

    let current = new Date(from);
    const dates = [];

    while (isBefore(current, to)) {
      dates.push(new Date(current));
      current = addDays(current, 1);
    }

    return dates;
  }

  throw new Error(`Invalid period type: ${period}`);
}
