import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';

export default function AuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      const hash = window.location.hash;
      const sessionId = new URLSearchParams(hash.substring(1)).get('session_id');

      if (!sessionId) {
        toast.error('No session ID found');
        navigate('/login');
        return;
      }

      try {
        const response = await axios.post(
          `${API}/auth/google/session`,
          { session_id: sessionId },
          { withCredentials: true }
        );

        toast.success('Login successful!');
        
        // Get user data
        const userResponse = await axios.get(`${API}/auth/me`, { withCredentials: true });
        
        // Navigate to dashboard with user data
        navigate('/dashboard', { replace: true, state: { user: userResponse.data } });
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('Authentication failed');
        navigate('/login');
      }
    };

    processSession();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0B0A0F] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#D4AF37] border-t-transparent mx-auto mb-4"></div>
        <p className="text-[#F7F5F0] text-lg">Completing authentication...</p>
      </div>
    </div>
  );
}
