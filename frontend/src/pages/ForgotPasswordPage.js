import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';
import { Lock, EnvelopeSimple, Question, Key } from '@phosphor-icons/react';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' | 'answer' | 'done' | 'no-question'
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const lookup = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/forgot-password/lookup`, { email });
      if (!res.data.has_question) {
        setStep('no-question');
      } else {
        setQuestion(res.data.question);
        setStep('answer');
      }
    } catch (err) {
      toast.error('Unable to look up account');
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/forgot-password/reset`, {
        email,
        answer,
        new_password: newPassword,
      });
      toast.success('Password reset! Please log in.');
      setStep('done');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0A0F] flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        <button
          onClick={() => navigate('/login')}
          className="text-[#A8A3B2] hover:text-[#F7F5F0] mb-6 text-sm"
        >
          ← Back to Login
        </button>

        <div className="glass-effect p-8 rounded-2xl" data-testid="forgot-password-page">
          <div className="flex items-center gap-3 mb-6">
            <Key size={32} weight="fill" className="text-[#D4AF37]" />
            <h1 className="heading-font text-3xl font-bold text-[#F7F5F0]">Reset Password</h1>
          </div>

          {step === 'email' && (
            <form onSubmit={lookup}>
              <p className="text-[#A8A3B2] text-sm mb-5">Enter the email on your account. We&apos;ll ask the security question you set up.</p>
              <label className="block text-[#F7F5F0] text-sm font-medium mb-2">Email</label>
              <div className="relative mb-4">
                <EnvelopeSimple size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#757180]" />
                <input
                  data-testid="forgot-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234]"
                />
              </div>
              <button
                data-testid="forgot-lookup-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-[#B22234] text-[#F7F5F0] font-semibold hover:bg-[#D62839] disabled:opacity-50"
              >
                {loading ? 'Looking up…' : 'Continue'}
              </button>
            </form>
          )}

          {step === 'no-question' && (
            <div className="text-center" data-testid="forgot-no-question">
              <Question size={48} weight="duotone" className="text-[#757180] mx-auto mb-3" />
              <p className="text-[#F7F5F0] font-semibold mb-2">No security question on file</p>
              <p className="text-[#A8A3B2] text-sm mb-5">
                Either we don&apos;t recognise this email, or you never set up a security question.
                Please contact an admin to reset your password manually.
              </p>
              <button
                onClick={() => { setStep('email'); setEmail(''); }}
                className="w-full py-3 rounded-full border border-[rgba(247,245,240,0.2)] text-[#F7F5F0]"
              >
                Try another email
              </button>
            </div>
          )}

          {step === 'answer' && (
            <form onSubmit={submitReset}>
              <div className="mb-4 p-4 bg-[#1C1A24] rounded-lg">
                <p className="text-xs text-[#A8A3B2] uppercase tracking-wide mb-1">Your security question</p>
                <p className="text-[#F7F5F0] font-semibold" data-testid="security-question-text">{question}</p>
              </div>

              <label className="block text-[#F7F5F0] text-sm font-medium mb-2">Answer</label>
              <div className="relative mb-4">
                <Question size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#757180]" />
                <input
                  data-testid="forgot-answer-input"
                  type="text"
                  required
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Your answer (not case-sensitive)"
                  className="w-full pl-12 pr-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234]"
                />
              </div>

              <label className="block text-[#F7F5F0] text-sm font-medium mb-2">New Password</label>
              <div className="relative mb-4">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#757180]" />
                <input
                  data-testid="forgot-new-password-input"
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-12 pr-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234]"
                />
              </div>

              <label className="block text-[#F7F5F0] text-sm font-medium mb-2">Confirm Password</label>
              <div className="relative mb-5">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#757180]" />
                <input
                  data-testid="forgot-confirm-password-input"
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-12 pr-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234]"
                />
              </div>

              <button
                data-testid="forgot-reset-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-[#B22234] text-[#F7F5F0] font-semibold hover:bg-[#D62839] disabled:opacity-50"
              >
                {loading ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center" data-testid="forgot-done">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#4CAF50]/20 flex items-center justify-center">
                <Key size={32} weight="fill" className="text-[#4CAF50]" />
              </div>
              <p className="text-[#F7F5F0] font-semibold mb-2">Password reset!</p>
              <p className="text-[#A8A3B2] text-sm mb-5">You can now log in with your new password.</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 rounded-full bg-[#B22234] text-[#F7F5F0] font-semibold hover:bg-[#D62839]"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
