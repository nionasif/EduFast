import { useState, useEffect, useMemo } from 'react';
import { getAdmissions } from '../../data/mockData';

// Comprehensive authentic benchmark admission eligibility criteria for top Bangladesh universities
const BENCHMARK_ADMISSIONS = [
  {
    id: 'bench-buet',
    name: 'বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয় (BUET)',
    shortName: 'BUET',
    logo: '🏛️',
    applicationFee: 1300,
    examDate: 'February 2025',
    units: [
      {
        name: 'প্রকৌশল ও স্থাপত্য বিভাগ (Ka & Kha Unit)',
        group: 'Science',
        minGpa: 10.0,
        minIndividualGpa: 5.0,
        subjects: 'পদার্থ, রসায়ন, উচ্চতর গণিত ও ইংরেজি'
      }
    ]
  },
  {
    id: 'bench-du',
    name: 'ঢাকা বিশ্ববিদ্যালয় (Dhaka University)',
    shortName: 'DU',
    logo: '🎓',
    applicationFee: 1050,
    examDate: 'March 2025',
    units: [
      {
        name: 'বিজ্ঞান অনুষদ (Ka Unit)',
        group: 'Science',
        minGpa: 8.5,
        minIndividualGpa: 3.5,
        subjects: 'পদার্থ, রসায়ন, গণিত/জীববিজ্ঞান'
      },
      {
        name: 'কলা, আইন ও সামাজিক বিজ্ঞান অনুষদ (Kha Unit)',
        group: 'Arts',
        minGpa: 8.0,
        minIndividualGpa: 3.0,
        subjects: 'বাংলা, ইংরেজি, সাধারণ জ্ঞান'
      },
      {
        name: 'ব্যবসায় শিক্ষা অনুষদ (Ga Unit)',
        group: 'Commerce',
        minGpa: 8.0,
        minIndividualGpa: 3.0,
        subjects: 'হিসাববিজ্ঞান, ব্যবসায় সংগঠন ও ইংরেজি'
      },
      {
        name: 'চারুকলা অনুষদ (Cha Unit - Science)',
        group: 'Science',
        minGpa: 7.0,
        minIndividualGpa: 3.0,
        subjects: 'সাধারণ জ্ঞান ও অঙ্কন'
      },
      {
        name: 'চারুকলা অনুষদ (Cha Unit - Arts)',
        group: 'Arts',
        minGpa: 7.0,
        minIndividualGpa: 3.0,
        subjects: 'সাধারণ জ্ঞান ও অঙ্কন'
      },
      {
        name: 'চারুকলা অনুষদ (Cha Unit - Commerce)',
        group: 'Commerce',
        minGpa: 7.0,
        minIndividualGpa: 3.0,
        subjects: 'সাধারণ জ্ঞান ও অঙ্কন'
      }
    ]
  },
  {
    id: 'bench-medical',
    name: 'সরকারি মেডিকেল কলেজসমূহ (DGHS MBBS)',
    shortName: 'Medical (MBBS)',
    logo: '🏥',
    applicationFee: 1000,
    examDate: 'January 2025',
    units: [
      {
        name: 'এমবিবিএস ও বিডিএস কোর্স (MBBS/BDS)',
        group: 'Science',
        minGpa: 9.0,
        minIndividualGpa: 4.0,
        subjects: 'জীববিজ্ঞান (মিনিমাম ৪.০০), রসায়ন, পদার্থ ও ইংরেজি'
      }
    ]
  },
  {
    id: 'bench-ckruet',
    name: 'প্রকৌশল গুচ্ছ (CKRUET: RUET, KUET, CUET)',
    shortName: 'Engineering Cluster',
    logo: '⚙️',
    applicationFee: 1200,
    examDate: 'March 2025',
    units: [
      {
        name: 'ইঞ্জিনিয়ারিং ও স্থাপত্য অনুষদ (Ka & Kha)',
        group: 'Science',
        minGpa: 9.5,
        minIndividualGpa: 4.5,
        subjects: 'পদার্থ, রসায়ন, গণিত ও ইংরেজি'
      }
    ]
  },
  {
    id: 'bench-ju',
    name: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয় (JU)',
    shortName: 'JU',
    logo: '🌿',
    applicationFee: 1100,
    examDate: 'February 2025',
    units: [
      {
        name: 'গাণিতিক ও পদার্থ বিষয়ক অনুষদ (A Unit)',
        group: 'Science',
        minGpa: 8.5,
        minIndividualGpa: 4.0,
        subjects: 'গণিত, পদার্থ, রসায়ন'
      },
      {
        name: 'জীববিজ্ঞান অনুষদ (D Unit)',
        group: 'Science',
        minGpa: 9.0,
        minIndividualGpa: 4.0,
        subjects: 'জীববিজ্ঞান, রসায়ন, বাংলা, ইংরেজি'
      },
      {
        name: 'সমাজবিজ্ঞান অনুষদ (B Unit)',
        group: 'Arts',
        minGpa: 8.0,
        minIndividualGpa: 3.5,
        subjects: 'বাংলা, ইংরেজি, সাধারণ জ্ঞান'
      },
      {
        name: 'কলা ও মানবিক অনুষদ (C Unit)',
        group: 'Arts',
        minGpa: 8.0,
        minIndividualGpa: 3.5,
        subjects: 'বাংলা, ইংরেজি, সাধারণ জ্ঞান'
      },
      {
        name: 'বিজনেস স্টাডিজ অনুষদ (E Unit)',
        group: 'Commerce',
        minGpa: 8.0,
        minIndividualGpa: 3.5,
        subjects: 'হিসাববিজ্ঞান, ব্যবসায় শিক্ষা ও ইংরেজি'
      }
    ]
  },
  {
    id: 'bench-gst',
    name: 'জিএসটি গুচ্ছ - ২৪টি সাধারণ ও প্রযুক্তি বিশ্ববিদ্যালয়',
    shortName: 'GST Cluster (24 Varsities)',
    logo: '🏛️',
    applicationFee: 1500,
    examDate: 'April 2025',
    units: [
      {
        name: 'এ ইউনিট (বিজ্ঞান অনুষদ)',
        group: 'Science',
        minGpa: 8.0,
        minIndividualGpa: 3.5,
        subjects: 'পদার্থ, রসায়ন, গণিত/জীববিজ্ঞান'
      },
      {
        name: 'বি ইউনিট (মানবিক অনুষদ)',
        group: 'Arts',
        minGpa: 7.0,
        minIndividualGpa: 3.0,
        subjects: 'বাংলা, ইংরেজি, সাধারণ জ্ঞান'
      },
      {
        name: 'সি ইউনিট (ব্যবসায় শিক্ষা অনুষদ)',
        group: 'Commerce',
        minGpa: 7.5,
        minIndividualGpa: 3.0,
        subjects: 'হিসাববিজ্ঞান, ব্যবসায় নীতি ও ইংরেজি'
      }
    ]
  },
  {
    id: 'bench-agri',
    name: 'কৃষি গুচ্ছ - ৯টি কৃষি বিশ্ববিদ্যালয় (Agri Cluster)',
    shortName: 'Agri Cluster',
    logo: '🌾',
    applicationFee: 1200,
    examDate: 'March 2025',
    units: [
      {
        name: 'কৃষিবিজ্ঞান, পশুপালন ও ডিভিএম অনুষদ',
        group: 'Science',
        minGpa: 8.5,
        minIndividualGpa: 4.0,
        subjects: 'জীববিজ্ঞান, রসায়ন, পদার্থ, গণিত ও ইংরেজি'
      }
    ]
  },
  {
    id: 'bench-ru',
    name: 'রাজশাহী বিশ্ববিদ্যালয় (Rajshahi University)',
    shortName: 'RU',
    logo: '🦅',
    applicationFee: 1100,
    examDate: 'March 2025',
    units: [
      {
        name: 'সি ইউনিট (বিজ্ঞান অনুষদ)',
        group: 'Science',
        minGpa: 8.5,
        minIndividualGpa: 3.5,
        subjects: 'পদার্থ, রসায়ন, গণিত/জীববিজ্ঞান'
      },
      {
        name: 'এ ইউনিট (মানবিক ও আইন)',
        group: 'Arts',
        minGpa: 7.5,
        minIndividualGpa: 3.0,
        subjects: 'বাংলা, ইংরেজি, সাধারণ জ্ঞান'
      },
      {
        name: 'বি ইউনিট (ব্যবসায় শিক্ষা)',
        group: 'Commerce',
        minGpa: 8.0,
        minIndividualGpa: 3.5,
        subjects: 'হিসাববিজ্ঞান, ব্যবসায় শিক্ষা ও ইংরেজি'
      }
    ]
  },
  {
    id: 'bench-cu',
    name: 'চট্টগ্রাম বিশ্ববিদ্যালয় (Chittagong University)',
    shortName: 'CU',
    logo: '🚢',
    applicationFee: 1000,
    examDate: 'March 2025',
    units: [
      {
        name: 'এ ইউনিট (বিজ্ঞান অনুষদ)',
        group: 'Science',
        minGpa: 8.25,
        minIndividualGpa: 3.5,
        subjects: 'পদার্থ, রসায়ন, গণিত/জীববিজ্ঞান'
      },
      {
        name: 'বি ইউনিট (কলা ও মানববিদ্যা)',
        group: 'Arts',
        minGpa: 7.5,
        minIndividualGpa: 3.0,
        subjects: 'বাংলা, ইংরেজি, সাধারণ জ্ঞান'
      },
      {
        name: 'সি ইউনিট (ব্যবসায় প্রশাসন অনুষদ)',
        group: 'Commerce',
        minGpa: 8.0,
        minIndividualGpa: 3.5,
        subjects: 'হিসাববিজ্ঞান, ইংরেজি ও ব্যবসায়'
      },
      {
        name: 'ডি ইউনিট (সম্মিলিত ইউনিট - বিজ্ঞান)',
        group: 'Science',
        minGpa: 8.0,
        minIndividualGpa: 3.5,
        subjects: 'বাংলা, ইংরেজি, বিশ্লেষণমূলক দক্ষতা'
      },
      {
        name: 'ডি ইউনিট (সম্মিলিত ইউনিট - মানবিক)',
        group: 'Arts',
        minGpa: 7.5,
        minIndividualGpa: 3.5,
        subjects: 'বাংলা, ইংরেজি, বিশ্লেষণমূলক দক্ষতা'
      },
      {
        name: 'ডি ইউনিট (সম্মিলিত ইউনিট - বাণিজ্য)',
        group: 'Commerce',
        minGpa: 7.5,
        minIndividualGpa: 3.5,
        subjects: 'বাংলা, ইংরেজি, বিশ্লেষণমূলক দক্ষতা'
      }
    ]
  },
  {
    id: 'bench-bup',
    name: 'বাংলাদেশ ইউনিভার্সিটি অব প্রফেশনালস (BUP)',
    shortName: 'BUP',
    logo: '🛡️',
    applicationFee: 1000,
    examDate: 'January 2025',
    units: [
      {
        name: 'বিজ্ঞান ও প্রযুক্তি অনুষদ (FST)',
        group: 'Science',
        minGpa: 9.0,
        minIndividualGpa: 4.5,
        subjects: 'গণিত, পদার্থ, রসায়ন ও ইংরেজি'
      },
      {
        name: 'ব্যবসায় শিক্ষা অনুষদ (FBS)',
        group: 'Commerce',
        minGpa: 8.5,
        minIndividualGpa: 4.0,
        subjects: 'হিসাববিজ্ঞান, ইংরেজি ও সাধারণ জ্ঞান'
      },
      {
        name: 'কলা ও সমাজবিজ্ঞান অনুষদ (FASS/FSSS)',
        group: 'Arts',
        minGpa: 8.0,
        minIndividualGpa: 3.5,
        subjects: 'ইংরেজি, বাংলা ও সাধারণ জ্ঞান'
      }
    ]
  }
];

