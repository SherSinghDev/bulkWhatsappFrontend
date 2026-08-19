import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../lib/api';

interface Plan {
  _id: string;
  name: string;
  code: string;
  price: number;
  maxContacts: number;
  maxMessagesPerMonth: number;
  maxCampaignsPerMonth: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  companyName?: string;
  phone?: string;
  plan?: Plan | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const getItem = async (key: string) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
};

const setItem = async (key: string, value: string) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch {}
};

const deleteItem = async (key: string) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch {}
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data.data;
    await setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    await deleteItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const token = await getItem('token');
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }
      const res = await api.get('/auth/me');
      const userData = res.data.data;
      set({
        user: {
          id: userData._id || userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          companyName: userData.companyName,
          phone: userData.phone,
          plan: userData.plan,
        },
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      await deleteItem('token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
