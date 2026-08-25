import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';
import api from '../api/client';
import Select from '../components/Select';
import DateTimePicker from '../components/DateTimePicker';

import { DollarSign, Ticket, Calendar, Film, MapPin, Clock, Volume2, BarChart3, PieChart, Percent, Search, Filter, Star, Users, Plus, Loader2, AlertCircle, CheckCircle2, Music, Sparkles, TrendingUp, X, Activity, ArrowUpRight, Layers, ChevronRight, Edit3, Sliders, Eye } from '../components/MappedIcons';
import { useToast } from '../context/ToastContext';
import { StarRoundedIcon } from '../components/CustomRoundedIcons';

export default function OrganiserDashboard() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState(null);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'productions'
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Showtime edit state with Dynamic Seat-View Pricing
  const [editShowtimeModalOpen, setEditShowtimeModalOpen] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState(null);
  const [editEventTitle, setEditEventTitle] = useState('');
  const [editDateTime, setEditDateTime] = useState('');
  const [editFormat, setEditFormat] = useState('DOLBY ATMOS');
  const [editLanguage, setEditLanguage] = useState('ENGLISH');
  const [editPricingMap, setEditPricingMap] = useState({});
  const [editDynamicPricing, setEditDynamicPricing] = useState(true);
  const [editVenue, setEditVenue] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  // Display options & Existing production linking
  const [showCast, setShowCast] = useState(true);
  const [showReviews, setShowReviews] = useState(true);
  const [creationMode, setCreationMode] = useState('new'); // 'new' | 'existing'
  const [selectedExistingEventId, setSelectedExistingEventId] = useState('');

  // Interactive Chart States
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Event creation form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('movie');
  const [venueId, setVenueId] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [pricingMap, setPricingMap] = useState({});
  const [tmdbSuggestions, setTmdbSuggestions] = useState([]);
  const [tmdbSearching, setTmdbSearching] = useState(false);
  const [showTmdbDropdown, setShowTmdbDropdown] = useState(false);
  const [selectedTmdbMovie, setSelectedTmdbMovie] = useState(null);

  const handleOpenEditShowtime = (event, showtime) => {
    setEditingShowtime(showtime);
    setEditEventTitle(event.title);
    setEditDateTime(showtime.dateTime ? new Date(showtime.dateTime).toISOString() : '');
    setEditFormat(showtime.format || 'DOLBY ATMOS');
    setEditLanguage(showtime.language || 'ENGLISH');

    const matchedVenue = venues.find(
      (v) => v.id === showtime.venueId || v.id === event.venueId || v.name === showtime.venueName || v.name === event.venue?.name
    ) || venues[0];
    setEditVenue(matchedVenue);

    const initialPricing = { ...(showtime.pricing || {}) };
    if (matchedVenue?.categories) {
      matchedVenue.categories.forEach((cat) => {
        if (!initialPricing[cat.id]) {
          initialPricing[cat.id] = cat.name.includes('VIP') ? 650 : cat.name.includes('Prime') ? 350 : 250;
        }
      });
    }
    setEditPricingMap(initialPricing);
    setEditDynamicPricing(showtime.dynamicPricing !== false);
    setEditShowtimeModalOpen(true);
  };

  const handleSaveEditShowtime = async (e) => {
    e.preventDefault();
    if (!editingShowtime || !editDateTime) {
      toast.error('Please select a valid showtime date and time.');
      return;
    }

    setEditSaving(true);

    try {
      const res = await api.put(`/events/showtimes/${editingShowtime.showtimeId || editingShowtime.id}`, {
        dateTime: editDateTime,
        format: editFormat,
        language: editLanguage,
        pricing: editPricingMap,
        dynamicPricing: editDynamicPricing,
      });

      if (res.data?.notifiedCount > 0) {
        toast.success(`Showtime rescheduled! Apology emails sent to ${res.data.notifiedCount} ticket holder(s).`);
      } else {
        toast.success(res.data?.message || 'Showtime timing, formats & dynamic seat-view pricing updated successfully!');
      }
      setEditShowtimeModalOpen(false);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update showtime timing and pricing.');
    } finally {
      setEditSaving(false);
    }
  };

  const fetchData = async () => {
    try {
      const [metricsRes, venuesRes] = await Promise.all([
        api.get('/bookings/organiser/analytics'),
        api.get('/venues'),
      ]);
      setMetrics(metricsRes.data);
      setVenues(venuesRes.data.venues || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load organiser analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedVenue = venues.find((v) => v.id === venueId);

  const handleTitleChange = async (val) => {
    setTitle(val);
    if (!val || val.trim().length < 2) {
      setTmdbSuggestions([]);
      setShowTmdbDropdown(false);
      return;
    }

    setTmdbSearching(true);
    try {
      const res = await api.get(`/events/tmdb/search?query=${encodeURIComponent(val.trim())}`);
      const movies = res.data?.results || [];
      setTmdbSuggestions(movies.slice(0, 5));
      setShowTmdbDropdown(movies.length > 0);
    } catch (err) {
      console.error('TMDB Search error:', err);
    } finally {
      setTmdbSearching(false);
    }
  };

  const handleSelectTmdbMovie = async (movie) => {
    setTitle(movie.title);
    if (movie.overview) setDescription(movie.overview);
    if (movie.posterUrl) setImageUrl(movie.posterUrl);
    setShowTmdbDropdown(false);
    setTmdbSearching(true);

    try {
      const res = await api.get(`/events/tmdb/movie/${movie.id}`);
      const data = res.data;
      setSelectedTmdbMovie(data);
      if (data.description) setDescription(data.description);
      if (data.imageUrl) setImageUrl(data.imageUrl);
      setType('movie');
    } catch (err) {
      console.error('TMDB Movie detail error:', err);
    } finally {
      setTmdbSearching(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!venueId || !dateTime) {
      toast.error('Please select a venue and showtime date/time.');
      return;
    }

    setCreating(true);

    try {
      let targetEventId = selectedExistingEventId;

      // Auto-detect existing production by title if not manually selected
      if (!targetEventId && title) {
        const existingMatch = (metrics?.events || []).find(
          (ev) => ev.title?.toLowerCase().trim() === title?.toLowerCase().trim()
        );
        if (existingMatch) {
          targetEventId = existingMatch.id;
        }
      }

      if (!targetEventId) {
        // 1. Create New Event
        const eventPayload = {
          venueId,
          title,
          description: description || selectedTmdbMovie?.description,
          type,
          imageUrl: imageUrl || selectedTmdbMovie?.imageUrl || undefined,
          backdropUrl: selectedTmdbMovie?.backdropUrl,
          trailerUrl: selectedTmdbMovie?.trailerUrl,
          director: selectedTmdbMovie?.director,
          duration: selectedTmdbMovie?.duration,
          genre: selectedTmdbMovie?.genre,
          imdbRating: selectedTmdbMovie?.imdbRating,
          rating: selectedTmdbMovie?.rating,
          ageRating: selectedTmdbMovie?.ageRating,
          releaseDate: selectedTmdbMovie?.releaseDate,
          language: selectedTmdbMovie?.language,
          tagline: selectedTmdbMovie?.tagline,
          budget: selectedTmdbMovie?.budget,
          revenue: selectedTmdbMovie?.revenue,
          productionCompanies: selectedTmdbMovie?.productionCompanies,
          showCast,
          showReviews,
          cast: selectedTmdbMovie?.cast,
          reviews: selectedTmdbMovie?.reviews,
          similarMovies: selectedTmdbMovie?.similarMovies,
          autoEnrich: true,
        };

        const eventRes = await api.post('/events', eventPayload);
        targetEventId = eventRes.data.event.id;
      }

      // 2. Create Showtime with Pricing
      await api.post(`/events/${targetEventId}/showtimes`, {
        dateTime,
        pricing: pricingMap,
      });

      toast.success('Event listing and showtime schedule published successfully!');
      setTitle('');
      setDescription('');
      setImageUrl('');
      setDateTime('');
      setPricingMap({});
      setSelectedExistingEventId('');
      setCreationMode('new');
      setCreateModalOpen(false);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to publish event schedule.');
    } finally {
      setCreating(false);
    }
  };

  const eventsList = metrics?.events || [];
  const totalRevenue = metrics?.totalRevenue || 0;
  const totalTickets = metrics?.totalTicketsSold || 0;
  const totalEvents = metrics?.totalEvents || 0;
  const avgTicketPrice = totalTickets > 0 ? (totalRevenue / totalTickets).toFixed(2) : '0.00';
  const dailyTrend = metrics?.dailyTrend || [];
  const recentBookings = metrics?.recentBookings || [];

  // Filter recent bookings by search
  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return recentBookings;
    const q = searchQuery.toLowerCase();
    return recentBookings.filter(
      (b) =>
        b.customerName.toLowerCase().includes(q) ||
        b.eventTitle.toLowerCase().includes(q) ||
        b.bookingRef.toLowerCase().includes(q) ||
        b.venueName.toLowerCase().includes(q)
    );
  }, [recentBookings, searchQuery]);

  // Line Chart Curve Geometry Generator
  const chartData = useMemo(() => {
    if (dailyTrend.length === 0) return { pathD: '', areaD: '', points: [], maxVal: 100 };

    const maxVal = Math.max(...dailyTrend.map((d) => d.revenue), 100);
    const width = 700;
    const height = 220;
    const paddingX = 40;
    const paddingY = 30;

    const availableW = width - paddingX * 2;
    const availableH = height - paddingY * 2;

    const points = dailyTrend.map((d, i) => {
      const x = paddingX + (i / (dailyTrend.length - 1)) * availableW;
      const y = height - paddingY - (d.revenue / maxVal) * availableH;
      return { x, y, ...d };
    });

    // Generate smooth bezier curve path
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }

    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    const areaD = `${pathD} L ${lastPoint.x} ${height - paddingY} L ${firstPoint.x} ${height - paddingY} Z`;

    return { pathD, areaD, points, maxVal, width, height };
  }, [dailyTrend]);

  // Maximum event revenue for bar scaling
  const maxEventRevenue = Math.max(...eventsList.map((e) => e.totalRevenue || 0), 100);

  // Dropdown options
  const typeOptions = [
    { value: 'movie', label: 'Movie Screening (IMAX / Dolby)' },
    { value: 'concert', label: 'Live Concert & Festival' },
    { value: 'theatre', label: 'Theatre & Opera' },
    { value: 'festival', label: 'Music & Cultural Festival' },
  ];

  const venueOptions = venues.map((v) => ({
    value: v.id,
    label: `${v.name} (${v.totalRows * v.totalCols} Seats)`,
  }));

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-3 text-[#b3b3b3]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1ed760]" />
        <p className="text-sm font-bold">Loading organiser studio...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#121212] text-white font-sans">
      {/* ─── TOP BAR: TITLE, SEGMENTED TABS & CTA ─── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#1ed760] text-black font-black uppercase text-[10px] tracking-[1.4px] rounded-full shadow-md">
              Organiser Studio
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight">
            Production Management & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#b3b3b3]">
            Track real-time box office revenue, daily trends, capacity, and live ticket orders.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-6 py-3 bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-xs uppercase tracking-[1.4px] rounded-full shadow-2xl hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Create New Event</span>
        </button>
      </div>

      {/* ─── SEGMENTED NAVIGATION PILL BAR ─── */}
      <div className="flex items-center gap-2 bg-[#181818] p-1.5 rounded-full w-fit border border-[#282828] shadow-md">
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-[#1ed760] text-black font-black shadow-md'
              : 'text-[#b3b3b3] hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Event Revenue & Analytics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('productions')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'productions'
              ? 'bg-[#1ed760] text-black font-black shadow-md'
              : 'text-[#b3b3b3] hover:text-white'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Production & Showtime Performance ({eventsList.length})</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 1: EVENT REVENUE & ANALYTICS (With Animated Line Chart & 100+ Transactions)
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* KPI Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#181818] hover:bg-[#1f1f1f] transition-colors border border-[#282828] p-6 rounded-2xl shadow-2xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3]">
                  Total Gross Revenue
                </span>
                <p className="text-3xl font-black text-white font-mono">₹{totalRevenue.toLocaleString()}</p>
                <span className="text-[10px] text-[#1ed760] font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Live Gross
                </span>
              </div>
              <div className="text-[#1ed760] flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-10 h-10" />
              </div>
            </div>

            <div className="bg-[#181818] hover:bg-[#1f1f1f] transition-colors border border-[#282828] p-6 rounded-2xl shadow-2xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3]">
                  Tickets Sold
                </span>
                <p className="text-3xl font-black text-white font-mono">{totalTickets} Passes</p>
                <span className="text-[10px] text-[#b3b3b3]">Across 182+ transactions</span>
              </div>
              <div className="text-[#1ed760] flex items-center justify-center flex-shrink-0">
                <Ticket className="w-10 h-10" />
              </div>
            </div>

            <div className="bg-[#181818] hover:bg-[#1f1f1f] transition-colors border border-[#282828] p-6 rounded-2xl shadow-2xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3]">
                  Avg Ticket Price
                </span>
                <p className="text-3xl font-black text-white font-mono">₹{avgTicketPrice}</p>
                <span className="text-[10px] text-[#b3b3b3]">Weighted across all tiers</span>
              </div>
              <div className="text-[#1ed760] flex items-center justify-center flex-shrink-0">
                <Percent className="w-10 h-10" />
              </div>
            </div>

            <div className="bg-[#181818] hover:bg-[#1f1f1f] transition-colors border border-[#282828] p-6 rounded-2xl shadow-2xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3]">
                  Active Productions
                </span>
                <p className="text-3xl font-black text-white font-mono">{totalEvents}</p>
                <span className="text-[10px] text-[#b3b3b3]">In current catalogue</span>
              </div>
              <div className="text-[#1ed760] flex items-center justify-center flex-shrink-0">
                <Film className="w-10 h-10" />
              </div>
            </div>
          </div>

          {/* ─── 1. ANIMATED DAILY REVENUE TREND LINE & AREA CHART ─── */}
          <div className="bg-[#181818] border border-[#282828] p-6 sm:p-8 rounded-2xl shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
              <div>
                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#1ed760]" />
                  <span>Daily Revenue Trend (7-Day Area Chart)</span>
                </h3>
                <p className="text-xs text-[#b3b3b3]">
                  Interactive spline curve showing daily box office collections & ticket spikes
                </p>
              </div>

              {hoveredPoint ? (
                <div className="flex items-center gap-3 px-4 py-1.5 bg-[#121212] rounded-full border border-[#1ed760]/40 animate-in fade-in">
                  <span className="text-xs font-bold text-white">{hoveredPoint.dayName} ({hoveredPoint.date}):</span>
                  <span className="text-sm font-black text-[#1ed760] font-mono">₹{hoveredPoint.revenue.toLocaleString()}</span>
                  <span className="text-xs text-[#b3b3b3]">({hoveredPoint.tickets} tickets)</span>
                </div>
              ) : (
                <span className="text-xs font-mono font-bold text-[#1ed760]">
                  Hover over points for daily stats
                </span>
              )}
            </div>

            {/* SVG Animated Spline Area Chart */}
            <div className="relative w-full overflow-hidden select-none">
              <svg
                viewBox={`0 0 ${chartData.width} ${chartData.height}`}
                className="w-full h-56 overflow-visible"
              >
                <defs>
                  {/* Glowing Green Gradient Area */}
                  <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1ed760" stopOpacity="0.4" />
                    <stop offset="60%" stopColor="#1ed760" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#1ed760" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Horizontal Grid lines filter */}
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Horizontal Grid Lines */}
                {[0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = chartData.height - 30 - ratio * (chartData.height - 60);
                  const labelVal = Math.round(chartData.maxVal * ratio);
                  return (
                    <g key={i}>
                      <line
                        x1="30"
                        y1={y}
                        x2={chartData.width - 30}
                        y2={y}
                        stroke="#252525"
                        strokeDasharray="4 4"
                      />
                      <text
                        x="20"
                        y={y + 4}
                        fill="#555555"
                        fontSize="9"
                        textAnchor="end"
                        fontFamily="monospace"
                      >
                        ₹{labelVal}
                      </text>
                    </g>
                  );
                })}

                {/* Filled Spline Area with Animated Gradient */}
                {chartData.areaD && (
                  <path
                    d={chartData.areaD}
                    fill="url(#chartAreaGrad)"
                    className="transition-all duration-700"
                  />
                )}

                {/* Spline Stroke Line */}
                {chartData.pathD && (
                  <path
                    d={chartData.pathD}
                    fill="none"
                    stroke="#1ed760"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                )}

                {/* Data Points with Interactive Hover */}
                {chartData.points.map((pt, i) => {
                  const isHovered = hoveredPoint?.date === pt.date;

                  return (
                    <g
                      key={i}
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      {/* Vertical Guideline on Hover */}
                      {isHovered && (
                        <line
                          x1={pt.x}
                          y1={chartData.height - 30}
                          x2={pt.x}
                          y2={pt.y}
                          stroke="#1ed760"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />
                      )}

                      {/* Outer Glow Circle */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 8 : 5}
                        fill="#121212"
                        stroke="#1ed760"
                        strokeWidth={isHovered ? '3.5' : '2'}
                        className="transition-all duration-200"
                      />

                      {/* Day Label at Bottom */}
                      <text
                        x={pt.x}
                        y={chartData.height - 10}
                        fill={isHovered ? '#1ed760' : '#888888'}
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="transition-colors"
                      >
                        {pt.dayName}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* ─── 2. PRODUCTION PERFORMANCE & DONUT DISTRIBUTION ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart: Revenue per Production (Interactive Bars) */}
            <div className="lg:col-span-2 bg-[#181818] border border-[#282828] p-6 rounded-2xl shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#1ed760]" />
                    <span>Revenue per Production (₹ INR)</span>
                  </h3>
                  <p className="text-xs text-[#b3b3b3]">
                    Interactive real-time box office breakdown
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-[#1ed760]">
                  Total: ₹{totalRevenue.toLocaleString()}
                </span>
              </div>

              {/* Chart Visualizer */}
              <div className="space-y-4 pt-2">
                {eventsList.map((event, idx) => {
                  const percent = maxEventRevenue > 0 ? (event.totalRevenue / maxEventRevenue) * 100 : 0;
                  const isHovered = hoveredBarIndex === idx;

                  return (
                    <div
                      key={event.eventId || idx}
                      onMouseEnter={() => setHoveredBarIndex(idx)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                      className={`p-3.5 rounded-xl transition-all cursor-pointer ${
                        isHovered ? 'bg-[#222222] scale-[1.01]' : 'bg-[#121212]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-2">
                        <div className="flex items-center gap-2 max-w-[70%]">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#1ed760]" />
                          <span className="font-bold text-white truncate">{event.title}</span>
                          <span className="text-[10px] text-[#7c7c7c]">({event.type})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[#b3b3b3]">{event.totalTicketsSold} tickets</span>
                          <span className="font-mono font-black text-white text-sm">
                            ₹{event.totalRevenue.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Interactive Bar */}
                      <div className="w-full h-3 bg-[#1e1e1e] rounded-full overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isHovered
                              ? 'bg-[#1fdf64] shadow-lg shadow-[#1ed760]/30'
                              : 'bg-[#1ed760]'
                          }`}
                          style={{ width: `${Math.max(percent, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart: Ticket Sales Share (Donut Gauge) */}
            <div className="bg-[#181818] border border-[#282828] p-6 rounded-2xl shadow-2xl space-y-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-[#38bdf8]" />
                    <span>Ticket Distribution</span>
                  </h3>
                </div>

                <div className="py-6 flex flex-col items-center justify-center space-y-4">
                  {/* Circular visual gauge */}
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <path
                        className="text-[#252525]"
                        strokeWidth="3.8"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-[#1ed760]"
                        strokeDasharray={`${totalTickets > 0 ? 100 : 0}, 100`}
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-white font-mono">{totalTickets}</span>
                      <span className="text-[10px] text-[#b3b3b3] uppercase">Passes</span>
                    </div>
                  </div>

                  <div className="w-full space-y-2 pt-2">
                    {eventsList.map((event, idx) => {
                      const share = totalTickets > 0 ? Math.round((event.totalTicketsSold / totalTickets) * 100) : 0;
                      return (
                        <div key={idx} className="flex items-center justify-between text-xs py-1">
                          <span className="text-[#b3b3b3] truncate max-w-[140px]">{event.title}</span>
                          <span className="font-mono font-bold text-white">{share}% ({event.totalTicketsSold})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── 3. RECENT CUSTOMER BOOKING TRANSACTIONS LEDGER (100+ Rows) ─── */}
          <div className="bg-[#181818] border border-[#282828] p-6 rounded-2xl shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-[#1ed760]" />
                  <span>Recent Customer Orders & Ticket Ledger</span>
                </h3>
                <p className="text-xs text-[#b3b3b3]">
                  Showing real-time transactions recorded across all productions ({filteredBookings.length} orders)
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Filter customer, ref, movie..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#121212] border border-[#383838] focus:border-[#1ed760] text-xs text-white px-3.5 py-2 pl-9 rounded-full focus:outline-none placeholder:text-[#555555]"
                />
                <Search className="w-4 h-4 text-[#7c7c7c] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-[#282828] text-[#7c7c7c] uppercase text-[10px] tracking-wider font-bold">
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Production</th>
                    <th className="py-3 px-4">Venue</th>
                    <th className="py-3 px-4">Seats</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredBookings.slice(0, 50).map((b) => (
                    <tr key={b.id} className="hover:bg-[#1f1f1f] transition-colors">
                      {/* Ref */}
                      <td className="py-3 px-4 font-mono font-bold text-[#1ed760]">
                        {b.bookingRef}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{b.customerName}</div>
                        <div className="text-[10px] text-[#7c7c7c]">{b.customerEmail}</div>
                      </td>

                      {/* Production */}
                      <td className="py-3 px-4 font-medium text-white max-w-[200px] truncate">
                        {b.eventTitle}
                      </td>

                      {/* Venue */}
                      <td className="py-3 px-4 text-[#b3b3b3] max-w-[160px] truncate">
                        {b.venueName}
                      </td>

                      {/* Seats */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-[#121212] border border-white/5 text-[11px] font-mono text-white">
                          {b.seats.length > 0 ? b.seats.join(', ') : `${b.seatCount} Seats`}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-4 text-right font-mono font-black text-white">
                        ₹{b.totalAmount}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-right">
                        <span className="px-2 py-0.5 rounded-full bg-[#1ed760]/20 text-[#1ed760] font-bold text-[10px] uppercase">
                          Confirmed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 2: PRODUCTION & SHOWTIME PERFORMANCE
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'productions' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Catalogue & Scheduled Showtimes
            </h2>
            <span className="text-xs text-[#b3b3b3] font-bold">
              {eventsList.length} Listed Productions
            </span>
          </div>

          {eventsList.length === 0 ? (
            <div className="py-16 px-6 bg-[#181818] border border-[#282828] rounded-2xl text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#222222] flex items-center justify-center text-[#1ed760] shadow-inner">
                <Film className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No Productions Listed Yet</h3>
                <p className="text-xs text-[#b3b3b3] max-w-sm">
                  Create your first movie screening, live concert, or theatre event to assign showtimes and start selling tickets.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="px-5 py-2.5 bg-[#1ed760] hover:bg-[#1db954] text-black font-bold text-xs rounded-full flex items-center gap-2 cursor-pointer transition-all shadow-lg hover:scale-105"
              >
                <Plus className="w-4 h-4" /> Create First Production
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {eventsList.map((ev) => (
              <div
                key={ev.eventId || ev.id}
                className="bg-[#181818] hover:bg-[#1c1c1c] transition-colors border border-[#282828] p-6 rounded-2xl shadow-2xl space-y-4"
              >
                {/* Event Header with Poster & Metadata */}
                <div className="flex items-start gap-4 pb-4 border-b border-white/5">
                  {ev.imageUrl ? (
                    <img
                      src={ev.imageUrl}
                      alt={ev.title}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=780&q=80';
                      }}
                      className="w-16 h-22 rounded-xl object-cover border border-white/10 flex-shrink-0 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-22 rounded-xl bg-[#252525] border border-white/10 flex items-center justify-center flex-shrink-0">
                      <Film className="w-6 h-6 text-[#7c7c7c]" />
                    </div>
                  )}

                  <div className="space-y-1 flex-1 overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 bg-[#1ed760] text-black font-black uppercase text-[9px] tracking-wider rounded">
                        {ev.type}
                      </span>
                      {ev.ageRating && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-400 text-black rounded font-mono">
                          {ev.ageRating}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white tracking-tight truncate mt-1">
                      {ev.title}
                    </h3>

                    <p className="text-xs text-[#b3b3b3] flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#1ed760] flex-shrink-0" />
                      <span>{ev.venueName || 'Multi-Theatre'}</span>
                    </p>

                    <div className="flex items-center gap-4 text-xs font-bold pt-1">
                      <span className="text-[#1ed760]">₹{ev.totalRevenue.toLocaleString()} Gross</span>
                      <span className="text-[#7c7c7c]">&bull;</span>
                      <span className="text-white">{ev.totalTicketsSold} Tickets</span>
                      {ev.totalWaitlist > 0 && (
                        <>
                          <span className="text-[#7c7c7c]">&bull;</span>
                          <span className="text-[#ffa42b]">{ev.totalWaitlist} on Waitlist</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Showtimes Sub-List */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7c7c7c] block">
                    Scheduled Sessions ({ev.showtimes?.length || 0})
                  </span>

                  {ev.showtimes?.map((st) => {
                    const dt = new Date(st.dateTime);
                    const dateStr = dt.toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={st.showtimeId || st.id}
                        className="p-3.5 rounded-xl bg-[#141414] border border-white/5 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white block">
                              {dateStr}
                            </span>
                            <span className="text-[11px] text-[#b3b3b3]">
                              {st.venueName} &bull; {st.format || 'DOLBY ATMOS'}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-black text-[#1ed760] block text-sm">
                              ₹{st.revenue.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-[#b3b3b3]">
                              {st.ticketsSold} / {st.totalSeats} seats ({st.capacityPercent}%)
                            </span>
                          </div>
                        </div>

                        {/* Capacity Bar */}
                        <div className="w-full h-1.5 bg-[#222222] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1ed760] rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(st.capacityPercent || 0, 100)}%` }}
                          />
                        </div>

                        {/* Edit Timing Action */}
                        <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
                          <span className="text-[#7c7c7c]">Screen: {st.screen || 'AUDI 1'}</span>
                          <button
                            type="button"
                            onClick={() => handleOpenEditShowtime(ev, st)}
                            className="flex items-center gap-1.5 text-[#b3b3b3] hover:text-[#1ed760] font-bold transition-colors cursor-pointer px-2.5 py-1 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] border border-white/5"
                          >
                            <Edit3 className="w-3 h-3 text-[#1ed760]" />
                            <span>Edit Timing</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

      {/* ─── WIDE HORIZONTAL CREATE EVENT MODAL ─── */}
      <Modal
        isOpen={createModalOpen}
        onOpenChange={setCreateModalOpen}
        backdrop="blur"
        size="5xl"
        className="bg-[#181818] border border-[#282828] text-white rounded-2xl shadow-2xl max-w-5xl w-[94vw] !overflow-visible my-auto"
      >
        <ModalContent className="!overflow-visible">
          {(onClose) => (
            <>
              <ModalHeader className="border-b border-[#282828] py-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-black text-white">
                    Create New Event Listing
                  </h3>
                  <p className="text-xs text-[#b3b3b3]">
                    Assign theatre venue, showtime schedule, and category pricing
                  </p>
                </div>

                {/* Mode Switcher in Header for Horizontal Compactness */}
                <div className="flex items-center gap-1.5 bg-[#121212] p-1 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setCreationMode('new');
                      setSelectedExistingEventId('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      creationMode === 'new'
                        ? 'bg-[#1ed760] text-black font-black shadow-sm'
                        : 'text-[#b3b3b3] hover:text-white'
                    }`}
                  >
                    New Production
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreationMode('existing');
                      if (eventsList.length > 0 && !selectedExistingEventId) {
                        const firstEv = eventsList[0];
                        setSelectedExistingEventId(firstEv.id);
                        setTitle(firstEv.title);
                        setImageUrl(firstEv.imageUrl || '');
                        setType(firstEv.type || 'movie');
                        setDescription(firstEv.description || '');
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      creationMode === 'existing'
                        ? 'bg-[#1ed760] text-black font-black shadow-sm'
                        : 'text-[#b3b3b3] hover:text-white'
                    }`}
                  >
                    Add Showtime to Existing ({eventsList.length})
                  </button>
                </div>
                            </ModalHeader>

              <ModalBody className="py-4 px-6 text-xs font-sans !overflow-visible">
                <form id="createEventForm" onSubmit={handleCreateEvent} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Left Column: Event Metadata & Custom Selects */}
                    <div className="space-y-3.5">
                      {creationMode === 'existing' ? (
                        <Select
                          label="Select Existing Production"
                          options={eventsList.map((e) => ({
                            value: e.id,
                            label: e.title,
                          }))}
                          value={selectedExistingEventId}
                          onChange={(val) => {
                            setSelectedExistingEventId(val);
                            const ev = eventsList.find((e) => e.id === val);
                            if (ev) {
                              setTitle(ev.title);
                              setImageUrl(ev.imageUrl || '');
                              setType(ev.type || 'movie');
                              setDescription(ev.description || '');
                            }
                          }}
                          placeholder="-- Choose Existing Movie --"
                        />
                      ) : (
                        <>
                          {/* Title with Live TMDB Autocomplete Dropdown */}
                          <div className="space-y-1.5 relative">
                            <div className="flex items-center justify-between">
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3]">
                                Event / Movie Title
                              </label>
                              {tmdbSearching && (
                                <span className="flex items-center gap-1 text-[10px] text-[#1ed760] font-mono font-bold">
                                  <Loader2 className="w-3 h-3 animate-spin text-[#1ed760]" />
                                  <span>Searching...</span>
                                </span>
                              )}
                            </div>
                            <input
                              type="text"
                              required
                              placeholder="Search movie title (e.g. Inception, Kalki, Batman)..."
                              value={title}
                              onChange={(e) => handleTitleChange(e.target.value)}
                              onFocus={() => {
                                if (tmdbSuggestions.length > 0) setShowTmdbDropdown(true);
                              }}
                              className="w-full bg-[#121212] border border-[#383838] hover:border-white focus:border-white text-white text-xs px-4 py-3 rounded-xl focus:outline-none placeholder:text-[#555555] transition-all"
                            />

                            {/* Live Autocomplete Dropdown (Attached directly below) */}
                            {showTmdbDropdown && tmdbSuggestions.length > 0 && (
                              <div className="absolute top-full left-0 right-0 z-[100] mt-0.5 max-h-60 overflow-y-auto bg-[#1f1f1f] border border-[#383838] rounded-xl shadow-2xl p-1.5 space-y-1 scrollbar-none">
                                {tmdbSuggestions.map((m) => (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => handleSelectTmdbMovie(m)}
                                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors text-left group cursor-pointer"
                                  >
                                    <div className="w-8 h-12 rounded overflow-hidden bg-[#121212] flex-shrink-0 border border-white/10">
                                      {m.posterUrl ? (
                                        <img src={m.posterUrl} alt={m.title} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[8px] text-[#7c7c7c]">No Img</div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h5 className="text-xs font-bold text-white group-hover:text-[#1ed760] truncate">
                                        {m.title}
                                      </h5>
                                      <div className="flex items-center gap-2 text-[10px] text-[#b3b3b3] mt-0.5">
                                        {m.releaseYear && <span>{m.releaseYear}</span>}
                                        {m.voteAverage && (
                                          <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                                            <StarRoundedIcon className="w-2.5 h-2.5 fill-amber-400" />
                                            {m.voteAverage}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Poster Image URL */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3]">
                              Poster Image URL (Optional)
                            </label>
                            <input
                              type="url"
                              placeholder="https://images.unsplash.com/... or https://image.tmdb.org/..."
                              value={imageUrl}
                              onChange={(e) => setImageUrl(e.target.value)}
                              className="w-full bg-[#121212] border border-[#383838] hover:border-white focus:border-white text-white text-xs px-4 py-3 rounded-xl focus:outline-none placeholder:text-[#555555] transition-all"
                            />
                          </div>

                          {/* Custom Select for Production Type */}
                          <Select
                            label="Production Type"
                            options={typeOptions}
                            value={type}
                            onChange={setType}
                          />
                        </>
                      )}

                      {/* Custom Select for Venue */}
                      <Select
                        label="Theatre / Venue"
                        options={venueOptions}
                        value={venueId}
                        onChange={setVenueId}
                        placeholder="-- Select Venue --"
                      />

                      {/* Display Options: Cast & Reviews Toggles */}
                      <div className="pt-2 border-t border-white/5 space-y-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3]">
                          Experience Display Options
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2.5">
                          <label className="flex items-center gap-2 bg-[#121212] hover:bg-[#1a1a1a] p-2.5 rounded-xl border border-white/5 cursor-pointer flex-1 transition-colors">
                            <input
                              type="checkbox"
                              checked={showCast}
                              onChange={(e) => setShowCast(e.target.checked)}
                              className="w-4 h-4 rounded text-[#1ed760] focus:ring-[#1ed760] accent-[#1ed760] cursor-pointer"
                            />
                            <span className="text-xs font-bold text-white">Show Cast & Actors</span>
                          </label>
                          <label className="flex items-center gap-2 bg-[#121212] hover:bg-[#1a1a1a] p-2.5 rounded-xl border border-white/5 cursor-pointer flex-1 transition-colors">
                            <input
                              type="checkbox"
                              checked={showReviews}
                              onChange={(e) => setShowReviews(e.target.checked)}
                              className="w-4 h-4 rounded text-[#1ed760] focus:ring-[#1ed760] accent-[#1ed760] cursor-pointer"
                            />
                            <span className="text-xs font-bold text-white">Show Reviews</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Schedule & Pricing Matrix */}
                    <div className="space-y-4">
                      {/* Custom Showtime Date & Time Picker */}
                      <DateTimePicker
                        label="Showtime Date & Time"
                        required
                        value={dateTime}
                        onChange={setDateTime}
                      />

                      {/* Category Pricing Matrix */}
                      <div className="space-y-2 pt-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1ed760]">
                          Seat Category Pricing (₹ INR)
                        </label>
                        {selectedVenue ? (
                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {selectedVenue.categories?.map((cat) => (
                              <div
                                key={cat.id}
                                className="flex items-center justify-between bg-[#121212] p-3 rounded-xl border border-white/5"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className="w-3 h-3 rounded-full shadow-sm"
                                    style={{ backgroundColor: cat.color }}
                                  />
                                  <div>
                                    <span className="text-xs font-bold text-white block">{cat.name}</span>
                                    <span className="text-[10px] text-[#7c7c7c]">
                                      Rows {cat.rowStart} - {cat.rowEnd}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-[#b3b3b3] font-bold">₹</span>
                                  <input
                                    type="number"
                                    min="1"
                                    required
                                    placeholder="Price"
                                    value={pricingMap[cat.id] || ''}
                                    onChange={(e) =>
                                      setPricingMap({ ...pricingMap, [cat.id]: Number(e.target.value) })
                                    }
                                    className="w-20 bg-[#181818] border border-[#383838] focus:border-[#1ed760] px-3 py-1.5 rounded-lg text-xs text-white font-mono text-right focus:outline-none"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 bg-[#121212] rounded-xl border border-white/5 text-center text-[#7c7c7c]">
                            Select a venue to configure tier pricing.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </ModalBody>

              <ModalFooter className="border-t border-[#282828] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-xs text-[#b3b3b3] hover:text-white font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="createEventForm"
                  disabled={creating}
                  className="px-6 py-2.5 bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-xs uppercase tracking-[1.4px] rounded-full hover:scale-105 transition-transform cursor-pointer shadow-2xl disabled:opacity-50"
                >
                  {creating ? 'Publishing...' : 'Publish Listing'}
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

            {/* ─── EDIT SHOWTIME TIMING & DYNAMIC PRICING MODAL ─── */}
      <Modal
        isOpen={editShowtimeModalOpen}
        onOpenChange={setEditShowtimeModalOpen}
        backdrop="blur"
        size="3xl"
        className="bg-[#181818] border border-[#282828] text-white rounded-2xl shadow-2xl max-w-3xl w-[94vw] !overflow-visible my-auto max-h-[90vh] overflow-y-auto"
      >
        <ModalContent className="!overflow-visible">
          {(onClose) => {
            const catPrices = Object.values(editPricingMap).map(Number).filter(Boolean);
            const lowestBasePrice = catPrices.length > 0 ? Math.min(...catPrices) : 250;
            const sweetSpotPrice = Math.round((lowestBasePrice * 1.20) / 10) * 10;

            return (
              <>
                <ModalHeader className="border-b border-[#282828] py-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-lg font-black text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#1ed760]" />
                      <span>Edit Session Timing, Format & Dynamic Pricing</span>
                    </h3>
                    <p className="text-xs text-[#1ed760] font-bold mt-0.5">
                      {editEventTitle} &bull; {editingShowtime?.venueName || editVenue?.name}
                    </p>
                  </div>
                </ModalHeader>

                <ModalBody className="py-6 px-6 sm:px-8 space-y-6 !overflow-visible">
                  <form id="editShowtimeForm" onSubmit={handleSaveEditShowtime} className="space-y-6">
                    {/* Top Group: DateTime, Format, Language */}
                    <div className="space-y-4">
                      <DateTimePicker
                        label="Showtime Date & Starting Time"
                        required
                        value={editDateTime}
                        onChange={setEditDateTime}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-30">
                        <Select
                          label="Projection / Audio Format"
                          value={editFormat}
                          onChange={setEditFormat}
                          options={[
                            { value: 'DOLBY ATMOS', label: 'DOLBY ATMOS' },
                            { value: 'IMAX 70MM', label: 'IMAX 70MM' },
                            { value: 'IMAX 3D', label: 'IMAX 3D' },
                            { value: '3D 4K', label: '3D 4K LASER' },
                            { value: '360° IN-THE-ROUND', label: '360° IN-THE-ROUND' },
                            { value: 'STANDARD 2D', label: 'STANDARD 2D' },
                          ]}
                        />

                        <Select
                          label="Screening Language"
                          value={editLanguage}
                          onChange={setEditLanguage}
                          options={[
                            { value: 'ENGLISH', label: 'ENGLISH' },
                            { value: 'HINDI', label: 'HINDI' },
                            { value: 'TAMIL', label: 'TAMIL' },
                            { value: 'TELUGU', label: 'TELUGU' },
                            { value: 'DUAL AUDIO (EN/HI)', label: 'DUAL AUDIO (EN/HI)' },
                          ]}
                        />
                      </div>
                    </div>

                    {/* Dynamic Pricing & Category Base Rates Container */}
                    <div className="bg-[#121212] p-5 rounded-2xl border border-white/10 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#1ed760]" />
                            <h4 className="text-sm font-black text-white uppercase tracking-wider">
                              Dynamic Seat-View Pricing Engine
                            </h4>
                          </div>
                          <p className="text-[11px] text-[#b3b3b3]">
                            Seats facing the central screen & acoustic sweet-spot automatically compute higher prime sightline rates.
                          </p>
                        </div>

                        {/* Toggle Checkbox */}
                        <label className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#242424] px-3.5 py-2 rounded-xl border border-white/10 cursor-pointer transition-colors flex-shrink-0 self-start sm:self-auto">
                          <input
                            type="checkbox"
                            checked={editDynamicPricing}
                            onChange={(e) => setEditDynamicPricing(e.target.checked)}
                            className="w-4 h-4 rounded text-[#1ed760] focus:ring-[#1ed760] accent-[#1ed760] cursor-pointer"
                          />
                          <span className="text-xs font-bold text-white">Dynamic Center Boost</span>
                        </label>
                      </div>

                      {/* Category Base Pricing Matrix */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1ed760]">
                          Category Base Rates (₹ INR)
                        </label>
                        {editVenue?.categories && editVenue.categories.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {editVenue.categories.map((cat) => (
                              <div
                                key={cat.id}
                                className="flex items-center justify-between bg-[#181818] p-3 rounded-xl border border-white/5"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className="w-3 h-3 rounded-full shadow-sm flex-shrink-0"
                                    style={{ backgroundColor: cat.color }}
                                  />
                                  <div className="min-w-0">
                                    <span className="text-xs font-bold text-white block truncate">{cat.name}</span>
                                    <span className="text-[10px] text-[#7c7c7c]">
                                      Rows {cat.rowStart} - {cat.rowEnd}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                  <span className="text-xs text-[#b3b3b3] font-bold">₹</span>
                                  <input
                                    type="number"
                                    min="1"
                                    required
                                    placeholder="Price"
                                    value={editPricingMap[cat.id] || ''}
                                    onChange={(e) =>
                                      setEditPricingMap({ ...editPricingMap, [cat.id]: Number(e.target.value) })
                                    }
                                    className="w-20 bg-[#121212] border border-[#383838] focus:border-[#1ed760] px-2.5 py-1.5 rounded-lg text-xs text-white font-mono text-right focus:outline-none"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-[#181818] rounded-xl text-xs text-[#7c7c7c]">
                            Loading venue seat tier definitions...
                          </div>
                        )}
                      </div>

                      {/* Auto-Calculated Dynamic Seat-View Heatmap & Breakdown */}
                      {editDynamicPricing ? (
                        <div className="pt-3 border-t border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3] flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5 text-[#1ed760]" />
                              <span>Live Dynamic View Yield Preview</span>
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1ed760]/20 text-[#1ed760] font-bold border border-[#1ed760]/30">
                              +20% Center Sweet-Spot
                            </span>
                          </div>

                          {/* Calculated Stat Pills */}
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-[#181818] p-2.5 rounded-xl border border-white/5">
                              <span className="text-[10px] text-[#7c7c7c] block font-bold uppercase">Side / Corner Seats</span>
                              <span className="text-sm font-mono font-black text-white">₹{lowestBasePrice}</span>
                              <span className="text-[9px] text-[#7c7c7c] block">Base Rate (1.0x)</span>
                            </div>
                            <div className="bg-[#181818] p-2.5 rounded-xl border border-white/5">
                              <span className="text-[10px] text-[#b3b3b3] block font-bold uppercase">Mid-Hall Rows</span>
                              <span className="text-sm font-mono font-black text-[#38bdf8]">
                                ₹{Math.round((lowestBasePrice * 1.10) / 10) * 10}
                              </span>
                              <span className="text-[9px] text-[#38bdf8] block">+10% Sightline</span>
                            </div>
                            <div className="bg-[#181818] p-2.5 rounded-xl border border-[#1ed760]/30 shadow-[0_0_12px_rgba(30,215,96,0.15)]">
                              <span className="text-[10px] text-[#1ed760] block font-bold uppercase">Center Sweet-Spot</span>
                              <span className="text-sm font-mono font-black text-[#1ed760]">₹{sweetSpotPrice}</span>
                              <span className="text-[9px] text-[#1ed760] block">+20% Prime Center</span>
                            </div>
                          </div>

                          {/* Mini Visual Seat Grid Preview */}
                          <div className="p-3 bg-[#181818] rounded-xl border border-white/5 space-y-2">
                            <div className="w-full text-center py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-[#7c7c7c] tracking-widest uppercase">
                              ━━━━━ THEATRE 4K LASER SCREEN ━━━━━
                            </div>
                            <div className="flex justify-center gap-1 sm:gap-1.5 py-1">
                              {[
                                { label: 'Edge L', price: lowestBasePrice, isCenter: false },
                                { label: 'Mid L', price: Math.round((lowestBasePrice * 1.1) / 10) * 10, isCenter: false },
                                { label: 'Center', price: sweetSpotPrice, isCenter: true },
                                { label: 'Center', price: sweetSpotPrice, isCenter: true },
                                { label: 'Mid R', price: Math.round((lowestBasePrice * 1.1) / 10) * 10, isCenter: false },
                                { label: 'Edge R', price: lowestBasePrice, isCenter: false },
                              ].map((s, idx) => (
                                <div
                                  key={idx}
                                  className={`flex flex-col items-center justify-center px-2 py-1.5 rounded-lg text-center transition-all ${
                                    s.isCenter
                                      ? 'bg-[#1ed760] text-black font-black shadow-[0_0_10px_rgba(30,215,96,0.4)] scale-105'
                                      : 'bg-[#222222] text-[#b3b3b3]'
                                  }`}
                                >
                                  <span className="text-[8px] sm:text-[9px] uppercase leading-tight font-bold">{s.label}</span>
                                  <span className="text-[10px] sm:text-[11px] font-mono font-black">₹{s.price}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-[#7c7c7c] px-1">
                              <span>⬅ Standard Wing Seats (₹{lowestBasePrice})</span>
                              <span className="text-[#1ed760] font-bold">Center Sound & IMAX Sweet-Spot (₹{sweetSpotPrice})</span>
                              <span>Standard Wing Seats (₹{lowestBasePrice}) ➡</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-[#181818] rounded-xl border border-white/5 text-center text-xs text-[#7c7c7c]">
                          Dynamic view sweet-spot pricing is disabled. All seats within a tier will share the same flat base rate.
                        </div>
                      )}
                    </div>
                  </form>
                </ModalBody>

                <ModalFooter className="border-t border-[#282828] flex items-center justify-end gap-3 py-4 px-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 text-xs text-[#b3b3b3] hover:text-white font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="editShowtimeForm"
                    disabled={editSaving}
                    className="px-6 py-2.5 bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-xs uppercase tracking-[1.4px] rounded-full hover:scale-105 transition-transform cursor-pointer shadow-2xl disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {editSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <span>Save Timing & Pricing</span>
                    )}
                  </button>
                </ModalFooter>
              </>
            );
          }}
        </ModalContent>
      </Modal>
    </div>
  );
}
