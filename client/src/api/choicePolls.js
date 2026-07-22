import { apiFetch } from './client';

export function listChoicePolls(groupId) {
  return apiFetch(`/groups/${groupId}/choice-polls`);
}

export function createChoicePoll(groupId, poll) {
  return apiFetch(`/groups/${groupId}/choice-polls`, {
    method: 'POST',
    body: JSON.stringify(poll),
  });
}

export function voteOnChoicePoll(groupId, pollId, optionId) {
  return apiFetch(`/groups/${groupId}/choice-polls/${pollId}/vote`, {
    method: 'PUT',
    body: JSON.stringify({ optionId }),
  });
}

export function lockChoicePoll(groupId, pollId, optionId) {
  return apiFetch(`/groups/${groupId}/choice-polls/${pollId}/lock`, {
    method: 'POST',
    body: JSON.stringify({ optionId }),
  });
}

export function deleteChoicePoll(groupId, pollId) {
  return apiFetch(`/groups/${groupId}/choice-polls/${pollId}`, { method: 'DELETE' });
}
