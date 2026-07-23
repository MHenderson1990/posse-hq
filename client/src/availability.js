import { Capacitor } from '@capacitor/core';
import { CapacitorCalendar, CalendarPermissionScope } from '@ebarooni/capacitor-calendar';

async function ensureReadAccess() {
  let checkResult = await CapacitorCalendar.checkPermission({ scope: CalendarPermissionScope.READ_CALENDAR });
  if (checkResult.result === 'granted') return true;
  let requested = await CapacitorCalendar.requestFullCalendarAccess();
  return requested.result === 'granted';
}

// Checks the device calendar for a conflict on the given day. Only ever reads
// start/end timestamps to compute a yes/no answer, on-device - event titles,
// locations, and other details are never touched, stored, or sent anywhere.
export async function isBusyOnDate(dateStr) {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    let granted = await ensureReadAccess();
    if (!granted) return false;

    let [y, m, d] = dateStr.split('-').map(Number);
    let from = new Date(y, m - 1, d).getTime();
    let to = from + 24 * 60 * 60 * 1000;

    let { result } = await CapacitorCalendar.listEventsInRange({ from, to });
    return result.length > 0;
  } catch {
    return false;
  }
}
