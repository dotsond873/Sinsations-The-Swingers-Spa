import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';
import { Users, Fire, Trophy, ShieldCheck, Gift, Chat, Pencil, Camera } from '@phosphor-icons/react';
import Navigation from '../components/Navigation';

export default function DashboardPage({ user: propUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(propUser || null);
  const [winner, setWinner] = useState(null);

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

  if (!user) {
    return <div className="min-h-screen bg-[#0B0A0F] flex items-center justify-center">
      <div className="text-[#F7F5F0]">Loading...</div>
    </div>;
  }

  // Check if profile is incomplete
  const isProfileIncomplete = !user.preferences?.orientation || !user.preferences?.age_range;

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

        {/* Get Verified Banner */}
        {!user.is_verified && (
          <div data-testid="get-verified-banner" className="mb-8 glass-effect p-6 rounded-2xl border-2 border-[#D4AF37]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <ShieldCheck size={40} weight="fill" className="text-[#D4AF37]" />
                <div>
                  <h3 className="heading-font text-xl font-bold text-[#F7F5F0]">Get Verified</h3>
                  <p className="text-[#A8A3B2] text-sm">Prove you're real and earn a verified badge</p>
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
