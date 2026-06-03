import axios from 'axios';
import type { AuthResponse, MediaEntry, CreateEntryPayload, Review, WatchParty, UserStats, User } from '../types';

const api = axios.create({ baseURL: '/api', withCredentials: true });

// Attach JWT from localStorage if present
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('ov_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Auth
export const register = (data: { username: string; email: string; password: string }) =>
  api.post<AuthResponse>('/auth/register', data).then((r) => r.data);

export const login = (data: { email: string; password: string }) =>
  api.post<AuthResponse>('/auth/login', data).then((r) => r.data);

export const logout = () => api.post('/auth/logout');

export const getMe = () => api.get<{ user: User }>('/auth/me').then((r) => r.data.user);

// Library
export const getLibrary = (params?: { status?: string; type?: string }) =>
  api.get<{ entries: MediaEntry[] }>('/library', { params }).then((r) => r.data.entries);

export const getLibraryStats = () =>
  api.get<UserStats>('/library/stats').then((r) => r.data);

export const getUserLibrary = (userId: string, params?: { status?: string; type?: string }) =>
  api.get<{ entries: MediaEntry[] }>(`/library/user/${userId}`, { params }).then((r) => r.data.entries);

export const addToLibrary = (data: CreateEntryPayload) =>
  api.post<{ entry: MediaEntry }>('/library', data).then((r) => r.data.entry);

export const updateEntry = (id: string, data: Partial<MediaEntry>) =>
  api.put<{ entry: MediaEntry }>(`/library/${id}`, data).then((r) => r.data.entry);

export const deleteEntry = (id: string) => api.delete(`/library/${id}`);

// Reviews
export const getReviews = (params?: { mediaId?: number; mediaType?: string; userId?: string; page?: number }) =>
  api.get('/reviews', { params }).then((r) => r.data);

export const createReview = (data: Omit<Review, '_id' | 'userId' | 'likes' | 'likesCount' | 'createdAt'>) =>
  api.post<{ review: Review }>('/reviews', data).then((r) => r.data.review);

export const updateReview = (id: string, data: Partial<Review>) =>
  api.put<{ review: Review }>(`/reviews/${id}`, data).then((r) => r.data.review);

export const deleteReview = (id: string) => api.delete(`/reviews/${id}`);

export const likeReview = (id: string) =>
  api.post<{ liked: boolean; likesCount: number }>(`/reviews/${id}/like`).then((r) => r.data);

// User
export const getProfile = () => api.get<{ user: User }>('/users/profile').then((r) => r.data.user);

export const updateProfile = (data: { username?: string; bio?: string; avatar?: string }) =>
  api.put<{ user: User }>('/users/profile', data).then((r) => r.data.user);

export const getPublicProfile = (username: string) =>
  api.get(`/users/${username}`).then((r) => r.data);

// Admin
export const adminGetUsers = () => api.get('/users').then((r) => r.data);
export const adminDeleteUser = (id: string) => api.delete(`/users/${id}`);
export const adminSetRole = (id: string, role: string) => api.put(`/users/${id}/role`, { role });
export const adminGetReviews = () => api.get('/reviews/admin/all').then((r) => r.data);

// Watch Party
export const getWatchParties = () =>
  api.get<{ parties: WatchParty[] }>('/watchparty').then((r) => r.data.parties);

export const createWatchParty = (data: { name: string; season: string }) =>
  api.post<{ party: WatchParty }>('/watchparty', data).then((r) => r.data.party);

export const updateWatchParty = (id: string, data: Partial<WatchParty>) =>
  api.put<{ party: WatchParty }>(`/watchparty/${id}`, data).then((r) => r.data.party);

export const deleteWatchParty = (id: string) => api.delete(`/watchparty/${id}`);

export const addWatchPartyItem = (partyId: string, item: { mediaId: number; title: string; coverImage: string; totalEps?: number; airingDay?: string }) =>
  api.post<{ party: WatchParty }>(`/watchparty/${partyId}/items`, item).then((r) => r.data.party);

export const updateWatchPartyItem = (partyId: string, itemId: string, data: { currentEp?: number; completed?: boolean }) =>
  api.put<{ party: WatchParty }>(`/watchparty/${partyId}/items/${itemId}`, data).then((r) => r.data.party);

export const deleteWatchPartyItem = (partyId: string, itemId: string) =>
  api.delete(`/watchparty/${partyId}/items/${itemId}`);

export default api;
