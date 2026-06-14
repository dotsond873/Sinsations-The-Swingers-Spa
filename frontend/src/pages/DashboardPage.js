import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Users, Fire, Trophy, ShieldCheck, Gift, Chat, Pencil, Camera, Heart, Key, MapPin, Crown } from '@phosphor-icons/react';
import Navigation from '../components/Navigation';

export default function DashboardPage({ user: propUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(propUser || null);
  const [winner, setWinner] = useState(null);
  const [nearbyMembers, setNearbyMembers] = useState([]);

  useEffect(() => {
    axios.get(API + '/auth/me', { withCredentials: true })
      .then(res => setUser(res.data))
      .catch(() => navigate('/login'));

    axios.get(API + '/contest/winner')
      .then(res => setWinner(res.data))
      .catch(() => {});
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchByParams = async (params) => {
      try {
        const res = await axios.get(API + '/members', { params, withCredentials: true });
        return (res.data || []).filter(m => m.user_id !== user.user_id);
      } catch {
        return [];
      }
    };
    const run = async () => {
      let results = [];
      if (user.area_code) results = await fetchByParams({ area_code: user.area_code, limit: 12 });
      if (results.length === 0 && user.state) results = await fetchByParams({ state: user.state, limit: 12 });
      if (results.length === 0) results = await fetchByParams({ limit: 12 });
      setNearbyMembers(results.slice(0, 6));
    };
    run();
  }, [user]);