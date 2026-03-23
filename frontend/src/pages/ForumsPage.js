import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import Navigation from '../components/Navigation';

export default function ForumsPage({ user: propUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(propUser);

  useEffect(() => {
    if (!user) {
      axios.get(`${API}/auth/me`, { withCredentials: true })
        .then(res => setUser(res.data))
        .catch(() => navigate('/login'));
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0B0A0F]">
      <Navigation user={user} />
      <main className="max-w-7xl mx-auto px-8 py-12">
        <h1 className="heading-font text-4xl font-bold text-[#F7F5F0] mb-6">Forums</h1>
        <div className="glass-effect p-12 rounded-2xl text-center">
          <p className="text-[#A8A3B2]">Community forums - Discuss topics with other members</p>
        </div>
      </main>
    </div>
  );
}
