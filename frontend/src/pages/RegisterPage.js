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
      toast.success('Welcome! Let\'s set up your profile.');
      navigate('/profile-setup');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };
      return (
        <>  
        <div className="text-center mb-8">
          <h1
            onClick={() => navigate('/')}
            className="heading-font text-3xl md:text-4xl font-bold text-[#F7F5F0] mb-3 cursor-pointer"
          >
            Swingers Sensation
          </h1>
          <p className="text-[#A8A3B2]">Join our exclusive community</p>
        
          
        </div>

        <div className="glass-effect p-8 rounded-2xl">
<form onSubmit={handleRegister} className="space-y-6">

        
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
   </>
  );
}
