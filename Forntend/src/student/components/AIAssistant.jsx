import { useState, useEffect, useRef } from 'react';
import { getAdmissions, getCourses, submitDoubt, getDoubtsQueue, rateDoubtSolution } from '../../data/mockData';
import { 
  MessageSquare, X, Send, Sparkles, UserCheck, ShieldCheck, 
  Bot, Star, Award, GraduationCap, ArrowRight, HelpCircle
} from 'lucide-react';
import './unifiedAssistant.css';

export default function AIAssistant({ user, onOpenLogin }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ai'); // 'ai' | 'mentor'

  // Ref for auto-scrolling
  const aiChatEndRef = useRef(null);
  const mentorChatEndRef = useRef(null);

  // ---------------------------------------------------------------------------
  // 1. AI Assistant State & Handlers
  // ---------------------------------------------------------------------------
  const [aiMessages, setAiMessages] = useState(() => [
    {
      id: 1,
      sender: 'bot',
      text: user 
        ? `আসসালামু আলাইকুম, ${user.name}! আমি তোমার EduFast AI অ্যাডভাইজর। তোমার গ্রুপ (${user.group || 'Science'}) এবং রেজাল্ট অনুযায়ী যেকোনো বিশ্ববিদ্যালয়ের যোগ্যতা, ডেডলাইন বা কোর্স সম্পর্কে জানতে পারো।`
        : `হ্যালো! আমি EduFast AI Assistant। বাংলাদেশের পাবলিক ও প্রাইভেট বিশ্ববিদ্যালয় অ্যাডমিশন, সার্কুলার ও প্রস্তুতি সম্পর্কিত যেকোনো প্রশ্ন আমাকে করতে পারেন।`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [aiInputText, setAiInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  const suggestPrompts = [
    { label: '🏆 Am I BUET eligible?', query: 'BUET eligibility' },
    { label: '🎓 Dhaka University units', query: 'DU admission units' },
    { label: '⏳ Admission Deadlines', query: 'Admission deadlines' },
    { label: '📚 Study materials', query: 'Recommend courses' }
  ];

  // ---------------------------------------------------------------------------
  // 2. 24/7 Live Mentor Doubt Solver State & Handlers (Only for Authenticated Students)
  // ---------------------------------------------------------------------------
  const [activeSubject, setActiveSubject] = useState('Physics');
  const [mentorInputQuery, setMentorInputQuery] = useState('');
  const [isMentorTyping, setIsMentorTyping] = useState(false);
  const [activeDoubtId, setActiveDoubtId] = useState(null);
  const [ratedDoubtIds, setRatedDoubtIds] = useState([]);
  const [mentorChatHistory, setMentorChatHistory] = useState([
    {
      id: 1,
      sender: 'mentor',
      mentorName: 'EduFast Academic Squad (BUET/DMC Panel)',
      text: 'আসসালামু আলাইকুম! ফিজিক্স, কেমিস্ট্রি, ম্যাথ বা বায়োলজির যেকোনো কঠিন সমস্যা বা অ্যাডমিশন ডাউট এখানে লিখে পাঠাও। আমাদের ২৪/৭ মেন্টর প্যানেল দ্রুত স্টেপ-বাই-স্টেপ সমাধান দেবে।',
      time: 'Just now'
    }
  ]);

  const quickMentorPrompts = [
    { subject: 'Physics', text: 'প্রাসের গতিতে সর্বাধিক উচ্চতায় মোট শক্তি কত?' },
    { subject: 'Math', text: '∫ e^x (sin x + cos x) dx এর সরাসরি শর্টকাট কি?' },
    { subject: 'Chemistry', text: 'KMnO4 এ Mn এর জারণ সংখ্যা কিভাবে বের করব?' },
    { subject: 'English', text: 'Admission এ Inversion of Verbs এর নিয়মগুলো কি?' }
  ];

  // Auto scroll effect
  useEffect(() => {
    if (activeTab === 'ai' && aiChatEndRef.current) {
      aiChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (activeTab === 'mentor' && mentorChatEndRef.current) {
      mentorChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, isAiTyping, mentorChatHistory, isMentorTyping, activeTab]);

  // Handle external open events
  useEffect(() => {
    const handleOpenMentor = () => {
      setIsOpen(true);
      if (user) {
        setActiveTab('mentor');
      } else {
        setActiveTab('ai');
        setAiMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            sender: 'bot',
            text: `🔒 **২৪/৭ লাইভ মেন্টর সলভার** সুবিধাটি শুধুমাত্র লগইনকৃত শিক্ষার্থীদের জন্য সংরক্ষিত।\n\nসরাসরি বুয়েট ও মেডিকেল মেন্টরদের সহায়তা পেতে অনুগ্রহ করে স্টুডেন্ট অ্যাকাউন্টে লগইন করুন।`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isLoginPrompt: true
          }
        ]);
      }
    };

    const handleOpenAi = () => {
      setIsOpen(true);
      setActiveTab('ai');
    };

    window.addEventListener('open-mentor-chat', handleOpenMentor);
    window.addEventListener('open-ai-chat', handleOpenAi);

    // Listen for live mentor portal resolutions
    const handleDataUpdate = (e) => {
      if (e.detail?.type === 'doubts_queue' && e.detail?.action === 'resolve') {
        const queue = getDoubtsQueue();
        const latestResolved = queue.find(q => q.status === 'resolved' && q.id === activeDoubtId);
        if (latestResolved && latestResolved.solution) {
          setMentorChatHistory(prev => {
            if (prev.some(m => m.id === latestResolved.id)) return prev;
            return [
              ...prev,
              {
                id: latestResolved.id,
                sender: 'mentor',
                mentorName: latestResolved.claimedBy || 'EduFast Mentor',
                text: latestResolved.solution.text,
                hasVoiceNote: latestResolved.solution.voiceNote,
                time: latestResolved.solution.resolvedAt || 'Just now',
                needsRating: true,
                doubtId: latestResolved.id
              }
            ];
          });
        }
      }
    };
    window.addEventListener('edufast-data-update', handleDataUpdate);

    return () => {
      window.removeEventListener('open-mentor-chat', handleOpenMentor);
      window.removeEventListener('open-ai-chat', handleOpenAi);
      window.removeEventListener('edufast-data-update', handleDataUpdate);
    };
  }, [user, activeDoubtId]);

  // If user signs out while on mentor tab, revert to AI tab
  useEffect(() => {
    if (!user && activeTab === 'mentor') {
      setActiveTab('ai');
    }
  }, [user, activeTab]);

  // ---------------------------------------------------------------------------
  // AI Query Handler
  // ---------------------------------------------------------------------------
  const handleSendAI = (textToSend) => {
    const query = textToSend || aiInputText;
    if (!query.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: query.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setAiMessages(prev => [...prev, userMessage]);
    if (!textToSend) setAiInputText('');
    setIsAiTyping(true);

    setTimeout(() => {
      const responseText = generateAIResponse(query.trim());
      setAiMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: responseText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsAiTyping(false);
    }, 750);
  };

  const generateAIResponse = (query) => {
    const q = query.toLowerCase();
    const currentAdmissions = getAdmissions();
    const currentCourses = getCourses();

    // Specific university eligibility check
    const matchedUniv = currentAdmissions.find(univ => 
      q.includes(univ.name.toLowerCase()) || 
      (univ.id && q.includes(univ.id.toLowerCase()))
    );

    if (matchedUniv) {
      if (!user) {
        return `🏛️ **${matchedUniv.name}**\nভর্তি পরীক্ষা: **${matchedUniv.examDate}** (ফি: ৳${matchedUniv.applicationFee})।\n\n💡 আপনার এসএসসি ও এইচএসসি জিপিএ দিয়ে স্বয়ংক্রিয়ভাবে যোগ্যতা যাচাই করতে দয়া করে লগইন করুন।`;
      }
      const sscGpa = user.ssc?.gpa ? Number(user.ssc.gpa) : 0;
      const hscGpa = user.hsc?.gpa ? Number(user.hsc.gpa) : 0;
      const combined = sscGpa + hscGpa;
      const userGroup = user.group || 'Science';

      const eligibleUnits = (matchedUniv.units || []).filter(unit => {
        return (!unit.group || unit.group === userGroup) && combined >= (unit.minGpa || 0);
      });

      if (eligibleUnits.length > 0) {
        return `🎉 অভিনন্দন **${user.name}**! **${matchedUniv.name}**-এ আপনার বর্তমান গ্রুপ (${userGroup}) এবং মোট জিপিএ (${combined.toFixed(2)}) অনুযায়ী আপনি আবেদনযোগ্য ইউনিটসমূহ: **${eligibleUnits.map(u => u.name).join(', ')}**।\nভর্তি পরীক্ষা: **${matchedUniv.examDate}**।`;
      } else {
        return `⚠️ **${matchedUniv.name}**-এর বর্তমান ইউনিটগুলোর জন্য ন্যূনতম জিপিএ শর্ত পূরণ হয়নি। আপনার গ্রুপ: ${userGroup}, মোট জিপিএ: ${combined.toFixed(2)}।`;
      }
    }

    // Generic BUET / DU lookup
    if (q.includes('buet') || q.includes('engineering')) {
      return `🏛️ **BUET Admission Requirements:**\nসাধারণত এসএসসি ও এইচএসসি উভয় পরীক্ষায় বিজ্ঞান বিভাগ থেকে জিপিএ ৫.০০ এবং পদার্থ, রসায়ন, গণিত ও ইংরেজিতে নির্ধারিত নম্বর আবশ্যক। Circulars মেন্যুতে বিস্তারিত সার্কুলার পাওয়া যাবে।`;
    }
    if (q.includes('du') || q.includes('dhaka')) {
      return `🏛️ **ঢাকা বিশ্ববিদ্যালয় (DU) অ্যাডমিশন:**\nক ইউনিট (বিজ্ঞান), খ ইউনিট (মানবিক) ও গ ইউনিট (ব্যবসায় শিক্ষা)। বিস্তারিত বিষয় ও ইউনিট ডেডলাইন অ্যাডমিশন সেকশনে রিয়েলটাইমে রয়েছে।`;
    }

    // Deadlines
    if (q.includes('deadline') || q.includes('countdown') || q.includes('exam') || q.includes('when') || q.includes('তারিখ')) {
      if (currentAdmissions.length === 0) {
        return `⏳ বর্তমানে কোনো অ্যাক্টিভ সার্কুলার নেই। অ্যাডমিন নতুন সার্কুলার প্রকাশ করলে এখানে স্বয়ংক্রিয়ভাবে দেখতে পাবেন।`;
      }
      const list = currentAdmissions.map(univ => `• **${univ.name}**: পরীক্ষা ${univ.examDate} (ফি: ৳${univ.applicationFee})`).join('\n');
      return `⏳ **আসন্ন বিশ্ববিদ্যালয় ভর্তি পরীক্ষার সময়সূচী:**\n\n${list}\n\nঅ্যাডমিশন পেজে রিয়েলটাইম কাউন্টডাউন টাইমার দেখতে পাবেন!`;
    }

    // Course recommendation
    if (q.includes('course') || q.includes('recommend') || q.includes('study') || q.includes('কোর্স')) {
      const userGroup = user ? user.group : 'Science';
      const courses = currentCourses.filter(c => !c.group || c.group === userGroup);
      if (courses.length === 0) {
        return `📚 আপনার গ্রুপের জন্য এই মুহূর্তে নতুন মাস্টারক্লাস কোর্স শিডিউল হচ্ছে। শীঘ্রই কোর্স হাবে প্রদর্শিত হবে।`;
      }
      const list = courses.map(c => `• **${c.title}** - ইন্সট্রাক্টর: ${c.instructor} (৳${c.discountedPrice})`).join('\n');
      return `📚 **${userGroup} বিভাগের সেরা রিকমেন্ডেড কোর্সসমূহ:**\n\n${list}\n\nকোর্স হাব থেকে সরাসরি এনরোল করে ক্লাস শুরু করতে পারেন!`;
    }

    // Greetings
    if (q.includes('hello') || q.includes('hi') || q.includes('সালাম') || q.includes('assalamu')) {
      return `আসসালামু আলাইকুম! বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি, সার্কুলার ডেডলাইন, যোগ্যতা যাচাই বা রিকমেন্ডেড স্টাডি মেটেরিয়াল সম্পর্কে যেকোনো প্রশ্ন করতে পারেন।`;
    }

    return `আপনার প্রশ্নটি পেয়েছি: "${query}"। আমি বিশ্ববিদ্যালয় ভর্তি পরীক্ষার যোগ্যতা, ডেডলাইন কাউন্টডাউন ও সেরা কোর্স রিকমেন্ড করতে প্রস্তুত। নির্দিষ্ট কোনো বিশ্ববিদ্যালয়ের তথ্য জানতে চান?`;
  };

  // ---------------------------------------------------------------------------
  // Live Mentor Doubt Solver Handlers
  // ---------------------------------------------------------------------------
  const handleRating = (msgId, stars) => {
    rateDoubtSolution(msgId, stars);
    setRatedDoubtIds(prev => [...prev, msgId]);
  };

  const handleSendMentorQuery = (textToSend) => {
    const query = textToSend || mentorInputQuery;
    if (!query.trim()) return;

    const doubtId = "dbt-" + Date.now();
    setActiveDoubtId(doubtId);

    const studentName = user?.name || "Student";

    // Submit to shared doubts queue
    submitDoubt({
      id: doubtId,
      studentName: studentName,
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

    setMentorChatHistory(prev => [...prev, userMessage]);
    if (!textToSend) setMentorInputQuery('');
    setIsMentorTyping(true);

    // Simulate smart mentor response
    setTimeout(() => {
      let mentorResponseText = '';
      const qLower = query.toLowerCase();

      if (qLower.includes('প্রাস') || qLower.includes('উচ্চতা') || activeSubject === 'Physics') {
        mentorResponseText = `**প্রাসের গতি ও শক্তি বিশ্লেষণ:**\n১. সর্বাধিক উচ্চতায় অনুভূমিক বেগ v_x = v₀ cos θ এবং উল্লম্ব বেগ v_y = 0।\n২. গতিশক্তি E_k = ½ m (v₀ cos θ)² = ½ m v₀² cos² θ\n৩. বিভব শক্তি E_p = ½ m v₀² sin² θ\n৪. মোট শক্তি E = E_k + E_p = ½ m v₀² (সর্বদা সংরক্ষিত থাকে)।`;
      } else if (qLower.includes('শর্টকাট') || activeSubject === 'Math') {
        mentorResponseText = `**স্ট্যান্ডার্ড ইন্টিগ্রেশন শর্টকাট:**\nফর্মুলা: ∫ e^x [f(x) + f'(x)] dx = e^x • f(x) + c\nএখানে f(x) = sin x, যার অন্তরজ f'(x) = cos x।\nসুতরাং সরাসরি উত্তর: **e^x sin x + c**`;
      } else if (qLower.includes('kmno4') || activeSubject === 'Chemistry') {
        mentorResponseText = `**KMnO4 এ Mn এর জারণ সংখ্যা নির্ণয়:**\nধরি Mn এর জারণ সংখ্যা x।\nK এর জারণ সংখ্যা = +1, O এর জারণ সংখ্যা = -2\n(+1) + x + 4(-2) = 0 => x - 7 = 0 => x = +7\nঅতএব, Mn এর জারণ সংখ্যা **+7**।`;
      } else {
        mentorResponseText = `**ডাউট সমাধান ও নির্দেশনা:**\nতোমার প্রশ্নটি EduFast 24/7 মেন্টর সেন্ট্রাল ডেস্কে জমা হয়েছে। ডিউটি মেন্টর (বুয়েট/ডিএমসি প্যানেল) সমাধানটি ভেরিফাই করে নোট যুক্ত করেছেন। কোনো লাইনে বুঝতে সমস্যা হলে নিচে রেটিং দিন বা রি-আস্ক করুন।`;
      }

      setMentorChatHistory(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'mentor',
          mentorName: 'Engr. Rakibul Hasan (BUET CSE)',
          text: mentorResponseText,
          hasVoiceNote: true,
          time: 'Just now'
        }
      ]);
      setIsMentorTyping(false);
    }, 1100);
  };

  return (
    <div className="edufast-unified-assistant-wrapper">
      
      {/* 1. Sleek Floating Trigger Button (Bottom-Right) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="unified-assistant-bubble"
          aria-label="Open EduFast Assistant"
        >
          <div className="unified-assistant-bubble-icon">
            {user ? '💬' : '🤖'}
            <span className="unified-assistant-live-pulse" />
          </div>
          <span>
            {user ? 'EduFast AI • ২৪/৭ মেন্টর' : 'EduFast AI Assistant'}
          </span>
        </button>
      )}

      {/* 2. Expanded Assistant Drawer */}
      {isOpen && (
        <div className="unified-assistant-drawer" role="dialog" aria-modal="true">
          
          {/* Header */}
          <div className="unified-assistant-header">
            <div className="unified-assistant-header-left">
              <div className="unified-assistant-header-avatar">
                {activeTab === 'mentor' && user ? '👨‍🏫' : '🤖'}
              </div>
              <div>
                <h3 className="unified-assistant-header-title">
                  {user 
                    ? (activeTab === 'mentor' ? '২৪/৭ লাইভ মেন্টর সলভার' : 'EduFast AI Assistant') 
                    : 'EduFast AI Assistant'
                  }
                </h3>
                <div className="unified-assistant-header-sub">
                  <span style={{ width: 7, height: 7, backgroundColor: '#34d399', borderRadius: '50%', display: 'inline-block' }} />
                  {user 
                    ? (activeTab === 'mentor' ? 'বুয়েট • ডিএমসি • ঢাবি মেন্টর প্যানেল অনলাইন' : 'অ্যাডমিশন ও ক্যারিয়ার গাইড') 
                    : 'অ্যাডমিশন এক্সপার্ট • অনলাইন'
                  }
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="unified-assistant-close-btn"
              aria-label="Close Assistant"
            >
              &times;
            </button>
          </div>

          {/* Tab Switcher: Rendered ONLY when student is logged in */}
          {user && (
            <div className="unified-assistant-tabs">
              <button
                type="button"
                className={`unified-assistant-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
                onClick={() => setActiveTab('ai')}
              >
                <span>🤖 EduFast AI</span>
              </button>
              <button
                type="button"
                className={`unified-assistant-tab-btn ${activeTab === 'mentor' ? 'active' : ''}`}
                onClick={() => setActiveTab('mentor')}
              >
                <span>👨‍🏫 ২৪/৭ লাইভ মেন্টর</span>
                <span className="live-mentor-badge-indicator">
                  <span style={{ width: 5, height: 5, backgroundColor: '#10b981', borderRadius: '50%' }} />
                  Live
                </span>
              </button>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 1: EDUFAST AI ASSISTANT VIEW                                  */}
          {/* ================================================================= */}
          {activeTab === 'ai' && (
            <>
              {/* Messages Area */}
              <div className="unified-assistant-messages">
                {aiMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`assistant-msg-row ${msg.sender === 'user' ? 'user' : 'bot'}`}
                  >
                    {msg.sender === 'bot' && (
                      <span className="assistant-sender-tag bot">
                        <Bot style={{ width: 12, height: 12 }} /> EduFast AI
                      </span>
                    )}

                    <div className={`assistant-bubble ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                      {msg.text}

                      {msg.isLoginPrompt && onOpenLogin && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setIsOpen(false);
                              onOpenLogin();
                            }}
                            style={{
                              backgroundColor: 'var(--primary-teal, #0d9488)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '0.45rem 0.9rem',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            স্টুডেন্ট লগইন করুন <ArrowRight style={{ width: 13, height: 13 }} />
                          </button>
                        </div>
                      )}
                    </div>

                    <span className="assistant-msg-time">{msg.time}</span>
                  </div>
                ))}

                {isAiTyping && (
                  <div className="assistant-typing-box">
                    <Sparkles style={{ width: 13, height: 13, color: '#0d9488' }} />
                    <span>EduFast AI লিখছে...</span>
                    <div className="assistant-typing-dots">
                      <span className="assistant-typing-dot" />
                      <span className="assistant-typing-dot" />
                      <span className="assistant-typing-dot" />
                    </div>
                  </div>
                )}

                <div ref={aiChatEndRef} />
              </div>

              {/* Quick AI Prompts */}
              <div className="unified-quick-prompts">
                <span style={{ fontSize: '0.68rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                  কুইক সাজেশন:
                </span>
                {suggestPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendAI(prompt.query)}
                    className="unified-prompt-btn"
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>

              {/* Footer Input */}
              <div className="unified-assistant-footer">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendAI();
                  }}
                  className="unified-input-form"
                >
                  <input
                    type="text"
                    placeholder="বিশ্ববিদ্যালয় অ্যাডমিশন বা যোগ্যতা নিয়ে প্রশ্ন করুন..."
                    value={aiInputText}
                    onChange={(e) => setAiInputText(e.target.value)}
                    className="unified-input-field"
                  />
                  <button
                    type="submit"
                    disabled={!aiInputText.trim() || isAiTyping}
                    className="unified-send-btn"
                    aria-label="Send AI question"
                  >
                    <Send style={{ width: 14, height: 14 }} />
                  </button>
                </form>
              </div>
            </>
          )}

          {/* ================================================================= */}
          {/* TAB 2: 24/7 LIVE MENTOR SOLVER VIEW (Only for logged in students) */}
          {/* ================================================================= */}
          {activeTab === 'mentor' && user && (
            <>
              {/* Subject Selector Bar */}
              <div className="mentor-subjects-bar">
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>
                  বিষয়:
                </span>
                {['Physics', 'Chemistry', 'Math', 'English'].map((subj) => (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => setActiveSubject(subj)}
                    className={`mentor-subj-pill ${activeSubject === subj ? 'active' : ''}`}
                  >
                    {subj}
                  </button>
                ))}
              </div>

              {/* Messages Area */}
              <div className="unified-assistant-messages">
                <div className="mentor-status-banner">
                  <ShieldCheck style={{ width: 16, height: 16, color: '#10b981', flexShrink: 0 }} />
                  <span>
                    <strong>লাইভ প্যানেল:</strong> ইঞ্জিনিয়ারিং ও মেডিকেল মেন্টররা অনলাইনে আছেন।
                  </span>
                </div>

                {mentorChatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`assistant-msg-row ${msg.sender === 'user' ? 'user' : 'mentor'}`}
                  >
                    {msg.sender === 'mentor' && (
                      <span className="assistant-sender-tag mentor">
                        <UserCheck style={{ width: 12, height: 12 }} /> {msg.mentorName}
                      </span>
                    )}

                    <div className={`assistant-bubble ${msg.sender === 'user' ? 'user' : 'mentor'}`}>
                      {msg.text}

                      {msg.hasVoiceNote && (
                        <div className="mentor-voice-note">
                          <span className="mentor-voice-play-icon">▶</span>
                          <span>অডিও ব্যাখ্যা সংযুক্ত (0:45s)</span>
                        </div>
                      )}

                      {msg.sender === 'mentor' && msg.id !== 1 && (
                        <div className="mentor-rating-box">
                          <span>রেটিং দিন:</span>
                          <div className="mentor-stars-group">
                            {[1, 2, 3, 4, 5].map((star) => (
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

                    <span className="assistant-msg-time">{msg.time}</span>
                  </div>
                ))}

                {isMentorTyping && (
                  <div className="assistant-typing-box">
                    <Sparkles style={{ width: 13, height: 13, color: '#10b981' }} />
                    <span>মেন্টর সমাধান প্রস্তুত করছেন...</span>
                    <div className="assistant-typing-dots">
                      <span className="assistant-typing-dot" />
                      <span className="assistant-typing-dot" />
                      <span className="assistant-typing-dot" />
                    </div>
                  </div>
                )}

                <div ref={mentorChatEndRef} />
              </div>

              {/* Quick Subject Prompts */}
              <div className="unified-quick-prompts">
                <span style={{ fontSize: '0.68rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                  কুইক প্রশ্ন:
                </span>
                {quickMentorPrompts
                  .filter((p) => p.subject === activeSubject)
                  .map((prompt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendMentorQuery(prompt.text)}
                      className="unified-prompt-btn"
                    >
                      {prompt.text}
                    </button>
                  ))}
              </div>

              {/* Footer Input */}
              <div className="unified-assistant-footer">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMentorQuery();
                  }}
                  className="unified-input-form"
                >
                  <input
                    type="text"
                    placeholder={`${activeSubject} এর প্রশ্ন বা সমীকরণ লিখুন...`}
                    value={mentorInputQuery}
                    onChange={(e) => setMentorInputQuery(e.target.value)}
                    className="unified-input-field"
                  />
                  <button
                    type="submit"
                    disabled={!mentorInputQuery.trim() || isMentorTyping}
                    className="unified-send-btn"
                    aria-label="Send doubt to mentor"
                  >
                    <Send style={{ width: 14, height: 14 }} />
                  </button>
                </form>
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
}
