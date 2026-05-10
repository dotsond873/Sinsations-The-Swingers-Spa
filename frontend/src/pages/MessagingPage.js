import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import Navigation from '../components/Navigation';
import { toast } from 'sonner';
import { PaperPlaneTilt } from '@phosphor-icons/react';

export default function MessagingPage({ user: propUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(propUser);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(location.state?.recipientId || null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      axios.get(`${API}/auth/me`, { withCredentials: true })
        .then(res => setUser(res.data))
        .catch(() => navigate('/login'));
    }
    fetchMessages();
  }, [user, navigate]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API}/messages`, { withCredentials: true });
      setMessages(response.data);
      
      // Extract unique conversation partners
      const partners = new Map();
      response.data.forEach(msg => {
        const partnerId = msg.sender_id === user?.user_id ? msg.recipient_id : msg.sender_id;
        if (!partners.has(partnerId)) {
          partners.set(partnerId, { user_id: partnerId, lastMessage: msg });
        }
      });
      setConversations(Array.from(partners.values()));
    } catch (error) {
      console.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      await axios.post(`${API}/messages`, {
        recipient_id: selectedUser,
        content: newMessage
      }, { withCredentials: true });
      
      setNewMessage('');
      toast.success('Message sent!');
      fetchMessages();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const filteredMessages = selectedUser 
    ? messages.filter(m => m.sender_id === selectedUser || m.recipient_id === selectedUser)
    : [];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0B0A0F]">
      <Navigation user={user} />
      <main className="max-w-7xl mx-auto px-8 py-12">
        <h1 className="heading-font text-4xl font-bold text-[#F7F5F0] mb-6">Messages</h1>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="glass-effect p-4 rounded-2xl">
            <h2 className="text-lg font-bold text-[#F7F5F0] mb-4">Conversations</h2>
            {conversations.length === 0 ? (
              <p className="text-[#A8A3B2] text-sm">No conversations yet. Start messaging members!</p>
            ) : (
              <div className="space-y-2">
                {conversations.map(conv => (
                  <button
                    key={conv.user_id}
                    onClick={() => setSelectedUser(conv.user_id)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      selectedUser === conv.user_id 
                        ? 'bg-[#B22234] text-[#F7F5F0]' 
                        : 'bg-[#1C1A24] text-[#A8A3B2] hover:bg-[#252330]'
                    }`}
                  >
                    <p className="font-semibold truncate">{conv.user_id}</p>
                    <p className="text-xs truncate opacity-75">{conv.lastMessage?.content}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="md:col-span-2 glass-effect p-4 rounded-2xl flex flex-col h-[500px]">
            {selectedUser ? (
              <>
                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                  {filteredMessages.map(msg => (
                    <div
                      key={msg.message_id}
                      className={`p-3 rounded-lg max-w-[80%] ${
                        msg.sender_id === user.user_id
                          ? 'bg-[#B22234] text-[#F7F5F0] ml-auto'
                          : 'bg-[#1C1A24] text-[#F7F5F0]'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className="text-xs opacity-50 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
                
                <form onSubmit={sendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message... (exchange numbers freely!)"
                    className="flex-1 px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234]"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#B22234] text-[#F7F5F0] rounded-lg hover:bg-[#D62839] transition-all flex items-center gap-2"
                  >
                    <PaperPlaneTilt size={20} weight="fill" />
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#A8A3B2]">
                Select a conversation or message a member from their profile
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
