import { io } from 'socket.io-client';
import store from '../redux/store';
import { 
  receiveNewMessage, 
  updateOnlineUsers, 
  setPartnerTyping, 
  setMessagesReadLocal 
} from '../redux/slices/chatSlice';
import { receiveNotification } from '../redux/slices/notificationSlice';

let socket = null;

export const connectSocket = (token) => {
  if (socket) return socket;

  
  socket = io(import.meta.env.VITE_API_URL || window.location.origin, {
    auth: { token: `Bearer ${token}` },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('🔌 Connected to Socket.IO Server');
  });

  
  socket.on('user_status', (data) => {
    store.dispatch(updateOnlineUsers(data));
  });

  
  socket.on('new_message', (message) => {
    store.dispatch(receiveNewMessage(message));
  });

  
  socket.on('messages_read', (data) => {
    store.dispatch(setMessagesReadLocal(data));
  });

  
  socket.on('typing', (data) => {
    store.dispatch(setPartnerTyping({ userId: data.senderId, isTyping: true }));
  });

  socket.on('stop_typing', (data) => {
    store.dispatch(setPartnerTyping({ userId: data.senderId, isTyping: false }));
  });

  
  socket.on('new_notification', (notification) => {
    store.dispatch(receiveNotification(notification));
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 Disconnected from Socket.IO Server');
  }
};

export const getSocket = () => socket;
export default { connectSocket, disconnectSocket, getSocket };
