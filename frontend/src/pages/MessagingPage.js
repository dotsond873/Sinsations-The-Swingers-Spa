import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import Navigation from '../components/Navigation';
import { toast } from 'sonner';

export default function MessagingPage({ user: propUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(propUser);

  useEffect(() => {
    if (!user) {
      axios.get(`${API}/auth/me`, { withCredentials: true })
        .then(res => {
          if (!res.data.is_premium) {
            toast.error('Premium membership required');
            navigate('/dashboard');
          } else {
            setUser(res.data);
          }
        })
        .catch(() => navigate('/login'));
    } else if (!user.is_premium) {
      toast.error('Premium membership required');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0B0A0F]">
      <Navigation user={user} />
      <main className="max-w-7xl mx-auto px-8 py-12">
        <h1 className="heading-font text-4xl font-bold text-[#F7F5F0] mb-6">Messages</h1>
        <div className="glass-effect p-12 rounded-2xl text-center">
          <p className="text-[#A8A3B2]">Messaging feature - Premium members can send and receive private messages</p>
        </div>
      </main>
    </div>
  );
}
