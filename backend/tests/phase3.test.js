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
} = require('../src/models');
const redis = require('../src/config/redis');
const { holdSeats, releaseSeats, cleanupExpiredHolds } = require('../src/services/seatHold');

let adminToken, customer1Token, customer2Token;
let customer1Id, customer2Id;
let venueId, showtimeId, seatsList = [], premiumCatId, standardCatId;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await redis.flushall();

  // 1. Setup Users
  const admin = await User.create({
    name: 'Admin',
    email: 'admin3@test.com',
    password: 'password123',
    role: 'admin',
  });
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin3@test.com', password: 'password123' });
  adminToken = adminLogin.body.token;

  const cust1Res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Alice Customer', email: 'alice@test.com', password: 'password123' });
  customer1Token = cust1Res.body.token;
  customer1Id = cust1Res.body.user.id;

  const cust2Res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Bob Customer', email: 'bob@test.com', password: 'password123' });
  customer2Token = cust2Res.body.token;
  customer2Id = cust2Res.body.user.id;

  // 2. Setup Venue & Categories
  const venue = await Venue.create({
    name: 'Metropolis Arena',
    address: '100 Main Blvd',
    totalRows: 5,
    totalCols: 10, // 50 seats
  });
  venueId = venue.id;

  const cat1 = await SeatCategory.create({
    venueId,
    name: 'VIP',
    color: '#FF9500',
    rowStart: 1,
    rowEnd: 2, // 20 seats
  });
  premiumCatId = cat1.id;

  const cat2 = await SeatCategory.create({
    venueId,
    name: 'General',
    color: '#007AFF',
    rowStart: 3,
    rowEnd: 5, // 30 seats
  });
  standardCatId = cat2.id;

  // Generate seats
  const generatedSeats = [];
  for (let r = 1; r <= 5; r++) {
    const catId = r <= 2 ? premiumCatId : standardCatId;
    const rowChar = String.fromCharCode(64 + r);
    for (let c = 1; c <= 10; c++) {
      generatedSeats.push({
        venueId,
        categoryId: catId,
        row: r,
        col: c,
        label: `${rowChar}${c}`,
      });
    }
  }
  seatsList = await Seat.bulkCreate(generatedSeats);

  // 3. Create Event & Showtime
  const event = await Event.create({
    organiserId: admin.id,
    venueId,
    title: 'Neon Odyssey 2026',
    type: 'concert',
  });

  const pricing = {};
  pricing[premiumCatId] = 120;
  pricing[standardCatId] = 60;

  const showtime = await Showtime.create({
    eventId: event.id,
    dateTime: new Date(Date.now() + 86400000),
    pricing,
  });
  showtimeId = showtime.id;

  // Initialize SeatStatus
  const statuses = seatsList.map(s => ({
    showtimeId,
    seatId: s.id,
    status: 'available',
  }));
  await SeatStatus.bulkCreate(statuses);
});

afterAll(async () => {
  await redis.flushall();
  await redis.quit();
  await sequelize.close();
});

