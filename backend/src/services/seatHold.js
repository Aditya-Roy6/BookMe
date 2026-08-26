const redis = require('../config/redis');
const { Seat, SeatStatus, SeatCategory, Showtime, Venue } = require('../models');
const { Op } = require('sequelize');

const DEFAULT_TTL_SECONDS = parseInt(process.env.SEAT_HOLD_TTL_SECONDS || '600', 10);

// Redis Lua script for atomic multi-seat hold (Allows holding user to refresh/claim their hold)
const ATOMIC_HOLD_LUA = `
  -- KEYS: array of hold:{showtimeId}:{seatId}
  -- ARGV[1]: userId
  -- ARGV[2]: ttlSeconds
  for i, key in ipairs(KEYS) do
    local val = redis.call('GET', key)
    if val and val ~= ARGV[1] then
      return {0, key}
    end
  end
  for i, key in ipairs(KEYS) do
    redis.call('SET', key, ARGV[1], 'EX', ARGV[2])
  end
  return {1, ''}
`;

/**
 * Hold one or more seats for a showtime with TTL and strict concurrency protection.
 */
async function holdSeats(showtimeId, seatIds, userId, ttlSeconds = DEFAULT_TTL_SECONDS) {
  if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
    const error = new Error('seatIds must be a non-empty array');
    error.statusCode = 400;
    throw error;
  }

  // 1. Verify showtime exists
  const showtime = await Showtime.findByPk(showtimeId);
  if (!showtime) {
    const error = new Error('Showtime not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Check Database: ensure no requested seat is already booked or active-held by another user
  const now = new Date();
  const dbStatuses = await SeatStatus.findAll({
    where: {
      showtimeId,
      seatId: { [Op.in]: seatIds },
    },
  });

  const bookedSeat = dbStatuses.find(s => s.status === 'booked');
  if (bookedSeat) {
    const seatObj = await Seat.findByPk(bookedSeat.seatId);
    const label = seatObj ? seatObj.label : bookedSeat.seatId;
    const error = new Error(`Seat ${label} is already booked`);
    error.statusCode = 409;
    throw error;
  }

  const activeHeldByOther = dbStatuses.find(
    s => s.status === 'held' && s.heldBy && s.heldBy !== userId && s.holdExpiresAt && new Date(s.holdExpiresAt) > now
  );
  if (activeHeldByOther) {
    const seatObj = await Seat.findByPk(activeHeldByOther.seatId);
    const label = seatObj ? seatObj.label : activeHeldByOther.seatId;
    const error = new Error(`Seat ${label} is currently held by another user`);
    error.statusCode = 409;
    throw error;
  }

  // 3. Atomic Redis hold using Lua script (Concurrency Protection with Graceful DB Fallback)
  try {
    const keys = seatIds.map(id => `hold:${showtimeId}:${id}`);
    const [success, conflictingKey] = await redis.eval(
      ATOMIC_HOLD_LUA,
      keys.length,
      ...keys,
      userId,
      ttlSeconds.toString()
    );

    if (success !== 1) {
      const conflictSeatId = conflictingKey.split(':')[2];
      const conflictSeat = await Seat.findByPk(conflictSeatId);
      const label = conflictSeat ? conflictSeat.label : conflictSeatId;
      const error = new Error(`Seat ${label} is currently held by another user`);
      error.statusCode = 409;
      throw error;
    }
  } catch (redisErr) {
    if (redisErr.statusCode === 409) {
      throw redisErr;
    }
    console.warn('Redis hold fallback to PostgreSQL SeatStatus:', redisErr.message);
  }

  // 4. Update Database SeatStatus records
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  await SeatStatus.update(
    {
      status: 'held',
      heldBy: userId,
      holdExpiresAt: expiresAt,
    },
    {
      where: {
        showtimeId,
        seatId: { [Op.in]: seatIds },
      },
    }
  );

  // 5. Broadcast SSE update if broadcaster is available
  try {
    const sse = require('../sse/seatUpdates');
    if (sse && typeof sse.broadcastSeatUpdate === 'function') {
      sse.broadcastSeatUpdate(showtimeId, {
        type: 'SEATS_HELD',
        seatIds,
        heldBy: userId,
        expiresAt,
        ttlRemaining: ttlSeconds,
      });
    }
  } catch (err) {
    // Non-fatal if SSE is not yet initialized
  }

  return {
    success: true,
    showtimeId,
    seatIds,
    heldBy: userId,
    ttlSeconds,
    expiresAt,
  };
}

/**
 * Release held seats for a showtime.
 */
async function releaseSeats(showtimeId, seatIds, userId, isAdmin = false) {
  if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
    const error = new Error('seatIds must be a non-empty array');
    error.statusCode = 400;
    throw error;
  }

  // Verify ownership in Redis/DB with safe try-catch
  for (const seatId of seatIds) {
    try {
      const key = `hold:${showtimeId}:${seatId}`;
      const heldUser = await redis.get(key);
      if (heldUser && heldUser !== userId && !isAdmin) {
        const error = new Error(`You do not own the hold for seat ${seatId}`);
        error.statusCode = 403;
        throw error;
      }
      await redis.del(key);
    } catch (rErr) {
      if (rErr.statusCode === 403) throw rErr;
    }
  }

  // Update DB SeatStatus back to available
  const whereClause = {
    showtimeId,
    seatId: { [Op.in]: seatIds },
    status: 'held',
  };
  if (!isAdmin) {
    whereClause.heldBy = userId;
  }

  await SeatStatus.update(
    {
      status: 'available',
      heldBy: null,
      holdExpiresAt: null,
    },
    { where: whereClause }
  );

  // Broadcast SSE update
  try {
    const sse = require('../sse/seatUpdates');
    if (sse && typeof sse.broadcastSeatUpdate === 'function') {
      sse.broadcastSeatUpdate(showtimeId, {
        type: 'SEATS_RELEASED',
        seatIds,
      });
    }
  } catch (err) {
    // Non-fatal
  }

  return { success: true, releasedSeatIds: seatIds };
}

