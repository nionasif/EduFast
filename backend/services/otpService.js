const crypto = require('crypto');
const { createMailTransporter } = require('../config/mailer');

/**
 * In-memory cache for pre-registration email verifications.
 */
const preRegistrationOtps = new Map();
const preVerifiedEmails = new Set();

/**
 * Generates exactly 6 cryptographically secure digits.
 */
function generateSecureOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hashes OTP using SHA-256 for secure storage.
 */
function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
}

/**
 * Sends a branded HTML email with the 6-digit OTP code using Gmail SMTP.
 */
async function sendOtpEmail(recipientEmail, recipientName, otp) {
  const transporter = createMailTransporter();
  if (!transporter) {
    console.error('[Email Error] Gmail SMTP is not configured in backend/.env!');
    throw new Error('Email service configuration missing. Please configure EMAIL_APP_PASSWORD in backend/.env.');
  }

  const senderEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'asifhossainkhannion@gmail.com';
  const fromHeader = `"EduFast" <${senderEmail}>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your EduFast Verification Code</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2d3748;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6f9;padding:40px 15px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" style="max-width:540px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">
              <!-- Header Banner -->
              <tr>
                <td style="background:linear-gradient(135deg, #319795 0%, #234e52 100%);padding:32px 40px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:28px;letter-spacing:-0.5px;">Edufast<span style="color:#f6ad55;">.</span></h1>
                  <p style="color:#e6fffa;margin:6px 0 0 0;font-size:14px;">Next-Gen Admission Preparation & Live Learning</p>
                </td>
              </tr>
              <!-- Main Body -->
              <tr>
                <td style="padding:36px 40px;">
                  <p style="font-size:16px;line-height:24px;margin:0 0 16px 0;color:#2d3748;">
                    Hello <strong>${recipientName || 'Student'}</strong>,
                  </p>
                  <p style="font-size:15px;line-height:24px;margin:0 0 24px 0;color:#4a5568;">
                    Welcome to EduFast. Use the 6-digit verification code below to activate your account and verify your email:
                  </p>
                  <!-- OTP Code Box -->
                  <div style="text-align:center;margin:28px 0;">
                    <div style="display:inline-block;background:#f0fdfa;border:2px dashed #319795;border-radius:12px;padding:16px 36px;">
                      <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#234e52;font-family:Consolas,Monaco,monospace;">${otp}</span>
                    </div>
                  </div>
                  <p style="font-size:14px;line-height:22px;color:#718096;margin:24px 0 12px 0;text-align:center;">
                    ⏱️ <strong>This code will expire in 5 minutes.</strong>
                  </p>
                  <p style="font-size:13px;line-height:20px;color:#a0aec0;margin:0 0 24px 0;text-align:center;">
                    For your security, do not share this code with anyone.
                  </p>
                  <hr style="border:none;border-top:1px solid #edf2f7;margin:24px 0;" />
                  <p style="font-size:12px;line-height:18px;color:#a0aec0;margin:0;">
                    If you did not create an EduFast account, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#f7fafc;padding:18px 40px;text-align:center;border-top:1px solid #edf2f7;">
                  <p style="font-size:12px;color:#718096;margin:0;">
                    &copy; ${new Date().getFullYear()} EduFast Learning Platform. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const textContent = `Hello ${recipientName || 'Student'},\n\nWelcome to EduFast.\n\nYour email verification code is:\n\n${otp}\n\nThis code will expire in 5 minutes.\n\nFor your security, do not share this code with anyone.\n\nIf you did not create an EduFast account, you can safely ignore this email.\n\nRegards,\nEduFast Team`;

  await transporter.sendMail({
    from: fromHeader,
    to: recipientEmail,
    subject: 'Your EduFast Verification Code',
    text: textContent,
    html: htmlContent
  });

  console.log(`[Email Service] Successfully sent OTP email to: ${recipientEmail}`);
}

module.exports = {
  generateSecureOtp,
  hashOtp,
  sendOtpEmail,
  preRegistrationOtps,
  preVerifiedEmails
};
