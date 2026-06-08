import axios from 'axios';
import store from '../redux/store';
import { setAccessToken, clearAuth } from '../redux/slices/authSlice';

// Create custom Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Token Refresh Rotation on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401, check if retry hasn't happened yet, and if refresh token is available
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      error.response?.data?.code === 'TOKEN_EXPIRED'
    ) {
      originalRequest._retry = true;
      const state = store.getState();
      const refreshToken = state.auth.refreshToken;

      if (!refreshToken) {
        store.dispatch(clearAuth());
        return Promise.reject(error);
      }

      try {
        // Attempt token rotation call
        const response = await axios.post((import.meta.env.VITE_API_URL || '') + '/api/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Save fresh tokens to store
        store.dispatch(setAccessToken({ accessToken, refreshToken: newRefreshToken }));

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token expired or invalid, logging out...', refreshError);
        store.dispatch(clearAuth());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