export default function GPACalculator() {
  const [dynamicAdmissions, setDynamicAdmissions] = useState(getAdmissions);
  
  // Direct Input Box Values (strings for fluid typing)
  const [sscInput, setSscInput] = useState('5.00');
  const [hscInput, setHscInput] = useState('5.00');

  // Academic Group
  const [group, setGroup] = useState('Science'); // 'Science', 'Commerce', 'Arts'

  // Filter mode: 'eligible' (আবেদনযোগ্য) vs 'all' (সকল ভার্সিটি)
  const [viewFilter, setViewFilter] = useState('eligible');

  // Listen for dynamic updates from Admin portal
  useEffect(() => {
    const handleUpdate = () => {
      setDynamicAdmissions(getAdmissions());
    };
    window.addEventListener('edufast-data-update', handleUpdate);
    return () => window.removeEventListener('edufast-data-update', handleUpdate);
  }, []);

  // Parse numerical GPA values with safe clamping
  const sscGpa = useMemo(() => {
    const val = parseFloat(sscInput);
    if (isNaN(val)) return 0;
    return Math.min(Math.max(val, 0), 5.0);
  }, [sscInput]);

  const hscGpa = useMemo(() => {
    const val = parseFloat(hscInput);
    if (isNaN(val)) return 0;
    return Math.min(Math.max(val, 0), 5.0);
  }, [hscInput]);

  const combinedGpa = sscGpa + hscGpa;

  // Merge dynamic admin admissions with authentic benchmark universities
  const allAdmissions = useMemo(() => {
    const list = [...BENCHMARK_ADMISSIONS];
    if (dynamicAdmissions && dynamicAdmissions.length > 0) {
      dynamicAdmissions.forEach(dynamicUniv => {
        if (!list.some(u => u.name.toLowerCase() === dynamicUniv.name.toLowerCase())) {
          list.push(dynamicUniv);
        }
      });
    }
    return list;
  }, [dynamicAdmissions]);

  // Evaluate matching units for the selected group
  const evaluationResults = useMemo(() => {
    const eligibleList = [];
    const ineligibleList = [];
    let totalGroupUnits = 0;

    allAdmissions.forEach(univ => {
      if (!univ.units || !Array.isArray(univ.units)) return;
      
      univ.units.forEach(unit => {
        if (unit.group !== group) return;
        totalGroupUnits++;

        const isCombinedOk = combinedGpa >= (unit.minGpa || 0);
        const isIndividualOk = sscGpa >= (unit.minIndividualGpa || 0) && hscGpa >= (unit.minIndividualGpa || 0);
        const isEligible = isCombinedOk && isIndividualOk;

        let missingReason = '';
        if (!isCombinedOk) {
          missingReason = `ন্যূনতম মোট জিপিএ ${(unit.minGpa || 0).toFixed(2)} প্রয়োজন (আপনার ${combinedGpa.toFixed(2)})`;
        } else if (!isIndividualOk) {
          missingReason = `এসএসসি ও এইচএসসি প্রতিটিতে ন্যূনতম ${(unit.minIndividualGpa || 0).toFixed(2)} প্রয়োজন`;
        }

        const item = {
          univId: univ.id,
          univName: univ.name,
          shortName: univ.shortName || univ.name,
          univLogo: univ.logo || '🏛️',
          applicationFee: univ.applicationFee,
          examDate: univ.examDate,
          unitName: unit.name,
          minGpa: unit.minGpa || 0,
          minIndividualGpa: unit.minIndividualGpa || 0,
          subjects: unit.subjects || 'সাধারণ ভর্তি পরীক্ষা',
          isEligible,
          missingReason
        };

        if (isEligible) {
          eligibleList.push(item);
        } else {
          ineligibleList.push(item);
        }
      });
    });

    return {
      eligible: eligibleList,
      ineligible: ineligibleList,
      totalGroupUnits,
      matchPercentage: totalGroupUnits > 0 ? Math.round((eligibleList.length / totalGroupUnits) * 100) : 0
    };
  }, [allAdmissions, group, sscGpa, hscGpa, combinedGpa]);

  // Helper for quick presets
  const handleSetPreset = (ssc, hsc) => {
    setSscInput(ssc.toFixed(2));
    setHscInput(hsc.toFixed(2));
  };

  const displayedList = viewFilter === 'eligible' 
    ? evaluationResults.eligible 
    : [...evaluationResults.eligible, ...evaluationResults.ineligible];

  return (
    <div style={{
      background: 'var(--white, #ffffff)',
      border: '1px solid var(--gray-200, #e2e8f0)',
      borderRadius: '24px',
      padding: '2.25rem 2rem',
      boxShadow: '0 20px 40px -10px rgba(49, 151, 149, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      textAlign: 'left',
      fontFamily: 'var(--font-sans)'
    }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(49, 151, 149, 0.12)', color: 'var(--primary-teal, #0d9488)', padding: '4px 12px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <span>⚡ রিয়েলটাইম ম্যাচিং ইঞ্জিন</span>
          </div>
          <h2 style={{ color: 'var(--text-charcoal, #1e293b)', fontSize: '1.75rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>📊</span> Admission Match Calculator
          </h2>
          <p style={{ color: 'var(--gray-600, #4a5568)', fontSize: '0.92rem', marginTop: '0.4rem', marginBottom: 0, maxWidth: '640px' }}>
            নিচের বক্সে আপনার <strong>এসএসসি</strong> ও <strong>এইচএসসি জিপিএ</strong> লিখে দেখুন আপনার বর্তমান ফলাফল অনুযায়ী কোন কোন পাবলিক বিশ্ববিদ্যালয় ও ইউনিটে পরীক্ষা দেওয়ার যোগ্যতা রয়েছে।
          </p>
        </div>

        {/* Combined GPA Highlight Pill */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary-teal, #0d9488) 0%, #0f766e 100%)',
          color: '#ffffff',
          padding: '0.85rem 1.4rem',
          borderRadius: '16px',
          boxShadow: '0 10px 20px -5px rgba(13, 148, 136, 0.4)',
          textAlign: 'center',
          flexShrink: 0
        }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.9 }}>
            মোট জিপিএ (Combined)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1.1 }}>
            {combinedGpa.toFixed(2)}
            <span style={{ fontSize: '1rem', opacity: 0.8, fontWeight: 500 }}> / 10.00</span>
          </div>
        </div>
      </div>

      {/* Input Controls Grid */}
      <div style={{
        backgroundColor: 'var(--bg-light, #f8fafc)',
        border: '1px solid var(--gray-200, #e2e8f0)',
        borderRadius: '18px',
        padding: '1.5rem',
        marginBottom: '2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.5rem'
      }}>
        
        {/* 1. SSC GPA Input Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label htmlFor="ssc-gpa-input" style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-charcoal, #1e293b)' }}>
              📝 এসএসসি জিপিএ (SSC GPA)
            </label>
            <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>স্কেল: ৫.০০</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              id="ssc-gpa-input"
              type="number"
              step="0.01"
              min="1.00"
              max="5.00"
              value={sscInput}
              onChange={(e) => setSscInput(e.target.value)}
              placeholder="e.g. 5.00"
              style={{
                width: '100%',
                padding: '0.7rem 1rem',
                fontSize: '1.15rem',
                fontWeight: 800,
                color: 'var(--primary-teal, #0d9488)',
                backgroundColor: 'var(--white, #ffffff)',
                border: '2px solid var(--gray-300, #cbd5e1)',
                borderRadius: '12px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-teal, #0d9488)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--gray-300, #cbd5e1)'}
            />
          </div>

          {/* Range Slider for convenience */}
          <input
            type="range"
            min="2.0"
            max="5.0"
            step="0.05"
            value={sscGpa || 2.0}
            onChange={(e) => setSscInput(parseFloat(e.target.value).toFixed(2))}
            style={{
              accentColor: 'var(--primary-teal, #0d9488)',
              height: '6px',
              borderRadius: '3px',
              cursor: 'pointer',
              marginTop: '4px'
            }}
          />
        </div>

        {/* 2. HSC GPA Input Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label htmlFor="hsc-gpa-input" style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-charcoal, #1e293b)' }}>
              🎓 এইচএসসি জিপিএ (HSC GPA)
            </label>
            <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>স্কেল: ৫.০০</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              id="hsc-gpa-input"
              type="number"
              step="0.01"
              min="1.00"
              max="5.00"
              value={hscInput}
              onChange={(e) => setHscInput(e.target.value)}
              placeholder="e.g. 5.00"
              style={{
                width: '100%',
                padding: '0.7rem 1rem',
                fontSize: '1.15rem',
                fontWeight: 800,
                color: 'var(--primary-teal, #0d9488)',
                backgroundColor: 'var(--white, #ffffff)',
                border: '2px solid var(--gray-300, #cbd5e1)',
                borderRadius: '12px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-teal, #0d9488)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--gray-300, #cbd5e1)'}
            />
          </div>

          {/* Range Slider for convenience */}
          <input
            type="range"
            min="2.0"
            max="5.0"
            step="0.05"
            value={hscGpa || 2.0}
            onChange={(e) => setHscInput(parseFloat(e.target.value).toFixed(2))}
            style={{
              accentColor: 'var(--primary-teal, #0d9488)',
              height: '6px',
              borderRadius: '3px',
              cursor: 'pointer',
              marginTop: '4px'
            }}
          />
        </div>

        {/* 3. Academic Group Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-charcoal, #1e293b)' }}>
            🔬 শাখা / বিভাগ (Academic Group)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', height: '46px' }}>
            {[
              { id: 'Science', label: 'বিজ্ঞান', sub: 'Science' },
              { id: 'Commerce', label: 'বাণিজ্য', sub: 'Commerce' },
              { id: 'Arts', label: 'মানবিক', sub: 'Arts' }
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGroup(g.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.35rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  borderRadius: '10px',
                  border: group === g.id ? '2px solid var(--primary-teal, #0d9488)' : '1px solid var(--gray-300, #cbd5e1)',
                  backgroundColor: group === g.id ? 'var(--primary-teal, #0d9488)' : 'var(--white, #ffffff)',
                  color: group === g.id ? '#ffffff' : 'var(--text-charcoal, #1e293b)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <span>{g.label}</span>
                <span style={{ fontSize: '0.66rem', opacity: group === g.id ? 0.9 : 0.65 }}>{g.sub}</span>
              </button>
            ))}
          </div>

          {/* Quick Presets */}
          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
            {[
              { label: '৫.০০ + ৫.০০', ssc: 5.0, hsc: 5.0 },
              { label: '৪.৮০ + ৪.৮০', ssc: 4.8, hsc: 4.8 },
              { label: '৪.৫০ + ৪.৫০', ssc: 4.5, hsc: 4.5 },
              { label: '৪.০০ + ৪.০০', ssc: 4.0, hsc: 4.0 }
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSetPreset(p.ssc, p.hsc)}
                style={{
                  fontSize: '0.68rem',
                  padding: '3px 7px',
                  borderRadius: '6px',
                  border: '1px solid var(--gray-300, #cbd5e1)',
                  backgroundColor: 'var(--white, #ffffff)',
                  color: 'var(--gray-600, #4a5568)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Results Header & Summary Stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--gray-200, #e2e8f0)',
        marginBottom: '1.25rem'
      }}>
        
        {/* Status Message */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: evaluationResults.eligible.length > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: evaluationResults.eligible.length > 0 ? '#10b981' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.3rem',
            fontWeight: 800,
            flexShrink: 0
          }}>
            {evaluationResults.eligible.length > 0 ? '✓' : '!'}
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-charcoal, #1e293b)' }}>
              {evaluationResults.eligible.length > 0
                ? `অভিনন্দন! আপনি ${evaluationResults.eligible.length}টি ভার্সিটি ইউনিটে আবেদনযোগ্য`
                : 'বর্তমান জিপিএ অনুযায়ী কোনো ইউনিট শর্ত পূরণ হয়নি'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500, #64748b)' }}>
              মোট উপলভ্য ইউনিট: {evaluationResults.totalGroupUnits}টি • যোগ্যতা সাফল্যের হার: {evaluationResults.matchPercentage}%
            </div>
          </div>
        </div>

        {/* View Filter Switcher */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--bg-light, #f1f5f9)', padding: '4px', borderRadius: '12px' }}>
          <button
            type="button"
            onClick={() => setViewFilter('eligible')}
            style={{
              padding: '6px 14px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: viewFilter === 'eligible' ? 'var(--white, #ffffff)' : 'transparent',
              color: viewFilter === 'eligible' ? 'var(--primary-teal, #0d9488)' : 'var(--gray-600, #64748b)',
              boxShadow: viewFilter === 'eligible' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            ✅ আবেদনযোগ্য ({evaluationResults.eligible.length})
          </button>
          <button
            type="button"
            onClick={() => setViewFilter('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: viewFilter === 'all' ? 'var(--white, #ffffff)' : 'transparent',
              color: viewFilter === 'all' ? 'var(--primary-teal, #0d9488)' : 'var(--gray-600, #64748b)',
              boxShadow: viewFilter === 'all' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            📋 সবগুলো দেখুন ({evaluationResults.totalGroupUnits})
          </button>
        </div>

      </div>

      {/* University & Units Results Cards Grid */}
      {displayedList.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '2.5rem 1.5rem',
          backgroundColor: 'var(--bg-light, #f8fafc)',
          borderRadius: '16px',
          border: '1px dashed var(--gray-300, #cbd5e1)'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
          <h4 style={{ margin: '0 0 0.4rem 0', color: '#e53e3e', fontSize: '1.05rem', fontWeight: 800 }}>
            কোনো আবেদনযোগ্য ইউনিট পাওয়া যায়নি
          </h4>
          <p style={{ margin: 0, color: 'var(--gray-600, #4a5568)', fontSize: '0.85rem' }}>
            আপনার বর্তমান মোট জিপিএ ({combinedGpa.toFixed(2)}) সরকারি বিশ্ববিদ্যালয়ের সর্বনিম্ন শর্তের নিচে। জিপিএ বাড়িয়ে পুনরায় ট্রাই করুন বা উপরের "সবগুলো দেখুন" অপশনে ক্লিক করে শর্তসমূহ দেখুন।
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '1rem',
          maxHeight: '420px',
          overflowY: 'auto',
          paddingRight: '6px'
        }}>
          {displayedList.map((item, index) => (
            <div
              key={index}
              style={{
                backgroundColor: item.isEligible ? 'var(--white, #ffffff)' : 'rgba(239, 68, 68, 0.04)',
                border: item.isEligible ? '1px solid var(--gray-200, #e2e8f0)' : '1px dashed rgba(239, 68, 68, 0.3)',
                borderLeft: item.isEligible ? '4px solid #10b981' : '4px solid #ef4444',
                borderRadius: '14px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem',
                boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              <div>
                {/* University Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{item.univLogo}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-charcoal, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.univName}>
                      {item.univName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-500, #64748b)' }}>
                      {item.shortName} • {item.examDate}
                    </div>
                  </div>
                </div>

                {/* Unit Name */}
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--primary-teal, #0d9488)', marginBottom: '0.35rem' }}>
                  {item.unitName}
                </div>

                {/* Requirements */}
                <div style={{ fontSize: '0.74rem', color: 'var(--gray-600, #4a5568)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div>
                    <strong>ন্যূনতম জিপিএ:</strong> {item.minGpa.toFixed(2)} (এসএসসি/এইচএসসি প্রতিটি: {item.minIndividualGpa.toFixed(2)})
                  </div>
                  <div>
                    <strong>আবশ্যিক বিষয়:</strong> {item.subjects}
                  </div>
                </div>
              </div>

              {/* Status Badge Footer */}
              <div style={{
                borderTop: '1px solid var(--gray-200, #e2e8f0)',
                paddingTop: '0.6rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                {item.isEligible ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#059669',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    padding: '3px 9px',
                    borderRadius: '999px'
                  }}>
                    ✓ পরীক্ষা দিতে পারবেন (Eligible)
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#dc2626',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    padding: '3px 8px',
                    borderRadius: '999px'
                  }}>
                    ✕ {item.missingReason}
                  </span>
                )}

                {item.applicationFee && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)', fontWeight: 600 }}>
                    ফি: ৳{item.applicationFee}
                  </span>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
