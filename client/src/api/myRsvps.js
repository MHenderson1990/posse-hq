import { apiFetch } from './client';

export function listMyRsvps(groupId) {
  return apiFetch(`/groups/${groupId}/my-rsvps`);
}
