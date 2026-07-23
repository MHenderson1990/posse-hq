import { apiFetch } from './client';

export function registerDevice(token, platform = 'ios') {
  return apiFetch('/devices', {
    method: 'POST',
    body: JSON.stringify({ token, platform }),
  });
}
