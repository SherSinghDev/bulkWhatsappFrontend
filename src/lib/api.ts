import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  try {
    let token = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      token = window.localStorage.getItem('token');
    } else {
      token = await SecureStore.getItemAsync('token');
    }
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem('token');
        } else {
          await SecureStore.deleteItemAsync('token');
        }
      } catch {}
    }
    return Promise.reject(error);
  }
);

export default api;
