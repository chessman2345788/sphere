import React from 'react';

const SplashScreen = ({ isFading }) => {
  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#090d16] select-none transition-all duration-500 ease-in-out ${
        isFading ? 'opacity-0 scale-98 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-brand-500">
          <svg
            className="w-8 h-8 text-brand-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
            />
          </svg>
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-white font-sans">
            SocialSphere
          </h1>
          <p className="text-xs text-slate-500 tracking-widest uppercase">
            Dashboard Portal
          </p>
        </div>

        <div className="pt-4 flex items-center justify-center space-x-2">
          <svg
            className="animate-spin h-5 w-5 text-brand-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-xs text-slate-400 font-medium">Loading...</span>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
