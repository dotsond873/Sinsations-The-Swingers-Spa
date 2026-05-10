import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import Navigation from '../components/Navigation';
import { ShieldCheck, CheckCircle, XCircle, Bell, IdentificationCard, PencilSimple } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function AdminPage({ user: propUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(propUser);
  const [activeTab, setActiveTab] = useState('verifications');
  const [verifications, setVerifications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [customTask, setCustomTask] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedVerification, setSelectedVerification] = useState(null);

  useEffect(() => {
    if (!user) {
      axios.get(`${API}/auth/me`, { withCredentials: true })
        .then(res => setUser(res.data))
        .catch(() => navigate('/login'));
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [verificationsRes, notificationsRes] = await Promise.all([
        axios.get(`${API}/admin/verifications`, { withCredentials: true }),
        axios.get(`${API}/admin/notifications`, { withCredentials: true })
      ]);
      setVerifications(verificationsRes.data);
      setNotifications(notificationsRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data');
    }
  };

  const assignTask = async (verificationId) => {
    if (!customTask.trim()) {
      toast.error('Please enter a task');
      return;
    }
    try {
      await axios.post(`${API}/admin/assign-task/${verificationId}`, 
        { custom_task: customTask },
        { withCredentials: true }
      );
      toast.success('Task assigned');
      setCustomTask('');
      setSelectedVerification(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to assign task');
    }
  };

  const approveVerification = async (verificationId) => {
    try {
      await axios.post(`${API}/admin/approve-verification/${verificationId}`, {}, { withCredentials: true });
      toast.success('Verification approved');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve');
    }
  };

  const rejectVerification = async (verificationId) => {
    try {
      await axios.post(`${API}/admin/reject-verification/${verificationId}`, 
        { reason: rejectReason || 'Verification rejected' },
        { withCredentials: true }
      );
      toast.success('Verification rejected');
      setRejectReason('');
      fetchData();
    } catch (error) {
      toast.error('Failed to reject');
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
          <p className="text-[#A8A3B2]">Manage verifications and notifications</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('verifications')}
            className={`px-6 py-3 rounded-full font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'verifications' 
                ? 'bg-[#B22234] text-[#F7F5F0]' 
                : 'glass-effect text-[#A8A3B2] hover:text-[#F7F5F0]'
            }`}
          >
            <IdentificationCard size={20} />
            Verifications ({verifications.length})
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-6 py-3 rounded-full font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'notifications' 
                ? 'bg-[#B22234] text-[#F7F5F0]' 
                : 'glass-effect text-[#A8A3B2] hover:text-[#F7F5F0]'
            }`}
          >
            <Bell size={20} />
            Notifications ({notifications.filter(n => !n.is_read).length})
          </button>
        </div>

        {/* Verifications Tab */}
        {activeTab === 'verifications' && (
          <div className="space-y-6">
            {verifications.length === 0 ? (
              <div className="glass-effect p-12 rounded-2xl text-center">
                <p className="text-[#A8A3B2]">No pending verifications</p>
              </div>
            ) : (
              verifications.map(v => (
                <div key={v.verification_id} className="glass-effect p-6 rounded-2xl">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#F7F5F0]">{v.user_name}</h3>
                      <p className="text-[#A8A3B2] text-sm">{v.user_email}</p>
                      <p className="text-[#D4AF37] text-sm mt-1">
                        Method: {v.method === 'id_selfie' ? 'ID + Selfie' : 'Custom Task'}
                      </p>
                      <p className="text-[#A8A3B2] text-xs mt-1">
                        Status: <span className="capitalize">{v.status.replace('_', ' ')}</span>
                      </p>
                    </div>
                    <div className="text-right text-sm text-[#A8A3B2]">
                      {new Date(v.requested_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Status: awaiting_task - Need to assign task */}
                  {v.status === 'awaiting_task' && (
                    <div className="mt-4 p-4 bg-[#1C1A24] rounded-lg">
                      <p className="text-[#F7F5F0] font-semibold mb-3 flex items-center gap-2">
                        <PencilSimple size={20} className="text-[#D4AF37]" />
                        Assign Verification Task
                      </p>
                      <input
                        type="text"
                        value={selectedVerification === v.verification_id ? customTask : ''}
                        onChange={(e) => {
                          setSelectedVerification(v.verification_id);
                          setCustomTask(e.target.value);
                        }}
                        placeholder="e.g., Write the number 32 on a piece of paper and take a selfie holding it"
                        className="w-full px-4 py-3 bg-[#0B0A0F] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] mb-3"
                      />
                      <button
                        onClick={() => assignTask(v.verification_id)}
                        className="px-6 py-2 rounded-full bg-[#D4AF37] text-[#0B0A0F] font-semibold hover:bg-[#F0C847] transition-all"
                      >
                        Assign Task
                      </button>
                    </div>
                  )}

                  {/* Status: pending - Need to review photos */}
                  {v.status === 'pending' && (
                    <div className="mt-4">
                      <p className="text-[#F7F5F0] font-semibold mb-3">Submitted Photos:</p>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {v.id_photo_path && (
                          <div>
                            <p className="text-[#A8A3B2] text-sm mb-1">ID Photo</p>
                            <div className="bg-[#1C1A24] p-2 rounded text-[#A8A3B2] text-xs break-all">
                              {v.id_photo_path}
                            </div>
                          </div>
                        )}
                        {v.selfie_photo_path && (
                          <div>
                            <p className="text-[#A8A3B2] text-sm mb-1">Selfie with ID</p>
                            <div className="bg-[#1C1A24] p-2 rounded text-[#A8A3B2] text-xs break-all">
                              {v.selfie_photo_path}
                            </div>
                          </div>
                        )}
                        {v.task_photo_path && (
                          <div className="col-span-2">
                            <p className="text-[#A8A3B2] text-sm mb-1">Task Photo (Task: {v.custom_task})</p>
                            <div className="bg-[#1C1A24] p-2 rounded text-[#A8A3B2] text-xs break-all">
                              {v.task_photo_path}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={() => approveVerification(v.verification_id)}
                          className="px-6 py-3 rounded-full bg-[#4CAF50] text-white font-semibold flex items-center gap-2 hover:opacity-90 transition-all"
                        >
                          <CheckCircle size={20} weight="fill" />
                          Approve & Verify
                        </button>
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Rejection reason..."
                            className="flex-1 px-4 py-2 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0]"
                          />
                          <button
                            onClick={() => rejectVerification(v.verification_id)}
                            className="px-6 py-3 rounded-full bg-[#E53935] text-white font-semibold flex items-center gap-2 hover:opacity-90 transition-all"
                          >
                            <XCircle size={20} weight="fill" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="glass-effect p-12 rounded-2xl text-center">
                <p className="text-[#A8A3B2]">No notifications</p>
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.notification_id} 
                  className={`glass-effect p-4 rounded-xl ${!n.is_read ? 'border-2 border-[#D4AF37]' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-[#F7F5F0]">{n.title}</h4>
                      <p className="text-[#A8A3B2] text-sm">{n.message}</p>
                    </div>
                    <span className="text-xs text-[#757180]">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
