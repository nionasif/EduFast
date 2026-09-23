import React, { useState, useEffect, useRef } from 'react';
import { Video, Upload, Trash2, Play, Eye, FileText, CheckCircle2, Clock, AlertCircle, RefreshCw, Film } from 'lucide-react';

const BACKEND_URL = 'http://localhost:5001';

export default function TeacherCurriculumModal({
  isOpen,
  onClose,
  course,
  onCurriculumUpdated = () => {},
  theme = {
    modalBg: '#0f172a',
    modalBorder: '#1e293b',
    cardBg: '#1e293b',
    cardBgElevated: '#334155',
    cardBorder: '#334155',
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
    inputBg: '#1e293b',
    inputBorder: '#475569',
    inputText: '#f8fafc'
  }
}) {
  const [curriculum, setCurriculum] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serverVideos, setServerVideos] = useState([]);

  // Form states for adding topic lecture
  const [selectedModuleMode, setSelectedModuleMode] = useState('existing'); // 'existing' | 'new'
  const [existingModuleSelect, setExistingModuleSelect] = useState('');
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [topicTitle, setTopicTitle] = useState('');
  const [videoSourceType, setVideoSourceType] = useState('upload'); // 'upload' | 'server' | 'url'
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState('20:00');
  const [lectureNotesUrl, setLectureNotesUrl] = useState('');

  // Local PC File states
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Video Preview Player in modal
  const [activePreviewVideo, setActivePreviewVideo] = useState(null);

  // Toast notifications
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ text: msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Helper to format video URL (handle relative /uploads/)
  const getFullVideoUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }
    return `${BACKEND_URL}${url}`;
  };

  // Fetch course curriculum & existing server videos
  const fetchData = async () => {
    if (!course?.id) return;
    setLoading(true);
    try {
      // 1. Fetch curriculum from backend SQLite database
      const curRes = await fetch(`${BACKEND_URL}/api/courses/${course.id}/curriculum`);
      const curData = await curRes.json();
      if (curData.success && Array.isArray(curData.data)) {
        setCurriculum(curData.data);
        if (curData.data.length > 0 && !existingModuleSelect) {
          setExistingModuleSelect(curData.data[0].title);
        }
      } else {
        // Fallback to local storage if backend curriculum empty
        const stored = localStorage.getItem(`edufast_curriculum_${course.id}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) setCurriculum(parsed);
          } catch {}
        }
      }

      // 2. Fetch server uploaded videos list
      const vidRes = await fetch(`${BACKEND_URL}/api/upload/videos`);
      const vidData = await vidRes.json();
      if (vidData.success && Array.isArray(vidData.data)) {
        setServerVideos(vidData.data);
      }
    } catch (err) {
      console.warn('Notice loading curriculum from backend:', err.message);
      // Fallback to local curriculum
      const stored = localStorage.getItem(`edufast_curriculum_${course?.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setCurriculum(parsed);
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && course?.id) {
      fetchData();
    }
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [isOpen, course?.id]);

  // Handle local PC file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check video type
    if (!file.type.startsWith('video/') && !['.mp4', '.webm', '.mkv', '.mov'].some(ext => file.name.toLowerCase().endsWith(ext))) {
      showToast('শুধুমাত্র ভিডিও ফাইল (.mp4, .webm, .mkv, .mov) আপলোড করতে পারবেন।', 'error');
      return;
    }

    // Revoke previous blob
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }

    setSelectedFile(file);
    const blobUrl = URL.createObjectURL(file);
    setFilePreviewUrl(blobUrl);

    // Auto calculate duration from video metadata
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = blobUrl;
    tempVideo.onloadedmetadata = () => {
      const sec = Math.round(tempVideo.duration);
      if (sec && !isNaN(sec)) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        setDuration(`${m}:${s < 10 ? '0' : ''}${s}`);
      }
    };

    showToast(`ভিডিও নির্বাচিত: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`, 'info');
  };

  // Upload video from PC to server
  const uploadVideoFile = () => {
    return new Promise((resolve, reject) => {
      if (!selectedFile) {
        resolve(null);
        return;
      }

      setIsUploading(true);
      setUploadProgress(10);

      const formData = new FormData();
      formData.append('video', selectedFile);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BACKEND_URL}/api/upload/video`);

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const percent = Math.round((evt.loaded / evt.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        setIsUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const resp = JSON.parse(xhr.responseText);
            if (resp.success && resp.data?.videoUrl) {
              setVideoUrl(resp.data.videoUrl);
              resolve(resp.data.videoUrl);
            } else {
              reject(new Error(resp.error || 'আপলোড ব্যর্থ হয়েছে'));
            }
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error(`সার্ভার এরর: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        setIsUploading(false);
        reject(new Error('নেটওয়ার্ক সমস্যার কারণে ভিডিও আপলোড করা যায়নি।'));
      };

      xhr.send(formData);
    });
  };

  // Save topic lecture
  const handleSaveLesson = async (e) => {
    e.preventDefault();

    // Determine module title
    let finalModuleTitle = '';
    if (selectedModuleMode === 'existing' && existingModuleSelect) {
      finalModuleTitle = existingModuleSelect.trim();
    } else if (newModuleTitle.trim()) {
      finalModuleTitle = newModuleTitle.trim();
    } else if (curriculum.length > 0) {
      finalModuleTitle = curriculum[0].title;
    } else {
      finalModuleTitle = 'Module 1: প্রধান অধ্যায় ও বিষয়বস্তু';
    }

    if (!topicTitle.trim()) {
      showToast('অনুগ্রহ করে টপিক বা লেকচারের নাম লিখুন।', 'error');
      return;
    }

    let finalVideoUrl = videoUrl;

    // If local file is selected, upload it first
    if (videoSourceType === 'upload') {
      if (!selectedFile && !videoUrl) {
        showToast('অনুগ্রহ করে আপনার কম্পিউটার থেকে একটি ভিডিও ফাইল সিলেক্ট করুন।', 'error');
        return;
      }

      if (selectedFile) {
        try {
          finalVideoUrl = await uploadVideoFile();
          if (!finalVideoUrl) return;
        } catch (err) {
          showToast(err.message || 'ভিডিও আপলোডে সমস্যা হয়েছে।', 'error');
          return;
        }
      }
    }

    if (!finalVideoUrl || !finalVideoUrl.trim()) {
      showToast('ভিডিও ফাইল আপলোড করুন অথবা ভিডিও লিংক দিন।', 'error');
      return;
    }

    try {
      const payload = {
        courseId: course.id,
        courseTitle: course.title,
        instructor: course.instructor,
        moduleTitle: finalModuleTitle,
        topicTitle: topicTitle.trim(),
        videoUrl: finalVideoUrl.trim(),
        videoSourceType: videoSourceType === 'url' ? 'external' : 'local',
        duration: duration.trim() || '20:00',
        lectureNotesUrl: lectureNotesUrl.trim()
      };

      // 1. Send to backend API to persist in SQLite database
      const res = await fetch(`${BACKEND_URL}/api/courses/${course.id}/curriculum`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        showToast('🎉 লেকচার ও ভিডিও সফলভাবে ডাটাবেজে যুক্ত হয়েছে!', 'success');
        
        // Reset form
        setTopicTitle('');
        setSelectedFile(null);
        setFilePreviewUrl(null);
        setVideoUrl('');
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';

        if (data.curriculum) {
          setCurriculum(data.curriculum);
          localStorage.setItem(`edufast_curriculum_${course.id}`, JSON.stringify(data.curriculum));
          onCurriculumUpdated(data.curriculum);
        } else {
          fetchData();
        }
      } else {
        showToast(data.error || 'টপিক যুক্ত করা যায়নি।', 'error');
      }
    } catch (err) {
      console.warn('Backend unavailable, saving to local store:', err);
      // Fallback local update
      const newLesson = {
        id: `les-${Date.now()}`,
        title: topicTitle.trim(),
        duration: duration.trim() || '20:00',
        videoUrl: finalVideoUrl.trim(),
        videoSourceType: videoSourceType === 'url' ? 'external' : 'local',
        sheetUrl: lectureNotesUrl.trim(),
        completed: false
      };

      let updatedModules = [...curriculum];
      const modIndex = updatedModules.findIndex(m => m.title === finalModuleTitle);
      if (modIndex >= 0) {
        updatedModules[modIndex].lessons.push(newLesson);
      } else {
        updatedModules.push({
          id: `mod-${Date.now()}`,
          title: finalModuleTitle,
          lessons: [newLesson]
        });
      }

      setCurriculum(updatedModules);
      localStorage.setItem(`edufast_curriculum_${course.id}`, JSON.stringify(updatedModules));
      onCurriculumUpdated(updatedModules);
      showToast('লেকচার সেভ হয়েছে!', 'success');
      setTopicTitle('');
      setSelectedFile(null);
      setFilePreviewUrl(null);
      setVideoUrl('');
    }
  };

  // Delete lesson
  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('আপনি কি এই ভিডিও লেকচারটি মুছে ফেলতে চান?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/courses/curriculum/${lessonId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast('লেকচারটি মুছে ফেলা হয়েছে।', 'info');
        if (data.curriculum) {
          setCurriculum(data.curriculum);
          localStorage.setItem(`edufast_curriculum_${course.id}`, JSON.stringify(data.curriculum));
          onCurriculumUpdated(data.curriculum);
        } else {
          fetchData();
        }
      }
    } catch (err) {
      // Fallback delete from local state
      const updated = curriculum.map(mod => ({
        ...mod,
        lessons: mod.lessons.filter(l => l.id !== lessonId)
      })).filter(mod => mod.lessons.length > 0);
      setCurriculum(updated);
      localStorage.setItem(`edufast_curriculum_${course.id}`, JSON.stringify(updated));
      onCurriculumUpdated(updated);
      showToast('লেকচার মুছে ফেলা হয়েছে।', 'info');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="admin-modal-backdrop" onClick={onClose} style={{ zIndex: 1200, backgroundColor: 'rgba(0,0,0,0.85)' }}>
      <div
        className="admin-modal-card"
        style={{
          maxWidth: '1050px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0b1329',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Toast Alert */}
        {toast && (
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '25px',
            zIndex: 9999,
            background: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#0ea5e9' : '#10b981',
            color: '#fff',
            padding: '0.65rem 1.25rem',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.88rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {toast.type === 'error' ? '⚠️' : '✅'} {toast.text}
          </div>
        )}

        {/* Modal Header with Course and Status info */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span style={{
                background: 'rgba(20, 184, 166, 0.2)',
                color: '#2dd4bf',
                border: '1px solid rgba(20, 184, 166, 0.4)',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <Film style={{ width: '13px', height: '13px' }} /> শিক্ষক ভিডিও স্টুডিও (Teacher Video Studio)
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
                  🟢 ওয়েবসাইটে প্রকাশিত (Live)
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
                  ⏳ এডমিন অনুমোদনের অপেক্ষায় (Pending Approval)
                </span>
              )}
            </div>

            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc', fontWeight: 800 }}>
              {course?.title || 'কোর্স কারিকুলাম ও লেকচার আপলোড'}
            </h2>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              👨‍🏫 কোর্স শিক্ষক: <strong style={{ color: '#38bdf8' }}>{course?.instructor || 'EduFast Instructor'}</strong> • বিভাগ: <strong style={{ color: '#cbd5e1' }}>{course?.group || 'Science'}</strong>
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

        {/* Teacher Scope Notice Banner */}
        <div style={{
          background: 'linear-gradient(90deg, rgba(14, 165, 233, 0.12) 0%, rgba(20, 184, 166, 0.12) 100%)',
          borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
          padding: '0.65rem 1.75rem',
          fontSize: '0.82rem',
          color: '#38bdf8',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>🛡️</span>
          <span>
            <strong>শিক্ষক নিয়ন্ত্রণ:</strong> কোন লেকচারে কি ভিডিও থাকবে তা নির্ধারণ ও সরাসরি আপনার পিসি থেকে আপলোড করার ক্ষমতা শুধুমাত্র আপনারই রয়েছে। এডমিন কেবল কোর্সটি পর্যবেক্ষণ করে পাবলিশ পারমিশন দিবে।
          </span>
        </div>

        {/* Main 2-Column Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.05fr',
          gap: '1.5rem',
          padding: '1.25rem 1.75rem',
          overflowY: 'auto',
          flex: 1
        }}>
          {/* LEFT COLUMN: Upload Video From PC & Lesson Details Form */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{
              margin: '0 0 1rem 0',
              color: '#34d399',
              fontSize: '1rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}>
              <Upload style={{ width: '18px', height: '18px' }} />
              পিসি থেকে ভিডিও আপলোড ও লেকচার তৈরি
            </h3>

            <form onSubmit={handleSaveLesson} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              
              {/* 1. Module Selector / Creator */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.35rem' }}>
                  ১. অধ্যায় / মডিউল নির্বাচন করুন *
                </label>
                
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedModuleMode('existing')}
                    disabled={curriculum.length === 0}
                    style={{
                      flex: 1,
                      padding: '0.35rem',
                      fontSize: '0.75rem',
                      borderRadius: '6px',
                      border: selectedModuleMode === 'existing' ? '1px solid #14b8a6' : '1px solid rgba(255,255,255,0.1)',
                      background: selectedModuleMode === 'existing' ? 'rgba(20, 184, 166, 0.2)' : 'rgba(255,255,255,0.04)',
                      color: selectedModuleMode === 'existing' ? '#2dd4bf' : '#94a3b8',
                      cursor: curriculum.length === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    বিদ্যমান মডিউল ({curriculum.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedModuleMode('new')}
                    style={{
                      flex: 1,
                      padding: '0.35rem',
                      fontSize: '0.75rem',
                      borderRadius: '6px',
                      border: selectedModuleMode === 'new' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                      background: selectedModuleMode === 'new' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
                      color: selectedModuleMode === 'new' ? '#38bdf8' : '#94a3b8',
                      cursor: 'pointer'
                    }}
                  >
                    ➕ নতুন মডিউল তৈরি
                  </button>
                </div>

                {selectedModuleMode === 'existing' && curriculum.length > 0 ? (
                  <select
                    className="admin-select"
                    value={existingModuleSelect}
                    onChange={e => setExistingModuleSelect(e.target.value)}
                    style={{ width: '100%', fontSize: '0.82rem' }}
                  >
                    {curriculum.map((m, idx) => (
                      <option key={idx} value={m.title}>{m.title}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="যেমন: Module 1: বলবিদ্যা ও গতিবিদ্যা"
                    value={newModuleTitle}
                    onChange={e => setNewModuleTitle(e.target.value)}
                    required={selectedModuleMode === 'new' || curriculum.length === 0}
                  />
                )}
              </div>

              {/* 2. Topic Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.35rem' }}>
                  ২. লেকচার / টপিক শিরোনাম *
                </label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="যেমন: Lecture 01: ভেক্টর ডট গুণন ও ক্রান্তীয় বেগ"
                  value={topicTitle}
                  onChange={e => setTopicTitle(e.target.value)}
                  required
                />
              </div>

              {/* 3. Video Source Mode */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.35rem' }}>
                  ৩. ভিডিও সোর্স নির্বাচন করুন *
                </label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => setVideoSourceType('upload')}
                    style={{
                      flex: 1.2,
                      padding: '0.45rem',
                      borderRadius: '6px',
                      border: videoSourceType === 'upload' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                      background: videoSourceType === 'upload' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.04)',
                      color: videoSourceType === 'upload' ? '#34d399' : '#94a3b8',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    💻 পিসি থেকে আপলোড
                  </button>

                  <button
                    type="button"
                    onClick={() => setVideoSourceType('server')}
                    style={{
                      flex: 1,
                      padding: '0.45rem',
                      borderRadius: '6px',
                      border: videoSourceType === 'server' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                      background: videoSourceType === 'server' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
                      color: videoSourceType === 'server' ? '#38bdf8' : '#94a3b8',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🗂️ সার্ভার ভিডিও
                  </button>

                  <button
                    type="button"
                    onClick={() => setVideoSourceType('url')}
                    style={{
                      flex: 0.9,
                      padding: '0.45rem',
                      borderRadius: '6px',
                      border: videoSourceType === 'url' ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                      background: videoSourceType === 'url' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.04)',
                      color: videoSourceType === 'url' ? '#f59e0b' : '#94a3b8',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🔗 অনলাইন লিংক
                  </button>
                </div>
              </div>

              {/* DIRECT PC FILE UPLOAD ZONE */}
              {videoSourceType === 'upload' && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1.5px dashed rgba(16, 185, 129, 0.4)',
                  borderRadius: '10px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399' }}>
                      📂 পিসি থেকে ভিডিও ফাইল বেছে নিন (.mp4, .webm, .mkv)
                    </span>
                    {selectedFile && (
                      <span style={{ fontSize: '0.72rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/mkv,video/quicktime,video/*"
                    onChange={handleFileChange}
                    style={{ fontSize: '0.82rem', color: '#cbd5e1' }}
                  />

                  {/* Video Live Preview Player */}
                  {filePreviewUrl && (
                    <div style={{ marginTop: '0.4rem', borderRadius: '8px', overflow: 'hidden', background: '#000', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', padding: '0.3rem 0.6rem', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>📺 আপলোডের আগে ভিডিও প্রিভিউ দেখুন:</span>
                        <span style={{ color: '#34d399' }}>● প্রস্তুত</span>
                      </div>
                      <video
                        src={filePreviewUrl}
                        controls
                        style={{ width: '100%', maxHeight: '150px', objectFit: 'contain' }}
                      />
                    </div>
                  )}

                  {/* Upload Progress Bar */}
                  {isUploading && (
                    <div style={{ marginTop: '0.4rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#34d399', marginBottom: '0.2rem' }}>
                        <span>ভিডিও আপলোড হচ্ছে এবং ডাটাবেজে সংরক্ষিত হচ্ছে...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #0ea5e9)', transition: 'width 0.2s ease' }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SERVER VIDEOS LIST */}
              {videoSourceType === 'server' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                    সার্ভারের uploads/videos ফোল্ডারের ফাইল সিলেক্ট করুন:
                  </label>
                  <select
                    className="admin-select"
                    style={{ width: '100%', fontSize: '0.82rem' }}
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                  >
                    <option value="">-- ফাইল পছন্দ করুন ({serverVideos.length} টি পাওয়া গেছে) --</option>
                    {serverVideos.map((v, i) => (
                      <option key={i} value={v.videoUrl}>
                        {v.filename} ({v.sizeMB} MB)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* DIRECT URL INPUT */}
              {videoSourceType === 'url' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                    ভিডিও URL / YouTube Link
                  </label>
                  <input
                    type="url"
                    className="admin-input"
                    placeholder="https://...mp4 বা YouTube Link"
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                  />
                </div>
              )}

              {/* Duration and Notes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>
                    সময়কাল (Duration)
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. 24:30"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>
                    হ্যান্ডনোট / PDF শিট
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. lecture_01.pdf"
                    value={lectureNotesUrl}
                    onChange={e => setLectureNotesUrl(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isUploading}
                className="admin-btn"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  borderRadius: '8px',
                  border: 'none',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                  marginTop: '0.5rem'
                }}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="animate-spin" style={{ width: '16px', height: '16px' }} />
                    ভিডিও আপলোড হচ্ছে... {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Upload style={{ width: '16px', height: '16px' }} />
                    লেকচার ও ভিডিও আপলোড করুন (Save to DB)
                  </>
                )}
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN: Current Curriculum & Video Lectures List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Video style={{ width: '18px', height: '18px', color: '#38bdf8' }} />
                  বর্তমান কারিকুলাম ও ভিডিও লেকচার তালিকা
                </h3>
                <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                  মোট {curriculum.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)} টি লেকচার ডাটাবেজে রয়েছে
                </span>
              </div>

              <button
                type="button"
                onClick={fetchData}
                style={{
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  color: '#38bdf8',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
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

            {/* Video Player Modal overlay if teacher clicked to watch */}
            {activePreviewVideo && (
              <div style={{
                background: '#000',
                borderRadius: '12px',
                padding: '0.75rem',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                position: 'relative',
                boxShadow: '0 8px 30px rgba(0,0,0,0.6)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#38bdf8', fontSize: '0.82rem', fontWeight: 700 }}>
                    ▶ প্লেয়ার প্রিভিউ: {activePreviewVideo.title}
                  </span>
                  <button
                    onClick={() => setActivePreviewVideo(null)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '1rem', cursor: 'pointer', fontWeight: 800 }}
                  >
                    ✕ বন্ধ করুন
                  </button>
                </div>
                <video
                  src={getFullVideoUrl(activePreviewVideo.videoUrl)}
                  controls
                  autoPlay
                  style={{ width: '100%', maxHeight: '220px', borderRadius: '8px', objectFit: 'contain' }}
                />
              </div>
            )}

            {/* Modules and Lessons list */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                <RefreshCw className="animate-spin" style={{ width: '24px', height: '24px', margin: '0 auto 0.5rem auto', color: '#38bdf8' }} />
                কারিকুলাম ডাটা লোড হচ্ছে...
              </div>
            ) : curriculum.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3.5rem 1.5rem',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '12px',
                border: '1px dashed rgba(255,255,255,0.1)'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎬</div>
                <h4 style={{ margin: '0 0 0.35rem 0', color: '#f8fafc', fontSize: '1rem' }}>
                  এখনও কোনো ভিডিও লেকচার যুক্ত করা হয়নি
                </h4>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5 }}>
                  বামের ফর্ম থেকে অধ্যায়ের নাম লিখুন এবং আপনার কম্পিউটার থেকে ভিডিও ফাইল আপলোড করে কোর্সের কারিকুলাম সাজান।
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '500px', overflowY: 'auto' }}>
                {curriculum.map((mod, mIdx) => (
                  <div
                    key={mIdx}
                    style={{
                      background: 'rgba(30, 41, 59, 0.45)',
                      borderRadius: '10px',
                      padding: '0.85rem 1rem',
                      border: '1px solid rgba(255,255,255,0.07)'
                    }}
                  >
                    <div style={{
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      color: '#38bdf8',
                      marginBottom: '0.65rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>📌 {mod.title}</span>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                        {mod.lessons?.length || 0} টি লেকচার
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
                            background: 'rgba(15, 23, 42, 0.7)',
                            padding: '0.6rem 0.85rem',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.05)'
                          }}
                        >
                          <div style={{ flex: 1, marginRight: '0.75rem' }}>
                            <div style={{ color: '#f8fafc', fontSize: '0.84rem', fontWeight: 600 }}>
                              {lIdx + 1}. {les.title}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span>⏱️ {les.duration}</span>
                              <span>•</span>
                              <span style={{
                                color: les.videoSourceType === 'local' || (les.videoUrl && les.videoUrl.startsWith('/uploads')) ? '#34d399' : '#38bdf8',
                                background: 'rgba(255,255,255,0.04)',
                                padding: '0.1rem 0.35rem',
                                borderRadius: '4px'
                              }}>
                                {les.videoSourceType === 'local' || (les.videoUrl && les.videoUrl.startsWith('/uploads')) ? '📁 পিসি আপলোডেড ভিডিও' : '🔗 অনলাইন ভিডিও'}
                              </span>
                              {les.sheetUrl && (
                                <>
                                  <span>•</span>
                                  <span style={{ color: '#fbbf24' }}>📄 নোটস সংযুক্ত</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => setActivePreviewVideo(les)}
                              style={{
                                background: 'rgba(56, 189, 248, 0.15)',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                color: '#38bdf8',
                                padding: '0.3rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                              title="ভিডিওটি প্লে করে দেখুন"
                            >
                              <Play style={{ width: '11px', height: '11px' }} /> প্লে করুন
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteLesson(les.id)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#f87171',
                                padding: '0.3rem 0.5rem',
                                borderRadius: '6px',
                                fontSize: '0.74rem',
                                cursor: 'pointer'
                              }}
                              title="মুছে ফেলুন"
                            >
                              <Trash2 style={{ width: '13px', height: '13px' }} />
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
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1rem 1.75rem',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(15, 23, 42, 0.85)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            💡 শিক্ষক হিসেবে আপলোড সম্পন্ন হলে এডমিন প্যানেল থেকে কোর্স পাবলিশের পারমিশন প্রদান করা যাবে।
          </div>

          <button
            type="button"
            onClick={onClose}
            className="admin-btn admin-btn-secondary"
            style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem', fontWeight: 600 }}
          >
            সম্পন্ন (Done)
          </button>
        </div>
      </div>
    </div>
  );
}
