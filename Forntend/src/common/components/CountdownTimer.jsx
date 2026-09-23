import { useState, useEffect } from 'react';

export default function CountdownTimer({ deadline }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = new Date(deadline) - new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    } else {
      timeLeft = { expired: true };
    }

    return timeLeft;
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  if (timeLeft.expired) {
    return (
      <span className="deadline-badge" style={{ backgroundColor: '#fed7d7', color: '#9b2c2c', borderColor: '#feb2b2' }}>
        Admission Closed
      </span>
    );
  }

  // Format single digits with leading zero
  const formatNum = (num) => String(num).padStart(2, '0');

  return (
    <div className="countdown-timer-container">
      <div className="timer-box">
        <span className="timer-num">{formatNum(timeLeft.days)}</span>
        <span className="timer-unit">Days</span>
      </div>
      <div className="timer-box">
        <span className="timer-num">{formatNum(timeLeft.hours)}</span>
        <span className="timer-unit">Hrs</span>
      </div>
      <div className="timer-box">
        <span className="timer-num">{formatNum(timeLeft.minutes)}</span>
        <span className="timer-unit">Min</span>
      </div>
      <div className="timer-box">
        <span className="timer-num">{formatNum(timeLeft.seconds)}</span>
        <span className="timer-unit">Sec</span>
      </div>
    </div>
  );
}
