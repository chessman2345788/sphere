import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  chats: [],
  activeChatPartner: null,
  messages: [],
  onlineUsers: [], 
  typingUsers: [], 
  isLoading: false,
  error: null,
};

const getAuthConfig = (getState) => {
  const { auth } = getState();
  return {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  };
};

export const fetchChatsList = createAsyncThunk(
  'chat/fetchChatsList',
  async (_, { getState, rejectWithValue }) => {
    const config = getAuthConfig(getState);
    try {
      const response = await axios.get('/api/chat/list', config);
      return response.data.chats;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch chats');
    }
  }
);

export const fetchMessageHistory = createAsyncThunk(
  'chat/fetchMessageHistory',
  async ({ userId, page = 1 }, { getState, rejectWithValue }) => {
    const config = getAuthConfig(getState);
    try {
      const response = await axios.get(`/api/chat/history/${userId}?page=${page}&limit=30`, config);
      return { messages: response.data.messages, page };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch message history');
    }
  }
);

export const sendDirectMessage = createAsyncThunk(
  'chat/sendMessage',
  async (formData, { getState, rejectWithValue }) => {
    const { auth } = getState();
    try {
      const response = await axios.post('/api/chat/message', formData, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.message;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const markChatAsRead = createAsyncThunk(
  'chat/markAsRead',
  async (partnerId, { getState, rejectWithValue }) => {
    const config = getAuthConfig(getState);
    try {
      await axios.post(`/api/chat/read/${partnerId}`, {}, config);
      return partnerId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark chat as read');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChatPartner: (state, action) => {
      state.activeChatPartner = action.payload;
      state.messages = []; 
    },
    receiveNewMessage: (state, action) => {
      const msg = action.payload;
      const currentUserId = msg.receiver._id || msg.receiver;
      const senderId = msg.sender._id || msg.sender;
      
      
      const partnerId = senderId === state.activeChatPartner?._id ? senderId : currentUserId;
      
      
      if (state.activeChatPartner && 
          (senderId === state.activeChatPartner._id || receiverIdMatches(msg, state.activeChatPartner._id))) {
        state.messages.push(msg);
      }

      
      function receiverIdMatches(message, activeId) {
        const rId = message.receiver?._id || message.receiver;
        return rId === activeId;
      }

      
      const otherUserId = senderId === currentUserId ? (msg.receiver._id || msg.receiver) : senderId;
      const chatIndex = state.chats.findIndex(c => c.partner._id === otherUserId);

      if (chatIndex !== -1) {
        
        const updatedChat = {
          ...state.chats[chatIndex],
          lastMessage: msg,
          unreadCount: state.activeChatPartner?._id === otherUserId ? 0 : state.chats[chatIndex].unreadCount + (senderId !== currentUserId ? 1 : 0),
        };
        state.chats.splice(chatIndex, 1);
        state.chats.unshift(updatedChat);
      } else {
        
        state.chats.unshift({
          partner: senderId === currentUserId ? msg.receiver : msg.sender,
          lastMessage: msg,
          unreadCount: senderId !== currentUserId ? 1 : 0,
        });
      }
    },
    updateOnlineUsers: (state, action) => {
      
      const { userId, status } = action.payload;
      if (status === 'online') {
        if (!state.onlineUsers.includes(userId)) {
          state.onlineUsers.push(userId);
        }
      } else {
        state.onlineUsers = state.onlineUsers.filter(id => id !== userId);
      }
    },
    setOnlineUsersList: (state, action) => {
      state.onlineUsers = action.payload;
    },
    setPartnerTyping: (state, action) => {
      
      const { userId, isTyping } = action.payload;
      if (isTyping) {
        if (!state.typingUsers.includes(userId)) state.typingUsers.push(userId);
      } else {
        state.typingUsers = state.typingUsers.filter(id => id !== userId);
      }
    },
    setMessagesReadLocal: (state, action) => {
      
      if (state.activeChatPartner && state.activeChatPartner._id === action.payload.readerId) {
        state.messages = state.messages.map(m => ({ ...m, isRead: true }));
      }
    }
  },
  extraReducers: (builder) => {
    builder
      
      .addCase(fetchChatsList.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchChatsList.fulfilled, (state, action) => {
        state.isLoading = false;
        state.chats = action.payload;
      })
      .addCase(fetchChatsList.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      .addCase(fetchMessageHistory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMessageHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        const { messages, page } = action.payload;
        if (page === 1) {
          state.messages = messages;
        } else {
          state.messages = [...messages, ...state.messages];
        }
      })
      
      .addCase(sendDirectMessage.fulfilled, (state, action) => {
        const msg = action.payload;
        state.messages.push(msg);
        
        
        const partnerId = msg.receiver._id || msg.receiver;
        const chatIndex = state.chats.findIndex(c => c.partner._id === partnerId);
        
        if (chatIndex !== -1) {
          const updatedChat = { ...state.chats[chatIndex], lastMessage: msg };
          state.chats.splice(chatIndex, 1);
          state.chats.unshift(updatedChat);
        }
      })
      
      .addCase(markChatAsRead.fulfilled, (state, action) => {
        const partnerId = action.payload;
        const chatIndex = state.chats.findIndex(c => c.partner._id === partnerId);
        if (chatIndex !== -1) {
          state.chats[chatIndex].unreadCount = 0;
        }
      });
  },
});

export const { 
  setActiveChatPartner, 
  receiveNewMessage, 
  updateOnlineUsers, 
  setOnlineUsersList, 
  setPartnerTyping, 
  setMessagesReadLocal 
} = chatSlice.actions;

export default chatSlice.reducer;
