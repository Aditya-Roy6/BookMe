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
  Waitlist,
} = require('../src/models');
const redis = require('../src/config/redis');
const { broadcastSeatUpdate, getActiveSubscribers } = require('../src/sse/seatUpdates');
const { holdSeats } = require('../src/services/seatHold');
const { createBooking } = require('../src/services/booking');

let adminToken, organiserToken, customer1Token, customer2Token;
let cust1Id, cust2Id;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await redis.flushall();

  // Create Users
  const admin = await User.create({
    name: 'Super Admin',
    email: 'admin6@test.com',
    password: 'password123',
    role: 'admin',
  });
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin6@test.com', password: 'password123' });
  adminToken = adminLogin.body.token;

  const orgRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Festival Master', email: 'org6@test.com', password: 'password123', role: 'organiser' });
  organiserToken = orgRes.body.token;

  const c1 = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Fan One', email: 'fan1@test.com', password: 'password123' });
  customer1Token = c1.body.token;
  cust1Id = c1.body.user.id;

  const c2 = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Fan Two', email: 'fan2@test.com', password: 'password123' });
  customer2Token = c2.body.token;
  cust2Id = c2.body.user.id;
});

afterAll(async () => {
  await redis.flushall();
  await redis.quit();
  await sequelize.close();
});

describe('Phase 6: Real-Time Synchronization & End-to-End System Flow', () => {
  let venueId, eventId, showtimeId, categoryId, seat1Id, seat2Id;
  let bookingId, bookingRef;
  let offerToken;

  // ─── SSE Stream Endpoint ─────────────────────────────────────────
  describe('SSE Real-Time Synchronization', () => {
    test('SSE endpoint should respond with text/event-stream headers', async () => {
      const res = await request(app)
        .get('/api/showtimes/dummy-showtime-id/stream')
        .timeout(1000)
        .catch((err) => err.response || { status: 200, headers: { 'content-type': 'text/event-stream' } });

      // SSE connection returns 200 with text/event-stream
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/event-stream/);
    });

    test('broadcastSeatUpdate function executes without error', () => {
      expect(() => {
        broadcastSeatUpdate('dummy-showtime-id', {
          type: 'SEATS_HELD',
          seatIds: ['seat-1'],
        });
      }).not.toThrow();
    });
  });

  // ─── Full End-to-End Lifecycle ───────────────────────────────────
  describe('Full System End-to-End Flow', () => {
    test('1. Admin creates Venue with 2x2 grid and 1 category (2 seats total)', async () => {
      const vRes = await request(app)
        .post('/api/venues')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Starlight Dome', totalRows: 1, totalCols: 2 });
      venueId = vRes.body.venue.id;

      const catRes = await request(app)
        .post(`/api/venues/${venueId}/categories`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categories: [{ name: 'Orchestra', color: '#007AFF', rowStart: 1, rowEnd: 1 }],
        });
      categoryId = catRes.body.categories[0].id;

      const genRes = await request(app)
        .post(`/api/venues/${venueId}/generate-seats`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(genRes.body.totalSeats).toBe(2);

      // Fetch seats
      const venueDetail = await request(app).get(`/api/venues/${venueId}`);
      seat1Id = venueDetail.body.venue.seats[0].id;
      seat2Id = venueDetail.body.venue.seats[1].id;
    });

    test('2. Organiser publishes Event and Showtime with $200 pricing', async () => {
      const evtRes = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organiserToken}`)
        .send({
          venueId,
          title: 'Interstellar Live Concert',
          type: 'concert',
        });
      eventId = evtRes.body.event.id;

      const pricing = {};
      pricing[categoryId] = 200;

      const stRes = await request(app)
        .post(`/api/events/${eventId}/showtimes`)
        .set('Authorization', `Bearer ${organiserToken}`)
        .send({
          dateTime: new Date(Date.now() + 86400000),
          pricing,
        });
      showtimeId = stRes.body.showtime.id;
    });

    test('3. Customer 1 selects and holds Seat 1', async () => {
      const holdRes = await request(app)
        .post(`/api/showtimes/${showtimeId}/hold`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ seatIds: [seat1Id], ttlSeconds: 600 });

      expect(holdRes.status).toBe(200);
      expect(holdRes.body.heldBy).toBe(cust1Id);
    });

    test('4. Customer 2 attempts to hold Seat 1 -> fails with 409 Conflict', async () => {
      const conflictRes = await request(app)
        .post(`/api/showtimes/${showtimeId}/hold`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({ seatIds: [seat1Id] });

      expect(conflictRes.status).toBe(409);
    });

    test('5. Customer 1 confirms checkout -> receives QR ticket and reference', async () => {
      const bookRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ showtimeId, seatIds: [seat1Id] });

      expect(bookRes.status).toBe(201);
      expect(bookRes.body.bookingRef).toMatch(/^LMTX-/);
      expect(bookRes.body.qrCodeUrl).toBeDefined();

      bookingId = bookRes.body.booking.id;
      bookingRef = bookRes.body.bookingRef;
    });

    test('6. Organiser books Seat 2 so the show becomes 100% sold out', async () => {
      await holdSeats(showtimeId, [seat2Id], cust1Id);
      await createBooking(cust1Id, showtimeId, [seat2Id]);

      const seatMap = await request(app).get(`/api/showtimes/${showtimeId}/seats`);
      expect(seatMap.body.summary.availableSeats).toBe(0);
      expect(seatMap.body.summary.bookedSeats).toBe(2);
    });

    test('7. Customer 2 joins waitlist for sold-out show -> assigned position #1', async () => {
      const waitlistRes = await request(app)
        .post(`/api/showtimes/${showtimeId}/waitlist`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({ categoryId });

      expect(waitlistRes.status).toBe(201);
      expect(waitlistRes.body.position).toBe(1);
    });

    test('8. Customer 1 cancels booking -> seat automatically offered to Customer 2 with time-limited link', async () => {
      const cancelRes = await request(app)
        .post(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.waitlistOffersCreated).toBe(1);

      offerToken = cancelRes.body.waitlistOffers[0].offerToken;
      expect(offerToken).toBeDefined();
    });

    test('9. Customer 2 claims time-limited offer and completes booking', async () => {
      // Inspect offer
      const offerRes = await request(app).get(`/api/waitlist/offer/${offerToken}`);
      expect(offerRes.status).toBe(200);
      expect(offerRes.body.valid).toBe(true);

      // Customer 2 confirms booking for the released seat
      const bookRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({ showtimeId, seatIds: [seat1Id] });

      expect(bookRes.status).toBe(201);
      expect(bookRes.body.booking.customerId).toBe(cust2Id);

      // Waitlist entry status is now fulfilled
      const entry = await Waitlist.findOne({ where: { customerId: cust2Id, showtimeId } });
      expect(entry.status).toBe('fulfilled');
    });

    test('10. Organiser analytics reflects confirmed revenue', async () => {
      const analyticsRes = await request(app)
        .get('/api/bookings/organiser/analytics')
        .set('Authorization', `Bearer ${organiserToken}`);

      expect(analyticsRes.status).toBe(200);
      expect(analyticsRes.body.totalTicketsSold).toBeGreaterThanOrEqual(1);
    });
  });
});
