const nodemailer = require('nodemailer');
const dns = require('dns');

// Force IPv4 lookup first to prevent ENETUNREACH on cloud environments (Render, Linux containers)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

/**
 * Creates and returns a Nodemailer transporter using Gmail SMTP credentials.
 */
function createMailTransporter() {
  const emailUser = (process.env.EMAIL_USER && process.env.EMAIL_USER.trim()) || 'edu.fast.000@gmail.com';
  const emailPass = (process.env.EMAIL_APP_PASSWORD && process.env.EMAIL_APP_PASSWORD.trim()) || 'kkht thjk tkyj khrt';

  if (!emailUser || !emailPass || emailPass === 'YOUR_GMAIL_APP_PASSWORD' || emailPass.includes('YOUR_')) {
    return null;
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for port 465
    family: 4, // Force IPv4 to prevent IPv6 ENETUNREACH
    connectionTimeout: 3500, // 3.5s fast timeout if cloud host drops SMTP packets
    greetingTimeout: 3500,
    socketTimeout: 3500,
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
