require('dotenv').config();
const request = require('supertest');
const app = require('../src/index');
const { sequelize, User, Venue, SeatCategory, Seat, Event, Showtime, SeatStatus } = require('../src/models');

let adminToken, organiserToken, customerToken;
let venueId, categoryIds, eventId, showtimeId;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  // Create admin directly in DB
  await User.create({
    name: 'Admin',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin',
  });

  // Register organiser
  const orgRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Organiser', email: 'org@test.com', password: 'password123', role: 'organiser' });
  organiserToken = orgRes.body.token;

  // Register customer
  const custRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Customer', email: 'cust@test.com', password: 'password123' });
  customerToken = custRes.body.token;

  // Login admin
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.com', password: 'password123' });
  adminToken = adminRes.body.token;
});

afterAll(async () => {
  await sequelize.close();
});

describe('Phase 2: Event & Venue Management APIs', () => {
  // ─── Venue CRUD (Admin) ─────────────────────────────────────────
  describe('Venue Management', () => {
    test('Admin should create a venue with 10x20 grid', async () => {
      const res = await request(app)
        .post('/api/venues')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Grand Theatre', address: '123 Main St', totalRows: 10, totalCols: 20 });

      expect(res.status).toBe(201);
      expect(res.body.venue.name).toBe('Grand Theatre');
      expect(res.body.venue.totalRows).toBe(10);
      expect(res.body.venue.totalCols).toBe(20);
      venueId = res.body.venue.id;
    });

    test('Customer should NOT create a venue (403)', async () => {
      const res = await request(app)
        .post('/api/venues')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Blocked Venue', totalRows: 5, totalCols: 10 });

      expect(res.status).toBe(403);
    });

    test('Organiser should NOT create a venue (403)', async () => {
      const res = await request(app)
        .post('/api/venues')
        .set('Authorization', `Bearer ${organiserToken}`)
        .send({ name: 'Blocked Venue', totalRows: 5, totalCols: 10 });

      expect(res.status).toBe(403);
    });

    test('Admin should add seat categories with row ranges', async () => {
      const res = await request(app)
        .post(`/api/venues/${venueId}/categories`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categories: [
            { name: 'Premium', color: '#FF9500', rowStart: 1, rowEnd: 3 },
            { name: 'Standard', color: '#007AFF', rowStart: 4, rowEnd: 10 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.categories).toHaveLength(2);
      categoryIds = res.body.categories.map(c => c.id);
    });

    test('Admin should generate seats from venue grid', async () => {
      const res = await request(app)
        .post(`/api/venues/${venueId}/generate-seats`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(201);
      // 10 rows x 20 cols = 200 seats
      expect(res.body.totalSeats).toBe(200);
    });

    test('Should list all venues', async () => {
      const res = await request(app).get('/api/venues');

      expect(res.status).toBe(200);
      expect(res.body.venues).toHaveLength(1);
      expect(res.body.venues[0].categories).toHaveLength(2);
    });

    test('Should get venue detail with seats', async () => {
      const res = await request(app).get(`/api/venues/${venueId}`);

      expect(res.status).toBe(200);
      expect(res.body.venue.seats).toHaveLength(200);
      // Verify seat labels
      const firstSeat = res.body.venue.seats.find(s => s.row === 1 && s.col === 1);
      expect(firstSeat.label).toBe('A1');
    });

    test('Premium seats should be rows 1-3 (60 seats)', async () => {
      const res = await request(app).get(`/api/venues/${venueId}`);
      const premiumSeats = res.body.venue.seats.filter(
        s => s.category && s.category.name === 'Premium'
      );
      expect(premiumSeats).toHaveLength(60); // 3 rows x 20 cols
    });

    test('Standard seats should be rows 4-10 (140 seats)', async () => {
      const res = await request(app).get(`/api/venues/${venueId}`);
      const standardSeats = res.body.venue.seats.filter(
        s => s.category && s.category.name === 'Standard'
      );
      expect(standardSeats).toHaveLength(140); // 7 rows x 20 cols
    });
  });

  // ─── Event Management (Organiser) ──────────────────────────────
  describe('Event Management', () => {
    test('Organiser should create an event', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organiserToken}`)
        .send({
          venueId,
          title: 'Inception Remastered',
          description: 'A mind-bending masterpiece',
          type: 'movie',
        });

      expect(res.status).toBe(201);
      expect(res.body.event.title).toBe('Inception Remastered');
      expect(res.body.event.type).toBe('movie');
      eventId = res.body.event.id;
    });

    test('Customer should NOT create an event (403)', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ venueId, title: 'Blocked Event', type: 'movie' });

      expect(res.status).toBe(403);
    });

    test('Organiser should add showtime with per-category pricing', async () => {
      const pricing = {};
      pricing[categoryIds[0]] = 500; // Premium: $500
      pricing[categoryIds[1]] = 300; // Standard: $300

      const res = await request(app)
        .post(`/api/events/${eventId}/showtimes`)
        .set('Authorization', `Bearer ${organiserToken}`)
        .send({
          dateTime: '2026-09-01T19:00:00Z',
          pricing,
        });

      expect(res.status).toBe(201);
      expect(res.body.showtime).toBeDefined();
      // Should generate SeatStatus for all 200 seats
      expect(res.body.seatStatusCount).toBe(200);
      showtimeId = res.body.showtime.id;
    });

    test('All seat statuses should be "available" after showtime creation', async () => {
      const statuses = await SeatStatus.findAll({
        where: { showtimeId },
      });
      expect(statuses).toHaveLength(200);
      expect(statuses.every(s => s.status === 'available')).toBe(true);
    });
  });

  // ─── Public Event Browsing ─────────────────────────────────────
  describe('Public Event Browsing', () => {
    test('Should list events without authentication', async () => {
      const res = await request(app).get('/api/events');

      expect(res.status).toBe(200);
      expect(res.body.events).toHaveLength(1);
      expect(res.body.pagination.total).toBe(1);
    });

    test('Should filter events by type', async () => {
      const res = await request(app).get('/api/events?type=movie');

      expect(res.status).toBe(200);
      expect(res.body.events).toHaveLength(1);

      const res2 = await request(app).get('/api/events?type=concert');
      expect(res2.body.events).toHaveLength(0);
    });

    test('Should search events by title', async () => {
      const res = await request(app).get('/api/events?search=inception');

      expect(res.status).toBe(200);
      expect(res.body.events).toHaveLength(1);

      const res2 = await request(app).get('/api/events?search=nonexistent');
      expect(res2.body.events).toHaveLength(0);
    });

    test('Should get event detail with showtimes', async () => {
      const res = await request(app).get(`/api/events/${eventId}`);

      expect(res.status).toBe(200);
      expect(res.body.event.title).toBe('Inception Remastered');
      expect(res.body.event.showtimes).toHaveLength(1);
      expect(res.body.event.venue).toBeDefined();
      expect(res.body.event.venue.categories).toHaveLength(2);
    });

    test('Should return 404 for non-existent event', async () => {
      const res = await request(app).get('/api/events/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });
});
