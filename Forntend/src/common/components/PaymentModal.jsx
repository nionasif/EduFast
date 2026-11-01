import React, { useState, useEffect, useRef } from 'react';
import './PaymentModal.css';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import {
  CheckCircle,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Lock,
  ArrowRight,
  Download,
  AlertCircle,
  X,
  Sparkles
} from 'lucide-react';

export default function PaymentModal({
  isOpen,
  onClose,
  targetItem = null,
  currentUser = null,
  onPaymentSuccess = null,
  addToast = null
}) {
  const { language } = useLanguage();
  const [selectedMethod, setSelectedMethod] = useState('bKash'); // 'bKash' | 'Nagad' | 'Rocket'
  const [step, setStep] = useState(1); // 1: Number Input, 2: OTP, 3: PIN, 4: Success
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [transactionData, setTransactionData] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(targetItem?.id || 'pro_monthly');

  const otpRefs = [useRef(), useRef(), useRef(), useRef()];

  // Pricing & Plans
  const plans = [
    {
      id: 'pro_monthly',
      name: 'Pro Admission Pass',
      price: 499,
      duration: '১ মাস (৩০ দিন)',
      badge: 'জনপ্রিয় (Most Popular)'
    },
    {
      id: 'pro_varsity',
      name: 'Varsity Conqueror',
      price: 1499,
      duration: 'সম্পূর্ণ সেশন (৬ মাস)',
      badge: 'সেরা ডিল (Best Value)'
    }
  ];

  // Active item info
  const isCourse = targetItem?.type === 'course' || Boolean(targetItem?.instructor);
  const activePlan = plans.find(p => p.id === selectedPlanId) || plans[0];
  const payableAmount = isCourse ? (targetItem.discountedPrice ?? targetItem.price ?? 500) : activePlan.price;
  const itemTitle = isCourse ? targetItem.title : activePlan.name;

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrorMsg('');
      setOtp(['', '', '', '']);
      setPin('');
      setTransactionData(null);
      if (currentUser?.mobile) {
        setMobileNumber(currentUser.mobile);
      }
      if (targetItem?.id) {
        setSelectedPlanId(targetItem.id);
      }
    }
  }, [isOpen, targetItem, currentUser]);

  if (!isOpen) return null;

  // Step 1: Submit Mobile Number -> Request simulated OTP
  const handleProceedToOtp = (e) => {
    e.preventDefault();
    const cleanNum = mobileNumber.replace(/\D/g, '');
    if (cleanNum.length < 11) {
      setErrorMsg('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      // Auto-focus first OTP input
      setTimeout(() => otpRefs[0].current?.focus(), 150);
    }, 700);
  };

  // Step 2: Handle OTP Input
  const handleOtpChange = (index, value) => {
    const val = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    if (val && index < 3) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp.join('').length < 4) {
      setErrorMsg('অনুগ্রহ করে ৪ ডিজিটের ভেরিফিকেশন কোড লিখুন।');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 600);
  };

  // Step 3: Confirm PIN & Finalize Payment with Server
  const handleFinalCheckout = async (e) => {
    e.preventDefault();
    if (pin.length < 4) {
      setErrorMsg('অনুগ্রহ করে সঠিক ৫ বা ৪ ডিজিটের পিন নম্বর দিন।');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const payload = {
        paymentMethod: selectedMethod,
        paymentType: isCourse ? 'course' : 'subscription',
        targetId: isCourse ? targetItem.id : activePlan.id,
        targetTitle: itemTitle,
        amount: payableAmount,
        senderNumber: mobileNumber,
        pin: pin,
        studentEmail: currentUser?.email,
        studentName: currentUser?.name,
        studentMobile: mobileNumber
      };

      const res = await api.post('/payment/checkout', payload);

      if (res.data?.success) {
        setTransactionData(res.data.data);
        setStep(4);

        // Update local session storage
        try {
          const saved = localStorage.getItem('edufast_student_session');
          if (saved) {
            const parsed = JSON.parse(saved);
            parsed.isPremium = true;
            parsed.subscriptionPlan = isCourse ? (parsed.subscriptionPlan || 'free') : activePlan.id;
            if (isCourse) {
              parsed.purchasedCourses = Array.from(new Set([...(parsed.purchasedCourses || []), targetItem.id]));
            }
            localStorage.setItem('edufast_student_session', JSON.stringify(parsed));
          }
        } catch (err) {}

        window.dispatchEvent(new CustomEvent('edufast-subscription-update', {
          detail: { isPremium: true, plan: activePlan.id }
        }));

        if (addToast) {
          addToast(`🎉 পেমেন্ট সফল! ৳${payableAmount} সফলভাবে পরিশোধিত হয়েছে।`, 'success');
        }

        if (onPaymentSuccess) {
          onPaymentSuccess(res.data.data);
        }
      } else {
        setErrorMsg(res.data?.error || 'পেমেন্ট সম্পন্ন করা যায়নি।');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'সার্ভার সংযোগে ত্রুটি দেখা দিয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-modal-backdrop" onClick={onClose}>
      <div className="payment-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="payment-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>💳</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
                EduFast Secure Payment Gateway
              </h3>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                ১০০% নিরাপদ ও এনক্রিপ্টেড পেমেন্ট
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: '#f1f5f9',
              border: 'none',
              color: '#475569',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="payment-modal-body">
          {/* STEP 1: Method & Phone Input */}
          {step === 1 && (
            <div>
              {/* Product / Plan Summary Box */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase' }}>
                    {isCourse ? 'Course Checkout' : 'Premium Membership'}
                  </span>
                  <h4 style={{ margin: '0.2rem 0', fontSize: '1.05rem', color: '#1e293b' }}>
                    {itemTitle}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {isCourse ? `ইন্সট্রাক্টর: ${targetItem.instructor || 'EduFast Faculty'}` : activePlan.duration}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>মোট ফি</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0d9488' }}>
                    ৳{payableAmount}
                  </div>
                </div>
              </div>

              {/* Plan Switcher for Subscription */}
              {!isCourse && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  {plans.map(p => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlanId(p.id)}
                      style={{
                        border: selectedPlanId === p.id ? '2px solid #0d9488' : '1px solid #e2e8f0',
                        background: selectedPlanId === p.id ? '#f0fdfa' : '#ffffff',
                        padding: '0.65rem 0.8rem',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: selectedPlanId === p.id ? '#0d9488' : '#64748b' }}>
                        {p.badge}
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>{p.name}</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0d9488' }}>৳{p.price}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Payment Methods */}
              <label className="payment-input-label">পেমেন্ট মাধ্যম বেছে নিন:</label>
              <div className="payment-method-selector">
                <button
                  type="button"
                  className={`method-btn bkash ${selectedMethod === 'bKash' ? 'active' : ''}`}
                  onClick={() => setSelectedMethod('bKash')}
                >
                  <span style={{ fontSize: '1.4rem' }}>🌸</span>
                  <strong style={{ fontSize: '0.85rem' }}>bKash</strong>
                </button>
                <button
                  type="button"
                  className={`method-btn nagad ${selectedMethod === 'Nagad' ? 'active' : ''}`}
                  onClick={() => setSelectedMethod('Nagad')}
                >
                  <span style={{ fontSize: '1.4rem' }}>🔥</span>
                  <strong style={{ fontSize: '0.85rem' }}>Nagad</strong>
                </button>
                <button
                  type="button"
                  className={`method-btn rocket ${selectedMethod === 'Rocket' ? 'active' : ''}`}
                  onClick={() => setSelectedMethod('Rocket')}
                >
                  <span style={{ fontSize: '1.4rem' }}>🚀</span>
                  <strong style={{ fontSize: '0.85rem' }}>Rocket</strong>
                </button>
              </div>

              {/* Dynamic Brand Banner */}
              <div className={`payment-brand-banner ${selectedMethod.toLowerCase()}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={24} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.92rem' }}>
                      {selectedMethod} Payment Checkout
                    </strong>
                    <span style={{ fontSize: '0.74rem', opacity: 0.9 }}>
                      মার্চেন্ট একাউন্ট: EduFast EduTech Ltd.
                    </span>
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>
                  ৳{payableAmount}
                </div>
              </div>

              {errorMsg && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleProceedToOtp}>
                <div className="payment-input-group">
                  <label className="payment-input-label">
                    আপনার {selectedMethod} মোবাইল একাউন্ট নম্বর:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="tel"
                      className="payment-input-control"
                      placeholder="e.g. 017XXXXXXXX"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      maxLength={11}
                      autoFocus
                    />
                    <Smartphone size={20} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.3rem', display: 'block' }}>
                    🔒 আপনার নম্বরে একটি ৪ ডিজিটের ভেরিফিকেশন ওটিপি কোড পাঠানো হবে।
                  </span>
                </div>

                <button
                  type="submit"
                  className={`payment-submit-btn ${selectedMethod.toLowerCase()}`}
                  disabled={loading}
                >
                  {loading ? 'যাচাই করা হচ্ছে...' : 'এগিয়ে যান (Proceed to OTP)'}
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 2 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f0fdfa', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                <Smartphone size={24} />
              </div>
              <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>
                {selectedMethod} ওটিপি যাচাই করুন
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.35rem 0 1rem 0' }}>
                আপনার <strong>{mobileNumber}</strong> নম্বরে পাঠানো ৪-ডিজিটের কোডটি লিখুন
              </p>

              <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '8px', fontSize: '0.78rem', color: '#0d9488', marginBottom: '1rem', display: 'inline-block' }}>
                💡 ডেমো ওটিপি কোড: <strong>1234</strong>
              </div>

              {errorMsg && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', marginBottom: '1rem' }}>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleVerifyOtp}>
                <div className="otp-box-grid">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={otpRefs[idx]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="otp-box-input"
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    />
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '10px' }}
                    onClick={() => setStep(1)}
                  >
                    নম্বর পরিবর্তন
                  </button>
                  <button
                    type="submit"
                    className={`payment-submit-btn ${selectedMethod.toLowerCase()}`}
                    style={{ flex: 2 }}
                    disabled={loading}
                  >
                    {loading ? 'যাচাই হচ্ছে...' : 'ওটিপি নিশ্চিত করুন'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: PIN Entry */}
          {step === 3 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fff1f2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                <Lock size={24} />
              </div>
              <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>
                আপনার {selectedMethod} পিন (PIN) দিন
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.35rem 0 1rem 0' }}>
                ৳{payableAmount} টাকা প্রদানের জন্য আপনার গোপন পিন দিয়ে নিশ্চিত করুন
              </p>

              {errorMsg && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', marginBottom: '1rem' }}>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleFinalCheckout}>
                <div className="payment-input-group" style={{ maxWidth: '280px', margin: '0 auto 1.5rem auto' }}>
                  <input
                    type="password"
                    className="payment-input-control"
                    placeholder="Enter PIN (e.g. 12345)"
                    maxLength={5}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.4rem' }}
                    autoFocus
                  />
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: '0.4rem' }}>
                    🔒 পিন এনক্রিপ্ট করে সুরক্ষিতভাবে যাচাই করা হয়।
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '10px' }}
                    onClick={() => setStep(2)}
                  >
                    পেছনে যান
                  </button>
                  <button
                    type="submit"
                    className={`payment-submit-btn ${selectedMethod.toLowerCase()}`}
                    style={{ flex: 2 }}
                    disabled={loading}
                  >
                    {loading ? 'পেমেন্ট সম্পন্ন হচ্ছে...' : `৳${payableAmount} পরিশোধ করুন`}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 4: Payment Success & Receipt */}
          {step === 4 && transactionData && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                <CheckCircle size={36} />
              </div>

              <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.75rem', fontWeight: 800, padding: '3px 10px', borderRadius: '999px', textTransform: 'uppercase' }}>
                পেমেন্ট সফল হয়েছে
              </span>

              <h3 style={{ margin: '0.5rem 0 0.2rem 0', fontSize: '1.35rem', color: '#1e293b' }}>
                অভিনন্দন! আপনার পেমেন্ট গৃহীত হয়েছে
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                আপনার অ্যাকাউন্ট সফলভাবে আপগ্রেড করা হয়েছে!
              </p>

              {/* Digital Invoice Card */}
              <div className="invoice-receipt-card">
                <div className="invoice-row">
                  <span>ট্রানজেকশন আইডি (TrxID):</span>
                  <strong>{transactionData.transactionId}</strong>
                </div>
                <div className="invoice-row">
                  <span>পেমেন্ট মাধ্যম:</span>
                  <strong>{transactionData.paymentMethod}</strong>
                </div>
                <div className="invoice-row">
                  <span>আইটেম / প্ল্যান:</span>
                  <strong>{transactionData.targetTitle}</strong>
                </div>
                <div className="invoice-row">
                  <span>প্রদত্ত টাকা:</span>
                  <strong style={{ color: '#0d9488', fontSize: '1rem' }}>৳{transactionData.amount} BDT</strong>
                </div>
                <div className="invoice-row">
                  <span>তারিখ ও সময়:</span>
                  <strong>{new Date().toLocaleString('bn-BD')}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  onClick={() => window.print()}
                >
                  <Download size={16} /> রিসিট প্রিন্ট
                </button>
                <button
                  type="button"
                  className="btn btn-teal"
                  style={{ flex: 1.5, padding: '0.75rem', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 700 }}
                  onClick={onClose}
                >
                  {language === 'bn' ? 'ড্যাশবোর্ডে ফিরে যান ✓' : 'Return to Dashboard ✓'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
