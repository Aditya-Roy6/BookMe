require('dotenv').config();
const nodemailer = require('nodemailer');

let transporter;

async function getTransporter() {
  if (transporter) return transporter;

  const smtpUser = process.env.SMTP_USER || 'aditya.roy9395525@gmail.com';
  const smtpPass = (process.env.SMTP_PASS || 'rokforxovbhsppoe').replace(/\s+/g, '');
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465');

  if (process.env.GOOGLE_REFRESH_TOKEN) {
    // Use Gmail OAuth2
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_FROM || smtpUser,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      },
    });
    console.log('📧 Configured to send emails via Gmail OAuth2');
  } else if (smtpUser && smtpPass) {
    const isGmail = smtpHost.includes('gmail') || smtpUser.includes('@gmail.com');
    
    if (isGmail) {
      transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
      console.log(`📧 Configured to send emails via Gmail SMTP (${smtpUser})`);
    } else {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
      console.log(`📧 Configured to send emails via SMTP (${smtpHost})`);
    }
  } else {
    // Auto-create Ethereal test account for development fallback
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('📧 Ethereal email account:', testAccount.user);
  }

  return transporter;
}

module.exports = { getTransporter };

