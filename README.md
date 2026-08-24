# 🎟️ BookMe — High-Concurrency Ticket Booking & Waitlist Engine

[![Live Application](https://img.shields.io/badge/Live%20App-Vercel-1ed760?style=for-the-badge&logo=vercel)](https://bookme-jet.vercel.app)
[![API Backend](https://img.shields.io/badge/Production%20API-Render-46E3B7?style=for-the-badge&logo=render)](https://bookme-backend-edh7.onrender.com)
[![Test Coverage](https://img.shields.io/badge/Automated%20Tests-78%2F78%20Passed%20(100%25)-brightgreen?style=for-the-badge&logo=jest)](https://github.com/Aditya-Roy6/BookMe)

A real-time, high-concurrency ticket reservation and admission management platform for cinemas, concerts, and stadium festivals. Engineered with atomic Redis Lua scripting, two-tier seat hold TTLs, FIFO waitlist cascading, Server-Sent Events (SSE) real-time sync, and digital QR admission passes.

---

## 🌐 Hosted Application URLs

| Service | Environment | URL |
|---|---|---|
| **Frontend Web App** | Production (Vercel) | [https://bookme-jet.vercel.app](https://bookme-jet.vercel.app) |
| **Backend API** | Production (Render) | [https://bookme-backend-edh7.onrender.com](https://bookme-backend-edh7.onrender.com) |
| **Health Check Endpoint** | Production | [https://bookme-backend-edh7.onrender.com/api/health](https://bookme-backend-edh7.onrender.com/api/health) |

---

## 🏗️ Architecture & Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, HeroUI, Lucide Icons, Framer Motion
- **Backend:** Node.js (v22), Express.js, Sequelize ORM (PostgreSQL dialect)
- **Primary Database:** PostgreSQL 16 (Neon Serverless Postgres / Supabase)
- **In-Memory Cache & Locks:** Redis 7 (Upstash Serverless Redis / Redis Alpine)
- **Real-Time Synchronization:** Server-Sent Events (SSE) via 	ext/event-stream
- **Authentication:** JWT with Role-Based Access Control (customer, organiser, dmin), bcryptjs password hashing
- **Payments:** Razorpay Payment Gateway integration (Test Mode with mock fallback)
- **Ticketing & QR Engine:** High-resolution SVG/PNG QR Generator with centered movie avatars, Resvg Rust compiler, Brevo REST API & Gmail SMTP relays
- **Containerization:** Docker & Docker Compose

---

## ⚡ Setup & Installation Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or v22+)
- [Git](https://git-scm.com/)
- [Docker & Docker Compose](https://www.docker.com/) *(optional, for containerized run)*

---

### Option A: Local Development via Docker Compose (Recommended)

1. **Clone the repository:**
   `ash
   git clone https://github.com/Aditya-Roy6/BookMe.git
   cd BookMe
   `

2. **Configure environment variables:**
   `ash
   cp .env.example .env
   `

3. **Spin up all containers (Postgres, Redis, Backend, Frontend):**
   `ash
   docker compose up -d
   `

4. **Access the application:**
   - **Frontend UI:** [http://localhost:5173](http://localhost:5173)
   - **Backend API:** [http://localhost:3000/api](http://localhost:3000/api)
   - **Health Check:** [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

### Option B: Manual Local Setup (Node.js & Local/Cloud DB)

1. **Backend Setup:**
   `ash
   cd backend
   cp .env.example .env
   # Configure DATABASE_URL (Neon/Postgres) and REDIS_URL (Upstash/Local) in .env
   npm install
   npm run dev
   `

2. **Frontend Setup:**
   `ash
   cd ../frontend
   cp .env.example .env
   npm install
   npm run dev
   `

---

## 🔑 Environment Configuration (.env.example)

### Backend Environment Variables (ackend/.env.example)
`env
# Database (PostgreSQL 16 / Neon DB / Supabase)
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bookme
DB_USER=bookme_dev
DB_PASSWORD=bookme_password
DB_SSL=false

# Redis (In-Memory Locks & Atomic Holds)
REDIS_URL=rediss://default:token@host:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Seat Hold & Waitlist Timing (in seconds)
SEAT_HOLD_TTL_SECONDS=600
WAITLIST_OFFER_TTL_SECONDS=900

# Email Delivery (Brevo REST API or SMTP)
BREVO_API_KEY=xkeysib-your-brevo-api-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=BookMe <noreply@bookme.com>

# App Config
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
`

### Frontend Environment Variables (rontend/.env.example)
`env
VITE_API_URL=http://localhost:3000/api
VITE_TMDB_ACCESS_TOKEN=your-tmdb-bearer-token
`

---

## 🗄️ Database Schema & Entity Relationships (ERD)

`mermaid
erDiagram
    USERS ||--o{ EVENTS : organizes
    USERS ||--o{ BOOKINGS : reserves
    USERS ||--o{ WAITLIST : queues
    VENUES ||--o{ SEAT_CATEGORIES : contains
    VENUES ||--o{ SEATS : has
    VENUES ||--o{ EVENTS : hosts
    SEAT_CATEGORIES ||--o{ SEATS : defines
    SEAT_CATEGORIES ||--o{ WAITLIST : targets
    EVENTS ||--o{ SHOWTIMES : schedules
    SHOWTIMES ||--o{ SEAT_STATUSES : tracks
    SHOWTIMES ||--o{ BOOKINGS : fulfills
    SHOWTIMES ||--o{ WAITLIST : manages
    SEATS ||--o{ SEAT_STATUSES : state_of
    SEATS ||--o{ BOOKING_ITEMS : included_in
    BOOKINGS ||--o{ BOOKING_ITEMS : contains

    USERS {
        uuid id PK
        string name
        string email UK
        string password
        enum role "customer | organiser | admin"
        string phone
        boolean is_verified
    }

    VENUES {
        uuid id PK
        string name
        text address
        int total_rows
        int total_cols
    }

    SEAT_CATEGORIES {
        uuid id PK
        uuid venue_id FK
        string name
        string color
        int row_start
        int row_end
    }

    SEATS {
        uuid id PK
        uuid venue_id FK
        uuid category_id FK
        int row
        int col
        string label
    }

    EVENTS {
        uuid id PK
        uuid organiser_id FK
        uuid venue_id FK
        string title
        text description
        enum type "movie | concert | theatre | festival | other"
        string image_url
        string backdrop_url
        string trailer_url
        int duration
        float rating
    }

    SHOWTIMES {
        uuid id PK
        uuid event_id FK
        uuid venue_id FK
        timestamp date_time
        jsonb pricing
    }

    SEAT_STATUSES {
        uuid id PK
        uuid showtime_id FK
        uuid seat_id FK
        enum status "available | held | booked"
        uuid held_by
        timestamp hold_expires_at
    }

    BOOKINGS {
        uuid id PK
        uuid customer_id FK
        uuid showtime_id FK
        string booking_ref UK
        decimal total_amount
        enum status "confirmed | cancelled"
        string qr_code_url
        string razorpay_payment_id
    }

    BOOKING_ITEMS {
        uuid id PK
        uuid booking_id FK
        uuid seat_id FK
        decimal price
    }

    WAITLIST {
        uuid id PK
        uuid customer_id FK
        uuid showtime_id FK
        uuid category_id FK
        int position
        enum status "waiting | offered | claimed | expired | fulfilled"
        uuid offer_token UK
        timestamp offer_expires_at
    }
`

---

## 📚 API Endpoints Documentation

### 1. Authentication (/api/auth)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /api/auth/register | Public | Register customer or organiser account |
| POST | /api/auth/login | Public | Authenticate user and return JWT bearer token |
| GET | /api/auth/me | Authenticated | Retrieve authenticated user profile |
| POST | /api/auth/forgot-password | Public | Request 6-digit password reset OTP |
| POST | /api/auth/reset-password | Public | Verify OTP and update password |

### 2. Venues & Layouts (/api/venues)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /api/venues | Admin | Create physical venue layout (	otalRows x 	otalCols) |
| POST | /api/venues/:id/categories | Admin | Define tiered seat pricing categories (e.g. VIP, Recliner, Balcony) |
| POST | /api/venues/:id/generate-seats | Admin | Auto-generate seat coordinates & labels for venue grid |
| GET | /api/venues | Public | List all active venues |
| GET | /api/venues/:id | Public | Get venue with seat geometry and tier structure |

### 3. Events & Showtimes (/api/events)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /api/events | Organiser, Admin | Create movie, concert, or festival event |
| POST | /api/events/:id/showtimes | Organiser, Admin | Schedule showtime with custom category pricing |
| GET | /api/events | Public | Browse and filter events (by type, search query, date) |
| GET | /api/events/:id | Public | Get event detail with trailer, cast, rating, and scheduled showtimes |

### 4. Real-Time Seat Holding & Streaming (/api/showtimes)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /api/showtimes/:id/seats | Public | Fetch live 2D/3D seat map with real-time status and user hold context |
| POST | /api/showtimes/:id/hold | Authenticated | Place atomic 10-minute hold on selected seats via Redis Lua |
| POST | /api/showtimes/:id/release | Authenticated | Release held seats manually or on cart abandonment |
| GET | /api/showtimes/:id/stream | Public | **Server-Sent Events (SSE)** stream for instant seat state broadcasting |

### 5. Bookings & Ticketing (/api/bookings)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /api/bookings/razorpay/create-order | Authenticated | Create Razorpay order for held seats |
| POST | /api/bookings/razorpay/verify | Authenticated | Verify Razorpay signature, confirm booking, generate QR, send email |
| GET | /api/bookings/my-bookings | Authenticated | Fetch customer's active and past reservations |
| POST | /api/bookings/:id/cancel | Authenticated | Cancel booking, release seats, and trigger waitlist cascade |
| GET | /api/bookings/public/qr/:bookingRef.png | Public | Serve high-res custom QR PNG pass for email & download |
| GET | /api/bookings/organiser/analytics | Organiser, Admin | Aggregate revenue, occupancy rates, and sales metrics |

### 6. Waitlist & Cascading Offers (/api/waitlist)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /api/showtimes/:id/waitlist | Authenticated | Join FIFO waitlist queue for sold-out category |
| GET | /api/waitlist/my-entries | Authenticated | View customer's active waitlist queue positions |
| GET | /api/waitlist/offer/:token | Public | Inspect and claim 15-minute exclusive reservation offer |

---

## 🧠 Seat Hold & Waitlist Logic Deep Dive

### 1. Atomic Concurrency Control (Zero Race Conditions)
- When a user selects seats and clicks **"Review & Pay"**, the request hits /api/showtimes/:id/hold.
- An **atomic Redis Lua script** checks if *all* requested keys hold:{showtimeId}:{seatId} are free.
- If free, it sets the keys with EX 600 (10-minute countdown) in a single synchronous Redis execution.
- If even one seat is contended by another customer, the script returns   and the API immediately aborts with 409 Conflict, guaranteeing zero double-holding or partial cart reservations.

### 2. Dual-Layer Hold Resolution & Auto-Healing
- Holds are mirrored to PostgreSQL's SeatStatus table (status = 'held', hold_expires_at = NOW() + 10 min).
- When any client queries /api/showtimes/:id/seats, status is dynamically resolved across both layers:
  - If Redis holds the key, status = 'held'.
  - If Redis was restarted, PostgreSQL's hold_expires_at preserves the user's valid hold.
  - If both have elapsed, the database auto-heals to status = 'available' and broadcasts an SSE event.

### 3. FIFO Waitlist Auto-Assignment & Cascading Offers
- When an event category sells out (0 available seats), users join a deterministic FIFO queue (position = 1, 2, 3...).
- When a confirmed booking is cancelled, the system marks the seat available and immediately runs processNextInQueue().
- The customer in position = 1 receives an automated email containing an exclusive, cryptographically secure 15-minute claim token (UUIDv4).
- If claimed within 15 minutes, the booking is confirmed.
- If expired without payment, the offer status transitions to expired and the seat **automatically cascades** to position = 2.

---

## 🧪 Automated Test Suite Breakdown

All 6 test phases pass with 100% test coverage:

`ash
cd backend
npm test
`

| Phase | Test File | Key Coverage Areas | Status |
|---|---|---|---|
| **Phase 1** | phase1.test.js | Database schemas, validations, password hashing, RBAC JWT auth | ✅ PASS (22/22) |
| **Phase 2** | phase2.test.js | Venue grid generation, category tiers, event creation & filters | ✅ PASS (18/18) |
| **Phase 3** | phase3.test.js | Redis Lua atomic seat holding, 10-user concurrent race conditions, TTL | ✅ PASS (9/9) |
| **Phase 4** | phase4.test.js | FIFO waitlist queues, cancellation cascading, time-limited tokens | ✅ PASS (9/9) |
| **Phase 5** | phase5.test.js | High-res custom QR generation, email dispatch, organiser analytics | ✅ PASS (8/8) |
| **Phase 6** | phase6.test.js | Server-Sent Events (SSE) broadcasting & End-to-End lifecycle flow | ✅ PASS (12/12) |
| **Total** | **All 6 Test Suites** | **Complete Core Platform Coverage** | **78 / 78 Passed (100%)** |

---

## 📄 System Design Document
For the detailed technical architecture write-up on concurrency design, distributed locks, and state machines, see [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md).

---

## 👥 Contributors & License
- **Author:** Aditya Roy
- **Repository:** [Aditya-Roy6/BookMe](https://github.com/Aditya-Roy6/BookMe)
- **License:** MIT
