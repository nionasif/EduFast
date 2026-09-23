import React, { useState, useMemo } from 'react';
import { 
  BookOpen, Search, Download, CheckCircle2, XCircle, 
  HelpCircle, ChevronDown, ChevronUp, RefreshCw, FileText, Check
} from 'lucide-react';
import { getQuestionBank } from '../../data/mockData';

export default function QuestionBankPage({ onStartMockTest }) {
  const [questionPapers, setQuestionPapers] = useState(() => getQuestionBank());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVarsity, setSelectedVarsity] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [expandedPaperId, setExpandedPaperId] = useState(null);
  const [revealedSolutions, setRevealedSolutions] = useState({}); // { [paperId-qId]: boolean }
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [paperId-qId]: optionIndex }
  const [downloadingPdf, setDownloadingPdf] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(null);

  // Extract unique filter options
  const universities = useMemo(() => {
    const list = new Set(questionPapers.map(p => p.varsity));
    return ['All', ...Array.from(list)];
  }, [questionPapers]);

  const subjects = useMemo(() => {
    const list = new Set(questionPapers.map(p => p.subject));
    return ['All', ...Array.from(list)];
  }, [questionPapers]);

  const years = useMemo(() => {
    const list = new Set(questionPapers.map(p => p.year));
    return ['All', ...Array.from(list).sort().reverse()];
  }, [questionPapers]);

  // Filtered papers
  const filteredPapers = useMemo(() => {
    return questionPapers.filter(paper => {
      const matchVarsity = selectedVarsity === 'All' || paper.varsity === selectedVarsity;
      const matchSubject = selectedSubject === 'All' || paper.subject === selectedSubject;
      const matchYear = selectedYear === 'All' || paper.year === selectedYear;
      const matchQuery = !searchQuery.trim() || 
        paper.examName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.varsity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.questions?.some(q => q.question?.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchVarsity && matchSubject && matchYear && matchQuery;
    });
  }, [questionPapers, selectedVarsity, selectedSubject, selectedYear, searchQuery]);

  const toggleReveal = (paperId, qId) => {
    const key = `${paperId}-${qId}`;
    setRevealedSolutions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectOption = (paperId, qId, optionIndex) => {
    const key = `${paperId}-${qId}`;
    setSelectedAnswers(prev => ({
      ...prev,
      [key]: optionIndex
    }));
    setRevealedSolutions(prev => ({
      ...prev,
      [key]: true
    }));
  };

  const handleDownloadPdf = (paper) => {
    setDownloadingPdf(paper.id);
    setTimeout(() => {
      const content = `
=====================================================
EDUFAST ADMISSION QUESTION BANK ARCHIVE
Exam: ${paper.examName} (${paper.year})
University: ${paper.varsity}
Subject: ${paper.subject} | Questions: ${paper.questionsCount}
Total Marks: ${paper.totalMarks}
=====================================================

${paper.questions?.map((q, idx) => `
[Q${idx + 1}] ${q.question}
${q.options.map((opt, oIdx) => `   (${String.fromCharCode(65 + oIdx)}) ${opt}`).join('\n')}
Correct Answer: (${String.fromCharCode(65 + q.correctIndex)}) ${q.options[q.correctIndex]}
Detailed Explanation: ${q.explanation}
-----------------------------------------------------
`).join('\n')}

© EduFast Bangladesh - Verified Admission Guidance Archive
      `.trim();

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `EduFast_${paper.varsity.replace(/\s+/g, '_')}_${paper.year}_${paper.subject}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadingPdf(null);
      setDownloadSuccess(paper.id);
      setTimeout(() => setDownloadSuccess(null), 3500);
    }, 1000);
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-light)', minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* 1. Header Banner - Exact EduFast Style */}
      <div className="course-hub-banner">
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <span className="badge badge-new" style={{ backgroundColor: 'var(--accent-yellow)', color: 'var(--text-charcoal)' }}>
              ★ 100% Free Archive
            </span>
            <span className="badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
              বিগত ১৫ বছরের প্রশ্নব্যাংক
            </span>
          </div>
          <h1 style={{ color: '#fff', fontSize: '2.4rem', marginBottom: '0.5rem', fontWeight: 800 }}>
            Question Bank & Solutions Archive
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.85)', margin: 0, fontSize: '1.05rem', maxWidth: '800px' }}>
            বুয়েট, ঢাকা বিশ্ববিদ্যালয় (ক, খ, গ ইউনিট), মেডিকেল ও ডেন্টাল সহ শীর্ষ পাবলিক বিশ্ববিদ্যালয়ের পূর্ববর্তী বছরের নিখুঁত প্রশ্নপত্র, স্টেপ-বাই-স্টেপ সমাধান ও ডাউনলোডযোগ্য PDF।
          </p>
        </div>
      </div>

      {/* 2. Main Content Container */}
      <div className="container" style={{ paddingTop: '2rem' }}>

        {/* Filter Card */}
        <div style={{
          backgroundColor: 'var(--white)',
          borderRadius: 'var(--border-radius-md)',
          padding: '1.5rem',
          border: '1px solid var(--gray-200)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
            {/* Search Input */}
            <div style={{ gridColumn: 'span 1' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray-600)', marginBottom: '0.35rem' }}>
                সার্চ করুন (Search)
              </label>
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--gray-400)' }} />
                <input
                  type="text"
                  placeholder="প্রশ্ন বা ভার্সিটি খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '2.2rem', height: '42px', fontSize: '0.88rem' }}
                />
              </div>
            </div>

            {/* University Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray-600)', marginBottom: '0.35rem' }}>
                বিশ্ববিদ্যালয়
              </label>
              <select
                value={selectedVarsity}
                onChange={(e) => setSelectedVarsity(e.target.value)}
                className="form-input"
                style={{ width: '100%', height: '42px', fontSize: '0.88rem', background: 'var(--white)' }}
              >
                {universities.map(u => (
                  <option key={u} value={u}>{u === 'All' ? 'সকল বিশ্ববিদ্যালয় (All)' : u}</option>
                ))}
              </select>
            </div>

            {/* Subject Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray-600)', marginBottom: '0.35rem' }}>
                বিষয় (Subject)
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="form-input"
                style={{ width: '100%', height: '42px', fontSize: '0.88rem', background: 'var(--white)' }}
              >
                {subjects.map(s => (
                  <option key={s} value={s}>{s === 'All' ? 'সকল বিষয় (All)' : s}</option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray-600)', marginBottom: '0.35rem' }}>
                পরীক্ষার সাল (Year)
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="form-input"
                style={{ width: '100%', height: '42px', fontSize: '0.88rem', background: 'var(--white)' }}
              >
                {years.map(y => (
                  <option key={y} value={y}>{y === 'All' ? 'সকল সাল (All)' : y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Footer Info */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--gray-200)',
            fontSize: '0.85rem'
          }}>
            <div style={{ color: 'var(--gray-600)' }}>
              মোট প্রশ্নপত্র পাওয়া গেছে: <strong style={{ color: 'var(--primary-teal)', fontSize: '1rem' }}>{filteredPapers.length}</strong> টি
            </div>

            {(selectedVarsity !== 'All' || selectedSubject !== 'All' || selectedYear !== 'All' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedVarsity('All');
                  setSelectedSubject('All');
                  setSelectedYear('All');
                  setSearchQuery('');
                }}
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', height: '34px', color: '#e53e3e' }}
              >
                <RefreshCw style={{ width: '13px', height: '13px', marginRight: '4px' }} /> ফিল্টার রিসেট
              </button>
            )}
          </div>
        </div>

        {/* Papers List */}
        {filteredPapers.length === 0 ? (
          <div style={{
            backgroundColor: 'var(--white)',
            borderRadius: 'var(--border-radius-md)',
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
            border: '1px dashed var(--gray-300)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📑</div>
            <h3 style={{ color: 'var(--text-charcoal)', marginBottom: '0.5rem' }}>কোনো প্রশ্নপত্র পাওয়া যায়নি</h3>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              আপনার ফিল্টার মানদণ্ড অনুযায়ী কোনো রেকর্ড নেই। ফিল্টার পরিবর্তন করে পুনরায় দেখুন।
            </p>
            <button
              onClick={() => {
                setSelectedVarsity('All');
                setSelectedSubject('All');
                setSelectedYear('All');
                setSearchQuery('');
              }}
              className="btn btn-teal"
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
            >
              সকল প্রশ্নপত্র দেখুন
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {filteredPapers.map((paper) => {
              const isExpanded = expandedPaperId === paper.id;

              return (
                <div
                  key={paper.id}
                  style={{
                    backgroundColor: 'var(--white)',
                    borderRadius: 'var(--border-radius-md)',
                    border: '1px solid var(--gray-200)',
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden',
                    transition: 'box-shadow 0.2s ease, border-color 0.2s ease'
                  }}
                >
                  {/* Paper Card Header Row */}
                  <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
                    <div style={{ flex: '1 1 300px' }}>
                      {/* Badges */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{
                          backgroundColor: '#e6fffa',
                          color: '#234e52',
                          border: '1px solid #b2f5ea',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          {paper.year}
                        </span>
                        <span style={{
                          backgroundColor: '#ebf8ff',
                          color: '#2b6cb0',
                          border: '1px solid #bee3f8',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          {paper.subject}
                        </span>
                        <span style={{
                          backgroundColor: 'var(--bg-light)',
                          color: 'var(--gray-600)',
                          border: '1px solid var(--gray-300)',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {paper.group}
                        </span>
                      </div>

                      <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.25rem', color: 'var(--text-charcoal)' }}>
                        {paper.examName}
                      </h3>

                      <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--gray-500)' }}>
                        🏛️ <strong>{paper.varsity}</strong> • {paper.questionsCount} টি প্রশ্ন • পূর্ণমান: {paper.totalMarks}
                      </p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleDownloadPdf(paper)}
                        disabled={downloadingPdf === paper.id}
                        className="btn btn-secondary"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.5rem 1rem',
                          fontSize: '0.85rem',
                          backgroundColor: downloadSuccess === paper.id ? '#e6fffa' : undefined,
                          borderColor: downloadSuccess === paper.id ? '#38a169' : undefined,
                          color: downloadSuccess === paper.id ? '#276749' : undefined
                        }}
                      >
                        {downloadingPdf === paper.id ? (
                          <>
                            <RefreshCw style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                            তৈরি হচ্ছে...
                          </>
                        ) : downloadSuccess === paper.id ? (
                          <>
                            <Check style={{ width: '14px', height: '14px', color: '#38a169' }} />
                            ডাউনলোড সম্পন্ন!
                          </>
                        ) : (
                          <>
                            <Download style={{ width: '14px', height: '14px', color: 'var(--primary-teal)' }} />
                            সমাধান সহ PDF
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setExpandedPaperId(isExpanded ? null : paper.id)}
                        className="btn btn-primary"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.5rem 1.15rem',
                          fontSize: '0.85rem'
                        }}
                      >
                        {isExpanded ? (
                          <>প্রশ্ন লুকান <ChevronUp style={{ width: '16px', height: '16px' }} /></>
                        ) : (
                          <>প্রশ্ন ও সমাধান দেখুন <ChevronDown style={{ width: '16px', height: '16px' }} /></>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Questions Section */}
                  {isExpanded && (
                    <div style={{
                      backgroundColor: 'var(--bg-light)',
                      borderTop: '1px solid var(--gray-200)',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.25rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--gray-500)', borderBottom: '1px solid var(--gray-300)', paddingBottom: '0.5rem' }}>
                        <span>💡 সঠিক অপশনে ক্লিক করে তাৎক্ষণিক সেলফ-টেস্ট ও ব্যাখ্যা যাচাই করুন</span>
                        <span>প্রশ্ন সংখ্যা: {paper.questions?.length || 0} টি</span>
                      </div>

                      {paper.questions?.map((q, idx) => {
                        const answerKey = `${paper.id}-${q.id}`;
                        const selectedOption = selectedAnswers[answerKey];
                        const isRevealed = revealedSolutions[answerKey];
                        const isCorrect = selectedOption === q.correctIndex;

                        return (
                          <div
                            key={q.id}
                            style={{
                              backgroundColor: 'var(--white)',
                              border: '1px solid var(--gray-200)',
                              borderRadius: 'var(--border-radius-sm)',
                              padding: '1.25rem',
                              boxShadow: 'var(--shadow-sm)'
                            }}
                          >
                            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                              <span style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(49, 151, 149, 0.1)',
                                color: 'var(--primary-teal)',
                                border: '1px solid var(--primary-teal)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                flexShrink: 0
                              }}>
                                {idx + 1}
                              </span>

                              <div style={{ flex: 1 }}>
                                <p style={{
                                  fontSize: '1.02rem',
                                  fontWeight: 600,
                                  color: 'var(--text-charcoal)',
                                  marginBottom: '1rem',
                                  lineHeight: 1.5
                                }}>
                                  {q.question}
                                </p>

                                {/* Options Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.65rem' }}>
                                  {q.options?.map((opt, oIdx) => {
                                    const isChosen = selectedOption === oIdx;
                                    const isTargetCorrect = oIdx === q.correctIndex;

                                    let optBg = 'var(--bg-light)';
                                    let optBorder = 'var(--gray-200)';
                                    let optColor = 'var(--text-charcoal)';

                                    if (isRevealed) {
                                      if (isTargetCorrect) {
                                        optBg = '#e6fffa';
                                        optBorder = '#319795';
                                        optColor = '#234e52';
                                      } else if (isChosen && !isTargetCorrect) {
                                        optBg = '#fff5f5';
                                        optBorder = '#e53e3e';
                                        optColor = '#c53030';
                                      }
                                    }

                                    return (
                                      <button
                                        key={oIdx}
                                        onClick={() => handleSelectOption(paper.id, q.id, oIdx)}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.65rem',
                                          padding: '0.75rem 1rem',
                                          borderRadius: 'var(--border-radius-sm)',
                                          border: `1.5px solid ${optBorder}`,
                                          backgroundColor: optBg,
                                          color: optColor,
                                          cursor: 'pointer',
                                          textAlign: 'left',
                                          fontSize: '0.9rem',
                                          fontWeight: isChosen || (isRevealed && isTargetCorrect) ? 600 : 400,
                                          transition: 'all 0.15s ease'
                                        }}
                                      >
                                        <span style={{
                                          width: '24px',
                                          height: '24px',
                                          borderRadius: '50%',
                                          border: '1.5px solid currentColor',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '0.75rem',
                                          fontWeight: 700,
                                          flexShrink: 0
                                        }}>
                                          {['A', 'B', 'C', 'D'][oIdx]}
                                        </span>
                                        <span style={{ flex: 1 }}>{opt}</span>
                                        {isRevealed && isTargetCorrect && (
                                          <CheckCircle2 style={{ width: '16px', height: '16px', color: '#319795', flexShrink: 0 }} />
                                        )}
                                        {isRevealed && isChosen && !isTargetCorrect && (
                                          <XCircle style={{ width: '16px', height: '16px', color: '#e53e3e', flexShrink: 0 }} />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Explanation Toggle & Result */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem' }}>
                                  <button
                                    onClick={() => toggleReveal(paper.id, q.id)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: 'var(--primary-teal)',
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.3rem'
                                    }}
                                  >
                                    <HelpCircle style={{ width: '14px', height: '14px' }} />
                                    {isRevealed ? 'ব্যাখ্যা লুকান' : 'সরাসরি সমাধান ও ব্যাখ্যা দেখুন'}
                                  </button>

                                  {selectedOption !== undefined && (
                                    <span style={{
                                      fontSize: '0.78rem',
                                      fontWeight: 700,
                                      padding: '0.2rem 0.6rem',
                                      borderRadius: '4px',
                                      backgroundColor: isCorrect ? '#e6fffa' : '#fff5f5',
                                      color: isCorrect ? '#234e52' : '#c53030',
                                      border: `1px solid ${isCorrect ? '#b2f5ea' : '#feb2b2'}`
                                    }}>
                                      {isCorrect ? '✓ আপনার উত্তর সঠিক হয়েছে' : '✗ ভুল উত্তর'}
                                    </span>
                                  )}
                                </div>

                                {/* Detailed Explanation Card */}
                                {isRevealed && (
                                  <div style={{
                                    marginTop: '0.85rem',
                                    padding: '1rem',
                                    borderRadius: 'var(--border-radius-sm)',
                                    backgroundColor: '#ebf8ff',
                                    border: '1px solid #bee3f8',
                                    fontSize: '0.88rem'
                                  }}>
                                    <div style={{ color: '#2b6cb0', fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <CheckCircle2 style={{ width: '15px', height: '15px' }} />
                                      সঠিক উত্তর: ({['A', 'B', 'C', 'D'][q.correctIndex]}) {q.options[q.correctIndex]}
                                    </div>
                                    <p style={{ margin: 0, color: '#2d3748', lineHeight: 1.6 }}>
                                      <strong>বিশ্লেষণ ও নোট: </strong> {q.explanation}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
