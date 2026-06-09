import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  posts: [],
  trendingPosts: [],
  bookmarks: [],
  hasMore: true,
  page: 1,
  isLoading: false,
  error: null,
};


const getAuthConfig = (getState) => {
  const { auth } = getState();
  return {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  };
};

export const fetchFeed = createAsyncThunk(
  'feed/fetchFeed',
  async (page = 1, { getState, rejectWithValue }) => {
    const config = getAuthConfig(getState);
    try {
      const response = await axios.get(`/api/posts/feed?page=${page}&limit=10`, config);
      return { posts: response.data.posts, page, totalPages: response.data.totalPages };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch feed');
    }
  }
);

export const createPost = createAsyncThunk(
  'feed/createPost',
  async (formData, { getState, rejectWithValue }) => {
    const { auth } = getState();
    try {
      const response = await axios.post('/api/posts', formData, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.post;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create post');
    }
  }
);

export const likePost = createAsyncThunk(
  'feed/likePost',
  async (postId, { getState, rejectWithValue }) => {
    const config = getAuthConfig(getState);
    try {
      const response = await axios.post(`/api/posts/${postId}/like`, {}, config);
      return { postId, likes: response.data.likes };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to like post');
    }
  }
);

export const repostPost = createAsyncThunk(
  'feed/repost',
  async ({ postId, content }, { getState, rejectWithValue }) => {
    const config = getAuthConfig(getState);
    try {
      const response = await axios.post(`/api/posts/${postId}/share`, { content }, config);
      return response.data.post;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reshare post');
    }
  }
);

export const toggleBookmark = createAsyncThunk(
  'feed/bookmark',
  async (postId, { getState, rejectWithValue }) => {
    const config = getAuthConfig(getState);
    try {
      const response = await axios.post(`/api/posts/${postId}/bookmark`, {}, config);
      return { postId, savedPosts: response.data.savedPosts };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to bookmark post');
    }
  }
);

export const fetchBookmarks = createAsyncThunk(
  'feed/fetchBookmarks',
  async (_, { getState, rejectWithValue }) => {
    const config = getAuthConfig(getState);
    try {
      const response = await axios.get('/api/posts/bookmarks', config);
      return response.data.bookmarks;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookmarks');
    }
  }
);

export const fetchTrendingPosts = createAsyncThunk(
  'feed/fetchTrending',
  async (_, { getState, rejectWithValue }) => {
    const config = getAuthConfig(getState);
    try {
      const response = await axios.get('/api/posts/trending', config);
      return response.data.posts;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch trending posts');
    }
  }
);

export const deletePost = createAsyncThunk(
  'feed/deletePost',
  async (postId, { getState, rejectWithValue }) => {
    const config = getAuthConfig(getState);
    try {
      await axios.delete(`/api/posts/${postId}`, config);
      return postId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete post');
    }
  }
);

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    incrementCommentCount: (state, action) => {
      const post = state.posts.find((p) => p._id === action.payload);
      if (post) post.commentsCount += 1;
    },
    decrementCommentCount: (state, action) => {
      
      const post = state.posts.find((p) => p._id === action.payload.postId);
      if (post) post.commentsCount = Math.max(0, post.commentsCount - action.payload.count);
    },
    resetFeedState: (state) => {
      state.posts = [];
      state.page = 1;
      state.hasMore = true;
    }
  },
  extraReducers: (builder) => {
    builder
      
      .addCase(fetchFeed.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.isLoading = false;
        const { posts, page, totalPages } = action.payload;
        if (page === 1) {
          state.posts = posts;
        } else {
          
          const existingIds = new Set(state.posts.map(p => p._id));
          const uniquePosts = posts.filter(p => !existingIds.has(p._id));
          state.posts = [...state.posts, ...uniquePosts];
        }
        state.page = page;
        state.hasMore = page < totalPages;
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      .addCase(createPost.fulfilled, (state, action) => {
        state.posts.unshift(action.payload);
      })
      
      .addCase(likePost.fulfilled, (state, action) => {
        const post = state.posts.find(p => p._id === action.payload.postId);
        if (post) {
          post.likes = action.payload.likes;
        }
        const trendingPost = state.trendingPosts.find(p => p._id === action.payload.postId);
        if (trendingPost) {
          trendingPost.likes = action.payload.likes;
        }
      })
      
      .addCase(repostPost.fulfilled, (state, action) => {
        state.posts.unshift(action.payload);
      })
      
      .addCase(fetchBookmarks.fulfilled, (state, action) => {
        state.bookmarks = action.payload;
      })
      
      .addCase(fetchTrendingPosts.fulfilled, (state, action) => {
        state.trendingPosts = action.payload;
      })
      
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter(p => p._id !== action.payload);
        state.trendingPosts = state.trendingPosts.filter(p => p._id !== action.payload);
      });
  },
});

export const { incrementCommentCount, decrementCommentCount, resetFeedState } = feedSlice.actions;
export default feedSlice.reducer;
