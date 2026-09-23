const nodemailer = require('nodemailer');

/**
 * Creates and returns a Nodemailer transporter using Gmail SMTP credentials.
 */
function createMailTransporter() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_APP_PASSWORD;

  if (!emailUser || !emailPass || emailPass === 'YOUR_GMAIL_APP_PASSWORD' || emailPass.includes('YOUR_')) {
    return null;
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for port 465
    auth: {
      user: emailUser,
      pass: emailPass.replace(/\s+/g, '') // remove any spaces in Google App Password
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

module.exports = {
  createMailTransporter
};
