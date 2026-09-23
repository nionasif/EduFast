import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert, BookOpen, Clock, FileText, Eye, Film, RefreshCw } from 'lucide-react';

const BACKEND_URL = 'http://localhost:5001';

export default function AdminCurriculumModal({
  isOpen,
  onClose,
  course,
  onToggleApproval = () => {}
}) {
  const [curriculum, setCurriculum] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ text: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getFullVideoUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }
    return `${BACKEND_URL}${url}`;
  };

  const fetchCurriculum = async () => {
    if (!course?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/courses/${course.id}/curriculum`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setCurriculum(data.data);
      } else {
        // Fallback to local storage
        const stored = localStorage.getItem(`edufast_curriculum_${course.id}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) setCurriculum(parsed);
          } catch {}
        } else if (course.modules && course.modules.length > 0) {
          setCurriculum(course.modules);
        } else {
          setCurriculum([]);
        }
      }
    } catch (err) {
      console.warn('Admin curriculum fetch fallback:', err.message);
      const stored = localStorage.getItem(`edufast_curriculum_${course.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setCurriculum(parsed);
        } catch {}
      } else if (course.modules) {
        setCurriculum(course.modules);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && course?.id) {
      setActiveVideo(null);
      fetchCurriculum();
    }
  }, [isOpen, course?.id]);

  if (!isOpen) return null;

  const totalLessons = curriculum.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);

  return (
    <div className="admin-modal-backdrop" onClick={onClose} style={{ zIndex: 1200, backgroundColor: 'rgba(0,0,0,0.85)' }}>
      <div
        className="admin-modal-card"
        style={{
          maxWidth: '960px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Toast */}
        {toast && (
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '25px',
            zIndex: 9999,
            background: toast.type === 'error' ? '#ef4444' : '#10b981',
            color: '#fff',
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}>
            {toast.text}
          </div>
        )}

        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <ShieldCheck style={{ width: '13px', height: '13px' }} /> এডমিন কোর্স রিভিউ ও পাবলিশ পারমিশন
              </span>

              {course?.isApproved ? (
                <span style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px'
                }}>
                  ● ওয়েবসাইটে লাইভ (Approved)
                </span>
              ) : (
                <span style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px'
                }}>
                  ⏳ অনুমোদনের অপেক্ষায় (Pending)
                </span>
              )}
            </div>

            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc', fontWeight: 800 }}>
              {course?.title}
            </h3>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              👨‍🏫 কোর্স শিক্ষক: <strong style={{ color: '#38bdf8' }}>{course?.instructor || 'EduFast Instructor'}</strong> • বিভাগ: <strong>{course?.group || 'Science'}</strong> • ফি: <strong style={{ color: '#34d399' }}>৳{course?.discountedPrice || course?.price}</strong>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8',
              fontSize: '1.2rem',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            &times;
          </button>
        </div>

        {/* Admin Policy Notice Banner */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '0.75rem 1.75rem',
          fontSize: '0.82rem',
          color: '#cbd5e1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
            <span style={{ fontSize: '1.1rem' }}>🔒</span>
            <span>
              <strong>এডমিন নিরাপত্তা নীতি:</strong> ভিডিও আপলোড ও লেকচার বিন্যাস শুধুমাত্র সংশ্লিষ্ট শিক্ষকের নিজস্ব স্টুডিও থেকে করা হয়। এডমিন হিসেবে আপনার ক্ষমতা শুধুমাত্র শিক্ষকের আপলোডকৃত লেকচার ও ভিডিও যাচাই করে ওয়েবসাইটে <strong>পাবলিশের পারমিশন</strong> প্রদান করা।
            </span>
          </div>

          {/* Quick Approval Action in Header Banner */}
          <div>
            {course?.isApproved ? (
              <button
                type="button"
                onClick={() => {
                  onToggleApproval(course);
                  showToast('কোর্সটির পাবলিশ অনুমোদন প্রত্যাহার করা হয়েছে।', 'info');
                }}
                className="admin-btn"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderRadius: '6px'
                }}
              >
                ⛔ পাবলিশ পারমিশন প্রত্যাহার
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onToggleApproval(course);
                  showToast('🎉 কোর্সটি সফলভাবে পাবলিশ অনুমোদন দেওয়া হয়েছে!', 'success');
                }}
                className="admin-btn"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#fff',
                  padding: '0.45rem 1rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderRadius: '6px',
                  boxShadow: '0 2px 10px rgba(16, 185, 129, 0.4)'
                }}
              >
                ✅ কোর্সটি পাবলিশের অনুমোদন দিন
              </button>
            )}
          </div>
        </div>

        {/* Video Player Inspection Box (If Admin clicks to inspect a lecture video) */}
        {activeVideo && (
          <div style={{
            background: '#000000',
            padding: '1rem 1.75rem',
            borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#38bdf8', fontSize: '0.88rem', fontWeight: 700 }}>
                ▶ ভিডিও ইন্সপেকশন প্লেয়ার: <strong>{activeVideo.title}</strong>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                ✕ প্লেয়ার বন্ধ করুন
              </button>
            </div>
            <video
              src={getFullVideoUrl(activeVideo.videoUrl)}
              controls
              autoPlay
              style={{ width: '100%', maxHeight: '280px', borderRadius: '8px', objectFit: 'contain', background: '#111827' }}
            />
          </div>
        )}

        {/* Body: Curriculum Modules & Lessons Overview */}
        <div style={{ padding: '1.25rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '0.95rem', fontWeight: 700 }}>
              📚 শিক্ষক কর্তৃক তৈরিকৃত কারিকুলাম তালিকা ({curriculum.length} টি মডিউল, {totalLessons} টি ভিডিও লেকচার)
            </h4>

            <button
              type="button"
              onClick={fetchCurriculum}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <RefreshCw style={{ width: '12px', height: '12px' }} /> রিফ্রেশ
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              লোড হচ্ছে...
            </div>
          ) : curriculum.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1.5rem',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '12px',
              border: '1px dashed rgba(255,255,255,0.08)'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎬</div>
              <div style={{ color: '#cbd5e1', fontWeight: 600 }}>শিক্ষক এখনও এই কোর্সে কোনো ভিডিও লেকচার যুক্ত করেননি।</div>
              <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>
                শিক্ষক তার স্টুডিও থেকে লেকচার ও ভিডিও আপলোড করলে এখানে দৃশ্যমান হবে।
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {curriculum.map((mod, mIdx) => (
                <div
                  key={mIdx}
                  style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    borderRadius: '12px',
                    padding: '1rem',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                >
                  <div style={{
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: '#38bdf8',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>📌 {mod.title}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                      {mod.lessons?.length || 0} Lessons
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {mod.lessons?.map((les, lIdx) => (
                      <div
                        key={lIdx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'rgba(15, 23, 42, 0.65)',
                          padding: '0.65rem 0.9rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.04)'
                        }}
                      >
                        <div>
                          <div style={{ color: '#f8fafc', fontSize: '0.84rem', fontWeight: 600 }}>
                            ▶ {les.title}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>⏱️ {les.duration || '20:00'}</span>
                            <span>•</span>
                            <span style={{
                              color: les.videoSourceType === 'local' || (les.videoUrl && les.videoUrl.startsWith('/uploads')) ? '#34d399' : '#38bdf8'
                            }}>
                              {les.videoSourceType === 'local' || (les.videoUrl && les.videoUrl.startsWith('/uploads')) ? '📁 শিক্ষক কর্তৃক পিসি থেকে আপলোডকৃত' : '🔗 অনলাইন ভিডিও'}
                            </span>
                            {les.sheetUrl && (
                              <>
                                <span>•</span>
                                <span style={{ color: '#fbbf24' }}>📄 লেকচার শিট সংযুক্ত</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => setActiveVideo(les)}
                            style={{
                              background: 'rgba(56, 189, 248, 0.15)',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              color: '#38bdf8',
                              padding: '0.35rem 0.75rem',
                              borderRadius: '6px',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <Play style={{ width: '12px', height: '12px' }} /> ভিডিও দেখুন
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer with Primary Publish Approval */}
        <div style={{
          padding: '1rem 1.75rem',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(15, 23, 42, 0.9)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            {course?.isApproved ? (
              <span style={{ color: '#34d399', fontWeight: 600 }}>
                ✅ এই কোর্সটি বর্তমানে ওয়েবসাইটে লাইভ রয়েছে। শিক্ষার্থীরা কোর্সটিতে এনরোল করে ভিডিও দেখতে পারবে।
              </span>
            ) : (
              <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                ⚠️ কোর্সটি অনুমোদনের অপেক্ষায়। 'পাবলিশ অনুমোদন দিন' বাটনে ক্লিক করলে কোর্সটি শিক্ষার্থীদের জন্য উন্মুক্ত হবে।
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={onClose}
              style={{ padding: '0.45rem 1rem' }}
            >
              বন্ধ করুন
            </button>

            {course?.isApproved ? (
              <button
                type="button"
                onClick={() => {
                  onToggleApproval(course);
                  showToast('পাবলিশ পারমিশন প্রত্যাহার করা হয়েছে।', 'info');
                }}
                className="admin-btn"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#f87171',
                  padding: '0.45rem 1.15rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderRadius: '6px'
                }}
              >
                ⛔ অনুমোদন প্রত্যাহার করুন
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onToggleApproval(course);
                  showToast('🎉 কোর্সটি সফলভাবে পাবলিশ অনুমোদন দেওয়া হয়েছে!', 'success');
                }}
                className="admin-btn"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '0.45rem 1.25rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                }}
              >
                ✅ পাবলিশ অনুমোদন দিন (Approve Live)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
