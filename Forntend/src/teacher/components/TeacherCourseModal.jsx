import React, { useState } from 'react';
import { X, Trash2, Upload, Link, Play, CheckCircle2, Loader2, Video, AlertCircle } from 'lucide-react';
import { formatYouTubeEmbedUrl, isYouTubeUrl, resolveVideoSource } from '../../services/videoHelper';
import { getCustomServerUrl } from '../../services/api';

const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function TeacherCourseModal({
  isOpen,
  onClose,
  editingCourseId,
  courseFormData,
  setCourseFormData,
  handleSaveCourse,
  handleAddModule,
  handleRemoveModule,
  handleAddLesson,
  handleRemoveLesson,
  theme
}) {
  const [uploadingLessons, setUploadingLessons] = useState({}); // { [key]: percent }
  const [activePreviewVideo, setActivePreviewVideo] = useState(null); // url to preview

  if (!isOpen) return null;

  // Upload video file directly from PC for a specific lesson
  const handleLessonFileUpload = (modIdx, lesIdx, file) => {
    if (!file) return;

    const key = `${modIdx}-${lesIdx}`;
    setUploadingLessons(prev => ({ ...prev, [key]: 10 }));

    const formData = new FormData();
    formData.append('video', file);

    const serverUrl = getCustomServerUrl() || BACKEND_URL;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${serverUrl}/api/upload/video`);

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        const percent = Math.round((evt.loaded / evt.total) * 100);
        setUploadingLessons(prev => ({ ...prev, [key]: percent }));
      }
    };

    xhr.onload = () => {
      setUploadingLessons(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const resp = JSON.parse(xhr.responseText);
          if (resp.success && resp.data?.videoUrl) {
            const finalUrl = resp.data.fullUrl || `${serverUrl}${resp.data.videoUrl}`;
            const updated = [...courseFormData.modules];
            updated[modIdx].lessons[lesIdx].videoUrl = finalUrl;
            updated[modIdx].lessons[lesIdx].uploadedFileName = file.name;
            updated[modIdx].lessons[lesIdx].videoSourceType = 'local';
            setCourseFormData({ ...courseFormData, modules: updated });
          } else {
            alert(resp.error || 'ভিডিও আপলোড ব্যর্থ হয়েছে');
          }
        } catch (err) {
          alert('ভিডিও আপলোড রেসপন্স প্রক্রিয়াকরণে সমস্যা হয়েছে।');
        }
      } else {
        alert(`সার্ভার এরর: ${xhr.statusText}`);
      }
    };

    xhr.onerror = () => {
      setUploadingLessons(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
      alert('নেটওয়ার্ক সমস্যার কারণে ভিডিও আপলোড করা যায়নি। EduFast সার্ভার চালু আছে কি না নিশ্চিত করুন।');
    };

    xhr.send(formData);
  };

  const handleLessonUrlChange = (modIdx, lesIdx, rawUrl) => {
    const updated = [...courseFormData.modules];
    let finalUrl = rawUrl;
    let sourceType = 'external';

    if (isYouTubeUrl(rawUrl)) {
      finalUrl = rawUrl.trim();
      sourceType = 'youtube';
    }

    updated[modIdx].lessons[lesIdx].videoUrl = finalUrl;
    updated[modIdx].lessons[lesIdx].videoSourceType = sourceType;
    if (sourceType === 'youtube') {
      updated[modIdx].lessons[lesIdx].uploadedFileName = '';
    }
    setCourseFormData({ ...courseFormData, modules: updated });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '880px',
          maxHeight: '92vh',
          overflowY: 'auto',
          backgroundColor: theme.modalBg,
          color: theme.text,
          border: `1px solid ${theme.modalBorder}`,
          transition: 'all 0.2s ease',
          padding: '1.75rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: `1px solid ${theme.cardBorder}`, paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.3rem', color: theme.text, fontWeight: 800 }}>
              {editingCourseId ? 'কোর্স ও কারিকুলাম এডিট করুন' : 'নতুন কোর্স তৈরি ও কারিকুলাম প্রকাশ'}
            </h3>
            <span style={{ fontSize: '0.78rem', color: theme.textMuted }}>
              পিসি থেকে ভিডিও আপলোড অথবা ইউটিউব লিংক উভয়ই EduFast প্লেয়ারে সরাসরি কাজ করবে।
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted }}>
            <X style={{ width: '22px', height: '22px' }} />
          </button>
        </div>

        <form onSubmit={handleSaveCourse}>
          {/* Step 1: General Info */}
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-teal)', fontSize: '0.95rem', fontWeight: 700 }}>
            ১. কোর্সের প্রাথমিক তথ্য (Course Information)
          </h4>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
              কোর্সের শিরোনাম (Title) *
            </label>
            <input
              type="text"
              value={courseFormData.title}
              onChange={e => setCourseFormData({ ...courseFormData, title: e.target.value })}
              placeholder="e.g.: Complete University Admission Physics Masterclass"
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
                একাডেমিক গ্রুপ
              </label>
              <select
                value={courseFormData.group}
                onChange={e => setCourseFormData({ ...courseFormData, group: e.target.value })}
                className="form-input"
                style={{
                  width: '100%',
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.inputText
                }}
              >
                <option value="Science">Science</option>
                <option value="Commerce">Commerce</option>
                <option value="Arts">Arts</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
                সময়কাল (Duration)
              </label>
              <input
                type="text"
                value={courseFormData.duration}
                onChange={e => setCourseFormData({ ...courseFormData, duration: e.target.value })}
                placeholder="e.g. 45 Hours"
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
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
                হাইলাইট ব্যাজ
              </label>
              <input
                type="text"
                value={courseFormData.badge}
                onChange={e => setCourseFormData({ ...courseFormData, badge: e.target.value })}
                placeholder="e.g. Masterclass, Best Seller"
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
                মূল ফি (Original Price - ৳)
              </label>
              <input
                type="number"
                value={courseFormData.price}
                onChange={e => setCourseFormData({ ...courseFormData, price: e.target.value })}
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
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
                অফার ফি (Offer Price - ৳)
              </label>
              <input
                type="number"
                value={courseFormData.discountedPrice}
                onChange={e => setCourseFormData({ ...courseFormData, discountedPrice: e.target.value })}
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
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
                কোর্স আইকন ইমোজি
              </label>
              <input
                type="text"
                value={courseFormData.image}
                onChange={e => setCourseFormData({ ...courseFormData, image: e.target.value })}
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

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
              কোর্সের বিস্তারিত বিবরণ (Description)
            </label>
            <textarea
              rows={2}
              value={courseFormData.description}
              onChange={e => setCourseFormData({ ...courseFormData, description: e.target.value })}
              placeholder="শিক্ষার্থীরা এই কোর্সে কী কী শিখতে পারবে তার সংক্ষিপ্ত বিবরণ..."
              className="form-input"
              style={{
                width: '100%',
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.inputText
              }}
            />
          </div>

          {/* Step 2: Dynamic Curriculum Builder with Direct PC Upload & Disguised YT Link */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderTop: `1px solid ${theme.cardBorder}`, paddingTop: '1.25rem' }}>
            <div>
              <h4 style={{ margin: 0, color: 'var(--primary-teal)', fontSize: '0.95rem', fontWeight: 700 }}>
                ২. কারিকুলাম মডিউল ও ভিডিও লেকচার ({courseFormData.modules.length} Modules)
              </h4>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.76rem', color: theme.textMuted }}>
                💡 প্রতিটি লেকচারের জন্য আপনার পিসি থেকে সরাসরি ভিডিও আপলোড করতে পারবেন অথবা ইউটিউব লিংক দিলে তা স্বয়ংক্রিয়ভাবে সাদা-লেবেল EduFast প্লেয়ারে রূপান্তর হবে।
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddModule}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
            >
              + Add Module
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {courseFormData.modules.map((mod, modIdx) => (
              <div
                key={mod.id || modIdx}
                style={{
                  border: `1px solid ${theme.cardBorder}`,
                  borderRadius: '10px',
                  padding: '1.1rem',
                  backgroundColor: theme.cardBgElevated
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <input
                    type="text"
                    value={mod.title}
                    onChange={e => {
                      const updated = [...courseFormData.modules];
                      updated[modIdx].title = e.target.value;
                      setCourseFormData({ ...courseFormData, modules: updated });
                    }}
                    className="form-input"
                    style={{
                      flex: 1,
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      marginRight: '0.5rem',
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.inputText
                    }}
                    placeholder="Module Title (e.g. Module 1: Foundation Concepts)"
                  />
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => handleAddLesson(modIdx)}
                      className="btn btn-teal"
                      style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}
                    >
                      + Add Lesson
                    </button>
                    {courseFormData.modules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveModule(modIdx)}
                        className="btn"
                        style={{ padding: '0.25rem 0.5rem', color: '#e53e3e', border: '1px solid #fed7d7', background: theme.cardBg }}
                        title="Remove Module"
                      >
                        <Trash2 style={{ width: '13px', height: '13px' }} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Lessons list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {mod.lessons.map((les, lesIdx) => {
                    const uploadKey = `${modIdx}-${lesIdx}`;
                    const isUploading = uploadingLessons[uploadKey] !== undefined;
                    const uploadPercent = uploadingLessons[uploadKey] || 0;
                    const isYT = isYouTubeUrl(les.videoUrl);

                    return (
                      <div
                        key={les.id || lesIdx}
                        style={{
                          backgroundColor: theme.cardBg,
                          padding: '0.85rem',
                          borderRadius: '8px',
                          border: `1px solid ${theme.cardBorder}`
                        }}
                      >
                        {/* Title and Duration row */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', color: theme.textMuted, fontWeight: 700, width: '22px' }}>
                            #{lesIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={les.title}
                            onChange={e => {
                              const updated = [...courseFormData.modules];
                              updated[modIdx].lessons[lesIdx].title = e.target.value;
                              setCourseFormData({ ...courseFormData, modules: updated });
                            }}
                            className="form-input"
                            style={{
                              flex: 1,
                              fontSize: '0.85rem',
                              padding: '0.35rem 0.6rem',
                              backgroundColor: theme.inputBg,
                              borderColor: theme.inputBorder,
                              color: theme.inputText
                            }}
                            placeholder="Lesson title (e.g. Chapter 1: Introduction)"
                          />
                          <input
                            type="text"
                            value={les.duration}
                            onChange={e => {
                              const updated = [...courseFormData.modules];
                              updated[modIdx].lessons[lesIdx].duration = e.target.value;
                              setCourseFormData({ ...courseFormData, modules: updated });
                            }}
                            className="form-input"
                            style={{
                              width: '90px',
                              fontSize: '0.85rem',
                              padding: '0.35rem 0.5rem',
                              backgroundColor: theme.inputBg,
                              borderColor: theme.inputBorder,
                              color: theme.inputText,
                              textAlign: 'center'
                            }}
                            placeholder="Duration (45m)"
                          />
                          {mod.lessons.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveLesson(modIdx, lesIdx)}
                              style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', padding: '4px' }}
                              title="Remove Lesson"
                            >
                              <Trash2 style={{ width: '15px', height: '15px' }} />
                            </button>
                          )}
                        </div>

                        {/* Video source control: PC upload + YouTube Link */}
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, position: 'relative' }}>
                            <input
                              type="text"
                              value={les.videoUrl || ''}
                              onChange={e => handleLessonUrlChange(modIdx, lesIdx, e.target.value)}
                              className="form-input"
                              style={{
                                width: '100%',
                                fontSize: '0.8rem',
                                padding: '0.35rem 0.6rem',
                                backgroundColor: theme.inputBg,
                                borderColor: isYT ? '#10b981' : theme.inputBorder,
                                color: theme.inputText
                              }}
                              placeholder="ইউটিউব লিংক পেস্ট করুন (যেমন https://youtu.be/...) অথবা পিসি থেকে আপলোড করুন"
                            />
                            {isYT && (
                              <span style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '0.68rem',
                                color: '#10b981',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                pointerEvents: 'none'
                              }}>
                                <CheckCircle2 style={{ width: '12px', height: '12px' }} /> YouTube Embed
                              </span>
                            )}
                          </div>

                          {/* PC File Upload Button */}
                          <label
                            className="btn btn-secondary"
                            style={{
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.78rem',
                              cursor: isUploading ? 'wait' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                          >
                            {isUploading ? (
                              <>
                                <Loader2 style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} />
                                <span>{uploadPercent}% আপলোড হচ্ছে</span>
                              </>
                            ) : (
                              <>
                                <Upload style={{ width: '13px', height: '13px' }} />
                                <span>পিসি থেকে আপলোড</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/mkv,video/*"
                              disabled={isUploading}
                              style={{ display: 'none' }}
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleLessonFileUpload(modIdx, lesIdx, file);
                              }}
                            />
                          </label>

                          {/* Preview Button */}
                          {les.videoUrl && (
                            <button
                              type="button"
                              onClick={() => setActivePreviewVideo(les.videoUrl)}
                              className="btn btn-teal"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                              title="ভিডিওটি টেস্ট প্লে করে দেখুন"
                            >
                              <Play style={{ width: '12px', height: '12px', fill: '#fff' }} /> প্রিভিউ
                            </button>
                          )}
                        </div>

                        {/* Upload progress indicator */}
                        {isUploading && (
                          <div style={{ marginTop: '0.4rem', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${uploadPercent}%`, backgroundColor: 'var(--primary-teal)', transition: 'width 0.2s' }} />
                          </div>
                        )}

                        {les.uploadedFileName && (
                          <div style={{ marginTop: '0.3rem', fontSize: '0.72rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <CheckCircle2 style={{ width: '12px', height: '12px' }} />
                            <span>আপলোড সম্পন্ন: {les.uploadedFileName}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${theme.cardBorder}`, paddingTop: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: theme.textMuted }}>
              🔒 নতুন কোর্স এডমিনের পর্যালোচনার জন্য সাবমিট হবে। এডমিন অনুমোদন দিলে তাৎক্ষণিক লাইভ হবে।
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-teal" style={{ fontWeight: 700, padding: '0.5rem 1.25rem' }}>
                {editingCourseId ? 'Save & Update Changes' : 'Publish New Course'}
              </button>
            </div>
          </div>
        </form>

        {/* Video Test Preview Modal */}
        {activePreviewVideo && (
          <div className="modal-backdrop" style={{ zIndex: 9999 }} onClick={() => setActivePreviewVideo(null)}>
            <div
              className="modal-content"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '720px', padding: '1rem', backgroundColor: '#0f172a', borderRadius: '12px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', color: '#fff' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Video style={{ width: '16px', height: '16px', color: 'var(--primary-teal)' }} /> লেকচার ভিডিও প্রিভিউ (EduFast Player)
                </span>
                <button
                  type="button"
                  onClick={() => setActivePreviewVideo(null)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X style={{ width: '18px', height: '18px' }} />
                </button>
              </div>

              {(() => {
                const resolved = resolveVideoSource(activePreviewVideo);
                if (resolved.isYouTube) {
                  return (
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
                      <iframe
                        src={resolved.url}
                        title="Lesson Preview"
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'rgba(15, 23, 42, 0.9)',
                        backdropFilter: 'blur(8px)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: 'var(--primary-teal)',
                        pointerEvents: 'none'
                      }}>
                        EduFast Stream
                      </div>
                    </div>
                  );
                }

                return (
                  <video
                    src={resolved.url}
                    controls
                    autoPlay
                    style={{ width: '100%', maxHeight: '420px', borderRadius: '8px', background: '#000' }}
                  />
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
