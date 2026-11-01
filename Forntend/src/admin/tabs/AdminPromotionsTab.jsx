import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminPromotionsTab() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    institutionName: '',
    campaignTitle: '',
    tagline: '',
    badge: '🌟 Featured Partner (বিজ্ঞাপন)',
    logo: '🏛️',
    programs: '',
    waiverText: '',
    targetUrl: '',
    status: 'active'
  });
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const fetchPromotions = () => {
    setLoading(true);
    api.get('/promotions?all=true')
      .then(res => {
        setPromotions(res.data?.data || []);
      })
      .catch(err => {
        console.error('Error fetching promotions:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      institutionName: '',
      campaignTitle: '',
      tagline: '',
      badge: '🌟 Featured Partner (বিজ্ঞাপন)',
      logo: '🏛️',
      programs: 'CSE, BBA, Software Engineering',
      waiverText: 'জিপিএ অনুযায়ী ১০০% পর্যন্ত স্কলারশিপ',
      targetUrl: 'https://',
      status: 'active'
    });
    setFormOpen(true);
    setFeedback({ type: '', text: '' });
  };

  const handleOpenEdit = (ad) => {
    setEditingId(ad.id);
    setFormData({
      institutionName: ad.institutionName || '',
      campaignTitle: ad.campaignTitle || '',
      tagline: ad.tagline || '',
      badge: ad.badge || '⭐ Sponsored Listing',
      logo: ad.logo || '🏛️',
      programs: Array.isArray(ad.programs) ? ad.programs.join(', ') : (ad.programs || ''),
      waiverText: ad.waiverText || '',
      targetUrl: ad.targetUrl || '',
      status: ad.status || 'active'
    });
    setFormOpen(true);
    setFeedback({ type: '', text: '' });
  };

  const handleDelete = (id, name) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে "${name}"-এর স্পন্সর ক্যাম্পেইনটি মুছে ফেলতে চান?`)) return;

    api.delete(`/promotions/${id}`)
      .then(() => {
        setFeedback({ type: 'success', text: 'বিজ্ঞাপন ক্যাম্পেইনটি মুছে ফেলা হয়েছে।' });
        fetchPromotions();
      })
      .catch(err => {
        setFeedback({ type: 'error', text: 'মুছতে ব্যর্থ হয়েছে: ' + err.message });
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.institutionName || !formData.campaignTitle || !formData.targetUrl) {
      setFeedback({ type: 'error', text: 'প্রতিষ্ঠানের নাম, ক্যাম্পেইন টাইটেল এবং ওয়েবসাইট লিংক পূরণ করুন।' });
      return;
    }

    const payload = {
      ...formData,
      id: editingId || undefined
    };

    api.post('/promotions', payload)
      .then(res => {
        setFeedback({ type: 'success', text: res.data?.message || 'সফলভাবে সংরক্ষিত হয়েছে!' });
        setFormOpen(false);
        fetchPromotions();
      })
      .catch(err => {
        setFeedback({ type: 'error', text: 'সংরক্ষণ ব্যর্থ হয়েছে: ' + (err.response?.data?.message || err.message) });
      });
  };

  // Calculations
  const totalCampaigns = promotions.length;
  const activeCount = promotions.filter(p => p.status === 'active').length;
  const totalViews = promotions.reduce((acc, p) => acc + (p.viewsCount || 0), 0);
  const totalClicks = promotions.reduce((acc, p) => acc + (p.clicksCount || 0), 0);
  const avgCtr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0;

  return (
    <div className="admin-tab-pane">
      {/* Top Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
            📢 Sponsored University Ad Manager
          </h2>
          <p style={{ margin: '0.3rem 0 0 0', color: 'var(--gray-600)', fontSize: '0.9rem' }}>
            বিশ্ববিদ্যালয় ও ইনস্টিটিউট স্পনসরশিপ পরিচালনা, ইম্প্রেশন ও ক্লিক ট্র্যাকিং (Business Model)
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          style={{
            background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
            color: '#0f172a',
            border: 'none',
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3)'
          }}
        >
          <span>➕</span>
          <span>নতুন পার্টনার যুক্ত করুন</span>
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

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="admin-stat-card" style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--card-bg, #1e293b)', border: '1px solid var(--border-color, #334155)' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>মোট ক্যাম্পেইন</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.3rem', color: '#f8fafc' }}>
            {totalCampaigns} <span style={{ fontSize: '0.9rem', color: '#22c55e' }}>({activeCount} Active)</span>
          </div>
        </div>

        <div className="admin-stat-card" style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--card-bg, #1e293b)', border: '1px solid var(--border-color, #334155)' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>সর্বমোট প্রদর্শন (Impressions)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.3rem', color: '#38bdf8' }}>
            {totalViews.toLocaleString()}
          </div>
        </div>

        <div className="admin-stat-card" style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--card-bg, #1e293b)', border: '1px solid var(--border-color, #334155)' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>ওয়েবসাইট ট্র্যাকিং ক্লিক (Leads)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.3rem', color: '#facc15' }}>
            {totalClicks.toLocaleString()}
          </div>
        </div>

        <div className="admin-stat-card" style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--card-bg, #1e293b)', border: '1px solid var(--border-color, #334155)' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>গড় কনভার্সন রেট (CTR)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.3rem', color: '#4ade80' }}>
            {avgCtr}%
          </div>
        </div>
      </div>

      {/* Modal / Inline Form for Add/Edit */}
      {formOpen && (
        <div style={{
          background: 'var(--card-bg, #1e293b)',
          border: '1px solid #eab308',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#facc15' }}>
            {editingId ? '✏️ ক্যাম্পেইন সম্পাদনা করুন' : '✨ নতুন স্পনসর পার্টনার ক্যাম্পেইন যুক্ত করুন'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>
                  প্রতিষ্ঠানের নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: Daffodil Institute of IT (DIIT)"
                  value={formData.institutionName}
                  onChange={e => setFormData({ ...formData, institutionName: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>
                  ক্যাম্পেইন শিরোনাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: Admission Open 2025: B.Sc in CSE"
                  value={formData.campaignTitle}
                  onChange={e => setFormData({ ...formData, campaignTitle: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>
                  ক্যাম্পাস ট্যাগলাইন / লোকেশন
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ধানমন্ডি ক্যাম্পাস, ঢাকা"
                  value={formData.tagline}
                  onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>
                  অফিসিয়াল ভর্তি ওয়েবসাইট লিংক (URL) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://diit.edu.bd"
                  value={formData.targetUrl}
                  onChange={e => setFormData({ ...formData, targetUrl: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>
                  স্কলারশিপ / ফি ছাড়ের তথ্য (Waiver)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: এসএসসি ও এইচএসসি জিপিএ অনুযায়ী ১০০% পর্যন্ত ছাড়"
                  value={formData.waiverText}
                  onChange={e => setFormData({ ...formData, waiverText: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>
                  উপলব্ধ প্রোগ্রামসমূহ (কমা দিয়ে লিখুন)
                </label>
                <input
                  type="text"
                  placeholder="CSE, BBA, BTHM, Software Engineering"
                  value={formData.programs}
                  onChange={e => setFormData({ ...formData, programs: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>
                  লোগো আইকন / ইমোজি
                </label>
                <input
                  type="text"
                  placeholder="🏛️ অথবা 🎓"
                  value={formData.logo}
                  onChange={e => setFormData({ ...formData, logo: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>
                  স্ট্যাটাস
                </label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                >
                  <option value="active">Active (সক্রিয়)</option>
                  <option value="paused">Paused (সাময়িক বন্ধ)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', border: '1px solid #64748b', background: 'transparent', color: '#cbd5e1', cursor: 'pointer' }}
              >
                বাতিল
              </button>
              <button
                type="submit"
                style={{ padding: '0.6rem 1.5rem', borderRadius: '6px', border: 'none', background: '#eab308', color: '#0f172a', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {editingId ? 'আপডেট করুন' : 'যোগ করুন'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Campaigns Table */}
      <div style={{ background: 'var(--card-bg, #1e293b)', borderRadius: '12px', border: '1px solid var(--border-color, #334155)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', background: 'rgba(255, 255, 255, 0.02)' }}>
              <th style={{ padding: '0.9rem 1rem', color: '#94a3b8' }}>প্রতিষ্ঠান ও লোগো</th>
              <th style={{ padding: '0.9rem 1rem', color: '#94a3b8' }}>ক্যাম্পেইন ও অফার</th>
              <th style={{ padding: '0.9rem 1rem', color: '#94a3b8' }}>প্রদর্শন (Views)</th>
              <th style={{ padding: '0.9rem 1rem', color: '#94a3b8' }}>ক্লিক (Leads)</th>
              <th style={{ padding: '0.9rem 1rem', color: '#94a3b8' }}>CTR</th>
              <th style={{ padding: '0.9rem 1rem', color: '#94a3b8' }}>স্ট্যাটাস</th>
              <th style={{ padding: '0.9rem 1rem', color: '#94a3b8', textAlign: 'right' }}>অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  ক্যাম্পেইন তালিকা লোড হচ্ছে...
                </td>
              </tr>
            ) : promotions.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  কোনো স্পনসর ক্যাম্পেইন পাওয়া যায়নি। উপরে 'নতুন পার্টনার যুক্ত করুন' বাটনে ক্লিক করে যোগ করুন।
                </td>
              </tr>
            ) : (
              promotions.map(ad => (
                <tr key={ad.id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1.4rem' }}>{ad.logo || '🏛️'}</span>
                      <div>
                        <div style={{ fontWeight: 700, color: '#f8fafc' }}>{ad.institutionName}</div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{ad.tagline}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{ad.campaignTitle}</div>
                    {ad.waiverText && (
                      <div style={{ fontSize: '0.78rem', color: '#4ade80', marginTop: '0.2rem' }}>
                        🎁 {ad.waiverText}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.9rem 1rem', color: '#38bdf8', fontWeight: 700 }}>
                    {(ad.viewsCount || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.9rem 1rem', color: '#facc15', fontWeight: 700 }}>
                    {(ad.clicksCount || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.9rem 1rem', color: '#4ade80', fontWeight: 700 }}>
                    {ad.viewsCount > 0 ? (((ad.clicksCount || 0) / ad.viewsCount) * 100).toFixed(1) : 0}%
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: ad.status === 'active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                      color: ad.status === 'active' ? '#4ade80' : '#94a3b8',
                      border: `1px solid ${ad.status === 'active' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(148, 163, 184, 0.3)'}`
                    }}>
                      {ad.status === 'active' ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <a
                        href={ad.targetUrl}
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
                        title="লিংক পরীক্ষা করুন"
                      >
                        ↗
                      </a>
                      <button
                        onClick={() => handleOpenEdit(ad)}
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          background: 'rgba(234, 179, 8, 0.15)',
                          color: '#facc15',
                          border: '1px solid rgba(234, 179, 8, 0.3)',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(ad.id, ad.institutionName)}
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
