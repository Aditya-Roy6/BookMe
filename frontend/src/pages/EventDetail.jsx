import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Modal,
  ModalContent,
  ModalBody,
  Button,
} from '@heroui/react';
import api from '../api/client';
import { ArrowRight, Loader2, Sparkles, User, ShieldCheck, Compass, Navigation, X, MessageSquare, TrendingUp, ChevronDown, Check } from 'lucide-react';
import { Play } from '../components/MappedIcons';
import { Ticket, Calendar, MapPin, Clock, Volume2, Star, Info, DollarSign, Film } from '../components/MappedIcons';
import {
  PlayRoundedIcon,
  StarRoundedIcon,
  CalendarRoundedIcon,
  MapPinRoundedIcon,
  TicketRoundedIcon,
  FireRoundedIcon,
} from '../components/CustomRoundedIcons';

function LanguageDropdown({ selectedLanguage, setSelectedLanguage, availableLanguages }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative font-sans z-30" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-[#181818] hover:bg-[#202020] border ${
          isOpen ? 'border-[#1ed760] shadow-[0_0_12px_rgba(30,215,96,0.25)]' : 'border-[#383838] hover:border-white/40'
        } text-white text-xs font-black py-2 px-4 rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-sm`}
      >
        <span className="text-white uppercase tracking-wider">{selectedLanguage === 'ALL' ? 'All Languages' : selectedLanguage}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#b3b3b3] transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#1ed760]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+6px)] min-w-[170px] bg-[#181818] border border-[#282828] rounded-2xl z-[9999] p-1.5 shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-150">
          {availableLanguages.map((lang) => {
            const isSelected = selectedLanguage === lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  setSelectedLanguage(lang);
                  setIsOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 text-xs font-bold text-left rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#163820] text-[#1ed760] font-black shadow-sm'
                    : 'text-[#b3b3b3] hover:bg-[#252525] hover:text-white'
                }`}
              >
                <span>{lang === 'ALL' ? 'All Languages' : lang}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#1ed760] stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function EventDetail() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trailerModalOpen, setTrailerModalOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await api.get(`/events/${eventId}`);
        setEvent(res.data.event);
        // Default to first available date or today
        if (res.data.event?.showtimes?.length > 0) {
          const firstDate = new Date(res.data.event.showtimes[0].dateTime)
            .toISOString()
            .split('T')[0];
          setSelectedDateStr(firstDate);
        } else {
          setSelectedDateStr(new Date().toISOString().split('T')[0]);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load movie event details.');
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [eventId]);

  const showtimes = event?.showtimes || [];

  // 1. Compute Next 7 Days Date Options
  const dateOptions = useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayName = i === 0 ? 'TODAY' : i === 1 ? 'TOM' : d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const monthName = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      const dayNum = d.getDate();

      // Count showtimes on this date
      const countOnDate = showtimes.filter((st) => {
        const stIso = new Date(st.dateTime).toISOString().split('T')[0];
        return stIso === iso;
      }).length;

      list.push({ iso, dayName, monthName, dayNum, count: countOnDate });
    }
    return list;
  }, [showtimes]);

  const availableLanguages = useMemo(() => {
    const langs = new Set();
    showtimes.forEach(st => langs.add(st.language || 'HINDI'));
    return ['ALL', ...Array.from(langs)];
  }, [showtimes]);

  // 2. Filter Showtimes for Selected Date & Group by Venue
  const groupedVenuesForDate = useMemo(() => {
    if (!selectedDateStr) return [];

    const dateShowtimes = showtimes.filter((st) => {
      const stIso = new Date(st.dateTime).toISOString().split('T')[0];
      const matchDate = stIso === selectedDateStr;
      const matchLang = selectedLanguage === 'ALL' || (st.language || 'HINDI') === selectedLanguage;
      return matchDate && matchLang;
    });

    const map = new Map();
    for (const st of dateShowtimes) {
      const v = st.venue || event?.venue || { name: 'PVR INOX Cinemas', address: 'Main Auditorium' };
      const vId = v.id || v.name;
      if (!map.has(vId)) {
        map.set(vId, {
          venue: v,
          showtimes: [],
        });
      }
      map.get(vId).showtimes.push(st);
    }

    return Array.from(map.values());
  }, [showtimes, selectedDateStr, selectedLanguage, event?.venue]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3 text-[#b3b3b3]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1ed760]" />
        <p className="text-sm font-bold">Loading live showtimes & event details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-[#f3727f] text-base font-bold">{error || 'Event not found'}</p>
        <Link
          to="/"
          className="px-6 py-2.5 bg-[#1ed760] text-black font-bold uppercase tracking-[1.4px] text-xs rounded-full hover:scale-105 transition-transform"
        >
          &larr; Back to Discover
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans pb-32">
      {/* ─── IMMERSIVE FULL-WIDTH HERO HEADER WITH 4K BACKDROP ─── */}
      <div className="relative w-full min-h-[480px] sm:min-h-[520px] flex items-start overflow-hidden pt-6 sm:pt-10">
        {/* Backdrop Image or Fallback */}
        {event.backdropUrl || event.imageUrl ? (
          <img
            src={event.backdropUrl || event.imageUrl}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-30 select-none filter blur-sm scale-105"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80';
            }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-transparent to-transparent" />

        {/* Hero Content Container - Aligned with Top & Bottom of Poster */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 w-full flex flex-col md:flex-row items-start gap-8">
          {/* Movie Poster Card with Watch Trailer Button */}
          <div className="relative w-56 sm:w-64 aspect-[2/3] rounded-2xl overflow-hidden bg-[#1e1e1e] shrink-0 group shadow-2xl">
            <img
              src={event.imageUrl}
              alt={event.title}
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=780&q=80';
              }}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => setTrailerModalOpen(true)}
              className="absolute inset-0 bg-black/40 hover:bg-black/20 transition-colors flex items-center justify-center group-hover:scale-105 cursor-pointer"
              title="Play Trailer"
              aria-label="Play Trailer"
            >
              <div className="w-14 h-14 rounded-full bg-[#1ed760] text-black flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl shadow-[#1ed760]/40">
                <PlayRoundedIcon className="w-6 h-6 fill-black ml-1" />
              </div>
            </button>
          </div>

          {/* Right Column: Title at Top, Languages & Info at Bottom (Matching Photo Height) */}
          <div className="self-stretch flex-1 flex flex-col justify-between pt-1 pb-1 min-h-[340px] sm:min-h-[384px]">
            {/* Top Section: Title, Badges & Metadata */}
            <div className="space-y-3.5">
              <h1 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight uppercase leading-tight">
                {event.title}
              </h1>

              {/* Solid Badges with NO Outline Borders */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="px-3 py-1 bg-[#1ed760] text-black font-black uppercase tracking-wider rounded-full text-[10px]">
                  {event.type}
                </span>
                <span className="px-2.5 py-1 bg-[#242424] text-amber-400 font-bold rounded-full font-mono text-[11px]">
                  {event.ageRating || event.rating || 'UA 13+'}
                </span>
                <span className="px-2.5 py-1 bg-[#1f1f1f] text-[#b3b3b3] rounded-full text-[11px]">
                  {event.duration || '2h 25m'}
                </span>
                <span className="px-2.5 py-1 bg-[#1f1f1f] text-[#b3b3b3] rounded-full text-[11px]">
                  {event.genre || 'Action • Adventure'}
                </span>
                {event.imdbRating && (
                  <span className="px-2.5 py-1 bg-[#252525] text-amber-400 font-bold rounded-full text-[11px] flex items-center gap-1">
                    <StarRoundedIcon className="w-3 h-3 fill-amber-400" />
                    <span>{event.imdbRating} / 10</span>
                  </span>
                )}
              </div>

              {event.tagline && (
                <p className="text-sm italic text-[#b3b3b3] font-medium">
                  "{event.tagline}"
                </p>
              )}

              {event.director && (
                <p className="text-xs sm:text-sm text-[#b3b3b3]">
                  Directed by <span className="text-white font-bold">{event.director}</span>
                </p>
              )}
            </div>

            {/* Bottom Section: Matching Lower Side of Photo, Solid Colors, NO Line Borders */}
            <div className="pt-4 space-y-2.5 border-t border-white/10 mt-6 md:mt-0">
              {event.type === 'movie' ? (
                <>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#b3b3b3]">
                      Available Languages:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(availableLanguages.filter(l => l !== 'ALL').length > 0
                        ? availableLanguages.filter(l => l !== 'ALL')
                        : ['ENGLISH', 'HINDI', 'TELUGU', 'TAMIL']
                      ).map((lang) => (
                        <span
                          key={lang}
                          className="px-3 py-1 bg-[#252525] text-white text-[11px] font-black rounded-full uppercase tracking-wider"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#b3b3b3]">
                      Experience In:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {['IMAX 3D', 'DOLBY ATMOS 7.1', '4K LASER', '4DX'].map((fmt) => (
                        <span
                          key={fmt}
                          className="px-3 py-1 bg-[#1ed760] text-black text-[10px] font-mono font-black rounded-full uppercase"
                        >
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#7c7c7c] pt-1">
                    <span className="flex items-center gap-1.5 text-white font-bold">
                      <MapPin className="w-4 h-4 text-[#1ed760]" /> Multi-Theatre Multiplex Release
                    </span>
                    <span>&bull;</span>
                    <span>{showtimes.length} Sessions Available</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#b3b3b3]">
                      Audio Experience:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {['DOLBY ATMOS 360° ACOUSTICS', 'SYMPHONIC ORCHESTRA', 'LIVE VOCALS'].map((fmt) => (
                        <span
                          key={fmt}
                          className="px-3 py-1 bg-[#252525] text-white text-[10px] font-mono font-black rounded-full uppercase"
                        >
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#b3b3b3]">
                      Stage & Arena:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {['CENTER 360° STAGE', 'CONCENTRIC GRANDSTANDS', 'VIP STALLS'].map((stage) => (
                        <span
                          key={stage}
                          className="px-3 py-1 bg-[#1ed760] text-black text-[10px] font-mono font-black rounded-full uppercase"
                        >
                          {stage}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#7c7c7c] pt-1">
                    <span className="flex items-center gap-1.5 text-white font-bold">
                      <MapPin className="w-4 h-4 text-[#1ed760]" /> {event.venue?.name || 'Grand Arena & Concert Auditorium'}
                    </span>
                    <span>&bull;</span>
                    <span>{showtimes.length} Arena Sessions Scheduled</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── MULTI-DATE & MULTI-LOCATION THEATRE SHOWTIMES ENGINE ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* 1. Horizontal Multi-Date Strip */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-white tracking-tight">Select Date & Theatres</h2>
            <div className="flex items-center justify-between sm:justify-end gap-6">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#b3b3b3] uppercase">Language:</span>
                <LanguageDropdown
                  selectedLanguage={selectedLanguage}
                  setSelectedLanguage={setSelectedLanguage}
                  availableLanguages={availableLanguages}
                />
              </div>
              <div className="hidden sm:flex items-center gap-4 text-[11px] font-bold text-[#b3b3b3]">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#1ed760]" /> Available</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#ffa42b]" /> Filling Fast</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto py-2 scrollbar-none border-b border-white/10">
            {dateOptions.map((dateObj) => {
              const isSelected = selectedDateStr === dateObj.iso;
              return (
                <button
                  key={dateObj.iso}
                  onClick={() => setSelectedDateStr(dateObj.iso)}
                  className={`flex flex-col items-center justify-center py-2.5 px-5 rounded-xl transition-colors min-w-[78px] cursor-pointer ${
                    isSelected
                      ? 'bg-[#1ed760] text-black font-black'
                      : 'bg-[#181818] hover:bg-[#282828] text-[#b3b3b3] hover:text-white'
                  }`}
                >
                  <span className={`text-base font-black ${isSelected ? 'text-black font-black' : 'text-white font-bold'}`}>
                    {dateObj.dayNum}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-black font-black' : 'text-[#7c7c7c]'}`}>
                    {dateObj.dayName}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Grouped Theatre Cards with Showtime Slots */}
        <section className="space-y-4">
          {groupedVenuesForDate.length === 0 ? (
            <div className="bg-[#181818] p-8 rounded-2xl border border-white/5 text-center text-[#b3b3b3] space-y-2">
              <Calendar className="w-8 h-8 mx-auto text-[#7c7c7c]" />
              <p className="text-sm font-bold text-white">No showtimes scheduled for this date.</p>
              <p className="text-xs">Please select another date from the strip above.</p>
            </div>
          ) : (
            groupedVenuesForDate.map((group, idx) => {
              const { venue, showtimes: vShowtimes } = group;

              return (
                <div
                  key={idx}
                  className="bg-[#181818] hover:bg-[#1a1a1a] transition-colors p-5 sm:p-6 rounded-2xl border border-[#282828] space-y-4"
                >
                  {/* Theatre Name & Location Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span>{venue.name}</span>
                      </h3>
                      <p className="text-xs text-[#b3b3b3] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#1ed760] flex-shrink-0" />
                        <span>{venue.address}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#b3b3b3]">
                      <span className="px-2.5 py-1 bg-[#121212] rounded-md font-mono text-[11px] border border-white/5">
                        {venue.totalRows ? `${venue.totalRows * venue.totalCols} Seats` : 'Full Auditorium'}
                      </span>
                    </div>
                  </div>

                  {/* Showtime Slots with Subtle Clean Hover (No Harsh Green Border) */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {vShowtimes.map((st) => {
                      const dt = new Date(st.dateTime);
                      const timeStr = dt.toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <button
                          key={st.id}
                          onClick={() => navigate(`/showtime/${st.id}/seats`)}
                          className="flex flex-col items-center justify-center px-4 py-2.5 bg-[#121212] hover:bg-[#1ed760] hover:text-black border border-[#282828] hover:border-[#1ed760] text-white rounded-xl transition-all duration-200 group cursor-pointer hover:scale-[1.02]"
                        >
                          <span className="text-[10px] font-bold tracking-wider uppercase text-[#b3b3b3] group-hover:text-black/80 transition-colors block">
                            {st.language || 'HINDI'} &bull; {st.format || 'DOLBY ATMOS'}
                          </span>
                          <span className="text-sm font-bold group-hover:text-black mt-0.5">
                            {timeStr}
                          </span>
                          {st.screen && (
                            <span className="text-[9px] text-[#7c7c7c] group-hover:text-black/70 font-mono">
                              {st.screen}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* 3. Cast & Performers with Smooth Circular Ring Hover */}
        {event.showCast !== false && event.cast && event.cast.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-white/5">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Cast & Performers
            </h2>
            <div className="flex items-start gap-6 sm:gap-8 overflow-x-auto pb-4 pt-2 scrollbar-none">
              {event.cast.map((actor, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center flex-shrink-0 group cursor-pointer"
                  style={{ width: '120px' }}
                >
                  {/* Smooth Circular Avatar with Spotify Green Ring on Hover */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-[#1a1a1a] ring-0 group-hover:ring-2 group-hover:ring-[#1ed760] group-hover:scale-105 transition-all duration-300 flex items-center justify-center">
                    {actor.avatarUrl ? (
                      <img
                        src={actor.avatarUrl}
                        alt={actor.name}
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80';
                        }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-[#7c7c7c]" />
                    )}
                  </div>

                  {/* Actor Name & Role */}
                  <h4 className="text-xs font-bold text-white text-center mt-2.5 leading-tight line-clamp-1 w-full">
                    {actor.name}
                  </h4>
                  <p className="text-[11px] text-[#b3b3b3] text-center mt-0.5 line-clamp-1 w-full">
                    {actor.role}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. About the Experience & Auditorium Features */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 border-t border-[#282828]">
          {/* Card 1: About the Experience */}
          <div className="lg:col-span-6 bg-[#181818] border border-[#282828] p-6 sm:p-7 rounded-2xl space-y-5">
            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                About the Experience
              </h2>
              <p className="text-xs sm:text-sm text-[#b3b3b3] leading-relaxed">
                {event.description}
              </p>
            </div>

            {/* Feature Pills */}
            <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-white/5">
              <div className="bg-[#121212] p-3 rounded-xl border border-white/5 flex flex-col items-start gap-1">
                <span className="text-[10px] text-[#7c7c7c] uppercase font-bold tracking-wider">Audio</span>
                <span className="text-xs font-bold text-white">Dolby Atmos</span>
              </div>

              <div className="bg-[#121212] p-3 rounded-xl border border-white/5 flex flex-col items-start gap-1">
                <span className="text-[10px] text-[#7c7c7c] uppercase font-bold tracking-wider">Sync</span>
                <span className="text-xs font-bold text-white">Instant Lock</span>
              </div>

              <div className="bg-[#121212] p-3 rounded-xl border border-white/5 flex flex-col items-start gap-1">
                <span className="text-[10px] text-[#7c7c7c] uppercase font-bold tracking-wider">Visuals</span>
                <span className="text-xs font-bold text-white">4K Laser</span>
              </div>
            </div>
          </div>

          {/* Card 2: Auditorium Features & Seating Tiers */}
          <div className="lg:col-span-6 bg-[#181818] border border-[#282828] p-6 sm:p-7 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Auditorium Features
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#b3b3b3]">
                <span className="px-2 py-0.5 rounded bg-[#121212] border border-white/5">IMAX 70mm</span>
                <span className="px-2 py-0.5 rounded bg-[#121212] border border-white/5">4K Laser</span>
              </div>
            </div>

            {/* Seating Categories with public folder SVGs */}
            <div className="space-y-2 pt-1">
              <div className="p-3 rounded-xl bg-[#121212] border border-white/5 hover:border-white/20 transition-colors flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-[#1f1f1f] flex items-center justify-center flex-shrink-0">
                  <img src="/normal seats.svg" alt="Classic Seat" className="w-5 h-5 invert opacity-75" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white">Classic Seats</h4>
                  <p className="text-[11px] text-[#7c7c7c] truncate">Standard comfort with complete front acoustic immersion</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#121212] border border-white/5 hover:border-white/20 transition-colors flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-[#1f1f1f] flex items-center justify-center flex-shrink-0">
                  <img src="/normal seats.svg" alt="Prime Seat" className="w-5 h-5 invert opacity-75" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white">Prime Club</h4>
                  <p className="text-[11px] text-[#7c7c7c] truncate">Premium sweet-spot viewing angle with enhanced legroom</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#121212] border border-white/5 hover:border-white/20 transition-colors flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-[#1f1f1f] flex items-center justify-center flex-shrink-0">
                  <img src="/recliner seats.svg" alt="Recliner Seat" className="w-5 h-6 invert opacity-75" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white">VIP Recliner Lounges</h4>
                  <p className="text-[11px] text-[#7c7c7c] truncate">Motorized plush leather recliners with private table service</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Audience & Critic Reviews from TMDB */}
        {event.showReviews !== false && event.reviews && event.reviews.length > 0 && (
          <section className="space-y-4 pt-6 border-t border-[#282828]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-[#1ed760]" />
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Audience & Critic Reviews
                </h2>
              </div>
              <span className="text-xs text-[#7c7c7c] font-mono">
                {event.reviews.length} Verified Reviews
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {event.reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-[#181818] border border-[#282828] p-5 rounded-2xl space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#242424] border border-white/10 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                          {rev.avatarUrl ? (
                            <img src={rev.avatarUrl} alt={rev.author} className="w-full h-full object-cover" />
                          ) : (
                            rev.author?.charAt(0) || 'U'
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{rev.author}</h4>
                          <span className="text-[10px] text-[#7c7c7c]">
                            {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Verified Reviewer'}
                          </span>
                        </div>
                      </div>

                      {rev.rating && (
                        <div className="flex items-center gap-1 bg-[#121212] px-2 py-0.5 rounded-full border border-amber-500/20 text-amber-400 text-xs font-bold">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{rev.rating}/10</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-[#b3b3b3] leading-relaxed line-clamp-4">
                      "{rev.content.replace(/<[^>]*>?/gm, '')}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ─── IMMERSIVE TRAILER VIDEO MODAL ─── */}
      <Modal
        isOpen={trailerModalOpen}
        onOpenChange={setTrailerModalOpen}
        backdrop="blur"
        size="4xl"
        hideCloseButton={true}
        className="bg-transparent text-white shadow-none border-none max-w-4xl p-0 overflow-hidden"
      >
        <ModalContent>
          {(onClose) => (
            <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/20">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-black/80 hover:bg-black text-white hover:text-[#1ed760] flex items-center justify-center transition-all shadow-lg border border-white/20 cursor-pointer"
                title="Close Trailer"
              >
                <X className="w-5 h-5" />
              </button>

              <iframe
                src={(() => {
                  const url = event.trailerUrl;
                  if (!url) {
                    return `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent((event.title || 'Movie') + ' Official Trailer')}&autoplay=1`;
                  }
                  let cleanUrl = url;
                  if (cleanUrl.includes('youtu.be/')) {
                    const id = cleanUrl.split('youtu.be/')[1]?.split('?')[0];
                    cleanUrl = `https://www.youtube-nocookie.com/embed/${id}`;
                  } else if (cleanUrl.includes('watch?v=')) {
                    const id = cleanUrl.split('watch?v=')[1]?.split('&')[0];
                    cleanUrl = `https://www.youtube-nocookie.com/embed/${id}`;
                  }
                  return cleanUrl.includes('autoplay=1') ? cleanUrl : `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}autoplay=1`;
                })()}
                title="Movie Trailer"
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
