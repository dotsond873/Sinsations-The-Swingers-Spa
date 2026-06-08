import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import Navigation from '../components/Navigation';
import { MapPin, Crown, MagnifyingGlass, Funnel, X } from '@phosphor-icons/react';

const STATES = [
  { value: '', label: 'Any state' },
  { value: 'AL', label: 'Alabama' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'GA', label: 'Georgia' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'FL', label: 'Florida' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'SC', label: 'South Carolina' },
];

export default function MembersPage({ user: propUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(propUser);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    q: '',
    gender: '',
    city: '',
    state: '',
    area_code: '',
  });

  useEffect(() => {
    if (!user) {
      axios.get(`${API}/auth/me`, { withCredentials: true })
        .then(res => setUser(res.data))
        .catch(() => navigate('/login'));
    }
  }, [user, navigate]);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v.toString().trim()) params[k] = v.toString().trim();
      });
      const response = await axios.get(`${API}/members`, { params, withCredentials: true });
      setMembers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch members', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Debounced fetch when filters change
  useEffect(() => {
    if (!user) return;
    const t = setTimeout(fetchMembers, 300);
    return () => clearTimeout(t);
  }, [filters, user, fetchMembers]);

  const clearFilters = () => {
    setFilters({ q: '', gender: '', city: '', state: '', area_code: '' });
  };

  const activeFilterCount = Object.values(filters).filter(v => v && v.toString().trim()).length;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0B0A0F]">
      <Navigation user={user} />
      <main className="max-w-7xl mx-auto px-6 py-10" data-testid="members-page">
        <div className="mb-6">
          <h1 className="heading-font text-4xl font-bold text-[#F7F5F0] mb-2">Browse Members</h1>
          <p className="text-[#A8A3B2]">Find people by name, city, state, or area code</p>
        </div>

        {/* Search Bar */}
        <div className="glass-effect rounded-2xl p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#757180]" />
              <input
                data-testid="member-search-input"
                type="text"
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                placeholder="Search by name, city, state, or area code…"
                className="w-full pl-12 pr-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-full text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234]"
              />
            </div>
            <button
              data-testid="toggle-filters-btn"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold transition-all ${
                showFilters || activeFilterCount > 0
                  ? 'bg-[#B22234] text-[#F7F5F0]'
                  : 'bg-[#1C1A24] text-[#F7F5F0] border border-[rgba(247,245,240,0.1)] hover:bg-[#252330]'
              }`}
            >
              <Funnel size={18} weight={activeFilterCount > 0 ? 'fill' : 'regular'} />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#0B0A0F] text-xs font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button
                data-testid="clear-filters-btn"
                onClick={clearFilters}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-full text-[#A8A3B2] hover:text-[#F7F5F0] transition-all"
              >
                <X size={16} />
                Clear
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[rgba(247,245,240,0.08)]" data-testid="advanced-filters">
              <div>
                <label className="block text-[#A8A3B2] text-xs mb-1.5 uppercase tracking-wide">I&apos;m Looking For</label>
                <select
                  data-testid="filter-gender"
                  value={filters.gender}
                  onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234] text-sm"
                >
                  <option value="">Any gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="trans_male">Trans Male</option>
                  <option value="trans_female">Trans Female</option>
                  <option value="non_binary">Non-Binary</option>
                  <option value="couple_mf">Couple (M/F)</option>
                  <option value="couple_mm">Couple (M/M)</option>
                  <option value="couple_ff">Couple (F/F)</option>
                </select>
              </div>
              <div>
                <label className="block text-[#A8A3B2] text-xs mb-1.5 uppercase tracking-wide">City</label>
                <input
                  data-testid="filter-city"
                  type="text"
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  placeholder="Huntsville"
                  className="w-full px-3 py-2.5 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234] text-sm"
                />
              </div>
              <div>
                <label className="block text-[#A8A3B2] text-xs mb-1.5 uppercase tracking-wide">State</label>
                <select
                  data-testid="filter-state"
                  value={filters.state}
                  onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234] text-sm"
                >
                  {STATES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#A8A3B2] text-xs mb-1.5 uppercase tracking-wide">Area Code</label>
                <input
                  data-testid="filter-area-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={filters.area_code}
                  onChange={(e) => setFilters({ ...filters, area_code: e.target.value.replace(/\D/g, '').slice(0,5) })}
                  placeholder="256"
                  className="w-full px-3 py-2.5 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234] text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && !showFilters && (
          <div className="flex flex-wrap gap-2 mb-4" data-testid="active-filter-chips">
            {Object.entries(filters).map(([k, v]) => v && v.toString().trim() ? (
              <span key={k} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1C1A24] text-[#D4AF37] text-sm border border-[#D4AF37]/40">
                {k === 'q' ? 'search' : k.replace('_', ' ')}: <span className="text-[#F7F5F0] font-semibold">{v}</span>
                <button onClick={() => setFilters({ ...filters, [k]: '' })} className="hover:text-[#B22234]">
                  <X size={12} weight="bold" />
                </button>
              </span>
            ) : null)}
          </div>
        )}

        {/* Results count */}
        <p className="text-[#A8A3B2] text-sm mb-4" data-testid="members-count">
          {loading ? 'Searching…' : `${members.length} member${members.length === 1 ? '' : 's'} found`}
        </p>

        {/* Members grid */}
        {loading ? (
          <div className="text-[#F7F5F0]">Loading...</div>
        ) : members.length === 0 ? (
          <div className="glass-effect p-12 rounded-2xl text-center" data-testid="no-members">
            <MagnifyingGlass size={56} weight="duotone" className="text-[#757180] mx-auto mb-3" />
            <p className="text-[#F7F5F0] font-semibold mb-1">No members match your search</p>
            <p className="text-[#A8A3B2] text-sm">Try fewer filters or a broader search term.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map(m => (
              <div
                key={m.user_id}
                data-testid={`member-card-${m.user_id}`}
                onClick={() => navigate(`/profile/${m.user_id}`)}
                className="glass-effect p-6 rounded-2xl cursor-pointer hover:-translate-y-1 transition-all"
              >
                <div className="flex gap-4">
                  {m.picture ? (
                    <img src={m.picture} alt={m.name} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#1C1A24] flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl text-[#D4AF37]">{(m.name || '?')[0]}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-[#F7F5F0] truncate">{m.name}</h3>
                      {m.is_premium && <Crown size={14} weight="fill" className="text-[#D4AF37]" />}
                      {m.is_verified && (
                        <span className="px-2 py-0.5 rounded text-xs bg-[#4CAF50] text-white font-bold">✓</span>
                      )}
                    </div>
                    {m.age && (
                      <p className="text-[#A8A3B2] text-sm">
                        {m.age} • {(m.gender || '').replace('_', ' ')}
                      </p>
                    )}
                    {(m.city || m.state || m.location) && (
                      <div className="flex items-center gap-1 text-[#A8A3B2] text-sm mt-1 truncate">
                        <MapPin size={14} className="flex-shrink-0" />
                        <span className="truncate">
                          {[m.city, m.state].filter(Boolean).join(', ') || m.location}
                          {m.area_code && ` · ${m.area_code}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
