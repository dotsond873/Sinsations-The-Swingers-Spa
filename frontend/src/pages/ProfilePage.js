import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import Navigation from '../components/Navigation';
import { MapPin, Crown, Lock } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function ProfilePage({ user: propUser }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(propUser);
  const [profile, setProfile] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      axios.get(`${API}/auth/me`, { withCredentials: true })
        .then(res => setCurrentUser(res.data))
        .catch(() => navigate('/login'));
    }
    fetchProfile();
  }, [userId, currentUser, navigate]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/users/profile/${userId}`, { withCredentials: true });
      setProfile(response.data.user);
      setMedia(response.data.media);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || loading) return <div className="min-h-screen bg-[#0B0A0F] flex items-center justify-center"><div className="text-[#F7F5F0]">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-[#0B0A0F]">
      <Navigation user={currentUser} />
      <main className="max-w-7xl mx-auto px-8 py-12">
        <div className="glass-effect p-8 rounded-2xl mb-8">
          <div className="flex items-start gap-6">
            {profile?.picture ? (
              <img src={profile.picture} alt={profile.name} className="w-32 h-32 rounded-full border-4 border-[#D4AF37]" />
            ) : (
              <div className="w-32 h-32 rounded-full bg-[#1C1A24] flex items-center justify-center border-4 border-[#D4AF37]">
                <span className="text-5xl text-[#D4AF37]">{profile?.name[0]}</span>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="heading-font text-4xl font-bold text-[#F7F5F0]">{profile?.name}</h1>
                {profile?.is_premium && <Crown size={32} weight="fill" className="text-[#D4AF37]" />}
              </div>
              {profile?.age && <p className="text-[#A8A3B2] mb-2">{profile.age} years • {profile.gender}</p>}
              {profile?.location && <div className="flex items-center gap-2 text-[#A8A3B2] mb-4"><MapPin size={18} />{profile.location}</div>}
              {profile?.bio && <p className="text-[#F7F5F0] mb-4">{profile.bio}</p>}
              {currentUser.user_id !== userId && currentUser.is_premium && (
                <button onClick={() => navigate('/messages', { state: { recipientId: userId } })}
                  className="px-8 py-3 rounded-full bg-[#B22234] text-[#F7F5F0] hover:bg-[#D62839] transition-all">
                  Send Message
                </button>
              )}
            </div>
          </div>
        </div>
        <h2 className="heading-font text-3xl font-bold text-[#F7F5F0] mb-6">Media Gallery</h2>
        {media.length === 0 ? (
          <div className="glass-effect p-12 rounded-2xl text-center"><p className="text-[#A8A3B2]">No media uploaded yet</p></div>
        ) : (
          <div className="grid md:grid-cols-4 gap-6">
            {media.map(item => {
              const isLocked = !item.is_public && !currentUser.is_premium;
              return (
                <div key={item.media_id} className="relative glass-effect rounded-2xl overflow-hidden aspect-square">
                  {isLocked ? (
                    <div className="w-full h-full backdrop-blur-xl bg-black/60 flex flex-col items-center justify-center">
                      <Lock size={48} weight="fill" className="text-[#D4AF37] mb-4" />
                      <p className="text-[#F7F5F0] font-semibold">Premium Required</p>
                    </div>
                  ) : (
                    <img src={`${API}/media/${item.media_id}`} alt="Content" className="w-full h-full object-cover" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
