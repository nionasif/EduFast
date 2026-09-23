import React from 'react';
import { addNotification } from '../../data/mockData';

export default function AdminNoticesTab({
  newNotice,
  setNewNotice,
  notices,
  setNotices
}) {
  const handleSubmitNotice = (e) => {
    e.preventDefault();
    if (!newNotice.title || !newNotice.content) return;
    const item = {
      id: Date.now(),
      title: newNotice.title,
      priority: newNotice.priority,
      date: new Date().toISOString().slice(0, 10),
      content: newNotice.content
    };
    const updated = [item, ...notices];
    setNotices(updated);
    localStorage.setItem('edufast_admin_notices', JSON.stringify(updated));
    // Broadcast notification to students
    try {
      addNotification({
        title: `📢 অফিশিয়াল নোটিশ: ${newNotice.title}`,
        text: newNotice.content,
        category: 'notice',
        link: 'dashboard'
      });
    } catch {}
    setNewNotice({ title: '', priority: 'General', content: '' });
  };

  const handleDeleteNotice = (id) => {
    const updated = notices.filter(item => item.id !== id);
    setNotices(updated);
    localStorage.setItem('edufast_admin_notices', JSON.stringify(updated));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title"><span>✍️</span> Publish Broadcast Notice</h3>
        </div>
        <form onSubmit={handleSubmitNotice}>
          <div className="admin-form-group">
            <label className="admin-form-label">Notice Title</label>
            <input
              type="text"
              className="admin-input"
              value={newNotice.title}
              onChange={e => setNewNotice({ ...newNotice, title: e.target.value })}
              required
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Priority</label>
            <select
              className="admin-select"
              style={{ width: '100%' }}
              value={newNotice.priority}
              onChange={e => setNewNotice({ ...newNotice, priority: e.target.value })}
            >
              <option value="General">General</option>
              <option value="Important">Important</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Description</label>
            <textarea
              className="admin-input"
              rows="4"
              value={newNotice.content}
              onChange={e => setNewNotice({ ...newNotice, content: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-teal" style={{ width: '100%', justifyContent: 'center' }}>
            Publish Notice
          </button>
        </form>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title"><span>📢</span> Active Notices</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notices.map(n => (
            <div key={n.id} style={{ background: 'rgba(15,23,42,0.6)', padding: '1rem', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <strong style={{ color: '#f8fafc' }}>{n.title}</strong>
                <span style={{ fontSize: '0.72rem', color: '#93c5fd' }}>{n.priority}</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0 0 0.5rem 0' }}>{n.content}</p>
              <button
                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer' }}
                onClick={() => handleDeleteNotice(n.id)}
              >
                Delete
              </button>
            </div>
          ))}
          {notices.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              No notices published yet. Use the form to broadcast a notice.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
