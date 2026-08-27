import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/client';
import CalendarPicker from '../components/CalendarPicker';
import FancyQRCode from '../components/FancyQRCode';
import AddToCalendarDropdown from '../components/AddToCalendarDropdown';
import { useToast } from '../context/ToastContext';
import {
  NormalSeatSvg,
  ReclinerSeatSvg,
  LeftSpeakerWave,
  RightSpeakerWave,
  AisleStairsGraphic,
} from './SeatSelection';

import { Ticket, Calendar, MapPin, Info, Search, Filter, Clock, Film, DollarSign, QrCode, AlertCircle, Loader2, SlidersHorizontal, X, CheckCircle2, LayoutGrid, ChevronRight, ShieldCheck, Check, Download } from '../components/MappedIcons';

export default function BookingHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  // Modals & Popups
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [infoModalBooking, setInfoModalBooking] = useState(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // Seat Map Preview State
  const [seatMapModalBooking, setSeatMapModalBooking] = useState(null);
  const [seatMapData, setSeatMapData] = useState(null);
  const [seatMapLoading, setSeatMapLoading] = useState(false);

  // Blue Cancellation Hover Notification
  const [cancelNotification, setCancelNotification] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'confirmed' | 'cancelled'
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'upcoming' | 'past' | 'custom'
  const [customDate, setCustomDate] = useState('');

  const hasActiveFilters = statusFilter !== 'all' || dateFilter !== 'all' || !!customDate;

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/my-bookings');
      setBookings(res.data.bookings || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fetch your bookings.');
    } finally {
      setLoading(false);
    }
  };

  const location = useLocation();

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetRef = params.get('ref') || params.get('view') || params.get('bookingRef');
    if (targetRef && bookings.length > 0) {
      const found = bookings.find(
        (b) => b.bookingRef === targetRef || b.id === targetRef
      );
      if (found) {
        setSelectedTicket(found);
      }
    }
  }, [location.search, bookings]);

  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    const booking = cancelModalBooking;
    const bookingId = booking.id;

    setCancellingId(bookingId);
    setCancelModalBooking(null);

    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      
      toast.info(`Reservation ${booking.bookingRef} was cancelled.`);

      // Trigger Blue Hover Notification Card
      setCancelNotification({
        ref: booking.bookingRef,
        title: booking.showtime?.event?.title || 'Reservation',
      });
      setTimeout(() => {
        setCancelNotification(null);
      }, 5500);

      await fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleOpenSeatMap = async (booking) => {
    setSeatMapModalBooking(booking);
    setSeatMapLoading(true);
    try {
      const res = await api.get(`/showtimes/${booking.showtimeId}/seats`);
      setSeatMapData(res.data);
    } catch (err) {
      console.error('Failed to fetch seat map for booking:', err);
    } finally {
      setSeatMapLoading(false);
    }
  };

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const title = b.showtime?.event?.title || '';
      const venue = b.showtime?.event?.venue?.name || b.showtime?.venueName || '';
      const ref = b.bookingRef || '';
      const seatLabels = (b.items || []).map((i) => i.seat?.label || '').join(' ');
      const query = searchQuery.trim().toLowerCase();

      // Search Query Match
      if (query) {
        const matchesQuery =
          title.toLowerCase().includes(query) ||
          venue.toLowerCase().includes(query) ||
          ref.toLowerCase().includes(query) ||
          seatLabels.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      // Status Filter
      if (statusFilter !== 'all' && b.status !== statusFilter) {
        return false;
      }

      // Date Filter
      if (b.showtime?.dateTime) {
        const showtimeDate = new Date(b.showtime.dateTime);
        const now = new Date();

        if (dateFilter === 'upcoming' && showtimeDate < now) {
          return false;
        }
        if (dateFilter === 'past' && showtimeDate >= now) {
          return false;
        }
        if (dateFilter === 'custom' && customDate) {
          const isoDate = showtimeDate.toISOString().split('T')[0];
          if (isoDate !== customDate) return false;
        }
      }

      return true;
    });
  }, [bookings, searchQuery, statusFilter, dateFilter, customDate]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-[#b3b3b3]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1ed760]" />
        <p className="text-sm font-bold">Loading your tickets...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6 text-white font-sans relative">
      {/* ─── BLUE FLOATING CANCELLATION NOTIFICATION CARD ─── */}
      {/* ─── MINIMAL SPOTIFY-THEMED CANCELLATION NOTIFICATION ─── */}
      <AnimatePresence>
        {cancelNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed top-6 right-6 z-[300] max-w-md w-[92%] sm:w-auto bg-[#1f1f1f] border border-[#333333] rounded-xl p-3.5 sm:p-4 shadow-2xl flex items-start gap-3 text-white"
          >
            <div className="w-7 h-7 rounded-full bg-[#1ed760]/20 flex items-center justify-center text-[#1ed760] flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>

            <div className="space-y-1 flex-1 pr-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1ed760]">
                  Cancelled
                </span>
                <span className="text-[10px] font-mono text-[#7c7c7c]">
                  {cancelNotification.ref}
                </span>
              </div>
              <p className="text-xs font-bold text-white leading-snug">
                {cancelNotification.title}
              </p>
              <p className="text-[11px] text-[#b3b3b3] leading-normal">
                Reservation cancelled successfully. Seats released.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCancelNotification(null)}
              className="text-[#7c7c7c] hover:text-white transition-colors p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── HEADER: TITLE & SEARCH / FILTER CONTROLS ─── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#282828] pb-6">
        <div>
          <span className="text-xs uppercase font-bold text-[#1ed760] tracking-wider block">
            Your Library
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            My Reserved Tickets
          </h1>
          <p className="text-xs sm:text-sm text-[#b3b3b3] mt-1">
            Review confirmed passes, inspect ticket seat maps, and manage admissions.
          </p>
        </div>

        {/* Search Bar & Filter Modal Trigger Button */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-72">
            <input
              type="text"
              placeholder="Search movie, venue, ref, seat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#181818] border border-[#383838] hover:border-white focus:border-[#1ed760] text-xs text-white px-3.5 py-2.5 pl-9 pr-8 rounded-full focus:outline-none placeholder:text-[#666666] transition-all"
            />
            <Search className="w-4 h-4 text-[#7c7c7c] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7c7c7c] hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Modal Trigger Button */}
          <button
            type="button"
            onClick={() => setFilterModalOpen(true)}
            className={`px-4 py-2.5 rounded-full border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer flex-shrink-0 ${
              hasActiveFilters
                ? 'bg-[#1ed760] text-black border-[#1ed760] shadow-md shadow-[#1ed760]/20'
                : 'bg-[#181818] hover:bg-[#282828] text-white border-[#383838] hover:border-white'
            }`}
          >
            <SlidersHorizontal className={`w-4 h-4 ${hasActiveFilters ? 'text-black' : 'text-[#1ed760]'}`} />
            <span>Filter</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-black ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* ─── TICKETS PASSES LIST ─── */}
      {filteredBookings.length === 0 ? (
        <div className="bg-[#181818] p-12 text-center space-y-4 rounded-2xl border border-white/5 shadow-2xl">
          <Ticket className="w-12 h-12 text-[#7c7c7c] mx-auto" />
          <h3 className="text-lg font-bold text-white">
            {bookings.length === 0 ? 'No Tickets Booked Yet' : 'No Tickets Match Your Filters'}
          </h3>
          <p className="text-xs text-[#b3b3b3] max-w-sm mx-auto">
            {bookings.length === 0
              ? "You haven't reserved any tickets yet. Explore upcoming concerts, theatre plays, and IMAX screenings."
              : 'Try clearing your search term or adjusting your date filter to view your passes.'}
          </p>
          {bookings.length === 0 ? (
            <Link
              to="/"
              className="inline-block px-6 py-2.5 bg-[#1ed760] text-black font-black text-xs uppercase tracking-[1.4px] rounded-full hover:scale-105 transition-transform shadow-md cursor-pointer"
            >
              Browse Experiences
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setDateFilter('all');
                setCustomDate('');
              }}
              className="px-5 py-2 bg-[#282828] hover:bg-[#333333] text-white font-bold text-xs rounded-full transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const isCancelled = booking.status === 'cancelled';
            const showtime = booking.showtime;
            const event = showtime?.event;
            const mySeats = (booking.items || []).map((i) => i.seat?.label || i.seatId);

            return (
              <div
                key={booking.id}
                className={`bg-[#181818] hover:bg-[#1c1c1c] transition-all p-5 sm:p-6 rounded-2xl border border-[#282828] flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-2xl overflow-hidden ${
                  isCancelled ? 'opacity-55' : ''
                }`}
              >
                {/* Event Details & Poster */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {event?.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=780&q=80';
                      }}
                      className="w-16 h-22 rounded-xl object-cover border border-white/10 flex-shrink-0 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-22 rounded-xl bg-[#252525] border border-white/10 flex items-center justify-center flex-shrink-0">
                      <Film className="w-6 h-6 text-[#7c7c7c]" />
                    </div>
                  )}

                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                          isCancelled
                            ? 'bg-[#f3727f]/20 text-[#f3727f]'
                            : 'bg-[#1ed760]/20 text-[#1ed760]'
                        }`}
                      >
                        {booking.status}
                      </span>
                      <span className="text-xs text-[#b3b3b3] font-mono font-bold truncate">
                        Ref: {booking.bookingRef}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
                      {event?.title || 'Live Experience'}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#b3b3b3]">
                      <span className="flex items-center gap-1.5 text-white font-bold">
                        <Calendar className="w-3.5 h-3.5 text-[#1ed760]" />
                        {showtime?.dateTime
                          ? new Date(showtime.dateTime).toLocaleString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Upcoming'}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#1ed760]" />
                        {event?.venue?.name || 'Main Stage'}
                      </span>
                    </div>

                    {/* Booked Seat Badges */}
                    <div className="pt-1 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-[#b3b3b3] font-medium">Seats:</span>
                      {booking.items?.map((item) => (
                        <span
                          key={item.id}
                          className="px-2.5 py-0.5 bg-[#121212] text-[#1ed760] border border-white/5 rounded-full font-mono font-bold text-[11px]"
                        >
                          {item.seat?.label || item.seatId} (₹{item.price})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions, Price & Modal Buttons */}
                <div className="flex flex-col sm:flex-row lg:flex-col lg:items-end justify-between gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-white/5 flex-shrink-0">
                  <div className="text-left lg:text-right">
                    <span className="text-[11px] text-[#b3b3b3] block uppercase font-bold">Total Paid</span>
                    <span className="text-2xl font-black text-white font-mono">
                      ₹{booking.totalAmount}
                    </span>
                  </div>

                  {/* Pass Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    {/* 1. INFO BUTTON (Opens Movie & Ticket Info Modal) */}
                    <button
                      type="button"
                      onClick={() => setInfoModalBooking(booking)}
                      className="px-3.5 py-2 bg-[#252525] hover:bg-[#333333] text-white text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 cursor-pointer border border-white/5"
                    >
                      <Info className="w-3.5 h-3.5 text-[#1ed760]" />
                      <span>Info</span>
                    </button>

                    {/* 2. VIEW SEATS BUTTON (Opens Dedicated Full-Page Seating View) */}
                    <button
                      type="button"
                      onClick={() => navigate(`/my-bookings/${booking.id}/seats`)}
                      className="px-3.5 py-2 bg-[#252525] hover:bg-[#333333] text-white text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 cursor-pointer border border-white/5"
                    >
                      <LayoutGrid className="w-3.5 h-3.5 text-[#38bdf8]" />
                      <span>View Seats</span>
                    </button>

                    {!isCancelled && (
                      <>
                        {/* 3. ADD TO CALENDAR BUTTON */}
                        <AddToCalendarDropdown
                          bookingRef={booking.bookingRef}
                          eventTitle={booking.showtime?.event?.title || 'Movie Screening'}
                          venueName={booking.showtime?.event?.venue?.name || 'Auditorium'}
                          venueAddress={booking.showtime?.event?.venue?.address || ''}
                          dateTime={booking.showtime?.dateTime}
                          seats={(booking.items || []).map((i) => i.seat?.label || i.seatId)}
                          buttonVariant="compact"
                        />

                        {/* 4. QR PASS BUTTON */}
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(booking)}
                          className="px-4 py-2 btn-high-contrast text-xs font-black uppercase tracking-[1.2px] rounded-full hover:scale-105 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>QR Pass</span>
                        </button>

                        {/* 5. CANCEL RESERVATION BUTTON */}
                        <button
                          type="button"
                          disabled={cancellingId === booking.id}
                          onClick={() => setCancelModalBooking(booking)}
                          className="px-3 py-2 text-xs text-[#f3727f] hover:text-[#ff7886] hover:bg-[#281818] rounded-full font-bold transition-colors cursor-pointer"
                        >
                          {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          1. INFO MODAL: WIDE 2-COLUMN MOVIE & TICKET METADATA CARD
          ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={!!infoModalBooking}
        onOpenChange={(open) => !open && setInfoModalBooking(null)}
        backdrop="blur"
        size="4xl"
        className="bg-[#181818] text-white rounded-3xl border border-[#282828] shadow-2xl max-w-4xl"
      >
        <ModalContent>
          {(onClose) => {
            const ev = infoModalBooking?.showtime?.event;
            const st = infoModalBooking?.showtime;
            const venue = ev?.venue || st?.venue;

            return (
              <>
                <ModalHeader className="border-b border-[#282828] flex items-center justify-between pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1ed760]">
                      Ticket & Production Details
                    </span>
                    <h3 className="text-xl font-black text-white">
                      {ev?.title || 'Event Details'}
                    </h3>
                  </div>
                </ModalHeader>

                <ModalBody className="py-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column (7 cols): Movie Overview & Venue Specs */}
                    <div className="lg:col-span-7 space-y-4">
                      <div className="flex items-start gap-4 p-4 bg-[#121212] rounded-2xl border border-white/5">
                        {ev?.imageUrl && (
                          <img
                            src={ev.imageUrl}
                            alt={ev.title}
                            onError={(e) => {
                              e.currentTarget.src =
                                'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=780&q=80';
                            }}
                            className="w-20 h-28 rounded-xl object-cover border border-white/10 flex-shrink-0 shadow-md"
                          />
                        )}
                        <div className="space-y-1.5 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-[#1ed760] text-black font-black uppercase text-[10px] rounded">
                              {ev?.type || 'EVENT'}
                            </span>
                            {ev?.rating && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-400 text-black rounded font-mono">
                                {ev.rating}
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-black text-white truncate">{ev?.title}</h4>
                          <p className="text-xs text-[#b3b3b3] leading-relaxed line-clamp-2">
                            {ev?.description || 'Exclusive screening experience with state-of-the-art acoustics.'}
                          </p>
                        </div>
                      </div>

                      {/* 2x2 Specs Grid */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-[#121212] rounded-xl border border-white/5 space-y-0.5">
                          <span className="text-[10px] font-bold uppercase text-[#7c7c7c] block">
                            Date & Showtime
                          </span>
                          <p className="font-bold text-white flex items-center gap-1 truncate">
                            <Calendar className="w-3.5 h-3.5 text-[#1ed760] flex-shrink-0" />
                            <span>
                              {st?.dateTime
                                ? new Date(st.dateTime).toLocaleString(undefined, {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Upcoming'}
                            </span>
                          </p>
                        </div>

                        <div className="p-3 bg-[#121212] rounded-xl border border-white/5 space-y-0.5">
                          <span className="text-[10px] font-bold uppercase text-[#7c7c7c] block">
                            Theatre & Location
                          </span>
                          <p className="font-bold text-white flex items-center gap-1 truncate">
                            <MapPin className="w-3.5 h-3.5 text-[#1ed760] flex-shrink-0" />
                            <span>{venue?.name || 'Main Stage'}</span>
                          </p>
                        </div>

                        <div className="p-3 bg-[#121212] rounded-xl border border-white/5 space-y-0.5">
                          <span className="text-[10px] font-bold uppercase text-[#7c7c7c] block">
                            Format & Screen
                          </span>
                          <p className="font-bold text-[#1ed760] truncate">
                            {st?.format || 'DOLBY ATMOS'} &bull; {st?.screen || 'AUDI 1'}
                          </p>
                        </div>

                        <div className="p-3 bg-[#121212] rounded-xl border border-white/5 space-y-0.5">
                          <span className="text-[10px] font-bold uppercase text-[#7c7c7c] block">
                            Language & Audio
                          </span>
                          <p className="font-bold text-white truncate">
                            {st?.language || 'ENGLISH'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column (5 cols): Reserved Seats & Payment Breakdown */}
                    <div className="lg:col-span-5 flex flex-col justify-between space-y-4 p-4 bg-[#121212] rounded-2xl border border-white/5">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-[#282828] pb-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-[#7c7c7c] block">
                              Booking Reference
                            </span>
                            <span className="font-mono font-black text-sm text-[#1ed760]">
                              {infoModalBooking?.bookingRef}
                            </span>
                          </div>
                          <span className="text-[9px] uppercase font-black px-2 py-0.5 bg-[#1ed760]/20 text-[#1ed760] rounded-full">
                            CONFIRMED
                          </span>
                        </div>

                        {/* Assigned Seats */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase text-[#b3b3b3] block">
                            Assigned Seats ({infoModalBooking?.items?.length || 0})
                          </span>
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {infoModalBooking?.items?.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-2.5 bg-[#181818] rounded-xl border border-white/5 text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-white">
                                    Seat {item.seat?.label || item.seatId}
                                  </span>
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[#252525] text-[#1ed760] rounded">
                                    {item.seat?.category?.name || 'Standard'}
                                  </span>
                                </div>
                                <span className="font-mono font-bold text-white">₹{item.price}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Total Amount Paid */}
                      <div className="pt-3 border-t border-[#282828] flex items-center justify-between">
                        <span className="text-xs text-[#b3b3b3] font-bold">Total Amount Paid</span>
                        <span className="text-2xl font-black text-[#1ed760] font-mono">
                          ₹{infoModalBooking?.totalAmount}
                        </span>
                      </div>
                    </div>
                  </div>
                </ModalBody>

                <ModalFooter className="border-t border-[#282828] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(`/my-bookings/${infoModalBooking.id}/seats`);
                    }}
                    className="px-5 py-2.5 bg-[#252525] hover:bg-[#333333] text-white text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>View on Seat Map</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setSelectedTicket(infoModalBooking);
                    }}
                    className="px-6 py-2.5 bg-[#1ed760] hover:bg-[#1fdf64] text-black text-xs font-black uppercase tracking-[1.4px] rounded-full hover:scale-105 transition-all shadow-md cursor-pointer"
                  >
                    View QR Pass
                  </button>
                </ModalFooter>
              </>
            );
          }}
        </ModalContent>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          2. VIEW SEATS MODAL: AUTHENTIC THEATRE SEATING MAP (WITH EXACT SVG SEATS)
          ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={!!seatMapModalBooking}
        onOpenChange={(open) => !open && setSeatMapModalBooking(null)}
        backdrop="blur"
        size="5xl"
        className="bg-[#121212] text-white rounded-3xl border border-[#282828] shadow-2xl max-w-5xl"
      >
        <ModalContent>
          {(onClose) => {
            const ev = seatMapModalBooking?.showtime?.event;
            const userSeatIds = (seatMapModalBooking?.items || []).map(
              (i) => i.seatId || i.seat?.id
            );
            const userSeatLabels = (seatMapModalBooking?.items || [])
              .map((i) => i.seat?.label)
              .filter(Boolean);

            const seats = seatMapData?.seats || [];
            const venue = seatMapData?.venue;

            // Group seats by row
            const rowsMap = new Map();
            seats.forEach((s) => {
              if (!rowsMap.has(s.row)) rowsMap.set(s.row, []);
              rowsMap.get(s.row).push(s);
            });
            const sortedRows = Array.from(rowsMap.keys()).sort((a, b) => a - b);

            return (
              <>
                <ModalHeader className="border-b border-[#282828] flex items-center justify-between pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1ed760]">
                      Your Booked Seating Map
                    </span>
                    <h3 className="text-xl font-black text-white">
                      {ev?.title} &bull; <span className="text-[#38bdf8]">{venue?.name}</span>
                    </h3>
                    <p className="text-xs text-[#b3b3b3] mt-0.5">
                      Your reserved seats:{' '}
                      <strong className="text-[#1ed760] font-mono text-sm">
                        {userSeatLabels.join(', ')}
                      </strong>
                    </p>
                  </div>
                </ModalHeader>

                <ModalBody className="py-6 space-y-6">
                  {seatMapLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#b3b3b3]">
                      <Loader2 className="w-8 h-8 animate-spin text-[#1ed760]" />
                      <p className="text-xs font-bold">Rendering authentic auditorium layout...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Authentic Auditorium Cinema Screen */}
                      <div className="w-full flex flex-col items-center space-y-2 select-none">
                        <div className="w-full max-w-2xl h-10 relative flex items-center justify-center">
                          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-transparent rounded-t-[100px] border-t-2 border-white/40" />
                          <span className="relative z-10 text-[11px] uppercase font-mono font-bold tracking-[0.3em] text-[#b3b3b3]">
                            AUDITORIUM CINEMA SCREEN
                          </span>
                        </div>
                      </div>

                      {/* Authentic Visual Seat Grid using SeatSelection SVGs */}
                      <div className="overflow-x-auto py-4 scrollbar-none flex justify-center">
                        <div className="space-y-3 min-w-fit px-4">
                          {sortedRows.map((rowNum, rowIndex) => {
                            const rowSeats = rowsMap.get(rowNum) || [];
                            const rowLetter = String.fromCharCode(64 + rowNum);
                            const firstSeat = rowSeats[0];
                            const isRecliner =
                              firstSeat?.category?.name?.toLowerCase().includes('recliner') ||
                              firstSeat?.category?.name?.toLowerCase().includes('vip') ||
                              rowNum <= 2;

                            const totalCols = rowSeats.length;
                            const leftBankCutoff = Math.floor(totalCols / 2);
                            const showSpeaker = rowIndex % 2 === 1 || rowIndex === sortedRows.length - 1;

                            return (
                              <div key={rowNum} className="flex items-center justify-center gap-2 sm:gap-3">
                                {/* Left Speaker Wave */}
                                <div className="w-8 flex justify-end">
                                  {showSpeaker ? <LeftSpeakerWave /> : <div className="w-4" />}
                                </div>

                                <AisleStairsGraphic />

                                {/* Row Letter Left */}
                                <span className="w-5 text-xs font-bold text-[#b3b3b3] text-right select-none font-mono">
                                  {rowLetter}
                                </span>

                                {/* Left Bank Seats */}
                                <div className="flex items-center">
                                  {rowSeats.slice(0, leftBankCutoff).map((seat) => {
                                    const isMySeat = userSeatIds.includes(seat.id);

                                    return (
                                      <div key={seat.id} className="relative group/seat mx-0.5 sm:mx-1">
                                        <div
                                          title={
                                            isMySeat
                                              ? `YOUR RESERVED SEAT: ${seat.label}`
                                              : `Seat ${seat.label} (${seat.status})`
                                          }
                                          className={`flex items-center justify-center select-none transition-all ${
                                            isRecliner ? 'w-10 h-13 sm:w-12 sm:h-15' : 'w-8 h-8 sm:w-10 sm:h-10'
                                          } ${
                                            isMySeat
                                              ? 'scale-110 z-10'
                                              : seat.status === 'booked'
                                              ? 'opacity-30'
                                              : 'opacity-80'
                                          }`}
                                        >
                                          {isRecliner ? (
                                            <ReclinerSeatSvg
                                              status={seat.status}
                                              isHeldByMe={false}
                                              isSelected={isMySeat}
                                              col={seat.col}
                                            />
                                          ) : (
                                            <NormalSeatSvg
                                              status={seat.status}
                                              isHeldByMe={false}
                                              isSelected={isMySeat}
                                              col={seat.col}
                                            />
                                          )}
                                        </div>

                                        {isMySeat && (
                                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                                            <span className="px-1.5 py-0.5 bg-white text-black font-black text-[8px] rounded-full shadow-md">
                                              YOU
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Central Aisle Stairs */}
                                <AisleStairsGraphic label="AISLE" />

                                {/* Right Bank Seats */}
                                <div className="flex items-center">
                                  {rowSeats.slice(leftBankCutoff).map((seat) => {
                                    const isMySeat = userSeatIds.includes(seat.id);

                                    return (
                                      <div key={seat.id} className="relative group/seat mx-0.5 sm:mx-1">
                                        <div
                                          title={
                                            isMySeat
                                              ? `YOUR RESERVED SEAT: ${seat.label}`
                                              : `Seat ${seat.label} (${seat.status})`
                                          }
                                          className={`flex items-center justify-center select-none transition-all ${
                                            isRecliner ? 'w-10 h-13 sm:w-12 sm:h-15' : 'w-8 h-8 sm:w-10 sm:h-10'
                                          } ${
                                            isMySeat
                                              ? 'scale-110 z-10'
                                              : seat.status === 'booked'
                                              ? 'opacity-30'
                                              : 'opacity-80'
                                          }`}
                                        >
                                          {isRecliner ? (
                                            <ReclinerSeatSvg
                                              status={seat.status}
                                              isHeldByMe={false}
                                              isSelected={isMySeat}
                                              col={seat.col}
                                            />
                                          ) : (
                                            <NormalSeatSvg
                                              status={seat.status}
                                              isHeldByMe={false}
                                              isSelected={isMySeat}
                                              col={seat.col}
                                            />
                                          )}
                                        </div>

                                        {isMySeat && (
                                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                                            <span className="px-1.5 py-0.5 bg-white text-black font-black text-[8px] rounded-full shadow-md">
                                              YOU
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Row Letter Right */}
                                <span className="w-5 text-xs font-bold text-[#b3b3b3] text-left select-none font-mono">
                                  {rowLetter}
                                </span>

                                <AisleStairsGraphic />

                                {/* Right Speaker Wave */}
                                <div className="w-8 flex justify-start">
                                  {showSpeaker ? <RightSpeakerWave /> : <div className="w-4" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Authentic Seat Map Legend */}
                      <div className="flex flex-wrap items-center justify-center gap-6 pt-3 border-t border-[#282828] text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5">
                            <NormalSeatSvg isSelected={true} />
                          </div>
                          <span className="text-white">Your Booked Seat ({userSeatLabels.join(', ')})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5">
                            <NormalSeatSvg status="booked" />
                          </div>
                          <span className="text-[#666666]">Other Booked Seats</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5">
                            <NormalSeatSvg status="available" />
                          </div>
                          <span className="text-[#b3b3b3]">Available Seats</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5">
                            <ReclinerSeatSvg status="available" />
                          </div>
                          <span className="text-amber-400">VIP Recliner Tier</span>
                        </div>
                      </div>
                    </div>
                  )}
                </ModalBody>

                <ModalFooter className="border-t border-[#282828] flex items-center justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 bg-[#252525] hover:bg-[#333333] text-white text-xs font-bold rounded-full transition-colors cursor-pointer"
                  >
                    Close Seating Map
                  </button>
                </ModalFooter>
              </>
            );
          }}
        </ModalContent>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          3. CANCELLATION CONFIRMATION MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={!!cancelModalBooking}
        onOpenChange={(open) => !open && setCancelModalBooking(null)}
        backdrop="blur"
        className="bg-[#181818] text-white rounded-3xl shadow-2xl border border-[#282828] max-w-md"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-base font-bold text-white border-b border-[#282828] flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#f3727f]" />
                <span>Cancel Reservation</span>
              </ModalHeader>
              <ModalBody className="py-5 space-y-3 text-xs">
                <p className="text-white font-medium">
                  Are you sure you want to cancel your booking for{' '}
                  <span className="text-[#1ed760] font-bold">
                    {cancelModalBooking?.showtime?.event?.title}
                  </span>?
                </p>
                <div className="p-3 bg-[#121212] rounded-2xl border border-white/5 space-y-1 text-[#b3b3b3]">
                  <p>
                    <strong className="text-white">Venue:</strong> {cancelModalBooking?.showtime?.venue?.name}
                  </p>
                  <p>
                    <strong className="text-white">Booking Ref:</strong> {cancelModalBooking?.bookingRef}
                  </p>
                  <p>
                    <strong className="text-white">Refund Total:</strong> ₹{cancelModalBooking?.totalAmount}
                  </p>
                </div>
                <p className="text-[#b3b3b3] leading-relaxed">
                  Your held seats will be immediately released and automatically dispatched to the next customer in the waitlist queue.
                </p>
              </ModalBody>
              <ModalFooter className="border-t border-[#282828] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-[#252525] hover:bg-[#333333] text-white text-xs font-bold rounded-full transition-colors cursor-pointer"
                >
                  Keep Reservation
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  className="px-6 py-2.5 bg-[#f3727f] hover:bg-[#ff5b6d] text-black text-xs font-bold uppercase tracking-[1.2px] rounded-full transition-transform hover:scale-105 cursor-pointer shadow-md"
                >
                  Yes, Cancel Booking
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          4. QR PASS MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={!!selectedTicket}
        onOpenChange={(open) => !open && setSelectedTicket(null)}
        backdrop="blur"
        className="bg-[#181818] text-white rounded-3xl shadow-2xl border border-[#282828]"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-base font-bold text-white border-b border-[#282828]">
                Official Admission Pass
              </ModalHeader>
              <ModalBody className="py-6 flex flex-col items-center space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-black text-white">
                    {selectedTicket?.showtime?.event?.title}
                  </h3>
                  <p className="text-xs text-[#b3b3b3]">
                    {selectedTicket?.showtime?.venue?.name}
                  </p>
                </div>

                <div className="flex justify-center py-2">
                  <FancyQRCode
                    value={`https://bookme.com/verify/${selectedTicket?.bookingRef}`}
                    imageUrl={selectedTicket?.showtime?.event?.imageUrl}
                    size={200}
                    ringColor="#1ed760"
                  />
                </div>

                <div className="text-center font-mono space-y-0.5">
                  <span className="text-[10px] text-[#b3b3b3] uppercase">Booking Reference</span>
                  <p className="text-base font-black text-[#1ed760] tracking-wider">
                    {selectedTicket?.bookingRef}
                  </p>
                </div>
              </ModalBody>
              <ModalFooter className="border-t border-[#282828]">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 bg-[#1ed760] hover:bg-[#1fdf64] text-black font-bold text-xs uppercase tracking-[1.4px] rounded-full hover:scale-105 transition-transform cursor-pointer"
                >
                  Close Pass
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          5. FILTER RESERVATIONS MODAL (TRANSPARENT BACKDROP BLUR)
          ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        backdrop="blur"
        size="lg"
        className="bg-[#181818] text-white rounded-3xl border border-[#282828] shadow-2xl max-w-lg"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="border-b border-[#282828] flex items-center justify-between pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#1ed760]/20 flex items-center justify-center text-[#1ed760]">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Filter Reservations</h3>
                    <p className="text-xs text-[#b3b3b3]">Refine your ticket library by date & status</p>
                  </div>
                </div>
              </ModalHeader>

              <ModalBody className="py-6 space-y-6">
                {/* 1. Date Range Presets (Solid borderless pills) */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3]">
                    Date Range Preset
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                    {[
                      { id: 'all', label: 'All Dates' },
                      { id: 'upcoming', label: 'Upcoming' },
                      { id: 'past', label: 'Past Events' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setDateFilter(opt.id);
                          if (opt.id !== 'custom') setCustomDate('');
                        }}
                        className={`p-3 rounded-2xl transition-all cursor-pointer text-center ${
                          dateFilter === opt.id && !customDate
                            ? 'bg-white text-black font-black shadow-md'
                            : 'bg-[#1f1f1f] hover:bg-[#252525] text-[#b3b3b3] hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Custom Date Picker */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3]">
                    Specific Showtime Date
                  </label>
                  <div className="flex items-center gap-3">
                    <CalendarPicker
                      value={customDate}
                      onChange={(date) => {
                        setCustomDate(date);
                        if (date) setDateFilter('custom');
                        else setDateFilter('all');
                      }}
                      placeholder="Select Date"
                    />
                    {customDate && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomDate('');
                          setDateFilter('all');
                        }}
                        className="text-xs text-[#f3727f] hover:underline font-bold cursor-pointer"
                      >
                        Clear date
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. Booking Status Filter (Solid borderless pills) */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3]">
                    Ticket Status
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                    {[
                      { id: 'all', label: 'All Passes' },
                      { id: 'confirmed', label: 'Confirmed' },
                      { id: 'cancelled', label: 'Cancelled' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setStatusFilter(opt.id)}
                        className={`p-3 rounded-2xl transition-all cursor-pointer text-center ${
                          statusFilter === opt.id
                            ? 'bg-white text-black font-black shadow-md'
                            : 'bg-[#1f1f1f] hover:bg-[#252525] text-[#b3b3b3] hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </ModalBody>

              <ModalFooter className="border-t border-[#282828] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setDateFilter('all');
                    setCustomDate('');
                    setStatusFilter('all');
                  }}
                  className="text-xs text-[#b3b3b3] hover:text-white font-bold cursor-pointer"
                >
                  Reset All Filters
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-xs uppercase tracking-wider rounded-full hover:scale-105 transition-all shadow-md cursor-pointer"
                >
                  Apply Filters
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

