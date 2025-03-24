import { getDates } from '../../../src/utils/dates.js';
import { parseISO } from 'date-fns';

function printCustomDates(from, to, customConfig) {
    const dates = getDates(from, to, 'customRules', customConfig);
    
    console.log('Fechas personalizadas generadas:');
    dates.forEach(date => {
    console.log(date.toLocaleDateString() + ' ' + date.toLocaleTimeString());
  });
  }

// Ejemplo 1: Regla diaria simple
console.log('\nEjemplo 1: Regla diaria simple');
printCustomDates(
  parseISO('2020-01-01T00:00:00'),
  parseISO('2020-01-05T00:00:00'),
  {
    rules: 'DTSTART:20200101T100000\nRRULE:FREQ=DAILY;INTERVAL=1;BYHOUR=10',
    Wto: parseISO('2020-01-05T22:00:00'),
  }
);

// Ejemplo 2: Regla diaria con intervalo
console.log('\nEjemplo 2: Regla diaria con intervalo');
printCustomDates(
  parseISO('2020-01-01T00:00:00'),
  parseISO('2020-01-10T00:00:00'),
  {
    rules: 'DTSTART:20200101T100000\nRRULE:FREQ=DAILY;INTERVAL=2;BYHOUR=10',
    Wto: parseISO('2020-01-10T22:00:00'),
  }
);

// Ejemplo 3: Regla semanal simple
console.log('\nEjemplo 3: Regla semanal simple');
printCustomDates(
  parseISO('2020-01-01T00:00:00'),
  parseISO('2020-01-31T00:00:00'),
  {
    rules: 'DTSTART:20200101T100000\nRRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=TU,TH;BYHOUR=10',
    Wto: parseISO('2020-01-31T22:00:00'),
  }
);

// Ejemplo 4: Regla semanal con intervalo
console.log('\nEjemplo 4: Regla semanal con intervalo');
printCustomDates(
  parseISO('2020-01-01T00:00:00'),
  parseISO('2020-02-29T00:00:00'),
  {
    rules: 'DTSTART:20200101T100000\nRRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,FR;BYHOUR=10',
    Wto: parseISO('2020-02-29T22:00:00'),
  }
);

// Ejemplo 5: Regla mensual simple
console.log('\nEjemplo 5: Regla mensual simple');
printCustomDates(
  parseISO('2020-01-01T00:00:00'),
  parseISO('2020-03-31T00:00:00'),
  {
    rules: 'DTSTART:20200110T100000\nRRULE:FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=10;BYHOUR=10',
    Wto: parseISO('2020-03-31T22:00:00'),
  }
);

// Ejemplo 6: Regla mensual con intervalo
console.log('\nEjemplo 6: Regla mensual con intervalo');
printCustomDates(
  parseISO('2020-01-01T00:00:00'),
  parseISO('2020-06-30T00:00:00'),
  {
    rules: 'DTSTART:20200101T100000\nRRULE:FREQ=MONTHLY;INTERVAL=3;BYMONTHDAY=1;BYHOUR=10',
    Wto: parseISO('2020-06-30T22:00:00'),
  }
);

// Ejemplo 7: Regla anual simple
console.log('\nEjemplo 7: Regla anual simple');
printCustomDates(
  parseISO('2020-01-01T00:00:00'),
  parseISO('2023-01-01T00:00:00'),
  {
    rules: 'DTSTART:20200101T100000\nRRULE:FREQ=YEARLY;INTERVAL=1;BYMONTH=1;BYMONTHDAY=1;BYHOUR=10',
    Wto: parseISO('2023-01-01T22:00:00'),
  }
);

// Ejemplo 8: Regla anual con intervalo
console.log('\nEjemplo 8: Regla anual con intervalo');
printCustomDates(
  parseISO('2020-01-01T00:00:00'),
  parseISO('2026-01-01T00:00:00'),
  {
    rules: 'DTSTART:20200101T100000\nRRULE:FREQ=YEARLY;INTERVAL=2;BYMONTH=1;BYMONTHDAY=1;BYHOUR=10',
    Wto: parseISO('2026-01-01T22:00:00'),
  }
);