import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // If running in a web browser, use relative '/api' so it routes through Nginx proxy without CORS issues
  if (typeof window !== 'undefined' && window.location) {
    return '/api';
  }
  return 'http://localhost:5001/api';
};

const API_BASE_URL = getApiBaseUrl();

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
