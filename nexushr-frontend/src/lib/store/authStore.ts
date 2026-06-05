import { create } from 'zustand';
import { User } from '@/types';
import api, { injectAuthStore } from '@/lib/api/client';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;

  getAccessToken: () => string | null;
  setAccessToken: (token: string) => void;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: false,

  getAccessToken: () => get().accessToken,

  setAccessToken: (token: string) => set({ accessToken: token }),

  login: async (email: string, password: string): Promise<User> => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      // Backend returns { data: { accessToken, tokenType, expiresIn, user } } (camelCase).
      const { accessToken, user } = data.data;
      // CRITICAL: store ONLY in Zustand memory — never localStorage/sessionStorage.
      set({ user, accessToken, isLoading: false });
      return user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore — clear state regardless
    } finally {
      set({ user: null, accessToken: null });
    }
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me');
      // /auth/me returns the user (with `employee`) as `data`.
      set({ user: data.data });
    } catch {
      // A hard navigation (e.g. right after login) wipes the in-memory accessToken, so
      // /auth/me 401s. The 401 interceptor intentionally skips a refresh for /auth/* to
      // avoid the logged-out loop, so we do ONE explicit cookie-based refresh here and
      // retry /me. This is what makes a post-login hard redirect land on the dashboard.
      try {
        const { data: refresh } = await api.post('/auth/refresh', {});
        const newToken = refresh?.data?.accessToken;
        if (!newToken) throw new Error('no token');
        set({ accessToken: newToken });
        const { data } = await api.get('/auth/me');
        set({ user: data.data });
      } catch {
        set({ user: null, accessToken: null });
      }
    }
  },

  clearAuth: () => set({ user: null, accessToken: null }),
}));

// Wire the store into the Axios client (breaks the circular import).
injectAuthStore({
  getAccessToken: () => useAuthStore.getState().getAccessToken(),
  setAccessToken: (token) => useAuthStore.getState().setAccessToken(token),
  logout: () => useAuthStore.getState().clearAuth(),
});
