import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SignOut, House, Users, MessageCircle, ChatCircle, Article, Fire, Trophy, ShieldCheck } from '@phosphor-icons/react';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';

export default function Navigation({ user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      localStorage.removeItem('token');
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <nav className="glass-effect sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          <h1
            onClick={() => navigate('/dashboard')}
            className="heading-font text-2xl font-bold text-[#F7F5F0] cursor-pointer"
          >
            Bookup your Hookup
          </h1>

          <div className="hidden md:flex items-center gap-6">
            <NavLink icon={<House size={20} />} label="Dashboard" onClick={() => navigate('/dashboard')} />
            <NavLink icon={<Users size={20} />} label="Members" onClick={() => navigate('/members')} />
            <NavLink icon={<MessageCircle size={20} />} label="Messages" onClick={() => navigate('/messages')} premium={!user?.is_premium} />
            <NavLink icon={<ChatCircle size={20} />} label="Chatrooms" onClick={() => navigate('/chatrooms')} premium={!user?.is_premium} />
            <NavLink icon={<Article size={20} />} label="Forums" onClick={() => navigate('/forums')} />
            <NavLink icon={<Fire size={20} />} label="Hot Wife" onClick={() => navigate('/hotwife')} />
            <NavLink icon={<Trophy size={20} />} label="Contest" onClick={() => navigate('/contest')} />
            {user?.email && user.email.includes('admin') && (
              <NavLink icon={<ShieldCheck size={20} />} label="Admin" onClick={() => navigate('/admin')} />
            )}
          </div>

          <button
            data-testid="logout-btn"
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-[#F7F5F0] hover:bg-[rgba(247,245,240,0.1)] transition-all duration-300"
          >
            <SignOut size={20} />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ icon, label, onClick, premium }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-[#F7F5F0] hover:text-[#D4AF37] transition-colors relative"
    >
      {icon}
      <span className="text-sm">{label}</span>
      {premium && <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#D4AF37] rounded-full" />}
    </button>
  );
}
