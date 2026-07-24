import { Capacitor } from '@capacitor/core';
import { CapacitorCalendar, CalendarPermissionScope } from '@ebarooni/capacitor-calendar';

async function ensureReadAccess() {
  let checkResult = await CapacitorCalendar.checkPermission({ scope: CalendarPermissionScope.READ_CALENDAR });
  if (checkResult.result === 'granted') return true;
  let requested = await CapacitorCalendar.requestFullCalendarAccess();
  return requested.result === 'granted';
}

// Reads the device calendar for the given day and returns only start/end
// timestamps, on-device. Event titles, locations, and other details are
// never touched, stored, or sent anywhere - only these blocks may be
// reported to the server to compute group-wide free/busy.
export async function getBusyBlocks(dateStr) {
  if (!Capacitor.isNativePlatform()) return [];

  try {
    let granted = await ensureReadAccess();
    if (!granted) return [];

    let [y, m, d] = dateStr.split('-').map(Number);
    let from = new Date(y, m - 1, d).getTime();
    let to = from + 24 * 60 * 60 * 1000;

    let { result } = await CapacitorCalendar.listEventsInRange({ from, to });
    return result.map((e) => ({ start: e.startDate, end: e.endDate }));
  } catch {
    return [];
  }
}

export async function isBusyOnDate(dateStr) {
  let blocks = await getBusyBlocks(dateStr);
  return blocks.length > 0;
}
