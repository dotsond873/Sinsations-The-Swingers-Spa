import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import Navigation from '../components/Navigation';
import { Article, Plus, ChatText, User, ArrowLeft } from '@phosphor-icons/react';
import { toast } from 'sonner';

const FORUM_CATEGORIES = [
  { value: 'general', label: 'General Discussion', color: '#D4AF37' },
  { value: 'introductions', label: 'Introductions', color: '#4CAF50' },
  { value: 'events', label: 'Events & Meetups', color: '#B22234' },
  { value: 'advice', label: 'Advice & Tips', color: '#2196F3' },
  { value: 'stories', label: 'Stories & Experiences', color: '#9C27B0' },
  { value: 'hotwife', label: 'Hotwife Lifestyle', color: '#FF5722' },
];

export default function ForumsPage({ user: propUser }) {
  const navigate = useNavigate();
  const { forumId } = useParams();
  const [user, setUser] = useState(propUser);
  const [forums, setForums] = useState([]);
  const [selectedForum, setSelectedForum] = useState(null);
  const [posts, setPosts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [newForum, setNewForum] = useState({ title: '', description: '', category: 'general' });
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    if (!user) {
      axios.get(`${API}/auth/me`, { withCredentials: true })
        .then(res => setUser(res.data))
        .catch(() => navigate('/login'));
    }
    fetchForums();
  }, [user, navigate]);

  useEffect(() => {
    if (forumId) {
      fetchForumDetails(forumId);
    } else {
      setSelectedForum(null);
      setPosts([]);
    }
  }, [forumId]);

  const fetchForums = async () => {
    try {
      const response = await axios.get(`${API}/forums`, { withCredentials: true });
      setForums(response.data);
    } catch (error) {
      console.error('Failed to fetch forums');
    } finally {
      setLoading(false);
    }
  };

  const fetchForumDetails = async (id) => {
    try {
      const response = await axios.get(`${API}/forums/${id}`, { withCredentials: true });
      setSelectedForum(response.data.forum);
      setPosts(response.data.posts);
    } catch (error) {
      toast.error('Failed to load forum');
    }
  };

  const createForum = async () => {
    if (!newForum.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    try {
      const response = await axios.post(`${API}/forums`, newForum, { withCredentials: true });
      toast.success('Forum created!');
      setShowCreateModal(false);
      setNewForum({ title: '', description: '', category: 'general' });
      fetchForums();
      navigate(`/forums/${response.data.forum_id}`);
    } catch (error) {
      toast.error('Failed to create forum');
    }
  };

  const createPost = async () => {
    if (!newPost.trim()) {
      toast.error('Please enter a message');
      return;
    }
    try {
      await axios.post(`${API}/forums/${selectedForum.forum_id}/posts`, {
        content: newPost
      }, { withCredentials: true });
      toast.success('Post added!');
      setNewPost('');
      setShowPostModal(false);
      fetchForumDetails(selectedForum.forum_id);
    } catch (error) {
      toast.error('Failed to post');
    }
  };

  const getCategoryInfo = (cat) => FORUM_CATEGORIES.find(c => c.value === cat) || FORUM_CATEGORIES[0];

  const filteredForums = categoryFilter 
    ? forums.filter(f => f.category === categoryFilter)
    : forums;

  if (!user) return null;

  // Forum Detail View
  if (selectedForum) {
    const categoryInfo = getCategoryInfo(selectedForum.category);
    return (
      <div className="min-h-screen bg-[#0B0A0F]">
        <Navigation user={user} />
        <main className="max-w-4xl mx-auto px-8 py-8">
          <button
            onClick={() => navigate('/forums')}
            className="flex items-center gap-2 text-[#A8A3B2] hover:text-[#F7F5F0] mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Forums
          </button>

          <div className="glass-effect p-6 rounded-2xl mb-6">
            <div className="flex items-start justify-between">
              <div>
                <span 
                  className="inline-block px-3 py-1 rounded-full text-sm font-semibold mb-3"
                  style={{ backgroundColor: categoryInfo.color, color: '#fff' }}
                >
                  {categoryInfo.label}
                </span>
                <h1 className="heading-font text-3xl font-bold text-[#F7F5F0] mb-2">{selectedForum.title}</h1>
                <p className="text-[#A8A3B2]">{selectedForum.description}</p>
              </div>
              <button
                onClick={() => setShowPostModal(true)}
                className="px-6 py-3 rounded-full bg-[#B22234] text-[#F7F5F0] font-semibold hover:bg-[#D62839] transition-all flex items-center gap-2"
              >
                <Plus size={20} weight="bold" />
                Reply
              </button>
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="glass-effect p-12 rounded-2xl text-center">
                <ChatText size={64} weight="duotone" className="text-[#757180] mx-auto mb-4" />
                <p className="text-[#A8A3B2]">No posts yet. Be the first to reply!</p>
              </div>
            ) : (
              posts.map(post => (
                <div key={post.post_id} className="glass-effect p-6 rounded-2xl">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#1C1A24] flex items-center justify-center flex-shrink-0">
                      <User size={24} className="text-[#D4AF37]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-[#F7F5F0]">{post.user_name}</span>
                        <span className="text-[#757180] text-sm">
                          {new Date(post.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[#F7F5F0] whitespace-pre-wrap">{post.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Reply Modal */}
          {showPostModal && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="glass-effect p-8 rounded-2xl max-w-lg w-full">
                <h2 className="heading-font text-2xl font-bold text-[#F7F5F0] mb-6">Add Reply</h2>
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={6}
                  className="w-full px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234] resize-none mb-4"
                />
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowPostModal(false)}
                    className="flex-1 py-3 rounded-full border border-[rgba(247,245,240,0.2)] text-[#F7F5F0] hover:bg-[rgba(247,245,240,0.05)] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createPost}
                    className="flex-1 py-3 rounded-full bg-[#B22234] text-[#F7F5F0] font-semibold hover:bg-[#D62839] transition-all"
                  >
                    Post Reply
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Forums List View
  return (
    <div className="min-h-screen bg-[#0B0A0F]">
      <Navigation user={user} />
      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Article size={40} weight="fill" className="text-[#D4AF37]" />
            <h1 className="heading-font text-4xl font-bold text-[#F7F5F0]">Forums</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 rounded-full bg-[#B22234] text-[#F7F5F0] font-semibold hover:bg-[#D62839] transition-all flex items-center gap-2"
          >
            <Plus size={20} weight="bold" />
            New Topic
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
          {FORUM_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-4 py-2 rounded-full transition-all ${
                categoryFilter === cat.value ? 'text-white' : 'glass-effect text-[#A8A3B2]'
              }`}
              style={categoryFilter === cat.value ? { backgroundColor: cat.color } : {}}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Forums List */}
        {loading ? (
          <p className="text-[#A8A3B2]">Loading...</p>
        ) : filteredForums.length === 0 ? (
          <div className="glass-effect p-12 rounded-2xl text-center">
            <Article size={64} weight="duotone" className="text-[#757180] mx-auto mb-4" />
            <p className="text-[#A8A3B2]">No forums yet. Start a new topic!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredForums.map(forum => {
              const categoryInfo = getCategoryInfo(forum.category);
              return (
                <div
                  key={forum.forum_id}
                  onClick={() => navigate(`/forums/${forum.forum_id}`)}
                  className="glass-effect p-6 rounded-2xl cursor-pointer hover:-translate-y-1 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: categoryInfo.color }}
                    >
                      <Article size={24} weight="fill" className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-[#F7F5F0] truncate">{forum.title}</h3>
                        <span 
                          className="px-2 py-0.5 rounded text-xs font-semibold"
                          style={{ backgroundColor: categoryInfo.color, color: '#fff' }}
                        >
                          {categoryInfo.label}
                        </span>
                      </div>
                      <p className="text-[#A8A3B2] text-sm line-clamp-2 mb-2">{forum.description}</p>
                      <p className="text-[#757180] text-xs">
                        Created {new Date(forum.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[#A8A3B2]">
                      <ChatText size={20} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Forum Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="glass-effect p-8 rounded-2xl max-w-lg w-full">
              <h2 className="heading-font text-2xl font-bold text-[#F7F5F0] mb-6">Create New Topic</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#F7F5F0] font-medium mb-2">Category *</label>
                  <select
                    value={newForum.category}
                    onChange={(e) => setNewForum({ ...newForum, category: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234]"
                  >
                    {FORUM_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#F7F5F0] font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    value={newForum.title}
                    onChange={(e) => setNewForum({ ...newForum, title: e.target.value })}
                    placeholder="What's on your mind?"
                    className="w-full px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234]"
                  />
                </div>
                <div>
                  <label className="block text-[#F7F5F0] font-medium mb-2">Description</label>
                  <textarea
                    value={newForum.description}
                    onChange={(e) => setNewForum({ ...newForum, description: e.target.value })}
                    placeholder="Add more details..."
                    rows={4}
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
                    onClick={createForum}
                    className="flex-1 py-3 rounded-full bg-[#B22234] text-[#F7F5F0] font-semibold hover:bg-[#D62839] transition-all"
                  >
                    Create Topic
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
