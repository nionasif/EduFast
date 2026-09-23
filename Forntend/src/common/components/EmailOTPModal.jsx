import React, { useState, useEffect, useRef } from 'react';

export default function EmailOTPModal({
  isOpen,
  onClose,
  email,
  onVerificationSuccess,
  addToast
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 5-minute OTP expiration timer (300 seconds)
  const [expiresIn, setExpiresIn] = useState(300);

  // 60-second Resend cooldown timer
  const [resendCooldown, setResendCooldown] = useState(60);

  const inputRefs = useRef([]);

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setErrorMessage('');
      setSuccessMessage('');
      setLoading(false);
      setExpiresIn(300);
      setResendCooldown(60);

      // Focus first input box
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen, email]);

  // Expiration countdown
  useEffect(() => {
    if (!isOpen || expiresIn <= 0) return;
    const interval = setInterval(() => {
      setExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, expiresIn]);

  // Resend cooldown countdown
  useEffect(() => {
    if (!isOpen || resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, resendCooldown]);

  if (!isOpen) return null;

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleChange = (index, value) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setErrorMessage('');

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setDigits(newDigits);
    setErrorMessage('');

    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const completeOtp = digits.join('');
  const isOtpComplete = completeOtp.length === 6;

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!isOtpComplete || loading) return;

    if (expiresIn <= 0) {
      setErrorMessage('This verification code has expired. Please request a new code.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('http://localhost:5001/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          otp: completeOtp
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Verification failed. Please try again.');
      }

      setSuccessMessage('Email verified successfully! Activating your account...');
      if (addToast) {
        addToast('Email verified successfully!', 'success');
      }

      setTimeout(() => {
        if (onVerificationSuccess) {
          onVerificationSuccess(data.user || { email });
        }
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMessage(err.message || 'Invalid verification code.');
      if (addToast) {
        addToast(err.message || 'Verification failed.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setErrorMessage('');

    try {
      const response = await fetch('http://localhost:5001/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to resend code.');
      }

      // Reset timers and inputs
      setDigits(['', '', '', '', '', '']);
      setExpiresIn(300);
      setResendCooldown(60);
      setErrorMessage('');
      if (addToast) {
        addToast('A new 6-digit verification code has been sent to your email!', 'info');
      }
      inputRefs.current[0]?.focus();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to resend code.');
      if (addToast) {
        addToast(err.message || 'Resend failed.', 'error');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '460px',
          width: '92%',
          padding: '2rem 1.75rem',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
          position: 'relative'
        }}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>

        {/* Header Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(49, 151, 149, 0.12)',
              color: 'var(--primary-teal, #319795)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              margin: '0 auto 0.75rem auto'
            }}
          >
            ✉️
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-teal, #319795)', margin: 0 }}>
            Verify Your Email
          </h2>
          <p style={{ color: 'var(--gray-600, #718096)', fontSize: '0.88rem', margin: '0.4rem 0 0 0' }}>
            We've sent a 6-digit verification code to:
          </p>
          <div
            style={{
              display: 'inline-block',
              backgroundColor: 'rgba(49, 151, 149, 0.08)',
              padding: '0.3rem 0.8rem',
              borderRadius: '6px',
              fontWeight: 700,
              color: 'var(--text-charcoal, #2d3748)',
              fontSize: '0.92rem',
              marginTop: '0.35rem'
            }}
          >
            {email}
          </div>
        </div>

        {/* Error Notification Alert */}
        {errorMessage && (
          <div
            style={{
              backgroundColor: '#fff5f5',
              border: '1px solid #feb2b2',
              color: '#c53030',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div
            style={{
              backgroundColor: '#f0fff4',
              border: '1px solid #9ae6b4',
              color: '#276749',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>✅</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* 6 Digit Inputs */}
        <form onSubmit={handleVerify}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem'
            }}
            onPaste={handlePaste}
          >
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={loading || expiresIn <= 0}
                style={{
                  width: '48px',
                  height: '56px',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  textAlign: 'center',
                  borderRadius: '10px',
                  border: digit ? '2px solid var(--primary-teal, #319795)' : '1px solid #cbd5e0',
                  backgroundColor: digit ? 'rgba(49, 151, 149, 0.04)' : '#ffffff',
                  color: '#2d3748',
                  outline: 'none',
                  transition: 'all 0.15s ease'
                }}
              />
            ))}
          </div>

          {/* Expiration Timer display */}
          <div
            style={{
              textAlign: 'center',
              fontSize: '0.85rem',
              color: expiresIn <= 60 ? '#e53e3e' : '#718096',
              fontWeight: 600,
              marginBottom: '1.25rem'
            }}
          >
            {expiresIn > 0 ? (
              <span>⏱️ Code expires in: <strong>{formatTimer(expiresIn)}</strong></span>
            ) : (
              <span style={{ color: '#e53e3e' }}>❌ Verification code has expired. Please resend code.</span>
            )}
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            className="btn btn-teal"
            disabled={!isOtpComplete || loading || expiresIn <= 0}
            style={{
              width: '100%',
              height: '46px',
              fontWeight: 700,
              fontSize: '0.98rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? (
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
                Verifying Code...
              </>
            ) : (
              'Verify OTP & Activate Account'
            )}
          </button>
        </form>

        {/* Resend OTP Section */}
        <div
          style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            fontSize: '0.86rem',
            color: '#718096',
            borderTop: '1px solid #edf2f7',
            paddingTop: '1rem'
          }}
        >
          <span>Didn't receive the code? </span>
          {resendCooldown > 0 ? (
            <span style={{ color: '#a0aec0', fontWeight: 600 }}>
              Resend code in {resendCooldown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-teal, #319795)',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0
              }}
            >
              {resending ? 'Sending...' : 'Resend OTP'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
