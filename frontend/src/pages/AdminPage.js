import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import Navigation from '../components/Navigation';
import { ShieldCheck, CheckCircle, XCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function AdminPage({ user: propUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(propUser);
  const [pendingUsers, setPendingUsers] = useState([]);

  useEffect(() => {
    if (!user) {
      axios.get(`${API}/auth/me`, { withCredentials: true })
        .then(res => setUser(res.data))
        .catch(() => navigate('/login'));
    }
    fetchPendingUsers();
  }, [user, navigate]);

  const fetchPendingUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/pending-users`, { withCredentials: true });
      setPendingUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch pending users');
    }
  };

  const handleApprove = async (userId) => {
    try {
      await axios.post(`${API}/admin/approve-user/${userId}`, {}, { withCredentials: true });
      toast.success('User approved');
      fetchPendingUsers();
    } catch (error) {
      toast.error('Failed to approve user');
    }
  };

  const handleReject = async (userId) => {
    try {
      await axios.post(`${API}/admin/reject-user/${userId}`, { reason: 'Residency proof not valid' }, { withCredentials: true });
      toast.success('User rejected');
      fetchPendingUsers();
    } catch (error) {
      toast.error('Failed to reject user');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0B0A0F]">
      <Navigation user={user} />
      <main className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <ShieldCheck size={48} weight="fill" className="text-[#D4AF37]" />
            <h1 className="heading-font text-4xl font-bold text-[#F7F5F0]">Admin Panel</h1>
          </div>
          <p className="text-[#A8A3B2]">Manage user approvals and site administration</p>
        </div>
        <h2 className="heading-font text-2xl font-bold text-[#F7F5F0] mb-6">Pending Approvals ({pendingUsers.length})</h2>
        {pendingUsers.length === 0 ? (
          <div className="glass-effect p-12 rounded-2xl text-center"><p className="text-[#A8A3B2]">No pending approvals</p></div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map(u => (
              <div key={u.user_id} className="glass-effect p-6 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[#F7F5F0] mb-1">{u.name}</h3>
                    <p className="text-[#A8A3B2] mb-2">{u.email}</p>
                    <p className="text-[#A8A3B2] text-sm">{u.age} years • {u.gender} • {u.location}</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleApprove(u.user_id)}
                      className="px-6 py-3 rounded-full bg-[#4CAF50] text-white flex items-center gap-2 hover:opacity-90">
                      <CheckCircle size={20} weight="fill" />Approve
                    </button>
                    <button onClick={() => handleReject(u.user_id)}
                      className="px-6 py-3 rounded-full bg-[#E53935] text-white flex items-center gap-2 hover:opacity-90">
                      <XCircle size={20} weight="fill" />Reject
                    </button>
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
