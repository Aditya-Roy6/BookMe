const { Waitlist, SeatStatus, Seat, Showtime, SeatCategory, User, Event, Venue } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const redis = require('../config/redis');

const DEFAULT_OFFER_TTL_SECONDS = parseInt(process.env.WAITLIST_OFFER_TTL_SECONDS || '900', 10); // 15 mins

/**
 * Join the waitlist for a specific category of a showtime.
 * Only succeeds if that category is actually sold out (0 available seats).
 */
async function joinWaitlist(customerId, showtimeId, categoryId) {
  // 1. Verify showtime & category exist
  const showtime = await Showtime.findByPk(showtimeId, {
    include: [{ model: Event, as: 'event' }],
  });
  if (!showtime) {
    const error = new Error('Showtime not found');
    error.statusCode = 404;
    throw error;
  }

  const category = await SeatCategory.findOne({
    where: { id: categoryId, venueId: showtime.event.venueId },
  });
  if (!category) {
    const error = new Error('Seat category not found in venue');
    error.statusCode = 404;
    throw error;
  }

  // 2. Check if category is sold out
  // Find all seats in this category
  const seatsInCategory = await Seat.findAll({
    where: { venueId: showtime.event.venueId, categoryId },
  });
  const seatIds = seatsInCategory.map(s => s.id);

  const dbStatuses = await SeatStatus.findAll({
    where: {
      showtimeId,
      seatId: { [Op.in]: seatIds },
    },
  });

  // Check how many seats are truly available (not booked and not held in Redis/DB)
  const now = new Date();
  let availableCount = 0;
  for (const s of dbStatuses) {
    if (s.status === 'booked') continue;
    let isHeldInRedis = false;
    try {
      const redisKey = `hold:${showtimeId}:${s.seatId}`;
      isHeldInRedis = await redis.exists(redisKey);
    } catch (rErr) {}

    const isHeldInDb = s.status === 'held' && s.holdExpiresAt && new Date(s.holdExpiresAt) > now;
    if (!isHeldInRedis && !isHeldInDb && s.status === 'available') {
      availableCount++;
    }
  }

  if (availableCount > 0) {
    const error = new Error(`Category '${category.name}' is not sold out (${availableCount} seats still available)`);
    error.statusCode = 400;
    throw error;
  }

  // 3. Check if user already has an active waitlist entry
  const existing = await Waitlist.findOne({
    where: {
      customerId,
      showtimeId,
      categoryId,
      status: { [Op.in]: ['waiting', 'offered'] },
    },
  });
  if (existing) {
    const error = new Error('You are already on the waitlist for this category');
    error.statusCode = 409;
    throw error;
  }

  // 4. Determine next position in queue (FIFO)
  const maxPosition = await Waitlist.max('position', {
    where: { showtimeId, categoryId },
  });
  const position = (maxPosition || 0) + 1;

  const entry = await Waitlist.create({
    customerId,
    showtimeId,
    categoryId,
    position,
    status: 'waiting',
  });

  return {
    success: true,
    waitlistEntry: entry,
    position,
    message: `Added to waitlist at position #${position}`,
  };
}

/**
 * Process next waiting customer in the queue when a seat becomes available.
 */
async function processNextInQueue(showtimeId, categoryId, seatId, offerTtlSeconds = DEFAULT_OFFER_TTL_SECONDS) {
  // Find next customer with status 'waiting' ordered by position ASC
  const nextInLine = await Waitlist.findOne({
    where: {
      showtimeId,
      categoryId,
      status: 'waiting',
    },
    order: [['position', 'ASC']],
    include: [{ model: User, as: 'customer' }],
  });

  if (!nextInLine) {
    // No one waiting, seat remains available
    return null;
  }

  const offerToken = uuidv4();
  const offerExpiresAt = new Date(Date.now() + offerTtlSeconds * 1000);

  // Reserve the seat for this user in Redis and DB
  const holdKey = `hold:${showtimeId}:${seatId}`;
  try {
    await redis.set(holdKey, nextInLine.customerId, 'EX', offerTtlSeconds);
  } catch (rErr) {}

  await SeatStatus.update(
    {
      status: 'held',
      heldBy: nextInLine.customerId,
      holdExpiresAt: offerExpiresAt,
    },
    {
      where: { showtimeId, seatId },
    }
  );

  // Update waitlist record
  await nextInLine.update({
    status: 'offered',
    offerToken,
    offerExpiresAt,
  });

  // Store offer metadata in Redis for fast lookup
  try {
    await redis.set(
      `waitlist_offer:${offerToken}`,
      JSON.stringify({
        waitlistId: nextInLine.id,
        customerId: nextInLine.customerId,
        showtimeId,
        categoryId,
        seatId,
        offerExpiresAt,
      }),
      'EX',
      offerTtlSeconds
    );
  } catch (rErr) {}

  // Send waitlist offer email via email service
  try {
    const { sendWaitlistOfferEmail } = require('./email');
    const showtime = await Showtime.findByPk(showtimeId, {
      include: [{ model: Event, as: 'event' }],
    });
    if (typeof sendWaitlistOfferEmail === 'function' && nextInLine.customer) {
      await sendWaitlistOfferEmail(
        nextInLine.customer,
        showtime,
        offerToken,
        offerExpiresAt
      );
    }
  } catch (err) {
    // Log non-fatal email error
    console.warn('Email dispatch warning for waitlist offer:', err.message);
  }

  return {
    offeredTo: nextInLine.customerId,
    offerToken,
    seatId,
    offerExpiresAt,
    waitlistId: nextInLine.id,
  };
}

/**
 * Check or claim a time-limited waitlist offer.
 */
async function getOfferDetails(offerToken) {
  const waitlistEntry = await Waitlist.findOne({
    where: { offerToken },
    include: [
      { model: User, as: 'customer' },
      {
        model: Showtime,
        as: 'showtime',
        include: [{ model: Event, as: 'event', include: [{ model: Venue, as: 'venue' }] }],
      },
      { model: SeatCategory, as: 'category' },
    ],
  });

  if (!waitlistEntry) {
    const error = new Error('Offer not found or invalid token');
    error.statusCode = 404;
    throw error;
  }

  const isExpired = new Date() > new Date(waitlistEntry.offerExpiresAt);
  if (isExpired && waitlistEntry.status === 'offered') {
    // Mark as expired and cascade to next in line!
    await handleExpiredOffer(waitlistEntry);
    const error = new Error('This time-limited offer has expired');
    error.statusCode = 410; // Gone
    throw error;
  }

  return waitlistEntry;
}

/**
 * Handle an expired offer by cascading the seat to the next person in line.
 */
async function handleExpiredOffer(waitlistEntry) {
  await waitlistEntry.update({ status: 'expired' });

  // Find the seat currently held for this offer
  let seatId = null;
  try {
    const cachedDataStr = await redis.get(`waitlist_offer:${waitlistEntry.offerToken}`);
    if (cachedDataStr) {
      const parsed = JSON.parse(cachedDataStr);
      seatId = parsed.seatId;
      await redis.del(`waitlist_offer:${waitlistEntry.offerToken}`);
      await redis.del(`hold:${waitlistEntry.showtimeId}:${seatId}`);
    }
  } catch (rErr) {}

  if (seatId) {
    // Cascade to next customer in queue
    return await processNextInQueue(waitlistEntry.showtimeId, waitlistEntry.categoryId, seatId);
  }
  return null;
}

module.exports = {
  joinWaitlist,
  processNextInQueue,
  getOfferDetails,
  handleExpiredOffer,
  DEFAULT_OFFER_TTL_SECONDS,
};
