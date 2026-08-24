const express = require('express');
const {
  createBooking,
  cancelBooking,
  getCustomerBookings,
  getOrganiserMetrics,
} = require('../services/booking');
const { createRazorpayOrder, verifyRazorpaySignature, RAZORPAY_KEY_ID } = require('../services/razorpay');
const { authenticate, authorize } = require('../middleware/auth');
const { Booking, BookingItem, Seat, Showtime, Event, Venue, SeatCategory } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

/**
 * GET /api/bookings/public/qr/:bookingRef
 * Public: Serve Custom Fancy PNG QR Code image with center movie avatar
 */
router.get('/public/qr/:bookingRef', async (req, res, next) => {
  try {
    const { bookingRef } = req.params;
    const cleanRef = bookingRef.replace(/\.png$/i, '');
    const isDownload = req.query.download === 'true' || req.query.dl === '1';

    let imageUrl = '';
    try {
      const booking = await Booking.findOne({
        where: { bookingRef: cleanRef },
        include: [
          {
            model: Showtime,
            as: 'showtime',
            include: [{ model: Event, as: 'event', attributes: ['imageUrl'] }],
          },
        ],
      });
      if (booking?.showtime?.event?.imageUrl) {
        imageUrl = booking.showtime.event.imageUrl;
      }
    } catch (e) {}

    const { generateQRCodeBuffer } = require('../services/qrcode');
    const pngBuffer = await generateQRCodeBuffer(cleanRef, { imageUrl, size: 500 });

    res.setHeader('Content-Type', 'image/png');
    if (isDownload) {
      res.setHeader('Content-Disposition', `attachment; filename="ticket-pass-${cleanRef}.png"`);
    } else {
      res.setHeader('Content-Disposition', `inline; filename="ticket-pass-${cleanRef}.png"`);
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(pngBuffer);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bookings/razorpay/create-order
 * Customer: Create a Razorpay payment order for held seats
 */
router.post('/razorpay/create-order', authenticate, async (req, res, next) => {
  try {
    const { showtimeId, seatIds } = req.body;
    if (!showtimeId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ error: 'showtimeId and seatIds are required' });
    }

    const showtime = await Showtime.findByPk(showtimeId);
    if (!showtime) {
      return res.status(404).json({ error: 'Showtime not found' });
    }

    const seats = await Seat.findAll({
      where: { id: { [Op.in]: seatIds } },
    });

    if (seats.length !== seatIds.length) {
      return res.status(400).json({ error: 'One or more seat IDs are invalid' });
    }

    const pricing = showtime.pricing || {};
    let totalAmount = 0;
    for (const s of seats) {
      const price = pricing[s.categoryId] || 350;
      totalAmount += Number(price);
    }

    const amountInPaise = Math.round(totalAmount * 100);
    const receipt = `rcpt_${Date.now().toString(36)}_${req.user.id.substring(0, 5)}`;

    const order = await createRazorpayOrder({
      amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        showtimeId,
        customerId: req.user.id,
        seatCount: seatIds.length,
      },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency || 'INR',
      key: RAZORPAY_KEY_ID,
      totalAmount,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bookings/razorpay/verify
 * Customer: Verify payment signature and confirm booking
 */
router.post('/razorpay/verify', authenticate, async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      showtimeId,
      seatIds,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !showtimeId || !seatIds) {
      return res.status(400).json({
        error: 'Missing Razorpay order/payment identifiers or booking details',
      });
    }

    const isValid = verifyRazorpaySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid Razorpay payment signature' });
    }

    const result = await createBooking(req.user.id, showtimeId, seatIds, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentMethod: 'razorpay',
    });

    res.status(201).json({
      message: 'Payment verified and booking confirmed',
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bookings
 * Authenticated (Customer): Create a confirmed booking for held seats
 * Body: { showtimeId: 'uuid', seatIds: ['uuid-1', 'uuid-2'], paymentDetails: {} }
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { showtimeId, seatIds, paymentDetails } = req.body;
    if (!showtimeId || !seatIds) {
      return res.status(400).json({ error: 'showtimeId and seatIds are required' });
    }

    const result = await createBooking(req.user.id, showtimeId, seatIds, paymentDetails);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/bookings/my-bookings
 * Authenticated: Get customer's booking history
 */
router.get('/my-bookings', authenticate, async (req, res, next) => {
  try {
    const bookings = await getCustomerBookings(req.user.id);
    res.json({ bookings });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/bookings/organiser/analytics
 * Authenticated (Organiser/Admin): Get booking summaries and revenue
 */
router.get('/organiser/analytics', authenticate, authorize('organiser', 'admin'), async (req, res, next) => {
  try {
    const metrics = await getOrganiserMetrics(req.user.id);
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/bookings/:id
 * Authenticated: Get single booking details with QR code
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
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
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.customerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({ booking });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bookings/:id/cancel
 * Authenticated: Cancel a booking and trigger automated waitlist cascade
 */
router.post('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const result = await cancelBooking(req.params.id, req.user.id, isAdmin);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
