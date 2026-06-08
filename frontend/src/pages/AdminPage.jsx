import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminUsers, updateRoleAdmin, deleteUserAdmin, deletePostAdmin } from '../redux/slices/adminSlice';
import { Trash2, UserCheck, ShieldCheck, ShieldAlert, Sparkles, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AdminPage = () => {
  const { users, page, totalPages, isLoading } = useSelector((state) => state.admin);
  const { user: currentUser } = useSelector((state) => state.auth);
  
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'content'
  const [moderationPosts, setModerationPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    dispatch(fetchAdminUsers(1));
    fetchSystemStats();
  }, [dispatch]);

  useEffect(() => {
    if (activeTab === 'content') {
      fetchRecentPosts();
    }
  }, [activeTab]);

  const fetchSystemStats = async () => {
    try {
      const res = await api.get('/api/analytics/dashboard');
      setStats(res.data.analytics);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecentPosts = async () => {
    setPostsLoading(true);
    try {
      // Get trending or recent posts using post feed (since admins are authorized, we'll fetch general feed/search)
      const res = await api.get('/api/posts/feed?page=1&limit=30');
      setModerationPosts(res.data.posts);
    } catch (err) {
      toast.error('Failed to load posts for moderation');
    } finally {
      setPostsLoading(false);
    }
  };

  const handleRoleToggle = (user) => {
    const targetRole = user.role === 'admin' ? 'user' : 'admin';
    if (user._id === currentUser.id) {
      return toast.error('You cannot change your own administrator role');
    }

    if (window.confirm(`Change role of @${user.username} to ${targetRole}?`)) {
      dispatch(updateRoleAdmin({ userId: user._id, role: targetRole }))
        .unwrap()
        .then(() => {
          toast.success(`Updated role to ${targetRole}`);
          dispatch(fetchAdminUsers(page)); // Reload
        })
        .catch((err) => toast.error(err || 'Failed to update role'));
    }
  };

  const handleDeleteUser = (userId, username) => {
    if (userId === currentUser.id) {
      return toast.error('You cannot delete your own admin account');
    }

    if (window.confirm(`⚠️ WARNING: Are you sure you want to delete @${username} and purge all their posts, comments, messages, and files? This cannot be undone.`)) {
      dispatch(deleteUserAdmin(userId))
        .unwrap()
        .then(() => {
          toast.success('User profile purged successfully');
          dispatch(fetchAdminUsers(page)); // Reload
          fetchSystemStats(); // Update totals
        })
        .catch((err) => toast.error(err || 'Failed to purge user'));
    }
  };

  const handleDeletePost = (postId) => {
    if (window.confirm('Delete this post for violating platform policies?')) {
      dispatch(deletePostAdmin(postId))
        .unwrap()
        .then(() => {
          toast.success('Post removed by administrator');
          setModerationPosts(moderationPosts.filter(p => p._id !== postId));
          fetchSystemStats(); // Update totals
        })
        .catch((err) => toast.error(err || 'Failed to delete post'));
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      dispatch(fetchAdminUsers(newPage));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Platform Summary widgets */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-100 dark:border-dark-700 p-5 shadow-sm flex items-center gap-4 transition-colors">
            <div className="p-3 bg-brand-50 dark:bg-brand-950/20 text-brand-500 rounded-2xl">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-0.5">Platform Users</span>
              <span className="text-lg font-black dark:text-slate-100">{stats.totalUsers} profiles</span>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-100 dark:border-dark-700 p-5 shadow-sm flex items-center gap-4 transition-colors">
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-2xl">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-0.5">Total Posts</span>
              <span className="text-lg font-black dark:text-slate-100">{stats.totalPosts} posts</span>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-100 dark:border-dark-700 p-5 shadow-sm flex items-center gap-4 transition-colors">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-2xl">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-0.5">Moderator Level</span>
              <span className="text-sm font-black text-emerald-500 uppercase">Administrator</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-100 dark:border-dark-700 flex gap-4 text-xs font-bold uppercase tracking-wider pb-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 border-b-2 px-2 transition-all ${
            activeTab === 'users'
              ? 'border-brand-500 text-brand-500'
              : 'border-transparent text-slate-450 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          Users Management
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`pb-3 border-b-2 px-2 transition-all ${
            activeTab === 'content'
              ? 'border-brand-500 text-brand-500'
              : 'border-transparent text-slate-450 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          Content Moderation
        </button>
      </div>

      {/* Tab Panel: Users Management */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-100 dark:border-dark-700 p-5 shadow-sm transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-500 dark:text-slate-400">
              <thead>
                <tr className="border-b border-slate-100 dark:border-dark-700 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 font-semibold">User Profile</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold text-center">Role</th>
                  <th className="pb-3 font-semibold text-center">Posts</th>
                  <th className="pb-3 font-semibold">Registered</th>
                  <th className="pb-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-dark-700/50">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-brand-500 mx-auto"></div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center">No platform profiles registered.</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-dark-700/20">
                      <td className="py-3 flex items-center gap-2.5">
                        <img src={u.avatar} alt="" className="h-8 w-8 rounded-lg object-cover" />
                        <div>
                          <span className="font-bold dark:text-slate-200 block">{u.name}</span>
                          <span className="text-[10px] text-slate-400">@{u.username}</span>
                        </div>
                      </td>
                      <td className="py-3 dark:text-slate-305">{u.email}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                          u.role === 'admin' 
                            ? 'bg-red-50 text-red-500 dark:bg-red-950/20' 
                            : 'bg-slate-100 text-slate-600 dark:bg-dark-700 dark:text-slate-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 text-center font-semibold dark:text-slate-200">{u.postsCount}</td>
                      <td className="py-3">
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleRoleToggle(u)}
                            title="Toggle user/admin role"
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-dark-700 dark:hover:text-slate-200"
                          >
                            {u.role === 'admin' ? <ShieldAlert className="h-4 w-4 text-red-400" /> : <ShieldCheck className="h-4 w-4 text-brand-500" />}
                          </button>
                          
                          <button
                            onClick={() => handleDeleteUser(u._id, u.username)}
                            title="Purge user profile"
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-50 dark:border-dark-700/50">
              <button
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className="px-3 py-1.5 text-[11px] font-bold bg-slate-50 hover:bg-slate-100 dark:bg-dark-700 dark:hover:bg-dark-600 dark:text-slate-200 disabled:opacity-40 rounded-lg transition-colors"
              >
                Previous
              </button>
              <span className="text-xs text-slate-400 font-medium">Page {page} of {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="px-3 py-1.5 text-[11px] font-bold bg-slate-50 hover:bg-slate-100 dark:bg-dark-700 dark:hover:bg-dark-600 dark:text-slate-200 disabled:opacity-40 rounded-lg transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab Panel: Content Moderation */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          {postsLoading ? (
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-100 dark:border-dark-700 p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500 mx-auto"></div>
            </div>
          ) : moderationPosts.length === 0 ? (
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-100 dark:border-dark-700 p-6 text-center text-xs text-slate-400">
              No recent feed activities to display.
            </div>
          ) : (
            moderationPosts.map((post) => (
              <div key={post._id} className="bg-white dark:bg-dark-800 rounded-2xl border border-slate-100 dark:border-dark-700 p-4 shadow-sm flex items-start justify-between gap-4 transition-colors">
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <img src={post.author?.avatar} alt="" className="h-6 w-6 rounded-lg object-cover" />
                    <span className="text-xs font-bold dark:text-slate-200">{post.author?.name}</span>
                    <span className="text-[10px] text-slate-400">@{post.author?.username}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-350 line-clamp-3 leading-relaxed">
                    {post.content}
                  </p>
                  {post.media?.url && (
                    <span className="text-[10px] text-brand-500 font-semibold mt-1 block">
                      📎 Has attached {post.media.type}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleDeletePost(post._id)}
                  title="Remove post"
                  className="p-2 bg-red-50 text-red-500 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-all"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};

export default AdminPage;
