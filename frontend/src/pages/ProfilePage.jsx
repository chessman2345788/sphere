import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { MapPin, Briefcase, Heart, MessageSquare, Award, CheckCircle, Edit3, X, Users, BookOpen, Camera } from 'lucide-react';
import { updateUserProfile } from '../redux/slices/authSlice';
import PostCard from '../components/PostCard';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { username } = useParams();
  const { user: currentUser } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [profilePosts, setProfilePosts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editInterests, setEditInterests] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [modalUsersList, setModalUsersList] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      
      const profileRes = await api.get(`/api/users/profile/${username}`);
      setProfile(profileRes.data.profile);

      
      setEditName(profileRes.data.profile.name || '');
      setEditBio(profileRes.data.profile.bio || '');
      setEditLocation(profileRes.data.profile.location || '');
      setEditSkills(profileRes.data.profile.skills?.join(', ') || '');
      setEditInterests(profileRes.data.profile.interests?.join(', ') || '');

      
      const postsRes = await api.get(`/api/posts/user/${username}`);
      setProfilePosts(postsRes.data.posts);

      
      if (profileRes.data.profile._id === currentUser.id) {
        const analyticsRes = await api.get('/api/users/profile-analytics');
        setAnalytics(analyticsRes.data.analytics);
      } else {
        setAnalytics(null);
      }
    } catch (err) {
      toast.error('Failed to load profile');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [username, currentUser.id]);

  const handleFollowToggle = async () => {
    try {
      if (profile.isFollowing) {
        await api.post(`/api/users/unfollow/${profile._id}`);
        setProfile({
          ...profile,
          isFollowing: false,
          followersCount: profile.followersCount - 1,
        });
        toast.success(`Unfollowed @${profile.username}`);
      } else {
        await api.post(`/api/users/follow/${profile._id}`);
        setProfile({
          ...profile,
          isFollowing: true,
          followersCount: profile.followersCount + 1,
        });
        toast.success(`Followed @${profile.username}`);
      }
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', editName);
    formData.append('bio', editBio);
    formData.append('location', editLocation);
    
    
    const skillsArr = editSkills.split(',').map((s) => s.trim()).filter(Boolean);
    const interestsArr = editInterests.split(',').map((i) => i.trim()).filter(Boolean);
    formData.append('skills', JSON.stringify(skillsArr));
    formData.append('interests', JSON.stringify(interestsArr));

    if (avatarFile) formData.append('avatar', avatarFile);
    if (coverFile) formData.append('coverImage', coverFile);

    try {
      const resultAction = await dispatch(updateUserProfile(formData));
      if (updateUserProfile.fulfilled.match(resultAction)) {
        toast.success('Profile updated successfully');
        setIsEditing(false);
        fetchProfileData(); 
      } else {
        toast.error(resultAction.payload || 'Failed to update profile');
      }
    } catch (err) {
      toast.error('Failed to save changes');
    }
  };

  const loadFollowersList = async (type) => {
    setModalLoading(true);
    try {
      const res = await api.get(`/api/users/${username}/${type}`);
      setModalUsersList(type === 'followers' ? res.data.followers : res.data.following);
    } catch (err) {
      toast.error('Failed to load users list');
    } finally {
      setModalLoading(false);
    }
  };

  const openFollowers = () => {
    setShowFollowersModal(true);
    loadFollowersList('followers');
  };

  const openFollowing = () => {
    setShowFollowingModal(true);
    loadFollowersList('following');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-48 bg-slate-200 dark:bg-dark-800 rounded-3xl shimmer"></div>
        <div className="flex gap-4">
          <div className="h-24 w-24 rounded-2xl shimmer -mt-12 ml-6"></div>
          <div className="space-y-2 mt-4 flex-grow">
            <div className="h-4 w-1/4 rounded shimmer"></div>
            <div className="h-3 w-1/6 rounded shimmer"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const isMe = profile._id === currentUser.id;

  return (
    <div className="space-y-6">
      
      
      <div className="bg-white dark:bg-dark-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-dark-700 shadow-sm relative transition-colors">
        
        
        <div className="h-48 bg-slate-100 dark:bg-dark-900 relative">
          {profile.coverImage ? (
            <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full gradient-brand opacity-80"></div>
          )}
        </div>

        
        <div className="px-6 pb-6 relative">
          
          <div className="absolute -top-16 left-6 h-28 w-28 rounded-2xl border-4 border-white dark:border-dark-800 overflow-hidden bg-slate-100 shadow-lg">
            <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-14 mb-4 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">{profile.name}</h1>
                {profile.role === 'admin' && (
                  <CheckCircle className="h-5 w-5 text-brand-500 fill-brand-500/20" />
                )}
              </div>
              <p className="text-xs text-slate-400">@{profile.username}</p>
            </div>

            
            <div className="flex gap-2.5">
              {isMe ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-dark-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleFollowToggle}
                    className={`px-5 py-2 text-xs font-bold rounded-xl shadow-md transition-colors ${
                      profile.isFollowing
                        ? 'bg-slate-100 dark:bg-dark-700 text-slate-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500'
                        : 'bg-brand-500 hover:bg-brand-600 text-white gradient-glow hover-scale'
                    }`}
                  >
                    {profile.isFollowing ? 'Following' : 'Follow'}
                  </button>

                  <button
                    onClick={() => {
                      
                      navigate('/chat');
                    }}
                    className="px-4 py-2 border border-slate-200 dark:border-dark-600 text-slate-600 dark:text-slate-350 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-dark-700 transition-colors"
                  >
                    Message
                  </button>
                </>
              )}
            </div>
          </div>

          
          {profile.bio && (
            <p className="text-sm text-slate-600 dark:text-slate-350 max-w-2xl mb-4 leading-relaxed whitespace-pre-line">
              {profile.bio}
            </p>
          )}

          
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            {profile.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>{profile.location}</span>
              </div>
            )}
            
            <button onClick={openFollowers} className="flex items-center gap-1.5 hover:text-brand-500 hover:underline">
              <Users className="h-4 w-4" />
              <span>
                <strong className="text-slate-700 dark:text-slate-200">{profile.followersCount}</strong> Followers
              </span>
            </button>

            <button onClick={openFollowing} className="flex items-center gap-1.5 hover:text-brand-500 hover:underline">
              <Users className="h-4 w-4" />
              <span>
                <strong className="text-slate-700 dark:text-slate-200">{profile.followingCount}</strong> Following
              </span>
            </button>
          </div>
        </div>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        
        <div className="space-y-6">
          
          
          {isMe && analytics && (
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-100 dark:border-dark-700 p-5 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-2">
                My Dashboard Overview
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-dark-900 p-3.5 rounded-2xl">
                  <span className="block text-[10px] text-slate-450 dark:text-slate-400 uppercase font-semibold">Total Posts</span>
                  <span className="text-lg font-black dark:text-slate-100">{analytics.totalPosts}</span>
                </div>
                <div className="bg-slate-50 dark:bg-dark-900 p-3.5 rounded-2xl">
                  <span className="block text-[10px] text-slate-450 dark:text-slate-400 uppercase font-semibold">Total Likes</span>
                  <span className="text-lg font-black text-red-500">{analytics.totalLikes}</span>
                </div>
                <div className="bg-slate-50 dark:bg-dark-900 p-3.5 rounded-2xl">
                  <span className="block text-[10px] text-slate-450 dark:text-slate-400 uppercase font-semibold">Comments</span>
                  <span className="text-lg font-black text-blue-500">{analytics.totalComments}</span>
                </div>
                <div className="bg-slate-50 dark:bg-dark-900 p-3.5 rounded-2xl">
                  <span className="block text-[10px] text-slate-450 dark:text-slate-400 uppercase font-semibold">Engagement</span>
                  <span className="text-lg font-black text-brand-500">{analytics.engagementRate}%</span>
                </div>
              </div>
            </div>
          )}

          
          {profile.skills?.length > 0 && (
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-100 dark:border-dark-700 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-4.5 w-4.5 text-brand-500" />
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  Professional Skills
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 bg-slate-50 dark:bg-dark-900 text-slate-650 dark:text-slate-300 text-[11px] rounded-lg border border-slate-100 dark:border-dark-700/50"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          
          {profile.interests?.length > 0 && (
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-100 dark:border-dark-700 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4.5 w-4.5 text-indigo-500" />
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  Interests
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-2.5 py-1 bg-slate-50 dark:bg-dark-900 text-slate-650 dark:text-slate-300 text-[11px] rounded-lg border border-slate-100 dark:border-dark-700/50"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-2">
            Creator Feed ({profilePosts.length})
          </h2>
          
          {profilePosts.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-dark-800 rounded-2xl border border-slate-100 dark:border-dark-700 p-6 text-xs text-slate-400">
              This user hasn't posted anything yet.
            </div>
          ) : (
            profilePosts.map((post) => <PostCard key={post._id} post={post} />)
          )}
        </div>
      </div>

      
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 z-50 flex items-center justify-center p-4 transition-all">
          <div className="w-full max-w-lg bg-white dark:bg-dark-800 rounded-3xl border border-slate-100 dark:border-dark-700 p-6 relative max-h-[90vh] overflow-y-auto shadow-2xl">
            <button
              onClick={() => setIsEditing(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-700"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-black mb-5 text-slate-800 dark:text-slate-100">Update Profile Details</h2>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-400 mb-1">Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl outline-none focus:border-brand-500 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Bio Description</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl outline-none focus:border-brand-500 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Location</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl outline-none focus:border-brand-500 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  value={editSkills}
                  onChange={(e) => setEditSkills(e.target.value)}
                  placeholder="React, CSS, Node.js"
                  className="w-full p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl outline-none focus:border-brand-500 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Interests (comma separated)</label>
                <input
                  type="text"
                  value={editInterests}
                  onChange={(e) => setEditInterests(e.target.value)}
                  placeholder="UI Design, Writing, Gardening"
                  className="w-full p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl outline-none focus:border-brand-500 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-400 mb-1 flex items-center gap-1">
                    <Camera className="h-4 w-4" /> Avatar Profile
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files[0])}
                    className="text-[10px] text-slate-450"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 flex items-center gap-1">
                    <Camera className="h-4 w-4" /> Cover Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files[0])}
                    className="text-[10px] text-slate-450"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-xl shadow-md transition-colors"
              >
                Save Profile Changes
              </button>
            </form>
          </div>
        </div>
      )}

      
      {(showFollowersModal || showFollowingModal) && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 z-50 flex items-center justify-center p-4 transition-all">
          <div className="w-full max-w-sm bg-white dark:bg-dark-800 rounded-3xl border border-slate-100 dark:border-dark-700 p-5 relative max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <button
              onClick={() => {
                setShowFollowersModal(false);
                setShowFollowingModal(false);
                setModalUsersList([]);
              }}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-700"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-base font-black mb-4 dark:text-slate-200">
              {showFollowersModal ? 'Followers' : 'Following'}
            </h2>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {modalLoading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-brand-500"></div>
                </div>
              ) : modalUsersList.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">Empty list.</div>
              ) : (
                modalUsersList.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => {
                      setShowFollowersModal(false);
                      setShowFollowingModal(false);
                      setModalUsersList([]);
                      navigate(`/profile/${u.username}`);
                    }}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-700/50 cursor-pointer transition-colors"
                  >
                    <img src={u.avatar} alt={u.name} className="h-8 w-8 rounded-full object-cover" />
                    <div>
                      <h4 className="text-xs font-semibold dark:text-slate-200">{u.name}</h4>
                      <p className="text-[10px] text-slate-400">@{u.username}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfilePage;
