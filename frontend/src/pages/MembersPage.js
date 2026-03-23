import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import Navigation from '../components/Navigation';
import { MapPin, Crown } from '@phosphor-icons/react';

export default function MembersPage({ user: propUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(propUser);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genderFilter, setGenderFilter] = useState('');

  useEffect(() => {
    if (!user) {
      axios.get(`${API}/auth/me`, { withCredentials: true })
        .then(res => setUser(res.data))
        .catch(() => navigate('/login'));
    }
    fetchMembers();
  }, [genderFilter, user, navigate]);

  const fetchMembers = async () => {
    try {
      const params = genderFilter ? { gender: genderFilter } : {};
      const response = await axios.get(`${API}/members`, { params, withCredentials: true });
      setMembers(response.data);
    } catch (error) {
      console.error('Failed to fetch members', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0B0A0F]">
      <Navigation user={user} />
      <main className="max-w-7xl mx-auto px-8 py-12">
        <h1 className="heading-font text-4xl font-bold text-[#F7F5F0] mb-6">Browse Members</h1>
        <div className="flex gap-4 mb-8">
          {['', 'male', 'female', 'couple'].map(filter => (
            <button key={filter} onClick={() => setGenderFilter(filter)}
              className={`px-6 py-2 rounded-full transition-all ${genderFilter === filter ? 'bg-[#B22234] text-[#F7F5F0]' : 'glass-effect text-[#A8A3B2]'}`}>
              {filter === '' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
        {loading ? <div className="text-[#F7F5F0]">Loading...</div> : (
          <div className="grid md:grid-cols-3 gap-6">
            {members.map(m => (
              <div key={m.user_id} onClick={() => navigate(`/profile/${m.user_id}`)}
                className="glass-effect p-6 rounded-2xl cursor-pointer hover:-translate-y-1 transition-all">
                <div className="flex gap-4">
                  {m.picture ? <img src={m.picture} alt={m.name} className="w-16 h-16 rounded-full" /> :
                    <div className="w-16 h-16 rounded-full bg-[#1C1A24] flex items-center justify-center">
                      <span className="text-2xl text-[#D4AF37]">{m.name[0]}</span>
                    </div>}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-[#F7F5F0]">{m.name}</h3>
                      {m.is_premium && <Crown size={16} weight="fill" className="text-[#D4AF37]" />}
                    </div>
                    {m.age && <p className="text-[#A8A3B2] text-sm">{m.age} • {m.gender}</p>}
                    {m.location && <div className="flex items-center gap-1 text-[#A8A3B2] text-sm"><MapPin size={14} />{m.location}</div>}
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
