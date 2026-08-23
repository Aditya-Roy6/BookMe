# BookMe — Ticket Booking Platform

A real-time high-concurrency ticket booking platform for movies, concerts, and live sports featuring interactive 3D seating selection, atomic hold concurrency, and digital QR ticketing.

---

## 🏗️ Architecture & Tech Stack

- **Backend:** Node.js, Express.js, Sequelize ORM
- **Database:** PostgreSQL 16
- **Cache & Concurrency:** Redis 7 (Lua Scripting for atomic operations)
- **Real-Time Sync:** Server-Sent Events (SSE)
- **Frontend:** React 18, Vite, Tailwind CSS (LuminaTix Pro Design System)
- **Authentication:** Role-Based Access Control (Customer, Organiser, Admin) with JWT & bcryptjs
- **Ticketing & Email:** QRCode generator & Nodemailer (Ethereal / SMTP)
- **Containerization:** Docker & Docker Compose

---

## ⚡ Quick Start Guide (Docker)

### 1. Clone & Setup Environment
```bash
cp .env.example .env
```

### 2. Launch All Services via Docker Compose
```bash
docker compose up -d
```

### 3. Access Services
- **Frontend UI:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3000/api](http://localhost:3000/api)
- **PostgreSQL Port:** `5433`
- **Redis Port:** `6379`

### 4. Run Automated Test Suites
```bash
cd backend
npm install
npm test
```

---

## 🧪 Test Coverage by Phase

| Test Suite | Description | Status |
|---|---|---|
| [`phase1.test.js`](file:///c:/Users/adiro/Downloads/Booking%20system/backend/tests/phase1.test.js) | Database Schema & Role-Based Auth (22 tests) | ✅ PASS |
| [`phase2.test.js`](file:///c:/Users/adiro/Downloads/Booking%20system/backend/tests/phase2.test.js) | Venue Grid & Event Management APIs (18 tests) | ✅ PASS |
| [`phase3.test.js`](file:///c:/Users/adiro/Downloads/Booking%20system/backend/tests/phase3.test.js) | Redis Lua Atomic Seat Hold & 10-user Race Conditions (9 tests) | ✅ PASS |
| [`phase4.test.js`](file:///c:/Users/adiro/Downloads/Booking%20system/backend/tests/phase4.test.js) | Waitlist FIFO Queue & Cascading Time-Limited Offers (9 tests) | ✅ PASS |
| [`phase5.test.js`](file:///c:/Users/adiro/Downloads/Booking%20system/backend/tests/phase5.test.js) | QR Code Generation, Email Dispatch & Analytics (8 tests) | ✅ PASS |
| [`phase6.test.js`](file:///c:/Users/adiro/Downloads/Booking%20system/backend/tests/phase6.test.js) | SSE Live Sync & Full End-to-End System Flow (12 tests) | ✅ PASS |
| **Total** | **All 6 Test Suites** | **78 / 78 Passed (100%)** |

---

## 📚 API Endpoints Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a customer or organiser
- `POST /api/auth/login` — Login and receive JWT token
- `GET /api/auth/me` — Get current user profile

### Venues (`/api/venues`) [Admin]
- `POST /api/venues` — Create venue grid layout (`totalRows` x `totalCols`)
- `POST /api/venues/:id/categories` — Define seat categories and row ranges
- `POST /api/venues/:id/generate-seats` — Auto-generate physical seat coordinates
- `GET /api/venues` — List all venues
- `GET /api/venues/:id` — Get venue seat map structure

### Events & Showtimes (`/api/events`) [Organiser & Public]
- `POST /api/events` — Create event listing
- `POST /api/events/:id/showtimes` — Create showtime with per-category pricing
- `GET /api/events` — Browse & filter events (by type, date, search)
- `GET /api/events/:id` — Get event details with showtimes

### Seating & Real-Time Sync (`/api/showtimes`)
- `GET /api/showtimes/:id/seats` — Get visual seat map with real-time statuses (`available`, `held`, `booked`)
- `POST /api/showtimes/:id/hold` — Place atomic hold on seats with TTL
- `POST /api/showtimes/:id/release` — Release held seats
- `GET /api/showtimes/:id/stream` — SSE endpoint for live seat map updates

### Waitlist (`/api/waitlist`)
- `POST /api/showtimes/:id/waitlist` — Join FIFO waitlist for sold-out seat category
- `GET /api/waitlist/offer/:token` — Inspect or claim time-limited offer
- `GET /api/waitlist/my-entries` — View user's waitlist positions

### Bookings (`/api/bookings`)
- `POST /api/bookings` — Finalize booking, generate QR code, and send email
- `GET /api/bookings/my-bookings` — Customer booking history with QR tickets
- `POST /api/bookings/:id/cancel` — Cancel booking and trigger waitlist auto-assignment
- `GET /api/bookings/organiser/analytics` — Organiser revenue and booking metrics

---

## 📐 System Design Write-Up

### 1. Seat Hold & TTL Auto-Release Mechanism
When a customer selects seats, the system initiates a temporary hold using Redis with a configurable TTL (e.g., 600 seconds). The hold is tracked simultaneously in Redis (`hold:{showtimeId}:{seatId}`) and in PostgreSQL (`SeatStatus` table with `hold_expires_at`). If checkout is abandoned or the timer expires, the Redis key drops and the seat status automatically reverts to `available` upon query or cleanup, broadcasting an SSE update to all connected clients.

### 2. Strict Concurrency Protection
To prevent double-holding or race conditions during high-demand drops, seat selection uses an atomic **Redis Lua script**. The script checks whether *any* requested seat is already held. If all requested keys are available, it locks them in a single atomic operation. If even one seat is contended, the entire batch fails and returns a `409 Conflict`, guaranteeing zero partial holds or race-condition duplicates.

### 3. Waitlist Auto-Assignment & Time-Limited Offer Flow
When an event category sells out (0 available seats), customers can join a FIFO waitlist queue. When a confirmed booking is cancelled, the system marks the seat as available and immediately executes `processNextInQueue()`. The next customer in line receives a unique, time-limited offer token and an automated notification. If the user completes the checkout within the time window, the seat is confirmed. If the offer expires unpurchased, the system automatically marks the offer as `expired` and cascades the seat to the next person in line.
