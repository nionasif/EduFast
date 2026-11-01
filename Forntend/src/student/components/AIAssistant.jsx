import { useState, useEffect, useRef } from 'react';
import { getAdmissions, getCourses } from '../../data/mockData';
import { 
  MessageSquare, X, Send, Sparkles, 
  Bot, Award, GraduationCap, ArrowRight, HelpCircle
} from 'lucide-react';
import './unifiedAssistant.css';

const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// ---------------------------------------------------------------------------
// Formatting Helpers for Clean, Structured Academic & Math Display
// ---------------------------------------------------------------------------
const cleanMathAndLatex = (str) => {
  if (!str) return '';
  return str
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\\textbf\{([^}]+)\}/g, '$1')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
    .replace(/\$\$([^\$]+)\$\$/g, '$1')
    .replace(/\$([^\$]+)\$/g, '$1')
    .replace(/\\implies/g, '⇒')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\approx/g, '≈')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\theta/g, 'θ')
    .replace(/\\pi/g, 'π')
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥');
};

const renderInlineFormatted = (rawText) => {
  if (!rawText) return null;
  const cleaned = cleanMathAndLatex(rawText);

  // Split by bold (**...**) and inline code (`...`)
  const parts = cleaned.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="ai-highlight-bold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="ai-inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

const renderFormattedMessage = (text, sender) => {
  if (sender === 'user') return text;
  if (!text) return '';

  const lines = text.split('\n');
  return (
    <div className="ai-formatted-message">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="ai-line-gap" />;
        }

        if (trimmed === '---' || trimmed === '***') {
          return <hr key={idx} className="ai-divider" />;
        }

        // Headings (#, ##, ###)
        if (trimmed.startsWith('#')) {
          const headingText = trimmed.replace(/^#+\s*/, '');
          return (
            <div key={idx} className="ai-formatted-heading">
              {renderInlineFormatted(headingText)}
            </div>
          );
        }

        // Numbered list / steps (e.g. "1. ", "১. ", "1) ", "১) ")
        const stepMatch = trimmed.match(/^([0-9]+|[০-৯]+)[\.\)]\s*(.*)$/);
        if (stepMatch) {
          const numberBadge = stepMatch[1];
          const content = stepMatch[2];
          return (
            <div key={idx} className="ai-formatted-step">
              <span className="ai-step-badge">{numberBadge}</span>
              <span className="ai-step-text">{renderInlineFormatted(content)}</span>
            </div>
          );
        }

        // Bullet points (*, -, •)
        if (/^[\*\-•]\s+/.test(trimmed)) {
          const content = trimmed.replace(/^[\*\-•]\s+/, '');
          return (
            <div key={idx} className="ai-formatted-bullet">
              <span className="ai-bullet-dot" />
              <span className="ai-bullet-text">{renderInlineFormatted(content)}</span>
            </div>
          );
        }

        // Regular paragraph line
        return (
          <div key={idx} className="ai-formatted-text-line">
            {renderInlineFormatted(trimmed)}
          </div>
        );
      })}
    </div>
  );
};

