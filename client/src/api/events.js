import { apiFetch } from './client';

export function listEvents(groupId) {
  return apiFetch(`/groups/${groupId}/events`);
}

export function createEvent(groupId, event) {
  return apiFetch(`/groups/${groupId}/events`, {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

export function updateEvent(groupId, eventId, event) {
  return apiFetch(`/groups/${groupId}/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(event),
  });
}

export function deleteEvent(groupId, eventId) {
  return apiFetch(`/groups/${groupId}/events/${eventId}`, { method: 'DELETE' });
}
