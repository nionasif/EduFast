import React, { useState } from 'react';
import { MessageSquare, HelpCircle, Send, Award } from 'lucide-react';

export default function StudioChat({
  studioMessages,
  studioInputMsg,
  setStudioInputMsg,
  handleSendStudioMessage,
  teacherUser,
  activeQuizPoll,
  handleCreateQuizPoll,
  handleResolveQuizPoll
}) {
  const [chatSubTab, setChatSubTab] = useState('chat'); // 'chat' | 'poll'
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['Option A', 'Option B', 'Option C', 'Option D']);

  const onSubmitPoll = (e) => {
    e.preventDefault();
    if (!pollQuestion.trim()) return;
    handleCreateQuizPoll(pollQuestion, pollOptions);
    setPollQuestion('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#111827', minHeight: '560px' }}>
      {/* Tab Switcher: Chat vs Live Quiz Poll */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #1f2937',
        backgroundColor: '#0f172a'
      }}>
        <button
          onClick={() => setChatSubTab('chat')}
          style={{
            flex: 1,
            padding: '0.65rem',
            border: 'none',
            backgroundColor: chatSubTab === 'chat' ? '#111827' : 'transparent',
            color: chatSubTab === 'chat' ? '#fff' : '#9ca3af',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem'
          }}
        >
          <MessageSquare style={{ width: '13px', height: '13px', color: 'var(--primary-teal)' }} />
          Live Chat ({studioMessages.length})
        </button>

        <button
          onClick={() => setChatSubTab('poll')}
          style={{
            flex: 1,
            padding: '0.65rem',
            border: 'none',
            backgroundColor: chatSubTab === 'poll' ? '#111827' : 'transparent',
            color: chatSubTab === 'poll' ? '#fff' : '#9ca3af',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem'
          }}
        >
          <HelpCircle style={{ width: '13px', height: '13px', color: 'var(--accent-yellow)' }} />
          MCQ Poll {activeQuizPoll ? '● ACTIVE' : ''}
        </button>
      </div>

      {chatSubTab === 'chat' ? (
        <>
          {/* Messages Scroll Area */}
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '460px' }}>
            {studioMessages.map(msg => (
              <div
                key={msg.id}
                style={{
                  backgroundColor: msg.role === 'instructor' ? 'rgba(49, 151, 149, 0.15)' : '#1f2937',
                  borderLeft: msg.role === 'instructor' ? '3px solid var(--primary-teal)' : 'none',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: msg.role === 'instructor' ? 'var(--primary-teal)' : '#63b3ed' }}>
                    {msg.sender}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#6b7280' }}>{msg.time}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#f3f4f6', lineHeight: 1.4 }}>
                  {msg.text}
                </p>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendStudioMessage} style={{ padding: '0.75rem', borderTop: '1px solid #1f2937', display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Type instructor instructions or answer..."
              value={studioInputMsg}
              onChange={e => setStudioInputMsg(e.target.value)}
              className="form-input"
              style={{ flex: 1, height: '38px', fontSize: '0.82rem', backgroundColor: '#1f2937', color: '#fff', borderColor: '#374151' }}
            />
            <button type="submit" className="btn btn-teal" style={{ padding: '0 0.85rem', height: '38px' }}>
              <Send style={{ width: '14px', height: '14px' }} />
            </button>
          </form>
        </>
      ) : (
        /* MCQ Poll Panel */
        <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {activeQuizPoll ? (
            <div>
              <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
                  Live Question Poll Active
                </span>
                <h4 style={{ margin: '0.4rem 0 0.75rem 0', color: '#fff', fontSize: '0.95rem' }}>
                  {activeQuizPoll.question}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {activeQuizPoll.options.map((opt, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '0.45rem 0.65rem',
                        backgroundColor: '#1f2937',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        color: '#cbd5e1',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{opt}</span>
                      <span style={{ fontWeight: 700, color: '#10b981' }}>{activeQuizPoll.votes?.[i] || 0} votes</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleResolveQuizPoll}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '0.5rem', fontSize: '0.82rem' }}
              >
                Close Poll & Announce Results
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmitPoll}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#fff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Award style={{ width: '15px', height: '15px', color: 'var(--accent-yellow)' }} /> Launch Live MCQ Poll
              </h4>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
                  Question Prompt
                </label>
                <input
                  type="text"
                  placeholder="e.g. Which of the following is an SI unit?"
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', height: '36px', fontSize: '0.8rem', backgroundColor: '#1f2937', color: '#fff', borderColor: '#374151' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                {pollOptions.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={opt}
                    onChange={e => {
                      const updated = [...pollOptions];
                      updated[idx] = e.target.value;
                      setPollOptions(updated);
                    }}
                    className="form-input"
                    style={{ height: '32px', fontSize: '0.78rem', backgroundColor: '#1f2937', color: '#fff', borderColor: '#374151' }}
                  />
                ))}
              </div>

              <button type="submit" className="btn btn-teal" style={{ width: '100%', padding: '0.55rem', fontWeight: 700, fontSize: '0.82rem' }}>
                Broadcast Poll to Learners
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
