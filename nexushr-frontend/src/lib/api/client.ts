import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Auth store is injected lazily to avoid a circular import (store → client → store).
let getAccessToken: () => string | null = () => null;
let setAccessToken: (token: string) => void = () => {};
let logoutFn: () => void = () => {};

export function injectAuthStore(store: {
  getAccessToken: () => string | null;
  setAccessToken: (token: string) => void;
  logout: () => void;
}) {
  getAccessToken = store.getAccessToken;
  setAccessToken = store.setAccessToken;
  logoutFn = store.logout;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true, // sends the httpOnly refresh cookie with every request
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ── Request interceptor — attach bearer token ──────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — auto-refresh on 401 ─────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Don't attempt a token refresh for the auth endpoints themselves (login/refresh/me/
    // logout). A 401 there means "not logged in" — retrying just doubles the failed calls
    // and, for /me on a logged-out page load, can spiral.
    const url = originalRequest?.url ?? '';
    const isAuthEndpoint = /\/auth\/(login|refresh|logout|me)/.test(url);

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh using the httpOnly cookie. Backend returns { data: { accessToken } }.
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = data.data.accessToken;
        setAccessToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        logoutFn();
        // Only redirect if we're not already on an auth page (avoids reload churn).
        if (typeof window !== 'undefined' && !/^\/(login|forgot-password|reset-password)/.test(window.location.pathname)) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
