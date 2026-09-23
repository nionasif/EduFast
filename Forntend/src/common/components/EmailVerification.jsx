import { useState, useEffect } from 'react';

export default function EmailVerification({
  email,
  setEmail,
  name = '',
  isVerified,
  setIsVerified,
  addToast,
  role = 'student'
}) {
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const validateEmail = (val) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(String(val).trim());
  };

  const handleSendOtp = async () => {
    setErrorMsg('');

    if (!email || !email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (!validateEmail(email)) {
      setErrorMsg('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    setIsSending(true);

    try {
      const res = await fetch('http://localhost:5001/api/auth/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name || (role === 'teacher' ? 'Instructor' : 'Student')
        })
      });

      const data = await res.json();
      setIsSending(false);

      if (res.ok && data.success) {
        setOtpSent(true);
        setCountdown(60);
        addToast(
          `Verification code sent to ${email.trim()}! Please check your inbox.`,
          'success'
        );
      } else {
        const msg = data.error || 'Failed to send verification email.';
        setErrorMsg(msg);
        addToast(msg, 'error');
        if (data.retryAfter) {
          setCountdown(data.retryAfter);
          setOtpSent(true);
        }
      }
    } catch (err) {
      setIsSending(false);
      console.error('Send OTP error:', err);
      const msg = 'Network error: Cannot connect to server on port 5001.';
      setErrorMsg(msg);
      addToast(msg, 'error');
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMsg('');

    const cleanOtp = otpCode.trim();
    if (!cleanOtp) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    if (cleanOtp.length !== 6) {
      setErrorMsg('Verification code must be exactly 6 digits.');
      return;
    }

    setIsVerifying(true);

    try {
      const res = await fetch('http://localhost:5001/api/auth/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: cleanOtp
        })
      });

      const data = await res.json();
      setIsVerifying(false);

      if (res.ok && data.success) {
        setIsVerified(true);
        addToast('Email verified successfully! Registration form unlocked.', 'success');
      } else {
        const msg = data.error || 'Invalid verification code.';
        setErrorMsg(msg);
        addToast(msg, 'error');
      }
    } catch (err) {
      setIsVerifying(false);
      console.error('Verify OTP error:', err);
      const msg = 'Network error: Could not verify code.';
      setErrorMsg(msg);
      addToast(msg, 'error');
    }
  };

  const handleReset = () => {
    if (!isVerified) {
      setOtpSent(false);
      setOtpCode('');
      setErrorMsg('');
    }
  };

  const handleEditVerified = () => {
    if (window.confirm('Do you want to change your verified email? You will need to re-verify.')) {
      setIsVerified(false);
      setOtpSent(false);
      setOtpCode('');
      setErrorMsg('');
    }
  };

  return (
    <div
      className="form-group email-verification-card"
      style={{
        border: isVerified ? '2px solid #38b2ac' : '1px solid var(--gray-200, #e2e8f0)',
        padding: '1.4rem',
        borderRadius: '12px',
        backgroundColor: isVerified ? '#f0fdfa' : '#fafafa',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
        <label className="form-label" style={{ fontWeight: '700', fontSize: '1rem', color: '#1a202c', margin: 0 }}>
          ✉️ Email Address & Verification (ইমেইল ভেরিফিকেশন) <span style={{ color: '#e53e3e' }}>*</span>
        </label>
        {isVerified && (
          <span
            style={{
              fontSize: '0.8rem',
              backgroundColor: '#319795',
              color: '#ffffff',
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              fontWeight: '600'
            }}
          >
            ✓ Verified
          </span>
        )}
      </div>

      <p style={{ fontSize: '0.875rem', color: '#718096', margin: '0 0 1rem 0', lineHeight: '1.4' }}>
        {isVerified
          ? 'Your email address has been verified with a secure 6-digit code. The sign-up form below is unlocked.'
          : 'Enter your valid email address to receive a 6-digit verification code via Gmail SMTP. This unlocks your registration form.'}
      </p>

      {/* Email Input & Action Area */}
      <div className="otp-verification-container" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px' }}>
          <input
            type="email"
            className="form-input"
            placeholder="e.g. yourname@gmail.com"
            value={email}
            onChange={(e) => {
              if (!otpSent && !isVerified) {
                setEmail(e.target.value);
              }
            }}
            disabled={otpSent || isVerified}
            style={{
              width: '100%',
              backgroundColor: otpSent || isVerified ? '#f7fafc' : '#ffffff',
              borderColor: isVerified ? '#38b2ac' : undefined
            }}
            required
          />
        </div>

        {!otpSent && !isVerified && (
          <button
            type="button"
            className="btn btn-teal"
            onClick={handleSendOtp}
            disabled={isSending || !email}
            style={{
              padding: '0.75rem 1.4rem',
              height: '46px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '600'
            }}
          >
            {isSending ? (
              <>
                <span
                  style={{
                    display: 'inline-block',
                    width: '14px',
                    height: '14px',
                    border: '2px solid #ffffff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}
                />
                Sending...
              </>
            ) : (
              'Send Verification OTP'
            )}
          </button>
        )}

        {otpSent && !isVerified && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReset}
            style={{ padding: '0.75rem 1.25rem', height: '46px' }}
          >
            Change Email
          </button>
        )}

        {isVerified && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleEditVerified}
            style={{ padding: '0.5rem 1rem', height: '46px', fontSize: '0.85rem' }}
          >
            Edit Email
          </button>
        )}
      </div>

      {errorMsg && (
        <span
          className="size-error"
          style={{
            display: 'block',
            marginTop: '0.5rem',
            color: '#e53e3e',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          ⚠️ {errorMsg}
        </span>
      )}

      {/* Verified Success Notification */}
      {isVerified && (
        <div
          style={{
            marginTop: '0.85rem',
            backgroundColor: '#c6f6d5',
            borderColor: '#9ae6b4',
            color: '#22543d',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontWeight: '500'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>✅</span>
          <div>
            <strong>Email Verified:</strong> {email} — Registration unlocked. Fill the details below and submit!
          </div>
        </div>
      )}

      {/* OTP Entry Area */}
      {otpSent && !isVerified && (
        <div
          style={{
            marginTop: '1.2rem',
            paddingTop: '1.2rem',
            borderTop: '1px dashed #cbd5e0'
          }}
        >
          <p style={{ fontSize: '0.875rem', color: '#4a5568', marginBottom: '0.5rem' }}>
            Enter the <strong>6-digit verification code</strong> sent to <strong>{email}</strong>:
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1 1 200px', maxWidth: '260px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="6-Digit OTP (e.g. 123456)"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                style={{
                  fontSize: '1.15rem',
                  fontWeight: '700',
                  letterSpacing: '4px',
                  textAlign: 'center',
                  fontFamily: 'Consolas, Monaco, monospace'
                }}
                autoFocus
              />
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleVerifyOtp}
              disabled={isVerifying || otpCode.length !== 6}
              style={{
                height: '46px',
                padding: '0.75rem 1.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '600'
              }}
            >
              {isVerifying ? (
                <>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '14px',
                      height: '14px',
                      border: '2px solid #ffffff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}
                  />
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </button>

            <button
              type="button"
              className="btn btn-outline"
              onClick={handleSendOtp}
              disabled={isSending || countdown > 0}
              style={{
                height: '46px',
                padding: '0.75rem 1rem',
                fontSize: '0.85rem',
                color: countdown > 0 ? '#a0aec0' : 'var(--primary-teal, #319795)'
              }}
            >
              {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
