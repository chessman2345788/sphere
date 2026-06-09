import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-dark-950 transition-colors duration-200">
      
      <Sidebar />
      
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <Navbar />
        
        
        <main className="flex-grow overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-dark-950">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
