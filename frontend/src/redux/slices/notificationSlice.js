import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

const getAuthConfig = (getState) => {
  const { auth } = getState();
  return {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  };
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (page = 1, { getState, rejectWithValue }) => {
    const config = getAuthConfig(getState);
    try {
      const response = await axios.get(`/api/notifications?page=${page}&limit=20`, config);
      return response.data.notifications;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { getState, rejectWithValue }) => {
    const config = getAuthConfig(getState);
    try {
      const response = await axios.get('/api/notifications/unread-count', config);
      return response.data.unreadCount;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch unread count');
    }
  }
);

export const readAllNotifications = createAsyncThunk(
  'notifications/readAll',
  async (_, { getState, rejectWithValue }) => {
    const config = getAuthConfig(getState);
    try {
      await axios.put('/api/notifications/read-all', {}, config);
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark all as read');
    }
  }
);

export const readSingleNotification = createAsyncThunk(
  'notifications/readSingle',
  async (id, { getState, rejectWithValue }) => {
    const config = getAuthConfig(getState);
    try {
      const response = await axios.put(`/api/notifications/${id}/read`, {}, config);
      return response.data.notification;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to read notification');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    receiveNotification: (state, action) => {
      // Avoid duplicate notifications in array
      const exists = state.notifications.some(n => n._id === action.payload._id);
      if (!exists) {
        state.notifications.unshift(action.payload);
        state.unreadCount += 1;
      }
    },
    resetNotificationState: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch unread count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      // Read all
      .addCase(readAllNotifications.fulfilled, (state) => {
        state.notifications = state.notifications.map(n => ({ ...n, isRead: true }));
        state.unreadCount = 0;
      })
      // Read single
      .addCase(readSingleNotification.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(n => n._id === action.payload._id);
        if (index !== -1) {
          state.notifications[index] = action.payload;
        }
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      });
  },
});

export const { receiveNotification, resetNotificationState } = notificationSlice.actions;
export default notificationSlice.reducer;
