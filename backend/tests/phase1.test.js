require('dotenv').config();
const request = require('supertest');
const app = require('../src/index');
const { sequelize, User } = require('../src/models');

// Test database setup
beforeAll(async () => {
  // Use force: true to recreate tables for clean test state
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Phase 1: Database Schema & Authentication', () => {
  // ─── Database Connection ────────────────────────────────────────
  describe('Database Connection', () => {
    test('should connect to PostgreSQL', async () => {
      await expect(sequelize.authenticate()).resolves.not.toThrow();
    });

    test('should have all required tables', async () => {
      const queryInterface = sequelize.getQueryInterface();
      const tables = await queryInterface.showAllTables();
      
      const requiredTables = [
        'users',
        'venues',
        'seat_categories',
        'events',
        'showtimes',
        'seats',
        'seat_statuses',
        'bookings',
        'booking_items',
        'waitlists',
      ];

      for (const table of requiredTables) {
        expect(tables).toContain(table);
      }
    });
  });

  // ─── User Registration ──────────────────────────────────────────
  describe('POST /api/auth/register', () => {
    test('should register a new customer', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Customer',
          email: 'customer@test.com',
          password: 'password123',
          role: 'customer',
        });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('customer@test.com');
      expect(res.body.user.role).toBe('customer');
      // Password should NOT be in response
      expect(res.body.user.password).toBeUndefined();
    });

    test('should register a new organiser', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Organiser',
          email: 'organiser@test.com',
          password: 'password123',
          role: 'organiser',
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('organiser');
    });

    test('should default to customer role if no role specified', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Default User',
          email: 'default@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('customer');
    });

    test('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate',
          email: 'customer@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already registered/i);
    });

    test('should reject registration without required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'incomplete@test.com' });

      expect(res.status).toBe(400);
    });

    test('should not allow self-registration as admin', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Sneaky Admin',
          email: 'sneaky@test.com',
          password: 'password123',
          role: 'admin',
        });

      // Should register but NOT as admin (falls back to customer)
      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('customer');
    });
  });

  // ─── User Login ─────────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    test('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'customer@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('customer@test.com');
      expect(res.body.user.password).toBeUndefined();
    });

    test('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'customer@test.com',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid/i);
    });

    test('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nobody@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(401);
    });

    test('should reject login without required fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ─── JWT Token Validation ──────────────────────────────────────
  describe('GET /api/auth/me', () => {
    let customerToken;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'customer@test.com', password: 'password123' });
      customerToken = res.body.token;
    });

    test('should return user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('customer@test.com');
      expect(res.body.user.role).toBe('customer');
    });

    test('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    test('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-here');

      expect(res.status).toBe(401);
    });

    test('should reject malformed Authorization header', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'NotBearer token');

      expect(res.status).toBe(401);
    });
  });

  // ─── Role-Based Authorization ──────────────────────────────────
  describe('Role-Based Access Control', () => {
    let customerToken;
    let organiserToken;
    let adminToken;

    beforeAll(async () => {
      // Create an admin user directly in the database (bypassing registration)
      await User.create({
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin',
      });

      // Get tokens for all roles
      const customerRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'customer@test.com', password: 'password123' });
      customerToken = customerRes.body.token;

      const organiserRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'organiser@test.com', password: 'password123' });
      organiserToken = organiserRes.body.token;

      const adminRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'password123' });
      adminToken = adminRes.body.token;
    });

    test('should store tokens for all three roles', () => {
      expect(customerToken).toBeDefined();
      expect(organiserToken).toBeDefined();
      expect(adminToken).toBeDefined();
    });

    test('admin token should have admin role', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.body.user.role).toBe('admin');
    });

    test('organiser token should have organiser role', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${organiserToken}`);

      expect(res.body.user.role).toBe('organiser');
    });
  });

  // ─── Password Security ─────────────────────────────────────────
  describe('Password Security', () => {
    test('password should be hashed in database', async () => {
      const user = await User.findOne({ where: { email: 'customer@test.com' } });
      expect(user.password).not.toBe('password123');
      expect(user.password).toMatch(/^\$2[ayb]\$/); // bcrypt hash pattern
    });

    test('validatePassword should work correctly', async () => {
      const user = await User.findOne({ where: { email: 'customer@test.com' } });
      const isValid = await user.validatePassword('password123');
      expect(isValid).toBe(true);

      const isInvalid = await user.validatePassword('wrongpassword');
      expect(isInvalid).toBe(false);
    });
  });

  // ─── Health Check ───────────────────────────────────────────────
  describe('GET /api/health', () => {
    test('should return health status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });
  });
});
