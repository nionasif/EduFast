import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Globe,
  GraduationCap,
  Award,
  BookOpen,
  CheckCircle,
  ExternalLink,
  Search,
  Sparkles,
  Filter,
  DollarSign,
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function HigherStudyPage({ user, onNavigate, addToast }) {
  const [activeTab, setActiveTab] = useState('evaluator'); // 'evaluator' | 'directory'
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Evaluator Form State
  const [degree, setDegree] = useState('Masters');
  const [field, setField] = useState('Computer Science');
  const [cgpa, setCgpa] = useState(user?.cgpa || '3.50');
  const [ielts, setIelts] = useState('7.0');
  const [gre, setGre] = useState('310');
  const [publications, setPublications] = useState('1');
  const [workExp, setWorkExp] = useState('1');
  const [evalCountry, setEvalCountry] = useState('All');

  // Evaluation Results
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [activeBucket, setActiveBucket] = useState('all'); // 'all' | 'safe' | 'target' | 'ambitious'

  // Fetch Foreign Universities
  const fetchUniversities = async () => {
    setLoading(true);
    try {
      const res = await api.get('/higher-study/universities');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setUniversities(res.data.data);
      }
    } catch (err) {
      console.warn('Could not load foreign universities:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUniversities();
    // Auto-run initial evaluation with default values
    handleEvaluate();
  }, []);

  const handleEvaluate = async (e) => {
    if (e) e.preventDefault();
    setEvaluating(true);
    try {
      const payload = {
        cgpa: parseFloat(cgpa) || 3.5,
        ielts: parseFloat(ielts) || 7.0,
        gre: parseInt(gre, 10) || 0,
        publications: parseInt(publications, 10) || 0,
        workExperience: parseFloat(workExp) || 0,
        degree,
        field,
        preferredCountry: evalCountry
      };

      const res = await api.post('/higher-study/evaluate', payload);
      if (res.data?.success) {
        setEvaluationResult(res.data.evaluation);
        if (addToast && e) {
          addToast('🎉 আপনার প্রোফাইল সফলভাবে মূল্যায়ন করা হয়েছে!', 'success');
        }
      }
    } catch (err) {
      if (addToast) addToast('মূল্যায়ন করতে সমস্যা হয়েছে। অনুগ্রহ করে ডাটা চেক করুন।', 'error');
    } finally {
      setEvaluating(false);
    }
  };

  const countries = ['All', 'United States', 'Canada', 'Germany', 'United Kingdom', 'Australia', 'Sweden', 'Japan'];

  const filteredDirectory = universities.filter(u => {
    const matchesCountry = selectedCountry === 'All' || u.country.toLowerCase() === selectedCountry.toLowerCase();
    const matchesSearch = !searchQuery.trim() || 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.popularPrograms || []).some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCountry && matchesSearch;
  });

  return (
    <div className="higher-study-page" style={{ paddingBottom: '4rem', fontFamily: 'var(--font-sans)' }}>
      {/* 🌟 Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0d9488 100%)',
        color: '#ffffff',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            padding: '4px 14px',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '1rem',
            backdropFilter: 'blur(5px)'
          }}>
            <span>🌍</span>
            <span>EduFast Global Education Support • Feature 6</span>
          </div>

          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, margin: '0 0 0.75rem 0', letterSpacing: '-0.02em', color: '#ffffff', textShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>
            বিদেশে উচ্চশিক্ষা ও স্কলারশিপ মূল্যায়ন
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#cbd5e1', maxWidth: '720px', margin: '0 auto 1.5rem auto', lineHeight: 1.6 }}>
            আপনার CGPA, IELTS, GRE এবং রিসার্চ পাবলিকেশন দিয়ে ইউএসএ, কানাডা, জার্মানি, ইউকে সহ বিশ্বসেরা বিশ্ববিদ্যালয়ে অ্যাডমিশন ও ফুল-ফান্ডেড স্কলারশিপের সম্ভাবনা যাচাই করুন।
          </p>

          {/* Navigation Tabs */}
          <div className="higher-study-hero-tabs" style={{
            display: 'inline-flex',
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '4px',
            borderRadius: '16px',
            backdropFilter: 'blur(10px)',
            gap: '6px'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('evaluator')}
              style={{
                border: 'none',
                padding: '8px 20px',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeTab === 'evaluator' ? '#ffffff' : 'transparent',
                color: activeTab === 'evaluator' ? '#0f172a' : '#ffffff',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'evaluator' ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
              }}
            >
              🎯 AI প্রোফাইল ইভালুয়েটর ও চান্স প্রেডিকশন
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              style={{
                border: 'none',
                padding: '8px 20px',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeTab === 'directory' ? '#ffffff' : 'transparent',
                color: activeTab === 'directory' ? '#0f172a' : '#ffffff',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'directory' ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
              }}
            >
              🌍 গ্লোবাল ইউনিভার্সিটি ও স্কলারশিপ তালিকা ({universities.length})
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '2rem 1rem' }}>
        
        {/* ======================================================== */}
        {/* TAB 1: AI PROFILE EVALUATOR & CHANCE PREDICTOR           */}
        {/* ======================================================== */}
        {activeTab === 'evaluator' && (
          <div>
            <div className="higher-study-eval-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2rem',
              alignItems: 'start'
            }}>
              
              {/* Left Column: Input Form */}
              <div style={{
                background: 'var(--white, #ffffff)',
                border: '1px solid var(--gray-200, #e2e8f0)',
                borderRadius: '24px',
                padding: '2rem',
                boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.05)',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>📝</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-charcoal, #1e293b)' }}>
                      আপনার একাডেমিক প্রোফাইল ইনপুট দিন
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--gray-500, #64748b)' }}>
                      সঠিক ডাটা দিয়ে রিয়েল-টাইম অ্যাডমিশন চান্স দেখুন
                    </span>
                  </div>
                </div>

                <form onSubmit={handleEvaluate}>
                  {/* Degree & Field */}
                  <div className="higher-study-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
                        আবেদনের ডিগ্রি স্তর:
                      </label>
                      <select
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        className="form-select"
                      >
                        <option value="Masters">Masters (MSc / MS)</option>
                        <option value="PhD">PhD / Doctorate</option>
                        <option value="Bachelors">Undergraduate (BSc)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
                        পছন্দের বিষয়/ফিল্ড:
                      </label>
                      <select
                        value={field}
                        onChange={(e) => setField(e.target.value)}
                        className="form-select"
                      >
                        <option value="Computer Science">Computer Science & AI</option>
                        <option value="Data Science">Data Science & Analytics</option>
                        <option value="Engineering">Mechanical / Electrical Eng.</option>
                        <option value="Business">Business Administration (MBA)</option>
                        <option value="Biomedical">Biomedical Sciences</option>
                      </select>
                    </div>
                  </div>

                  {/* CGPA & IELTS */}
                  <div className="higher-study-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
                          স্নাতক CGPA (স্কেল ৪.০০):
                        </label>
                        <span style={{ fontSize: '0.75rem', color: '#0d9488', fontWeight: 700 }}>{cgpa}</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="2.00"
                        max="4.00"
                        value={cgpa}
                        onChange={(e) => setCgpa(e.target.value)}
                        style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 800, color: '#0d9488', outline: 'none', boxSizing: 'border-box' }}
                      />
                      <input
                        type="range"
                        min="2.5"
                        max="4.0"
                        step="0.05"
                        value={parseFloat(cgpa) || 3.0}
                        onChange={(e) => setCgpa(parseFloat(e.target.value).toFixed(2))}
                        style={{ width: '100%', accentColor: '#0d9488', marginTop: '6px' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
                          IELTS স্কোর:
                        </label>
                        <span style={{ fontSize: '0.75rem', color: '#0d9488', fontWeight: 700 }}>Band {ielts}</span>
                      </div>
                      <input
                        type="number"
                        step="0.5"
                        min="5.0"
                        max="9.0"
                        value={ielts}
                        onChange={(e) => setIelts(e.target.value)}
                        style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 800, color: '#0d9488', outline: 'none', boxSizing: 'border-box' }}
                      />
                      <input
                        type="range"
                        min="5.5"
                        max="9.0"
                        step="0.5"
                        value={parseFloat(ielts) || 6.5}
                        onChange={(e) => setIelts(parseFloat(e.target.value).toFixed(1))}
                        style={{ width: '100%', accentColor: '#0d9488', marginTop: '6px' }}
                      />
                    </div>
                  </div>

                  {/* Publications & GRE */}
                  <div className="higher-study-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
                        রিসার্চ পাবলিকেশন সংখ্যা:
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={publications}
                        onChange={(e) => setPublications(e.target.value)}
                        placeholder="e.g. 0 or 2"
                        style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                      />
                      <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                        IEEE, Springer বা Scopus পেপার
                      </span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
                        GRE স্কোর (ঐচ্ছিক):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="340"
                        value={gre}
                        onChange={(e) => setGre(e.target.value)}
                        placeholder="e.g. 315 (না থাকলে ০)"
                        style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                      />
                      <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                        ইউএসএ টপ ভার্সিটিতে প্রাধান্য পায়
                      </span>
                    </div>
                  </div>

                  {/* Country Preference */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
                      পছন্দের দেশ ফিল্টার:
                    </label>
                    <select
                      value={evalCountry}
                      onChange={(e) => setEvalCountry(e.target.value)}
                      className="form-select"
                    >
                      {countries.map(c => (
                        <option key={c} value={c}>{c === 'All' ? '🌍 সকল দেশ (All Countries)' : c}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-teal"
                    disabled={evaluating}
                    style={{
                      width: '100%',
                      padding: '0.9rem',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 15px rgba(13, 148, 136, 0.3)'
                    }}
                  >
                    {evaluating ? (
                      <span>🤖 এআই এনালাইসিস চলছে...</span>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        <span>প্রোফাইল মূল্যায়ন করুন (Evaluate Profile)</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Right Column: AI Score & Match Dashboard */}
              {evaluationResult && (
                <div style={{ textAlign: 'left' }}>
                  
                  {/* Score Card */}
                  <div style={{
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    color: '#ffffff',
                    borderRadius: '24px',
                    padding: '1.75rem',
                    marginBottom: '1.5rem',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          AI Profile Strength Score
                        </span>
                        <span style={{ background: '#10b981', color: '#ffffff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '10px' }}>
                          🐍 Python ML (Acc: 94.5%)
                        </span>
                      </div>
                      <h3 style={{ margin: '0.2rem 0', fontSize: '1.35rem', color: '#ffffff' }}>
                        {evaluationResult.profileBand}
                      </h3>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        CGPA: {evaluationResult.candidateSummary.cgpa} • IELTS: {evaluationResult.candidateSummary.ielts} • পেপার: {evaluationResult.candidateSummary.publications}টি
                      </span>
                    </div>

                    <div style={{
                      background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                      borderRadius: '20px',
                      padding: '1rem 1.5rem',
                      textAlign: 'center',
                      boxShadow: '0 8px 20px rgba(13, 148, 136, 0.35)'
                    }}>
                      <div style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1 }}>
                        {evaluationResult.overallScore}
                        <span style={{ fontSize: '1.1rem', opacity: 0.8 }}>/100</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', opacity: 0.9 }}>গ্লোবাল রেটিং</span>
                    </div>
                  </div>

                  {/* AI Recommendations Buckets Navigation */}
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    overflowX: 'auto',
                    paddingBottom: '4px'
                  }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setActiveBucket('all')}
                      style={{
                        padding: '0.45rem 0.9rem',
                        fontSize: '0.82rem',
                        borderRadius: '10px',
                        fontWeight: 700,
                        background: activeBucket === 'all' ? '#0d9488' : '#f1f5f9',
                        color: activeBucket === 'all' ? '#ffffff' : '#475569',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      সবগুলো ({evaluationResult.recommendations.totalMatches})
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setActiveBucket('safe')}
                      style={{
                        padding: '0.45rem 0.9rem',
                        fontSize: '0.82rem',
                        borderRadius: '10px',
                        fontWeight: 700,
                        background: activeBucket === 'safe' ? '#10b981' : '#ecfdf5',
                        color: activeBucket === 'safe' ? '#ffffff' : '#059669',
                        border: '1px solid #a7f3d0',
                        cursor: 'pointer'
                      }}
                    >
                      🟢 Safe Matches ({evaluationResult.recommendations.safe.length})
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setActiveBucket('target')}
                      style={{
                        padding: '0.45rem 0.9rem',
                        fontSize: '0.82rem',
                        borderRadius: '10px',
                        fontWeight: 700,
                        background: activeBucket === 'target' ? '#0d9488' : '#f0fdfa',
                        color: activeBucket === 'target' ? '#ffffff' : '#0f766e',
                        border: '1px solid #99f6e4',
                        cursor: 'pointer'
                      }}
                    >
                      🟡 Target Matches ({evaluationResult.recommendations.target.length})
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setActiveBucket('ambitious')}
                      style={{
                        padding: '0.45rem 0.9rem',
                        fontSize: '0.82rem',
                        borderRadius: '10px',
                        fontWeight: 700,
                        background: activeBucket === 'ambitious' ? '#d97706' : '#fffbeb',
                        color: activeBucket === 'ambitious' ? '#ffffff' : '#b45309',
                        border: '1px solid #fde68a',
                        cursor: 'pointer'
                      }}
                    >
                      🔴 Ambitious Top Tier ({evaluationResult.recommendations.ambitious.length})
                    </button>
                  </div>

                  {/* University Match Cards List */}
                  {(() => {
                    let listToDisplay = [];
                    if (activeBucket === 'safe') listToDisplay = evaluationResult.recommendations.safe;
                    else if (activeBucket === 'target') listToDisplay = evaluationResult.recommendations.target;
                    else if (activeBucket === 'ambitious') listToDisplay = evaluationResult.recommendations.ambitious;
                    else {
                      listToDisplay = [
                        ...evaluationResult.recommendations.safe,
                        ...evaluationResult.recommendations.target,
                        ...evaluationResult.recommendations.ambitious
                      ];
                    }

                    if (listToDisplay.length === 0) {
                      return (
                        <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                          <p style={{ margin: 0, color: '#64748b' }}>এই ক্যাটাগরিতে কোনো বিশ্ববিদ্যালয় পাওয়া যায়নি।</p>
                        </div>
                      );
                    }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '560px', overflowY: 'auto', paddingRight: '4px' }}>
                        {listToDisplay.map(univ => (
                          <div
                            key={univ.id}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '16px',
                              padding: '1.25rem',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              position: 'relative'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '1.6rem' }}>{univ.flag}</span>
                                <div>
                                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>
                                    {univ.name}
                                  </h4>
                                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    {univ.city}, {univ.country} • QS World Rank: #{univ.qsRank}
                                  </span>
                                </div>
                              </div>

                              <div style={{
                                background: univ.matchProbability >= 75 ? '#ecfdf5' : univ.matchProbability >= 50 ? '#f0fdfa' : '#fffbeb',
                                color: univ.matchProbability >= 75 ? '#059669' : univ.matchProbability >= 50 ? '#0d9488' : '#d97706',
                                border: `1px solid ${univ.matchProbability >= 75 ? '#a7f3d0' : univ.matchProbability >= 50 ? '#99f6e4' : '#fde68a'}`,
                                borderRadius: '12px',
                                padding: '4px 10px',
                                textAlign: 'center',
                                flexShrink: 0
                              }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{univ.matchProbability}%</div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                  {univ.matchProbability >= 75 ? 'Safe Match' : univ.matchProbability >= 50 ? 'Target' : 'Dream Tier'}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '0.75rem 0' }}>
                              <span style={{ fontSize: '0.74rem', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', color: '#475569', fontWeight: 600 }}>
                                🎓 Min CGPA: {univ.minCgpa.toFixed(2)}
                              </span>
                              <span style={{ fontSize: '0.74rem', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', color: '#475569', fontWeight: 600 }}>
                                🗣️ Min IELTS: {univ.minIelts.toFixed(1)}
                              </span>
                              <span style={{ fontSize: '0.74rem', background: '#fef3c7', padding: '3px 8px', borderRadius: '6px', color: '#92400e', fontWeight: 700 }}>
                                💰 টিউশন: {univ.tuitionPerYear}
                              </span>
                            </div>

                            <div style={{ background: '#f8fafc', padding: '0.6rem 0.85rem', borderRadius: '10px', fontSize: '0.8rem', color: '#334155', marginBottom: '0.85rem' }}>
                              <strong>🎁 স্কলারশিপ সুযোগ:</strong> {univ.scholarship}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                ⏳ ডেডলাইন: <strong>{univ.applyDeadline}</strong>
                              </span>
                              <a
                                href={univ.portalUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  color: '#0d9488',
                                  textDecoration: 'none'
                                }}
                              >
                                পোর্টাল দেখুন <ExternalLink size={14} />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* AI Suggestions Box */}
                  {evaluationResult.suggestions && evaluationResult.suggestions.length > 0 && (
                    <div style={{
                      marginTop: '1.5rem',
                      background: '#f0fdfa',
                      border: '1px solid #99f6e4',
                      borderRadius: '16px',
                      padding: '1.25rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem', color: '#0f766e', fontWeight: 800, fontSize: '0.9rem' }}>
                        <Sparkles size={16} />
                        <span>AI অ্যাডমিশন স্ট্র্যাটেজি ও প্রোফাইল পরামর্শ:</span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.82rem', color: '#134e4a', lineHeight: 1.6 }}>
                        {evaluationResult.suggestions.map((tip, idx) => (
                          <li key={idx} style={{ marginBottom: '0.35rem' }}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: GLOBAL UNIVERSITIES DIRECTORY & SCHOLARSHIPS      */}
        {/* ======================================================== */}
        {activeTab === 'directory' && (
          <div style={{ textAlign: 'left' }}>
            {/* Filter Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem'
            }}>
              {/* Country Badges */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {countries.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCountry(c)}
                    style={{
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: selectedCountry === c ? '#0d9488' : '#f1f5f9',
                      color: selectedCountry === c ? '#ffffff' : '#475569',
                      transition: 'all 0.15s'
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div style={{ position: 'relative', minWidth: '240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="বিশ্ববিদ্যালয় বা বিষয় খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* University Directory Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '1.25rem'
            }}>
              {filteredDirectory.map(univ => (
                <div
                  key={univ.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '20px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 15px -2px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.8rem' }}>{univ.flag}</span>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
                            {univ.name}
                          </h4>
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            {univ.city}, {univ.country}
                          </span>
                        </div>
                      </div>
                      <span style={{ background: '#f0fdfa', color: '#0d9488', fontSize: '0.74rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px' }}>
                        QS #{univ.qsRank}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', margin: '0.75rem 0' }}>
                      <span style={{ fontSize: '0.74rem', background: '#f1f5f9', padding: '3px 7px', borderRadius: '6px', color: '#475569', fontWeight: 600 }}>
                        CGPA: {univ.minCgpa.toFixed(2)}+
                      </span>
                      <span style={{ fontSize: '0.74rem', background: '#f1f5f9', padding: '3px 7px', borderRadius: '6px', color: '#475569', fontWeight: 600 }}>
                        IELTS: {univ.minIelts.toFixed(1)}+
                      </span>
                      <span style={{ fontSize: '0.74rem', background: '#fef3c7', padding: '3px 7px', borderRadius: '6px', color: '#92400e', fontWeight: 700 }}>
                        ফি: {univ.tuitionPerYear}
                      </span>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '12px', fontSize: '0.8rem', color: '#334155', marginBottom: '0.75rem' }}>
                      <strong>🎁 স্কলারশিপ:</strong> {univ.scholarship}
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      <strong>জনপ্রিয় প্রোগ্রাম:</strong> {(univ.popularPrograms || []).join(', ')}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      আবেদন শেষ: <strong>{univ.applyDeadline}</strong>
                    </span>
                    <a
                      href={univ.portalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary"
                      style={{
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>আবেদন লিংক</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
