const { getTransporter } = require('../config/email');

const SENDER = process.env.EMAIL_FROM || 'BooKMe <noreply@bookme.com>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Send booking confirmation email with embedded QR code
 */
async function sendBookingConfirmation(user, booking, showtime, items, qrDataUrl) {
  try {
    const transporter = await getTransporter();

    const eventTitle = showtime?.event?.title || 'Your Event';
    const venueName = showtime?.event?.venue?.name || 'Venue Auditorium';
    const eventImage = showtime?.event?.imageUrl || '';

    const showDateObj = showtime?.dateTime ? new Date(showtime.dateTime) : new Date();
    const dateStr = showDateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = showDateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const seatsRowsHtml = items
      .map(item => `
        <tr>
          <td style="padding: 4px 0; color: #222222; font-size: 11px;">
            <strong>${item.seat?.label || item.seatId}</strong> (${item.seat?.category?.name || 'Standard'})
          </td>
          <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #000000; font-size: 11px;">
            ₹${Number(item.price).toFixed(2)}
          </td>
        </tr>
      `)
      .join('');

    const posterImgHtml = eventImage ? `
      <div style="margin: 8px auto 14px auto; text-align: center;">
        <img src="${eventImage}" alt="${eventTitle}" style="width: 100px; height: 145px; object-fit: cover; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
      </div>
    ` : '';

    const totalAmount = Number(booking.totalAmount);
    const baseAmount = Number((totalAmount / 1.18).toFixed(2));
    const gstAmount = Number((totalAmount - baseAmount).toFixed(2));
    const cgst = Number((gstAmount / 2).toFixed(2));
    const sgst = Number((gstAmount / 2).toFixed(2));

    const { generateFancyQRCodeSvg, generateQRCodeBuffer } = require('./qrcode');
    const qrSvgMarkup = generateFancyQRCodeSvg(booking.bookingRef, {
      imageUrl: eventImage,
      size: 200,
    });
    const qrBuffer = await generateQRCodeBuffer(booking.bookingRef, {
      imageUrl: eventImage,
      size: 280,
    });

    const html = `
      <div style="background-color: #0c0c0c; padding: 30px 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center;">
        <!-- White Thermal Ticket Receipt Body -->
        <div style="background-color: #ffffff; color: #121212; max-width: 390px; margin: 0 auto; border-radius: 12px; box-shadow: 0 10px 35px rgba(0,0,0,0.6); padding: 24px 20px 0 20px; font-family: 'Courier New', Courier, monospace, monospace; text-align: center; overflow: hidden;">
          
          <!-- Top Header -->
          <p style="margin: 0 0 10px 0; color: #16a34a; font-size: 11px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">
            ★ BOOKME OFFICIAL PASS ★
          </p>

          ${posterImgHtml}

          <!-- Title & Venue -->
          <h2 style="margin: 10px 0 4px 0; font-size: 16px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; color: #000000; font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.3;">
            ${eventTitle}
          </h2>
          <p style="margin: 0 0 14px 0; font-size: 11px; color: #555555; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
            ${venueName}
          </p>

          <!-- Dotted Divider -->
          <div style="border-top: 1px dashed #cccccc; margin: 12px 0;"></div>

          <!-- Date / Time / Guest Grid -->
          <table style="width: 100%; font-size: 11px; color: #222222; text-align: left; font-weight: bold; line-height: 1.8;">
            <tr>
              <td style="color: #777777;">DATE:</td>
              <td style="text-align: right; color: #000000;">${dateStr}</td>
            </tr>
            <tr>
              <td style="color: #777777;">TIME:</td>
              <td style="text-align: right; color: #000000;">${timeStr}</td>
            </tr>
            <tr>
              <td style="color: #777777;">GUEST:</td>
              <td style="text-align: right; color: #000000;">${user.name}</td>
            </tr>
          </table>

          <!-- Dotted Divider -->
          <div style="border-top: 1px dashed #cccccc; margin: 12px 0;"></div>

          <!-- Seats Table with Indian GST Itemization -->
          <table style="width: 100%; font-size: 11px; color: #222222; text-align: left;">
            <tr style="color: #777777; font-size: 10px;">
              <th style="padding-bottom: 6px; text-align: left;">SEAT / TIER</th>
              <th style="padding-bottom: 6px; text-align: right;">PRICE</th>
            </tr>
            ${seatsRowsHtml}
            <tr>
              <td style="padding-top: 8px; font-size: 11px; color: #555555;">TICKETS BASE VALUE:</td>
              <td style="padding-top: 8px; text-align: right; font-size: 11px; color: #555555;">₹${baseAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding-top: 3px; font-size: 10px; color: #777777;">GST (CGST 9% + SGST 9%):</td>
              <td style="padding-top: 3px; text-align: right; font-size: 10px; color: #777777;">₹${cgst.toFixed(2)} + ₹${sgst.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding-top: 8px; font-weight: 900; font-size: 13px; color: #000; border-top: 1px dashed #cccccc;">TOTAL AMOUNT:</td>
              <td style="padding-top: 8px; text-align: right; font-weight: 900; font-size: 14px; color: #000; border-top: 1px dashed #cccccc;">₹${totalAmount.toFixed(2)}</td>
            </tr>
          </table>

          <!-- Dotted Divider -->
          <div style="border-top: 1px dashed #cccccc; margin: 16px 0 12px 0;"></div>

          <!-- QR Code Section with Fancy Rounded Dots & Movie Center -->
          <p style="margin: 0 0 10px 0; font-size: 10px; font-weight: 800; letter-spacing: 1.5px; color: #777777; text-transform: uppercase;">
            SCAN AT AUDITORIUM ENTRANCE
          </p>
          <div style="margin: 0 auto; display: inline-block; padding: 10px; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 16px; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
            <img src="cid:booking-qrcode" alt="Booking QR Pass" width="200" height="200" style="display: block; width: 200px; height: 200px; border-radius: 12px; margin: 0 auto;" />
          </div>

          <!-- Reference Code -->
          <p style="margin: 14px 0 2px 0; font-size: 10px; color: #777777; letter-spacing: 1px; text-transform: uppercase;">BOOKING REFERENCE</p>
          <p style="margin: 0; font-size: 16px; font-weight: 900; letter-spacing: 2px; color: #000000;">
            ${booking.bookingRef}
          </p>

          <!-- Dotted Divider -->
          <div style="border-top: 1px dashed #cccccc; margin: 16px 0 10px 0;"></div>

          <!-- Footer Notes -->
          <p style="margin: 0 0 4px 0; font-size: 9px; color: #888888; letter-spacing: 0.5px;">
            ★ NON-REFUNDABLE 30 MIN PRIOR TO SHOW ★
          </p>
          <p style="margin: 0 0 16px 0; font-size: 10px; font-weight: 900; color: #111111; letter-spacing: 1px;">
            THANK YOU FOR BOOKING WITH BOOKME
          </p>

          <!-- Perforated Saw-tooth Tear-off Bottom Edge -->
          <div style="margin: 0 -20px; height: 14px; background: repeating-linear-gradient(90deg, #ffffff 0, #ffffff 12px, #0c0c0c 12px, #0c0c0c 24px); border-top: 1px dashed #cccccc;"></div>
        </div>

        <!-- Download Action Button -->
        <div style="margin-top: 24px; text-align: center;">
          <a href="${FRONTEND_URL}/my-bookings" style="display: inline-block; background-color: #1ed760; color: #000000; font-weight: 900; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; padding: 14px 28px; border-radius: 50px; text-decoration: none; box-shadow: 0 4px 15px rgba(30, 215, 96, 0.4);">
            📥 Download Thermal Ticket Pass (PDF)
          </a>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: SENDER,
      to: user.email,
      subject: `🎟️ Booking Confirmed: ${eventTitle} (${booking.bookingRef})`,
      html,
      attachments: [
        {
          filename: `ticket-qr-${booking.bookingRef}.png`,
          content: qrBuffer,
          cid: 'booking-qrcode',
          contentType: 'image/png',
        },
      ],
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send booking email:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send waitlist time-limited offer email
 */
async function sendWaitlistOfferEmail(user, showtime, offerToken, expiresAt) {
  try {
    const transporter = await getTransporter();
    const eventTitle = showtime?.event?.title || 'Event';
    const claimUrl = `${FRONTEND_URL}/waitlist/claim/${offerToken}`;
    const expiryFormatted = new Date(expiresAt).toLocaleTimeString();

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #121212; color: #ffffff; border-radius: 12px; border: 1px solid #222;">
        <h1 style="color: #ffffff; margin-bottom: 8px; font-weight: 900; letter-spacing: -0.5px;">BooK<span style="color: #1ed760;">Me</span></h1>
        <h2 style="color: #f59e0b; margin-top: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">A Seat Just Opened Up! 🎟️</h2>
        <p style="font-size: 16px; color: #e5e5e5;">Hello <strong>${user.name}</strong>,</p>
        <p style="color: #a3a3a3;">Great news! A seat in your requested category has opened up for <strong style="color: #fff;">${eventTitle}</strong>.</p>
        
        <div style="background-color: #181818; padding: 24px; border-radius: 12px; margin: 24px 0; border: 1px solid #332614;">
          <div style="background-color: #ff333320; border: 1px solid #ff333340; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #ff4444; font-weight: bold; margin: 0; text-align: center;">⚠️ This offer expires at ${expiryFormatted}!</p>
          </div>
          <p style="color: #a3a3a3; font-size: 14px; text-align: center; margin-bottom: 24px;">If you do not complete your booking before this time, the seat will automatically be offered to the next person in line.</p>
          
          <div style="text-align: center;">
            <a href="${claimUrl}" style="background-color: #1ed760; color: #000000; text-decoration: none; padding: 14px 28px; border-radius: 30px; font-weight: 900; display: inline-block; text-transform: uppercase; letter-spacing: 1px; font-size: 14px;">
              Complete Your Booking Now
            </a>
          </div>
        </div>

        <p style="font-size: 12px; color: #666; text-align: center; margin-top: 32px;">BooKMe Automated Waitlist System</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: SENDER,
      to: user.email,
      subject: `⚡ Action Required: Seat Available for ${eventTitle} (Time-Limited Offer)`,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send waitlist offer email:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send cancellation confirmation email
 */
async function sendCancellationNotice(user, booking, showtime) {
  try {
    const transporter = await getTransporter();
    const eventTitle = showtime?.event?.title || 'Event';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #121212; color: #ffffff; border-radius: 12px; border: 1px solid #222;">
        <h1 style="color: #ffffff; margin-bottom: 8px; font-weight: 900; letter-spacing: -0.5px;">BooK<span style="color: #1ed760;">Me</span></h1>
        <h2 style="color: #ff4444; margin-top: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">Booking Cancelled</h2>
        <p style="color: #e5e5e5;">Hello <strong>${user.name}</strong>,</p>
        <p style="color: #a3a3a3;">Your booking <strong style="color: #fff;">${booking.bookingRef}</strong> for <strong style="color: #fff;">${eventTitle}</strong> has been cancelled.</p>
        
        <div style="background-color: #181818; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #282828;">
          <p style="margin: 0; color: #a3a3a3; font-size: 14px;">Any refunded amount (if applicable according to policy) will be processed to your original payment method in ₹.</p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: SENDER,
      to: user.email,
      subject: `❌ Booking Cancelled: ${eventTitle} (${booking.bookingRef})`,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send cancellation notice:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send welcome email on registration
 */
async function sendWelcomeEmail(user) {
  try {
    const transporter = await getTransporter();

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #121212; color: #ffffff; border-radius: 12px; border: 1px solid #222;">
        <h1 style="color: #ffffff; margin-bottom: 8px; font-weight: 900; letter-spacing: -0.5px;">BooK<span style="color: #1ed760;">Me</span></h1>
        <h2 style="color: #1ed760; margin-top: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">Welcome to BooKMe! 🍿</h2>
        <p style="font-size: 16px; color: #e5e5e5;">Hello <strong>${user.name}</strong>,</p>
        <p style="color: #a3a3a3; font-size: 15px; line-height: 1.5;">We're thrilled to have you on board. Discover the best movies, concerts, and events happening around you.</p>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="${FRONTEND_URL}" style="display: inline-block; padding: 14px 28px; background-color: #1ed760; color: #000000; text-decoration: none; font-weight: bold; border-radius: 30px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Explore Events</a>
        </div>
        
        <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
          © ${new Date().getFullYear()} BooKMe. All rights reserved.<br>
          If you didn't sign up for this account, please ignore this email.
        </p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: SENDER,
      to: user.email,
      subject: 'Welcome to BooKMe! 🎉',
      html,
    });

    console.log(`📩 Welcome email sent to ${user.email} (Message ID: ${info.messageId})`);
    if (info.messageId && transporter.options.host === 'smtp.ethereal.email') {
      console.log(`🔗 Preview URL: ${require('nodemailer').getTestMessageUrl(info)}`);
    }
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

/**
 * Send 6-Digit OTP verification email
 */
async function sendOtpEmail(email, name, otp) {
  try {
    const transporter = await getTransporter();
    const sender = process.env.EMAIL_FROM || 'BooKMe <aditya.roy9395525@gmail.com>';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 28px; background-color: #121212; color: #ffffff; border-radius: 16px; border: 1px solid #282828;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #ffffff; margin: 0 0 6px 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">BooK<span style="color: #1ed760;">Me</span></h1>
          <span style="display: inline-block; background-color: #1ed76020; color: #1ed760; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 12px; border-radius: 20px; border: 1px solid #1ed76040;">Email Verification</span>
        </div>

        <p style="font-size: 16px; color: #f5f5f5; margin-bottom: 12px;">Hello <strong>${name || 'there'}</strong>,</p>
        <p style="color: #b3b3b3; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          Thank you for signing up for BooKMe. Use the 6-digit verification code below to complete your registration:
        </p>
        
        <div style="background-color: #181818; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center; border: 1px solid #333338;">
          <p style="margin: 0 0 8px 0; font-size: 11px; color: #7c7c7c; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">Your Verification OTP</p>
          <div style="font-family: monospace, Courier, monospace; font-size: 38px; font-weight: 900; color: #1ed760; letter-spacing: 8px; margin: 8px 0;">
            ${otp}
          </div>
          <div style="display: inline-block; margin-top: 10px; background-color: #ff3b3015; border: 1px solid #ff3b3030; color: #ff6b6b; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 20px;">
            ⏱️ Valid for 5 minutes only
          </div>
        </div>

        <p style="color: #7c7c7c; font-size: 13px; line-height: 1.5; text-align: center; margin-top: 24px;">
          If you didn't request this verification code, you can safely ignore this email.
        </p>
        
        <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #222222; text-align: center; font-size: 11px; color: #555555;">
          © ${new Date().getFullYear()} BooKMe Ticket Booking System • Secured by 2FA
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: sender,
      to: email,
      subject: `🔐 Your BooKMe Verification Code is ${otp} (Valid for 5 mins)`,
      html,
    });

    console.log(`📩 OTP email sent to ${email} (Message ID: ${info.messageId})`);
    if (info.messageId && transporter.options?.host === 'smtp.ethereal.email') {
      console.log(`🔗 Preview URL: ${require('nodemailer').getTestMessageUrl(info)}`);
    }
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send 6-Digit OTP for password reset
 */
async function sendResetPasswordOtpEmail(email, name, otp) {
  try {
    const transporter = await getTransporter();
    const sender = process.env.EMAIL_FROM || 'BooKMe <aditya.roy9395525@gmail.com>';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 28px; background-color: #121212; color: #ffffff; border-radius: 16px; border: 1px solid #282828;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #ffffff; margin: 0 0 6px 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">BooK<span style="color: #1ed760;">Me</span></h1>
          <span style="display: inline-block; background-color: #ffaa0020; color: #ffaa00; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 12px; border-radius: 20px; border: 1px solid #ffaa0040;">Password Reset</span>
        </div>

        <p style="font-size: 16px; color: #f5f5f5; margin-bottom: 12px;">Hello <strong>${name || 'there'}</strong>,</p>
        <p style="color: #b3b3b3; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          We received a request to reset your password for your BooKMe account. Use the 6-digit verification code below to proceed:
        </p>
        
        <div style="background-color: #181818; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center; border: 1px solid #333338;">
          <p style="margin: 0 0 8px 0; font-size: 11px; color: #7c7c7c; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">Your Reset OTP</p>
          <div style="font-family: monospace, Courier, monospace; font-size: 38px; font-weight: 900; color: #1ed760; letter-spacing: 8px; margin: 8px 0;">
            ${otp}
          </div>
          <div style="display: inline-block; margin-top: 10px; background-color: #ff3b3015; border: 1px solid #ff3b3030; color: #ff6b6b; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 20px;">
            ⏱️ Valid for 5 minutes only
          </div>
        </div>

        <p style="color: #7c7c7c; font-size: 13px; line-height: 1.5; text-align: center; margin-top: 24px;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
        
        <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #222222; text-align: center; font-size: 11px; color: #555555;">
          © ${new Date().getFullYear()} BooKMe Ticket Booking System • Secured by 2FA
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: sender,
      to: email,
      subject: `🔐 Your BooKMe Password Reset Code is ${otp} (Valid for 5 mins)`,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send reset password OTP email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendBookingConfirmation,
  sendWaitlistOfferEmail,
  sendCancellationNotice,
  sendWelcomeEmail,
  sendOtpEmail,
  sendResetPasswordOtpEmail,
};
