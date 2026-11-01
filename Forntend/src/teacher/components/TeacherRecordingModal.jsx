import React, { useState } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getCustomServerUrl } from '../../services/api';
import { formatYouTubeEmbedUrl, isYouTubeUrl } from '../../services/videoHelper';

export default function TeacherRecordingModal({
  isOpen,
  onClose,
  editingRecordingId,
  recordingFormData,
  setRecordingFormData,
  handleSaveRecording,
  theme
}) {
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(''); // '', 'success', 'local_fallback', 'error'

  if (!isOpen) return null;

  const handleVideoFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingVideo(true);
    setUploadProgress(20);
    setUploadStatus('uploading');

    const fileNameNoExt = file.name.replace(/\.[^/.]+$/, "");
    setRecordingFormData(prev => ({
      ...prev,
      uploadedFileName: file.name,
      title: prev.title || fileNameNoExt
    }));

    try {
      const formData = new FormData();
      formData.append('video', file);

      const serverUrl = getCustomServerUrl();
      setUploadProgress(45);

      const res = await fetch(`${serverUrl}/api/upload/video`, {
        method: 'POST',
        body: formData
      });

      setUploadProgress(85);
      const result = await res.json();

      if (result.success && result.data) {
        // Store the permanent server streaming URL so any student on any tab/device can stream it
        const finalUrl = result.data.fullUrl || `${serverUrl}${result.data.videoUrl}`;
        setRecordingFormData(prev => ({
          ...prev,
          videoUrl: finalUrl,
          uploadedFileName: file.name,
          videoUploaded: true,
          status: 'ready'
        }));
        setUploadProgress(100);
        setUploadStatus('success');
      } else {
        throw new Error(result.error || 'ভিডিও আপলোড ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.warn('Backend video upload notice, using fallback:', err);
      const localUrl = URL.createObjectURL(file);
      setRecordingFormData(prev => ({
        ...prev,
        videoUrl: localUrl,
        uploadedFileName: file.name,
        videoUploaded: true,
        status: 'ready'
      }));
      setUploadStatus('local_fallback');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleDocumentFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('document', file);

      const serverUrl = getCustomServerUrl();
      const res = await fetch(`${serverUrl}/api/upload/document`, {
        method: 'POST',
        body: formData
      });
      const result = await res.json();
      if (result.success && result.data) {
        const finalDocUrl = result.data.fullUrl || `${serverUrl}${result.data.documentUrl}`;
        setRecordingFormData(prev => ({ ...prev, sheetUrl: finalDocUrl }));
      } else {
        setRecordingFormData(prev => ({ ...prev, sheetUrl: file.name }));
      }
    } catch (err) {
      setRecordingFormData(prev => ({ ...prev, sheetUrl: file.name }));
    } finally {
      setIsUploadingDoc(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '540px',
          backgroundColor: theme.modalBg,
          color: theme.text,
          border: `1px solid ${theme.modalBorder}`,
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: theme.text, fontWeight: 800 }}>
            {editingRecordingId ? 'Edit Class Recording' : 'Upload New Class Recording'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted }}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        <form onSubmit={handleSaveRecording}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
              Class Title *
            </label>
            <input
              type="text"
              value={recordingFormData.title}
              onChange={e => setRecordingFormData({ ...recordingFormData, title: e.target.value })}
              placeholder="e.g.: Higher Math: Matrix & Determinants Crash Course"
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
                Group
              </label>
              <select
                value={recordingFormData.group}
                onChange={e => setRecordingFormData({ ...recordingFormData, group: e.target.value })}
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
                Duration
              </label>
              <input
                type="text"
                value={recordingFormData.duration}
                onChange={e => setRecordingFormData({ ...recordingFormData, duration: e.target.value })}
                placeholder="e.g. 50 Minutes"
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

          {/* Video Selection: Direct File Upload from PC or Web URL */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: theme.textSecondary }}>
              📹 রেকর্ড করা ভিডিও ফাইল নির্বাচন করুন (Select from PC) *
            </label>
            
            <div style={{
              border: `2px dashed ${theme.inputBorder || '#cbd5e1'}`,
              borderRadius: '8px',
              padding: '1.25rem 1rem',
              backgroundColor: theme.bgSecondary || 'rgba(0,0,0,0.02)',
              textAlign: 'center',
              marginBottom: '0.75rem',
              cursor: isUploadingVideo ? 'wait' : 'pointer'
            }}>
              <input
                type="file"
                id="pc-video-upload"
                accept="video/mp4,video/webm,video/mkv,video/*"
                style={{ display: 'none' }}
                disabled={isUploadingVideo}
                onChange={handleVideoFileSelect}
              />
              <label htmlFor="pc-video-upload" style={{ cursor: isUploadingVideo ? 'wait' : 'pointer', display: 'block' }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>💻 ⬆️</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-teal, #319795)' }}>
                  {recordingFormData.uploadedFileName
                    ? `📁 নির্বাচিত: ${recordingFormData.uploadedFileName}`
                    : 'পিসি থেকে ভিডিও ফাইল বেছে নিন (Click to Browse)'}
                </div>
                <span style={{ fontSize: '0.75rem', color: theme.textMuted || '#94a3b8' }}>
                  সাপোর্টেড ফরম্যাট: .mp4, .webm, .mkv (OBS/রেকর্ডেড ভিডিও)
                </span>
              </label>

              {/* Upload Progress Bar */}
              {isUploadingVideo && (
                <div style={{ marginTop: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem', color: 'var(--primary-teal)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                      <Loader2 style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} /> সার্ভারে স্থায়ীভাবে আপলোড হচ্ছে...
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${uploadProgress}%`, backgroundColor: 'var(--primary-teal)', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              )}

              {/* Upload Success Badge */}
              {!isUploadingVideo && uploadStatus === 'success' && (
                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#16a34a', fontSize: '0.82rem', fontWeight: 700 }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                  <span>সার্ভারে সফলভাবে সেভ হয়েছে! সকল স্টুডেন্ট এটি দেখতে পারবে।</span>
                </div>
              )}
            </div>

            {/* Alternative Direct URL / YouTube Link */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>অথবা সরাসরি ভিডিও লিংক / ইউটিউব:</span>
              {isYouTubeUrl(recordingFormData.videoUrl) && (
                <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CheckCircle2 style={{ width: '12px', height: '12px' }} /> YouTube Embed Ready
                </span>
              )}
            </div>
            <input
              type="text"
              value={recordingFormData.videoUrl}
              onChange={e => {
                let val = e.target.value;
                if (isYouTubeUrl(val)) {
                  val = formatYouTubeEmbedUrl(val, true);
                }
                setRecordingFormData({ ...recordingFormData, videoUrl: val, uploadedFileName: '' });
              }}
              placeholder="e.g. https://www.youtube.com/watch?v=... or https://...mp4"
              className="form-input"
              style={{
                width: '100%',
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.inputText,
                fontSize: '0.85rem'
              }}
              required
            />
          </div>

          {/* Lecture Sheet File Upload from PC or URL */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
              📄 লেকচার শিট (PDF / Sheet from PC)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={recordingFormData.sheetUrl}
                onChange={e => setRecordingFormData({ ...recordingFormData, sheetUrl: e.target.value })}
                placeholder="e.g. physics_vector_shortcuts.pdf or URL"
                className="form-input"
                style={{
                  flex: 1,
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.inputText,
                  fontSize: '0.85rem'
                }}
              />
              <label
                htmlFor="pc-sheet-upload"
                className="btn btn-secondary"
                style={{ cursor: isUploadingDoc ? 'wait' : 'pointer', padding: '0.45rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                {isUploadingDoc ? <Loader2 style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} /> : '📎 ফাইল'}
              </label>
              <input
                type="file"
                id="pc-sheet-upload"
                accept=".pdf,.doc,.docx"
                style={{ display: 'none' }}
                disabled={isUploadingDoc}
                onChange={handleDocumentFileSelect}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: theme.textSecondary }}>
              Lecture Description & Topics Covered
            </label>
            <textarea
              rows={3}
              value={recordingFormData.description}
              onChange={e => setRecordingFormData({ ...recordingFormData, description: e.target.value })}
              placeholder="Provide key notes, highlights, or tips for students..."
              className="form-input"
              style={{
                width: '100%',
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.inputText
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isUploadingVideo}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-teal"
              disabled={isUploadingVideo}
              style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {isUploadingVideo ? (
                <>
                  <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                  আপলোড হচ্ছে...
                </>
              ) : (
                editingRecordingId ? 'Save Changes' : 'Upload Recording'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
