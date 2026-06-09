import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Bell, Menu, X, Heart, MessageSquare, UserPlus, Share2, Circle } from 'lucide-react';
import { fetchNotifications, readAllNotifications, readSingleNotification } from '../redux/slices/notificationSlice';
import api from '../utils/api';

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const { notifications, unreadCount } = useSelector((state) => state.notifications);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const searchRef = useRef(null);

  
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  
  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications());
    }
  }, [user, dispatch]);

  
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        try {
          const res = await api.get(`/api/users/search?q=${searchQuery}`);
          setSearchResults(res.data.users);
        } catch (err) {
          console.error(err);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleNotificationClick = async (notif) => {
    dispatch(readSingleNotification(notif._id));
    setShowNotifications(false);
    
    if (notif.type === 'follow') {
      navigate(`/profile/${notif.sender.username}`);
    } else if (notif.post) {
      navigate(`/`); 
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500 fill-red-500" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-blue-500 fill-blue-500" />;
      case 'follow':
        return <UserPlus className="h-4 w-4 text-emerald-500" />;
      case 'repost':
        return <Share2 className="h-4 w-4 text-indigo-500" />;
      default:
        return <Bell className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-dark-800/80 backdrop-blur-md border-b border-slate-100 dark:border-dark-700 h-16 flex items-center justify-between px-6 transition-colors duration-200">
      
      
      <div className="flex items-center gap-3 md:hidden">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-700"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <span className="font-extrabold text-lg bg-gradient-to-r from-brand-500 to-indigo-600 dark:from-brand-400 dark:to-indigo-500 bg-clip-text text-transparent">
          SocialSphere
        </span>
      </div>

      
      <div className="relative flex-1 max-w-md hidden sm:block" ref={searchRef}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search creators..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100/80 dark:bg-dark-900 border border-transparent rounded-xl focus:bg-white dark:focus:bg-dark-950 focus:border-brand-500 outline-none transition-all dark:text-slate-200"
        />
        
        
        {searchResults.length > 0 && (
          <div className="absolute top-12 left-0 w-full bg-white dark:bg-dark-800 rounded-xl shadow-xl border border-slate-100 dark:border-dark-700 overflow-hidden divide-y divide-slate-50 dark:divide-dark-700">
            {searchResults.map((u) => (
              <div
                key={u._id}
                onClick={() => {
                  navigate(`/profile/${u.username}`);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-dark-700 cursor-pointer"
              >
                <img src={u.avatar} alt={u.name} className="h-8 w-8 rounded-full object-cover" />
                <div>
                  <h4 className="text-xs font-semibold dark:text-slate-200">{u.name}</h4>
                  <p className="text-[10px] text-slate-400">@{u.username}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      
      <div className="flex items-center gap-4 ml-auto">
        
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white font-bold text-[9px] flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          
          {showNotifications && (
            <div className="absolute top-12 right-0 w-80 bg-white/95 dark:bg-dark-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100 dark:border-dark-700 overflow-hidden py-2 divide-y divide-slate-100 dark:divide-dark-700">
              <div className="flex items-center justify-between px-4 py-2 pb-3">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => dispatch(readAllNotifications())}
                    className="text-xs font-semibold text-brand-500 hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-400">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-dark-700/50 cursor-pointer transition-colors ${
                        !notif.isRead ? 'bg-brand-50/20 dark:bg-brand-900/10' : ''
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={notif.sender.avatar}
                          alt={notif.sender.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        <span className="absolute -bottom-1 -right-1 p-0.5 bg-white dark:bg-dark-800 rounded-full">
                          {getNotifIcon(notif.type)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 dark:text-slate-300">
                          <span className="font-bold">{notif.sender.name}</span>{' '}
                          {notif.type === 'like' && 'liked your post'}
                          {notif.type === 'comment' && 'commented on your post'}
                          {notif.type === 'follow' && 'started following you'}
                          {notif.type === 'repost' && 'reshared your post'}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(notif.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {!notif.isRead && (
                        <Circle className="h-2 w-2 text-brand-500 fill-brand-500 mt-2 self-start" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 focus:outline-none"
          >
            <img
              src={user?.avatar}
              alt={user?.name}
              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-dark-600 object-cover"
            />
            <div className="hidden lg:block text-left">
              <span className="block text-xs font-semibold dark:text-slate-200 leading-none">
                {user?.name}
              </span>
              <span className="text-[10px] text-slate-400">@{user?.username}</span>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute top-12 right-0 w-48 bg-white dark:bg-dark-800 rounded-xl shadow-xl border border-slate-100 dark:border-dark-700 py-1.5 divide-y divide-slate-100 dark:divide-dark-700">
              <div className="px-4 py-2 font-medium text-xs text-slate-400">
                Manage Account
              </div>
              <Link
                to={`/profile/${user?.username}`}
                onClick={() => setShowProfileMenu(false)}
                className="block px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-700"
              >
                My Profile
              </Link>
              <Link
                to="/chat"
                onClick={() => setShowProfileMenu(false)}
                className="block px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-700"
              >
                Chats
              </Link>
            </div>
          )}
        </div>
      </div>

      
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900/40 dark:bg-black/60 z-50 transition-opacity" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="w-64 max-w-xs bg-white dark:bg-dark-800 h-full p-6 flex flex-col shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="flex items-center gap-3 mb-10">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-500 to-indigo-600 dark:from-brand-400 dark:to-indigo-500 bg-clip-text text-transparent">
                SocialSphere
              </span>
            </div>
            
            
            <nav className="flex-grow space-y-4">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium dark:text-slate-200">Feed</Link>
              <Link to="/chat" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium dark:text-slate-200">Messages</Link>
              <Link to="/analytics" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium dark:text-slate-200">Analytics</Link>
              <Link to={`/profile/${user?.username}`} onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium dark:text-slate-200">Profile</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-red-500">Admin Panel</Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
