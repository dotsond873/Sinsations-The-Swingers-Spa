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
    if (!user) {
      axios.get(`${API}/auth/me`, { withCredentials: true })
        .then(res => setUser(res.data))
        .catch(() => navigate('/login'));
    }

    // Fetch current winner
    axios.get(`${API}/contest/winner`)
      .then(res => setWinner(res.data))
      .catch(() => {});
  }, [user, navigate]);

  // Fetch nearby members once we know the user's area code / state
  useEffect(() => {
    if (!user) return;

    const fetchByParams = async (params) => {
      try {
        const res = await axios.get(`${API}/members`, { params, withCredentials: true });
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

  // Check if profile is incomplete
  const isProfileIncomplete = !user.preferences?.orientation || !user.preferences?.age_range;
  const isSecurityQuestionMissing = !user.security_question;
  const nearbyLabel = user.area_code
    ? `area code ${user.area_code}`
    : user.state
      ? user.state
      : '';

  return (
    <div className="min-h-screen bg-[#0B0A0F]">
      <Navigation user={user} />

      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Complete Profile Banner */}
        {isProfileIncomplete && (
          <div data-testid="complete-profile-banner" className="mb-8 glass-effect p-6 rounded-2xl border-2 border-[#D4AF37]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="heading-font text-2xl font-bold text-[#F7F5F0] mb-2">Complete Your Profile</h3>
                <p className="text-[#A8A3B2]">
                  Tell us about yourself so others can find you!
                </p>
              </div>
              <button
                data-testid="complete-profile-btn"
                onClick={() => navigate('/profile-setup')}
                className="px-8 py-3 rounded-full bg-[#D4AF37] text-[#0B0A0F] font-semibold hover:bg-[#F0C847] transition-all duration-300 flex items-center gap-2"
              >
                <Pencil size={20} weight="bold" />
                Complete Profile
              </button>
            </div>
          </div>
        )}

        {/* Security Question Banner */}
        {isSecurityQuestionMissing && (
          <div data-testid="security-question-banner" className="mb-8 glass-effect p-6 rounded-2xl border-2 border-[#B22234]">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <Key size={36} weight="fill" className="text-[#B22234]" />
                <div>
                  <h3 className="heading-font text-xl font-bold text-[#F7F5F0]">Set a Security Question</h3>
                  <p className="text-[#A8A3B2] text-sm">
                    Without one you won&apos;t be able to reset your password if you forget it.
                  </p>
                </div>
              </div>
              <button
                data-testid="set-security-question-btn"
                onClick={() => navigate('/profile-setup')}
                className="px-6 py-3 rounded-full bg-[#B22234] text-[#F7F5F0] font-semibold hover:bg-[#D62839] transition-all"
              >
                Set It Now
              </button>
            </div>
          </div>
        )}

        {/* Get Verified Banner */}
        {!user.is_verified && (
          <div data-testid="get-verified-banner" className="mb-8 glass-effect p-6 rounded-2xl border-2 border-[#D4AF37]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <ShieldCheck size={40} weight="fill" className="text-[#D4AF37]" />
                <div>
                  <h3 className="heading-font text-xl font-bold text-[#F7F5F0]">Get Verified</h3>
                  <p className="text-[#A8A3B2] text-sm">Prove you&apos;re real and earn a verified badge</p>
                </div>
              </div>
              <button
                data-testid="get-verified-btn"
                onClick={() => navigate('/verification')}
                className="px-6 py-3 rounded-full bg-[#D4AF37] text-[#0B0A0F] font-semibold hover:bg-[#F0C847] transition-all"
              >
                Get Verified
              </button>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="heading-font text-4xl md:text-5xl font-bold text-[#F7F5F0] mb-3">
            Welcome back, {user.name}!
          </h1>
          <div className="flex items-center gap-4">
            <span className="px-4 py-1 rounded-full bg-[#4CAF50] text-white text-sm font-bold">
              FREE MEMBER
            </span>
            {user.is_verified && (
              <span className="px-4 py-1 rounded-full bg-[#D4AF37] text-[#0B0A0F] text-sm font-bold flex items-center gap-2">
                <ShieldCheck size={16} weight="fill" />
                VERIFIED
              </span>
            )}
          </div>
        </div>

        {/* Pretty Pussy of the Week */}
        {winner && winner.user && (
          <div data-testid="contest-winner-spotlight" className="mb-12 glass-effect p-8 rounded-2xl border-2 border-[#D4AF37]">
            <div className="flex items-center gap-3 mb-4">
              <Trophy size={32} weight="fill" className="text-[#D4AF37]" />
              <h2 className="heading-font text-3xl font-bold text-[#F7F5F0]">
                Pretty Pussy of the Week
              </h2>
            </div>
            <div className="flex items-center gap-6">
              {winner.user.picture && (
                <img
                  src={winner.user.picture}
                  alt={winner.user.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-[#D4AF37]"
                />
              )}
              <div>
                <h3 className="text-2xl font-bold text-[#F7F5F0] mb-1">{winner.user.name}</h3>
                <p className="text-[#A8A3B2]">{winner.user.location}</p>
                <button
                  onClick={() => navigate(`/profile/${winner.user.user_id}`)}
                  className="mt-3 px-6 py-2 rounded-full bg-[#B22234] text-[#F7F5F0] hover:bg-[#D62839] transition-all duration-300"
                >
                  View Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <QuickAction
            icon={<Users size={32} weight="duotone" />}
            title="Browse Members"
            description="Find connections near you"
            onClick={() => navigate('/members')}
            testId="browse-members-card"
          />
          <QuickAction
            icon={<Chat size={32} weight="duotone" />}
            title="Messages"
            description="Chat freely, exchange numbers"
            onClick={() => navigate('/messages')}
            testId="messages-card"
          />
          <QuickAction
            icon={<Camera size={32} weight="duotone" />}
            title="My Media"
            description="Upload photos & videos"
            onClick={() => navigate('/my-media')}
            testId="media-card"
          />
          <QuickAction
            icon={<Fire size={32} weight="duotone" />}
            title="Hot Wife"
            description="Exclusive section"
            onClick={() => navigate('/hotwife')}
            testId="hotwife-card"
          />
          <QuickAction
            icon={<Gift size={32} weight="duotone" />}
            title="Referrals"
            description="Invite friends"
            onClick={() => navigate('/referral')}
            testId="referral-card"
          />
        </div>

        {/* Members near me */}
        {nearbyMembers.length > 0 && (
          <div data-testid="nearby-members" className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MapPin size={28} weight="fill" className="text-[#D4AF37]" />
                <h2 className="heading-font text-2xl font-bold text-[#F7F5F0]">
                  Members near you{nearbyLabel && <span className="text-[#A8A3B2] text-base font-normal ml-2">({nearbyLabel})</span>}
                </h2>
              </div>
              <button
                data-testid="see-all-members-btn"
                onClick={() => navigate('/members')}
                className="text-[#D4AF37] hover:text-[#F0C847] text-sm font-semibold"
              >
                See all →
              </button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {nearbyMembers.map(m => (
                <div
                  key={m.user_id}
                  data-testid={`nearby-member-${m.user_id}`}
                  onClick={() => navigate(`/profile/${m.user_id}`)}
                  className="glass-effect p-4 rounded-2xl cursor-pointer hover:-translate-y-1 transition-all flex items-center gap-3"
                >
                  {m.picture ? (
                    <img src={m.picture} alt={m.name} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#1C1A24] flex items-center justify-center flex-shrink-0">
                      <span className="text-xl text-[#D4AF37]">{(m.name || '?')[0]}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[#F7F5F0] font-semibold truncate">{m.name}</h4>
                      {m.is_verified && <Crown size={14} weight="fill" className="text-[#D4AF37] flex-shrink-0" />}
                    </div>
                    {(m.city || m.state) && (
                      <p className="text-[#A8A3B2] text-xs truncate">
                        {[m.city, m.state].filter(Boolean).join(', ')}
                        {m.area_code && ` · ${m.area_code}`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Support Banner */}
        <div className="glass-effect p-6 rounded-2xl mb-8 border border-[#D4AF37]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Heart size={32} weight="fill" className="text-[#B22234]" />
              <div>
                <p className="text-[#F7F5F0] font-semibold">Love this site? Help keep it free!</p>
                <p className="text-[#A8A3B2] text-sm">Your donations help cover server costs</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/support-us')}
              className="px-6 py-2 rounded-full bg-[#D4AF37] text-[#0B0A0F] font-semibold hover:bg-[#F0C847] transition-all"
            >
              Support Us
            </button>
          </div>
        </div>

        {/* Community Rules Reminder */}
        <div className="glass-effect p-6 rounded-2xl text-center">
          <p className="text-[#A8A3B2]">
            Remember: <span className="text-[#D4AF37] font-semibold">Be nice. Be respectful. Have fun.</span>
          </p>
        </div>
      </main>
    </div>
  );
}

function QuickAction({ icon, title, description, onClick, testId }) {
  return (
    <div
      data-testid={testId}
      onClick={onClick}
      className="glass-effect p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1"
    >
      <div className="text-[#D4AF37] mb-4">{icon}</div>
      <h3 className="heading-font text-xl font-bold text-[#F7F5F0] mb-2">{title}</h3>
      <p className="text-[#A8A3B2] text-sm">{description}</p>
    </div>
  );
}
