import React, { useState, useEffect } from 'react';
import './mentorDoubtSolver.css';
import { 
  MessageSquare, X, Send, Sparkles, UserCheck, Paperclip, 
  HelpCircle, CheckCircle2, ChevronRight, BookOpen, Bot, ShieldCheck, Star
} from 'lucide-react';
import { submitDoubt, getDoubtsQueue, rateDoubtSolution } from '../../data/mockData';

export default function MentorDoubtSolver() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubject, setActiveSubject] = useState('Physics');
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeDoubtId, setActiveDoubtId] = useState(null);
  const [ratedDoubtIds, setRatedDoubtIds] = useState([]);

  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      sender: 'mentor',
      mentorName: 'EduFast Academic Mentor',
      text: 'আসসালামু আলাইকুম! ফিজিক্স, কেমিস্ট্রি, ম্যাথ বা বায়োলজির যেকোনো প্রশ্ন বা অ্যাডমিশন ডাউট এখানে লিখে পাঠাও। আমাদের মেন্টর প্যানেল দ্রুত সমাধান দেবে।',
      time: 'Just now'
    }
  ]);

  // Listen to mentor queue events and external open triggers
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-mentor-chat', handleOpen);

    const handleUpdate = (e) => {
      if (e.detail?.type === 'doubts_queue' && e.detail?.action === 'resolve') {
        const queue = getDoubtsQueue();
        const latestResolved = queue.find(q => q.status === 'resolved' && q.id === activeDoubtId);
        if (latestResolved && latestResolved.solution) {
          setChatHistory(prev => {
            if (prev.some(m => m.id === latestResolved.id)) return prev;
            return [
              ...prev,
              {
                id: latestResolved.id,
                sender: 'mentor',
                mentorName: latestResolved.claimedBy || 'EduFast Mentor',
                text: latestResolved.solution.text,
                hasVoice: latestResolved.solution.voiceNote,
                time: latestResolved.solution.resolvedAt || 'Just now',
                needsRating: true,
                doubtId: latestResolved.id
              }
            ];
          });
        }
      }
    };
    window.addEventListener('edufast-data-update', handleUpdate);
    return () => {
      window.removeEventListener('open-mentor-chat', handleOpen);
      window.removeEventListener('edufast-data-update', handleUpdate);
    };
  }, [activeDoubtId]);

  const quickPrompts = [
    { subject: 'Physics', text: 'প্রাসের গতিতে সর্বাধিক উচ্চতায় মোট শক্তি কত?' },
    { subject: 'Math', text: '∫ e^x (sin x + cos x) dx এর সরাসরি শর্টকাট কি?' },
    { subject: 'Chemistry', text: 'KMnO4 এ Mn এর জারণ সংখ্যা কিভাবে বের করব?' },
    { subject: 'English', text: 'Admission এ Inversion of Verbs এর নিয়মগুলো কি?' }
  ];

  const handleRating = (msgId, stars) => {
    rateDoubtSolution(msgId, stars);
    setRatedDoubtIds(prev => [...prev, msgId]);
  };

  const handleSendQuery = (textToSend) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const doubtId = "dbt-" + Date.now();
    setActiveDoubtId(doubtId);

    let currentStudentName = "Student";
    try {
      const session = localStorage.getItem('edufast_student_session');
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed.name) currentStudentName = parsed.name;
      }
    } catch {}

    // Save to shared 24/7 doubts queue
    submitDoubt({
      id: doubtId,
      studentName: currentStudentName,
      studentAvatar: "👨‍🎓",
      subject: activeSubject,
      topic: `${activeSubject} Doubt Query`,
      question: query.trim(),
      priority: "high"
    });

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: query.trim(),
      time: 'Just now'
    };

    setChatHistory(prev => [...prev, userMessage]);
    if (!textToSend) setInputQuery('');
    setIsTyping(true);

    // Automatic Smart Mentor Feedback simulation for instant guidance
    setTimeout(() => {
      let mentorResponseText = '';
      const qLower = query.toLowerCase();

      if (qLower.includes('প্রাস') || qLower.includes('উচ্চতা') || activeSubject === 'Physics') {
        mentorResponseText = `**প্রাসের গতি ও শক্তি বিশ্লেষণ:**
১. সর্বাধিক উচ্চতায় অনুভূমিক বেগ v_x = v₀ cos θ এবং উল্লম্ব বেগ v_y = 0।
২. গতিশক্তি E_k = ½ m (v₀ cos θ)² = ½ m v₀² cos² θ
৩. বিভব শক্তি E_p = ½ m v₀² sin² θ
৪. মোট শক্তি E = E_k + E_p = ½ m v₀² (সর্বদা সংরক্ষিত থাকে)।`;
      } else if (qLower.includes('শর্টকাট') || activeSubject === 'Math') {
        mentorResponseText = `**স্ট্যান্ডার্ড ইন্টিগ্রেশন শর্টকাট:**
ফর্মুলা: ∫ e^x [f(x) + f'(x)] dx = e^x • f(x) + c
এখানে f(x) = sin x, যার অন্তরজ f'(x) = cos x।
সুতরাং সরাসরি উত্তর: **e^x sin x + c**`;
      } else if (qLower.includes('kmno4') || activeSubject === 'Chemistry') {
        mentorResponseText = `**KMnO4 এ Mn এর জারণ সংখ্যা নির্ণয়:**
ধরি Mn এর জারণ সংখ্যা x।
K এর জারণ সংখ্যা = +1
O এর জারণ সংখ্যা = -2
(+1) + x + 4(-2) = 0
=> 1 + x - 8 = 0
=> x = +7
অতএব, Mn এর জারণ সংখ্যা **+7**।`;
      } else {
        mentorResponseText = `**ডাউট সমাধান ও নির্দেশনা:**
তোমার প্রশ্নটি EduFast 24/7 মেন্টর সেন্ট্রাল ডেস্কে জমা দেওয়া হয়েছে।
ডিউটি মেন্টর (বুয়েট/ডিএমসি প্যানেল) সমাধান প্রস্তুত করে এখানে অডিও নোট ও স্টেপ-বাই-স্টেপ নোট যুক্ত করে দেবেন।`;
      }

      setChatHistory(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'mentor',
          mentorName: 'Engr. Rakibul Hasan (BUET)',
          text: mentorResponseText,
          time: 'Just now'
        }
      ]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom-Left to avoid overlap with bottom-right AI Assistant) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mentor-solver-trigger"
          aria-label="Open 24/7 Mentor Doubt Solver"
        >
          <div className="mentor-solver-trigger-icon-wrap">
            <MessageSquare style={{ width: 18, height: 18 }} />
            <span className="mentor-solver-pulse-dot" />
          </div>
          <span>👨‍🏫 ২৪/৭ মেন্টর ডাউট সলভিং</span>
        </button>
      )}

      {/* Floating Chat Drawer */}
      {isOpen && (
        <div className="mentor-solver-drawer">
          
          {/* Header */}
          <div className="mentor-solver-header">
            <div className="mentor-solver-header-info">
              <div className="mentor-solver-avatar">
                <UserCheck style={{ width: 20, height: 20 }} />
                <span className="mentor-solver-online-badge" />
              </div>
              <div className="mentor-solver-title-wrap">
                <h3>
                  ২৪/৭ লাইভ মেন্টর সলভার
                  <ShieldCheck style={{ width: 15, height: 15, color: '#34d399' }} />
                </h3>
                <p>বুয়েট / ডিএমসি / ঢাবি মেন্টর প্যানেল অনলাইন</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mentor-solver-close-btn"
              aria-label="Close Mentor Solver"
            >
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>

          {/* Quick Subject Select */}
          <div className="mentor-solver-subjects">
            {['Physics', 'Chemistry', 'Math', 'English'].map(subj => (
              <button
                key={subj}
                type="button"
                onClick={() => setActiveSubject(subj)}
                className={`mentor-subject-pill ${activeSubject === subj ? 'active' : 'inactive'}`}
              >
                {subj}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div className="mentor-solver-messages">
            {chatHistory.map(msg => (
              <div
                key={msg.id}
                className={`mentor-msg-row ${msg.sender === 'user' ? 'user' : 'mentor'}`}
              >
                {msg.sender === 'mentor' && (
                  <span className="mentor-sender-label">
                    <UserCheck style={{ width: 12, height: 12 }} /> {msg.mentorName}
                  </span>
                )}
                <div className={`mentor-bubble ${msg.sender === 'user' ? 'user' : 'mentor'}`}>
                  {msg.text}

                  {msg.hasVoiceNote && (
                    <div className="mentor-voice-note">
                      <span className="mentor-voice-play-icon">▶</span>
                      <span>Audio Explanation Attached (0:45s)</span>
                    </div>
                  )}

                  {msg.sender === 'mentor' && msg.id !== 1 && (
                    <div className="mentor-rating-box">
                      <span>Rate this solution:</span>
                      <div className="mentor-stars-group">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleRating(msg.id, star)}
                            className={`mentor-star-btn ${
                              ratedDoubtIds.includes(msg.id) ? 'rated' : 'unrated'
                            }`}
                            aria-label={`Rate ${star} stars`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 3 }}>
                  {msg.time}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="mentor-typing-indicator">
                <Sparkles style={{ width: 14, height: 14, color: '#34d399' }} />
                <span>মেন্টর সমাধান লিখছেন...</span>
                <div className="mentor-typing-dots">
                  <span className="mentor-dot" />
                  <span className="mentor-dot" />
                  <span className="mentor-dot" />
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="mentor-solver-prompts">
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
              কুইক প্রশ্ন:
            </span>
            {quickPrompts.filter(p => p.subject === activeSubject).map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendQuery(prompt.text)}
                className="mentor-prompt-btn"
              >
                {prompt.text}
              </button>
            ))}
          </div>

          {/* Footer Input Bar */}
          <div className="mentor-solver-footer">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendQuery();
              }}
              className="mentor-solver-input-form"
            >
              <input
                type="text"
                placeholder={`${activeSubject} এর প্রশ্ন বা সমীকরণ লিখুন...`}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                className="mentor-solver-input-field"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isTyping}
                className="mentor-solver-send-btn"
                aria-label="Send query"
              >
                <Send style={{ width: 15, height: 15 }} />
              </button>
            </form>
          </div>

        </div>
      )}
    </>
  );
}
