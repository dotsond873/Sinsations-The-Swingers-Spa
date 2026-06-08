import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignOut, House, Users, Fire, Trophy, ShieldCheck, ChatCircle, Article, Newspaper, ChatTeardropDots, List, X } from '@phosphor-icons/react';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';

const LINKS = [
  { icon: House, label: 'Dashboard', path: '/dashboard', testid: 'nav-dashboard' },
  { icon: Users, label: 'Members', path: '/members', testid: 'nav-members' },
  { icon: ChatTeardropDots, label: 'Messages', path: '/messages', testid: 'nav-messages' },
  { icon: ChatCircle, label: 'Chatrooms', path: '/chatrooms', testid: 'nav-chatrooms' },
  { icon: Article, label: 'Forums', path: '/forums', testid: 'nav-forums' },
  { icon: Newspaper, label: 'Personals', path: '/personals', testid: 'nav-personals' },
  { icon: Fire, label: 'Hot Wife', path: '/hotwife', testid: 'nav-hotwife' },
  { icon: Trophy, label: 'Contest', path: '/contest', testid: 'nav-contest' },
];

export default function Navigation({ user }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const isAdmin = user?.email && user.email.includes('admin');
  const go = (path) => {
    setMobileOpen(false);
    navigate(path);
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

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-5 flex-wrap">
            {LINKS.map(L => (
              <NavLink
                key={L.testid}
                testid={L.testid}
                icon={<L.icon size={18} />}
                label={L.label}
                onClick={() => navigate(L.path)}
              />
            ))}
            {isAdmin && (
              <NavLink testid="nav-admin" icon={<ShieldCheck size={18} />} label="Admin" onClick={() => navigate('/admin')} />
            )}
          </div>

          {/* Right cluster: logout (desktop) + mobile menu toggle */}
          <div className="flex items-center gap-2">
            <button
              data-testid="logout-btn"
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-[#F7F5F0] hover:bg-[rgba(247,245,240,0.1)] transition-all duration-300"
            >
              <SignOut size={20} />
              <span className="hidden md:inline">Logout</span>
            </button>
            <button
              data-testid="mobile-menu-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-full text-[#F7F5F0] hover:bg-[rgba(247,245,240,0.1)] transition-all"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden mt-4 pt-4 border-t border-[rgba(247,245,240,0.08)]" data-testid="mobile-menu">
            <div className="grid grid-cols-2 gap-2">
              {LINKS.map(L => (
                <button
                  key={`m-${L.testid}`}
                  data-testid={`mobile-${L.testid}`}
                  onClick={() => go(L.path)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#1C1A24] text-[#F7F5F0] hover:bg-[#252330] transition-all text-left"
                >
                  <L.icon size={20} className="text-[#D4AF37]" />
                  <span className="text-sm font-medium">{L.label}</span>
                </button>
              ))}
              {isAdmin && (
                <button
                  data-testid="mobile-nav-admin"
                  onClick={() => go('/admin')}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#1C1A24] text-[#F7F5F0] hover:bg-[#252330] transition-all text-left"
                >
                  <ShieldCheck size={20} className="text-[#D4AF37]" />
                  <span className="text-sm font-medium">Admin</span>
                </button>
              )}
              <button
                data-testid="mobile-logout-btn"
                onClick={handleLogout}
                className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#B22234] text-[#F7F5F0] hover:bg-[#D62839] transition-all"
              >
                <SignOut size={20} />
                <span className="text-sm font-semibold">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ icon, label, onClick, testid }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      className="flex items-center gap-1.5 text-[#F7F5F0] hover:text-[#D4AF37] transition-colors whitespace-nowrap"
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}
