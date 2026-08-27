require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { sequelize } = require('./models');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const venueRoutes = require('./routes/venues');
const eventRoutes = require('./routes/events');
const seatRoutes = require('./routes/seats');
const waitlistRoutes = require('./routes/waitlist');
const bookingRoutes = require('./routes/bookings');
const calendarRoutes = require('./routes/calendar');
const { handleSSEConnection } = require('./sse/seatUpdates');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((u) => u.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Email verification & diagnostic endpoint
app.get('/api/email/verify', async (req, res) => {
  try {
    const { getTransporter } = require('./config/email');
    const transporter = await getTransporter();
    await transporter.verify();
    res.json({ status: 'ok', message: 'SMTP server connection verified successfully!' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message, code: err.code });
  }
});

// Email test dispatch endpoint
app.get('/api/email/test', async (req, res) => {
  const targetEmail = req.query.to || 'adiroyboy2@gmail.com';
  try {
    const { sendOtpEmail } = require('./services/email');
    const result = await sendOtpEmail(targetEmail, 'Test User', '123456');
    res.json({ status: 'ok', targetEmail, result });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message, code: err.code });
  }
});

// SSE Live Stream Endpoint
app.get('/api/showtimes/:id/stream', handleSSEConnection);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/showtimes', seatRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/calendar', calendarRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start server (only if not in test mode)
if (process.env.NODE_ENV !== 'test') {
  async function start() {
    try {
      app.listen(PORT, '0.0.0.0', async () => {
        console.log(`✅ Server running on port ${PORT}`);
        try {
          await sequelize.authenticate();
          console.log('✅ Database connected');
          
          try {
            await sequelize.sync({ alter: true });
            console.log('\u2705 Database synced');
          } catch (syncErr) {
            console.warn('Sync alter warning, proceeding with standard sync:', syncErr.message);
            await sequelize.sync();
            console.log('\u2705 Database synced (standard)');
          }

          // Ensure demo accounts are verified and accessible
          try {
            const { User } = require('./models');
            const demoAccounts = [
              { name: 'System Admin', email: 'admin@luminatix.com', role: 'admin' },
              { name: 'Neon Horizon Productions', email: 'organiser@luminatix.com', role: 'organiser' },
              { name: 'Alex Rivers', email: 'customer@luminatix.com', role: 'customer' },
            ];
            for (const demo of demoAccounts) {
              const existing = await User.findOne({ where: { email: demo.email } });
              if (!existing) {
                await User.create({
                  name: demo.name,
                  email: demo.email,
                  password: 'password123',
                  role: demo.role,
                  isVerified: true,
                });
              } else if (!existing.isVerified) {
                existing.isVerified = true;
                await existing.save();
              }
            }
            // Recurring 5-minute cleanup for expired OTPs & tokens
            setInterval(async () => {
              try {
                const { Op } = require('sequelize');
                const [clearedCount] = await User.update(
                  { otpCode: null, otpExpiresAt: null },
                  { where: { otpExpiresAt: { [Op.lt]: new Date() } } }
                );
                if (clearedCount > 0) {
                  console.log(`🧹 Cleaned up ${clearedCount} expired OTPs from database`);
                }
              } catch (cleanupErr) {
                console.warn('Expired OTP cleanup notice:', cleanupErr.message);
              }
            }, 5 * 60 * 1000);
          } catch (userErr) {
            console.warn('Demo accounts check notice:', userErr.message);
          }
        } catch (dbErr) {
          console.error('Database connection notice:', dbErr.message);
        }
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }
  start();
}

module.exports = app;
