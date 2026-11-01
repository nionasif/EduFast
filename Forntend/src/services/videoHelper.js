/**
 * Video Helper Utility for EduFast
 * Supports both Direct PC uploaded files and YouTube streams disguised as native player
 */

import { getCustomServerUrl } from './api';

/**
 * Checks if a string contains or represents a YouTube video
 */
export const isYouTubeUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim().toLowerCase();
  if (clean.includes('youtube.com') || clean.includes('youtu.be')) return true;
  // If it's a raw 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return true;
  return false;
};

/**
 * Extracts YouTube Video ID from any format:
 * - https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * - https://youtu.be/dQw4w9WgXcQ
 * - https://www.youtube.com/live/dQw4w9WgXcQ
 * - https://www.youtube.com/shorts/dQw4w9WgXcQ
 * - https://www.youtube.com/embed/dQw4w9WgXcQ
 * - <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"...></iframe>
 * - Raw 11-character video ID (e.g. dQw4w9WgXcQ)
 */
export const extractYouTubeId = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // 1. Direct 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // 2. Standard URL formats (watch, embed, v, live, shorts, youtu.be)
  const mainRegExp = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+?&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/;
  const mainMatch = trimmed.match(mainRegExp);
  if (mainMatch && mainMatch[1]) {
    return mainMatch[1];
  }

  // 3. Any query parameter with v=
  const vParamMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (vParamMatch && vParamMatch[1]) {
    return vParamMatch[1];
  }

  // 4. In case iframe embed code was pasted
  const iframeMatch = trimmed.match(/src=["'](?:https?:)?\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (iframeMatch && iframeMatch[1]) {
    return iframeMatch[1];
  }

  return '';
};

/**
 * Formats YouTube URL into standard, universally supported YouTube Embed link
 * Uses https://www.youtube.com/embed/ which works seamlessly across all devices & browsers
 */
export const formatYouTubeEmbedUrl = (url, autoplay = false) => {
  if (!url) return '';
  const videoId = extractYouTubeId(url);
  if (!videoId) return url;

  // Clean parameters that guarantee reliable cross-platform playback
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    controls: '1'
  });

  if (autoplay) {
    params.set('autoplay', '1');
    params.set('mute', '1'); // Chrome requires mute for autoplay
  } else {
    params.set('autoplay', '0');
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    params.set('origin', window.location.origin);
  }

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};

/**
 * Resolves any video URL (Local server upload vs Direct URL vs YouTube)
 */
export const resolveVideoSource = (url) => {
  if (!url) {
    return {
      type: 'direct',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      isYouTube: false
    };
  }

  const trimmed = url.trim();

  if (isYouTubeUrl(trimmed)) {
    const videoId = extractYouTubeId(trimmed);
    return {
      type: 'youtube',
      url: formatYouTubeEmbedUrl(trimmed, false),
      rawUrl: trimmed,
      videoId: videoId,
      isYouTube: true
    };
  }

  // Local server uploaded file (e.g. /uploads/videos/xyz.mp4)
  if (trimmed.startsWith('/uploads')) {
    const serverUrl = getCustomServerUrl() || 'http://localhost:5000';
    return {
      type: 'direct',
      url: `${serverUrl}${trimmed}`,
      rawUrl: trimmed,
      isYouTube: false
    };
  }

  return {
    type: 'direct',
    url: trimmed,
    rawUrl: trimmed,
    isYouTube: false
  };
};
