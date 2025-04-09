import { addYears, addMonths, addWeeks, addDays, isBefore, isEqual, parseISO, isWithinInterval, add, setSeconds, isSameDay, getDay, getDaysInMonth, getYear, getMonth  } from 'date-fns';

// Main function to generate dates between "from" and "to" based on the provided period or custom rules.
export function getDates(from, to, period, customConfig) {
  // Mapping for standard period types to their corresponding date-fns functions.
  const periodTypes = {
    yearly: addYears,
    monthly: addMonths,
    weekly: addWeeks,
    daily: addDays,
    // For hourly, manually increment the hour.
    hourly: (date) => new Date(date.setHours(date.getHours() + 1)),
  };

  // If the period matches one of the standard types.
  if (period in periodTypes) {
    const periodFunction = periodTypes[period];
    let current = new Date(from);
    const dates = [];

    // Loop until current date exceeds "to"; include edge date if equal.
    while (isBefore(current, to) || isEqual(current, to)) {
      dates.push(new Date(current));
      current = periodFunction(current, 1); // Increment current date by the period.
    }
    
    return dates;
  }

  // Custom rules logic.
  if (period === 'customRules') {
    // Check that both custom rules parameters are provided.
    if (!customConfig.rules || !customConfig.Wto) {
      throw new Error("Custom rules require both 'rules' and 'Wto' parameters.");
    }

    // Split the rules string into individual rules.
    let rulesArr = customConfig.rules.split('---');
    // Append UNTIL date rule based on Wto, formatted in a specific way.
    let untilDate = `;UNTIL=${customConfig.Wto.toISOString().replace(/[.\-:]/g, '').substring(0, 15)}Z`;
    
    // Append the UNTIL date to each rule.
    rulesArr = rulesArr.map(rule => rule + untilDate);

    // Generate dates based on the custom rules.
    return generateDatesFromRules(rulesArr, from, to);
  }

  // Throw error if the period type is invalid.
  throw new Error(`Invalid period type: ${period}`);
}

// Helper function to generate dates from rrule-based rules.
function generateDatesFromRules(rulesArr, from, to) {
  const generatedDates = [];

  // Process each rule provided in the rules array.
  rulesArr.forEach(rule => {
    // Extract the start date (DTSTART) and recurrence rule (RRULE) from the rule string.
    const dtstartMatch = rule.match(/DTSTART:(\d+T\d+)/);
    const rruleMatch = rule.match(/RRULE:(.+)/);

    if (dtstartMatch && rruleMatch) {
      // Parse initial start date from the extracted string.
      const startDate = parseISO(dtstartMatch[1]);
      const rrule = rruleMatch[1];
      // Break the rrule string into its individual parameters.
      const rruleParts = rrule.split(';');

      // Determine the frequency of recurrence (e.g., DAILY, WEEKLY).
      const frequency = rruleParts.find(part => part.startsWith('FREQ=')).split('=')[1];
      // Get the interval for recurrence, defaulting to 1 if not specified.
      const interval = parseInt(rruleParts.find(part => part.startsWith('INTERVAL=')).split('=')[1] || '1');
      // Get hours parameter as an array, defaulting to [0] if not specified.
      const hours = rruleParts.find(part => part.startsWith('BYHOUR=')).split('=')[1]?.split(',').map(Number) || [0];
      // Determine the until date from the rule, if provided.
      const until = rruleParts.find(part => part.startsWith('UNTIL='));
      let untilDate;
      if (until) {
        untilDate = parseISO(until.split('=')[1]);
      } else {
        untilDate = to;
      }

      let currentDate = startDate;

      // Loop to generate recurring dates based on the interval and frequency.
      while (isWithinInterval(currentDate, { start: from, end: untilDate }) || isSameDay(currentDate, untilDate)) {
        // For each specified hour, set that hour on the current date.
        hours.forEach(hour => {
          let dateWithHour = setSeconds(new Date(currentDate), 0);
          dateWithHour.setHours(hour);
          // Check if the date with the specified hour is within the required interval.
          if (isWithinInterval(dateWithHour, { start: from, end: to }) || isSameDay(dateWithHour, to)) {
            generatedDates.push(dateWithHour);
          }
        });

        // Update currentDate based on the recurrence frequency.
        if (frequency === 'DAILY') {
          // For daily recurrence, add the number of days.
          currentDate = add(currentDate, { days: interval });
        } else if (frequency === 'WEEKLY') {
          // For weekly recurrence, match the day specified in BYDAY.
          const byDay = rruleParts.find(part => part.startsWith('BYDAY=')).split('=')[1].split(',');
          let foundDay = false;
          // Check the next 7 days for the matching weekday.
          for (let i = 0; i < 7; i++) {
            const nextDay = add(currentDate, { days: i });
            // Map weekday index to its string (SU, MO, ... SA).
            if (byDay.includes(['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][getDay(nextDay)])) {
              currentDate = nextDay;
              foundDay = true;
              break;
            }
          }
          if (foundDay) {
            // After finding the matching day, move ahead by the week interval.
            currentDate = add(currentDate, { weeks: interval });
          } else {
            break; // Exit if no matching day is found.
          }
        } else if (frequency === 'MONTHLY') {
          // For monthly recurrence, schedule on the day specified in BYMONTHDAY.
          const byMonthDay = parseInt(rruleParts.find(part => part.startsWith('BYMONTHDAY=')).split('=')[1]);
          const daysInCurrentMonth = getDaysInMonth(currentDate);
          const dayOfMonth = Math.min(byMonthDay, daysInCurrentMonth);
          currentDate = new Date(getYear(currentDate), getMonth(currentDate) + interval, dayOfMonth, currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds());
        } else if (frequency === 'YEARLY') {
          // For yearly recurrence, parse BYMONTH and BYMONTHDAY for the target date.
          const byMonth = parseInt(rruleParts.find(part => part.startsWith('BYMONTH=')).split('=')[1]) - 1;
          const byMonthDay = parseInt(rruleParts.find(part => part.startsWith('BYMONTHDAY=')).split('=')[1]);
          const daysInMonth = getDaysInMonth(new Date(getYear(currentDate) + interval, byMonth));
          const dayOfMonth = Math.min(byMonthDay, daysInMonth);
          currentDate = new Date(getYear(currentDate) + interval, byMonth, dayOfMonth, currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds());
        } else {
          console.warn(`Unsupported frequency: ${frequency}`);
          break;
        }
      }
    }
  });

  return generatedDates;
}
