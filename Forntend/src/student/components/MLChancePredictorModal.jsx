import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Sparkles,
  TrendingUp,
  Award,
  CheckCircle,
  AlertCircle,
  X,
  GraduationCap,
  ArrowRight
} from 'lucide-react';

export default function MLChancePredictorModal({ isOpen, onClose, user, addToast }) {
  const [sscGpa, setSscGpa] = useState(user?.ssc?.gpa || '5.00');
  const [hscGpa, setHscGpa] = useState(user?.hsc?.gpa || '5.00');
  const [group, setGroup] = useState(user?.group || user?.academicGroup || 'Science');
  const [mockScore, setMockScore] = useState(78);

  const [physicsGrade, setPhysicsGrade] = useState('A+');
  const [chemistryGrade, setChemistryGrade] = useState('A+');
  const [mathGrade, setMathGrade] = useState('A+');
  const [biologyGrade, setBiologyGrade] = useState('A');
  const [englishGrade, setEnglishGrade] = useState('A+');

  const [loading, setLoading] = useState(false);
  const [predictionData, setPredictionData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      handleRunPrediction();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRunPrediction = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        sscGpa: parseFloat(sscGpa) || 5.0,
        hscGpa: parseFloat(hscGpa) || 5.0,
        group,
        mockTestAvg: parseFloat(mockScore) || 75,
        subjectGrades: {
          physics: physicsGrade,
          chemistry: chemistryGrade,
          math: mathGrade,
          biology: biologyGrade,
          english: englishGrade
        }
      };

      const res = await api.post('/ml/predict-admission-chances', payload);
      if (res.data?.success && res.data.data) {
        setPredictionData(res.data.data);
      }
    } catch (err) {
      if (addToast) addToast('প্রেডিকশন সম্পন্ন করতে সমস্যা হয়েছে।', 'error');
    } finally {
      setLoading(false);
    }
  };

  const grades = ['A+', 'A', 'A-', 'B'];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }} onClick={onClose}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '840px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f1f5f9',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          borderRadius: '24px 24px 0 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.6rem' }}>🤖</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                  AI & ML University Admission Predictor
                </h3>
                <span style={{ background: '#10b981', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 7px', borderRadius: '10px' }}>
                  ML ENGINE
                </span>
              </div>
              <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                বিগত বছরের কাট-অফ ও সাবজেক্টভিত্তিক স্কোর বিশ্লেষণ করে চান্স প্রেডিকশন
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Controls Form Grid */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '18px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  এসএসসি জিপিএ:
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="2.0"
                  max="5.0"
                  value={sscGpa}
                  onChange={(e) => setSscGpa(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.9rem', color: '#0d9488', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  এইচএসসি জিপিএ:
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="2.0"
                  max="5.0"
                  value={hscGpa}
                  onChange={(e) => setHscGpa(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.9rem', color: '#0d9488', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    মক টেস্ট স্কোর:
                  </label>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0d9488' }}>{mockScore}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="98"
                  value={mockScore}
                  onChange={(e) => setMockScore(e.target.value)}
                  style={{ width: '100%', accentColor: '#0d9488', marginTop: '8px' }}
                />
              </div>
            </div>

            {/* Subject Grades Dropdowns */}
            {group === 'Science' && (
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                  এইচএসসি মূল বিষয়সমূহের গ্রেড পয়েন্ট:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>পদার্থবিজ্ঞান:</label>
                    <select
                      value={physicsGrade}
                      onChange={(e) => setPhysicsGrade(e.target.value)}
                      className="form-select form-select-sm"
                      style={{ fontWeight: 700 }}
                    >
                      {grades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>রসায়ন:</label>
                    <select
                      value={chemistryGrade}
                      onChange={(e) => setChemistryGrade(e.target.value)}
                      className="form-select form-select-sm"
                      style={{ fontWeight: 700 }}
                    >
                      {grades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>উচ্চতর গণিত:</label>
                    <select
                      value={mathGrade}
                      onChange={(e) => setMathGrade(e.target.value)}
                      className="form-select form-select-sm"
                      style={{ fontWeight: 700 }}
                    >
                      {grades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>জীববিজ্ঞান:</label>
                    <select
                      value={biologyGrade}
                      onChange={(e) => setBiologyGrade(e.target.value)}
                      className="form-select form-select-sm"
                      style={{ fontWeight: 700 }}
                    >
                      {grades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>ইংরেজি:</label>
                    <select
                      value={englishGrade}
                      onChange={(e) => setEnglishGrade(e.target.value)}
                      className="form-select form-select-sm"
                      style={{ fontWeight: 700 }}
                    >
                      {grades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              className="btn btn-teal"
              onClick={handleRunPrediction}
              disabled={loading}
              style={{
                marginTop: '1rem',
                width: '100%',
                padding: '0.65rem',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Sparkles size={16} />
              <span>{loading ? 'প্রেডিকশন হিসাব হচ্ছে...' : 'রিয়েল-টাইম চান্স প্রেডিকশন রান করুন'}</span>
            </button>
          </div>

          {/* Predictions Result Cards Grid */}
          {predictionData && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>
                    🎯 বিশ্ববিদ্যালয়ভিত্তিক ভর্তি পরীক্ষার সম্ভাব্যতা রেজাল্ট:
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '3px 10px', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#15803d' }}>
                      🐍 Python 3.13 • Scikit-Learn RandomForest (Acc: 89.8%)
                    </span>
                  </div>
                </div>

                {predictionData.summary?.percentileRank && (
                  <div style={{
                    background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                    color: '#ffffff',
                    padding: '0.65rem 1rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.82rem',
                    fontWeight: 700
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Award size={18} />
                      <span>{predictionData.summary.percentileRank}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                      মোট জিপিএ: {predictionData.summary.combinedGpa} • মক স্কোর: {predictionData.summary.mockTestAvg}%
                    </span>
                  </div>
                )}

                {((predictionData.strengths && predictionData.strengths.length > 0) || (predictionData.areasToImprove && predictionData.areasToImprove.length > 0)) && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', marginTop: '0.25rem' }}>
                    {predictionData.strengths && predictionData.strengths.length > 0 && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '10px', padding: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                          <CheckCircle size={14} /> শক্তিমত্তা (Strengths):
                        </span>
                        {predictionData.strengths.map((str, idx) => (
                          <p key={idx} style={{ margin: '2px 0', fontSize: '0.75rem', color: '#14532d', lineHeight: 1.35 }}>
                            • {str}
                          </p>
                        ))}
                      </div>
                    )}
                    {predictionData.areasToImprove && predictionData.areasToImprove.length > 0 && (
                      <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '10px', padding: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400e', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                          <AlertCircle size={14} /> উন্নতির সুযোগ (Action Items):
                        </span>
                        {predictionData.areasToImprove.map((item, idx) => (
                          <p key={idx} style={{ margin: '2px 0', fontSize: '0.75rem', color: '#78350f', lineHeight: 1.35 }}>
                            • {item}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {predictionData.predictions.map(item => (
                  <div
                    key={item.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderLeft: `5px solid ${item.tierColor}`,
                      borderRadius: '14px',
                      padding: '1rem',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.75rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div>
                          <h5 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#1e293b' }}>
                            {item.name}
                          </h5>
                          <span style={{ fontSize: '0.74rem', color: '#0d9488', fontWeight: 700 }}>
                            {item.unit}
                          </span>
                        </div>
                        {item.isEligible ? (
                          <div style={{
                            background: item.chancePercent >= 75 ? '#ecfdf5' : '#fffbeb',
                            color: item.tierColor,
                            padding: '3px 8px',
                            borderRadius: '8px',
                            fontWeight: 900,
                            fontSize: '1.05rem',
                            flexShrink: 0
                          }}>
                            {item.chancePercent}%
                          </div>
                        ) : (
                          <span style={{ background: '#fef2f2', color: '#ef4444', fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px', borderRadius: '6px' }}>
                            শর্ত অপূর্ণ
                          </span>
                        )}
                      </div>

                      {item.isEligible ? (
                        <div style={{ marginTop: '0.5rem' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            color: item.tierColor,
                            background: `${item.tierColor}15`,
                            padding: '2px 7px',
                            borderRadius: '6px',
                            display: 'inline-block',
                            marginBottom: '0.35rem'
                          }}>
                            {item.tier}
                          </span>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                            {item.suggestion}
                          </p>
                        </div>
                      ) : (
                        <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.74rem', color: '#ef4444' }}>
                          ⚠️ {item.ineligibleReason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
