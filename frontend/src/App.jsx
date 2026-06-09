import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Routes as DomRoutes, Route as DomRoute, Navigate } from 'react-router-dom';


import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';


import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AdminPage from './pages/AdminPage';

import { connectSocket, disconnectSocket } from './utils/socket';
import { fetchUnreadCount } from './redux/slices/notificationSlice';


import SplashScreen from './components/SplashScreen';

const App = () => {
  const { isAuthenticated, accessToken, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [showSplash, setShowSplash] = useState(true);
  const [fadeSplash, setFadeSplash] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeSplash(true);
    }, 1800);

    const removeTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2300);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      
      const socket = connectSocket(accessToken);
      
      
      dispatch(fetchUnreadCount());

      return () => {
        disconnectSocket();
      };
    }
  }, [isAuthenticated, accessToken, dispatch]);

  return (
    <>
      {showSplash && <SplashScreen isFading={fadeSplash} />}
      <DomRoutes>
      
      <DomRoute 
        path="/login" 
        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />} 
      />
      <DomRoute 
        path="/register" 
        element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" replace />} 
      />

      
      <DomRoute
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <FeedPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <DomRoute
        path="/profile/:username"
        element={
          <ProtectedRoute>
            <Layout>
              <ProfilePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <DomRoute
        path="/chat"
        element={
          <ProtectedRoute>
            <Layout>
              <ChatPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <DomRoute
        path="/analytics"
        element={
          <ProtectedRoute>
            <Layout>
              <AnalyticsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <DomRoute
        path="/admin"
        element={
          <ProtectedRoute adminOnly={true}>
            <Layout>
              <AdminPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      
      <DomRoute path="*" element={<Navigate to="/" replace />} />
    </DomRoutes>
    </>
  );
};

export default App;