/**
 * Get all seats for a showtime with real-time status (available, held, booked),
 * remaining TTL, pricing, and category metadata.
 */
async function getShowtimeSeatMap(showtimeId, currentUserId = null) {
  const showtime = await Showtime.findByPk(showtimeId, {
    include: [
      {
        model: require('../models').Event,
        as: 'event',
        include: [
          {
            model: Venue,
            as: 'venue',
            include: [{ model: SeatCategory, as: 'categories' }],
          },
        ],
      },
    ],
  });

  if (!showtime) {
    const error = new Error('Showtime not found');
    error.statusCode = 404;
    throw error;
  }

  const venueId = showtime.venueId || showtime.event.venueId;
  const venue = showtime.venueId
    ? await Venue.findByPk(showtime.venueId, { include: [{ model: SeatCategory, as: 'categories' }] })
    : showtime.event.venue;
  const pricing = showtime.pricing || {};

  // Fetch physical seats
  const seats = await Seat.findAll({
    where: { venueId: venue.id },
    include: [{ model: SeatCategory, as: 'category' }],
    order: [['row', 'ASC'], ['col', 'ASC']],
  });

  // Fetch DB statuses
  const dbStatuses = await SeatStatus.findAll({
    where: { showtimeId },
  });
  const statusMap = new Map(dbStatuses.map(s => [s.seatId, s]));
  const { calculateDynamicSeatPrice } = require('./dynamicPricing');
  const bookedCount = dbStatuses.filter(s => s.status === 'booked').length;
  const enrichedSeats = [];
  const expiredSeatIdsToClean = [];

  // Check if any seats are held to optimize Redis query volume
  const now = new Date();
  const heldDbSeats = dbStatuses.filter(
    s => s.status === 'held' && s.holdExpiresAt && new Date(s.holdExpiresAt) > now
  );

  const redisHoldMap = new Map();
  if (heldDbSeats.length > 0) {
    try {
      const pipeline = redis.pipeline();
      for (const hSeat of heldDbSeats) {
        const key = `hold:${showtimeId}:${hSeat.seatId}`;
        pipeline.get(key);
        pipeline.ttl(key);
      }
      const rawResults = await pipeline.exec();
      if (rawResults && Array.isArray(rawResults)) {
        for (let i = 0; i < heldDbSeats.length; i++) {
          const heldUser = rawResults[i * 2] && !rawResults[i * 2][0] ? rawResults[i * 2][1] : null;
          const ttl = rawResults[i * 2 + 1] && !rawResults[i * 2 + 1][0] ? rawResults[i * 2 + 1][1] : 0;
          redisHoldMap.set(heldDbSeats[i].seatId, { heldUser, ttl });
        }
      }
    } catch (redisErr) {
      console.warn('Redis pipeline fallback notice:', redisErr.message);
    }
  }

  for (let idx = 0; idx < seats.length; idx++) {
    const seat = seats[idx];
    const dbStatus = statusMap.get(seat.id);
    const rHold = redisHoldMap.get(seat.id) || { heldUser: null, ttl: 0 };
    const redisHeldUser = rHold.heldUser;
    const ttl = rHold.ttl;

    let status = 'available';
    let heldBy = null;
    let ttlRemaining = 0;
    let isHeldByMe = false;

    if (dbStatus && dbStatus.status === 'booked') {
      status = 'booked';
    } else if (redisHeldUser && ttl > 0) {
      status = 'held';
      heldBy = redisHeldUser;
      ttlRemaining = ttl;
      isHeldByMe = currentUserId ? redisHeldUser === currentUserId : false;
    } else if (
      dbStatus &&
      dbStatus.status === 'held' &&
      dbStatus.holdExpiresAt &&
      new Date(dbStatus.holdExpiresAt) > new Date()
    ) {
      status = 'held';
      heldBy = dbStatus.heldBy;
      ttlRemaining = Math.max(
        0,
        Math.floor((new Date(dbStatus.holdExpiresAt).getTime() - Date.now()) / 1000)
      );
      isHeldByMe = currentUserId ? dbStatus.heldBy === currentUserId : false;
    } else if (dbStatus && dbStatus.status === 'held') {
      // Hold is truly expired in both Redis and DB
      expiredSeatIdsToClean.push(seat.id);
      status = 'available';
    }

    const basePrice = pricing[seat.categoryId] ? Number(pricing[seat.categoryId]) : 250;
    
    // Calculate dynamic pricing based on venue fill rate & seat central sweet-spot desirability
    const dynamicPriceInfo = calculateDynamicSeatPrice({
      basePrice,
      totalSeats: seats.length,
      bookedSeats: bookedCount,
      row: seat.row,
      totalRows: venue.totalRows || 10,
      col: seat.col,
      totalCols: venue.totalCols || 12,
      showtimeDate: showtime.dateTime,
      dynamicPricingEnabled: showtime.dynamicPricing !== false,
    });

    enrichedSeats.push({
      id: seat.id,
      row: seat.row,
      col: seat.col,
      label: seat.label,
      categoryId: seat.categoryId,
      categoryName: seat.category ? seat.category.name : 'Standard',
      categoryColor: seat.category ? seat.category.color : '#007AFF',
      price: dynamicPriceInfo.finalPrice,
      basePrice: dynamicPriceInfo.basePrice,
      surgePercent: dynamicPriceInfo.surgePercent,
      surgeLabel: dynamicPriceInfo.surgeLabel,
      status,
      isHeldByMe,
      ttlRemaining: status === 'held' ? ttlRemaining : 0,
      holdExpiresAt: status === 'held' && dbStatus ? dbStatus.holdExpiresAt : null,
    });
  }

  // Auto-heal expired holds in DB
  if (expiredSeatIdsToClean.length > 0) {
    await SeatStatus.update(
      { status: 'available', heldBy: null, holdExpiresAt: null },
      {
        where: {
          showtimeId,
          seatId: { [Op.in]: expiredSeatIdsToClean },
          status: 'held',
        },
      }
    );
  }

  const summary = {
    totalSeats: enrichedSeats.length,
    availableSeats: enrichedSeats.filter(s => s.status === 'available').length,
    heldSeats: enrichedSeats.filter(s => s.status === 'held').length,
    bookedSeats: enrichedSeats.filter(s => s.status === 'booked').length,
  };

  return {
    showtime: {
      id: showtime.id,
      dateTime: showtime.dateTime,
      eventTitle: showtime.event.title,
      eventImageUrl: showtime.event.imageUrl,
      eventBackdropUrl: showtime.event.backdropUrl,
      ageRating: showtime.event.ageRating || showtime.event.rating,
      language: showtime.language || 'ENGLISH',
      format: showtime.format || 'DOLBY ATMOS',
      screen: showtime.screen || 'AUDI 1',
      venueName: venue.name,
      venueAddress: venue.address,
      totalRows: venue.totalRows,
      totalCols: venue.totalCols,
      categories: venue.categories,
      pricing,
    },
    summary,
    seats: enrichedSeats,
  };
}

/**
 * Auto-release any expired holds in DB.
 */
async function cleanupExpiredHolds() {
  const expiredDbHolds = await SeatStatus.findAll({
    where: {
      status: 'held',
      holdExpiresAt: { [Op.lt]: new Date() },
    },
  });

  if (expiredDbHolds.length === 0) return 0;

  const releasedCount = expiredDbHolds.length;
  for (const hold of expiredDbHolds) {
    try {
      await redis.del(`hold:${hold.showtimeId}:${hold.seatId}`);
    } catch (rErr) {
      // Non-fatal
    }
  }

  await SeatStatus.update(
    { status: 'available', heldBy: null, holdExpiresAt: null },
    {
      where: {
        id: { [Op.in]: expiredDbHolds.map(h => h.id) },
      },
    }
  );

  return releasedCount;
}

module.exports = {
  holdSeats,
  releaseSeats,
  getShowtimeSeatMap,
  cleanupExpiredHolds,
  DEFAULT_TTL_SECONDS,
};
