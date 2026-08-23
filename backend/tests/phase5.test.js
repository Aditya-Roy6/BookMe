require('dotenv').config();
const request = require('supertest');
const app = require('../src/index');
const {
  sequelize,
  User,
  Venue,
  SeatCategory,
  Seat,
  Event,
  Showtime,
  SeatStatus,
  Booking,
} = require('../src/models');
const redis = require('../src/config/redis');
const { generateBookingQRCode, generateQRCodeBuffer } = require('../src/services/qrcode');
const { sendBookingConfirmation, sendWaitlistOfferEmail } = require('../src/services/email');
const { holdSeats } = require('../src/services/seatHold');

let organiserToken, customerToken;
let customerId, organiserId;
let showtimeId, seatA1Id, seatA2Id;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await redis.flushall();

  // Create Organiser
  const orgRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Live Concerts Inc', email: 'org5@test.com', password: 'password123', role: 'organiser' });
  organiserToken = orgRes.body.token;
  organiserId = orgRes.body.user.id;

  // Create Customer
  const custRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Charlie Customer', email: 'charlie@test.com', password: 'password123' });
  customerToken = custRes.body.token;
  customerId = custRes.body.user.id;

  // Create Venue
  const venue = await Venue.create({
    name: 'Symphony Hall',
    totalRows: 2,
    totalCols: 2,
  });

  const cat = await SeatCategory.create({
    venueId: venue.id,
    name: 'Stalls',
    rowStart: 1,
    rowEnd: 2,
  });

  const seats = await Seat.bulkCreate([
    { venueId: venue.id, categoryId: cat.id, row: 1, col: 1, label: 'A1' },
    { venueId: venue.id, categoryId: cat.id, row: 1, col: 2, label: 'A2' },
  ]);
  seatA1Id = seats[0].id;
  seatA2Id = seats[1].id;

  const event = await Event.create({
    organiserId,
    venueId: venue.id,
    title: 'Hans Zimmer Live',
    type: 'concert',
  });

  const pricing = {};
  pricing[cat.id] = 150;

  const showtime = await Showtime.create({
    eventId: event.id,
    dateTime: new Date(Date.now() + 86400000),
    pricing,
  });
  showtimeId = showtime.id;

  await SeatStatus.bulkCreate([
    { showtimeId, seatId: seatA1Id, status: 'available' },
    { showtimeId, seatId: seatA2Id, status: 'available' },
  ]);
});

afterAll(async () => {
  await redis.flushall();
  await redis.quit();
  await sequelize.close();
});

describe('Phase 5: Ticket Generation & Email Delivery', () => {
  let createdBookingId, bookingRef;

  // ─── QR Code Generation ──────────────────────────────────────────
  describe('QR Code Generation', () => {
    test('generateBookingQRCode should return a valid base64 data URL', async () => {
      const qrDataUrl = await generateBookingQRCode('LMTX-TEST-REF', { event: 'Test' });
      expect(qrDataUrl).toBeDefined();
      expect(qrDataUrl).toMatch(/^data:image\/png;base64,/);
    });

    test('generateQRCodeBuffer should produce a valid PNG buffer', async () => {
      const buffer = await generateQRCodeBuffer('LMTX-TEST-REF');
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  // ─── Full Booking Confirmation Flow ──────────────────────────────
  describe('POST /api/bookings (Confirmation Flow)', () => {
    test('Should complete booking, generate QR code, and assign reference', async () => {
      // 1. Hold seat A1 first
      await holdSeats(showtimeId, [seatA1Id], customerId);

      // 2. Confirm booking
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          showtimeId,
          seatIds: [seatA1Id],
        });

      expect(res.status).toBe(201);
      expect(res.body.bookingRef).toMatch(/^LMTX-/);
      expect(res.body.qrCodeUrl).toMatch(/^data:image\/png;base64,/);
      expect(res.body.totalAmount).toBe(150);

      createdBookingId = res.body.booking.id;
      bookingRef = res.body.bookingRef;

      // Verify seat status in DB is 'booked'
      const seatStat = await SeatStatus.findOne({ where: { showtimeId, seatId: seatA1Id } });
      expect(seatStat.status).toBe('booked');
    });

    test('Cannot book an already booked seat (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          showtimeId,
          seatIds: [seatA1Id],
        });

      expect(res.status).toBe(409);
    });
  });

  // ─── Email Delivery Service ──────────────────────────────────────
  describe('Email Service', () => {
    test('sendBookingConfirmation sends email without errors', async () => {
      const user = await User.findByPk(customerId);
      const booking = await Booking.findByPk(createdBookingId);
      const showtime = await Showtime.findByPk(showtimeId, {
        include: [{ model: Event, as: 'event', include: [{ model: Venue, as: 'venue' }] }],
      });

      const emailResult = await sendBookingConfirmation(
        user,
        booking,
        showtime,
        [{ seat: { label: 'A1' }, price: 150 }],
        booking.qrCodeUrl
      );

      expect(emailResult.success).toBe(true);
      expect(emailResult.messageId).toBeDefined();
    });

    test('sendWaitlistOfferEmail sends offer link without errors', async () => {
      const user = await User.findByPk(customerId);
      const showtime = await Showtime.findByPk(showtimeId, {
        include: [{ model: Event, as: 'event' }],
      });

      const emailResult = await sendWaitlistOfferEmail(
        user,
        showtime,
        'dummy-offer-token-uuid',
        new Date(Date.now() + 900000)
      );

      expect(emailResult.success).toBe(true);
    });
  });

  // ─── Customer Booking History ────────────────────────────────────
  describe('GET /api/bookings/my-bookings', () => {
    test('Customer can retrieve their past bookings with tickets and QR codes', async () => {
      const res = await request(app)
        .get('/api/bookings/my-bookings')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.bookings).toHaveLength(1);
      expect(res.body.bookings[0].bookingRef).toBe(bookingRef);
      expect(res.body.bookings[0].qrCodeUrl).toBeDefined();
      expect(res.body.bookings[0].items).toHaveLength(1);
    });
  });

  // ─── Organiser Revenue & Booking Analytics ───────────────────────
  describe('GET /api/bookings/organiser/analytics', () => {
    test('Organiser can view event revenue and tickets sold summary', async () => {
      const res = await request(app)
        .get('/api/bookings/organiser/analytics')
        .set('Authorization', `Bearer ${organiserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalRevenue).toBe(150);
      expect(res.body.totalTicketsSold).toBe(1);
      expect(res.body.events).toHaveLength(1);
      expect(res.body.events[0].totalRevenue).toBe(150);
    });
  });
});
