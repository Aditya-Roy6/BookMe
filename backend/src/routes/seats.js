const express = require('express');
const { holdSeats, releaseSeats, getShowtimeSeatMap } = require('../services/seatHold');
const { joinWaitlist } = require('../services/waitlist');
const { authenticate } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

const router = express.Router();

/**
 * Optional auth middleware to identify user if token is provided without failing if guest
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Ignore invalid token for optional auth
    }
  }
  next();
}

/**
 * GET /api/showtimes/:id/seats
 * Get visual seat map with real-time seat status, remaining TTL, pricing, and categories
 */
router.get('/:id/seats', optionalAuth, async (req, res, next) => {
  try {
    const currentUserId = req.user ? req.user.id : null;
    const seatMap = await getShowtimeSeatMap(req.params.id, currentUserId);
    res.json(seatMap);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/showtimes/:id/hold
 * Authenticated: Place a hold on one or more seats with TTL
 * Body: { seatIds: ['uuid-1', 'uuid-2'], ttlSeconds?: 600 }
 */
router.post('/:id/hold', authenticate, async (req, res, next) => {
  try {
    const { seatIds, ttlSeconds } = req.body;
    const result = await holdSeats(
      req.params.id,
      seatIds,
      req.user.id,
      ttlSeconds ? parseInt(ttlSeconds, 10) : undefined
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/showtimes/:id/release
 * Authenticated: Release a hold on one or more seats
 * Body: { seatIds: ['uuid-1', 'uuid-2'] }
 */
router.post('/:id/release', authenticate, async (req, res, next) => {
  try {
    const { seatIds } = req.body;
    const isAdmin = req.user.role === 'admin';
    const result = await releaseSeats(req.params.id, seatIds, req.user.id, isAdmin);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/showtimes/:id/hold
 * Alternative RESTful release endpoint
 */
router.delete('/:id/hold', authenticate, async (req, res, next) => {
  try {
    const { seatIds } = req.body;
    const isAdmin = req.user.role === 'admin';
    const result = await releaseSeats(req.params.id, seatIds, req.user.id, isAdmin);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/showtimes/:id/waitlist
 * Authenticated: Join the waitlist for a specific category
 */
router.post('/:id/waitlist', authenticate, async (req, res, next) => {
  try {
    const { categoryId } = req.body;
    if (!categoryId) {
      return res.status(400).json({ error: 'categoryId is required' });
    }
    const result = await joinWaitlist(req.user.id, req.params.id, categoryId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
