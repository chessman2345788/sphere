import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../redux/slices/authSlice';
import { Sparkles, User, Mail, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { isLoading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !username || !email || !password || !confirmPassword) {
      return toast.error('Please fill in all fields');
    }
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    const resultAction = await dispatch(registerUser({ name, username, email, password }));
    if (registerUser.fulfilled.match(resultAction)) {
      toast.success('Registration successful! Welcome to SocialSphere.');
      navigate('/');
    } else {
      toast.error(resultAction.payload || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-dark-950 p-4 transition-colors">
      <div className="w-full max-w-5xl md:h-[650px] h-auto grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl glass-card">
        
        {/* Left branding banner */}
        <div className="hidden md:flex flex-col justify-between p-12 gradient-brand relative overflow-hidden">
          {/* Decorative shapes */}
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
              Join the Sphere.
            </h1>
            <p className="text-white/80 text-sm max-w-md">
              Create an account and start sharing ideas, reading analytics charts, exchanging direct messages, and following creators across the globe.
            </p>
          </div>

          <div className="text-white/60 text-xs relative z-10">
            &copy; 2026 SocialSphere Inc. All rights reserved.
          </div>
        </div>

        {/* Right Form panel */}
        <div className="flex flex-col justify-center p-8 md:p-12 bg-white dark:bg-dark-800 transition-colors overflow-y-auto">
          <div className="mb-6 text-center md:text-left">
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-1">Create Account</h2>
            <p className="text-slate-400 text-xs">Fill in your information to join us today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl focus:bg-white dark:focus:bg-dark-950 focus:border-brand-500 outline-none transition-all dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-xs text-slate-400 font-semibold">@</span>
                  </div>
                  <input
                    type="text"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl focus:bg-white dark:focus:bg-dark-950 focus:border-brand-500 outline-none transition-all dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl focus:bg-white dark:focus:bg-dark-950 focus:border-brand-500 outline-none transition-all dark:text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl focus:bg-white dark:focus:bg-dark-950 focus:border-brand-500 outline-none transition-all dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Confirm</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl focus:bg-white dark:focus:bg-dark-950 focus:border-brand-500 outline-none transition-all dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-lg gradient-glow flex items-center justify-center gap-2 hover-scale disabled:opacity-75 disabled:cursor-not-allowed transition-all mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-500 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
