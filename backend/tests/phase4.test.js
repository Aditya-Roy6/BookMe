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
const { holdSeats } = require('../src/services/seatHold');
const { createBooking, cancelBooking } = require('../src/services/booking');
const { joinWaitlist, processNextInQueue, handleExpiredOffer } = require('../src/services/waitlist');

let organiserToken, customer1Token, customer2Token, customer3Token;
let cust1Id, cust2Id, cust3Id;
let venueId, showtimeId, premiumCatId, standardCatId;
let allSeats = [];

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await redis.flushall();

  // 1. Create Users
  const orgRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Live Nation Org', email: 'org4@test.com', password: 'password123', role: 'organiser' });
  organiserToken = orgRes.body.token;

  const c1 = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Customer One', email: 'c1@test.com', password: 'password123' });
  customer1Token = c1.body.token;
  cust1Id = c1.body.user.id;

  const c2 = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Customer Two', email: 'c2@test.com', password: 'password123' });
  customer2Token = c2.body.token;
  cust2Id = c2.body.user.id;

  const c3 = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Customer Three', email: 'c3@test.com', password: 'password123' });
  customer3Token = c3.body.token;
  cust3Id = c3.body.user.id;

  // 2. Create small Venue (2 rows, 2 cols = 4 seats total)
  const venue = await Venue.create({
    name: 'Intimate Club',
    totalRows: 2,
    totalCols: 2,
  });
  venueId = venue.id;

  const catVIP = await SeatCategory.create({
    venueId,
    name: 'VIP',
    rowStart: 1,
    rowEnd: 1, // 2 seats: A1, A2
  });
  premiumCatId = catVIP.id;

  const catStd = await SeatCategory.create({
    venueId,
    name: 'Standard',
    rowStart: 2,
    rowEnd: 2, // 2 seats: B1, B2
  });
  standardCatId = catStd.id;

  allSeats = await Seat.bulkCreate([
    { venueId, categoryId: premiumCatId, row: 1, col: 1, label: 'A1' },
    { venueId, categoryId: premiumCatId, row: 1, col: 2, label: 'A2' },
    { venueId, categoryId: standardCatId, row: 2, col: 1, label: 'B1' },
    { venueId, categoryId: standardCatId, row: 2, col: 2, label: 'B2' },
  ]);

  // 3. Create Event & Showtime
  const event = await Event.create({
    organiserId: orgRes.body.user.id,
    venueId,
    title: 'Taylor Swift Secret Show',
    type: 'concert',
  });

  const pricing = {};
  pricing[premiumCatId] = 500;
  pricing[standardCatId] = 200;

  const showtime = await Showtime.create({
    eventId: event.id,
    dateTime: new Date(Date.now() + 86400000),
    pricing,
  });
  showtimeId = showtime.id;

  // Init seat statuses
  await SeatStatus.bulkCreate(
    allSeats.map(s => ({
      showtimeId,
      seatId: s.id,
      status: 'available',
    }))
  );
});

afterAll(async () => {
  await redis.flushall();
  await redis.quit();
  await sequelize.close();
});

