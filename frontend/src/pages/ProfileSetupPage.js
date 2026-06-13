import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';
import { User, Target, Key } from '@phosphor-icons/react';

import asyncio
import httpx

async def keep_alive():
    await asyncio.sleep(60)  # wait 1 min after startup
    while True:
        try:
            async with httpx.AsyncClient() as client:
                await client.get("https://app-backend-6nhy.onrender.com/api/health")
        except:
            pass
        await asyncio.sleep(600)  # ping every 10 minutes

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(keep_alive())

const SECURITY_QUESTION_PRESETS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What was your mother's maiden name?",
  "What was the name of your elementary school?",
  "What was your childhood nickname?",
  "What's the name of your favorite teacher?",
  "What was the make of your first car?",
  "Custom question (enter your own below)",
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'trans_male', label: 'Trans Male' },
  { value: 'trans_female', label: 'Trans Female' },
  { value: 'non_binary', label: 'Non-Binary' },
  { value: 'couple_mf', label: 'Couple (M/F)' },
  { value: 'couple_mm', label: 'Couple (M/M)' },
  { value: 'couple_ff', label: 'Couple (F/F)' },
  { value: 'other', label: 'Other' },
];

const AGE_RANGES = [
  { value: '18-25', label: '18-25' },
  { value: '26-35', label: '26-35' },
  { value: '36-45', label: '36-45' },
  { value: '46-55', label: '46-55' },
  { value: '56-65', label: '56-65' },
  { value: '65+', label: '65+' },
];

