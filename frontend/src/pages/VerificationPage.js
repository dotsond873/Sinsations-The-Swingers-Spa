import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import Navigation from '../components/Navigation';
import { ShieldCheck, IdentificationCard, Camera, Warning, CheckCircle, Clock } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function VerificationPage({ user: propUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(propUser);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [method, setMethod] = useState('id_selfie');
  const [idPhoto, setIdPhoto] = useState(null);
  const [selfiePhoto, setSelfiePhoto] = useState(null);
  const [taskPhoto, setTaskPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      axios.get(`${API}/auth/me`, { withCredentials: true })
        .then(res => setUser(res.data))
        .catch(() => navigate('/login'));
    }
    fetchVerificationStatus();
  }, [user, navigate]);

  const fetchVerificationStatus = async () => {
    try {
      const response = await axios.get(`${API}/verification/status`, { withCredentials: true });
      setVerificationStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch verification status');
    }
  };

  const uploadPhoto = async (file, photoType) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setUploading(true);
      const response = await axios.post(
        `${API}/verification/upload-photo?photo_type=${photoType}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' }, withCredentials: true }
      );
      toast.success(`${photoType} photo uploaded`);
      return response.data.path;
    } catch (error) {
      toast.error(`Failed to upload ${photoType} photo`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleIdPhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const path = await uploadPhoto(file, 'id');
      if (path) setIdPhoto(path);
    }
  };

  const handleSelfiePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const path = await uploadPhoto(file, 'selfie');
      if (path) setSelfiePhoto(path);
    }
  };

  const handleTaskPhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const path = await uploadPhoto(file, 'task');
      if (path) setTaskPhoto(path);
    }
  };

  const submitVerification = async () => {
    if (method === 'id_selfie' && (!idPhoto || !selfiePhoto)) {
      toast.error('Please upload both ID and selfie photos');
      return;
    }
    if (method === 'custom_task' && !taskPhoto) {
      toast.error('Please upload your task photo');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(`${API}/verification/submit`, {
        method,
        id_photo_path: idPhoto,
        selfie_photo_path: selfiePhoto,
        task_photo_path: taskPhoto,
        custom_task: verificationStatus?.verification?.custom_task
      }, { withCredentials: true });
      
      toast.success('Verification submitted! Admin will review shortly.');
      fetchVerificationStatus();
    } catch (error) {
      toast.error('Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  };

  const requestCustomTask = async () => {
    try {
      await axios.post(`${API}/verification/request-task`, {}, { withCredentials: true });
      toast.success('Task request submitted! Admin will assign a task.');
      fetchVerificationStatus();
    } catch (error) {
      toast.error('Failed to request task');
    }
  };

  if (!user) return null;

  // Already verified
  if (user.is_verified) {
    return (
      <div className="min-h-screen bg-[#0B0A0F]">
        <Navigation user={user} />
        <main className="max-w-2xl mx-auto px-8 py-12 text-center">
          <div className="glass-effect p-12 rounded-2xl">
            <CheckCircle size={80} weight="fill" className="text-[#4CAF50] mx-auto mb-6" />
            <h1 className="heading-font text-4xl font-bold text-[#F7F5F0] mb-4">You're Verified!</h1>
            <p className="text-[#A8A3B2] mb-6">Your identity has been verified. You have a verified badge on your profile.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-3 rounded-full bg-[#D4AF37] text-[#0B0A0F] font-semibold hover:bg-[#F0C847] transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Status display helper
  const getStatusDisplay = () => {
    if (!verificationStatus?.verification) return null;
    
    const status = verificationStatus.verification.status;
    
    if (status === 'pending') {
      return (
        <div className="glass-effect p-6 rounded-2xl border-2 border-[#D4AF37] mb-8">
          <div className="flex items-center gap-3">
            <Clock size={32} weight="fill" className="text-[#D4AF37]" />
            <div>
              <h3 className="text-xl font-bold text-[#F7F5F0]">Verification Pending</h3>
              <p className="text-[#A8A3B2]">Your verification is being reviewed by an admin.</p>
            </div>
          </div>
        </div>
      );
    }
    
    if (status === 'awaiting_task') {
      return (
        <div className="glass-effect p-6 rounded-2xl border-2 border-[#D4AF37] mb-8">
          <div className="flex items-center gap-3">
            <Clock size={32} weight="fill" className="text-[#D4AF37]" />
            <div>
              <h3 className="text-xl font-bold text-[#F7F5F0]">Waiting for Task</h3>
              <p className="text-[#A8A3B2]">Admin will assign you a custom verification task soon.</p>
            </div>
          </div>
        </div>
      );
    }
    
    if (status === 'task_assigned') {
      return (
        <div className="glass-effect p-6 rounded-2xl border-2 border-[#4CAF50] mb-8">
          <h3 className="text-xl font-bold text-[#F7F5F0] mb-2">Your Verification Task</h3>
          <p className="text-[#D4AF37] text-lg font-semibold mb-4">
            "{verificationStatus.verification.custom_task}"
          </p>
          <p className="text-[#A8A3B2] mb-4">
            Take a photo of yourself completing this task and upload it below.
          </p>
          
          <div className="space-y-4">
            <label className="block">
              <span className="text-[#F7F5F0] font-medium mb-2 block">Upload Task Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleTaskPhotoChange}
                className="w-full px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0]"
              />
            </label>
            {taskPhoto && <p className="text-[#4CAF50] text-sm">✓ Task photo uploaded</p>}
            
            <button
              onClick={submitVerification}
              disabled={!taskPhoto || submitting}
              className="w-full py-3 rounded-full bg-[#4CAF50] text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </div>
        </div>
      );
    }
    
    if (status === 'rejected') {
      return (
        <div className="glass-effect p-6 rounded-2xl border-2 border-[#E53935] mb-8">
          <div className="flex items-center gap-3">
            <Warning size={32} weight="fill" className="text-[#E53935]" />
            <div>
              <h3 className="text-xl font-bold text-[#F7F5F0]">Verification Rejected</h3>
              <p className="text-[#A8A3B2]">
                Reason: {verificationStatus.verification.rejection_reason || 'Not specified'}
              </p>
              <p className="text-[#A8A3B2] mt-2">Please try again with clearer photos.</p>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-[#0B0A0F]">
      <Navigation user={user} />
      <main className="max-w-2xl mx-auto px-8 py-12">
        <div className="text-center mb-8">
          <ShieldCheck size={64} weight="fill" className="text-[#D4AF37] mx-auto mb-4" />
          <h1 className="heading-font text-4xl font-bold text-[#F7F5F0] mb-3">
            Get Verified
          </h1>
          <p className="text-[#A8A3B2]">
            Verify your identity to get a trusted badge and help prevent catfishing
          </p>
        </div>

        {getStatusDisplay()}

        {/* Show form only if not pending/awaiting/task_assigned */}
        {(!verificationStatus?.verification || 
          verificationStatus.verification.status === 'rejected') && (
          <div className="space-y-6">
            {/* Method Selection */}
            <div className="glass-effect p-6 rounded-2xl">
              <h2 className="heading-font text-2xl font-bold text-[#F7F5F0] mb-4">
                Choose Verification Method
              </h2>
              
              <div className="space-y-4">
                <label className={`block p-4 rounded-lg cursor-pointer transition-all ${
                  method === 'id_selfie' 
                    ? 'bg-[#B22234] border-2 border-[#B22234]' 
                    : 'bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] hover:border-[#B22234]'
                }`}>
                  <input
                    type="radio"
                    name="method"
                    value="id_selfie"
                    checked={method === 'id_selfie'}
                    onChange={() => setMethod('id_selfie')}
                    className="hidden"
                  />
                  <div className="flex items-center gap-4">
                    <IdentificationCard size={32} weight="duotone" className="text-[#D4AF37]" />
                    <div>
                      <h3 className="text-[#F7F5F0] font-bold">ID + Selfie Verification</h3>
                      <p className="text-[#A8A3B2] text-sm">Upload your ID and a selfie holding it</p>
                    </div>
                  </div>
                </label>

                <label className={`block p-4 rounded-lg cursor-pointer transition-all ${
                  method === 'custom_task' 
                    ? 'bg-[#B22234] border-2 border-[#B22234]' 
                    : 'bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] hover:border-[#B22234]'
                }`}>
                  <input
                    type="radio"
                    name="method"
                    value="custom_task"
                    checked={method === 'custom_task'}
                    onChange={() => setMethod('custom_task')}
                    className="hidden"
                  />
                  <div className="flex items-center gap-4">
                    <Camera size={32} weight="duotone" className="text-[#D4AF37]" />
                    <div>
                      <h3 className="text-[#F7F5F0] font-bold">Custom Task (No ID)</h3>
                      <p className="text-[#A8A3B2] text-sm">Admin will assign a task for you to complete</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* ID + Selfie Form */}
            {method === 'id_selfie' && (
              <div className="glass-effect p-6 rounded-2xl space-y-6">
                <h2 className="heading-font text-xl font-bold text-[#F7F5F0]">
                  Upload Your Photos
                </h2>
                
                <div>
                  <label className="block text-[#F7F5F0] font-medium mb-2">
                    1. Photo of Your ID (Driver's License, State ID, Passport)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIdPhotoChange}
                    disabled={uploading}
                    className="w-full px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0]"
                  />
                  {idPhoto && <p className="text-[#4CAF50] text-sm mt-2">✓ ID photo uploaded</p>}
                </div>

                <div>
                  <label className="block text-[#F7F5F0] font-medium mb-2">
                    2. Selfie Holding Your ID (Face clearly visible next to ID)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSelfiePhotoChange}
                    disabled={uploading}
                    className="w-full px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0]"
                  />
                  {selfiePhoto && <p className="text-[#4CAF50] text-sm mt-2">✓ Selfie uploaded</p>}
                </div>

                <button
                  onClick={submitVerification}
                  disabled={!idPhoto || !selfiePhoto || submitting}
                  className="w-full py-3 rounded-full bg-[#4CAF50] text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </div>
            )}

            {/* Custom Task Request */}
            {method === 'custom_task' && (
              <div className="glass-effect p-6 rounded-2xl">
                <h2 className="heading-font text-xl font-bold text-[#F7F5F0] mb-4">
                  Request Verification Task
                </h2>
                <p className="text-[#A8A3B2] mb-6">
                  Don't have an ID? No problem! An admin will assign you a simple task 
                  (like writing a number on paper) to verify you're a real person.
                </p>
                <button
                  onClick={requestCustomTask}
                  className="w-full py-3 rounded-full bg-[#D4AF37] text-[#0B0A0F] font-semibold hover:bg-[#F0C847] transition-all"
                >
                  Request Custom Task
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
