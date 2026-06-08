import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../redux/slices/authSlice';
import { Sparkles, Mail, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { isLoading, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please fill in all fields');
    }

    const resultAction = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(resultAction)) {
      toast.success('Welcome back to SocialSphere!');
      navigate('/');
    } else {
      toast.error(resultAction.payload || 'Login failed. Please check credentials.');
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-dark-950 p-4 transition-colors">
      <div className="w-full max-w-5xl md:h-[600px] h-auto grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl glass-card">
        
        {/* Left branding banner */}
        <div className="hidden md:flex flex-col justify-between p-12 gradient-brand relative overflow-hidden">
          {/* Animated decorative shapes */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl -ml-20 -mb-20"></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 bg-white/10 rounded-xl">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="font-extrabold text-xl text-white tracking-tight">SocialSphere</span>
          </div>

          <div className="space-y-4 relative z-10">
            <h1 className="text-4xl font-extrabold text-white leading-tight">
              Connect. Analyze. Moderate.
            </h1>
            <p className="text-white/80 text-sm max-w-md">
              A premium, real-time social dashboard combining feed engagement, rich analytics, peer-to-peer chats, and admin moderation in one single interface.
            </p>
          </div>

          <div className="text-white/60 text-xs relative z-10">
            &copy; 2026 SocialSphere Inc. All rights reserved.
          </div>
        </div>

        {/* Right Form panel */}
        <div className="flex flex-col justify-center p-8 md:p-12 bg-white dark:bg-dark-800 transition-colors">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2">Welcome Back</h2>
            <p className="text-slate-400 text-sm">Please log in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl focus:bg-white dark:focus:bg-dark-950 focus:border-brand-500 outline-none transition-all dark:text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl focus:bg-white dark:focus:bg-dark-950 focus:border-brand-500 outline-none transition-all dark:text-slate-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-lg gradient-glow flex items-center justify-center gap-2 hover-scale disabled:opacity-75 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-500 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
