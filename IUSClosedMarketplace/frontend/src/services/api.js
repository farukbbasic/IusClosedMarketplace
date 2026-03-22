import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// ─── Users ────────────────────────────────────────────────────────────────
export const usersApi = {
  getAll: () => api.get('/users'),
  getMe: () => api.get('/users/me'),
  getById: (id) => api.get(`/users/${id}`),
  toggleBan: (id) => api.put(`/users/${id}/toggle-ban`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// ─── Listings ─────────────────────────────────────────────────────────────
export const listingsApi = {
  getAll: () => api.get('/listings'),
  getById: (id) => api.get(`/listings/${id}`),
  search: (params) => api.get('/listings/search', { params }),
  getMyListings: () => api.get('/listings/my-listings'),
  getBySeller: (id) => api.get(`/listings/seller/${id}`),
  create: (data) => api.post('/listings', data),
  update: (id, data) => api.put(`/listings/${id}`, data),
  delete: (id) => api.delete(`/listings/${id}`),
  toggleFavorite: (id) => api.post(`/listings/${id}/favorite`),
  getFavorites: () => api.get('/listings/favorites'),
};

// ─── Messages ─────────────────────────────────────────────────────────────
export const messagesApi = {
  getThreads: () => api.get('/messages/threads'),
  getConversation: (otherUserId, listingId) =>
    api.get('/messages/conversation', { params: { otherUserId, listingId } }),
  send: (data) => api.post('/messages', data),
};

// ─── Reports ──────────────────────────────────────────────────────────────
export const reportsApi = {
  getAll: () => api.get('/reports'),
  getPending: () => api.get('/reports/pending'),
  create: (data) => api.post('/reports', data),
  resolve: (id, data) => api.put(`/reports/${id}/resolve`, data),
};

// ─── Transactions ─────────────────────────────────────────────────────────
export const transactionsApi = {
  getMine: () => api.get('/transactions'),
  create: (data) => api.post('/transactions', data),
  getAnalytics: () => api.get('/transactions/analytics'),
};

export default api;
