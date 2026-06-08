import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import Navigation from '../components/Navigation';
import { ChatCircle, Plus, PaperPlaneTilt, Users, Door } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function ChatroomsPage({ user: propUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(propUser);
  const [chatrooms, setChatrooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const pollInterval = useRef(null);

  useEffect(() => {
    if (!user) {
      axios.get(`${API}/auth/me`, { withCredentials: true })
        .then(res => setUser(res.data))
        .catch(() => navigate('/login'));
    }
    fetchChatrooms();
    
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [user, navigate]);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages();
      // Poll for new messages every 3 seconds
      pollInterval.current = setInterval(fetchMessages, 3000);
    }
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [selectedRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChatrooms = async () => {
    try {
      const response = await axios.get(`${API}/chatrooms`, { withCredentials: true });
      setChatrooms(response.data);
    } catch (error) {
      console.error('Failed to fetch chatrooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedRoom) return;
    try {
      const response = await axios.get(`${API}/chatrooms/${selectedRoom.room_id}/messages`, { withCredentials: true });
      setMessages(response.data.reverse()); // Reverse to show oldest first
    } catch (error) {
      console.error('Failed to fetch messages');
    }
  };

  const createChatroom = async () => {
    if (!newRoomName.trim()) {
      toast.error('Please enter a room name');
      return;
    }
    try {
      await axios.post(`${API}/chatrooms`, {
        name: newRoomName,
        description: newRoomDesc
      }, { withCredentials: true });
      toast.success('Chatroom created!');
      setShowCreateModal(false);
      setNewRoomName('');
      setNewRoomDesc('');
      fetchChatrooms();
    } catch (error) {
      toast.error('Failed to create chatroom');
    }
  };

  const joinRoom = async (room) => {
    try {
      await axios.post(`${API}/chatrooms/${room.room_id}/join`, {}, { withCredentials: true });
      setSelectedRoom(room);
      toast.success(`Joined ${room.name}`);
    } catch (error) {
      toast.error('Failed to join room');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom) return;

    try {
      await axios.post(`${API}/chatrooms/${selectedRoom.room_id}/messages`, {
        content: newMessage
      }, { withCredentials: true });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0B0A0F]">
      <Navigation user={user} />
      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <ChatCircle size={40} weight="fill" className="text-[#D4AF37]" />
            <h1 className="heading-font text-4xl font-bold text-[#F7F5F0]">Chatrooms</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 rounded-full bg-[#B22234] text-[#F7F5F0] font-semibold hover:bg-[#D62839] transition-all flex items-center gap-2"
          >
            <Plus size={20} weight="bold" />
            Create Room
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 h-[600px]">
          {/* Room List */}
          <div className="glass-effect p-4 rounded-2xl overflow-y-auto">
            <h2 className="text-lg font-bold text-[#F7F5F0] mb-4">Available Rooms</h2>
            {loading ? (
              <p className="text-[#A8A3B2]">Loading...</p>
            ) : chatrooms.length === 0 ? (
              <p className="text-[#A8A3B2] text-sm">No chatrooms yet. Create one!</p>
            ) : (
              <div className="space-y-2">
                {chatrooms.map(room => (
                  <button
                    key={room.room_id}
                    onClick={() => joinRoom(room)}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      selectedRoom?.room_id === room.room_id
                        ? 'bg-[#B22234] text-[#F7F5F0]'
                        : 'bg-[#1C1A24] text-[#F7F5F0] hover:bg-[#252330]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ChatCircle size={24} weight="duotone" className={selectedRoom?.room_id === room.room_id ? 'text-[#F7F5F0]' : 'text-[#D4AF37]'} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{room.name}</p>
                        {room.description && (
                          <p className={`text-sm truncate ${selectedRoom?.room_id === room.room_id ? 'text-[#F7F5F0]/70' : 'text-[#A8A3B2]'}`}>
                            {room.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Users size={14} />
                        {room.members?.length || 0}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chat Area */}
          <div className="md:col-span-2 glass-effect rounded-2xl flex flex-col">
            {selectedRoom ? (
              <>
                {/* Room Header */}
                <div className="p-4 border-b border-[rgba(247,245,240,0.1)]">
                  <h3 className="text-xl font-bold text-[#F7F5F0]">{selectedRoom.name}</h3>
                  <p className="text-[#A8A3B2] text-sm">{selectedRoom.description}</p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-center text-[#A8A3B2] py-8">No messages yet. Say hello!</p>
                  ) : (
                    messages.map(msg => (
                      <div
                        key={msg.message_id}
                        className={`flex ${msg.user_id === user.user_id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] p-3 rounded-2xl ${
                          msg.user_id === user.user_id
                            ? 'bg-[#B22234] text-[#F7F5F0]'
                            : 'bg-[#1C1A24] text-[#F7F5F0]'
                        }`}>
                          {msg.user_id !== user.user_id && (
                            <p className="text-[#D4AF37] text-sm font-semibold mb-1">{msg.user_name}</p>
                          )}
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${msg.user_id === user.user_id ? 'text-[#F7F5F0]/50' : 'text-[#A8A3B2]'}`}>
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={sendMessage} className="p-4 border-t border-[rgba(247,245,240,0.1)]">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-full text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234]"
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 bg-[#B22234] text-[#F7F5F0] rounded-full hover:bg-[#D62839] transition-all flex items-center gap-2"
                    >
                      <PaperPlaneTilt size={20} weight="fill" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-[#A8A3B2]">
                <Door size={64} weight="duotone" className="mb-4 text-[#757180]" />
                <p className="text-lg">Select a chatroom to join</p>
                <p className="text-sm">or create a new one</p>
              </div>
            )}
          </div>
        </div>

        {/* Create Room Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="glass-effect p-8 rounded-2xl max-w-md w-full">
              <h2 className="heading-font text-2xl font-bold text-[#F7F5F0] mb-6">Create Chatroom</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#F7F5F0] font-medium mb-2">Room Name *</label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="e.g., Couples Lounge"
                    className="w-full px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#B22234]"
                  />
                </div>
                <div>
                  <label className="block text-[#F7F5F0] font-medium mb-2">Description</label>
                  <textarea
                    value={newRoomDesc}
                    onChange={(e) => setNewRoomDesc(e.target.value)}
                    placeholder="What's this room about?"
                    rows={3}
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
                    onClick={createChatroom}
                    className="flex-1 py-3 rounded-full bg-[#B22234] text-[#F7F5F0] font-semibold hover:bg-[#D62839] transition-all"
                  >
                    Create
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
