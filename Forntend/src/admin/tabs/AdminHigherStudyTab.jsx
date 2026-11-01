import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';

export default function AdminHigherStudyTab() {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const initialForm = {
    name: '',
    country: '',
    countryCode: 'USA',
    flag: '🏛️',
    city: '',
    qsRank: 100,
    degreeLevels: 'Masters, PhD',
    minCgpa: 3.25,
    minIelts: 6.5,
    minGre: 310,
    tuitionPerYear: '$25,000 / Year',
    scholarship: 'Full Tuition Waiver & Teaching Assistantship (TA/RA)',
    acceptanceRate: '15%',
    popularPrograms: 'Computer Science, Data Science, AI, Mechanical Engineering',
    applyDeadline: 'December 15',
    portalUrl: 'https://'
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchUniversities = () => {
    setLoading(true);
    api.get('/higher-study/universities')
      .then(res => {
        setUniversities(res.data?.data || []);
      })
      .catch(err => {
        console.error('Error fetching foreign universities:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUniversities();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(initialForm);
    setIsModalOpen(true);
    setFeedback({ type: '', text: '' });
  };

  const handleOpenEdit = (univ) => {
    setEditingId(univ.id);
    setFormData({
      name: univ.name || '',
      country: univ.country || '',
      countryCode: univ.countryCode || '',
      flag: univ.flag || '🏛️',
      city: univ.city || '',
      qsRank: univ.qsRank || 100,
      degreeLevels: Array.isArray(univ.degreeLevels) ? univ.degreeLevels.join(', ') : (univ.degreeLevels || ''),
      minCgpa: univ.minCgpa || 3.0,
      minIelts: univ.minIelts || 6.5,
      minGre: univ.minGre || 300,
      tuitionPerYear: univ.tuitionPerYear || '',
      scholarship: univ.scholarship || '',
      acceptanceRate: univ.acceptanceRate || '',
      popularPrograms: Array.isArray(univ.popularPrograms) ? univ.popularPrograms.join(', ') : (univ.popularPrograms || ''),
      applyDeadline: univ.applyDeadline || '',
      portalUrl: univ.portalUrl || ''
    });
    setIsModalOpen(true);
    setFeedback({ type: '', text: '' });
  };

  const handleDelete = (id, name) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে "${name}"-কে বিদেশি বিশ্ববিদ্যালয়ের তালিকা থেকে মুছে ফেলতে চান?`)) return;

    api.delete(`/higher-study/universities/${id}`)
      .then(() => {
        setFeedback({ type: 'success', text: 'বিশ্ববিদ্যালয়টি সফলভাবে মুছে ফেলা হয়েছে।' });
        fetchUniversities();
      })
      .catch(err => {
        setFeedback({ type: 'error', text: 'মুছতে ব্যর্থ হয়েছে: ' + (err.response?.data?.message || err.message) });
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.country || !formData.portalUrl) {
      setFeedback({ type: 'error', text: 'বিশ্ববিদ্যালয়ের নাম, দেশ ও আবেদন লিংক পূরণ করুন।' });
      return;
    }

    const payload = {
      ...formData,
      id: editingId || undefined
    };

    api.post('/higher-study/universities', payload)
      .then(res => {
        setFeedback({ type: 'success', text: res.data?.message || 'সফলভাবে সংরক্ষিত হয়েছে!' });
        setIsModalOpen(false);
        fetchUniversities();
      })
      .catch(err => {
        setFeedback({ type: 'error', text: 'সংরক্ষণ ব্যর্থ হয়েছে: ' + (err.response?.data?.message || err.message) });
      });
  };

  const countries = useMemo(() => {
    const list = Array.from(new Set(universities.map(u => u.country).filter(Boolean)));
    return ['All', ...list];
  }, [universities]);

  const filteredUniversities = useMemo(() => {
    return universities.filter(u => {
      const matchCountry = selectedCountry === 'All' || u.country === selectedCountry;
      const matchSearch = !search.trim() || 
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.country.toLowerCase().includes(search.toLowerCase()) ||
        (u.popularPrograms || []).some(p => p.toLowerCase().includes(search.toLowerCase()));
      return matchCountry && matchSearch;
    });
  }, [universities, selectedCountry, search]);

  // KPIs
  const totalUnivs = universities.length;
  const uniqueCountriesCount = new Set(universities.map(u => u.country)).size;
  const tuitionFreeCount = universities.filter(u => 
    (u.tuitionPerYear && u.tuitionPerYear.toLowerCase().includes('free')) ||
    (u.scholarship && u.scholarship.toLowerCase().includes('100%'))
  ).length;
  const avgQs = totalUnivs > 0 
    ? Math.round(universities.reduce((acc, u) => acc + (Number(u.qsRank) || 200), 0) / totalUnivs) 
    : 0;

  return (
    <div className="admin-tab-pane">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
            🌍 Foreign Universities & Study Abroad Manager
          </h2>
          <p style={{ margin: '0.3rem 0 0 0', color: 'var(--gray-600)', fontSize: '0.9rem' }}>
            বিদেশের বিশ্ববিদ্যালয় ক্যাটালগ, ফুল ফান্ডেড স্কলারশিপ, আইইএলটিএস ও সিজিপিএ রিকোয়ারমেন্টস ম্যানেজমেন্ট
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
          }}
        >
          <span>➕</span>
          <span>নতুন বিশ্ববিদ্যালয় যুক্ত করুন</span>
        </button>
      </div>

      {feedback.text && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          marginBottom: '1.25rem',
          background: feedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
          color: feedback.type === 'error' ? '#ef4444' : '#22c55e',
          border: `1px solid ${feedback.type === 'error' ? '#ef4444' : '#22c55e'}`,
          fontSize: '0.9rem',
          fontWeight: 600
        }}>
          {feedback.text}
        </div>
      )}

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="admin-stat-card" style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--card-bg, #1e293b)', border: '1px solid var(--border-color, #334155)' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>মোট তালিকাভুক্ত বিশ্ববিদ্যালয়</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.3rem', color: '#f8fafc' }}>
            {totalUnivs}
          </div>
        </div>

        <div className="admin-stat-card" style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--card-bg, #1e293b)', border: '1px solid var(--border-color, #334155)' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>দেশসমূহ (Countries)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.3rem', color: '#38bdf8' }}>
            {uniqueCountriesCount} টি দেশ
          </div>
        </div>

        <div className="admin-stat-card" style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--card-bg, #1e293b)', border: '1px solid var(--border-color, #334155)' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>টিউশন ফ্রি / ফুল ফান্ডেড অফার</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.3rem', color: '#4ade80' }}>
            {tuitionFreeCount} টি বিশ্ববিদ্যালয়
          </div>
        </div>

        <div className="admin-stat-card" style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--card-bg, #1e293b)', border: '1px solid var(--border-color, #334155)' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>গড় QS World Rank</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.3rem', color: '#facc15' }}>
            Top {avgQs}
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="বিশ্ববিদ্যালয়ের নাম বা বিষয় দিয়ে খুঁজুন..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: '1',
            minWidth: '240px',
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            border: '1px solid #334155',
            background: 'var(--card-bg, #1e293b)',
            color: '#f8fafc',
            fontSize: '0.9rem'
          }}
        />

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {countries.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCountry(c)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: selectedCountry === c ? '1px solid #0284c7' : '1px solid #334155',
                background: selectedCountry === c ? 'rgba(2, 132, 199, 0.2)' : 'var(--card-bg, #1e293b)',
                color: selectedCountry === c ? '#38bdf8' : '#94a3b8',
                fontWeight: selectedCountry === c ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              {c === 'All' ? 'সব দেশ' : c}
            </button>
          ))}
        </div>
      </div>

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div style={{
          background: 'var(--card-bg, #1e293b)',
          border: '1px solid #0284c7',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#38bdf8' }}>
            {editingId ? '✏️ বিদেশি বিশ্ববিদ্যালয় সম্পাদনা করুন' : '✨ নতুন বিদেশি বিশ্ববিদ্যালয় যুক্ত করুন'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>
                  বিশ্ববিদ্যালয়ের নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: University of Oxford"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>
                  দেশ (Country) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: United Kingdom"
                  value={formData.country}
                  onChange={e => setFormData({ ...formData, country: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>
                  দেশের কোড ও পতাকা ইমোজি
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="কোড: GBR"
                    value={formData.countryCode}
                    onChange={e => setFormData({ ...formData, countryCode: e.target.value })}
                    style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                  />
                  <input
                    type="text"
                    placeholder="পতাকা: 🇬🇧"
                    value={formData.flag}
                    onChange={e => setFormData({ ...formData, flag: e.target.value })}
                    style={{ width: '80px', padding: '0.6rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff', textAlign: 'center' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>
                  শহর / প্রদেশ (City)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: Oxford, England"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>
                  QS World Rank *
                </label>
                <input
                  type="number"
                  required
                  placeholder="যেমন: 3"
                  value={formData.qsRank}
                  onChange={e => setFormData({ ...formData, qsRank: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>
                  ডিগ্রি লেভেল (কমা দিয়ে লিখুন)
                </label>
                <input
                  type="text"
                  placeholder="Bachelors, Masters, PhD"
                  value={formData.degreeLevels}
                  onChange={e => setFormData({ ...formData, degreeLevels: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>
                  ন্যূনতম CGPA রিকোয়ারমেন্ট
                </label>
                <input
                  type="number"
                  step="0.05"
                  placeholder="যেমন: 3.50"
                  value={formData.minCgpa}
                  onChange={e => setFormData({ ...formData, minCgpa: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>
                  ন্যূনতম IELTS রিকোয়ারমেন্ট
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="যেমন: 7.0"
                  value={formData.minIelts}
                  onChange={e => setFormData({ ...formData, minIelts: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>
                  বাৎসরিক টিউশন ফি (Tuition Per Year)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: £28,000 অথবা €0 (Tuition Free)"
                  value={formData.tuitionPerYear}
                  onChange={e => setFormData({ ...formData, tuitionPerYear: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>
                  স্কলারশিপের বিবরণ (Scholarships)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: Clarendon Fund & Rhodes Scholarship (100% Free)"
                  value={formData.scholarship}
                  onChange={e => setFormData({ ...formData, scholarship: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>
                  জনপ্রিয় প্রোগ্রামসমূহ (Popular Majors)
                </label>
                <input
                  type="text"
                  placeholder="Computer Science, Law, Medicine, Economics"
                  value={formData.popularPrograms}
                  onChange={e => setFormData({ ...formData, popularPrograms: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>
                  আবেদন ডেডলাইন (Application Deadline)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: January 15 (Fall Intake)"
                  value={formData.applyDeadline}
                  onChange={e => setFormData({ ...formData, applyDeadline: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>
                  অফিসিয়াল ভর্তি ওয়েবসাইট পোর্টাল (URL) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.ox.ac.uk/admissions"
                  value={formData.portalUrl}
                  onChange={e => setFormData({ ...formData, portalUrl: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', border: '1px solid #64748b', background: 'transparent', color: '#cbd5e1', cursor: 'pointer' }}
              >
                বাতিল
              </button>
              <button
                type="submit"
                style={{ padding: '0.6rem 1.5rem', borderRadius: '6px', border: 'none', background: '#0284c7', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {editingId ? 'আপডেট করুন' : 'যোগ করুন'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Universities Table */}
      <div style={{ background: 'var(--card-bg, #1e293b)', borderRadius: '12px', border: '1px solid var(--border-color, #334155)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', background: 'rgba(255, 255, 255, 0.02)' }}>
              <th style={{ padding: '0.9rem 1rem', color: '#94a3b8' }}>বিশ্ববিদ্যালয় ও দেশ</th>
              <th style={{ padding: '0.9rem 1rem', color: '#94a3b8' }}>QS Rank</th>
              <th style={{ padding: '0.9rem 1rem', color: '#94a3b8' }}>রিকোয়ারমেন্টস (Min)</th>
              <th style={{ padding: '0.9rem 1rem', color: '#94a3b8' }}>টিউশন ও স্কলারশিপ</th>
              <th style={{ padding: '0.9rem 1rem', color: '#94a3b8' }}>ডেডলাইন</th>
              <th style={{ padding: '0.9rem 1rem', color: '#94a3b8', textAlign: 'right' }}>অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  বিদেশি বিশ্ববিদ্যালয়ের তালিকা লোড হচ্ছে...
                </td>
              </tr>
            ) : filteredUniversities.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  কোনো বিশ্ববিদ্যালয় পাওয়া যায়নি।
                </td>
              </tr>
            ) : (
              filteredUniversities.map(univ => (
                <tr key={univ.id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1.4rem' }}>{univ.flag || '🏛️'}</span>
                      <div>
                        <div style={{ fontWeight: 700, color: '#f8fafc' }}>{univ.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          {univ.city ? `${univ.city}, ` : ''}{univ.country} ({univ.countryCode})
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      background: 'rgba(234, 179, 8, 0.15)',
                      color: '#facc15',
                      fontWeight: 800,
                      fontSize: '0.8rem'
                    }}>
                      #{univ.qsRank}
                    </span>
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <div style={{ color: '#e2e8f0', fontSize: '0.82rem' }}>
                      CGPA: <strong style={{ color: '#38bdf8' }}>{univ.minCgpa}</strong> | IELTS: <strong style={{ color: '#38bdf8' }}>{univ.minIelts}</strong>
                    </div>
                    {univ.degreeLevels && (
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                        {Array.isArray(univ.degreeLevels) ? univ.degreeLevels.join(', ') : univ.degreeLevels}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <div style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 600 }}>
                      {univ.tuitionPerYear}
                    </div>
                    {univ.scholarship && (
                      <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '0.15rem' }}>
                        🎁 {univ.scholarship}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.9rem 1rem', color: '#cbd5e1', fontSize: '0.82rem' }}>
                    {univ.applyDeadline}
                  </td>
                  <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <a
                        href={univ.portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '0.35rem 0.6rem',
                          borderRadius: '6px',
                          background: 'rgba(56, 189, 248, 0.1)',
                          color: '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          textDecoration: 'none',
                          fontSize: '0.8rem'
                        }}
                        title="পোর্টাল লিংক দেখুন"
                      >
                        ↗
                      </a>
                      <button
                        onClick={() => handleOpenEdit(univ)}
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          background: 'rgba(2, 132, 199, 0.15)',
                          color: '#38bdf8',
                          border: '1px solid rgba(2, 132, 199, 0.3)',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(univ.id, univ.name)}
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
