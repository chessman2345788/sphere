import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import feedReducer from './slices/feedSlice';
import chatReducer from './slices/chatSlice';
import notificationReducer from './slices/notificationSlice';
import adminReducer from './slices/adminSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    feed: feedReducer,
    chat: chatReducer,
    notifications: notificationReducer,
    admin: adminReducer,
  },
});

export default store;
