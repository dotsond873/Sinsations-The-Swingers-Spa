import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, BACKEND_URL } from '../App';
import Navigation from '../components/Navigation';
import { Trophy, Heart, Plus, Crown, User } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function ContestPage({ user: propUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(propUser);
  const [entries, setEntries] = useState([]);
  const [winner, setWinner] = useState(null);
  const [winnerWeek, setWinnerWeek] = useState('');
  const [myVote, setMyVote] = useState(null);
  const [myPhotos, setMyPhotos] = useState([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      axios.get(`${API}/auth/me`, { withCredentials: true })
        .then(res => setUser(res.data))
        .catch(() => navigate('/login'));
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) refresh();
  }, [user]);

  const refresh = async () => {
    try {
      const [entriesRes, winnerRes, myVoteRes, photosRes] = await Promise.all([
        axios.get(`${API}/contest/entries`, { withCredentials: true }),
        axios.get(`${API}/contest/winner`, { withCredentials: true }),
        axios.get(`${API}/contest/my-vote`, { withCredentials: true }),
        axios.get(`${API}/media/user/${user.user_id}?media_type=photo`, { withCredentials: true }),
      ]);
      setEntries(entriesRes.data || []);
      setWinner(winnerRes.data?.winner || null);
      setWinnerWeek(winnerRes.data?.week || '');
      setMyVote(myVoteRes.data?.voted_entry_id || null);
      setMyPhotos(photosRes.data || []);
    } catch (err) {
      console.error('Failed to load contest');
    } finally {
      setLoading(false);
    }
  };

  const submitEntry = async () => {
    if (!selectedMediaId) {
      toast.error('Choose a photo from your library');
      return;
    }
    try {
      await axios.post(`${API}/contest/entries`, {
        media_id: selectedMediaId,
        caption,
      }, { withCredentials: true });
      toast.success('Entry submitted!');
      setShowSubmitModal(false);
      setSelectedMediaId('');
      setCaption('');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit');
    }
  };

  const vote = async (entryId) => {
    try {
      await axios.post(`${API}/contest/entries/${entryId}/vote`, {}, { withCredentials: true });
      toast.success('Vote recorded!');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to vote');
    }
  };

  const mediaUrl = (mediaId) => `${BACKEND_URL}/api/media/${mediaId}`;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0B0A0F]">
      <Navigation user={user} />
      <main className="max-w-7xl mx-auto px-8 py-12" data-testid="contest-page">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Trophy size={48} weight="fill" className="text-[#D4AF37]" />
              <h1 className="heading-font text-4xl font-bold text-[#F7F5F0]">Pretty Pussy of the Week</h1>
            </div>
            <p className="text-[#A8A3B2]">Submit a photo and vote for this week's winner — one entry & one vote per week.</p>
          </div>
          <button
            data-testid="contest-submit-btn"
            onClick={() => setShowSubmitModal(true)}
            className="px-6 py-3 rounded-full bg-[#B22234] text-[#F7F5F0] font-semibold hover:bg-[#D62839] transition-all flex items-center gap-2"
          >
            <Plus size={20} weight="bold" />
            Submit Entry
          </button>
        </div>

        {/* Last week winner spotlight */}
        {winner && (
          <div className="glass-effect p-6 rounded-2xl mb-10 border border-[#D4AF37]/40" data-testid="contest-winner-spotlight">
            <div className="flex items-center gap-3 mb-4">
              <Crown size={28} weight="fill" className="text-[#D4AF37]" />
              <h2 className="heading-font text-2xl font-bold text-[#F7F5F0]">Last Week's Winner ({winnerWeek})</h2>
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <img
                src={mediaUrl(winner.media_id)}
                alt={winner.user_name}
                className="w-48 h-48 object-cover rounded-2xl border-2 border-[#D4AF37]"
              />
              <div>
                <p className="text-2xl font-bold text-[#F7F5F0]">{winner.user_name}</p>
                <p className="text-[#A8A3B2] mt-1">{winner.caption}</p>
                <p className="text-[#D4AF37] mt-3 font-semibold">{winner.votes} votes</p>
              </div>
            </div>
          </div>
        )}

        <h2 className="heading-font text-2xl font-bold text-[#F7F5F0] mb-4">This Week's Entries</h2>

        {loading ? (
          <p className="text-[#A8A3B2]">Loading…</p>
        ) : entries.length === 0 ? (
          <div className="glass-effect p-12 rounded-2xl text-center">
            <Trophy size={64} weight="duotone" className="text-[#757180] mx-auto mb-4" />
            <p className="text-[#A8A3B2]">No entries yet this week. Be the first!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.map(entry => {
              const youVoted = myVote === entry.entry_id;
              const isOwn = entry.user_id === user.user_id;
              return (
                <div key={entry.entry_id} className="glass-effect rounded-2xl overflow-hidden" data-testid={`contest-entry-${entry.entry_id}`}>
                  <img
                    src={mediaUrl(entry.media_id)}
                    alt={entry.user_name}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User size={18} className="text-[#D4AF37]" />
                      <button
                        onClick={() => navigate(`/profile/${entry.user_id}`)}
                        className="font-semibold text-[#F7F5F0] hover:text-[#D4AF37]"
                      >
                        {entry.user_name}
                      </button>
                    </div>
                    {entry.caption && <p className="text-[#A8A3B2] text-sm mb-3 line-clamp-2">{entry.caption}</p>}
                    <div className="flex items-center justify-between">
                      <span className="text-[#D4AF37] font-bold">{entry.votes} votes</span>
                      <button
                        data-testid={`contest-vote-${entry.entry_id}`}
                        onClick={() => vote(entry.entry_id)}
                        disabled={isOwn || !!myVote}
                        className={`px-4 py-2 rounded-full font-semibold flex items-center gap-2 transition-all ${
                          youVoted
                            ? 'bg-[#D4AF37] text-[#0B0A0F]'
                            : isOwn || myVote
                            ? 'bg-[#1C1A24] text-[#757180] cursor-not-allowed'
                            : 'bg-[#B22234] text-[#F7F5F0] hover:bg-[#D62839]'
                        }`}
                      >
                        <Heart size={16} weight="fill" />
                        {youVoted ? 'Voted' : isOwn ? 'Your entry' : myVote ? 'Voted elsewhere' : 'Vote'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Submit Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="glass-effect p-8 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="heading-font text-2xl font-bold text-[#F7F5F0] mb-2">Submit a photo</h2>
              <p className="text-[#A8A3B2] mb-6 text-sm">Pick a photo from your media library. <button className="text-[#D4AF37] hover:underline" onClick={() => navigate('/my-media')}>Upload more →</button></p>

              {myPhotos.length === 0 ? (
                <div className="text-center p-8 bg-[#1C1A24] rounded-xl">
                  <p className="text-[#A8A3B2] mb-3">You haven't uploaded any photos yet.</p>
                  <button
                    onClick={() => navigate('/my-media')}
                    className="px-6 py-2 rounded-full bg-[#D4AF37] text-[#0B0A0F] font-semibold"
                  >
                    Upload photos
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {myPhotos.map(p => (
                    <button
                      key={p.media_id}
                      onClick={() => setSelectedMediaId(p.media_id)}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                        selectedMediaId === p.media_id ? 'border-[#D4AF37]' : 'border-transparent'
                      }`}
                    >
                      <img src={mediaUrl(p.media_id)} alt="" className="w-full h-24 object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Optional caption…"
                rows={3}
                className="w-full px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] resize-none mb-4"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-3 rounded-full border border-[rgba(247,245,240,0.2)] text-[#F7F5F0]"
                >
                  Cancel
                </button>
                <button
                  data-testid="contest-submit-confirm-btn"
                  onClick={submitEntry}
                  className="flex-1 py-3 rounded-full bg-[#B22234] text-[#F7F5F0] font-semibold hover:bg-[#D62839]"
                >
                  Submit Entry
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
