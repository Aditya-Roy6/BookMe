import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import TTLTimer from '../components/TTLTimer';
import { ReceiptPrinter } from '../components/ReceiptPrinter';
import FancyQRCode from '../components/FancyQRCode';
import Select from '../components/Select';
import {
  Ticket,
  CheckCircle2,
  Calendar,
  MapPin,
  CreditCard,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Armchair,
  Sparkles,
} from 'lucide-react';

export default function Checkout() {
  const { id: showtimeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const passedSeats = location.state?.seats || [];
  const passedShowtime = location.state?.showtime || null;

  const [loading, setLoading] = useState(!passedSeats.length || !passedShowtime);
  const [submitting, setSubmitting] = useState(false);
  const [showtime, setShowtime] = useState(passedShowtime);
  const [heldSeats, setHeldSeats] = useState(passedSeats);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [error, setError] = useState('');

  const [printerStage, setPrinterStage] = useState('processing');

  const INDIAN_STATES = [
    { code: 'MH', name: 'Maharashtra' },
    { code: 'DL', name: 'Delhi NCR' },
    { code: 'KA', name: 'Karnataka' },
    { code: 'TS', name: 'Telangana' },
    { code: 'TN', name: 'Tamil Nadu' },
    { code: 'UP', name: 'Uttar Pradesh' },
    { code: 'WB', name: 'West Bengal' },
    { code: 'GJ', name: 'Gujarat' },
    { code: 'RJ', name: 'Rajasthan' },
    { code: 'KL', name: 'Kerala' },
    { code: 'PB', name: 'Punjab' },
    { code: 'HR', name: 'Haryana' },
    { code: 'MP', name: 'Madhya Pradesh' },
    { code: 'AP', name: 'Andhra Pradesh' },
  ];

  // Resolve Venue State (defaults to Maharashtra for Mumbai, etc.)
  const venueStateCode = React.useMemo(() => {
    const venueText = (showtime?.venueName || showtime?.event?.venue?.name || '').toLowerCase();
    if (venueText.includes('chennai') || venueText.includes('vr chennai')) return 'TN';
    if (venueText.includes('hyderabad') || venueText.includes('prasads')) return 'TS';
    if (venueText.includes('logix') || venueText.includes('noida') || venueText.includes('delhi')) return 'DL';
    if (venueText.includes('forum') || venueText.includes('bengaluru')) return 'KA';
    return 'MH';
  }, [showtime]);

  const [billingState, setBillingState] = useState('MH');

  useEffect(() => {
    if (venueStateCode) setBillingState(venueStateCode);
  }, [venueStateCode]);

  const totalAmount = heldSeats.reduce((sum, s) => sum + s.price, 0);

  // GST Calculation: 18% Entertainment Tax (9% CGST + 9% SGST for Intra-State or 18% IGST for Inter-State)
  const isIntraState = billingState === venueStateCode;
  const baseTicketAmount = Number((totalAmount / 1.18).toFixed(2));
  const totalGst = Number((totalAmount - baseTicketAmount).toFixed(2));
  const cgst = isIntraState ? Number((totalGst / 2).toFixed(2)) : 0;
  const sgst = isIntraState ? Number((totalGst / 2).toFixed(2)) : 0;
  const igst = !isIntraState ? totalGst : 0;

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.get(`/showtimes/${showtimeId}/seats`);
        setShowtime(res.data.showtime);

        const mySeats = res.data.seats.filter((s) => s.isHeldByMe);
        if (mySeats.length === 0 && (!passedSeats || passedSeats.length === 0)) {
          setError('No held seats found for this session. Your hold may have expired.');
        } else if (mySeats.length > 0) {
          setHeldSeats(mySeats);
        }
      } catch (err) {
        if (!passedSeats || passedSeats.length === 0) {
          setError(err.response?.data?.error || 'Failed to load checkout details.');
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [showtimeId]);

  // Transition printer animation when booking is confirmed
  useEffect(() => {
    if (confirmedBooking) {
      setPrinterStage('printing');
      const timer = setTimeout(() => {
        setPrinterStage('complete');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [confirmedBooking]);

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (heldSeats.length === 0) return;

    setSubmitting(true);
    setError('');

    const seatIds = heldSeats.map((s) => s.id);

    try {
      // 1. Create Razorpay Order on Backend
      const orderRes = await api.post('/bookings/razorpay/create-order', {
        showtimeId,
        seatIds,
      });

      const { orderId, amount, currency, key } = orderRes.data;

      // 2. If Razorpay SDK is loaded on window
      if (typeof window !== 'undefined' && window.Razorpay) {
        // Resolve full absolute movie poster URL
        let moviePoster =
          showtime?.eventImageUrl ||
          showtime?.imageUrl ||
          showtime?.eventBackdropUrl ||
          'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80';

        if (moviePoster.startsWith('/')) {
          moviePoster = `${window.location.origin}${moviePoster}`;
        }

        const options = {
          key: key || 'rzp_test_SSPh1IPLweU7nI',
          amount: amount,
          currency: currency || 'INR',
          name: showtime?.eventTitle || 'BooKMe Tickets',
          description: `Booking ${heldSeats.length} Seat${heldSeats.length > 1 ? 's' : ''} (${heldSeats.map((s) => s.label).join(', ')})`,
          image: moviePoster,
          ...(orderId ? { order_id: orderId } : {}),
          handler: async function (response) {
            try {
              // 3. Verify Payment on Backend
              const verifyRes = await api.post('/bookings/razorpay/verify', {
                razorpay_order_id: response.razorpay_order_id || orderId || 'order_client_direct',
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature || '',
                showtimeId,
                seatIds,
              });

              setConfirmedBooking(verifyRes.data.booking);
            } catch (vErr) {
              setError(vErr.response?.data?.error || 'Payment verification failed. Please contact support.');
            } finally {
              setSubmitting(false);
            }
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
          },
          notes: {
            showtimeId,
            eventTitle: showtime?.eventTitle || '',
          },
          theme: {
            color: '#1ed760',
            backdrop_color: 'rgba(0, 0, 0, 0.85)',
          },
          modal: {
            ondismiss: function () {
              setSubmitting(false);
            },
          },
        };

        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.on('payment.failed', function (response) {
          setError(`Payment failed: ${response.error?.description || response.error?.reason || 'Transaction could not be completed'}`);
          setSubmitting(false);
        });

        razorpayInstance.open();
      } else {
        // Fallback standard direct confirmation if Razorpay SDK blocked by browser extension
        const directRes = await api.post('/bookings', {
          showtimeId,
          seatIds,
          paymentDetails: { method: 'razorpay_direct_fallback' },
        });
        setConfirmedBooking(directRes.data.booking);
        setSubmitting(false);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Payment initialization failed. Your seat hold may have expired.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-[#b3b3b3]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1ed760]" />
        <p className="text-sm font-bold">Preparing checkout session...</p>
      </div>
    );
  }

  // ─── AUTHENTIC THERMAL TICKET PRINTER CONFIRMATION SCREEN ───
  if (confirmedBooking) {
    const showtimeDate = showtime?.dateTime ? new Date(showtime.dateTime) : new Date();

    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center py-10 px-4 space-y-8 text-white font-sans">
        {/* Animated Thermal Ticket Receipt Printer */}
        <ReceiptPrinter.Root stage={printerStage} feedMotion="stepped" className="w-full max-w-sm sm:max-w-md">
          {/* Printer Machine Chassis */}
          <ReceiptPrinter.Machine>
            <ReceiptPrinter.Header>
              <ReceiptPrinter.Status />
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#101010] rounded-full border border-white/5 text-[10px] font-mono text-[#7c7c7c]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1ed760] animate-pulse" />
                <span>BooKMe POS-80</span>
              </div>
            </ReceiptPrinter.Header>

            <ReceiptPrinter.Screen>
              <div className="flex items-center gap-3 text-left">
                {showtime?.eventImageUrl && (
                  <img
                    src={showtime.eventImageUrl}
                    alt={showtime.eventTitle}
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=780&q=80';
                    }}
                    className="w-11 h-14 object-cover rounded-lg border border-white/10 flex-shrink-0"
                  />
                )}
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex justify-between items-center text-[10px] text-[#7c7c7c] uppercase font-mono">
                    <span>TERMINAL #01</span>
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold font-mono">
                    <span className="text-white truncate max-w-[180px]">{showtime?.eventTitle}</span>
                    <span className="text-[#1ed760] font-black">₹{confirmedBooking.totalAmount}</span>
                  </div>
                  <div className="text-[10px] text-[#b3b3b3] font-mono truncate">
                    REF: <span className="text-white font-bold">{confirmedBooking.bookingRef}</span>
                  </div>
                </div>
              </div>
            </ReceiptPrinter.Screen>
          </ReceiptPrinter.Machine>

          {/* Stepped Thermal Paper Output with Jagged Edge & Real QR Code */}
          <ReceiptPrinter.Output>
            <ReceiptPrinter.Paper className="shadow-2xl">
              <div className="space-y-3 text-center text-black font-mono">
                {/* Header */}
                <div className="space-y-1 border-b border-dashed border-black/20 pb-3">
                  <span className="text-[10px] uppercase tracking-widest font-black block text-[#1db954]">
                    ★ BooKMe OFFICIAL PASS ★
                  </span>

                  {/* Movie / Show Poster Photo */}
                  {showtime?.eventImageUrl && (
                    <div className="flex justify-center py-1">
                      <div className="p-1 bg-white border border-black/20 rounded-xl shadow-sm">
                        <img
                          src={showtime.eventImageUrl}
                          alt={showtime?.eventTitle}
                          onError={(e) => {
                            e.currentTarget.src =
                              'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=780&q=80';
                          }}
                          className="w-24 h-32 sm:w-28 sm:h-36 object-cover rounded-lg"
                        />
                      </div>
                    </div>
                  )}

                  <h2 className="text-base font-black tracking-tight leading-tight uppercase pt-0.5">
                    {showtime?.eventTitle}
                  </h2>
                  <p className="text-[11px] text-black/70 font-semibold">{showtime?.venueName}</p>
                </div>

                {/* Event Schedule & Customer */}
                <div className="text-xs space-y-1 text-left py-1 text-black/80 font-mono">
                  <div className="flex justify-between">
                    <span className="text-black/50">DATE:</span>
                    <span className="font-bold">{showtimeDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/50">TIME:</span>
                    <span className="font-bold">{showtimeDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/50">GUEST:</span>
                    <span className="font-bold">{user?.name || 'Valued Customer'}</span>
                  </div>
                </div>

                {/* Itemized Reserved Seats List */}
                <div className="border-t border-b border-dashed border-black/20 py-2.5 space-y-1.5 text-left text-xs">
                  <div className="flex justify-between font-black text-[10px] text-black/50 uppercase">
                    <span>SEAT / TIER</span>
                    <span>PRICE</span>
                  </div>
                  {confirmedBooking.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs">
                      <span className="font-bold">
                        Seat {item.seat?.label || item.seatId}
                        <span className="text-[10px] font-normal text-black/60 ml-1">
                          ({item.seat?.category?.name || 'Standard'})
                        </span>
                      </span>
                      <span className="font-bold font-mono">₹{item.price}</span>
                    </div>
                  ))}
                  <div className="pt-2 mt-1 border-t border-black/10 text-xs space-y-1">
                    <div className="flex justify-between text-[11px] text-black/70">
                      <span>BASE VALUE:</span>
                      <span className="font-mono">₹{baseTicketAmount}</span>
                    </div>
                    {isIntraState ? (
                      <div className="flex justify-between text-[10px] text-black/60">
                        <span>CGST (9%) + SGST (9%):</span>
                        <span className="font-mono">₹{cgst} + ₹{sgst}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-[10px] text-black/60">
                        <span>IGST (18%):</span>
                        <span className="font-mono">₹{igst}</span>
                      </div>
                    )}
                    <div className="pt-1.5 border-t border-dashed border-black/20 flex justify-between items-center font-black text-sm">
                      <span>TOTAL AMOUNT:</span>
                      <span className="text-base font-mono">₹{confirmedBooking.totalAmount}</span>
                    </div>
                  </div>
                </div>

                {/* Real Fancy Admission QR Code with Movie Center Avatar */}
                <div className="pt-2 space-y-2 flex flex-col items-center">
                  <span className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
                    SCAN AT AUDITORIUM ENTRANCE
                  </span>

                  <FancyQRCode
                    value={`https://bookme.com/verify/${confirmedBooking.bookingRef}`}
                    imageUrl={showtime?.eventImageUrl}
                    size={175}
                    ringColor="#1ed760"
                  />

                  <div className="space-y-0.5">
                    <span className="text-[9px] text-black/50 uppercase block">Booking Reference</span>
                    <p className="text-sm font-black tracking-widest uppercase font-mono">
                      {confirmedBooking.bookingRef}
                    </p>
                  </div>
                </div>

                {/* Footer Tear-off Note */}
                <div className="pt-2 border-t border-dashed border-black/20 text-[9px] text-black/60 uppercase">
                  ★ NON-REFUNDABLE 30 MIN PRIOR TO SHOW ★
                  <div className="font-bold text-black mt-0.5">THANK YOU FOR BOOKING WITH BooKMe</div>
                </div>
              </div>
            </ReceiptPrinter.Paper>
          </ReceiptPrinter.Output>
        </ReceiptPrinter.Root>

        {/* Action Buttons Below Printer */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4 z-30">
          <Link
            to="/my-bookings"
            className="px-6 py-3 bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-xs uppercase tracking-[1.4px] rounded-full hover:scale-105 transition-all shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Ticket className="w-4 h-4" />
            <span>My Tickets Library</span>
          </Link>

          <Link
            to={`/my-bookings/${confirmedBooking.id}/seats`}
            className="px-6 py-3 bg-[#252525] hover:bg-[#333333] text-white font-bold text-xs uppercase tracking-[1.4px] rounded-full hover:scale-105 transition-all border border-white/10 flex items-center gap-2 cursor-pointer"
          >
            <Armchair className="w-4 h-4 text-[#1ed760]" />
            <span>View Reserved Seats</span>
          </Link>

          <Link
            to="/"
            className="px-6 py-3 bg-[#181818] hover:bg-[#202020] text-[#b3b3b3] hover:text-white font-bold text-xs uppercase tracking-[1.4px] rounded-full transition-colors border border-white/5 cursor-pointer"
          >
            <span>Browse More</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-6 text-white">
      {/* Top Banner with Active TTL Countdown */}
      <div className="bg-[#181818] p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <span className="text-xs uppercase font-bold text-[#1ed760] tracking-wider">
            Checkout Session
          </span>
          <h1 className="text-2xl font-black text-white">{showtime?.eventTitle}</h1>
        </div>

        {heldSeats.length > 0 && (
          <TTLTimer
            expiresAt={heldSeats[0].holdExpiresAt}
            onExpire={() => {
              setError('Hold expired. Please select your seats again.');
              setHeldSeats([]);
            }}
          />
        )}
      </div>

      {error && (
        <div className="bg-[#281818] border border-[#f3727f]/40 p-3.5 flex items-center gap-2 text-[#f3727f] text-xs font-bold rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Details Panel */}
        <div className="bg-[#181818] p-6 rounded-xl space-y-4 shadow-xl">
          <h2 className="text-lg font-bold text-white border-b border-[#282828] pb-3">
            Selected Seats
          </h2>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {heldSeats.map((seat) => (
              <div
                key={seat.id}
                className="flex items-center justify-between p-3 bg-[#1f1f1f] rounded-lg text-xs"
              >
                <div>
                  <span className="font-bold text-white text-sm">{seat.label}</span>
                  <span className="text-[#b3b3b3] ml-2">({seat.categoryName})</span>
                </div>
                <span className="font-black text-white text-sm">₹{seat.price}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-xs text-[#b3b3b3] pt-3 border-t border-[#282828]">
            <div className="flex justify-between">
              <span>Tickets Base Value:</span>
              <span className="text-white font-bold">₹{baseTicketAmount}</span>
            </div>

            {isIntraState ? (
              <>
                <div className="flex justify-between text-[11px]">
                  <span>CGST (9%):</span>
                  <span className="text-white font-bold">₹{cgst}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>SGST (9%):</span>
                  <span className="text-white font-bold">₹{sgst}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-[11px]">
                <span>Integrated GST (IGST 18%):</span>
                <span className="text-white font-bold">₹{igst}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Convenience Fee:</span>
              <span className="text-[#1ed760] font-bold">FREE (₹0.00)</span>
            </div>

            <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-[#282828]">
              <span>Total Payable:</span>
              <span className="text-2xl font-black text-[#1ed760] font-mono">
                ₹{totalAmount}
              </span>
            </div>
            <p className="text-[10px] text-[#7c7c7c] text-right font-medium">
              (Includes 18% Indian Entertainment GST)
            </p>
          </div>
        </div>

        {/* Payment Confirmation Panel */}
        <div className="bg-[#181818] p-6 rounded-xl space-y-4 shadow-xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-[#282828] pb-3">
            <CreditCard className="w-5 h-5 text-[#1ed760]" /> Guest & Billing Details
          </h2>

          <form onSubmit={handleConfirmPayment} className="space-y-4 pt-1 text-xs">
            <Select
              label="Billing State (for GST)"
              options={INDIAN_STATES.map((st) => ({
                value: st.code,
                label: `${st.name} ${st.code === venueStateCode ? '• (Venue Location)' : ''}`,
              }))}
              value={billingState}
              onChange={setBillingState}
              placeholder="Select Billing State"
            />

            <div className="space-y-1">
              <label className="text-[10px] text-[#b3b3b3] uppercase font-bold">Name</label>
              <input
                value={user?.name || ''}
                readOnly
                className="w-full bg-[#1f1f1f] px-4 py-2.5 rounded-full text-white cursor-not-allowed focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[#b3b3b3] uppercase font-bold">Email Receipt</label>
              <input
                value={user?.email || ''}
                readOnly
                className="w-full bg-[#1f1f1f] px-4 py-2.5 rounded-full text-white cursor-not-allowed focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || heldSeats.length === 0}
              className="w-full py-4 bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-xs uppercase tracking-[1.5px] rounded-full shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 mt-3 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Opening Razorpay Secure Gateway...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 text-black" />
                  <span>Pay with Razorpay (₹{totalAmount})</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-[#7c7c7c] tracking-wide pt-1">
              🔒 Instant Confirmation via Razorpay • UPI, Credit/Debit Cards, NetBanking
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