export default function AIAssistant({ user, onOpenLogin }) {
  const [isOpen, setIsOpen] = useState(false);

  // Ref for auto-scrolling
  const aiChatEndRef = useRef(null);

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

  // Auto scroll effect
  useEffect(() => {
    if (aiChatEndRef.current) {
      aiChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, isAiTyping]);

  // Handle external open events
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener('open-mentor-chat', handleOpen);
    window.addEventListener('open-ai-chat', handleOpen);

    return () => {
      window.removeEventListener('open-mentor-chat', handleOpen);
      window.removeEventListener('open-ai-chat', handleOpen);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // AI Query Handler
  // ---------------------------------------------------------------------------
  const handleSendAI = async (textToSend) => {
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

    // 1. Try requesting OpenAI via EduFast Backend
    try {
      const historyPayload = aiMessages.slice(-6).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query.trim(),
          history: historyPayload,
          userContext: user || null
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          setAiMessages(prev => [
            ...prev,
            {
              id: Date.now() + 1,
              sender: 'bot',
              text: data.reply,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          setIsAiTyping(false);
          return;
        }
      }
    } catch {
      // Backend unavailable or network error -> smooth fallback to instant offline intelligent engine
    }

    // 2. Fallback intelligent response logic
    setTimeout(() => {
      const botResponse = generateLocalAiResponse(query);
      setAiMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: botResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsAiTyping(false);
    }, 700);
  };

  const generateLocalAiResponse = (query) => {
    const q = query.toLowerCase();
    const admissions = getAdmissions();
    const courses = getCourses();

    if (q.includes('buet') || q.includes('বুয়েট') || q.includes('engineering')) {
      const buet = admissions.find(a => a.university.toLowerCase().includes('buet')) || {
        eligibility: 'HSC SSC মোট GPA ৯.০০+, এবং ফিজিক্স, কেমিস্ট্রি ও উচ্চতর গণিতে জিপিএ ৫.০০ আবশ্যক।'
      };
      return `🏛 **BUET অ্যাডমিশন তথ্য ও যোগ্যতা:**\n\n${buet.eligibility}\n\n• প্রিলিমিনারি পরীক্ষা: ১০০ নম্বরের MCQ\n• ফাইনাল পরীক্ষা: ৪০০ নম্বরের লিখিত (Written)\n\nসেরা প্রস্তুতির জন্য আমাদের 'Engineering Admission Masterclass' কোর্সটি দেখতে পারো।`;
    }

    if (q.includes('dhaka university') || q.includes('ঢাবি') || q.includes('du')) {
      return `🏛 **ঢাকা বিশ্ববিদ্যালয় (DU) ইউনিট তথ্য:**\n\n• **বিজ্ঞান ইউনিট (A Unit):** বিজ্ঞান বিভাগের জন্য (Physics, Chemistry, Math/Bio)\n• **কলা, আইন ও সামাজিক বিজ্ঞান ইউনিট (B Unit):** বাংলা, ইংরেজি ও সাধারণ জ্ঞান\n• **ব্যবসায় শিক্ষা ইউনিট (C Unit):** হিসাববিজ্ঞান, ব্যবসায় সংগঠন ও ফিন্যান্স\n\nন্যূনতম যোগ্যতা: বিজ্ঞান ইউনিটের জন্য মোট GPA ৮.০০ (SSC ও HSC আলাদাভাবে ন্যূনতম ৩.৫)।`;
    }

    if (q.includes('deadline') || q.includes('তারিখ') || q.includes('সময়')) {
      const upcoming = admissions.slice(0, 3).map(a => `• **${a.university}**: আবেদন শেষ ${a.deadline || 'শিঘ্রই প্রকাশিত হবে'}`).join('\n');
      return `⏳ **আসন্ন অ্যাডমিশন ডেডলাইন ও সার্কুলার:**\n\n${upcoming}\n\nড্যাশবোর্ডের অ্যাডমিশন কার্ডে প্রতিটি বিশ্ববিদ্যালয়ের লাইভ কাউন্টডাউন টাইমার দেখে নিতে পারো।`;
    }

    if (q.includes('course') || q.includes('কোর্স') || q.includes('study material')) {
      const topCourses = courses.slice(0, 2).map(c => `• **${c.title}** (${c.level}) - ৳${c.price}`).join('\n');
      return `📚 **সেরা রিকমেন্ডেড অ্যাডমিশন কোর্সসমূহ:**\n\n${topCourses}\n\nড্যাশবোর্ড থেকে কোর্সে এনরোল করে লাইভ ক্লাস ও পূর্ণাঙ্গ টেস্ট সিরিজে অংশ নিতে পারবে।`;
    }

    if (q.includes('hello') || q.includes('hi') || q.includes('সালাম') || q.includes('assalamu')) {
      return `আসসালামু আলাইকুম! বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি, সার্কুলার ডেডলাইন, যোগ্যতা যাচাই বা রিকমেন্ডেড স্টাডি মেটেরিয়াল সম্পর্কে যেকোনো প্রশ্ন করতে পারেন।`;
    }

    return `আপনার প্রশ্নটি পেয়েছি: "${query}"। আমি বিশ্ববিদ্যালয় ভর্তি পরীক্ষার যোগ্যতা, ডেডলাইন কাউন্টডাউন ও সেরা কোর্স রিকমেন্ড করতে প্রস্তুত। নির্দিষ্ট কোনো বিশ্ববিদ্যালয়ের তথ্য জানতে চান?`;
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
            🤖
            <span className="unified-assistant-live-pulse" />
          </div>
          <span className="unified-assistant-bubble-label">EduFast AI</span>
        </button>
      )}

      {/* 2. Expanded Assistant Drawer */}
      {isOpen && (
        <div className="unified-assistant-drawer" role="dialog" aria-modal="true">
          
          {/* Header */}
          <div className="unified-assistant-header">
            <div className="unified-assistant-header-left">
              <div className="unified-assistant-header-avatar">
                🤖
              </div>
              <div>
                <h3 className="unified-assistant-header-title">
                  EduFast AI Assistant
                </h3>
                <div className="unified-assistant-header-sub">
                  <span style={{ width: 7, height: 7, backgroundColor: '#34d399', borderRadius: '50%', display: 'inline-block' }} />
                  {user ? 'অ্যাডমিশন ও ক্যারিয়ার গাইড • অনলাইন' : 'অ্যাডমিশন এক্সপার্ট • অনলাইন'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="unified-assistant-close-btn"
                aria-label="Close Assistant"
              >
                &times;
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="unified-assistant-messages">
            {aiMessages.map((msg) => (
              <div
                key={msg.id}
                className={`assistant-msg-row ${msg.sender === 'user' ? 'user' : 'bot'}`}
              >
                {msg.sender === 'bot' && (
                  <span className="assistant-sender-tag bot">
                    <Sparkles style={{ width: 12, height: 12 }} /> EduFast AI
                  </span>
                )}

                <div className={`assistant-bubble ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                  {renderFormattedMessage(msg.text, msg.sender)}

                  {msg.isLoginPrompt && onOpenLogin && (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed #cbd5e1' }}>
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

        </div>
      )}
    </div>
  );
}
