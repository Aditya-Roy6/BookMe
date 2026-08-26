const {
  sequelize,
  Booking,
  BookingItem,
  SeatStatus,
  Seat,
  Showtime,
  Event,
  Venue,
  SeatCategory,
  User,
  Waitlist,
} = require('../models');
const { Op } = require('sequelize');
const redis = require('../config/redis');
const { generateBookingQRCode } = require('./qrcode');
const { sendBookingConfirmation, sendCancellationNotice } = require('./email');
const { processNextInQueue } = require('./waitlist');

/**
 * Generate a clean, unique booking reference string
 */
function generateReference() {
  const prefix = 'LMTX';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Create a confirmed booking for held seats
 */
async function createBooking(customerId, showtimeId, seatIds, paymentDetails = {}) {
  if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
    const error = new Error('seatIds must be a non-empty array');
    error.statusCode = 400;
    throw error;
  }

  // 1. Fetch showtime with pricing and event details
  const showtime = await Showtime.findByPk(showtimeId, {
    include: [
      {
        model: Event,
        as: 'event',
        include: [{ model: Venue, as: 'venue' }],
      },
    ],
  });

  if (!showtime) {
    const error = new Error('Showtime not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Fetch user
  const user = await User.findByPk(customerId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // 3. Verify user holds all requested seats
  const pricing = showtime.pricing || {};
  const seats = await Seat.findAll({
    where: { id: { [Op.in]: seatIds } },
    include: [{ model: SeatCategory, as: 'category' }],
  });

  if (seats.length !== seatIds.length) {
    const error = new Error('One or more seat IDs are invalid');
    error.statusCode = 400;
    throw error;
  }

  // Check Redis or DB holds
  const now = new Date();
  for (const seatId of seatIds) {
    let heldUser = null;
    try {
      const redisKey = `hold:${showtimeId}:${seatId}`;
      heldUser = await redis.get(redisKey);
    } catch (rErr) {
      // Non-fatal fallback to PostgreSQL SeatStatus
    }

    const dbStatus = await SeatStatus.findOne({
      where: { showtimeId, seatId },
    });

    if (dbStatus && dbStatus.status === 'booked') {
      const error = new Error(`Seat ${seatId} is already booked`);
      error.statusCode = 409;
      throw error;
    }

    // Must be held by this user either in Redis or DB (with valid expiry)
    const isHeldInRedis = heldUser === customerId;
    const isHeldInDb = dbStatus && dbStatus.status === 'held' && dbStatus.heldBy === customerId && dbStatus.holdExpiresAt && new Date(dbStatus.holdExpiresAt) > now;

    if (!isHeldInRedis && !isHeldInDb) {
      const error = new Error(`Seat ${seatId} is not held by you or your hold has expired`);
      error.statusCode = 403;
      throw error;
    }
  }

  // 4. Calculate total amount
  let totalAmount = 0;
  const bookingItemsData = [];

  for (const seat of seats) {
    const price = pricing[seat.categoryId] ? Number(pricing[seat.categoryId]) : 0;
    totalAmount += price;
    bookingItemsData.push({
      seatId: seat.id,
      price,
    });
  }

  // 5. Execute transactional booking creation
  const bookingRef = generateReference();
  const qrCodeUrl = await generateBookingQRCode(bookingRef, {
    showtimeId,
    seats: seats.map(s => s.label),
    customer: user.name,
    imageUrl: showtime?.event?.imageUrl,
  });

  const result = await sequelize.transaction(async (t) => {
    // Create Booking
    const booking = await Booking.create(
      {
        customerId,
        showtimeId,
        bookingRef,
        totalAmount,
        qrCodeUrl,
        status: 'confirmed',
      },
      { transaction: t }
    );

    // Create BookingItems
    for (const item of bookingItemsData) {
      await BookingItem.create(
        {
          bookingId: booking.id,
          seatId: item.seatId,
          price: item.price,
        },
        { transaction: t }
      );
    }

    // Update SeatStatus to 'booked'
    await SeatStatus.update(
      {
        status: 'booked',
        heldBy: null,
        holdExpiresAt: null,
      },
      {
        where: {
          showtimeId,
          seatId: { [Op.in]: seatIds },
        },
        transaction: t,
      }
    );

    // If customer had an active waitlist entry for this showtime, fulfill it
    await Waitlist.update(
      { status: 'fulfilled' },
      {
        where: {
          customerId,
          showtimeId,
          status: { [Op.in]: ['waiting', 'offered'] },
        },
        transaction: t,
      }
    );

    return booking;
  });

  // 6. Delete Redis holds
  try {
    for (const seatId of seatIds) {
      await redis.del(`hold:${showtimeId}:${seatId}`);
    }
  } catch (rErr) {
    // Non-fatal
  }

  // 7. Send confirmation email (async)
  const fullItems = seats.map((s, idx) => ({
    seat: s,
    seatId: s.id,
    price: bookingItemsData[idx].price,
  }));
  sendBookingConfirmation(user, result, showtime, fullItems, qrCodeUrl).catch(() => {});

  // 8. Broadcast SSE seat update
  try {
    const sse = require('../sse/seatUpdates');
    if (sse && typeof sse.broadcastSeatUpdate === 'function') {
      sse.broadcastSeatUpdate(showtimeId, {
        type: 'SEATS_BOOKED',
        seatIds,
      });
    }
  } catch (err) {}

  return {
    booking: result,
    items: fullItems,
    bookingRef,
    qrCodeUrl,
    totalAmount,
  };
}

/**
 * Cancel a booking and automatically cascade released seats to the waitlist queue!
 */
async function cancelBooking(bookingId, customerId, isAdmin = false) {
  const booking = await Booking.findByPk(bookingId, {
    include: [
      {
        model: BookingItem,
        as: 'items',
        include: [{ model: Seat, as: 'seat' }],
      },
      {
        model: Showtime,
        as: 'showtime',
        include: [
          {
            model: Event,
            as: 'event',
            include: [{ model: Venue, as: 'venue' }],
          },
        ],
      },
      { model: User, as: 'customer' },
    ],
  });

  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (booking.customerId !== customerId && !isAdmin) {
    const error = new Error('You are not authorized to cancel this booking');
    error.statusCode = 403;
    throw error;
  }

  if (booking.status === 'cancelled') {
    const error = new Error('Booking is already cancelled');
    error.statusCode = 400;
    throw error;
  }

  const showtimeId = booking.showtimeId;
  const seatIds = booking.items.map(i => i.seatId);

  // 1. Transaction to update booking status and seat statuses
  await sequelize.transaction(async (t) => {
    await booking.update({ status: 'cancelled' }, { transaction: t });

    await SeatStatus.update(
      {
        status: 'available',
        heldBy: null,
        holdExpiresAt: null,
      },
      {
        where: {
          showtimeId,
          seatId: { [Op.in]: seatIds },
        },
        transaction: t,
      }
    );
  });

  // Ensure any lingering Redis keys for these seats are explicitly removed
  try {
    for (const sId of seatIds) {
      await redis.del(`hold:${showtimeId}:${sId}`);
    }
  } catch (rErr) {
    // Non-fatal
  }

  // 2. Automated Waitlist Cascade for each released seat
  const waitlistOffers = [];
  for (const item of booking.items) {
    const seat = item.seat;
    if (seat && seat.categoryId) {
      const offer = await processNextInQueue(showtimeId, seat.categoryId, seat.id);
      if (offer) {
        waitlistOffers.push(offer);
      }
    }
  }

  // 3. Send cancellation email
  if (booking.customer) {
    sendCancellationNotice(booking.customer, booking, booking.showtime).catch(() => {});
  }

  // 4. Broadcast SSE
  try {
    const sse = require('../sse/seatUpdates');
    if (sse && typeof sse.broadcastSeatUpdate === 'function') {
      sse.broadcastSeatUpdate(showtimeId, {
        type: 'SEATS_RELEASED',
        seatIds,
      });
    }
  } catch (err) {}

  return {
    success: true,
    message: 'Booking cancelled successfully',
    bookingId: booking.id,
    releasedSeats: seatIds,
    waitlistOffersCreated: waitlistOffers.length,
    waitlistOffers,
  };
}

/**
 * Get booking history for a customer
 */
async function getCustomerBookings(customerId) {
  return await Booking.findAll({
    where: { customerId },
    include: [
      {
        model: BookingItem,
        as: 'items',
        include: [{ model: Seat, as: 'seat', include: [{ model: SeatCategory, as: 'category' }] }],
      },
      {
        model: Showtime,
        as: 'showtime',
        include: [
          {
            model: Event,
            as: 'event',
            include: [{ model: Venue, as: 'venue' }],
          },
        ],
      },
    ],
    order: [['created_at', 'DESC']],
  });
}

/**
 * Get organiser analytics & revenue per event
 */
async function getOrganiserMetrics(organiserId) {
  const events = await Event.findAll({
    where: { organiserId },
    include: [
      {
        model: Showtime,
        as: 'showtimes',
        include: [
          {
            model: Booking,
            as: 'bookings',
            where: { status: 'confirmed' },
            required: false,
            include: [{ model: BookingItem, as: 'items' }],
          },
          {
            model: Waitlist,
            as: 'waitlist',
            where: { status: 'waiting' },
            required: false,
          },
          {
            model: Venue,
            as: 'venue',
            required: false,
          },
        ],
      },
      { model: Venue, as: 'venue' },
    ],
    order: [['created_at', 'DESC']],
  });

  let totalOrganiserRevenue = 0;
  let totalTicketsSold = 0;

  const eventSummaries = events.map((event) => {
    let eventRevenue = 0;
    let eventTicketsSold = 0;
    let eventWaitlistCount = 0;

    const showtimeSummaries = (event.showtimes || []).map((showtime) => {
      let showtimeRevenue = 0;
      let showtimeTickets = 0;

      for (const booking of showtime.bookings || []) {
        showtimeRevenue += Number(booking.totalAmount);
        showtimeTickets += (booking.items || []).length;
      }

      const showtimeWaitlist = (showtime.waitlist || []).length;
      const targetVenue = showtime.venue || event.venue;
      const totalSeats = targetVenue ? targetVenue.totalRows * targetVenue.totalCols : 112;
      const capacityPercent = totalSeats > 0 ? Math.round((showtimeTickets / totalSeats) * 100) : 0;

      eventRevenue += showtimeRevenue;
      eventTicketsSold += showtimeTickets;
      eventWaitlistCount += showtimeWaitlist;

      return {
        showtimeId: showtime.id,
        dateTime: showtime.dateTime,
        language: showtime.language || 'ENGLISH',
        format: showtime.format || 'DOLBY ATMOS',
        screen: showtime.screen || 'AUDI 1',
        venueName: targetVenue ? targetVenue.name : 'Main Theatre',
        revenue: showtimeRevenue,
        ticketsSold: showtimeTickets,
        totalSeats,
        capacityPercent,
        waitlistCount: showtimeWaitlist,
      };
    });

    totalOrganiserRevenue += eventRevenue;
    totalTicketsSold += eventTicketsSold;

    return {
      eventId: event.id,
      title: event.title,
      type: event.type,
      imageUrl: event.imageUrl,
      backdropUrl: event.backdropUrl,
      ageRating: event.ageRating || event.rating,
      venueName: event.venue?.name,
      totalRevenue: eventRevenue,
      totalTicketsSold: eventTicketsSold,
      totalWaitlist: eventWaitlistCount,
      showtimes: showtimeSummaries,
    };
  });

  // Fetch recent confirmed bookings for organiser's events (up to 100 transactions)
  const eventIds = events.map(e => e.id);
  const showtimeIds = events.flatMap(e => (e.showtimes || []).map(s => s.id));

  const recentBookingsRaw = await Booking.findAll({
    where: {
      showtimeId: { [Op.in]: showtimeIds },
    },
    include: [
      { model: User, as: 'customer', attributes: ['id', 'name', 'email'] },
      {
        model: Showtime,
        as: 'showtime',
        include: [
          { model: Event, as: 'event', attributes: ['id', 'title', 'imageUrl', 'type'] },
          { model: Venue, as: 'venue', attributes: ['id', 'name'] },
        ],
      },
      {
        model: BookingItem,
        as: 'items',
        include: [{ model: Seat, as: 'seat', attributes: ['id', 'label', 'row', 'col'] }],
      },
    ],
    order: [['created_at', 'DESC']],
    limit: 100,
  });

  const recentBookings = recentBookingsRaw.map(b => ({
    id: b.id,
    bookingRef: b.bookingRef,
    customerName: b.customer?.name || 'Anonymous Fan',
    customerEmail: b.customer?.email,
    eventTitle: b.showtime?.event?.title || 'Live Experience',
    eventImageUrl: b.showtime?.event?.imageUrl,
    venueName: b.showtime?.venue?.name || 'Main Stage',
    showtimeDate: b.showtime?.dateTime,
    seats: (b.items || []).map(i => i.seat?.label).filter(Boolean),
    seatCount: (b.items || []).length,
    totalAmount: Number(b.totalAmount),
    status: b.status,
    createdAt: b.createdAt,
  }));

  // Build 7-day daily trend aggregation across all showtimes
  const daysMap = new Map();
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
    daysMap.set(iso, { date: iso, dayName, revenue: 0, tickets: 0 });
  }

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const pastWeekBookings = await Booking.findAll({
    where: {
      showtimeId: { [Op.in]: showtimeIds },
      status: 'confirmed',
      created_at: { [Op.gte]: sevenDaysAgo },
    },
    include: [{ model: BookingItem, as: 'items' }],
  });

  for (const b of pastWeekBookings) {
    const iso = new Date(b.createdAt).toISOString().split('T')[0];
    if (daysMap.has(iso)) {
      const entry = daysMap.get(iso);
      entry.revenue += Number(b.totalAmount);
      entry.tickets += (b.items || []).length;
    }
  }

  const dailyTrend = Array.from(daysMap.values());

  return {
    totalRevenue: totalOrganiserRevenue,
    totalTicketsSold,
    totalEvents: events.length,
    events: eventSummaries,
    dailyTrend,
    recentBookings,
  };
}

module.exports = {
  createBooking,
  cancelBooking,
  getCustomerBookings,
  getOrganiserMetrics,
};
