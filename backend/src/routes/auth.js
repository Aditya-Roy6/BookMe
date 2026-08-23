const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { sendWelcomeEmail, sendOtpEmail, sendResetPasswordOtpEmail } = require('../services/email');
const redis = require('../config/redis');

const router = express.Router();

/**
 * Generate JWT token for a user
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * POST /api/auth/register
 * Register a new user and dispatch 5-minute OTP
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const allowedRoles = ['customer', 'organiser'];
    const userRole = role && allowedRoles.includes(role) ? role : 'customer';

    // Check if user already exists
    let user = await User.findOne({ where: { email: cleanEmail } });

    if (user && user.isVerified) {
      return res.status(409).json({ error: 'An account with this email is already registered and verified. Please log in.' });
    }

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    if (user && !user.isVerified) {
      // Update existing unverified user
      user.name = name.trim();
      user.password = password; // Hook will re-hash
      user.role = userRole;
      user.otpCode = otp;
      user.otpExpiresAt = expiresAt;
      await user.save();
    } else {
      // Create new unverified user
      user = await User.create({
        name: name.trim(),
        email: cleanEmail,
        password,
        role: userRole,
        isVerified: false,
        otpCode: otp,
        otpExpiresAt: expiresAt,
      });
    }

    // Save OTP to Redis with exact 5-minute TTL (300 seconds)
    try {
      await redis.set(`otp:${cleanEmail}`, otp, 'EX', 300);
    } catch (redisErr) {
      console.warn('Redis OTP save warning:', redisErr.message);
    }

    // Send 6-digit OTP email in background
    sendOtpEmail(user.email, user.name, otp).catch((err) => {
      console.warn('Background OTP send notice:', err.message);
    });

    res.status(200).json({
      message: 'Verification code sent to your email. It is valid for 5 minutes.',
      requiresOtp: true,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify 6-digit OTP code and complete user registration
 */
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and 6-digit OTP code are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    const user = await User.findOne({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(404).json({ error: 'Account not found. Please register first.' });
    }

    // Check Redis for active 5-minute OTP
    let redisOtp = null;
    try {
      redisOtp = await redis.get(`otp:${cleanEmail}`);
    } catch (rErr) {
      console.warn('Redis read warning:', rErr.message);
    }

    // Check DB record for validation fallback
    const isDbValid = user.otpCode && user.otpCode === cleanOtp && user.otpExpiresAt && new Date(user.otpExpiresAt) > new Date();

    if ((!redisOtp || redisOtp !== cleanOtp) && !isDbValid) {
      return res.status(400).json({
        error: 'Invalid or expired OTP code. Codes are valid for 5 minutes only. Please request a new code.',
      });
    }

    // OTP Verified! Mark user as verified and clear OTP fields
    user.isVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;
    await user.save();

    // Remove OTP from Redis
    try {
      await redis.del(`otp:${cleanEmail}`);
    } catch (e) {}

    // Send welcome email upon successful verification
    sendWelcomeEmail(user).catch(console.error);

    const token = generateToken(user);

    res.json({
      message: 'Account verified successfully! Welcome to BooKMe.',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/resend-otp
 * Resend a new 6-digit OTP to the user's email
 */
router.post('/resend-otp', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ where: { email: cleanEmail } });

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'This account is already verified. Please log in.' });
    }

    // Generate fresh OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    user.otpCode = otp;
    user.otpExpiresAt = expiresAt;
    await user.save();

    // Set in Redis with 300s TTL
    try {
      await redis.set(`otp:${cleanEmail}`, otp, 'EX', 300);
    } catch (e) {}

    // Send email in background
    sendOtpEmail(user.email, user.name, otp).catch((err) => {
      console.warn('Background OTP resend notice:', err.message);
    });

    res.json({
      message: 'A fresh 6-digit verification code has been sent to your email. Valid for 5 minutes.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const trimmedPassword = String(password).trim();

    let user = await User.findOne({ where: { email: cleanEmail } });

    // Auto-provision or recover standard demo accounts
    const demoAccounts = {
      'admin@luminatix.com': { name: 'System Admin', role: 'admin' },
      'organiser@luminatix.com': { name: 'Neon Horizon Productions', role: 'organiser' },
      'customer@luminatix.com': { name: 'Alex Rivers', role: 'customer' },
    };

    if (demoAccounts[cleanEmail]) {
      const demoInfo = demoAccounts[cleanEmail];
      if (!user) {
        user = await User.create({
          name: demoInfo.name,
          email: cleanEmail,
          password: 'password123',
          role: demoInfo.role,
          isVerified: true,
        });
      } else {
        if (!user.isVerified) {
          user.isVerified = true;
          await user.save();
        }
        if (trimmedPassword === 'password123') {
          const valid = await user.validatePassword('password123');
          if (!valid) {
            user.password = await bcrypt.hash('password123', 12);
            await user.save();
          }
        }
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await user.validatePassword(trimmedPassword);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.isVerified === false) {
      // Generate and send a new OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otpCode = otp;
      user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();
      try {
        await redis.set(`otp:${cleanEmail}`, otp, 'EX', 300);
      } catch (e) {}
      sendOtpEmail(user.email, user.name, otp).catch(console.error);

      return res.status(403).json({
        error: 'Your email is not verified yet. A fresh OTP has been sent to your inbox.',
        requiresOtp: true,
        email: user.email,
      });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user.toJSON() });
});


/**
 * POST /api/auth/forgot-password
 * Trigger OTP for password reset
 */
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ where: { email: cleanEmail } });

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    user.otpCode = otp;
    user.otpExpiresAt = expiresAt;
    await user.save();

    try {
      await redis.set(`otp:reset:${cleanEmail}`, otp, 'EX', 300);
    } catch (e) {}

    sendResetPasswordOtpEmail(user.email, user.name, otp).catch(console.error);

    res.json({
      message: 'Password reset OTP sent to your email. Valid for 5 minutes.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/reset-password
 * Verify OTP and reset password
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    const user = await User.findOne({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(404).json({ error: 'Account not found' });
    }

    let redisOtp = null;
    try {
      redisOtp = await redis.get(`otp:reset:${cleanEmail}`);
    } catch (rErr) {}

    const isDbValid = user.otpCode && user.otpCode === cleanOtp && user.otpExpiresAt && new Date(user.otpExpiresAt) > new Date();

    if ((!redisOtp || redisOtp !== cleanOtp) && !isDbValid) {
      return res.status(400).json({
        error: 'Invalid or expired OTP code. Codes are valid for 5 minutes only.',
      });
    }

    user.password = newPassword; 
    user.otpCode = null;
    user.otpExpiresAt = null;
    await user.save();

    try {
      await redis.del(`otp:reset:${cleanEmail}`);
    } catch (e) {}

    res.json({
      message: 'Password has been reset successfully. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

