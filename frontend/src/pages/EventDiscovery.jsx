import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';
import api from '../api/client';
import CalendarPicker from '../components/CalendarPicker';
import {
  Search,
  Calendar,
  MapPin,
  Clock,
  Ticket,
  Loader2,
  ArrowRight,
  Play,
  Star,
  Film,
  Sparkles,
  SlidersHorizontal,
  Globe2,
  TrendingUp,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
} from 'lucide-react';
import {
  TicketRoundedIcon,
  FireRoundedIcon,
  StarRoundedIcon,
  ClockRoundedIcon,
  CalendarRoundedIcon,
  MapPinRoundedIcon,
  PlayRoundedIcon,
  FilterRoundedIcon,
  SearchRoundedIcon,
} from '../components/CustomRoundedIcons';

export default function EventDiscovery() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Live TMDB Trending State
  const [tmdbTrending, setTmdbTrending] = useState([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [tmdbTab, setTmdbTab] = useState('all'); // 'all' | 'bollywood' | 'hollywood'

  // Live Ticketmaster Shows State
  const [liveTabType, setLiveTabType] = useState('movies'); // 'movies' | 'concerts'
  const [tmShows, setTmShows] = useState([]);
  const [tmShowsLoading, setTmShowsLoading] = useState(false);
  const [tmCategory, setTmCategory] = useState('music'); // 'music' | 'arts' | 'all'
  const [bookingShowId, setBookingShowId] = useState(null);

  // Filter States
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'movie' | 'concert'
  const [selectedIndustry, setSelectedIndustry] = useState('all'); // 'all' | 'bollywood' | 'hollywood'
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedSort, setSelectedSort] = useState('popular'); // 'popular' | 'rating' | 'release'
  const [selectedDate, setSelectedDate] = useState('');
  
  // Filter Modal
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // Temporary filter states for inside the modal
  const [tempIndustry, setTempIndustry] = useState('all');
  const [tempGenre, setTempGenre] = useState('all');
  const [tempSort, setTempSort] = useState('popular');

  // Carousel & Modal
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [activeTrailerUrl, setActiveTrailerUrl] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('search') || '';

  // Fetch Scheduled Cinema Experiences from DB
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedType !== 'all') params.type = selectedType;
      if (selectedIndustry !== 'all') params.industry = selectedIndustry;
      if (selectedGenre !== 'all') params.genre = selectedGenre;
      if (selectedSort !== 'popular') params.sort = selectedSort;
      if (searchQuery) params.search = searchQuery;
      if (selectedDate) params.date = selectedDate;

      const res = await api.get('/events', { params });
      setEvents(res.data.events || []);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Live Trending from TMDB API
  const fetchTmdbTrending = async (industry = 'all') => {
    setTmdbLoading(true);
    try {
      const res = await api.get('/events/tmdb/discover', {
        params: { industry, sortBy: 'popularity.desc' },
      });
      setTmdbTrending(res.data.results?.slice(0, 10) || []);
    } catch (err) {
      console.warn('TMDB Trending fetch notice:', err.message);
    } finally {
      setTmdbLoading(false);
    }
  };

  // Fetch Live Concerts & Shows from Ticketmaster API
  const fetchTicketmasterShows = async (cat = 'music') => {
    setTmShowsLoading(true);
    try {
      const res = await api.get('/events/ticketmaster/discover', {
        params: { classificationName: cat, size: 10 },
      });
      setTmShows(res.data.events || []);
    } catch (err) {
      console.warn('Ticketmaster shows fetch notice:', err.message);
    } finally {
      setTmShowsLoading(false);
    }
  };

  const [bookingMovieId, setBookingMovieId] = useState(null);

  const handleBookMovie = async (movie) => {
    const matchedEvent = events.find(
      (e) =>
        e.title.toLowerCase().includes(movie.title.toLowerCase()) ||
        movie.title.toLowerCase().includes(e.title.toLowerCase().replace(/[:—–-].*$/i, '').trim())
    );

    if (matchedEvent) {
      navigate(`/event/${matchedEvent.id}`);
      return;
    }

    try {
      setBookingMovieId(movie.id);
      const res = await api.post('/events/tmdb/sync-and-book', movie);
      if (res.data.eventId) {
        navigate(`/event/${res.data.eventId}`);
      }
    } catch (err) {
      console.error('Failed to book movie:', err);
    } finally {
      setBookingMovieId(null);
    }
  };

  const handleBookLiveShow = async (show) => {
    try {
      setBookingShowId(show.id);
      const res = await api.post('/events/ticketmaster/sync-and-book', show);
      if (res.data.eventId) {
        navigate(`/event/${res.data.eventId}`);
      }
    } catch (err) {
      console.error('Failed to book live show:', err);
      if (show.url) window.open(show.url, '_blank');
    } finally {
      setBookingShowId(null);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedType, selectedIndustry, selectedGenre, selectedSort, selectedDate, searchQuery]);

  useEffect(() => {
    if (liveTabType === 'movies') {
      fetchTmdbTrending(tmdbTab);
    } else {
      fetchTicketmasterShows(tmCategory);
    }
  }, [liveTabType, tmdbTab, tmCategory]);

  // Spotlight Carousel items: Filter for top featured blockbusters
  const featuredEvents = events
    .filter((e) => e.imageUrl && e.backdropUrl)
    .slice(0, 6);

  // If no backdrop events found, fallback to any with image
  const displayFeaturedList = featuredEvents.length > 0 ? featuredEvents : events.slice(0, 5);
  const currentFeatured = displayFeaturedList[activeSlide] || displayFeaturedList[0];

  // Auto-switch carousel slide every 4 seconds
  useEffect(() => {
    if (displayFeaturedList.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % displayFeaturedList.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [displayFeaturedList.length]);

  const categories = [
    { label: 'All Experiences', value: 'all' },
    { label: 'Movies & IMAX', value: 'movie' },
    { label: 'Concerts & Live', value: 'concert' },
  ];

  const genresList = [
    'All',
    'Action',
    'Sci-Fi',
    'Drama',
    'Comedy',
    'Thriller',
    'Adventure',
    'Music',
  ];

  const handleOpenFilterModal = () => {
    setTempIndustry(selectedIndustry);
    setTempGenre(selectedGenre);
    setTempSort(selectedSort);
    setFilterModalOpen(true);
  };

  const handleApplyFilters = () => {
    setSelectedIndustry(tempIndustry);
    setSelectedGenre(tempGenre);
    setSelectedSort(tempSort);
    setFilterModalOpen(false);
  };

  const handleResetFilters = () => {
    setTempIndustry('all');
    setTempGenre('all');
    setTempSort('popular');
    setSelectedIndustry('all');
    setSelectedGenre('all');
    setSelectedSort('popular');
    setFilterModalOpen(false);
  };

  const hasActiveFilters = selectedIndustry !== 'all' || selectedGenre !== 'all' || selectedSort !== 'popular';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-10 bg-[#121212] min-h-screen text-white">
      {/* ─── 1. TOP SPOTLIGHT HERO SHOWCASE CAROUSEL (LATEST BLOCKBUSTERS) ─── */}
      {currentFeatured && (
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="hero-showcase-carousel relative w-full rounded-3xl overflow-hidden bg-[#181824] shadow-2xl border border-white/10 min-h-[420px] sm:min-h-[460px] flex items-center transition-all group isolate"
        >
          {/* Smooth Crossfading Ambient Backdrop Images */}
          {displayFeaturedList.map((item, idx) => (
            <div
              key={`hero-bg-${item.id}`}
              className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out ${
                activeSlide === idx ? 'opacity-45 scale-105 blur-[1px]' : 'opacity-0 scale-100 blur-none pointer-events-none'
              }`}
              style={{
                backgroundImage: `url(${item.backdropUrl || item.imageUrl})`,
              }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-[#121218] via-[#121218]/90 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121218] via-transparent to-transparent pointer-events-none" />

          {/* Carousel Body with Smooth Fade-In on Slide Change */}
          <div
            key={`hero-slide-${currentFeatured.id}`}
            className="relative z-10 w-full p-6 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 animate-fadeIn"
          >
            {/* Left Content Column */}
            <div className="max-w-xl space-y-3.5 text-left">
              <h1 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight uppercase leading-tight drop-shadow-md">
                {currentFeatured.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#b3b3b3]">
                <span className="px-2.5 py-1 bg-[#1ed760] text-black font-black rounded-lg text-[10px] tracking-widest shadow-md">
                  🔥 SPOTLIGHT HIT
                </span>
                <span className="px-2.5 py-1 bg-white/15 text-white rounded-lg font-mono text-[11px] border border-white/10">
                  {currentFeatured.ageRating || currentFeatured.rating || 'UA 13+'}
                </span>
                {currentFeatured.imdbRating && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-black/60 backdrop-blur-md text-amber-400 font-bold rounded-lg text-[11px] border border-white/10">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{currentFeatured.imdbRating}</span>
                  </span>
                )}
                <span>&bull;</span>
                <span className="text-[#e5e5e5]">{currentFeatured.duration || '2h 25m'}</span>
                <span>&bull;</span>
                <span className="text-[#e5e5e5]">{currentFeatured.genre || 'Action • Adventure'}</span>
              </div>

              {currentFeatured.tagline && (
                <p className="text-xs italic text-[#a3a3a3] font-medium tracking-wide">
                  "{currentFeatured.tagline}"
                </p>
              )}

              <p className="text-xs sm:text-sm text-[#b3b3b3] leading-relaxed line-clamp-3">
                {currentFeatured.description}
              </p>

              <div className="flex items-center gap-4 pt-2">
                <Link
                  to={`/event/${currentFeatured.id}`}
                  className="px-8 py-3.5 bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black uppercase tracking-[1.5px] rounded-full shadow-xl hover:shadow-[#1ed760]/30 hover:scale-105 transition-all text-xs flex items-center gap-2 cursor-pointer"
                >
                  <TicketRoundedIcon className="w-4 h-4 text-black fill-black" />
                  <span>Book Tickets</span>
                </Link>

                {currentFeatured.trailerUrl && (
                  <button
                    onClick={() => setActiveTrailerUrl(currentFeatured.trailerUrl)}
                    className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-[1.4px] rounded-xl text-xs flex items-center gap-2 backdrop-blur-md border border-white/10 transition-all hover:scale-105 cursor-pointer"
                  >
                    <PlayRoundedIcon className="w-3.5 h-3.5 fill-white text-white" />
                    <span>Watch Trailer</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Featured Poster with Play Button & Slide Numbers */}
            <div className="flex items-center gap-6">
              <div
                onClick={() => currentFeatured.trailerUrl && setActiveTrailerUrl(currentFeatured.trailerUrl)}
                className="relative w-48 sm:w-60 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl group/poster cursor-pointer border border-white/15 transition-all flex-shrink-0"
              >
                <img
                  src={currentFeatured.imageUrl}
                  alt={currentFeatured.title}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=780&q=80';
                  }}
                  className="w-full h-full object-cover group-hover/poster:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/30 group-hover/poster:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#1ed760] flex items-center justify-center text-black group-hover/poster:scale-110 transition-transform duration-300 shadow-2xl">
                    <PlayRoundedIcon className="w-7 h-7 fill-black text-black ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Vertical Slide Indicators with Clockwise Circular Fill Animation (Dark Gray Inactive) */}
              {displayFeaturedList.length > 1 && (
                <div className="hidden sm:flex flex-col items-center gap-2.5 text-xs font-bold text-[#7c7c7c]">
                  {displayFeaturedList.map((_, idx) => {
                    const isActive = activeSlide === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveSlide(idx)}
                        className={`relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center transition-all duration-300 cursor-pointer select-none bg-[#282828] border border-white/10 ${
                          isActive
                            ? 'scale-110 ring-1 ring-[#1ed760]/50'
                            : 'hover:bg-[#383838] hover:scale-105'
                        }`}
                      >
                        {isActive && (
                          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                            <circle cx="16" cy="16" r="15" className="fill-[#282828]" />
                            <circle
                              key={`radial-fill-${activeSlide}`}
                              cx="16"
                              cy="16"
                              r="7.5"
                              fill="none"
                              stroke="#1ed760"
                              strokeWidth="15"
                              strokeDasharray={47.12}
                              strokeDashoffset={47.12}
                              className="animate-carousel-radial"
                            />
                          </svg>
                        )}
                        <span className={`relative z-10 text-xs font-black ${
                          isActive ? 'text-white' : 'text-[#b3b3b3]'
                        }`}>
                          {idx + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. CATEGORY FILTER PILLS, DATEPICKER & FILTERS MODAL BUTTON ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Left: Clean Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 flex-nowrap w-full sm:w-auto -mx-1 px-1">
          {categories.map((cat) => {
            const isSelected = selectedType === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedType(cat.value)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex-shrink-0 ${
                  isSelected
                    ? 'bg-white text-black scale-100 shadow-md font-black'
                    : 'bg-[#1f1f1f] text-[#b3b3b3] hover:text-white hover:bg-[#282828] border border-white/5'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Right: Filter Modal Button & Calendar Date Picker */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenFilterModal}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
              hasActiveFilters
                ? 'bg-[#1ed760] text-black border-[#1ed760]'
                : 'bg-[#1f1f1f] hover:bg-[#282828] text-white border-white/10'
            }`}
          >
            <FilterRoundedIcon className="w-3.5 h-3.5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-black ml-0.5" />
            )}
          </button>

          <CalendarPicker
            value={selectedDate}
            onChange={setSelectedDate}
            placeholder="Filter by Date"
          />
        </div>
      </div>

      {/* Section Title */}
      <div className="flex items-baseline justify-between pt-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {searchQuery
              ? `Search results for "${searchQuery}"`
              : selectedType === 'all'
              ? 'Now Showing in Theatres'
              : categories.find((c) => c.value === selectedType)?.label}
          </h2>
          <p className="text-xs text-[#7c7c7c] mt-0.5">
            Select an experience to choose your preferred seats & showtime
          </p>
        </div>
        <span className="text-xs text-[#b3b3b3] font-semibold bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
          {events.length} experiences available
        </span>
      </div>

      {/* ─── 3. CINEMA TICKET BOOKING CARDS GRID ─── */}
      <section>
        {loading ? (
          <div className="py-16 flex justify-center text-[#b3b3b3]">
            <Loader2 className="w-9 h-9 animate-spin text-[#1ed760]" />
          </div>
        ) : events.length === 0 ? (
          <div className="bg-[#181818] border border-[#282828] p-12 rounded-3xl text-center space-y-3 text-[#b3b3b3]">
            <FilmReelRoundedIcon className="w-10 h-10 mx-auto text-[#7c7c7c]" />
            <p className="text-base font-bold text-white">No experiences match your filter.</p>
            <p className="text-xs text-[#7c7c7c]">Try resetting your filters or selecting another date.</p>
            <button
              onClick={handleResetFilters}
              className="mt-3 px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {events.map((event) => (
              <Link
                key={event.id}
                to={`/event/${event.id}`}
                className="group bg-[#181818] hover:bg-[#1e1e1e] border border-[#282828] hover:border-[#383838] rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between hover:scale-[1.02] shadow-lg"
              >
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#181818] rounded-t-2xl transform-gpu isolate">
                    <img
                      src={event.backdropUrl || event.imageUrl}
                      alt={event.title}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform backface-hidden"
                    />
                    <div className="absolute -bottom-1 inset-x-0 h-20 bg-gradient-to-t from-[#181818] group-hover:from-[#1e1e1e] to-transparent pointer-events-none transition-colors duration-300" />
                    
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                      <span className="px-2 py-0.5 bg-black/75 backdrop-blur-md rounded-md text-[10px] font-mono text-white font-bold border border-white/10">
                        {event.ageRating || event.rating || 'UA 13+'}
                      </span>
                      {event.imdbRating && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-black/75 backdrop-blur-md text-amber-400 font-bold rounded-md text-[10px] border border-white/10">
                          <StarRoundedIcon className="w-3 h-3 fill-amber-400" />
                          <span>{event.imdbRating}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-2 relative -mt-3 z-10">
                    <h3 className="text-base font-bold text-white transition-colors line-clamp-1">
                      {event.title}
                    </h3>
                    <p className="text-xs text-[#b3b3b3] line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-3 border-t border-[#282828] flex items-center justify-between text-xs text-[#b3b3b3]">
                  <span className="flex items-center gap-1.5 text-[11px] text-[#7c7c7c]">
                    <ClockRoundedIcon className="w-3.5 h-3.5 text-[#1ed760]" />
                    <span>{event.duration || '2h 25m'}</span>
                  </span>
                  <div className="px-4 py-1.5 rounded-full bg-[#222222] border border-[#383838] text-white font-bold text-xs flex items-center gap-1.5 transition-all duration-200 group-hover:bg-[#1ed760] group-hover:text-black group-hover:border-[#1ed760] shadow-sm">
                    <span>Book</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ─── 4. LIVE CINEMA & CONCERT DISCOVERY STRIP ─── */}
      <section className="pt-8 border-t border-[#282828] space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLiveTabType('movies')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-black transition-all cursor-pointer ${
                  liveTabType === 'movies'
                    ? 'bg-[#1ed760] text-black shadow-md'
                    : 'bg-[#181818] text-[#b3b3b3] hover:text-white border border-[#282828]'
                }`}
              >
                <FireRoundedIcon className={`w-4 h-4 ${liveTabType === 'movies' ? 'fill-black' : 'fill-amber-500'}`} />
                <span>Now in Cinemas</span>
              </button>

              <button
                type="button"
                onClick={() => setLiveTabType('concerts')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-black transition-all cursor-pointer ${
                  liveTabType === 'concerts'
                    ? 'bg-[#1ed760] text-black shadow-md'
                    : 'bg-[#181818] text-[#b3b3b3] hover:text-white border border-[#282828]'
                }`}
              >
                <TicketRoundedIcon className={`w-4 h-4 ${liveTabType === 'concerts' ? 'fill-black' : 'fill-current'}`} />
                <span>Live Concerts & Tours</span>
              </button>
            </div>
            <p className="text-xs text-[#7c7c7c] mt-1.5">
              {liveTabType === 'movies'
                ? 'Now trending in cinemas & box-office releases worldwide'
                : 'Worldwide arena tours, festivals, and live theatre shows'}
            </p>
          </div>

          {/* Sub-Filters */}
          {liveTabType === 'movies' ? (
            <div className="flex items-center gap-2 bg-[#181818] p-1 rounded-xl border border-white/5 self-start lg:self-auto">
              {[
                { label: 'All Hits', value: 'all' },
                { label: 'Bollywood / Indian', value: 'bollywood' },
                { label: 'Hollywood', value: 'hollywood' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setTmdbTab(tab.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    tmdbTab === tab.value
                      ? 'bg-[#1ed760] text-black font-black shadow-md'
                      : 'text-[#b3b3b3] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-[#181818] p-1 rounded-xl border border-white/5 self-start lg:self-auto">
              {[
                { label: 'Music & Tours', value: 'music' },
                { label: 'Theatre & Arts', value: 'arts' },
                { label: 'Comedy', value: 'comedy' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setTmCategory(tab.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    tmCategory === tab.value
                      ? 'bg-[#1ed760] text-black font-black shadow-md'
                      : 'text-[#b3b3b3] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Section */}
        {liveTabType === 'movies' ? (
          tmdbLoading ? (
            <div className="py-12 flex justify-center text-[#b3b3b3]">
              <Loader2 className="w-8 h-8 animate-spin text-[#1ed760]" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tmdbTrending.map((movie) => {
                const isSyncing = bookingMovieId === movie.id;

                return (
                  <div
                    key={movie.id}
                    onClick={() => handleBookMovie(movie)}
                    className="group relative rounded-2xl overflow-hidden bg-[#181818] border border-[#282828] hover:border-[#383838] transition-all flex flex-col justify-between cursor-pointer hover:scale-[1.03] shadow-lg"
                  >
                    <div className="relative aspect-[2/3] overflow-hidden bg-[#181818] rounded-t-2xl transform-gpu isolate">
                      <img
                        src={movie.posterUrl || 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=400&q=80'}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform backface-hidden"
                      />
                      <div className="absolute -bottom-1 inset-x-0 h-16 bg-gradient-to-t from-[#181818] group-hover:from-[#1e1e1e] to-transparent pointer-events-none transition-colors duration-300" />
                      
                      <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
                        <span className="px-1.5 py-0.5 bg-black/70 backdrop-blur-md rounded text-[9px] font-bold text-amber-400 flex items-center gap-0.5 border border-white/10">
                          <StarRoundedIcon className="w-2.5 h-2.5 fill-amber-400" />
                          <span>{movie.voteAverage || '8.0'}</span>
                        </span>
                      </div>

                      <div className="absolute top-2 right-2 z-10">
                        <span className="px-2 py-0.5 bg-[#1ed760] text-black font-black rounded-full text-[9px] uppercase tracking-wider shadow-md">
                          AVAILABLE
                        </span>
                      </div>
                    </div>

                    <div className="p-3 space-y-1 relative -mt-2 z-10">
                      <h4 className="text-xs font-bold text-white transition-colors line-clamp-1 group-hover:text-[#1ed760]">
                        {movie.title}
                      </h4>
                      <p className="text-[10px] text-[#7c7c7c]">
                        {movie.releaseYear || '2026'} &bull; Live in Theatres
                      </p>
                    </div>

                    <div className="p-2 pt-0 pb-2.5">
                      <div className="w-full py-1.5 bg-[#222222] border border-[#383838] text-white group-hover:bg-[#1ed760] group-hover:text-black group-hover:border-[#1ed760] font-bold text-xs rounded-full text-center uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5">
                        {isSyncing ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin text-current" />
                            <span>Opening Seats...</span>
                          </>
                        ) : (
                          <span>Book Now</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          tmShowsLoading ? (
            <div className="py-12 flex justify-center text-[#b3b3b3]">
              <Loader2 className="w-8 h-8 animate-spin text-[#1ed760]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tmShows.map((show) => {
                const matchedEvent = events.find(
                  (e) => e.title.toLowerCase().includes(show.title.toLowerCase()) ||
                         show.title.toLowerCase().includes(e.title.toLowerCase().replace(/[:—–-].*$/i, '').trim())
                );

                return (
                  <div
                    key={show.id}
                    onClick={() => handleBookLiveShow(show)}
                    className="group relative rounded-2xl overflow-hidden bg-[#181818] border border-[#282828] hover:border-[#383838] transition-all flex flex-col justify-between cursor-pointer hover:scale-[1.02] shadow-lg"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-[#181818] rounded-t-2xl transform-gpu isolate">
                      <img
                        src={show.imageUrl || show.backdropUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=600&q=80'}
                        alt={show.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform backface-hidden"
                      />
                      <div className="absolute -bottom-1 inset-x-0 h-16 bg-gradient-to-t from-[#181818] group-hover:from-[#1e1e1e] to-transparent pointer-events-none transition-colors duration-300" />
                      
                      <div className="absolute top-2 left-2 z-10">
                        <span className="px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-full text-[9px] font-black text-[#1ed760] uppercase tracking-wider">
                          {show.genre || 'LIVE TOUR'}
                        </span>
                      </div>

                      <div className="absolute top-2 right-2 z-10">
                        <span className="px-2.5 py-1 bg-[#1ed760] text-black font-black rounded-full text-[9px] uppercase tracking-wider shadow-md">
                          BOOKABLE IN AUDITORIUM
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 space-y-1.5 relative -mt-3 z-10">
                      <h4 className="text-sm font-bold text-white transition-colors line-clamp-1 group-hover:text-[#1ed760]">
                        {show.title}
                      </h4>
                      <p className="text-xs text-[#b3b3b3] flex items-center gap-1 line-clamp-1">
                        <MapPinRoundedIcon className="w-3.5 h-3.5 fill-[#1ed760] shrink-0" />
                        <span>{show.venue?.name}{show.venue?.city ? ` • ${show.venue.city}` : ''}</span>
                      </p>
                      {show.date && (
                        <p className="text-[11px] text-[#7c7c7c] flex items-center gap-1">
                          <CalendarRoundedIcon className="w-3 h-3 fill-current shrink-0" />
                          <span>{show.date}</span>
                        </p>
                      )}
                    </div>

                    <div className="p-3 pt-0 pb-3">
                      <div className="w-full py-2 bg-[#222222] text-white group-hover:bg-[#1ed760] group-hover:text-black font-bold text-xs rounded-full text-center uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5">
                        {bookingShowId === show.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Opening Seating Chart...</span>
                          </>
                        ) : (
                          <>
                            <span>Select Seats</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </section>

      {/* ─── 5. FILTER MODAL ─── */}
      <Modal
        isOpen={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        backdrop="blur"
        size="lg"
        className="bg-[#181818] border border-[#282828] text-white rounded-2xl shadow-2xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="border-b border-[#282828] flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#1ed760]" />
                  <h3 className="font-display text-lg font-bold text-white">Filter Experiences</h3>
                </div>
              </ModalHeader>

              <ModalBody className="py-5 space-y-5 text-xs">
                {/* Cinema Industry */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3]">
                    Cinema Industry & Category
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'All Cinema', value: 'all' },
                      { label: 'Bollywood & Hindi', value: 'bollywood' },
                      { label: 'Hollywood', value: 'hollywood' },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setTempIndustry(item.value)}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                          tempIndustry === item.value
                            ? 'bg-[#1ed760] text-black border-[#1ed760]'
                            : 'bg-[#121212] text-[#b3b3b3] hover:text-white border-white/5'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Genre Pills */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3]">
                    Genre
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {genresList.map((g) => {
                      const val = g.toLowerCase();
                      const isSelected = tempGenre === val || (g === 'All' && tempGenre === 'all');
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setTempGenre(g === 'All' ? 'all' : val)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-white text-black border-white'
                              : 'bg-[#121212] text-[#b3b3b3] hover:text-white border-white/5'
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sort Order */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3]">
                    Sort By
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Popularity', value: 'popular' },
                      { label: 'Highest Rated', value: 'rating' },
                      { label: 'Newest Release', value: 'release' },
                    ].map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setTempSort(s.value)}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                          tempSort === s.value
                            ? 'bg-white text-black border-white'
                            : 'bg-[#121212] text-[#b3b3b3] hover:text-white border-white/5'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </ModalBody>

              <ModalFooter className="border-t border-[#282828] flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-[#b3b3b3] hover:text-white font-bold transition-colors cursor-pointer"
                >
                  Reset All
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-[#222222] hover:bg-[#282828] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFilters}
                    className="px-5 py-2 bg-[#1ed760] hover:bg-[#1fdf64] text-black font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Apply Filters
                  </button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ─── 6. TRAILER MODAL ─── */}
      <Modal
        isOpen={!!activeTrailerUrl}
        onOpenChange={(open) => !open && setActiveTrailerUrl(null)}
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

              {activeTrailerUrl && (
                <iframe
                  src={activeTrailerUrl.replace('watch?v=', 'embed/') + '?autoplay=1'}
                  title="Movie Trailer"
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
