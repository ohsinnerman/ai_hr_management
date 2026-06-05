import api from './client';
import { ApiResponse, User } from '@/types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ accessToken: string; user: User }>>('/auth/login', { email, password }),

  logout: () => api.post('/auth/logout'),

  refresh: () =>
    api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', {}, { withCredentials: true }),

  me: () => api.get<ApiResponse<User>>('/auth/me'),

  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
};
