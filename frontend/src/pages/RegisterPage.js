import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';
import { User, Envelope, Lock, MapPin, Calendar } from '@phosphor-icons/react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const planId = location.state?.planId;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    gender: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, {
        ...formData,
        age: parseInt(formData.age),
      });
      
      localStorage.setItem('token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      toast.success('Registration successful! Please upload residency proof.');
      navigate('/dashboard', { state: { needsResidencyProof: true, planId } });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
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
    <div className="min-h-screen bg-[#0B0A0F] py-12 px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1
            onClick={() => navigate('/')}
            className="heading-font text-3xl md:text-4xl font-bold text-[#F7F5F0] mb-3 cursor-pointer"
          >
            Bookup your Hookup
          </h1>
          <p className="text-[#A8A3B2]">Join our exclusive community</p>
        </div>

        <div className="glass-effect p-8 rounded-2xl">
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[#F7F5F0] text-sm font-medium mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8A3B2]" />
                  <input
                    data-testid="register-name-input"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#F7F5F0] text-sm font-medium mb-2">
                  Email
                </label>
                <div className="relative">
                  <Envelope size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8A3B2]" />
                  <input
                    data-testid="register-email-input"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234] transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[#F7F5F0] text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8A3B2]" />
                <input
                  data-testid="register-password-input"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234] transition-all"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[#F7F5F0] text-sm font-medium mb-2">
                  Age
                </label>
                <div className="relative">
                  <Calendar size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8A3B2]" />
                  <input
                    data-testid="register-age-input"
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    min="18"
                    className="w-full pl-12 pr-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#F7F5F0] text-sm font-medium mb-2">
                  Gender
                </label>
                <select
                  data-testid="register-gender-select"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234] transition-all"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="couple">Couple</option>
                </select>
              </div>

              <div>
                <label className="block text-[#F7F5F0] text-sm font-medium mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8A3B2]" />
                  <input
                    data-testid="register-location-input"
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    placeholder="City, State"
                    className="w-full pl-12 pr-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234] transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              data-testid="register-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-[#B22234] text-[#F7F5F0] font-semibold hover:bg-[#D62839] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
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
            data-testid="google-register-btn"
            onClick={handleGoogleLogin}
            className="w-full py-3 rounded-full border border-[rgba(247,245,240,0.2)] text-[#F7F5F0] hover:bg-[rgba(247,245,240,0.05)] transition-all duration-300 flex items-center justify-center gap-3"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M19.8 10.2273C19.8 9.51818 19.7364 8.83637 19.6182 8.18182H10V12.05H15.4818C15.2364 13.3 14.5273 14.3591 13.4682 15.0682V17.5773H16.7636C18.7182 15.8364 19.8 13.2727 19.8 10.2273Z" fill="#4285F4"/>
              <path d="M10 20C12.7 20 14.9636 19.1045 16.7636 17.5773L13.4682 15.0682C12.5591 15.6682 11.3864 16.0227 10 16.0227C7.39545 16.0227 5.19091 14.2636 4.40455 11.9H0.995454V14.4909C2.78636 18.0591 6.10909 20 10 20Z" fill="#34A853"/>
              <path d="M4.40455 11.9C4.19091 11.3 4.06818 10.6591 4.06818 10C4.06818 9.34091 4.19091 8.7 4.40455 8.1V5.50909H0.995454C0.36364 6.77273 0 8.24091 0 10C0 11.7591 0.36364 13.2273 0.995454 14.4909L4.40455 11.9Z" fill="#FBBC04"/>
              <path d="M10 3.97727C11.4682 3.97727 12.7864 4.48182 13.8227 5.47273L16.6909 2.60455C14.9591 0.99091 12.6955 0 10 0C6.10909 0 2.78636 1.94091 0.995454 5.50909L4.40455 8.1C5.19091 5.73636 7.39545 3.97727 10 3.97727Z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>

          <p className="text-center text-[#A8A3B2] text-sm mt-6">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-[#D4AF37] hover:text-[#F0C847] transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
