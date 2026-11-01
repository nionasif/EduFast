import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom Hook: useLiveMediaStream
 * Automatically detects and initializes teacher's camera and microphone
 * when entering live broadcast, provides real-time audio VU levels,
 * device enumeration, screen sharing, and graceful fallback.
 */
export default function useLiveMediaStream({ autoStart = false } = {}) {
  const [stream, setStream] = useState(null);
  const streamRef = useRef(null);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const [isDetecting, setIsDetecting] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [mediaSuccess, setMediaSuccess] = useState(false);

  // Audio level (0 - 100) for real-time voice meter
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // Detected devices list
  const [devices, setDevices] = useState({
    audioInputs: [],
    videoInputs: []
  });
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState('');
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState('');

  // Video element ref (attached to local webcam view)
  const videoRef = useRef(null);

  // Screen share stream & ref (attached to central presentation deck)
  const screenStreamRef = useRef(null);
  const [screenStream, setScreenStream] = useState(null);
  const screenVideoRef = useRef(null);

  // Enumerate hardware devices
  const updateDeviceList = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return;
    }
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(d => d.kind === 'audioinput');
      const videoInputs = allDevices.filter(d => d.kind === 'videoinput');
      setDevices({ audioInputs, videoInputs });

      if (audioInputs.length > 0 && !selectedAudioDeviceId) {
        setSelectedAudioDeviceId(audioInputs[0].deviceId);
      }
      if (videoInputs.length > 0 && !selectedVideoDeviceId) {
        setSelectedVideoDeviceId(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.warn('Device enumeration notice:', err);
    }
  }, [selectedAudioDeviceId, selectedVideoDeviceId]);

  // Setup Web Audio Analyser for VU sound level
  const setupAudioAnalyser = useCallback((audioStream) => {
    try {
      if (!audioStream) return;
      const audioTrack = audioStream.getAudioTracks()[0];
      if (!audioTrack) return;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioCtx();
      } else if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      const audioCtx = audioContextRef.current;
      const source = audioCtx.createMediaStreamSource(audioStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!analyserRef.current || !streamRef.current) {
          setAudioLevel(0);
          return;
        }

        const currentAudioTrack = streamRef.current.getAudioTracks()[0];
        if (!currentAudioTrack || !currentAudioTrack.enabled) {
          setAudioLevel(0);
          animFrameRef.current = requestAnimationFrame(checkVolume);
          return;
        }

        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        // Normalize 0 - 100
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(checkVolume);
    } catch (err) {
      console.warn('Audio analyser notice:', err);
    }
  }, []);

  // Cleanup helper
  const stopStream = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch {}
      });
      screenStreamRef.current = null;
    }

    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }
    setScreenStream(null);

    setStream(null);
    setAudioLevel(0);
    setIsScreenSharing(false);
    setMediaSuccess(false);
  }, []);

  // Primary function: Automatically detect and acquire camera and mic
  const startStream = useCallback(async ({
    audioDeviceId = selectedAudioDeviceId,
    videoDeviceId = selectedVideoDeviceId,
    targetMicOn = true,
    targetCamOn = true
  } = {}) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMediaError('আপনার ব্রাউজারে ক্যামেরা বা মাইক্রোফোন সাপোর্ট নেই (WebRTC MediaDevices not supported)');
      return null;
    }

    setIsDetecting(true);
    setMediaError(null);

    // Stop existing stream first to avoid device lock
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => {
        try { t.stop(); } catch {}
      });
      streamRef.current = null;
    }

    const videoConstraints = videoDeviceId
      ? { deviceId: { exact: videoDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
      : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' };

    const audioConstraints = audioDeviceId
      ? { deviceId: { exact: audioDeviceId }, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      : { echoCancellation: true, noiseSuppression: true, autoGainControl: true };

    let mediaStream = null;
    let warningNotice = null;

    // 1. Try requesting BOTH video and audio
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: audioConstraints
      });
    } catch (errCombined) {
      console.warn('Combined media request failed, attempting individual fallbacks:', errCombined.name, errCombined.message);

      // 2. Fallback: Try Video only (maybe mic is missing or busy)
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false
        });
        warningNotice = 'ক্যামেরা ডিটেক্ট হয়েছে, তবে মাইক্রোফোন পাওয়া যায়নি।';
      } catch (errVideoOnly) {
        // 3. Fallback: Try Audio only (maybe webcam is missing or busy)
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: audioConstraints
          });
          warningNotice = 'মাইক্রোফোন ডিটেক্ট হয়েছে, তবে ক্যামেরা পাওয়া যায়নি।';
        } catch (errAudioOnly) {
          // Both failed
          console.error('All media device requests failed:', errAudioOnly);
          let userMsg = 'ক্যামেরা ও মাইক্রোফোন ডিটেক্ট করা সম্ভব হয়নি।';
          if (errCombined.name === 'NotAllowedError' || errCombined.name === 'PermissionDeniedError') {
            userMsg = 'ক্যামেরা ও মাইক্রোফোনের অনুমতি (Permission) ব্রাউজারে ব্লক করা আছে। ব্রাউজার অ্যাড্রেস বারের ক্যামেরা/লক আইকনে ক্লিক করে Allow করুন।';
          } else if (errCombined.name === 'NotFoundError' || errCombined.name === 'DevicesNotFoundError') {
            userMsg = 'আপনার ডিভাইসে কোনো ক্যামেরা বা মাইক্রোফোন পাওয়া যায়নি। ডিভাইস প্লাগ-ইন চেক করুন।';
          } else if (errCombined.name === 'NotReadableError' || errCombined.name === 'TrackStartError') {
            userMsg = 'ক্যামেরা বা মাইক্রোফোন অন্য কোনো অ্যাপ ব্যবহার করছে। অনুগ্রহ করে অন্য অ্যাপ বন্ধ করে আবার চেষ্টা করুন।';
          }
          setMediaError(userMsg);
          setIsDetecting(false);
          return null;
        }
      }
    }

    if (!mediaStream) {
      setIsDetecting(false);
      return null;
    }

    // Configure track enabled states
    const videoTrack = mediaStream.getVideoTracks()[0];
    const audioTrack = mediaStream.getAudioTracks()[0];

    if (videoTrack) {
      videoTrack.enabled = targetCamOn;
      setIsCamOn(targetCamOn);
    } else {
      setIsCamOn(false);
    }

    if (audioTrack) {
      audioTrack.enabled = targetMicOn;
      setIsMicOn(targetMicOn);
    } else {
      setIsMicOn(false);
    }

    streamRef.current = mediaStream;
    setStream(mediaStream);
    setMediaSuccess(true);
    if (warningNotice) {
      setMediaError(warningNotice);
    } else {
      setMediaError(null);
    }
    setIsDetecting(false);

    // Attach to video DOM element
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch(() => {});
    }

    // Setup Audio Analyser
    if (audioTrack) {
      setupAudioAnalyser(mediaStream);
    }

    // Refresh device list now that permissions are granted (labels are now readable!)
    updateDeviceList();

    return mediaStream;
  }, [selectedAudioDeviceId, selectedVideoDeviceId, setupAudioAnalyser, updateDeviceList]);

  // Keep videoRef synced when stream or video element updates
  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [stream]);

  // Listen for device plug/unplug events
  useEffect(() => {
    updateDeviceList();
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      const handleDeviceChange = () => {
        updateDeviceList();
      };
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      };
    }
  }, [updateDeviceList]);

  // Auto-start on mount if requested
  useEffect(() => {
    if (autoStart) {
      startStream();
    }
    return () => {
      stopStream();
    };
  }, [autoStart, startStream, stopStream]);

  // Toggle Microphone
  const toggleMic = useCallback(() => {
    if (!streamRef.current) {
      // Re-initialize stream with mic on
      startStream({ targetMicOn: true, targetCamOn: isCamOn });
      return;
    }
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      const nextState = !audioTrack.enabled;
      audioTrack.enabled = nextState;
      setIsMicOn(nextState);
    } else {
      // Stream lacks audio track, restart stream with audio
      startStream({ targetMicOn: true, targetCamOn: isCamOn });
    }
  }, [isCamOn, startStream]);

  // Toggle Camera
  const toggleCam = useCallback(() => {
    if (!streamRef.current) {
      // Re-initialize stream with cam on
      startStream({ targetMicOn: isMicOn, targetCamOn: true });
      return;
    }
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      const nextState = !videoTrack.enabled;
      videoTrack.enabled = nextState;
      setIsCamOn(nextState);
    } else {
      // Stream lacks video track, restart stream with video
      startStream({ targetMicOn: isMicOn, targetCamOn: true });
    }
  }, [isMicOn, startStream]);

  // Stop screen share helper
  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch {}
      });
      screenStreamRef.current = null;
    }
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }
    setScreenStream(null);
    setIsScreenSharing(false);
  }, []);

  // Screen Sharing (Dual-Stream: Webcam stays alive, Screen stream goes to central deck)
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      stopScreenShare();
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert('আপনার ব্রাউজারে স্ক্রিন শেয়ার ফিচারটি সাপোর্ট করে না।');
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always', frameRate: { ideal: 30 } },
        audio: true
      });

      screenStreamRef.current = displayStream;
      setScreenStream(displayStream);
      setIsScreenSharing(true);

      const screenVideoTrack = displayStream.getVideoTracks()[0];
      if (screenVideoTrack) {
        screenVideoTrack.onended = () => {
          stopScreenShare();
        };
      }

      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = displayStream;
        screenVideoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Screen sharing cancelled or failed:', err);
    }
  }, [isScreenSharing, stopScreenShare]);

  // Ensure screenVideoRef is bound whenever screenStream changes
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
      screenVideoRef.current.play().catch(() => {});
    }
  }, [screenStream]);

  // Switch specific device
  const switchCamera = useCallback((deviceId) => {
    setSelectedVideoDeviceId(deviceId);
    startStream({ videoDeviceId: deviceId, targetMicOn: isMicOn, targetCamOn: isCamOn });
  }, [isCamOn, isMicOn, startStream]);

  const switchMicrophone = useCallback((deviceId) => {
    setSelectedAudioDeviceId(deviceId);
    startStream({ audioDeviceId: deviceId, targetMicOn: isMicOn, targetCamOn: isCamOn });
  }, [isCamOn, isMicOn, startStream]);

  return {
    stream,
    streamRef,
    videoRef,
    screenStream,
    screenStreamRef,
    screenVideoRef,
    stopScreenShare,
    isMicOn,
    setIsMicOn,
    isCamOn,
    setIsCamOn,
    isScreenSharing,
    setIsScreenSharing,
    isDetecting,
    mediaError,
    mediaSuccess,
    audioLevel,
    devices,
    selectedAudioDeviceId,
    selectedVideoDeviceId,
    startStream,
    stopStream,
    toggleMic,
    toggleCam,
    toggleScreenShare,
    switchCamera,
    switchMicrophone,
    retryDetection: () => startStream({ targetMicOn: true, targetCamOn: true })
  };
}
