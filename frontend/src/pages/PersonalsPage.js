import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import Navigation from '../components/Navigation';
import { Newspaper, Plus, User, MapPin, Heart } from '@phosphor-icons/react';
import { toast } from 'sonner';

const PERSONAL_CATEGORIES = [
  { value: 'couple_seeking', label: 'Couple Seeking', icon: '👫' },
  { value: 'male_seeking', label: 'Male Seeking', icon: '👨' },
  { value: 'female_seeking', label: 'Female Seeking', icon: '👩' },
  { value: 'group_fun', label: 'Group Fun', icon: '🎉' },
  { value: 'hotwife', label: 'Hotwife/Cuckold', icon: '🔥' },
  { value: 'travel', label: 'Travel Partners', icon: '✈️' },
];

export default function PersonalsPage({ user: propUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(propUser);
  const [personals, setPersonals] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPersonal, setNewPersonal] = useState({ title: '', content: '', category: 'couple_seeking' });
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    if (!user) {
      axios.get(`${API}/auth/me`, { withCredentials: true })
        .then(res => setUser(res.data))
        .catch(() => navigate('/login'));
    }
    fetchPersonals();
  }, [user, navigate, categoryFilter]);

  const fetchPersonals = async () => {
    try {
      const params = categoryFilter ? { category: categoryFilter } : {};
      const response = await axios.get(`${API}/personals`, { params, withCredentials: true });
      setPersonals(response.data);
    } catch (error) {
      console.error('Failed to fetch personals');
    } finally {
      setLoading(false);
    }
  };

  const createPersonal = async () => {
    if (!newPersonal.title.trim() || !newPersonal.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      await axios.post(`${API}/personals`, newPersonal, { withCredentials: true });
      toast.success('Personal ad posted!');
      setShowCreateModal(false);
      setNewPersonal({ title: '', content: '', category: 'couple_seeking' });
      fetchPersonals();
    } catch (error) {
      toast.error('Failed to create personal');
    }
  };

  const getCategoryInfo = (cat) => PERSONAL_CATEGORIES.find(c => c.value === cat) || PERSONAL_CATEGORIES[0];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0B0A0F]">
      <Navigation user={user} />
      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Newspaper size={40} weight="fill" className="text-[#D4AF37]" />
            <h1 className="heading-font text-4xl font-bold text-[#F7F5F0]">Personals</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 rounded-full bg-[#B22234] text-[#F7F5F0] font-semibold hover:bg-[#D62839] transition-all flex items-center gap-2"
          >
            <Plus size={20} weight="bold" />
            Post Ad
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setCategoryFilter('')}
            className={`px-4 py-2 rounded-full transition-all ${
              categoryFilter === '' ? 'bg-[#D4AF37] text-[#0B0A0F]' : 'glass-effect text-[#A8A3B2]'
            }`}
          >
            All
          </button>
          {PERSONAL_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 ${
                categoryFilter === cat.value 
                  ? 'bg-[#B22234] text-[#F7F5F0]' 
                  : 'glass-effect text-[#A8A3B2] hover:text-[#F7F5F0]'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Personals List */}
        {loading ? (
          <p className="text-[#A8A3B2]">Loading...</p>
        ) : personals.length === 0 ? (
          <div className="glass-effect p-12 rounded-2xl text-center">
            <Newspaper size={64} weight="duotone" className="text-[#757180] mx-auto mb-4" />
            <p className="text-[#A8A3B2]">No personals yet. Post the first ad!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {personals.map(personal => {
              const categoryInfo = getCategoryInfo(personal.category);
              return (
                <div key={personal.personal_id} className="glass-effect p-6 rounded-2xl">
                  <div className="flex items-start justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-[#B22234] text-[#F7F5F0] text-sm font-semibold flex items-center gap-1">
                      <span>{categoryInfo.icon}</span>
                      {categoryInfo.label}
                    </span>
                    <span className="text-[#757180] text-sm">
                      {new Date(personal.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-[#F7F5F0] mb-3">{personal.title}</h3>
                  <p className="text-[#A8A3B2] mb-4 whitespace-pre-wrap line-clamp-4">{personal.content}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-[rgba(247,245,240,0.1)]">
                    <button
                      onClick={() => navigate(`/profile/${personal.user_id}`)}
                      className="flex items-center gap-2 text-[#D4AF37] hover:text-[#F0C847] transition-colors"
                    >
                      <User size={18} />
                      <span className="font-semibold">{personal.user_name}</span>
                    </button>
                    <button
                      onClick={() => navigate('/messages', { state: { recipientId: personal.user_id } })}
                      className="px-4 py-2 rounded-full bg-[#D4AF37] text-[#0B0A0F] font-semibold hover:bg-[#F0C847] transition-all flex items-center gap-2"
                    >
                      <Heart size={16} weight="fill" />
                      Respond
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Personal Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="glass-effect p-8 rounded-2xl max-w-lg w-full">
              <h2 className="heading-font text-2xl font-bold text-[#F7F5F0] mb-6">Post Personal Ad</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#F7F5F0] font-medium mb-2">Category *</label>
                  <select
                    value={newPersonal.category}
                    onChange={(e) => setNewPersonal({ ...newPersonal, category: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234]"
                  >
                    {PERSONAL_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#F7F5F0] font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    value={newPersonal.title}
                    onChange={(e) => setNewPersonal({ ...newPersonal, title: e.target.value })}
                    placeholder="e.g., Couple looking for single female..."
                    className="w-full px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234]"
                  />
                </div>
                <div>
                  <label className="block text-[#F7F5F0] font-medium mb-2">Description *</label>
                  <textarea
                    value={newPersonal.content}
                    onChange={(e) => setNewPersonal({ ...newPersonal, content: e.target.value })}
                    placeholder="Tell people about yourself and what you're looking for..."
                    rows={6}
                    className="w-full px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234] resize-none"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 rounded-full border border-[rgba(247,245,240,0.2)] text-[#F7F5F0] hover:bg-[rgba(247,245,240,0.05)] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createPersonal}
                    className="flex-1 py-3 rounded-full bg-[#B22234] text-[#F7F5F0] font-semibold hover:bg-[#D62839] transition-all"
                  >
                    Post Ad
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
