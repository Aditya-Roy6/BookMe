import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';

import { Ticket, Calendar, MapPin, Bell, Save, Volume2, Clock, User, Mail, Shield, QrCode, CheckCircle2, Armchair, Sparkles, Sliders, Loader2, Camera, Check, Upload } from '../components/MappedIcons';

export default function CustomerSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile Avatar State (Stored in localStorage)
  const [avatarUrl, setAvatarUrl] = useState(
    () => localStorage.getItem('luminatix_avatar') || ''
  );

  // Customer Preferences State
  const [preferredZone, setPreferredZone] = useState('center');
  const [preferredFormat, setPreferredFormat] = useState('dolby');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [waitlistAlerts, setWaitlistAlerts] = useState(true);
  const [reminderAlerts, setReminderAlerts] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      try {
        const res = await api.get('/bookings/my-bookings');
        setBookings(res.data.bookings || []);
      } catch (err) {
        console.error('Failed to load user bookings in settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUserData();
  }, []);

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        setAvatarUrl(result);
        localStorage.setItem('luminatix_avatar', result);
        window.dispatchEvent(new Event('storage'));
        toast.success('Profile avatar updated successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    toast.success('Your profile preferences and seating defaults have been updated successfully!');
  };

  // Calculate user booking analytics
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');
  const totalSeatsReserved = confirmedBookings.reduce(
    (sum, b) => sum + (b.items?.length || 0),
    0
  );
  const totalSpent = confirmedBookings.reduce(
    (sum, b) => sum + parseFloat(b.totalAmount || 0),
    0
  );

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-[#b3b3b3]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1ed760]" />
        <p className="text-sm font-bold">Loading account settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-8 text-white font-sans">
      {/* ─── HEADER ─── */}
      <div className="border-b border-[#282828] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold text-[#1ed760] tracking-wider block">
            Account Management
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Settings & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-[#b3b3b3] mt-1">
            Manage your customer profile, profile photo, and seating preferences.
          </p>
        </div>

        <Link
          to="/my-bookings"
          className="px-5 py-2.5 bg-[#252525] hover:bg-[#333333] text-white text-xs font-bold rounded-full transition-colors flex items-center gap-2 w-fit border border-white/5 cursor-pointer"
        >
          <Ticket className="w-4 h-4 text-[#1ed760]" />
          <span>My Tickets ({confirmedBookings.length})</span>
        </Link>
      </div>

      {/* ─── ROW 1: PROFILE SUMMARY WITH PHOTO UPLOAD & SEAT ANALYTICS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card with Photo Upload */}
        <div className="bg-[#181818] p-6 rounded-3xl border border-[#282828] shadow-2xl space-y-5">
          <div className="flex items-center gap-4">
            {/* Avatar Circle with Upload Trigger (Glow completely removed) */}
            <div className="relative group/avatar flex-shrink-0 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user?.name}
                  className="w-16 h-16 rounded-full object-cover border border-white/10 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#1ed760] text-black font-black text-2xl flex items-center justify-center border border-white/10 shadow-md">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              {/* Camera Upload Badge Overlay */}
              <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                <Camera className="w-4 h-4 text-white" />
                <span className="text-[8px] font-bold text-white uppercase mt-0.5">Upload</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            <div className="overflow-hidden">
              <h3 className="text-lg font-black text-white truncate">{user?.name}</h3>
              <p className="text-xs text-[#b3b3b3] truncate">{user?.email}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-bold text-[#1ed760] hover:underline mt-0.5 block cursor-pointer"
              >
                Change Photo
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-[#282828] text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#b3b3b3]">Account Type:</span>
              <span className="font-bold text-white uppercase">Customer</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#b3b3b3]">Member Status:</span>
              <span className="text-[#1ed760] font-bold">Verified</span>
            </div>
          </div>
        </div>

        {/* Lifetime Seat Booking Stats */}
        <div className="md:col-span-2 bg-[#181818] p-6 rounded-3xl border border-[#282828] shadow-2xl flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1ed760] block">
              Booking Statistics
            </span>
            <h3 className="text-xl font-black text-white">Your Seating History</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-4 bg-[#121212] rounded-2xl border border-white/5 space-y-1 text-center">
              <span className="text-[10px] font-bold uppercase text-[#7c7c7c] block">
                Total Seats
              </span>
              <p className="text-2xl font-black text-white font-mono">{totalSeatsReserved}</p>
            </div>
            <div className="p-4 bg-[#121212] rounded-2xl border border-white/5 space-y-1 text-center">
              <span className="text-[10px] font-bold uppercase text-[#7c7c7c] block">
                Active Passes
              </span>
              <p className="text-2xl font-black text-[#1ed760] font-mono">{confirmedBookings.length}</p>
            </div>
            <div className="p-4 bg-[#121212] rounded-2xl border border-white/5 space-y-1 text-center">
              <span className="text-[10px] font-bold uppercase text-[#7c7c7c] block">
                Total Orders
              </span>
              <p className="text-2xl font-black text-white font-mono">{totalBookings}</p>
            </div>
            <div className="p-4 bg-[#121212] rounded-2xl border border-white/5 space-y-1 text-center">
              <span className="text-[10px] font-bold uppercase text-[#7c7c7c] block">
                Total Paid
              </span>
              <p className="text-2xl font-black text-[#1ed760] font-mono">₹{totalSpent.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ROW 2: SEATING & PRODUCTION PREFERENCES FORM ─── */}
      <form onSubmit={handleSavePreferences} className="space-y-6">
        <div className="bg-[#181818] p-6 sm:p-8 rounded-3xl border border-[#282828] shadow-2xl space-y-6">
          <div className="border-b border-[#282828] pb-4">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Armchair className="w-5 h-5 text-[#1ed760]" />
              <span>Seating & Audio Preferences</span>
            </h3>
            <p className="text-xs text-[#b3b3b3] mt-1">
              Customize your default seat selection preferences for 1-click booking suggestions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Preferred Seating Zone (Selected without borders - Solid Pill Style) */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3]">
                Preferred Seating Tier / Position
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-bold">
                {[
                  { id: 'center', label: 'Prime Center' },
                  { id: 'vip', label: 'VIP Recliner' },
                  { id: 'aisle', label: 'Aisle Access' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPreferredZone(opt.id)}
                    className={`p-3 rounded-2xl transition-all cursor-pointer text-center ${
                      preferredZone === opt.id
                        ? 'bg-white text-black font-black shadow-md'
                        : 'bg-[#1f1f1f] hover:bg-[#282828] text-[#b3b3b3] hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Audio / Projection Format (Selected without borders - Solid Pill Style) */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3]">
                Preferred Sound / Format
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-bold">
                {[
                  { id: 'dolby', label: 'Dolby Atmos' },
                  { id: 'imax', label: 'IMAX 70mm' },
                  { id: 'laser', label: '3D 4K Laser' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPreferredFormat(opt.id)}
                    className={`p-3 rounded-2xl transition-all cursor-pointer text-center ${
                      preferredFormat === opt.id
                        ? 'bg-white text-black font-black shadow-md'
                        : 'bg-[#1f1f1f] hover:bg-[#282828] text-[#b3b3b3] hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Round Animated Toggle Checkboxes */}
          <div className="pt-4 border-t border-[#282828] space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#1ed760]" />
              <span>Notification Preferences</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {/* Toggle 1: Waitlist Instant Alerts */}
              <div
                onClick={() => setWaitlistAlerts(!waitlistAlerts)}
                className="p-4 bg-[#121212] rounded-2xl border border-white/5 flex items-center justify-between cursor-pointer hover:border-white/20 transition-all select-none"
              >
                <span className="font-bold text-white">Waitlist Instant Alerts</span>
                <div
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center ${
                    waitlistAlerts ? 'bg-[#1ed760]' : 'bg-[#333333]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
                      waitlistAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  >
                    {waitlistAlerts && <Check className="w-3 h-3 text-black stroke-[3]" />}
                  </div>
                </div>
              </div>

              {/* Toggle 2: Booking QR Receipts */}
              <div
                onClick={() => setEmailAlerts(!emailAlerts)}
                className="p-4 bg-[#121212] rounded-2xl border border-white/5 flex items-center justify-between cursor-pointer hover:border-white/20 transition-all select-none"
              >
                <span className="font-bold text-white">Booking QR Receipts</span>
                <div
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center ${
                    emailAlerts ? 'bg-[#1ed760]' : 'bg-[#333333]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
                      emailAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  >
                    {emailAlerts && <Check className="w-3 h-3 text-black stroke-[3]" />}
                  </div>
                </div>
              </div>

              {/* Toggle 3: 2h Showtime Reminders */}
              <div
                onClick={() => setReminderAlerts(!reminderAlerts)}
                className="p-4 bg-[#121212] rounded-2xl border border-white/5 flex items-center justify-between cursor-pointer hover:border-white/20 transition-all select-none"
              >
                <span className="font-bold text-white">2h Showtime Reminders</span>
                <div
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center ${
                    reminderAlerts ? 'bg-[#1ed760]' : 'bg-[#333333]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
                      reminderAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  >
                    {reminderAlerts && <Check className="w-3 h-3 text-black stroke-[3]" />}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-8 py-3 bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-xs uppercase tracking-[1.4px] rounded-full hover:scale-105 transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </button>
          </div>
        </div>
      </form>

      {/* ─── ROW 3: RECENT BOOKED SEATS QUICK VIEW ─── */}
      <div className="bg-[#181818] p-6 sm:p-8 rounded-3xl border border-[#282828] shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#282828] pb-4">
          <div>
            <h3 className="text-xl font-black text-white">Recent Reserved Seats</h3>
            <p className="text-xs text-[#b3b3b3] mt-0.5">Quick access to your confirmed admission passes</p>
          </div>
          <Link
            to="/my-bookings"
            className="text-xs font-bold text-[#1ed760] hover:underline"
          >
            View All ({bookings.length}) &rarr;
          </Link>
        </div>

        {confirmedBookings.length === 0 ? (
          <div className="py-8 text-center text-[#7c7c7c] text-xs">
            No active reservations found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            {confirmedBookings.slice(0, 3).map((b) => (
              <div
                key={b.id}
                className="p-4 bg-[#121212] rounded-2xl border border-white/5 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-[#b3b3b3] truncate">
                    {b.bookingRef}
                  </span>
                  <span className="text-[9px] uppercase font-black px-2 py-0.5 bg-[#1ed760]/20 text-[#1ed760] rounded-full">
                    CONFIRMED
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm truncate">
                  {b.showtime?.event?.title || 'Experience'}
                </h4>
                <div className="flex flex-wrap gap-1">
                  {b.items?.map((item) => (
                    <span
                      key={item.id}
                      className="px-2 py-0.5 bg-[#1f1f1f] text-[#1ed760] rounded font-mono font-bold text-[10px]"
                    >
                      Seat {item.seat?.label || item.seatId}
                    </span>
                  ))}
                </div>
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[#b3b3b3]">
                  <span>₹{b.totalAmount}</span>
                  <Link
                    to="/my-bookings"
                    className="text-[#1ed760] font-bold hover:underline"
                  >
                    View Pass &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}