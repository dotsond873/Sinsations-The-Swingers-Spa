import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';
import { Envelope, Lock } from '@phosphor-icons/react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      localStorage.setItem('token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      toast.success('Login successful!');
      
      const from = location.state?.from || '/dashboard';
      navigate(from);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-[#0B0A0F] flex items-center justify-center px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1
            onClick={() => navigate('/')}
            className="heading-font text-3xl md:text-4xl font-bold text-[#F7F5F0] mb-3 cursor-pointer"
          >
            Bookup your Hookup
          </h1>
          <p className="text-[#A8A3B2]">Welcome back! Sign in to continue.</p>
        </div>

        <div className="glass-effect p-8 rounded-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[#F7F5F0] text-sm font-medium mb-2">
                Email
              </label>
              <div className="relative">
                <Envelope size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8A3B2]" />
                <input
                  data-testid="login-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234] transition-all"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#F7F5F0] text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8A3B2]" />
                <input
                  data-testid="login-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234] transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="text-right mb-4">
              <button
                data-testid="forgot-password-link"
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-[#D4AF37] hover:text-[#F0C847] transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <button
              data-testid="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-[#B22234] text-[#F7F5F0] font-semibold hover:bg-[#D62839] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgba(247,245,240,0.1)]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#14121A] text-[#A8A3B2]">Or continue with</span>
            </div>
          </div>

          <button
            data-testid="google-login-btn"
            onClick={handleGoogleLogin}
            className="w-full py-3 rounded-full border border-[rgba(247,245,240,0.2)] text-[#F7F5F0] hover:bg-[rgba(247,245,240,0.05)] transition-all duration-300 flex items-center justify-center gap-3"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M19.8 10.2273C19.8 9.51818 19.7364 8.83637 19.6182 8.18182H10V12.05H15.4818C15.2364 13.3 14.5273 14.3591 13.4682 15.0682V17.5773H16.7636C18.7182 15.8364 19.8 13.2727 19.8 10.2273Z" fill="#4285F4"/>
              <path d="M10 20C12.7 20 14.9636 19.1045 16.7636 17.5773L13.4682 15.0682C12.5591 15.6682 11.3864 16.0227 10 16.0227C7.39545 16.0227 5.19091 14.2636 4.40455 11.9H0.995454V14.4909C2.78636 18.0591 6.10909 20 10 20Z" fill="#34A853"/>
              <path d="M4.40455 11.9C4.19091 11.3 4.06818 10.6591 4.06818 10C4.06818 9.34091 4.19091 8.7 4.40455 8.1V5.50909H0.995454C0.36364 6.77273 0 8.24091 0 10C0 11.7591 0.36364 13.2273 0.995454 14.4909L4.40455 11.9Z" fill="#FBBC04"/>
              <path d="M10 3.97727C11.4682 3.97727 12.7864 4.48182 13.8227 5.47273L16.6909 2.60455C14.9591 0.99091 12.6955 0 10 0C6.10909 0 2.78636 1.94091 0.995454 5.50909L4.40455 8.1C5.19091 5.73636 7.39545 3.97727 10 3.97727Z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          <p className="text-center text-[#A8A3B2] text-sm mt-6">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-[#D4AF37] hover:text-[#F0C847] transition-colors"
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
