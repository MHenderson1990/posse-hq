import { Capacitor } from '@capacitor/core';
import { CapacitorCalendar, CalendarPermissionScope } from '@ebarooni/capacitor-calendar';
import { listEvents } from './api/events';
import { listMyRsvps } from './api/myRsvps';

let MAP_KEY = 'posse_eventkit_map';

function loadMap() {
  try {
    return JSON.parse(localStorage.getItem(MAP_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveMap(map) {
  localStorage.setItem(MAP_KEY, JSON.stringify(map));
}

function toMillis(dateStr, timeStr) {
  let [y, m, d] = dateStr.split('-').map(Number);
  if (!timeStr) return new Date(y, m - 1, d).getTime();
  let [h, min] = timeStr.split(':').map(Number);
  return new Date(y, m - 1, d, h, min).getTime();
}

function computeSchedule(event) {
  if (!event.startTime) {
    return {
      isAllDay: true,
      startDate: toMillis(event.startDate, null),
      endDate: toMillis(event.endDate, null) + 24 * 60 * 60 * 1000,
    };
  }
  let startDate = toMillis(event.startDate, event.startTime);
  let endDate = event.endTime ? toMillis(event.endDate, event.endTime) : startDate + 60 * 60 * 1000;
  return { isAllDay: false, startDate, endDate };
}

async function ensureCalendarAccess() {
  let checkResult = await CapacitorCalendar.checkPermission({ scope: CalendarPermissionScope.WRITE_CALENDAR });
  if (checkResult.result === 'granted') return true;
  let requested = await CapacitorCalendar.requestFullCalendarAccess();
  return requested.result === 'granted';
}

// Keeps the device calendar in sync with "going" RSVPs for this group: creates/updates
// an EventKit event for anything the user is going to, and removes ones for anything
// they're no longer going to (or that got deleted). Safe to call repeatedly.
export async function syncEventKit(groupId) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    let granted = await ensureCalendarAccess();
    if (!granted) return;

    let [{ events }, { rsvps }] = await Promise.all([listEvents(groupId), listMyRsvps(groupId)]);
    let eventsById = {};
    events.forEach((e) => { eventsById[e._id] = e; });

    let goingIds = new Set(rsvps.filter((r) => r.status === 'going').map((r) => r.eventId));
    let map = loadMap();

    for (let eventId of goingIds) {
      let event = eventsById[eventId];
      if (!event) continue;

      let payload = {
        title: event.title,
        location: event.location || undefined,
        description: event.description || undefined,
        ...computeSchedule(event),
      };

      try {
        if (map[eventId]) {
          await CapacitorCalendar.modifyEvent({ id: map[eventId], ...payload });
        } else {
          let { id } = await CapacitorCalendar.createEvent(payload);
          map[eventId] = id;
        }
      } catch (err) {
        console.error(`EventKit sync failed for "${event.title}":`, err.message);
      }
    }

    let staleIds = Object.keys(map).filter((eventId) => !goingIds.has(eventId));
    if (staleIds.length) {
      try {
        await CapacitorCalendar.deleteEventsById({ ids: staleIds.map((id) => map[id]) });
      } catch (err) {
        console.error('EventKit cleanup failed:', err.message);
      }
      staleIds.forEach((eventId) => { delete map[eventId]; });
    }

    saveMap(map);
  } catch (err) {
    console.error('EventKit sync failed:', err.message);
  }
}
