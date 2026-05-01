import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('tf_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
  changePassword: (data) => api.patch('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
};

export const workspacesAPI = {
  list: () => api.get('/workspaces'),
  create: (data) => api.post('/workspaces', data),
  getOne: (id) => api.get(`/workspaces/${id}`),
  update: (id, data) => api.patch(`/workspaces/${id}`, data),
  remove: (id) => api.delete(`/workspaces/${id}`),
  invite: (id, data) => api.post(`/workspaces/${id}/invite`, data),
  removeMember: (id, userId) => api.delete(`/workspaces/${id}/members/${userId}`),
  updateMemberRole: (id, userId, role) => api.patch(`/workspaces/${id}/members/${userId}`, { role }),
};

export const boardsAPI = {
  list: (workspaceId) => api.get(`/boards/workspace/${workspaceId}`),
  create: (data) => api.post('/boards', data),
  getOne: (id) => api.get(`/boards/${id}`),
  update: (id, data) => api.patch(`/boards/${id}`, data),
  remove: (id) => api.delete(`/boards/${id}`),
  // Columns
  createColumn: (boardId, data) => api.post(`/boards/${boardId}/columns`, data),
  updateColumn: (columnId, data) => api.patch(`/boards/columns/${columnId}`, data),
  deleteColumn: (columnId) => api.delete(`/boards/columns/${columnId}`),
  // Cards
  createCard: (data) => api.post('/boards/cards', data),
  updateCard: (cardId, data) => api.patch(`/boards/cards/${cardId}`, data),
  deleteCard: (cardId) => api.delete(`/boards/cards/${cardId}`),
  addComment: (cardId, text) => api.post(`/boards/cards/${cardId}/comments`, { text }),
  reorder: (boardId, updates) => api.post(`/boards/${boardId}/reorder`, { updates }),
};

export const stripeAPI = {
  status: () => api.get('/stripe/status'),
  createCheckout: (plan) => api.post('/stripe/create-checkout', { plan }),
  portal: () => api.post('/stripe/portal'),
  cancel: () => api.post('/stripe/cancel'),
};
