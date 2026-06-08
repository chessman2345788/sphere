import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeed, createPost, fetchTrendingPosts, resetFeedState } from '../redux/slices/feedSlice';
import PostCard from '../components/PostCard';
import { Image, Video, Sparkles, X, Plus, AlertCircle, FileVideo, FileImage } from 'lucide-react';
import toast from 'react-hot-toast';

const FeedPage = () => {
  const { posts, trendingPosts, isLoading, hasMore, page } = useSelector((state) => state.feed);
  const dispatch = useDispatch();

  const [postText, setPostText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [fileType, setFileType] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [creating, setCreating] = useState(false);

  const fileInputRef = useRef(null);

  // Fetch initial feed and trending posts
  useEffect(() => {
    dispatch(resetFeedState());
    dispatch(fetchFeed(1));
    dispatch(fetchTrendingPosts());
  }, [dispatch]);

  // Handle file selections
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const processFile = (file) => {
    if (!file) return;

    // Validate size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      return toast.error('File exceeds the 20MB size limit');
    }

    const type = file.type.startsWith('video/') ? 'video' : 'image';
    setFileType(type);
    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Drag & drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview('');
    setFileType('');
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postText.trim() && !selectedFile) {
      return toast.error('Post cannot be empty');
    }

    setCreating(true);
    const formData = new FormData();
    formData.append('content', postText);
    if (selectedFile) {
      formData.append('media', selectedFile);
    }

    try {
      await dispatch(createPost(formData)).unwrap();
      toast.success('Post created successfully!');
      setPostText('');
      clearSelectedFile();
    } catch (err) {
      toast.error(err || 'Failed to create post');
    } finally {
      setCreating(false);
    }
  };

  const loadMorePosts = () => {
    if (!isLoading && hasMore) {
      dispatch(fetchFeed(page + 1));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Main Social Feed */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Post Creation Box */}
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`bg-white dark:bg-dark-800 rounded-2xl border ${
            isDragActive 
              ? 'border-brand-500 bg-brand-50/10 dark:bg-brand-900/5' 
              : 'border-slate-100 dark:border-dark-700'
          } p-5 shadow-sm transition-all`}
        >
          <form onSubmit={handleCreatePost}>
            <div className="flex gap-4">
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="What is on your mind today? Highlight topics with #hashtags..."
                rows={3}
                className="flex-grow bg-transparent border-none outline-none resize-none text-sm placeholder-slate-400 dark:text-slate-200"
              />
            </div>

            {/* Media Upload Preview Panel */}
            {filePreview && (
              <div className="relative mt-4 rounded-xl overflow-hidden max-h-60 border border-slate-100 dark:border-dark-700 bg-slate-50 dark:bg-dark-900">
                <button
                  type="button"
                  onClick={clearSelectedFile}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white z-10 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                {fileType === 'video' ? (
                  <video src={filePreview} controls className="w-full h-full object-cover" />
                ) : (
                  <img src={filePreview} alt="Upload Preview" className="w-full h-full object-cover" />
                )}
              </div>
            )}

            {/* Creation Toolbar controls */}
            <div className="flex items-center justify-between border-t border-slate-50 dark:border-dark-700/50 pt-4 mt-4">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/20 text-xs font-semibold transition-colors"
                >
                  <Image className="h-4 w-4" />
                  <span>Media</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={creating || (!postText.trim() && !selectedFile)}
                className="px-5 py-2 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md gradient-glow hover-scale transition-all"
              >
                {creating ? 'Sharing...' : 'Share Post'}
              </button>
            </div>
          </form>
        </div>

        {/* Feed Posts List */}
        <div className="space-y-4">
          {posts.length === 0 && !isLoading ? (
            <div className="text-center py-12 bg-white dark:bg-dark-800 rounded-2xl border border-slate-100 dark:border-dark-700 p-6">
              <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 dark:text-slate-200">Your feed is empty</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Follow other creators or post your own content to populate your feed!
              </p>
            </div>
          ) : (
            posts.map((post) => <PostCard key={post._id} post={post} />)
          )}

          {/* Loading Skeletons */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div key={n} className="bg-white dark:bg-dark-800 rounded-2xl border border-slate-100 dark:border-dark-700 p-5 space-y-4">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-xl shimmer"></div>
                    <div className="space-y-2 flex-grow">
                      <div className="h-3 w-1/4 rounded shimmer"></div>
                      <div className="h-2.5 w-1/6 rounded shimmer"></div>
                    </div>
                  </div>
                  <div className="h-14 rounded shimmer"></div>
                </div>
              ))}
            </div>
          )}

          {/* Infinite Scroll trigger button */}
          {hasMore && !isLoading && (
            <button
              onClick={loadMorePosts}
              className="w-full py-3 bg-white dark:bg-dark-800 hover:bg-slate-50 dark:hover:bg-dark-700 border border-slate-100 dark:border-dark-700 rounded-2xl font-semibold text-xs text-brand-500 transition-colors"
            >
              Load More Posts
            </button>
          )}
        </div>
      </div>

      {/* Sidebar widgets panel */}
      <div className="space-y-6">
        
        {/* Redis Trending Posts widget */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-slate-100 dark:border-dark-700 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4.5 w-4.5 text-brand-500" />
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Trending on Sphere
            </h3>
          </div>

          <div className="space-y-3">
            {trendingPosts.length === 0 ? (
              <p className="text-xs text-slate-400">No trending posts in the last 7 days.</p>
            ) : (
              trendingPosts.map((post, idx) => (
                <div key={post._id} className="flex gap-3 text-xs items-start border-b border-slate-50 dark:border-dark-700/30 pb-3 last:border-b-0 last:pb-0">
                  <span className="font-extrabold text-brand-500">#{idx + 1}</span>
                  <div>
                    <p className="text-slate-600 dark:text-slate-300 font-medium line-clamp-2">
                      {post.content}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      by @{post.author?.username}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default FeedPage;
