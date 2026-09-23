import React from 'react';
import { Settings, Camera, Trash2 } from 'lucide-react';

export default function TeacherProfileTab({
  profileForm,
  setProfileForm,
  handleSaveProfile,
  theme
}) {
  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('File size exceeds 2MB limit. Please choose a smaller picture.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setProfileForm(prev => ({ ...prev, avatar: uploadEvent.target.result }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto' }}>
      <div style={{ backgroundColor: theme.cardBg, borderRadius: '12px', padding: '2rem', border: `1px solid ${theme.cardBorder}`, transition: 'all 0.3s ease' }}>
        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.4rem', fontWeight: 800, color: theme.text, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings style={{ width: '22px', height: '22px', color: 'var(--primary-teal)' }} />
          Instructor Profile & Credentials Settings
        </h2>

        <form onSubmit={handleSaveProfile}>
          {/* Avatar / Profile Picture Upload Card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            marginBottom: '1.75rem',
            padding: '1.25rem',
            backgroundColor: theme.cardBgElevated || 'rgba(255,255,255,0.04)',
            borderRadius: '12px',
            border: `1px solid ${theme.cardBorder}`
          }}>
            <div style={{ position: 'relative' }}>
              {profileForm.avatar ? (
                <img
                  src={profileForm.avatar}
                  alt="Profile"
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid var(--primary-teal)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                  }}
                />
              ) : (
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-teal)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.6rem',
                  border: '3px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                }}>
                  {(profileForm.name || 'T').charAt(0)}
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: theme.text, marginBottom: '0.25rem' }}>
                Profile Picture (শিক্ষক প্রোফাইল ছবি)
              </div>
              <div style={{ fontSize: '0.78rem', color: theme.textMuted || '#718096', marginBottom: '0.75rem' }}>
                Upload a clear portrait picture. Max file size: 2MB.
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.9rem',
                  backgroundColor: 'var(--primary-teal)',
                  color: '#fff',
                  borderRadius: '7px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}>
                  <Camera style={{ width: '15px', height: '15px' }} />
                  Choose Picture
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    style={{ display: 'none' }}
                  />
                </label>

                {profileForm.avatar && (
                  <button
                    type="button"
                    onClick={() => setProfileForm({ ...profileForm, avatar: null })}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.4rem 0.75rem',
                      backgroundColor: 'transparent',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '7px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 style={{ width: '14px', height: '14px' }} />
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: theme.textSecondary, marginBottom: '0.4rem' }}>
                Full Name
              </label>
              <input
                type="text"
                value={profileForm.name}
                onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                className="form-input"
                style={{
                  width: '100%',
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.inputText
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: theme.textSecondary, marginBottom: '0.4rem' }}>
                Email Address
              </label>
              <input
                type="email"
                value={profileForm.email}
                onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                className="form-input"
                style={{
                  width: '100%',
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.inputText
                }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: theme.textSecondary, marginBottom: '0.4rem' }}>
                Mobile Number
              </label>
              <input
                type="text"
                value={profileForm.mobile}
                onChange={e => setProfileForm({ ...profileForm, mobile: e.target.value })}
                className="form-input"
                style={{
                  width: '100%',
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.inputText
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: theme.textSecondary, marginBottom: '0.4rem' }}>
                Qualifications & Background
              </label>
              <input
                type="text"
                value={profileForm.qualification}
                onChange={e => setProfileForm({ ...profileForm, qualification: e.target.value })}
                placeholder="e.g. BUET '19 (Civil Engineering)"
                className="form-input"
                style={{
                  width: '100%',
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.inputText
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: theme.textSecondary, marginBottom: '0.4rem' }}>
              Department / Teaching Wing
            </label>
            <input
              type="text"
              value={profileForm.department}
              onChange={e => setProfileForm({ ...profileForm, department: e.target.value })}
              placeholder="e.g. Senior Lead Instructor, Science Wing"
              className="form-input"
              style={{
                width: '100%',
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.inputText
              }}
            />
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: theme.textSecondary, marginBottom: '0.4rem' }}>
              Instructor Biography
            </label>
            <textarea
              rows={4}
              value={profileForm.bio}
              onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
              className="form-input"
              style={{
                width: '100%',
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.inputText
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-teal"
            style={{ padding: '0.65rem 1.5rem', fontWeight: 700 }}
          >
            Save Profile Information
          </button>
        </form>
      </div>
    </div>
  );
}
