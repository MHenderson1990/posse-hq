import { apiFetch } from './client';

export function listRsvps(groupId, eventId) {
  return apiFetch(`/groups/${groupId}/events/${eventId}/rsvps`);
}

export function setMyRsvp(groupId, eventId, status) {
  return apiFetch(`/groups/${groupId}/events/${eventId}/rsvps/me`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}
