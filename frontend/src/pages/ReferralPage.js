import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import Navigation from '../components/Navigation';
import { Copy, Users, CheckCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function ReferralPage({ user: propUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(propUser);
  const [referralCode, setReferralCode] = useState('');
  const [stats, setStats] = useState({ total_referrals: 0, referrals: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      axios.get(`${API}/auth/me`, { withCredentials: true })
        .then(res => setUser(res.data))
        .catch(() => navigate('/login'));
    }
    
    fetchReferralData();
  }, [user, navigate]);

  const fetchReferralData = async () => {
    try {
      const [codeRes, statsRes] = await Promise.all([
        axios.get(`${API}/referral/code`, { withCredentials: true }),
        axios.get(`${API}/referral/stats`, { withCredentials: true })
      ]);
      setReferralCode(codeRes.data.code);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch referral data');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/register?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied!');
  };

  if (!user || loading) return <div className="min-h-screen bg-[#0B0A0F] flex items-center justify-center"><div className="text-[#F7F5F0]">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-[#0B0A0F]">
      <Navigation user={user} />
      <main className="max-w-7xl mx-auto px-8 py-12">
        <h1 className="heading-font text-4xl font-bold text-[#F7F5F0] mb-8">Referral Program</h1>

        <div className="glass-effect p-8 rounded-2xl mb-8">
          <h2 className="heading-font text-2xl font-bold text-[#F7F5F0] mb-4">Your Referral Code</h2>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 bg-[#1C1A24] px-6 py-4 rounded-lg border border-[#D4AF37]">
              <span className="text-3xl font-bold text-[#D4AF37] tracking-wider">{referralCode}</span>
            </div>
            <button
              data-testid="copy-referral-btn"
              onClick={copyReferralLink}
              className="px-6 py-4 rounded-lg bg-[#D4AF37] text-[#0B0A0F] font-semibold hover:bg-[#F0C847] transition-all flex items-center gap-2"
            >
              <Copy size={20} weight="bold" />
              Copy Link
            </button>
          </div>
          <p className="text-[#A8A3B2]">Share your referral link with friends to grow the community!</p>
        </div>

        <div className="glass-effect p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Users size={32} weight="fill" className="text-[#D4AF37]" />
            <h2 className="heading-font text-2xl font-bold text-[#F7F5F0]">
              Referral Stats ({stats.total_referrals} Total)
            </h2>
          </div>
          
          {stats.total_referrals === 0 ? (
            <p className="text-[#A8A3B2]">No referrals yet. Start sharing your code!</p>
          ) : (
            <div className="space-y-3">
              {stats.referrals.map((ref, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 bg-[#1C1A24] rounded-lg">
                  <CheckCircle size={24} weight="fill" className="text-[#4CAF50]" />
                  <div>
                    <p className="text-[#F7F5F0] font-semibold">Referral #{idx + 1}</p>
                    <p className="text-[#A8A3B2] text-sm">{new Date(ref.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