describe('Phase 4: Waitlist Queue & Time-Limited Offers', () => {
  let bookingId;

  // ─── Sold Out Validation ─────────────────────────────────────────
  describe('Sold-Out Validation', () => {
    test('Cannot join waitlist when category still has available seats (400)', async () => {
      const res = await request(app)
        .post(`/api/showtimes/${showtimeId}/waitlist`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ categoryId: premiumCatId });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/not sold out/i);
    });

    test('Book all VIP seats so VIP category becomes sold out', async () => {
      const vipSeats = allSeats.filter(s => s.categoryId === premiumCatId).map(s => s.id);
      
      // Customer 1 books seat A1
      await holdSeats(showtimeId, [vipSeats[0]], cust1Id);
      const b1 = await createBooking(cust1Id, showtimeId, [vipSeats[0]]);
      bookingId = b1.booking.id;

      // Book seat A2 so VIP is 100% sold out
      await holdSeats(showtimeId, [vipSeats[1]], cust1Id);
      await createBooking(cust1Id, showtimeId, [vipSeats[1]]);

      expect(b1.booking.status).toBe('confirmed');
    });
  });

  // ─── Joining Waitlist ────────────────────────────────────────────
  describe('Joining Waitlist (FIFO Queue)', () => {
    test('Customer 2 joins sold-out VIP waitlist -> gets position #1', async () => {
      const res = await request(app)
        .post(`/api/showtimes/${showtimeId}/waitlist`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({ categoryId: premiumCatId });

      expect(res.status).toBe(201);
      expect(res.body.position).toBe(1);
      expect(res.body.waitlistEntry.status).toBe('waiting');
    });

    test('Customer 3 joins sold-out VIP waitlist -> gets position #2', async () => {
      const res = await request(app)
        .post(`/api/showtimes/${showtimeId}/waitlist`)
        .set('Authorization', `Bearer ${customer3Token}`)
        .send({ categoryId: premiumCatId });

      expect(res.status).toBe(201);
      expect(res.body.position).toBe(2);
    });

    test('Customer 2 cannot join waitlist twice for same category (409 Conflict)', async () => {
      const res = await request(app)
        .post(`/api/showtimes/${showtimeId}/waitlist`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({ categoryId: premiumCatId });

      expect(res.status).toBe(409);
    });

    test('Customer can view their own waitlist positions', async () => {
      const res = await request(app)
        .get('/api/waitlist/my-entries')
        .set('Authorization', `Bearer ${customer2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.waitlistEntries).toHaveLength(1);
      expect(res.body.waitlistEntries[0].position).toBe(1);
    });
  });

  // ─── Cancellation & Auto-Assignment ──────────────────────────────
  describe('Cancellation Auto-Assignment & Time-Limited Offer', () => {
    let offerTokenForCust2;

    test('Cancelling booking automatically creates time-limited offer for position #1 (Customer 2)', async () => {
      const cancelRes = await cancelBooking(bookingId, cust1Id);

      expect(cancelRes.success).toBe(true);
      expect(cancelRes.waitlistOffersCreated).toBeGreaterThan(0);

      // Check Customer 2 waitlist status changed to 'offered'
      const entryCust2 = await Waitlist.findOne({
        where: { customerId: cust2Id, showtimeId, categoryId: premiumCatId },
      });
      expect(entryCust2.status).toBe('offered');
      expect(entryCust2.offerToken).toBeDefined();
      expect(entryCust2.offerExpiresAt).toBeDefined();

      offerTokenForCust2 = entryCust2.offerToken;

      // Check Customer 3 is still 'waiting'
      const entryCust3 = await Waitlist.findOne({
        where: { customerId: cust3Id, showtimeId, categoryId: premiumCatId },
      });
      expect(entryCust3.status).toBe('waiting');
    });

    test('Customer 2 can inspect their time-limited offer via token', async () => {
      const res = await request(app).get(`/api/waitlist/offer/${offerTokenForCust2}`);

      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body.offer.customerId).toBe(cust2Id);
    });

    test('Cascading Expiry: when offer expires unpurchased, it cascades to position #2 (Customer 3)', async () => {
      const entryCust2 = await Waitlist.findOne({ where: { offerToken: offerTokenForCust2 } });
      
      // Simulate offer expiration cascade
      const cascadeResult = await handleExpiredOffer(entryCust2);

      expect(cascadeResult).not.toBeNull();
      expect(cascadeResult.offeredTo).toBe(cust3Id);

      // Customer 2 is now expired
      await entryCust2.reload();
      expect(entryCust2.status).toBe('expired');

      // Customer 3 is now offered!
      const entryCust3 = await Waitlist.findOne({
        where: { customerId: cust3Id, showtimeId, categoryId: premiumCatId },
      });
      expect(entryCust3.status).toBe('offered');
      expect(entryCust3.offerToken).toBeDefined();
    });
  });
});
