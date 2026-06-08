const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const { subscriber, publisher } = require('./redis');

let io = null;
const activeUsers = new Map(); // userId -> set of socketIds (handles multiple tabs)

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Send real-time notification to a specific user (locally or via Redis Pub/Sub)
const sendRealtimeNotification = (recipientId, notificationData) => {
  // Publish to Redis Pub/Sub so all server instances get it
  const messagePayload = JSON.stringify({ recipientId, data: notificationData });
  publisher.publish('notifications', messagePayload);
};

// Send real-time message to a specific user (locally or via Redis Pub/Sub)
const sendRealtimeChat = (recipientId, chatData) => {
  const messagePayload = JSON.stringify({ recipientId, data: chatData });
  publisher.publish('chats', messagePayload);
};

const initializeSocket = (server) => {
  io = socketio(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // JWT auth middleware for Socket.IO
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }
      
      const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
      const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET || 'supersecretjwtkey123!');
      socket.user = decoded; // Contains id, username, role
      next();
    } catch (err) {
      console.warn('Socket connection rejected:', err.message);
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`🔌 Socket connected: User ${userId} (${socket.user.username}) [Socket: ${socket.id}]`);

    // Add user to active tracking map
    if (!activeUsers.has(userId)) {
      activeUsers.set(userId, new Set());
    }
    activeUsers.get(userId).add(socket.id);

    // Broadcast online status to all users
    io.emit('user_status', { userId, status: 'online' });

    // Handle joining room for personal messages/notifications
    socket.join(userId);

    // Typing Indicators
    socket.on('typing', (data) => {
      // data: { receiverId }
      if (data && data.receiverId) {
        socket.to(data.receiverId).emit('typing', { senderId: userId });
      }
    });

    socket.on('stop_typing', (data) => {
      // data: { receiverId }
      if (data && data.receiverId) {
        socket.to(data.receiverId).emit('stop_typing', { senderId: userId });
      }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      const sockets = activeUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          activeUsers.delete(userId);
          // Broadcast offline status to all users after small delay (to prevent flicker during page refresh)
          setTimeout(() => {
            if (!activeUsers.has(userId)) {
              io.emit('user_status', { userId, status: 'offline' });
            }
          }, 3000);
        }
      }
    });
  });

  // Subscribe to Redis Notification and Chat channels for cross-instance communication
  subscriber.subscribe('notifications');
  subscriber.subscribe('chats');

  subscriber.on('message', (channel, message) => {
    try {
      const payload = JSON.parse(message);
      const { recipientId, data } = payload;

      // If user is connected to THIS server instance, emit the event
      if (activeUsers.has(recipientId)) {
        if (channel === 'notifications') {
          io.to(recipientId).emit('new_notification', data);
        } else if (channel === 'chats') {
          io.to(recipientId).emit('new_message', data);
        }
      }
    } catch (err) {
      console.error('Error handling Redis pub/sub socket message:', err);
    }
  });

  return io;
};

// Check if a user is currently online
const isUserOnline = (userId) => {
  return activeUsers.has(userId.toString());
};

module.exports = {
  initializeSocket,
  getIO,
  sendRealtimeNotification,
  sendRealtimeChat,
  isUserOnline,
  activeUsers,
};
