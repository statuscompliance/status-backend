import { addYears, addMonths, addWeeks, addDays, isBefore } from 'date-fns';

export function getDates(from, to, period, Wto, rules) {
  const periodTypes = {
    yearly: addYears,
    monthly: addMonths,
    weekly: addWeeks,
    daily: addDays,
    hourly: (date) => {
      return new Date(date.setHours(date.getHours() + 1)); // Adds an hour to the date
    }
  };

  if (period in periodTypes) {
    const periodFunction = periodTypes[period];
    let current = new Date(from);
    const dates = [];

    while (isBefore(current, to)) {
      dates.push(new Date(current));
      current = periodFunction(current, 1); // Move to the next period (year, month, etc.)
    }

    return dates;
  }

  if (period === 'customRules') {
    if (!rules || !Wto) {
      throw new Error("Custom rules require both 'rules' and 'Wto' parameters.");
    }

    let rulesArr = rules.split('---');
    let untilDate = `;UNTIL=${Wto.toISOString().replace(/[.\-:]/g, '').substring(0, 15)}Z`;
    
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
