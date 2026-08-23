const express = require('express');
const { joinWaitlist, getOfferDetails } = require('../services/waitlist');
const { Waitlist, Showtime, Event, Venue, SeatCategory } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/showtimes/:id/waitlist
 * Authenticated: Join the waitlist for a specific seat category when sold out
 * Body: { categoryId: 'uuid' }
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

/**
 * GET /api/waitlist/offer/:token
 * Public/Customer: Inspect or claim a time-limited waitlist offer
 */
router.get('/offer/:token', async (req, res, next) => {
  try {
    const offer = await getOfferDetails(req.params.token);
    res.json({
      valid: true,
      offer,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/waitlist/my-entries
 * Authenticated: View user's active and past waitlist positions
 */
router.get('/my-entries', authenticate, async (req, res, next) => {
  try {
    const entries = await Waitlist.findAll({
      where: { customerId: req.user.id },
      include: [
        {
          model: Showtime,
          as: 'showtime',
          include: [{ model: Event, as: 'event', include: [{ model: Venue, as: 'venue' }] }],
        },
        { model: SeatCategory, as: 'category' },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json({ waitlistEntries: entries });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
