import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import Navigation from '../components/Navigation';
import { MapPin, ShieldCheck, Heart, Chat } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function ProfilePage({ user: propUser }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(propUser);
  const [profile, setProfile] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      axios.get(`${API}/auth/me`, { withCredentials: true })
        .then(res => setCurrentUser(res.data))
        .catch(() => navigate('/login'));
    }
    fetchProfile();
    checkIfLiked();
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

  const checkIfLiked = async () => {
    try {
      const response = await axios.get(`${API}/members/${userId}/is-liked`, { withCredentials: true });
      setIsLiked(response.data.liked);
    } catch (error) {
      console.error('Failed to check like status');
    }
  };

  const toggleLike = async () => {
    try {
      const response = await axios.post(`${API}/members/${userId}/like`, {}, { withCredentials: true });
      setIsLiked(response.data.liked);
      toast.success(response.data.message);
    } catch (error) {
      toast.error('Failed to like/unlike');
    }
  };

  if (!currentUser || loading) return <div className="min-h-screen bg-[#0B0A0F] flex items-center justify-center"><div className="text-[#F7F5F0]">Loading...</div></div>;

  const isOwnProfile = currentUser.user_id === userId;

  // Format preferences for display
  const getPreferenceLabel = (key, value) => {
    const labels = {
      orientation: { straight: 'Straight', gay: 'Gay', lesbian: 'Lesbian', bisexual: 'Bisexual', pansexual: 'Pansexual', bicurious: 'Bi-Curious', open: 'Open to All' },
      looking_for: { single_male: 'Single Males', single_female: 'Single Females', couples: 'Couples', groups: 'Group Play', friendship: 'Friendship', casual: 'Casual', fwb: 'FWB', hotwife: 'Hotwife', threesome: 'Threesomes', swapping: 'Full Swap', soft_swap: 'Soft Swap' }
    };
    return labels[key]?.[value] || value;
  };

  return (
    <div className="min-h-screen bg-[#0B0A0F]">
      <Navigation user={currentUser} />
      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Profile Header */}
        <div className="glass-effect p-8 rounded-2xl mb-8">
          <div className="flex items-start gap-6">
            {profile?.picture ? (
              <img src={profile.picture} alt={profile.name} className="w-32 h-32 rounded-full border-4 border-[#D4AF37] object-cover" />
            ) : (
              <div className="w-32 h-32 rounded-full bg-[#1C1A24] flex items-center justify-center border-4 border-[#D4AF37]">
                <span className="text-5xl text-[#D4AF37]">{profile?.name?.[0]}</span>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="heading-font text-4xl font-bold text-[#F7F5F0]">{profile?.name}</h1>
                {profile?.is_verified && (
                  <span className="px-3 py-1 rounded-full bg-[#4CAF50] text-white text-sm font-bold flex items-center gap-1">
                    <ShieldCheck size={16} weight="fill" />
                    VERIFIED
                  </span>
                )}
              </div>
              
              {profile?.preferences?.age_range && (
                <p className="text-[#A8A3B2] mb-1">
                  {profile.preferences.age_range} years • {profile.gender}
                  {profile.preferences.orientation && ` • ${getPreferenceLabel('orientation', profile.preferences.orientation)}`}
                </p>
              )}
              
              {profile?.location && (
                <div className="flex items-center gap-2 text-[#A8A3B2] mb-4">
                  <MapPin size={18} />
                  {profile.location}
                </div>
              )}
              
              {profile?.bio && <p className="text-[#F7F5F0] mb-4">{profile.bio}</p>}

              {/* Looking For Tags */}
              {profile?.preferences?.looking_for?.length > 0 && (
                <div className="mb-4">
                  <p className="text-[#A8A3B2] text-sm mb-2">Looking for:</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.preferences.looking_for.map(item => (
                      <span key={item} className="px-3 py-1 rounded-full bg-[#1C1A24] text-[#D4AF37] text-sm">
                        {getPreferenceLabel('looking_for', item)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              {!isOwnProfile && (
                <div className="flex gap-4">
                  <button 
                    onClick={toggleLike}
                    className={`px-6 py-3 rounded-full font-semibold transition-all flex items-center gap-2 ${
                      isLiked 
                        ? 'bg-[#B22234] text-[#F7F5F0]' 
                        : 'border-2 border-[#B22234] text-[#B22234] hover:bg-[#B22234] hover:text-[#F7F5F0]'
                    }`}
                  >
                    <Heart size={20} weight={isLiked ? "fill" : "regular"} />
                    {isLiked ? 'Liked' : 'Like'}
                  </button>
                  <button 
                    onClick={() => navigate('/messages', { state: { recipientId: userId } })}
                    className="px-6 py-3 rounded-full bg-[#D4AF37] text-[#0B0A0F] font-semibold hover:bg-[#F0C847] transition-all flex items-center gap-2"
                  >
                    <Chat size={20} weight="fill" />
                    Message
                  </button>
                </div>
              )}

              {isOwnProfile && (
                <button 
                  onClick={() => navigate('/profile-setup')}
                  className="px-6 py-3 rounded-full bg-[#D4AF37] text-[#0B0A0F] font-semibold hover:bg-[#F0C847] transition-all"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Media Gallery */}
        <h2 className="heading-font text-3xl font-bold text-[#F7F5F0] mb-6">Photos</h2>
        {media.length === 0 ? (
          <div className="glass-effect p-12 rounded-2xl text-center">
            <p className="text-[#A8A3B2]">No photos uploaded yet</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-4 gap-6">
            {media.map(item => (
              <div key={item.media_id} className="relative glass-effect rounded-2xl overflow-hidden aspect-square">
                <img src={`${API}/media/${item.media_id}`} alt="Content" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