const RACE_OPTIONS = [
  { value: 'white', label: 'White/Caucasian' },
  { value: 'black', label: 'Black/African American' },
  { value: 'hispanic', label: 'Hispanic/Latino' },
  { value: 'asian', label: 'Asian' },
  { value: 'native', label: 'Native American' },
  { value: 'pacific', label: 'Pacific Islander' },
  { value: 'middle_eastern', label: 'Middle Eastern' },
  { value: 'mixed', label: 'Mixed/Multi-Racial' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not', label: 'Prefer not to say' },
];

const ORIENTATION_OPTIONS = [
  { value: 'straight', label: 'Straight' },
  { value: 'gay', label: 'Gay' },
  { value: 'lesbian', label: 'Lesbian' },
  { value: 'bisexual', label: 'Bisexual' },
  { value: 'pansexual', label: 'Pansexual' },
  { value: 'bicurious', label: 'Bi-Curious' },
  { value: 'open', label: 'Open to All' },
  { value: 'other', label: 'Other' },
];

const LOOKING_FOR_OPTIONS = [
  { value: 'single_male', label: 'Single Males' },
  { value: 'single_female', label: 'Single Females' },
  { value: 'couples', label: 'Couples' },
  { value: 'groups', label: 'Group Play' },
  { value: 'friendship', label: 'Friendship First' },
  { value: 'casual', label: 'Casual Encounters' },
  { value: 'fwb', label: 'Friends with Benefits' },
  { value: 'hotwife', label: 'Hotwife/Cuckold' },
  { value: 'voyeur', label: 'Voyeurism' },
  { value: 'exhibitionist', label: 'Exhibitionism' },
  { value: 'threesome', label: 'Threesomes' },
  { value: 'swapping', label: 'Full Swap' },
  { value: 'soft_swap', label: 'Soft Swap' },
  { value: 'same_room', label: 'Same Room Play' },
];

export default function ProfileSetupPage({ user: propUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(propUser);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState(() => ({
    gender: propUser?.gender || '',
    age_range: propUser?.preferences?.age_range || '',
    race: propUser?.preferences?.race || '',
    orientation: propUser?.preferences?.orientation || '',
    looking_for: propUser?.preferences?.looking_for || [],
    bio: propUser?.bio || '',
    city: propUser?.city || '',
    state: propUser?.state || '',
    area_code: propUser?.area_code || '',
  }));

  const [security, setSecurity] = useState({
    preset: '',
    customQuestion: '',
    answer: '',
    saving: false,
    saved: propUser?.security_question ? true : false,
    existingQuestion: propUser?.security_question || '',
  });

  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current || user) return;
    axios.get(`${API}/auth/me`, { withCredentials: true })
      .then(res => {
        initRef.current = true;
        setUser(res.data);
        setPreferences(prev => ({
          ...prev,
          ...(res.data.preferences || {}),
          gender: res.data.gender || prev.gender,
          bio: res.data.bio || prev.bio,
          city: res.data.city || prev.city,
          state: res.data.state || prev.state,
          area_code: res.data.area_code || prev.area_code,
        }));
        setSecurity(prev => ({
          ...prev,
          saved: !!res.data.security_question,
          existingQuestion: res.data.security_question || '',
        }));
      })
      .catch(() => navigate('/login'));
  }, [user, navigate]);

  const saveSecurityQuestion = async () => {
    const q = security.preset === 'Custom question (enter your own below)'
      ? security.customQuestion.trim()
      : security.preset;
    if (!q || q.length < 5) {
      toast.error('Pick or enter a question (at least 5 characters)');
      return;
    }
    if (security.answer.trim().length < 2) {
      toast.error('Answer must be at least 2 characters');
      return;
    }
    setSecurity(prev => ({ ...prev, saving: true }));
    try {
      await axios.post(`${API}/auth/security-question`, {
        question: q,
        answer: security.answer,
      }, { withCredentials: true });
      toast.success('Security question saved');
      setSecurity(prev => ({
        ...prev,
        saving: false,
        saved: true,
        existingQuestion: q,
        answer: '',
      }));
    } catch (err) {
      toast.error('Failed to save security question');
      setSecurity(prev => ({ ...prev, saving: false }));
    }
  };

  const handleLookingForChange = (value) => {
    setPreferences(prev => {
      const current = prev.looking_for || [];
      if (current.includes(value)) {
        return { ...prev, looking_for: current.filter(v => v !== value) };
      } else {
        return { ...prev, looking_for: [...current, value] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.put(`${API}/users/profile`, {
        gender: preferences.gender,
        bio: preferences.bio,
        city: preferences.city,
        state: preferences.state,
        area_code: preferences.area_code,
        preferences: {
          age_range: preferences.age_range,
          race: preferences.race,
          orientation: preferences.orientation,
          looking_for: preferences.looking_for,
        }
      }, { withCredentials: true });

      toast.success('Profile updated!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  if (!user) {
    return <div className="min-h-screen bg-[#0B0A0F] flex items-center justify-center">
      <div className="text-[#F7F5F0]">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0A0F] py-12 px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="heading-font text-3xl md:text-4xl font-bold text-[#F7F5F0] mb-3">
            Complete Your Profile
          </h1>
          <p className="text-[#A8A3B2]">
            Tell us about yourself so we can help you find the right connections
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* About You Section */}
          <div className="glass-effect p-8 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <User size={28} weight="fill" className="text-[#D4AF37]" />
              <h2 className="heading-font text-2xl font-bold text-[#F7F5F0]">About You</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[#F7F5F0] text-sm font-medium mb-2">
                  I Am *
                </label>
                <select
                  data-testid="gender-select"
                  value={preferences.gender}
                  onChange={(e) => setPreferences({ ...preferences, gender: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234]"
                >
                  <option value="">Select...</option>
                  {GENDER_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#F7F5F0] text-sm font-medium mb-2">
                  Age Range *
                </label>
                <select
                  data-testid="age-select"
                  value={preferences.age_range}
                  onChange={(e) => setPreferences({ ...preferences, age_range: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234]"
                >
                  <option value="">Select...</option>
                  {AGE_RANGES.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#F7F5F0] text-sm font-medium mb-2">
                  Race/Ethnicity
                </label>
                <select
                  data-testid="race-select"
                  value={preferences.race}
                  onChange={(e) => setPreferences({ ...preferences, race: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234]"
                >
                  <option value="">Select...</option>
                  {RACE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#F7F5F0] text-sm font-medium mb-2">
                  Sexual Orientation *
                </label>
                <select
                  data-testid="orientation-select"
                  value={preferences.orientation}
                  onChange={(e) => setPreferences({ ...preferences, orientation: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234]"
                >
                  <option value="">Select...</option>
                  {ORIENTATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-[#F7F5F0] text-sm font-medium mb-2">
                About Me (Bio)
              </label>
              <textarea
                data-testid="bio-textarea"
                value={preferences.bio}
                onChange={(e) => setPreferences({ ...preferences, bio: e.target.value })}
                placeholder="Tell others about yourself, your interests, what makes you unique..."
                rows={4}
                className="w-full px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234] resize-none"
              />
            </div>
          </div>

          {/* Location Section */}
          <div className="glass-effect p-8 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Target size={28} weight="fill" className="text-[#D4AF37]" />
              <h2 className="heading-font text-2xl font-bold text-[#F7F5F0]">Location</h2>
            </div>
            <p className="text-[#A8A3B2] mb-4 text-sm">Help nearby members find you. All fields optional.</p>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[#F7F5F0] text-sm font-medium mb-2">City</label>
                <input
                  data-testid="city-input"
                  type="text"
                  value={preferences.city}
                  onChange={(e) => setPreferences({ ...preferences, city: e.target.value })}
                  placeholder="Huntsville"
                  className="w-full px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234]"
                />
              </div>
              <div>
                <label className="block text-[#F7F5F0] text-sm font-medium mb-2">State</label>
                <select
                  data-testid="state-select"
                  value={preferences.state}
                  onChange={(e) => setPreferences({ ...preferences, state: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234]"
                >
                  <option value="">Select…</option>
                  <option value="AL">Alabama</option>
                  <option value="TN">Tennessee</option>
                  <option value="GA">Georgia</option>
                  <option value="MS">Mississippi</option>
                  <option value="KY">Kentucky</option>
                  <option value="FL">Florida</option>
                  <option value="NC">North Carolina</option>
                  <option value="SC">South Carolina</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[#F7F5F0] text-sm font-medium mb-2">Area Code</label>
                <input
                  data-testid="area-code-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={preferences.area_code}
                  onChange={(e) => setPreferences({ ...preferences, area_code: e.target.value.replace(/\D/g, '').slice(0,5) })}
                  placeholder="256"
                  className="w-full px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234]"
                />
              </div>
            </div>
          </div>

          {/* Looking For Section */}
          <div className="glass-effect p-8 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Target size={28} weight="fill" className="text-[#D4AF37]" />
              <h2 className="heading-font text-2xl font-bold text-[#F7F5F0]">What I&apos;m Looking For</h2>
            </div>
            <p className="text-[#A8A3B2] mb-4 text-sm">Select all that apply</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {LOOKING_FOR_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  data-testid={`looking-for-${opt.value}`}
                  onClick={() => handleLookingForChange(opt.value)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    preferences.looking_for?.includes(opt.value)
                      ? 'bg-[#B22234] text-[#F7F5F0] border-2 border-[#B22234]'
                      : 'bg-[#1C1A24] text-[#A8A3B2] border border-[rgba(247,245,240,0.1)] hover:border-[#B22234]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Security Question Section */}
          <div className="glass-effect p-8 rounded-2xl" data-testid="security-question-section">
            <div className="flex items-center gap-3 mb-3">
              <Key size={28} weight="fill" className="text-[#D4AF37]" />
              <h2 className="heading-font text-2xl font-bold text-[#F7F5F0]">Security Question</h2>
            </div>
            <p className="text-[#A8A3B2] mb-5 text-sm">
              Set this up so you can reset your password if you ever forget it.
              {security.saved && (
                <span className="block mt-2 text-[#4CAF50]">
                  Current question: <span className="text-[#F7F5F0] font-semibold">{security.existingQuestion}</span>
                </span>
              )}
            </p>

            <label className="block text-[#F7F5F0] text-sm font-medium mb-2">Choose a question</label>
            <select
              data-testid="security-question-preset"
              value={security.preset}
              onChange={(e) => setSecurity({ ...security, preset: e.target.value })}
              className="w-full px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234] mb-4"
            >
              <option value="">Select a question…</option>
              {SECURITY_QUESTION_PRESETS.map(q => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>

            {security.preset === 'Custom question (enter your own below)' && (
              <input
                data-testid="security-question-custom"
                type="text"
                value={security.customQuestion}
                onChange={(e) => setSecurity({ ...security, customQuestion: e.target.value })}
                placeholder="Write your own question…"
                className="w-full px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234] mb-4"
              />
            )}

            <label className="block text-[#F7F5F0] text-sm font-medium mb-2">Your answer</label>
            <input
              data-testid="security-answer-input"
              type="text"
              value={security.answer}
              onChange={(e) => setSecurity({ ...security, answer: e.target.value })}
              placeholder="Not case-sensitive — keep it memorable"
              className="w-full px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234] mb-4"
            />

            <button
              data-testid="save-security-question-btn"
              type="button"
              onClick={saveSecurityQuestion}
              disabled={security.saving}
              className="w-full py-3 rounded-full bg-[#D4AF37] text-[#0B0A0F] font-semibold hover:bg-[#F0C847] transition-all duration-300 disabled:opacity-50"
            >
              {security.saving ? 'Saving…' : security.saved ? 'Update Security Question' : 'Save Security Question'}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 py-3 rounded-full border border-[rgba(247,245,240,0.2)] text-[#F7F5F0] hover:bg-[rgba(247,245,240,0.05)] transition-all duration-300"
            >
              Skip for Now
            </button>
            <button
              type="submit"
              disabled={loading}
              data-testid="save-profile-btn"
              className="flex-1 py-3 rounded-full bg-[#B22234] text-[#F7F5F0] font-semibold hover:bg-[#D62839] transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
