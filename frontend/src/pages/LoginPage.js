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

 

  return (
    <div className="min-h-screen bg-[#0B0A0F] flex items-center justify-center px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1
            onClick={() => navigate('/')}
            className="heading-font text-3xl md:text-4xl font-bold text-[#F7F5F0] mb-3 cursor-pointer"
          >
            Swingers Sensation
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
