import { useState, useEffect, useMemo } from 'react';
import { getAdmissions, getStudentMockStats } from '../../data/mockData';
import CountdownTimer from '../../common/components/CountdownTimer';

export default function AdmissionDetailsPage({ user, addToast, initialSelectedUnivId }) {
  const [admissionsList, setAdmissionsList] = useState(getAdmissions);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all'); // Default to 'all' so all universities show for every account
  const [mockStats, setMockStats] = useState(() => getStudentMockStats(user));

  // If a university was selected from Dashboard, bring it to the very top
  const sortedAdmissionsList = useMemo(() => {
    if (!initialSelectedUnivId) return admissionsList;
    return [...admissionsList].sort((a, b) => {
      if (a.id === initialSelectedUnivId) return -1;
      if (b.id === initialSelectedUnivId) return 1;
      return 0;
    });
  }, [admissionsList, initialSelectedUnivId]);

  useEffect(() => {
    if (initialSelectedUnivId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`univ-card-${initialSelectedUnivId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [initialSelectedUnivId]);

  useEffect(() => {
    const handleUpdate = () => {
      setAdmissionsList(getAdmissions());
      setMockStats(getStudentMockStats(user));
    };
    window.addEventListener('edufast-data-update', handleUpdate);
    window.addEventListener('edufast-mock-history-update', handleUpdate);
    return () => {
      window.removeEventListener('edufast-data-update', handleUpdate);
      window.removeEventListener('edufast-mock-history-update', handleUpdate);
    };
  }, [user]);

  const sscGpa = Number(user?.ssc?.gpa) || 0;
  const hscGpa = Number(user?.hsc?.gpa) || 0;
  const combinedGpa = sscGpa + hscGpa;
  const studentGroup = (user?.group || '').trim();

  const checkEligibility = (unit) => {
    // 1. If GPA is not configured for a fresh account
    if (combinedGpa === 0) {
      return {
        eligible: false,
        reason: 'আপনার প্রোফাইলে এসএসসি ও এইচএসসি জিপিএ তথ্য যুক্ত করুন।'
      };
    }

    // 2. Group Match
    const matchesGroup = !unit.group || unit.group === 'All' || !studentGroup || unit.group.toLowerCase() === studentGroup.toLowerCase();
    if (!matchesGroup) {
      return {
        eligible: false,
        reason: `Requires academic group: ${unit.group} (Your group: ${studentGroup || 'None'})`
      };
    }

    // 3. Combined GPA Match
    if (combinedGpa < (unit.minGpa || 0)) {
      return {
        eligible: false,
        reason: `Combined GPA must be at least ${(unit.minGpa || 0).toFixed(2)} (Your combined: ${combinedGpa.toFixed(2)})`
      };
    }

    // 4. Individual GPA Match (SSC & HSC minimums)
    if (sscGpa < (unit.minIndividualGpa || 0) || hscGpa < (unit.minIndividualGpa || 0)) {
      return {
        eligible: false,
        reason: `Requires minimum individual GPA of ${(unit.minIndividualGpa || 0).toFixed(2)} in both SSC & HSC (Your SSC: ${sscGpa.toFixed(2)}, HSC: ${hscGpa.toFixed(2)})`
      };
    }

    return { eligible: true };
  };

  // Compute real-time, non-dummy university admission chances based on real student profile & test stats
  const radarCards = useMemo(() => {
    const rawGroup = (user?.group || user?.academicGroup || '').toLowerCase();
    const hasGpa = combinedGpa > 0;
    const hasMock = mockStats && mockStats.totalTests > 0;
    const mockScore = hasMock ? Number(mockStats.avgAccuracy) : null;

    const isCommerce = rawGroup.includes('commerce') || rawGroup.includes('ব্যবসায়');
    const isArts = rawGroup.includes('arts') || rawGroup.includes('humanities') || rawGroup.includes('মানবিক');

    let targets = [];

    if (isCommerce) {
      targets = [
        {
          univ: "ঢাকা বিশ্ববিদ্যালয় ('গ' ইউনিট - FBS)",
          minGpa: 7.50,
          minSingle: 3.00,
          competitiveCutoff: 9.50,
          weightGpa: 0.35,
          weightMock: 0.65
        },
        {
          univ: "DU IBA & BUP (Business Administration)",
          minGpa: 8.00,
          minSingle: 3.50,
          competitiveCutoff: 9.80,
          weightGpa: 0.30,
          weightMock: 0.70
        },
        {
          univ: "জাহাঙ্গীরনগর বিশ্ববিদ্যালয় ('E' ইউনিট)",
          minGpa: 7.50,
          minSingle: 3.50,
          competitiveCutoff: 9.00,
          weightGpa: 0.40,
          weightMock: 0.60
        },
        {
          univ: "GST গুচ্ছ (ব্যবসায় শিক্ষা অনুষদ)",
          minGpa: 6.50,
          minSingle: 3.00,
          competitiveCutoff: 8.50,
          weightGpa: 0.45,
          weightMock: 0.55
        }
      ];
    } else if (isArts) {
      targets = [
        {
          univ: "ঢাকা বিশ্ববিদ্যালয় ('খ' ইউনিট - কলা ও আইন)",
          minGpa: 7.50,
          minSingle: 3.00,
          competitiveCutoff: 9.50,
          weightGpa: 0.35,
          weightMock: 0.65
        },
        {
          univ: "জাহাঙ্গীরনগর বিশ্ববিদ্যালয় ('C' ও 'B' ইউনিট)",
          minGpa: 7.50,
          minSingle: 3.50,
          competitiveCutoff: 9.00,
          weightGpa: 0.40,
          weightMock: 0.60
        },
        {
          univ: "রাজশাহী ও চট্টগ্রাম বিশ্ববিদ্যালয় ('A' / 'B')",
          minGpa: 7.00,
          minSingle: 3.00,
          competitiveCutoff: 8.80,
          weightGpa: 0.40,
          weightMock: 0.60
        },
        {
          univ: "GST গুচ্ছ (মানবিক অনুষদ - B Unit)",
          minGpa: 6.00,
          minSingle: 3.00,
          competitiveCutoff: 8.00,
          weightGpa: 0.45,
          weightMock: 0.55
        }
      ];
    } else {
      // Science
      targets = [
        {
          univ: "BUET (ইঞ্জিনিয়ারিং)",
          minGpa: 10.00,
          minSingle: 5.00,
          competitiveCutoff: 10.00,
          weightGpa: 0.30,
          weightMock: 0.70
        },
        {
          univ: "ঢাকা বিশ্ববিদ্যালয় ('ক' ইউনিট - বিজ্ঞান)",
          minGpa: 8.00,
          minSingle: 3.50,
          competitiveCutoff: 9.50,
          weightGpa: 0.35,
          weightMock: 0.65
        },
        {
          univ: "সরকারি মেডিকেল কলেজ (MBBS)",
          minGpa: 9.00,
          minSingle: 4.00,
          competitiveCutoff: 10.00,
          weightGpa: 0.40,
          weightMock: 0.60
        },
        {
          univ: "GST গুচ্ছ ও কৃষি গুচ্ছ (Science)",
          minGpa: 7.50,
          minSingle: 3.00,
          competitiveCutoff: 8.80,
          weightGpa: 0.45,
          weightMock: 0.55
        }
      ];
    }

    return targets.map(t => {
      if (!hasGpa) {
        return {
          univ: t.univ,
          chance: 0,
          status: "জিপিএ তথ্য প্রয়োজন",
          color: "#94a3b8",
          tip: "প্রোফাইলে এসএসসি ও এইচএসসি জিপিএ যুক্ত করলে সম্ভাবনা লাইভ দেখতে পাবেন।"
        };
      }

      const isGpaEligible = combinedGpa >= t.minGpa && sscGpa >= t.minSingle && hscGpa >= t.minSingle;
      if (!isGpaEligible) {
        return {
          univ: t.univ,
          chance: 0,
          status: "Ineligible (অযোগ্য)",
          color: "#ef4444",
          tip: `ন্যূনতম জিপিএ ${t.minGpa.toFixed(2)} (উভয় পরীক্ষায় ${t.minSingle.toFixed(2)}) আবশ্যক। আপনার বর্তমান জিপিএ: ${combinedGpa.toFixed(2)}।`
        };
      }

      let gpaScore = 50;
      if (combinedGpa >= t.competitiveCutoff) {
        gpaScore = 95;
      } else {
        const gpaDiff = combinedGpa - t.minGpa;
        const range = t.competitiveCutoff - t.minGpa;
        gpaScore = Math.min(92, Math.max(45, Math.round((gpaDiff / (range || 1)) * 45 + 50)));
      }

      let finalChance = 0;
      let tip = "";

      if (hasMock) {
        finalChance = Math.min(98, Math.max(15, Math.round(gpaScore * t.weightGpa + mockScore * t.weightMock)));

        if (finalChance >= 85) {
          tip = `আপনার বর্তমান জিপিএ (${combinedGpa.toFixed(2)}) এবং মক টেস্ট স্কোরে (${mockScore}%) শীর্ষ মেরিট প্রত্যাশিত।`;
        } else if (finalChance >= 70) {
          tip = `মক টেস্টে আর ৫-৭ নম্বর বাড়াতে পারলে এই ইউনিটে আপনার সিট শতভাগ নিরাপদ থাকবে।`;
        } else if (finalChance >= 50) {
          tip = `প্রতিদ্বন্দ্বিতাপূর্ণ অবস্থান। মক টেস্টে ভুল উত্তর কমালে সম্ভাবনা দ্রুত বৃদ্ধি পাবে।`;
        } else {
          tip = `ডেইলি ফোকাস প্ল্যান নিয়মিত সমাধান করে মক টেস্ট স্কোর বাড়ানোর পরামর্শ দেওয়া হচ্ছে।`;
        }
      } else {
        finalChance = Math.min(82, Math.max(25, Math.round(gpaScore * 0.75)));
        tip = `এসএসসি ও এইচএসসি জিপিএ অনুযায়ী প্রাথমিক সম্ভাবনা। মক টেস্ট দিলে আরও নিখুঁত প্রেডিকশন পাবেন।`;
      }

      let status = "Competitive";
      let color = "#f59e0b";

      if (finalChance >= 85) {
        status = "Very High Chance";
        color = "#10b981";
      } else if (finalChance >= 70) {
        status = "High Chance";
        color = "#0ea5e9";
      } else if (finalChance >= 50) {
        status = "Competitive";
        color = "#f59e0b";
      } else {
        status = "Hard Reach";
        color = "#f97316";
      }

      return {
        univ: t.univ,
        chance: finalChance,
        status,
        color,
        tip
      };
    });
  }, [user, combinedGpa, sscGpa, hscGpa, mockStats]);

  const handleApply = (univName, unitName, isEligible) => {
    if (!isEligible) {
      addToast(`Eligibility check failed: You cannot apply for ${unitName} of ${univName}.`, 'error');
      return;
    }
    addToast(`Successfully applied online for ${univName} - ${unitName}! Check your email/notifications for updates.`, 'success');
  };

  return (
    <div>
      {/* Header Banner */}
      <div className="admission-header-bg">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.3rem', marginBottom: '0.5rem' }}>University Admission Circulars</h1>
          <p style={{ color: 'var(--gray-600)', margin: 0 }}>
            Analyze unit details, deadlines, exam structures, and instantly verify your eligibility.
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 0' }}>

        {/* Dynamic Global Filter Buttons */}
        <div className="admission-filter-pill-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-charcoal)', marginRight: '0.5rem' }}>
              Filter by Unit Group:
            </span>
            {[
              { id: 'all', label: 'All Units (সব ইউনিট)' },
              { id: 'auto', label: studentGroup ? `My Group: ${studentGroup}` : 'My Group' },
              { id: 'Science', label: 'Science (বিজ্ঞান)' },
              { id: 'Commerce', label: 'Commerce (ব্যবসায়)' },
              { id: 'Humanities', label: 'Humanities (মানবিক)' }
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setSelectedGroupFilter(pill.id)}
                className={`admission-filter-pill ${selectedGroupFilter === pill.id ? 'active' : ''}`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Student academic stats summary badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
              Logged-in Profile: <strong>{user?.name || 'Student'}</strong>
            </span>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <span className="gpa-badge">
                SSC: <strong>{sscGpa > 0 ? sscGpa.toFixed(2) : 'N/A'}</strong>
              </span>
              <span className="gpa-badge">
                HSC: <strong>{hscGpa > 0 ? hscGpa.toFixed(2) : 'N/A'}</strong>
              </span>
              <span className="gpa-badge" style={{ background: '#e6fffa', borderColor: 'var(--primary-teal)', color: 'var(--primary-teal)' }}>
                Total: <strong>{combinedGpa > 0 ? combinedGpa.toFixed(2) : '0.00'}</strong>
              </span>
              {studentGroup && (
                <span className="gpa-badge" style={{ background: '#fef3c7', borderColor: '#f59e0b', color: '#92400e' }}>
                  Group: <strong>{studentGroup}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 🌟 SMART ADMISSION GPS & CHANCE PREDICTOR WIDGET (LIVE & NON-DUMMY) */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <span style={{ background: 'linear-gradient(135deg, #10b981, #0ea5e9)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                AI ADMISSION GPS
              </span>
              <h3 style={{ margin: '0.4rem 0 0.2rem 0', fontSize: '1.25rem' }}>
                🎯 রিয়েল-টাইম বিশ্ববিদ্যালয় ভর্তি সম্ভাবনা প্রেডিক্টর (Admission Chance Radar)
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                আপনার এসএসসি ও এইচএসসি জিপিএ এবং সাম্প্রতিক মক টেস্ট স্কোরের ভিত্তিতে শীর্ষ বিশ্ববিদ্যালয়গুলোতে চান্স পাওয়ার শতকরা হার:
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ background: 'var(--bg-light)', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid var(--gray-200)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)', display: 'block' }}>Verified Board GPA</span>
                <strong style={{ fontSize: '1.1rem', color: combinedGpa > 0 ? 'var(--primary-teal)' : '#94a3b8' }}>
                  {combinedGpa > 0 ? `${combinedGpa.toFixed(2)} / 10.00` : '0.00 (তথ্য দিন)'}
                </strong>
              </div>

              <div style={{ background: 'var(--bg-light)', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid var(--gray-200)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)', display: 'block' }}>মক টেস্ট ডাটা</span>
                <strong style={{ fontSize: '1.1rem', color: mockStats.totalTests > 0 ? '#10b981' : '#f59e0b' }}>
                  {mockStats.totalTests > 0 ? `${mockStats.avgAccuracy}% (${mockStats.totalTests}টি)` : 'মক টেস্ট বাকি'}
                </strong>
              </div>
            </div>
          </div>

          {/* Missing GPA helper notice if fresh account */}
          {combinedGpa === 0 && (
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.82rem',
              color: '#92400e',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>💡</span>
              <span>
                আপনার প্রোফাইলে এখনও এসএসসি ও এইচএসসি জিপিএ যুক্ত করা হয়নি। জিপিএ যুক্ত করলে এবং মক টেস্ট দিলে রিয়েল-টাইম সম্ভাবনা স্বয়ংক্রিয়ভাবে গণনা হবে।
              </span>
            </div>
          )}

          {/* Chance percentage cards (Real & Group-Tailored) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
            {radarCards.map((c, idx) => (
              <div key={idx} style={{ background: 'var(--bg-surface, #ffffff)', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '0.9rem' }}>{c.univ}</strong>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: c.color, background: `${c.color}15`, padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      {c.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, color: c.color }}>{c.chance}%</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>সম্ভাবনা</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--gray-200)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                    <div style={{ width: `${c.chance}%`, height: '100%', background: c.color, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--gray-600)', lineHeight: 1.4 }}>
                  💡 {c.tip}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Admissions list grid */}
        <div className="admission-grid">
          {sortedAdmissionsList.map((univ) => {
            const isSelectedTarget = univ.id === initialSelectedUnivId;
            
            // In 'all' mode: show all units.
            // In 'auto' mode: prioritize student's group, but if none match, still show units so universities are NEVER hidden
            const units = Array.isArray(univ.units) ? univ.units : [];
            const groupMatchedUnits = units.filter(unit => 
              !unit.group || unit.group === 'All' || !studentGroup || unit.group.toLowerCase() === studentGroup.toLowerCase()
            );
            const filteredUnits = selectedGroupFilter === 'auto' && groupMatchedUnits.length > 0
              ? groupMatchedUnits
              : units;

            return (
              <div
                key={univ.id}
                id={`univ-card-${univ.id}`}
                className="admission-card"
                style={{
                  padding: '2rem',
                  cursor: 'default',
                  border: isSelectedTarget ? '2px solid var(--primary-teal, #319795)' : undefined,
                  boxShadow: isSelectedTarget ? '0 10px 25px -5px rgba(49, 151, 149, 0.25), 0 8px 10px -6px rgba(49, 151, 149, 0.2)' : undefined,
                  transition: 'all 0.3s ease'
                }}
              >
                
                {/* Top Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                  <div className="univ-info">
                    <div className="univ-icon" style={{ width: '60px', height: '60px', fontSize: '2.5rem' }}>
                      {univ.logo}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{univ.name}</h3>
                        {isSelectedTarget && (
                          <span style={{
                            backgroundColor: '#e6fffa',
                            color: '#234e52',
                            border: '1px solid #319795',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px'
                          }}>
                            🎯 Selected from Dashboard
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)', display: 'block', marginTop: '0.15rem' }}>
                        📅 Exam Date: <strong>{univ.examDate}</strong> | Application Fee: <strong>৳ {univ.applicationFee}</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--gray-500)', display: 'block', marginBottom: '0.25rem' }}>
                      Time Remaining to Apply
                    </span>
                    <CountdownTimer deadline={univ.deadline} />
                  </div>
                </div>

                <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                  {univ.description}
                </p>

                {/* Units Breakdown list */}
                <h4 style={{ color: 'var(--primary-teal)', fontSize: '1.15rem', marginBottom: '1rem', borderBottom: '1px solid var(--gray-100)', paddingBottom: '0.25rem' }}>
                  Admission Units & Eligibility Matrix
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {filteredUnits.map((unit, index) => {
                    const check = checkEligibility(unit);
                    
                    return (
                      <div 
                        key={index} 
                        className={`detail-unit-card ${!check.eligible ? 'ineligible' : ''}`}
                        style={{ borderLeft: `4px solid ${check.eligible ? 'var(--primary-teal)' : '#e53e3e'}` }}
                      >
                        <div className="detail-unit-header">
                          <div>
                            <h5 style={{ fontSize: '1.1rem', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                              {unit.name} 
                              <span className="badge" style={{ backgroundColor: 'var(--bg-light)', border: '1px solid var(--gray-300)', color: 'var(--gray-600)', fontSize: '0.65rem', textTransform: 'none' }}>
                                Group: {unit.group}
                              </span>
                            </h5>
                          </div>
                          
                          <div>
                            {check.eligible ? (
                              <span className="eligibility-badge eligibility-eligible">✓ Eligible</span>
                            ) : (
                              <span className="eligibility-badge eligibility-ineligible">✕ Ineligible</span>
                            )}
                          </div>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', margin: '0.5rem 0' }}>
                          <strong>Testing Subjects:</strong> {unit.subjects}
                        </p>
                        
                        <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)', margin: 0 }}>
                          {unit.details}
                        </p>

                        {!check.eligible && (
                          <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: '#fff5f5', borderRadius: '4px', border: '1px solid #fed7d7', fontSize: '0.85rem', color: '#c53030', fontWeight: '500' }}>
                            ⚠️ Reason: {check.reason}
                          </div>
                        )}

                        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)', alignSelf: 'center' }}>
                            Min GPA req: {unit.minGpa.toFixed(1)} (Ind. {unit.minIndividualGpa.toFixed(1)})
                          </span>
                          <button 
                            className={`btn ${check.eligible ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ padding: '0.35rem 1rem', fontSize: '0.8rem', height: '32px' }}
                            onClick={() => handleApply(univ.name, unit.name, check.eligible)}
                            disabled={!check.eligible}
                          >
                            Apply Online
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}

          {admissionsList.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'var(--gray-500)', background: 'var(--white)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--gray-200)', gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🏛️</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-charcoal)' }}>No university admission circulars published yet</h3>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Universities and admission units published from the Admin Portal will appear here.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
