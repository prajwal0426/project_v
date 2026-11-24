import { apiRequest } from './api.js';

function withQuery(path, params = {}) {
  const search = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  ).toString();
  return search ? `${path}?${search}` : path;
}

export const notificationsApi = {
  list(token, params) {
    return apiRequest(withQuery('/notifications', params), { token });
  },
  unreadCount(token) {
    return apiRequest('/notifications/unread-count', { token });
  },
  view(token, id) {
    return apiRequest(`/notifications/${encodeURIComponent(id)}/view`, { method: 'POST', token });
  }
};

export const adminNotificationsApi = {
  list(token, params) {
    return apiRequest(withQuery('/admin/notifications', params), { token });
  },
  stats(token) {
    return apiRequest('/admin/notifications/stats', { token });
  },
  searchRecipients(token, params) {
    return apiRequest(withQuery('/admin/notifications/recipients', params), { token });
  },
  createBroadcast(token, notification) {
    return apiRequest('/admin/notifications/broadcast', { method: 'POST', token, body: notification });
  },
  createIndividual(token, notification) {
    return apiRequest('/admin/notifications/individual', { method: 'POST', token, body: notification });
  },
  remove(token, id) {
    return apiRequest(`/admin/notifications/${encodeURIComponent(id)}`, { method: 'DELETE', token });
  }
};
