import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Home, User, MessageSquare, BarChart3, ShieldAlert, LogOut, Sun, Moon, Sparkles } from 'lucide-react';
import { logoutUser, toggleTheme } from '../redux/slices/authSlice';
import { disconnectSocket } from '../utils/socket';
import toast from 'react-hot-toast';

const Sidebar = () => {
  const { user, theme } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.notifications);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser());
    disconnectSocket();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navItems = [
    { name: 'Feed', path: '/', icon: Home },
    { name: 'Messages', path: '/chat', icon: MessageSquare, badgeKey: 'chat' },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Profile', path: `/profile/${user?.username}`, icon: User },
  ];

  if (user?.role === 'admin') {
    navItems.push({ name: 'Admin Panel', path: '/admin', icon: ShieldAlert });
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-dark-800 border-r border-slate-100 dark:border-dark-700 h-full p-6 transition-colors duration-200">
      
      <div className="flex items-center gap-3 mb-10">
        <div className="p-2 gradient-brand rounded-xl shadow-lg gradient-glow">
          <Sparkles className="h-6 w-6 text-white animate-pulse" />
        </div>
        <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-500 to-indigo-600 dark:from-brand-400 dark:to-indigo-500 bg-clip-text text-transparent">
          SocialSphere
        </span>
      </div>

      
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3.5 rounded-xl font-medium transition-all duration-200 group hover-scale ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 shadow-sm border-l-4 border-brand-500'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-700 hover:text-slate-800 dark:hover:text-slate-200'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                <span>{item.name}</span>
              </div>
              {item.badgeKey === 'chat' && unreadCount > 0 && (
                <span className="flex items-center justify-center bg-red-500 text-white text-[11px] font-bold h-5 px-1.5 rounded-full min-w-5">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      
      <div className="mt-auto border-t border-slate-100 dark:border-dark-700 pt-6 space-y-2">
        
        <button
          onClick={() => dispatch(toggleTheme())}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-700 transition-colors"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-5 w-5 text-amber-500" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="h-5 w-5 text-indigo-500" />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors group"
        >
          <LogOut className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
