import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '@/index.css';
import LandingPage from './pages/LandingPage';
import GuidelinesPage from './pages/GuidelinesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import VerificationPage from './pages/VerificationPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import MembersPage from './pages/MembersPage';
import MessagingPage from './pages/MessagingPage';
import ChatroomsPage from './pages/ChatroomsPage';
import ForumsPage from './pages/ForumsPage';
import PersonalsPage from './pages/PersonalsPage';
import HotWifePage from './pages/HotWifePage';
import ContestPage from './pages/ContestPage';
import AdminPage from './pages/AdminPage';
import ReferralPage from './pages/ReferralPage';
import LikesPage from './pages/LikesPage';
import AuthCallback from './pages/AuthCallback';
import { Toaster } from '@/components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export { API, BACKEND_URL };

axios.defaults.withCredentials = true;

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If user data passed from AuthCallback, skip auth check
    if (location.state?.user) {
      setUser(location.state.user);
      setIsAuthenticated(true);
      return;
    }

    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API}/auth/me`, {
          withCredentials: true,
        });
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
        navigate('/login', { state: { from: location.pathname } });
      }
    };

    checkAuth();
  }, [location.pathname, location.state, navigate]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0A0F]">
        <div className="text-[#F7F5F0] text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return React.cloneElement(children, { user });
}

function AppRouter() {
  const location = useLocation();

  // Check URL fragment (not query params) for session_id
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/guidelines" element={<GuidelinesPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetupPage /></ProtectedRoute>} />
      <Route path="/verification" element={<ProtectedRoute><VerificationPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/profile/:userId" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/members" element={<ProtectedRoute><MembersPage /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><MessagingPage /></ProtectedRoute>} />
      <Route path="/chatrooms" element={<ProtectedRoute><ChatroomsPage /></ProtectedRoute>} />
      <Route path="/forums" element={<ProtectedRoute><ForumsPage /></ProtectedRoute>} />
      <Route path="/personals" element={<ProtectedRoute><PersonalsPage /></ProtectedRoute>} />
      <Route path="/hotwife" element={<ProtectedRoute><HotWifePage /></ProtectedRoute>} />
      <Route path="/contest" element={<ProtectedRoute><ContestPage /></ProtectedRoute>} />
      <Route path="/referral" element={<ProtectedRoute><ReferralPage /></ProtectedRoute>} />
      <Route path="/likes" element={<ProtectedRoute><LikesPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
        <Toaster />
      </BrowserRouter>
    </div>
  );
}

export default App;
