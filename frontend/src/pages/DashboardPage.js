import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';
import { Upload, Crown, Users, Fire, Trophy, SignOut, ShieldCheck, Gift } from '@phosphor-icons/react';
import Navigation from '../components/Navigation';

export default function DashboardPage({ user: propUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(propUser || null);
  const [winner, setWinner] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const needsResidencyProof = location.state?.needsResidencyProof;
  const planId = location.state?.planId;

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

  const handleResidencyUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API}/users/upload-residency-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });
      toast.success('Residency proof uploaded! Awaiting admin approval.');
      setShowUploadDialog(false);
    } catch (error) {
      toast.error('Upload failed');
    }
  };

  const handleUpgrade = () => {
    if (planId) {
      initiatePayment(planId);
    } else {
      navigate('/pricing');
    }
  };

  const initiatePayment = async (selectedPlanId) => {
    try {
      const originUrl = window.location.origin;
      const response = await axios.post(
        `${API}/payment/checkout`,
        { plan_id: selectedPlanId, origin_url: originUrl },
        { withCredentials: true }
      );
      window.location.href = response.data.url;
    } catch (error) {
      toast.error('Payment initialization failed');
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-[#0B0A0F] flex items-center justify-center">
      <div className="text-[#F7F5F0]">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0A0F]">
      <Navigation user={user} />

      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Status Banners */}
        {user.approval_status === 'pending' && !user.residency_proof_url && (
          <div data-testid="residency-upload-banner" className="mb-8 glass-effect p-6 rounded-2xl border-2 border-[#D4AF37]">
            <h3 className="heading-font text-2xl font-bold text-[#F7F5F0] mb-2">Upload Residency Proof</h3>
            <p className="text-[#A8A3B2] mb-4">
              Please upload proof of North Alabama or South Tennessee residency (driver's license, utility bill, etc.)
            </p>
            <label className="inline-block">
              <input
                type="file"
                onChange={handleResidencyUpload}
                accept="image/*,.pdf"
                className="hidden"
              />
              <span data-testid="upload-residency-btn" className="px-6 py-3 rounded-full bg-[#D4AF37] text-[#0B0A0F] font-semibold cursor-pointer inline-flex items-center gap-2 hover:bg-[#F0C847] transition-all duration-300">
                <Upload size={20} weight="bold" />
                Upload Document
              </span>
            </label>
          </div>
        )}

        {user.approval_status === 'pending' && user.residency_proof_url && (
          <div data-testid="pending-approval-banner" className="mb-8 glass-effect p-6 rounded-2xl border-2 border-[#D4AF37]">
            <h3 className="heading-font text-2xl font-bold text-[#F7F5F0] mb-2">Pending Approval</h3>
            <p className="text-[#A8A3B2]">
              Your account is awaiting admin approval. You'll be notified once approved!
            </p>
          </div>
        )}

        {user.approval_status === 'approved' && !user.is_premium && (
          <div data-testid="upgrade-banner" className="mb-8 glass-effect p-6 rounded-2xl border-2 border-[#B22234]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="heading-font text-2xl font-bold text-[#F7F5F0] mb-2">Upgrade to Premium</h3>
                <p className="text-[#A8A3B2]">
                  Unlock messaging, chatrooms, galleries, and more!
                </p>
              </div>
              <button
                data-testid="upgrade-to-premium-btn"
                onClick={handleUpgrade}
                className="px-8 py-3 rounded-full bg-[#D4AF37] text-[#0B0A0F] font-semibold hover:bg-[#F0C847] transition-all duration-300 flex items-center gap-2"
              >
                <Crown size={20} weight="fill" />
                Upgrade Now
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
            {user.is_premium && (
              <span className="px-4 py-1 rounded-full bg-[#D4AF37] text-[#0B0A0F] text-sm font-bold flex items-center gap-2">
                <Crown size={16} weight="fill" />
                {user.premium_plan?.toUpperCase()} MEMBER
              </span>
            )}
            {user.is_verified && (
              <span className="px-4 py-1 rounded-full bg-[#4CAF50] text-white text-sm font-bold flex items-center gap-2">
                <ShieldCheck size={16} weight="fill" />
                VERIFIED
              </span>
            )}
            <span className={`px-4 py-1 rounded-full text-sm font-bold ${
              user.approval_status === 'approved' ? 'bg-[#4CAF50] text-[#0B0A0F]' : 'bg-[#757180] text-[#F7F5F0]'
            }`}>
              {user.approval_status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Pretty Pussy of the Week */}
        {winner && winner.user && (
          <div data-testid="contest-winner-spotlight" className="mb-12 glass-effect p-8 rounded-2xl border-2 border-[#D4AF37] premium-glow">
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
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <QuickAction
            icon={<Users size={32} weight="duotone" />}
            title="Browse Members"
            description="Discover verified members"
            onClick={() => navigate('/members')}
            testId="browse-members-card"
          />
          <QuickAction
            icon={<Gift size={32} weight="duotone" />}
            title="Referrals"
            description="Share & earn rewards"
            onClick={() => navigate('/referral')}
            testId="referral-card"
          />
          <QuickAction
            icon={<Fire size={32} weight="duotone" />}
            title="Hot Wife"
            description="Exclusive section"
            onClick={() => navigate('/hotwife')}
            testId="hotwife-card"
          />
          <QuickAction
            icon={<Trophy size={32} weight="duotone" />}
            title="Contest"
            description="Submit & vote"
            onClick={() => navigate('/contest')}
            testId="contest-card"
          />
        </div>
      </main>
    </div>
  );
}

function QuickAction({ icon, title, description, onClick, locked, testId }) {
  return (
    <div
      data-testid={testId}
      onClick={locked ? null : onClick}
      className={`glass-effect p-6 rounded-2xl transition-all duration-300 ${
        locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1'
      }`}
    >
      {locked && (
        <div className="absolute top-4 right-4">
          <Crown size={20} weight="fill" className="text-[#D4AF37]" />
        </div>
      )}
      <div className="text-[#D4AF37] mb-4">{icon}</div>
      <h3 className="heading-font text-xl font-bold text-[#F7F5F0] mb-2">{title}</h3>
      <p className="text-[#A8A3B2] text-sm">{description}</p>
      {locked && <p className="text-[#D4AF37] text-xs mt-2 font-semibold">Premium Required</p>}
    </div>
  );
}
