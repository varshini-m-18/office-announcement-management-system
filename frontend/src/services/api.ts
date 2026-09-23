import axios from 'axios';
import type { Announcement, AnnouncementFormData, AuthResponse, DashboardStats, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    return res.data;
  },
  getCurrentUser: async (): Promise<User> => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
};

// Announcement endpoints
export const announcementApi = {
  list: async (params?: { status?: string; audience?: string; search?: string }): Promise<Announcement[]> => {
    const res = await api.get<Announcement[]>('/announcements', { params });
    return res.data;
  },
  getById: async (id: number): Promise<Announcement> => {
    const res = await api.get<Announcement>(`/announcements/${id}`);
    return res.data;
  },
  create: async (data: AnnouncementFormData): Promise<Announcement> => {
    const res = await api.post<Announcement>('/announcements', data);
    return res.data;
  },
  update: async (id: number, data: Partial<AnnouncementFormData>): Promise<Announcement> => {
    const res = await api.put<Announcement>(`/announcements/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<{ message: string; id: number }> => {
    const res = await api.delete(`/announcements/${id}`);
    return res.data;
  },
  publish: async (id: number): Promise<Announcement> => {
    const res = await api.post<Announcement>(`/announcements/${id}/publish`);
    return res.data;
  },
  deactivate: async (id: number): Promise<Announcement> => {
    const res = await api.post<Announcement>(`/announcements/${id}/deactivate`);
    return res.data;
  },
};

// Admin endpoints
export const adminApi = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await api.get<DashboardStats>('/admin/dashboard/stats');
    return res.data;
  },
};
