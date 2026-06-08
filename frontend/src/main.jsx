import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import store from './redux/store.js';
import './index.css';
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster 
          position="top-right" 
          toastOptions={{ 
            duration: 4000,
            className: 'dark:bg-slate-800 dark:text-white',
          }} 
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
