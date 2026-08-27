import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, Copy, ExternalLink, Download, Sparkles } from './MappedIcons';
import { useToast } from '../context/ToastContext';

export default function AddToCalendarDropdown({
  bookingRef,
  eventTitle = 'Movie Screening',
  venueName = 'Auditorium',
  venueAddress = '',
  dateTime,
  seats = [],
  className = '',
  buttonVariant = 'default', // 'default' | 'compact' | 'pill'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef(null);
  const { toast } = useToast();

  const backendUrl =
    import.meta.env.VITE_API_URL || 'https://bookme-backend-edh7.onrender.com/api';

  // Base host without protocol for webcal://
  const cleanHost = backendUrl.replace(/^https?:\/\//, '');
  const feedUrl = `https://${cleanHost}/calendar/feed/${bookingRef}.ics`;
  const webcalUrl = `webcal://${cleanHost}/calendar/feed/${bookingRef}.ics`;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format UTC date string for Google Calendar URL
  const formatGoogleDate = (d) => {
    const dateObj = d ? new Date(d) : new Date();
    return dateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startUtc = formatGoogleDate(dateTime);
  const endUtc = formatGoogleDate(
    new Date((dateTime ? new Date(dateTime).getTime() : Date.now()) + 2.5 * 60 * 60 * 1000)
  );

  const seatStr = Array.isArray(seats) && seats.length > 0 ? seats.join(', ') : 'Reserved Seats';
  const locationStr = [venueName, venueAddress].filter(Boolean).join(', ');
  const passUrl = `https://bookme-jet.vercel.app/my-bookings?ref=${bookingRef}`;

  const detailsStr = `🎟️ BooKMe Ticket Pass\nBooking Reference: ${bookingRef}\nSeats: ${seatStr}\nVenue: ${venueName}\n\nView & Download Pass: ${passUrl}`;

  const googleCalParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: `🎟️ ${eventTitle} (${bookingRef})`,
    dates: `${startUtc}/${endUtc}`,
    details: detailsStr,
    location: locationStr,
  });

  const googleCalUrl = `https://calendar.google.com/calendar/render?${googleCalParams.toString()}`;

  const handleCopyFeed = async () => {
    try {
      await navigator.clipboard.writeText(webcalUrl);
      setCopied(true);
      toast.success('Live Calendar Feed URL copied! Paste into Apple Calendar, Google Calendar, or Outlook to auto-sync updates.');
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      toast.info(`Feed URL: ${feedUrl}`);
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      {buttonVariant === 'compact' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-[#222222] hover:bg-[#2e2e2e] text-[#b3b3b3] hover:text-white border border-white/10 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          title="Add to Calendar"
        >
          <Calendar className="w-3.5 h-3.5 text-[#1ed760]" />
          <span>Calendar</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      ) : buttonVariant === 'pill' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 rounded-full bg-[#181818] hover:bg-[#242424] text-white border border-[#383838] hover:border-white/40 transition-all flex items-center gap-2 text-xs font-bold shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        >
          <Calendar className="w-4 h-4 text-[#1ed760]" />
          <span>Add to Calendar</span>
          <ChevronDown className={`w-3 h-3 text-[#b3b3b3] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full py-3 px-4 rounded-xl bg-[#1a1a1a] hover:bg-[#242424] text-white border border-[#333333] hover:border-[#1ed760]/50 transition-all flex items-center justify-between gap-3 text-xs font-bold cursor-pointer shadow-lg group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#1ed760]/15 text-[#1ed760] flex items-center justify-center group-hover:bg-[#1ed760] group-hover:text-black transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-white group-hover:text-[#1ed760] transition-colors">Add to Calendar</div>
              <div className="text-[10px] text-[#777777] font-normal">Auto-syncs showtime updates</div>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-[#777777] group-hover:text-white transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 sm:bottom-auto sm:top-full sm:mt-2 w-64 rounded-2xl bg-[#181818] border border-[#333333] shadow-2xl shadow-black/90 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-white">
          <div className="px-3 py-2 border-b border-white/10 mb-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#1ed760] flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              <span>Calendar Sync</span>
            </p>
            <p className="text-[10px] text-[#888888] mt-0.5">
              Reschedules update automatically
            </p>
          </div>

          <div className="space-y-1">
            {/* 1. Google Calendar Web Link */}
            <a
              href={googleCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl hover:bg-[#252525] text-xs font-bold transition-colors text-[#e5e5e5] hover:text-white group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🗓️</span>
                <span>Google Calendar</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#777777] group-hover:text-white" />
            </a>

            {/* 2. Apple / Outlook .ics Direct Download */}
            <a
              href={feedUrl}
              download={`${bookingRef}.ics`}
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl hover:bg-[#252525] text-xs font-bold transition-colors text-[#e5e5e5] hover:text-white group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🍏</span>
                <span>Apple / Outlook (.ics)</span>
              </div>
              <Download className="w-3.5 h-3.5 text-[#777777] group-hover:text-white" />
            </a>

            {/* 3. Live Sync Calendar Feed Subscription */}
            <button
              type="button"
              onClick={handleCopyFeed}
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl hover:bg-[#252525] text-xs font-bold transition-colors text-[#e5e5e5] hover:text-white group text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🔄</span>
                <div>
                  <div>Live Auto-Sync Feed</div>
                  <div className="text-[9px] text-[#777777] font-normal">Subscribable webcal:// URL</div>
                </div>
              </div>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-[#1ed760]" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[#777777] group-hover:text-white" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
