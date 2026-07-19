import { apiFetch } from './client';

export function listPolls(groupId) {
  return apiFetch(`/groups/${groupId}/polls`);
}

export function createPoll(groupId, poll) {
  return apiFetch(`/groups/${groupId}/polls`, {
    method: 'POST',
    body: JSON.stringify(poll),
  });
}

export function voteOnPoll(groupId, eventId, optionId) {
  return apiFetch(`/groups/${groupId}/polls/${eventId}/vote`, {
    method: 'PUT',
    body: JSON.stringify({ optionId }),
  });
}

export function lockPoll(groupId, eventId, optionId) {
  return apiFetch(`/groups/${groupId}/polls/${eventId}/lock`, {
    method: 'POST',
    body: JSON.stringify({ optionId }),
  });
}

export function cancelPoll(groupId, eventId) {
  return apiFetch(`/groups/${groupId}/polls/${eventId}`, { method: 'DELETE' });
}
