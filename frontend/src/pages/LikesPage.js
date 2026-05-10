import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import Navigation from '../components/Navigation';
import { Heart, HeartBreak } from '@phosphor-icons/react';

export default function LikesPage({ user: propUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(propUser);
  const [activeTab, setActiveTab] = useState('received');
  const [receivedLikes, setReceivedLikes] = useState([]);
  const [givenLikes, setGivenLikes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      axios.get(`${API}/auth/me`, { withCredentials: true })
        .then(res => setUser(res.data))
        .catch(() => navigate('/login'));
    }
    fetchLikes();
  }, [user, navigate]);

  const fetchLikes = async () => {
    try {
      const [receivedRes, givenRes] = await Promise.all([
        axios.get(`${API}/likes/received`, { withCredentials: true }),
        axios.get(`${API}/likes/given`, { withCredentials: true })
      ]);
      setReceivedLikes(receivedRes.data.likers || []);
      setGivenLikes(givenRes.data.liked_users || []);
    } catch (error) {
      console.error('Failed to fetch likes');
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) {
    return <div className="min-h-screen bg-[#0B0A0F] flex items-center justify-center">
      <div className="text-[#F7F5F0]">Loading...</div>
    </div>;
  }

  const currentList = activeTab === 'received' ? receivedLikes : givenLikes;

  return (
    <div className="min-h-screen bg-[#0B0A0F]">
      <Navigation user={user} />
      <main className="max-w-4xl mx-auto px-8 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Heart size={48} weight="fill" className="text-[#B22234]" />
          <h1 className="heading-font text-4xl font-bold text-[#F7F5F0]">Likes</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('received')}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              activeTab === 'received' 
                ? 'bg-[#B22234] text-[#F7F5F0]' 
                : 'glass-effect text-[#A8A3B2] hover:text-[#F7F5F0]'
            }`}
          >
            Received ({receivedLikes.length})
          </button>
          <button
            onClick={() => setActiveTab('given')}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              activeTab === 'given' 
                ? 'bg-[#B22234] text-[#F7F5F0]' 
                : 'glass-effect text-[#A8A3B2] hover:text-[#F7F5F0]'
            }`}
          >
            Given ({givenLikes.length})
          </button>
        </div>

        {/* List */}
        {currentList.length === 0 ? (
          <div className="glass-effect p-12 rounded-2xl text-center">
            <HeartBreak size={64} weight="duotone" className="text-[#757180] mx-auto mb-4" />
            <p className="text-[#A8A3B2]">
              {activeTab === 'received' 
                ? "No likes received yet. Complete your profile to get noticed!"
                : "You haven't liked anyone yet. Browse members to find connections!"}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {currentList.map(member => (
              <div
                key={member.user_id}
                onClick={() => navigate(`/profile/${member.user_id}`)}
                className="glass-effect p-4 rounded-xl cursor-pointer hover:-translate-y-1 transition-all flex items-center gap-4"
              >
                {member.picture ? (
                  <img src={member.picture} alt={member.name} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#1C1A24] flex items-center justify-center">
                    <span className="text-2xl text-[#D4AF37]">{member.name?.[0]}</span>
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-[#F7F5F0]">{member.name}</h3>
                  {member.location && <p className="text-[#A8A3B2] text-sm">{member.location}</p>}
                </div>
                <Heart size={24} weight="fill" className="text-[#B22234] ml-auto" />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
