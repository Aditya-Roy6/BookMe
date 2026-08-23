import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import {
  NormalSeatSvg,
  ReclinerSeatSvg,
  LeftSpeakerWave,
  RightSpeakerWave,
  AisleStairsGraphic,
  AuditoriumScreen3D,
} from './SeatSelection';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  QrCode,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';

export default function BookedSeatsView() {
  const { id: bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [seatMapData, setSeatMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Custom Floating Tooltip State (Replaces native browser tooltips)
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // 1. Fetch user bookings to find this specific booking
        const res = await api.get('/bookings/my-bookings');
        const found = (res.data.bookings || []).find((b) => b.id === bookingId);

        if (!found) {
          setError('Booking reservation not found in your library.');
          setLoading(false);
          return;
        }
        setBooking(found);

        // 2. Fetch full showtime seat map layout
        const mapRes = await api.get(`/showtimes/${found.showtimeId}/seats`);
        setSeatMapData(mapRes.data);
      } catch (err) {
        console.error('Failed to load booked seat map view:', err);
        setError('Failed to load seat layout. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3 text-[#b3b3b3]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1ed760]" />
        <p className="text-sm font-bold">Rendering auditorium seating map...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 bg-[#181818] rounded-3xl border border-[#282828] text-center space-y-4 text-white">
        <AlertCircle className="w-10 h-10 text-[#f3727f] mx-auto" />
        <h2 className="text-lg font-black">{error || 'Booking Not Found'}</h2>
        <Link
          to="/my-bookings"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1ed760] text-black font-bold text-xs uppercase tracking-wider rounded-full hover:scale-105 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Tickets</span>
        </Link>
      </div>
    );
  }

  const ev = booking.showtime?.event;
  const st = booking.showtime;
  const venue = seatMapData?.venue || ev?.venue || st?.venue;
  const pricing = st?.pricing || seatMapData?.showtime?.pricing || {};

  const userSeatIds = (booking.items || []).map((i) => i.seatId || i.seat?.id);
  const userSeatLabels = (booking.items || []).map((i) => i.seat?.label).filter(Boolean);

  const seats = seatMapData?.seats || [];
  const rowsMap = new Map();
  seats.forEach((s) => {
    if (!rowsMap.has(s.row)) rowsMap.set(s.row, []);
    rowsMap.get(s.row).push(s);
  });
  const sortedRows = Array.from(rowsMap.keys()).sort((a, b) => a - b);

  const handleMouseEnter = (e, seat, isMySeat) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const seatPrice = seat.price || pricing[seat.categoryId] || seat.category?.price;
    const catName = seat.categoryName || seat.category?.name || 'Standard Tier';

    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top - 20, // 20px above seat to ensure zero overlap!
      label: seat.label,
      categoryName: catName,
      status: isMySeat ? 'Your Reserved Seat' : seat.status === 'booked' ? 'Booked' : 'Available',
      price: seatPrice,
      isMySeat,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="w-full min-h-[calc(100vh-60px)] px-4 sm:px-8 pt-4 pb-24 space-y-6 bg-[#121212] text-white font-sans relative">
      {/* ─── TOP HEADER BAR ─── */}
      <div className="w-full bg-[#181818] p-5 sm:p-6 rounded-3xl border border-[#282828] shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <Link
            to="/my-bookings"
            className="w-10 h-10 rounded-full bg-[#252525] hover:bg-[#333333] flex items-center justify-center text-white transition-all flex-shrink-0 cursor-pointer border border-white/5 shadow-md"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {ev?.imageUrl && (
            <img
              src={ev.imageUrl}
              alt={ev.title}
              onError={(e) => {
                e.currentTarget.src =
                  'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=780&q=80';
              }}
              className="w-14 h-18 sm:w-16 sm:h-20 rounded-xl object-cover border border-white/10 flex-shrink-0 shadow-md hidden sm:block"
            />
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-[#1ed760] tracking-wider block">
                Auditorium Seating View
              </span>
              <span className="text-[10px] font-mono text-[#7c7c7c]">
                Ref: {booking.bookingRef}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {ev?.title || 'Screening Experience'}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#b3b3b3]">
              <span className="flex items-center gap-1 text-white font-bold">
                <MapPin className="w-3.5 h-3.5 text-[#1ed760]" /> {venue?.name || 'Main Stage'}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#1ed760]" />
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
              {st?.format && (
                <>
                  <span>&bull;</span>
                  <span className="text-[#1ed760] font-bold">{st.format}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Your Seats Highlight + QR CTA */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-white/5">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-[#7c7c7c] block">
              Your Reserved Seats
            </span>
            <div className="flex flex-wrap gap-1.5">
              {userSeatLabels.map((lbl) => (
                <span
                  key={lbl}
                  className="px-3 py-1 bg-[#1ed760] text-black font-mono font-black text-xs rounded-full shadow-md"
                >
                  {lbl}
                </span>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setQrModalOpen(true)}
            className="px-6 py-2.5 btn-high-contrast text-xs font-black uppercase tracking-[1.4px] rounded-full hover:scale-105 transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>View QR Pass</span>
          </button>
        </div>
      </div>

      {/* ─── FULL AUDITORIUM SEATING MAP ENGINE ─── */}
      <div className="w-full bg-[#181818] p-6 sm:p-10 rounded-3xl border border-[#282828] shadow-2xl space-y-8">
        {/* 3D Curved Perspective Cinema Screen */}
        <AuditoriumScreen3D />

        {/* Authentic Seating Grid with Exact Category Dividers (No browser tooltips) */}
        <div className="overflow-x-auto w-full flex justify-center pb-6">
          <div className="space-y-4 min-w-[760px]">
            {sortedRows.map((rowNum, rowIndex) => {
              const rowSeats = rowsMap.get(rowNum) || [];
              const rowLetter = String.fromCharCode(64 + rowNum);
              const firstSeat = rowSeats[0];
              const isRecliner =
                firstSeat?.categoryName?.toLowerCase().includes('recliner') ||
                firstSeat?.category?.name?.toLowerCase().includes('recliner') ||
                firstSeat?.categoryName?.toLowerCase().includes('balcony') ||
                firstSeat?.category?.name?.toLowerCase().includes('balcony') ||
                firstSeat?.categoryName?.toLowerCase().includes('vip') ||
                firstSeat?.category?.name?.toLowerCase().includes('vip') ||
                firstSeat?.categoryName?.toLowerCase().includes('box') ||
                firstSeat?.category?.name?.toLowerCase().includes('box');

              const prevRowSeats = rowIndex > 0 ? rowsMap.get(sortedRows[rowIndex - 1]) : null;
              const isCategoryHeader =
                rowIndex === 0 ||
                (prevRowSeats &&
                  (prevRowSeats[0]?.categoryId !== firstSeat?.categoryId ||
                    prevRowSeats[0]?.category?.name !== firstSeat?.category?.name));

              const totalCols = rowSeats.length;
              const leftBankCutoff = Math.floor(totalCols / 2);
              const showSpeaker = rowIndex % 2 === 1 || rowIndex === sortedRows.length - 1;

              const catPrice = firstSeat?.price || pricing[firstSeat?.categoryId] || firstSeat?.category?.price || 25;
              const catTitle = firstSeat?.categoryName || firstSeat?.category?.name || 'Standard Tier';

              return (
                <React.Fragment key={rowNum}>
                  {/* Category Header Divider Pill */}
                  {isCategoryHeader && (
                    <div className="flex items-center justify-center gap-3 my-3">
                      <div className="h-[1px] flex-1 bg-[#282828]" />
                      <span className="text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 bg-[#1f1f1f] text-[#b3b3b3] rounded-full border border-[#333333]">
                        {catTitle} &bull; ₹{catPrice}
                        {isRecliner ? ' (VIP RECLINER)' : ''}
                      </span>
                      <div className="h-[1px] flex-1 bg-[#282828]" />
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 sm:gap-3">
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
                          <div
                            key={seat.id}
                            className="relative group/seat mx-1"
                            onMouseEnter={(e) => handleMouseEnter(e, seat, isMySeat)}
                            onMouseLeave={handleMouseLeave}
                          >
                            <div
                              className={`flex items-center justify-center select-none transition-all duration-100 ${
                                isRecliner ? 'w-13 h-16 sm:w-15 sm:h-18' : 'w-10 h-10 sm:w-12 sm:h-12'
                              } ${
                                isMySeat
                                  ? 'scale-110 z-10'
                                  : seat.status === 'booked'
                                  ? 'opacity-25'
                                  : 'opacity-80 hover:opacity-100 hover:scale-105'
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
                          <div
                            key={seat.id}
                            className="relative group/seat mx-1"
                            onMouseEnter={(e) => handleMouseEnter(e, seat, isMySeat)}
                            onMouseLeave={handleMouseLeave}
                          >
                            <div
                              className={`flex items-center justify-center select-none transition-all duration-100 ${
                                isRecliner ? 'w-13 h-16 sm:w-15 sm:h-18' : 'w-10 h-10 sm:w-12 sm:h-12'
                              } ${
                                isMySeat
                                  ? 'scale-110 z-10'
                                  : seat.status === 'booked'
                                  ? 'opacity-25'
                                  : 'opacity-80 hover:opacity-100 hover:scale-105'
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
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Authentic Seat Map Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 border-t border-[#282828] text-xs font-bold">
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

      {/* ─── CUSTOM FLOATING DARK TOOLTIP (REPLACES NATIVE BROWSER TOOLTIP) ─── */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
          className="bg-[#1f1f1f] text-white border border-[#383838] px-3.5 py-1.5 rounded-xl shadow-2xl text-[11px] font-sans whitespace-nowrap animate-in fade-in zoom-in-95 duration-100 flex items-center gap-2 pointer-events-none"
        >
          <span className="font-mono font-black text-white">Seat {tooltip.label}</span>
          <span className="text-[#7c7c7c]">&bull;</span>
          <span className={tooltip.isMySeat ? 'text-[#1ed760] font-black' : tooltip.status === 'Booked' ? 'text-[#7c7c7c]' : 'text-white font-bold'}>
            {tooltip.status}
          </span>
          {tooltip.price && (
            <>
              <span className="text-[#7c7c7c]">&bull;</span>
              <span className="text-[#1ed760] font-mono font-bold">₹{tooltip.price}</span>
            </>
          )}
          {tooltip.categoryName && (
            <>
              <span className="text-[#7c7c7c]">&bull;</span>
              <span className="text-amber-400 font-bold">{tooltip.categoryName}</span>
            </>
          )}
        </div>
      )}

      {/* ─── QR PASS MODAL ─── */}
      <Modal
        isOpen={qrModalOpen}
        onOpenChange={setQrModalOpen}
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
                  <h3 className="text-lg font-black text-white">{ev?.title}</h3>
                  <p className="text-xs text-[#b3b3b3]">{venue?.name}</p>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-xl">
                  <img
                    src={booking.qrCodeUrl}
                    alt="Admission QR"
                    className="w-48 h-48 object-contain"
                  />
                </div>

                <div className="text-center font-mono space-y-0.5">
                  <span className="text-[10px] text-[#b3b3b3] uppercase">Booking Reference</span>
                  <p className="text-base font-black text-[#1ed760] tracking-wider">
                    {booking.bookingRef}
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
    </div>
  );
}