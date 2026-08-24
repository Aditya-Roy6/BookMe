const https = require('https');
const { getTransporter } = require('../config/email');

const SENDER = process.env.EMAIL_FROM || 'BooKMe <aditya.roy9395525@gmail.com>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://bookme-jet.vercel.app';

/**
 * Send email via Resend HTTPS REST API (Port 443 - 100% works on cloud hosts like Render)
 */
async function sendViaResend(apiKey, { from, to, subject, html, attachments }) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      from: from || process.env.EMAIL_FROM || 'BooKMe <onboarding@resend.dev>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      attachments: attachments
        ? attachments.map((a) => ({
            filename: a.filename,
            content: a.content ? (Buffer.isBuffer(a.content) ? a.content.toString('base64') : a.content) : undefined,
          }))
        : undefined,
    });

    const req = https.request(
      {
        hostname: 'api.resend.com',
        path: '/emails',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ success: true, messageId: json.id });
            } else {
              reject(new Error(json.message || data));
            }
          } catch (e) {
            resolve({ success: true, raw: data });
          }
        });
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Send email via Brevo HTTPS REST API (Port 443)
 */
async function sendViaBrevo(apiKey, { from, to, subject, html, attachments }) {
  return new Promise((resolve, reject) => {
    const rawSender = from || process.env.EMAIL_FROM || 'aditya.roy9395525@gmail.com';
    const cleanSenderEmail = rawSender.includes('<')
      ? rawSender.match(/<([^>]+)>/)?.[1] || rawSender
      : rawSender;

    const payload = JSON.stringify({
      sender: { name: 'BooKMe', email: cleanSenderEmail.trim() },
      to: [{ email: Array.isArray(to) ? to[0] : to }],
      subject,
      htmlContent: html,
      attachment: attachments
        ? attachments.map((a) => ({
            name: a.filename,
            content: a.content ? (Buffer.isBuffer(a.content) ? a.content.toString('base64') : a.content) : undefined,
          }))
        : undefined,
    });

    const req = https.request(
      {
        hostname: 'api.brevo.com',
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(data);
              resolve({ success: true, messageId: parsed.messageId });
            } catch (e) {
              resolve({ success: true });
            }
          } else {
            console.error('Brevo API Error:', data);
            reject(new Error(data));
          }
        });
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Unified email dispatch supporting HTTPS APIs (Resend, Brevo) and SMTP
 */
async function dispatchEmail({ to, subject, html, attachments, from }) {
  const sender = from || SENDER;

  if (process.env.RESEND_API_KEY) {
    return sendViaResend(process.env.RESEND_API_KEY, { from: sender, to, subject, html, attachments });
  }

  if (process.env.BREVO_API_KEY) {
    return sendViaBrevo(process.env.BREVO_API_KEY, { from: sender, to, subject, html, attachments });
  }

  const transporter = await getTransporter();
  return transporter.sendMail({
    from: sender,
    to,
    subject,
    html,
    attachments,
  });
}

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
            <img src="https://bookme-backend-edh7.onrender.com/api/bookings/public/qr/${booking.bookingRef}.png" alt="Booking QR Pass" width="200" height="200" style="display: block; width: 200px; height: 200px; border-radius: 12px; margin: 0 auto;" />
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

        <!-- Action Buttons: Download PNG & View Ticket Online -->
        <div style="margin-top: 24px; text-align: center;">
          <table align="center" style="margin: 0 auto; border-collapse: separate; border-spacing: 10px 0;">
            <tr>
              <td align="center">
                <a href="https://bookme-backend-edh7.onrender.com/api/bookings/public/qr/${booking.bookingRef}.png?download=true" style="display: inline-block; background-color: #1ed760; color: #000000; font-weight: 900; font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; padding: 13px 20px; border-radius: 50px; text-decoration: none; box-shadow: 0 4px 15px rgba(30, 215, 96, 0.4);">
                  📥 Download Ticket (PNG)
                </a>
              </td>
              <td align="center">
                <a href="${FRONTEND_URL}/my-bookings?ref=${booking.bookingRef}" style="display: inline-block; background-color: #222222; color: #ffffff; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; padding: 13px 20px; border-radius: 50px; text-decoration: none; border: 1px solid #383838; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);">
                  🎟️ View Ticket Online
                </a>
              </td>
            </tr>
          </table>
        </div>
      </div>
    `;

    const info = await dispatchEmail({
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

    const info = await dispatchEmail({
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

    const info = await dispatchEmail({
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

    const info = await dispatchEmail({
      from: SENDER,
      to: user.email,
      subject: 'Welcome to BooKMe! 🎉',
      html,
    });

    console.log(`📩 Welcome email sent to ${user.email} (Message ID: ${info.messageId})`);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

/**
 * Send 6-Digit OTP verification email
 */
async function sendOtpEmail(email, name, otp) {
  try {
    const sender = process.env.EMAIL_FROM || 'BooKMe <aditya.roy9395525@gmail.com>';

    const digitBoxesHtml = String(otp)
      .split('')
      .map(
        (digit) =>
          `<span style="display: inline-block; width: 44px; height: 54px; line-height: 54px; text-align: center; background-color: #0c0c0c; border: 2px solid #1ed760; border-radius: 10px; font-size: 28px; font-weight: 900; color: #1ed760; margin: 0 4px; box-shadow: 0 4px 14px rgba(30, 215, 96, 0.25); font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;">${digit}</span>`
      )
      .join('');

    const html = `
      <div style="background-color: #080808; padding: 40px 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center;">
        <div style="max-width: 520px; margin: 0 auto; background-color: #141416; border: 1px solid #282828; border-radius: 20px; padding: 36px 28px; box-shadow: 0 20px 50px rgba(0,0,0,0.8); text-align: center;">
          
          <!-- Logo & Header -->
          <div style="margin-bottom: 24px;">
            <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 50%; background: linear-gradient(135deg, #1ed760, #169c46); color: #000000; font-size: 24px; margin-bottom: 12px;">
              🎟️
            </div>
            <h1 style="margin: 0 0 6px 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">
              BooK<span style="color: #1ed760;">Me</span>
            </h1>
            <div style="display: inline-block; background-color: rgba(30, 215, 96, 0.12); color: #1ed760; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 5px 14px; border-radius: 20px; border: 1px solid rgba(30, 215, 96, 0.3);">
              ★ 2-STEP ACCOUNT VERIFICATION ★
            </div>
          </div>

          <!-- Greeting & Copy -->
          <p style="font-size: 16px; color: #f0f0f0; margin: 0 0 10px 0; text-align: left;">
            Hello <strong>${name || 'there'}</strong> 👋,
          </p>
          <p style="color: #a0a0a0; font-size: 14px; line-height: 1.6; margin: 0 0 28px 0; text-align: left;">
            Welcome to <strong>BooKMe</strong>! Enter the 6-digit verification code below in your browser to verify your email address and activate your account.
          </p>

          <!-- OTP Digits Container -->
          <div style="background-color: #1a1a1e; border: 1px solid #2d2d34; border-radius: 16px; padding: 26px 16px; margin: 0 0 28px 0; text-align: center;">
            <p style="margin: 0 0 16px 0; font-size: 11px; font-weight: 800; color: #888888; text-transform: uppercase; letter-spacing: 2px;">
              Your 6-Digit Security Code
            </p>
            <div style="margin: 0 auto; white-space: nowrap;">
              ${digitBoxesHtml}
            </div>
            <div style="margin-top: 18px;">
              <span style="display: inline-block; background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); color: #f87171; font-size: 11px; font-weight: 700; padding: 5px 14px; border-radius: 12px;">
                ⏱️ Code expires in 5 minutes
              </span>
            </div>
          </div>

          <!-- Security Notice -->
          <div style="background-color: rgba(255, 255, 255, 0.02); border: 1px dashed #333333; border-radius: 12px; padding: 14px; margin-bottom: 28px; text-align: left;">
            <p style="margin: 0; font-size: 12px; color: #888888; line-height: 1.5;">
              🔒 <strong>Security Tip:</strong> Never share this code with anyone. BooKMe representatives will never ask you for your verification code.
            </p>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #222226; padding-top: 20px; font-size: 11px; color: #555555; line-height: 1.6;">
            © ${new Date().getFullYear()} BooKMe Ticket Booking Platform • All Rights Reserved.<br />
            If you did not request this code, please safely disregard this email.
          </div>
        </div>
      </div>
    `;

    const info = await dispatchEmail({
      from: sender,
      to: email,
      subject: `🔐 Your BooKMe Verification Code is ${otp} (Valid for 5 mins)`,
      html,
    });

    console.log(`📩 OTP email sent to ${email} (Message ID: ${info.messageId})`);
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
    const sender = process.env.EMAIL_FROM || 'BooKMe <aditya.roy9395525@gmail.com>';
    const digitBoxesHtml = String(otp)
      .split('')
      .map(
        (digit) =>
          `<span style="display: inline-block; width: 44px; height: 54px; line-height: 54px; text-align: center; background-color: #0c0c0c; border: 2px solid #ffaa00; border-radius: 10px; font-size: 28px; font-weight: 900; color: #ffaa00; margin: 0 4px; box-shadow: 0 4px 14px rgba(255, 170, 0, 0.25); font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;">${digit}</span>`
      )
      .join('');

    const html = `
      <div style="background-color: #080808; padding: 40px 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center;">
        <div style="max-width: 520px; margin: 0 auto; background-color: #141416; border: 1px solid #282828; border-radius: 20px; padding: 36px 28px; box-shadow: 0 20px 50px rgba(0,0,0,0.8); text-align: center;">
          
          <!-- Logo & Header -->
          <div style="margin-bottom: 24px;">
            <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 50%; background: linear-gradient(135deg, #ffaa00, #d97706); color: #000000; font-size: 24px; margin-bottom: 12px;">
              🔑
            </div>
            <h1 style="margin: 0 0 6px 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">
              BooK<span style="color: #1ed760;">Me</span>
            </h1>
            <div style="display: inline-block; background-color: rgba(255, 170, 0, 0.12); color: #ffaa00; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 5px 14px; border-radius: 20px; border: 1px solid rgba(255, 170, 0, 0.3);">
              ★ PASSWORD RESET CODE ★
            </div>
          </div>

          <!-- Greeting & Copy -->
          <p style="font-size: 16px; color: #f0f0f0; margin: 0 0 10px 0; text-align: left;">
            Hello <strong>${name || 'there'}</strong> 👋,
          </p>
          <p style="color: #a0a0a0; font-size: 14px; line-height: 1.6; margin: 0 0 28px 0; text-align: left;">
            We received a request to reset your password for your <strong>BooKMe</strong> account. Enter the 6-digit verification code below to set a new password.
          </p>

          <!-- OTP Digits Container -->
          <div style="background-color: #1a1a1e; border: 1px solid #2d2d34; border-radius: 16px; padding: 26px 16px; margin: 0 0 28px 0; text-align: center;">
            <p style="margin: 0 0 16px 0; font-size: 11px; font-weight: 800; color: #888888; text-transform: uppercase; letter-spacing: 2px;">
              Your Password Reset Code
            </p>
            <div style="margin: 0 auto; white-space: nowrap;">
              ${digitBoxesHtml}
            </div>
            <div style="margin-top: 18px;">
              <span style="display: inline-block; background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); color: #f87171; font-size: 11px; font-weight: 700; padding: 5px 14px; border-radius: 12px;">
                ⏱️ Code expires in 5 minutes
              </span>
            </div>
          </div>

          <!-- Security Notice -->
          <div style="background-color: rgba(255, 255, 255, 0.02); border: 1px dashed #333333; border-radius: 12px; padding: 14px; margin-bottom: 28px; text-align: left;">
            <p style="margin: 0; font-size: 12px; color: #888888; line-height: 1.5;">
              🔒 <strong>Security Tip:</strong> If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </p>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #222226; padding-top: 20px; font-size: 11px; color: #555555; line-height: 1.6;">
            © ${new Date().getFullYear()} BooKMe Ticket Booking Platform • All Rights Reserved.
          </div>
        </div>
      </div>
    `;

    const info = await dispatchEmail({
      from: sender,
      to: email,
      subject: `🔑 BooKMe Password Reset Code: ${otp} (Valid for 5 mins)`,
      html,
    });

    console.log(`📩 Reset OTP email sent to ${email} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send reset password OTP email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  dispatchEmail,
  sendBookingConfirmation,
  sendWaitlistOfferEmail,
  sendCancellationNotice,
  sendWelcomeEmail,
  sendOtpEmail,
  sendResetPasswordOtpEmail,
};
