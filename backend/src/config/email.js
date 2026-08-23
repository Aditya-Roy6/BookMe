const nodemailer = require('nodemailer');

let transporter;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.GOOGLE_REFRESH_TOKEN) {
    // Use Gmail OAuth2
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_FROM, // Ensure this matches your Gmail address
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      },
    });
    console.log('📧 Configured to send emails via Gmail OAuth2');
  } else if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const isGmail = (process.env.SMTP_HOST || '').includes('gmail') || (process.env.SMTP_USER || '').includes('@gmail.com');
    const cleanPass = process.env.SMTP_PASS.replace(/\s+/g, '');
    
    if (isGmail) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: cleanPass,
        },
      });
      console.log(`📧 Configured to send emails via Gmail SMTP (${process.env.SMTP_USER})`);
    } else {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: parseInt(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: cleanPass,
        },
      });
      console.log(`📧 Configured to send emails via SMTP (${process.env.SMTP_HOST})`);
    }
  } else {
    // Auto-create Ethereal test account for development
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
