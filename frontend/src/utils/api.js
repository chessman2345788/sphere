import axios from 'axios';
import store from '../redux/store';
import { setAccessToken, clearAuth } from '../redux/slices/authSlice';


const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});


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


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    
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
        
        const response = await axios.post((import.meta.env.VITE_API_URL || '') + '/api/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        
        store.dispatch(setAccessToken({ accessToken, refreshToken: newRefreshToken }));

        
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
