import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import Navigation from '../components/Navigation';
import { Camera, VideoCamera, Upload, Trash, Eye, EyeSlash } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function MediaUploadPage({ user: propUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(propUser);
  const [activeTab, setActiveTab] = useState('photos');
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      axios.get(`${API}/auth/me`, { withCredentials: true })
        .then(res => setUser(res.data))
        .catch(() => navigate('/login'));
    }
    fetchMedia();
  }, [user, navigate]);

  const fetchMedia = async () => {
    try {
      const [photosRes, videosRes] = await Promise.all([
        axios.get(`${API}/media/user/${user?.user_id}?media_type=photo`, { withCredentials: true }),
        axios.get(`${API}/media/user/${user?.user_id}?media_type=video`, { withCredentials: true })
      ]);
      setPhotos(photosRes.data || []);
      setVideos(videosRes.data || []);
    } catch (error) {
      console.error('Failed to fetch media');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e, mediaType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (mediaType === 'photo' && !file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (mediaType === 'video' && !file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    // Check file size (50MB limit for videos, 10MB for photos)
    const maxSize = mediaType === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File too large. Max ${mediaType === 'video' ? '50MB' : '10MB'}`);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      await axios.post(
        `${API}/media/upload?media_type=${mediaType}&is_public=false`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' }, withCredentials: true }
      );
      toast.success(`${mediaType === 'video' ? 'Video' : 'Photo'} uploaded!`);
      fetchMedia();
    } catch (error) {
      toast.error(`Failed to upload ${mediaType}`);
    } finally {
      setUploading(false);
    }
  };

  const deleteMedia = async (mediaId) => {
    if (!window.confirm('Delete this media?')) return;
    
    try {
      await axios.delete(`${API}/media/${mediaId}`, { withCredentials: true });
      toast.success('Deleted');
      fetchMedia();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (!user || loading) {
    return <div className="min-h-screen bg-[#0B0A0F] flex items-center justify-center">
      <div className="text-[#F7F5F0]">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0A0F]">
      <Navigation user={user} />
      <main className="max-w-7xl mx-auto px-8 py-12">
        <h1 className="heading-font text-4xl font-bold text-[#F7F5F0] mb-8">My Media</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('photos')}
            className={`px-6 py-3 rounded-full font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'photos' 
                ? 'bg-[#B22234] text-[#F7F5F0]' 
                : 'glass-effect text-[#A8A3B2] hover:text-[#F7F5F0]'
            }`}
          >
            <Camera size={20} weight="fill" />
            Photos ({photos.length})
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-6 py-3 rounded-full font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'videos' 
                ? 'bg-[#B22234] text-[#F7F5F0]' 
                : 'glass-effect text-[#A8A3B2] hover:text-[#F7F5F0]'
            }`}
          >
            <VideoCamera size={20} weight="fill" />
            Videos ({videos.length})
          </button>
        </div>

        {/* Upload Section */}
        <div className="glass-effect p-6 rounded-2xl mb-8">
          <h2 className="heading-font text-xl font-bold text-[#F7F5F0] mb-4">
            Upload {activeTab === 'photos' ? 'Photo' : 'Video'}
          </h2>
          <label className="block">
            <div className={`border-2 border-dashed border-[rgba(247,245,240,0.2)] rounded-xl p-8 text-center cursor-pointer hover:border-[#D4AF37] transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <input
                type="file"
                accept={activeTab === 'photos' ? 'image/*' : 'video/*'}
                onChange={(e) => handleUpload(e, activeTab === 'photos' ? 'photo' : 'video')}
                disabled={uploading}
                className="hidden"
              />
              <Upload size={48} weight="duotone" className="text-[#D4AF37] mx-auto mb-4" />
              <p className="text-[#F7F5F0] font-semibold mb-2">
                {uploading ? 'Uploading...' : `Click to upload ${activeTab === 'photos' ? 'a photo' : 'a video'}`}
              </p>
              <p className="text-[#A8A3B2] text-sm">
                {activeTab === 'photos' 
                  ? 'JPG, PNG, GIF up to 10MB'
                  : 'MP4, MOV, AVI up to 50MB'}
              </p>
            </div>
          </label>
        </div>

        {/* Media Grid */}
        {activeTab === 'photos' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.length === 0 ? (
              <div className="col-span-full glass-effect p-12 rounded-2xl text-center">
                <Camera size={64} weight="duotone" className="text-[#757180] mx-auto mb-4" />
                <p className="text-[#A8A3B2]">No photos uploaded yet</p>
              </div>
            ) : (
              photos.map(photo => (
                <div key={photo.media_id} className="relative group glass-effect rounded-xl overflow-hidden aspect-square">
                  <img 
                    src={`${API}/media/${photo.media_id}`} 
                    alt="Photo" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button
                      onClick={() => deleteMedia(photo.media_id)}
                      className="p-2 rounded-full bg-[#E53935] text-white hover:bg-red-600 transition-all"
                    >
                      <Trash size={20} weight="fill" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 right-2">
                    {photo.is_public ? (
                      <Eye size={20} className="text-[#4CAF50]" />
                    ) : (
                      <EyeSlash size={20} className="text-[#A8A3B2]" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'videos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videos.length === 0 ? (
              <div className="col-span-full glass-effect p-12 rounded-2xl text-center">
                <VideoCamera size={64} weight="duotone" className="text-[#757180] mx-auto mb-4" />
                <p className="text-[#A8A3B2]">No videos uploaded yet</p>
              </div>
            ) : (
              videos.map(video => (
                <div key={video.media_id} className="glass-effect rounded-xl overflow-hidden">
                  <video 
                    src={`${API}/media/${video.media_id}`}
                    controls
                    className="w-full aspect-video bg-black"
                  />
                  <div className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-[#F7F5F0] text-sm truncate">{video.original_filename}</p>
                      <p className="text-[#A8A3B2] text-xs">
                        {(video.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {video.is_public ? (
                        <Eye size={20} className="text-[#4CAF50]" />
                      ) : (
                        <EyeSlash size={20} className="text-[#A8A3B2]" />
                      )}
                      <button
                        onClick={() => deleteMedia(video.media_id)}
                        className="p-2 rounded-full bg-[#E53935] text-white hover:bg-red-600 transition-all"
                      >
                        <Trash size={20} weight="fill" />
                      </button>
                    </div>
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