describe('Phase 3: Seat Hold TTL & Concurrency Protection', () => {
  // ─── Seat Map Retrieval ──────────────────────────────────────────
  describe('GET /api/showtimes/:id/seats', () => {
    test('should return all seats with category, pricing, and available status', async () => {
      const res = await request(app).get(`/api/showtimes/${showtimeId}/seats`);

      expect(res.status).toBe(200);
      expect(res.body.summary.totalSeats).toBe(50);
      expect(res.body.summary.availableSeats).toBe(50);
      expect(res.body.summary.heldSeats).toBe(0);
      expect(res.body.summary.bookedSeats).toBe(0);
      expect(res.body.seats).toHaveLength(50);

      const vipSeat = res.body.seats.find(s => s.label === 'A1');
      expect(vipSeat.price).toBe(120);
      expect(vipSeat.categoryName).toBe('VIP');
      expect(vipSeat.status).toBe('available');

      const genSeat = res.body.seats.find(s => s.label === 'C1');
      expect(genSeat.price).toBe(60);
      expect(genSeat.categoryName).toBe('General');
      expect(genSeat.status).toBe('available');
    });
  });

  // ─── Seat Hold with TTL ─────────────────────────────────────────
  describe('POST /api/showtimes/:id/hold', () => {
    test('Customer 1 can hold 2 seats with custom TTL', async () => {
      const targetSeats = [seatsList[0].id, seatsList[1].id]; // A1, A2

      const res = await request(app)
        .post(`/api/showtimes/${showtimeId}/hold`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          seatIds: targetSeats,
          ttlSeconds: 300,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.seatIds).toEqual(targetSeats);
      expect(res.body.heldBy).toBe(customer1Id);
      expect(res.body.ttlSeconds).toBe(300);

      // Verify in Redis
      const ttl1 = await redis.ttl(`hold:${showtimeId}:${targetSeats[0]}`);
      expect(ttl1).toBeGreaterThan(0);
      expect(ttl1).toBeLessThanOrEqual(300);

      // Verify in DB
      const dbStatus = await SeatStatus.findOne({
        where: { showtimeId, seatId: targetSeats[0] },
      });
      expect(dbStatus.status).toBe('held');
      expect(dbStatus.heldBy).toBe(customer1Id);
    });

    test('Seat map reflects held seats and marks isHeldByMe correctly', async () => {
      // Alice checks seat map
      const resAlice = await request(app)
        .get(`/api/showtimes/${showtimeId}/seats`)
        .set('Authorization', `Bearer ${customer1Token}`);

      const heldSeatForAlice = resAlice.body.seats.find(s => s.id === seatsList[0].id);
      expect(heldSeatForAlice.status).toBe('held');
      expect(heldSeatForAlice.isHeldByMe).toBe(true);
      expect(heldSeatForAlice.ttlRemaining).toBeGreaterThan(0);

      // Bob checks seat map
      const resBob = await request(app)
        .get(`/api/showtimes/${showtimeId}/seats`)
        .set('Authorization', `Bearer ${customer2Token}`);

      const heldSeatForBob = resBob.body.seats.find(s => s.id === seatsList[0].id);
      expect(heldSeatForBob.status).toBe('held');
      expect(heldSeatForBob.isHeldByMe).toBe(false);
    });
  });

  // ─── Concurrency & Atomicity Protection ─────────────────────────
  describe('Concurrency Protection', () => {
    test('Customer 2 cannot hold an already held seat (409 Conflict)', async () => {
      const res = await request(app)
        .post(`/api/showtimes/${showtimeId}/hold`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          seatIds: [seatsList[0].id], // Already held by Alice
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/currently held/i);
    });

    test('Atomic Multi-seat Hold: if one seat is held, the entire hold fails and none are locked', async () => {
      const seatA1 = seatsList[0].id; // held by Alice
      const seatA3 = seatsList[2].id; // free
      const seatA4 = seatsList[3].id; // free

      const res = await request(app)
        .post(`/api/showtimes/${showtimeId}/hold`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          seatIds: [seatA3, seatA1, seatA4],
        });

      expect(res.status).toBe(409);

      // Verify that seatA3 and seatA4 were NOT held
      const keyA3 = await redis.get(`hold:${showtimeId}:${seatA3}`);
      const keyA4 = await redis.get(`hold:${showtimeId}:${seatA4}`);
      expect(keyA3).toBeNull();
      expect(keyA4).toBeNull();
    });

    test('High Concurrency Race Condition: 10 concurrent requests for same seat - exactly 1 succeeds', async () => {
      const contestSeat = seatsList[10].id; // B1 (free)

      // Fire 10 simultaneous requests from different user tokens
      const promises = Array.from({ length: 10 }).map((_, i) =>
        request(app)
          .post(`/api/showtimes/${showtimeId}/hold`)
          .set('Authorization', i % 2 === 0 ? `Bearer ${customer1Token}` : `Bearer ${customer2Token}`)
          .send({ seatIds: [contestSeat] })
      );

      const results = await Promise.all(promises);
      const successes = results.filter(r => r.status === 200);
      const conflicts = results.filter(r => r.status === 409);

      expect(successes).toHaveLength(1);
      expect(conflicts).toHaveLength(9);
    });
  });

  // ─── Seat Release & Expiry ──────────────────────────────────────
  describe('Release & Auto-expiry', () => {
    test('Customer cannot release someone elses held seat (403)', async () => {
      const aliceSeat = seatsList[0].id;

      const res = await request(app)
        .post(`/api/showtimes/${showtimeId}/release`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({ seatIds: [aliceSeat] });

      expect(res.status).toBe(403);
    });

    test('Customer can release their own held seats', async () => {
      const targetSeats = [seatsList[0].id, seatsList[1].id];

      const res = await request(app)
        .post(`/api/showtimes/${showtimeId}/release`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ seatIds: targetSeats });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify Redis is cleared
      const key1 = await redis.get(`hold:${showtimeId}:${targetSeats[0]}`);
      expect(key1).toBeNull();

      // Verify DB status is available
      const dbStatus = await SeatStatus.findOne({
        where: { showtimeId, seatId: targetSeats[0] },
      });
      expect(dbStatus.status).toBe('available');
    });

    test('Auto-release expired holds updates status back to available', async () => {
      // Hold a seat with 1-second TTL
      const testSeat = seatsList[20].id;
      await holdSeats(showtimeId, [testSeat], customer1Id, 1);

      // Verify it is held
      let seatMap = await request(app).get(`/api/showtimes/${showtimeId}/seats`);
      let s = seatMap.body.seats.find(seat => seat.id === testSeat);
      expect(s.status).toBe('held');

      // Wait 1.5 seconds for expiry
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Fetch seat map again (triggers auto-heal & cleanup)
      seatMap = await request(app).get(`/api/showtimes/${showtimeId}/seats`);
      s = seatMap.body.seats.find(seat => seat.id === testSeat);
      expect(s.status).toBe('available');
    });
  });
});
