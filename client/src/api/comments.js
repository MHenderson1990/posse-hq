import { apiFetch } from './client';

export function listComments(groupId, eventId) {
  return apiFetch(`/groups/${groupId}/events/${eventId}/comments`);
}

export function createComment(groupId, eventId, text) {
  return apiFetch(`/groups/${groupId}/events/${eventId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export function deleteComment(groupId, eventId, commentId) {
  return apiFetch(`/groups/${groupId}/events/${eventId}/comments/${commentId}`, { method: 'DELETE' });
}
