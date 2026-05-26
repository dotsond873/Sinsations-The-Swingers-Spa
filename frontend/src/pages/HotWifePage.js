import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, BACKEND_URL } from '../App';
import Navigation from '../components/Navigation';
import { Fire, Plus, Heart, Trash, User } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function HotWifePage({ user: propUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(propUser);
  const [posts, setPosts] = useState([]);
  const [myPhotos, setMyPhotos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState('');
  const [selectedMediaId, setSelectedMediaId] = useState(null);
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
      const [postsRes, photosRes] = await Promise.all([
        axios.get(`${API}/hotwife/posts`, { withCredentials: true }),
        axios.get(`${API}/media/user/${user.user_id}?media_type=photo`, { withCredentials: true }),
      ]);
      setPosts(postsRes.data || []);
      setMyPhotos(photosRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    if (!content.trim()) {
      toast.error('Write something first');
      return;
    }
    try {
      await axios.post(`${API}/hotwife/posts`, {
        content,
        media_id: selectedMediaId,
      }, { withCredentials: true });
      toast.success('Posted!');
      setShowModal(false);
      setContent('');
      setSelectedMediaId(null);
      refresh();
    } catch (err) {
      toast.error('Failed to post');
    }
  };

  const toggleLike = async (postId) => {
    try {
      await axios.post(`${API}/hotwife/posts/${postId}/like`, {}, { withCredentials: true });
      refresh();
    } catch (err) {
      toast.error('Failed to like');
    }
  };

  const deletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await axios.delete(`${API}/hotwife/posts/${postId}`, { withCredentials: true });
      toast.success('Deleted');
      refresh();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const mediaUrl = (id) => `${BACKEND_URL}/api/media/${id}`;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0B0A0F]">
      <Navigation user={user} />
      <main className="max-w-3xl mx-auto px-8 py-12" data-testid="hotwife-page">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Fire size={48} weight="fill" className="text-[#B22234]" />
              <h1 className="heading-font text-4xl font-bold text-[#F7F5F0]">Hot Wife Section</h1>
            </div>
            <p className="text-[#A8A3B2]">Exclusive feed for the hotwife lifestyle community.</p>
          </div>
          <button
            data-testid="hotwife-new-post-btn"
            onClick={() => setShowModal(true)}
            className="px-6 py-3 rounded-full bg-[#B22234] text-[#F7F5F0] font-semibold hover:bg-[#D62839] transition-all flex items-center gap-2"
          >
            <Plus size={20} weight="bold" />
            New Post
          </button>
        </div>

        {loading ? (
          <p className="text-[#A8A3B2]">Loading…</p>
        ) : posts.length === 0 ? (
          <div className="glass-effect p-12 rounded-2xl text-center">
            <Fire size={64} weight="duotone" className="text-[#757180] mx-auto mb-4" />
            <p className="text-[#A8A3B2]">No posts yet. Be the first to share.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => {
              const liked = (post.liked_by || []).includes(user.user_id);
              const isOwn = post.user_id === user.user_id;
              return (
                <div key={post.post_id} className="glass-effect p-6 rounded-2xl" data-testid={`hotwife-post-${post.post_id}`}>
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => navigate(`/profile/${post.user_id}`)}
                      className="flex items-center gap-2"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#1C1A24] flex items-center justify-center">
                        <User size={20} className="text-[#D4AF37]" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-[#F7F5F0]">{post.user_name}</p>
                        <p className="text-xs text-[#757180]">{new Date(post.created_at).toLocaleString()}</p>
                      </div>
                    </button>
                    {isOwn && (
                      <button
                        onClick={() => deletePost(post.post_id)}
                        className="text-[#757180] hover:text-[#B22234] p-2"
                      >
                        <Trash size={18} />
                      </button>
                    )}
                  </div>
                  <p className="text-[#F7F5F0] whitespace-pre-wrap mb-3">{post.content}</p>
                  {post.media_id && (
                    <img
                      src={mediaUrl(post.media_id)}
                      alt=""
                      className="w-full max-h-96 object-cover rounded-xl mb-3"
                    />
                  )}
                  <button
                    onClick={() => toggleLike(post.post_id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                      liked ? 'bg-[#B22234] text-[#F7F5F0]' : 'bg-[#1C1A24] text-[#A8A3B2] hover:bg-[#252330]'
                    }`}
                  >
                    <Heart size={18} weight={liked ? 'fill' : 'regular'} />
                    {post.likes || 0}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="glass-effect p-8 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <h2 className="heading-font text-2xl font-bold text-[#F7F5F0] mb-4">New Post</h2>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share something with the community…"
                rows={4}
                className="w-full px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] resize-none mb-4"
              />

              {myPhotos.length > 0 && (
                <>
                  <p className="text-[#A8A3B2] text-sm mb-2">Attach a photo (optional):</p>
                  <div className="grid grid-cols-4 gap-2 mb-4 max-h-48 overflow-y-auto">
                    <button
                      onClick={() => setSelectedMediaId(null)}
                      className={`h-20 rounded-lg border-2 text-[#A8A3B2] text-xs ${
                        !selectedMediaId ? 'border-[#D4AF37] bg-[#1C1A24]' : 'border-transparent bg-[#1C1A24]'
                      }`}
                    >
                      None
                    </button>
                    {myPhotos.map(p => (
                      <button
                        key={p.media_id}
                        onClick={() => setSelectedMediaId(p.media_id)}
                        className={`rounded-lg overflow-hidden border-2 ${
                          selectedMediaId === p.media_id ? 'border-[#D4AF37]' : 'border-transparent'
                        }`}
                      >
                        <img src={mediaUrl(p.media_id)} alt="" className="w-full h-20 object-cover" />
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-full border border-[rgba(247,245,240,0.2)] text-[#F7F5F0]"
                >
                  Cancel
                </button>
                <button
                  data-testid="hotwife-post-confirm-btn"
                  onClick={createPost}
                  className="flex-1 py-3 rounded-full bg-[#B22234] text-[#F7F5F0] font-semibold hover:bg-[#D62839]"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
