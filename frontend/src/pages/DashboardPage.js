import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Users, Fire, Trophy, ShieldCheck, Gift, Chat, Pencil, Camera, Heart, Key, MapPin, Crown } from '@phosphor-icons/react';
import Navigation from '../components/Navigation';

export default function DashboardPage({ user: propUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(propUser || null);
  const [winner, setWinner] = useState(null);
  const [nearbyMembers, setNearbyMembers] = useState([]);

  useEffect(() => {
    axios.get(API + '/auth/me', { withCredentials: true })
      .then(res => setUser(res.data))
      .catch(() => navigate('/login'));

    axios.get(API + '/contest/winner')
      .then(res => setWinner(res.data))
      .catch(() => {});
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchByParams = async (params) => {
      try {
        const res = await axios.get(API + '/members', { params, withCredentials: true });
        return (res.data || []).filter(m => m.user_id !== user.user_id);
      } catch {
        return [];
      }
    };

    const run = async () => {
      let results = [];
      if (user.area_code) {
        results = await fetchByParams({ area_code: user.area_code, limit: 12 });
      }
      if (results.length === 0 && user.state) {
        results = await fetchByParams({ state: user.state, limit: 12 });
      }
      if (results.length === 0) {
        results = await fetchByParams({ limit: 12 });
      }
      setNearbyMembers(results.slice(0, 6));
    };
    run();
  }, [user]);

  if (!user) {
    return <div className="min-h-screen bg-[#0B0A0F] flex items-center justify-center">
      <div className="text-[#F7F5F0]">Loading...</div>
    </div>;
  }

  const isProfileIncomplete = !user.preferences?.orientation || !user.preferences?.age_range;
  const isSecurityQuestionMissing = !user.security_question;
  const nearbyLabel = user.area_code
    ? 'area code ' + user.area_code
    : user.state
      ? user.state
      : '';

  return (
    <div className="min-h-screen bg-[#0B0A0F]">
      <Navigation user={user} />

      <main className="max-w-7xl mx-auto px-8 py-12">
        {isProfileIncomplete && (
          <div data-testid="complete-profile-banner" className="mb-8 glass-effect p-6 rounded-2xl border-2 border-[#D4AF37]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="heading-font text-2xl font-bold text-[#F7F5F0] mb-2">Complete Your Profile</h3>
                <p className="text-[#A8A3B2]">Tell us about yourself so others can find you!</p>
              </div>
              <button
                data-testid="complete-profile-btn"
                onClick={() => navigate('/profile-setup')}
                className="px-8 py-3 rounded-full bg-[#D4AF37] text-[#0B0A0F] font-semibold hover:bg-[#F0C847] transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Pencil size={20} weight="bold" />
                Complete Profile
              </button>
            </div>
          </div>
        )}

        {isSecurityQuestionMissing && (
          <div data-testid="security-question-banner" className="mb-8 glass-effect p-6 rounded-2xl border-2 border-[#B22234]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Key size={36} weight="fill" className="text-[#B22234] flex-shrink-0" />
                <div>
                  <h3 className="heading-font text-xl font-bold text-[#F7F5F0]">Set a Security Question</h3>