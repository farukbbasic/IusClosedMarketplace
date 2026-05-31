import axios from 'axios';
import { getApiAccessToken, msalInstance } from '../auth/authConfig';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Attach a fresh Azure AD access token to every request.
// MSAL caches tokens internally and only contacts the IdP when the cached
// token is near expiry, so this is cheap on the hot path.
api.interceptors.request.use(async (config) => {
  try {
    const token = await getApiAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    // Don't block the request on token errors — let the server respond with
    // 401 and the response interceptor will trigger an interactive login.
    console.warn('Failed to acquire access token:', err);
  }
  return config;
});

// Handle 401 globally — kick the user back to interactive sign-in.
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      // Clear any active account and trigger a redirect login.
      const account = msalInstance.getActiveAccount();
      if (account) {
        await msalInstance.logoutRedirect({
          postLogoutRedirectUri: 'http://localhost:5173/'
        });
      }
    }
    return Promise.reject(err);
  }
);

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
  uploadImages: (files) => {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    return api.post('/listings/upload-images', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
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

// ─── Auth (kept for compatibility — register/login are no-ops with Azure) ──
// These exports remain so any old imports don't crash, but you should not call them.
export const authApi = {
  register: () => Promise.reject(new Error('Use Azure AD sign-in instead.')),
  login: () => Promise.reject(new Error('Use Azure AD sign-in instead.')),
};

export default api;
