import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SignOut, House, Users, Fire, Trophy, ShieldCheck, ChatCircle, Article, Newspaper, ChatTeardropDots } from '@phosphor-icons/react';
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
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <h1
            onClick={() => navigate('/dashboard')}
            className="heading-font text-xl lg:text-2xl font-bold text-[#F7F5F0] cursor-pointer whitespace-nowrap"
            data-testid="nav-brand"
          >
            Swingers Sensation
          </h1>

          <div className="hidden lg:flex items-center gap-4 xl:gap-5 flex-wrap">
            <NavLink testid="nav-dashboard" icon={<House size={18} />} label="Dashboard" onClick={() => navigate('/dashboard')} />
            <NavLink testid="nav-members" icon={<Users size={18} />} label="Members" onClick={() => navigate('/members')} />
            <NavLink testid="nav-messages" icon={<ChatTeardropDots size={18} />} label="Messages" onClick={() => navigate('/messages')} />
            <NavLink testid="nav-chatrooms" icon={<ChatCircle size={18} />} label="Chatrooms" onClick={() => navigate('/chatrooms')} />
            <NavLink testid="nav-forums" icon={<Article size={18} />} label="Forums" onClick={() => navigate('/forums')} />
            <NavLink testid="nav-personals" icon={<Newspaper size={18} />} label="Personals" onClick={() => navigate('/personals')} />
            <NavLink testid="nav-hotwife" icon={<Fire size={18} />} label="Hot Wife" onClick={() => navigate('/hotwife')} />
            <NavLink testid="nav-contest" icon={<Trophy size={18} />} label="Contest" onClick={() => navigate('/contest')} />
            {user?.email && user.email.includes('admin') && (
              <NavLink testid="nav-admin" icon={<ShieldCheck size={18} />} label="Admin" onClick={() => navigate('/admin')} />
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

function NavLink({ icon, label, onClick, premium, testid }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      className="flex items-center gap-1.5 text-[#F7F5F0] hover:text-[#D4AF37] transition-colors relative whitespace-nowrap"
    >
      {icon}
      <span className="text-sm">{label}</span>
      {premium && <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#D4AF37] rounded-full" />}
    </button>
  );
}
