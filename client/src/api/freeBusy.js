import { apiFetch } from './client';

export function pushFreeBusy(groupId, entries) {
  return apiFetch(`/groups/${groupId}/free-busy`, { method: 'PUT', body: JSON.stringify({ entries }) });
}

export function listFreeBusy(groupId, dates) {
  return apiFetch(`/groups/${groupId}/free-busy?dates=${dates.map(encodeURIComponent).join(',')}`);
}
