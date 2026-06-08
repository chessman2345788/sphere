import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  users: [],
  page: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
};

const getAuthConfig = (getState) => {
  const { auth } = getState();
  return {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  };
};

export const fetchAdminUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (page = 1, { getState, rejectWithValue }) => {
    const config = getAuthConfig(getState);
    try {
      const response = await axios.get(`/api/admin/users?page=${page}&limit=10`, config);
      return { users: response.data.users, page, totalPages: response.data.totalPages };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch admin users');
    }
  }
);

export const updateRoleAdmin = createAsyncThunk(
  'admin/updateRole',
  async ({ userId, role }, { getState, rejectWithValue }) => {
    const config = getAuthConfig(getState);
    try {
      const response = await axios.put(`/api/admin/users/${userId}/role`, { role }, config);
      return { userId, role: response.data.user.role };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user role');
    }
  }
);

export const deleteUserAdmin = createAsyncThunk(
  'admin/deleteUser',
  async (userId, { getState, rejectWithValue }) => {
    const config = getAuthConfig(getState);
    try {
      await axios.delete(`/api/admin/users/${userId}`, config);
      return userId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
    }
  }
);

export const deletePostAdmin = createAsyncThunk(
  'admin/deletePost',
  async (postId, { getState, rejectWithValue }) => {
    const config = getAuthConfig(getState);
    try {
      await axios.delete(`/api/admin/posts/${postId}`, config);
      return postId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete post');
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchAdminUsers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.users;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update User Role
      .addCase(updateRoleAdmin.fulfilled, (state, action) => {
        const user = state.users.find(u => u._id === action.payload.userId);
        if (user) {
          user.role = action.payload.role;
        }
      })
      // Delete User
      .addCase(deleteUserAdmin.fulfilled, (state, action) => {
        state.users = state.users.filter(u => u._id !== action.payload);
      });
  },
});

export default adminSlice.reducer;
