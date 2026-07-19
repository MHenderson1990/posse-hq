import { apiFetch } from './client';

export function listCategories(groupId) {
  return apiFetch(`/groups/${groupId}/categories`);
}

export function createCategory(groupId, { name, color }) {
  return apiFetch(`/groups/${groupId}/categories`, {
    method: 'POST',
    body: JSON.stringify({ name, color }),
  });
}

export function deleteCategory(groupId, categoryId) {
  return apiFetch(`/groups/${groupId}/categories/${categoryId}`, { method: 'DELETE' });
}
