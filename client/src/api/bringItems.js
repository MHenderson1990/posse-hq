import { apiFetch } from './client';

export function listBringItems(groupId, eventId) {
  return apiFetch(`/groups/${groupId}/events/${eventId}/bring-items`);
}

export function addBringItem(groupId, eventId, label) {
  return apiFetch(`/groups/${groupId}/events/${eventId}/bring-items`, {
    method: 'POST',
    body: JSON.stringify({ label }),
  });
}

export function claimBringItem(groupId, eventId, itemId) {
  return apiFetch(`/groups/${groupId}/events/${eventId}/bring-items/${itemId}/claim`, { method: 'PUT' });
}

export function unclaimBringItem(groupId, eventId, itemId) {
  return apiFetch(`/groups/${groupId}/events/${eventId}/bring-items/${itemId}/unclaim`, { method: 'PUT' });
}

export function deleteBringItem(groupId, eventId, itemId) {
  return apiFetch(`/groups/${groupId}/events/${eventId}/bring-items/${itemId}`, { method: 'DELETE' });
}
