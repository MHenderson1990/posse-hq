let DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
let MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
let DOW_NAMES_LONG = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

export function pad2(n) {
  return n < 10 ? '0' + n : '' + n;
}

export function toISODate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function isoDateToday() {
  return toISODate(new Date());
}

export function monthLabel(year, monthIndex) {
  return { name: MONTH_NAMES[monthIndex], year };
}

export function weekdayLong(iso) {
  let [y, m, d] = iso.split('-').map(Number);
  let date = new Date(y, m - 1, d);
  return DOW_NAMES_LONG[date.getDay()];
}

export function formatLongDate(iso) {
  let [, m, d] = iso.split('-').map(Number);
  return `${weekdayLong(iso)}, ${MONTH_NAMES[m - 1]} ${d}`;
}

export function dowHeaders() {
  return DOW_NAMES;
}

export function getMonthWeeks(year, monthIndex) {
  let firstOfMonth = new Date(year, monthIndex, 1);
  let lastOfMonth = new Date(year, monthIndex + 1, 0);
  let gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  let lastIso = toISODate(lastOfMonth);
  let weeks = [];
  let cursor = new Date(gridStart);
  let reachedEnd = false;

  while (!reachedEnd) {
    let week = [];
    for (let d = 0; d < 7; d++) {
      let iso = toISODate(cursor);
      week.push({
        iso,
        inMonth: cursor.getMonth() === monthIndex,
        dayNum: cursor.getDate(),
      });
      if (iso === lastIso) reachedEnd = true;
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export function isMultiDay(event) {
  return event.startDate !== event.endDate;
}

export function eventsForDay(iso, events) {
  let spanning = events
    .filter((e) => isMultiDay(e) && iso >= e.startDate && iso <= e.endDate)
    .map((e) => ({ ...e, dayLabel: dayOffset(e.startDate, iso) + 1 }));
  let single = events.filter((e) => !isMultiDay(e) && e.startDate === iso);
  return [...spanning, ...single];
}

function dayOffset(startIso, iso) {
  let [sy, sm, sd] = startIso.split('-').map(Number);
  let [y, m, d] = iso.split('-').map(Number);
  let start = new Date(sy, sm - 1, sd);
  let cur = new Date(y, m - 1, d);
  return Math.round((cur - start) / (1000 * 60 * 60 * 24));
}
