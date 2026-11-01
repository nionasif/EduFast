/**
 * Live WebRTC Broadcasting & Viewer Service
 * Connects teacher's live camera and microphone stream to all viewing students
 * using robust WebRTC PeerConnections with candidate queueing, dynamic renegotiation,
 * and reliable ontrack stream binding.
 */

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' }
];

export function createTeacherBroadcaster({ socket, getLocalStream, onViewerCountChange }) {
  const peers = new Map(); // studentSocketId -> { pc, candidateQueue: [] }
  const pendingViewers = new Set(); // studentSocketIds waiting for local stream to become ready

  const notifyViewerCount = () => {
    if (typeof onViewerCountChange === 'function') {
      onViewerCountChange(peers.size);
    }
  };

  const initiatePeerConnection = async (socketId, studentName = 'Student') => {
    const stream = getLocalStream();
    if (!stream) {
      console.log('[WebRTC Teacher] Stream not ready yet for viewer, queuing:', socketId);
      pendingViewers.add(socketId);
      return;
    }
    pendingViewers.delete(socketId);

    try {
      // Close previous connection to this viewer if any exists
      if (peers.has(socketId)) {
        try { peers.get(socketId).pc.close(); } catch {}
        peers.delete(socketId);
      }

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      const peerData = { pc, candidateQueue: [] };
      peers.set(socketId, peerData);
      notifyViewerCount();

      // Add all tracks (audio & video)
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc:signal', {
            to: socketId,
            type: 'candidate',
            signal: event.candidate
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`[WebRTC Teacher] Connection state for ${socketId}:`, pc.connectionState);
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          peers.delete(socketId);
          notifyViewerCount();
        }
      };

      const offer = await pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false
      });
      await pc.setLocalDescription(offer);

      socket.emit('webrtc:signal', {
        to: socketId,
        type: 'offer',
        signal: offer
      });
      console.log('[WebRTC Teacher] Sent offer to viewer:', socketId);
    } catch (err) {
      console.warn('[WebRTC Teacher] Error setting up broadcaster for:', studentName, err);
    }
  };

  const handleViewerJoined = async ({ socketId, studentName }) => {
    if (!socketId) return;
    await initiatePeerConnection(socketId, studentName);
  };

  const handleSignal = async ({ from, type, signal }) => {
    const peerData = peers.get(from);
    if (!peerData) return;
    const { pc, candidateQueue } = peerData;

    try {
      if (type === 'answer') {
        if (pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          console.log('[WebRTC Teacher] Applied answer from:', from);

          // Drain queued candidates if any arrived early
          while (candidateQueue.length > 0) {
            const queuedCand = candidateQueue.shift();
            try {
              await pc.addIceCandidate(new RTCIceCandidate(queuedCand));
            } catch (e) {
              console.warn('[WebRTC Teacher] Error adding queued candidate:', e);
            }
          }
        }
      } else if (type === 'candidate' && signal) {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(signal));
        } else {
          candidateQueue.push(signal);
        }
      }
    } catch (err) {
      console.warn('[WebRTC Teacher] Error handling signal from viewer:', err);
    }
  };

  const updateTracks = (newStream) => {
    if (!newStream) return;

    // First: connect any pending viewers that joined before stream was ready
    if (pendingViewers.size > 0) {
      const viewerList = Array.from(pendingViewers);
      viewerList.forEach(vid => {
        initiatePeerConnection(vid);
      });
    }

    // Second: update tracks on existing peers
    peers.forEach(({ pc }) => {
      try {
        const senders = pc.getSenders();
        newStream.getTracks().forEach(track => {
          const sender = senders.find(s => s.track && s.track.kind === track.kind);
          if (sender) {
            sender.replaceTrack(track);
          } else {
            pc.addTrack(track, newStream);
          }
        });
      } catch (e) {
        console.warn('[WebRTC Teacher] Error updating peer tracks:', e);
      }
    });
  };

  const broadcastToAllPending = () => {
    if (pendingViewers.size > 0) {
      const viewerList = Array.from(pendingViewers);
      viewerList.forEach(vid => {
        initiatePeerConnection(vid);
      });
    }
  };

  const closeAllPeers = () => {
    peers.forEach(({ pc }) => {
      try { pc.close(); } catch {}
    });
    peers.clear();
    pendingViewers.clear();
    notifyViewerCount();
  };

  return {
    handleViewerJoined,
    handleSignal,
    updateTracks,
    broadcastToAllPending,
    closeAllPeers,
    getPeersCount: () => peers.size
  };
}

export function createStudentViewer({ socket, sessionId, studentName, onRemoteStream, onConnectionStateChange }) {
  let pc = null;
  let remoteStream = new MediaStream();
  let candidateQueue = [];

  const requestStream = () => {
    try {
      socket.emit('webrtc:viewer_join', {
        sessionId,
        studentName: studentName || 'Student'
      });
      console.log('[WebRTC Student] Sent viewer_join to teacher');
    } catch (e) {
      console.warn('[WebRTC Student] Error emitting viewer join:', e);
    }
  };

  const handleSignal = async ({ from, type, signal }) => {
    try {
      if (type === 'offer') {
        console.log('[WebRTC Student] Received offer from teacher:', from);
        if (pc) {
          try { pc.close(); } catch {}
        }

        candidateQueue = [];
        remoteStream = new MediaStream();
        pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        pc.ontrack = (event) => {
          console.log('[WebRTC Student] ontrack event fired:', event.track.kind, event.track.id);
          if (event.streams && event.streams[0]) {
            remoteStream = event.streams[0];
          } else {
            // If stream is not grouped by browser, add track directly
            if (!remoteStream.getTracks().some(t => t.id === event.track.id)) {
              remoteStream.addTrack(event.track);
            }
          }

          const broadcastStreamUpdate = () => {
            if (typeof onRemoteStream === 'function' && remoteStream) {
              const freshTracks = remoteStream.getTracks();
              onRemoteStream(new MediaStream(freshTracks));
            }
          };

          event.track.onunmute = () => {
            console.log('[WebRTC Student] track unmuted:', event.track.kind);
            broadcastStreamUpdate();
          };

          event.track.onended = () => {
            console.log('[WebRTC Student] track ended:', event.track.kind);
            broadcastStreamUpdate();
          };

          broadcastStreamUpdate();
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('webrtc:signal', {
              to: from,
              type: 'candidate',
              signal: event.candidate
            });
          }
        };

        pc.onconnectionstatechange = () => {
          console.log('[WebRTC Student] Connection state:', pc.connectionState);
          if (typeof onConnectionStateChange === 'function') {
            onConnectionStateChange(pc.connectionState);
          }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        console.log('[WebRTC Student] Set remote description successfully');

        // Drain any ICE candidates received before remote description was ready
        while (candidateQueue.length > 0) {
          const queuedCand = candidateQueue.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(queuedCand));
          } catch (e) {
            console.warn('[WebRTC Student] Error adding queued candidate:', e);
          }
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('webrtc:signal', {
          to: from,
          type: 'answer',
          signal: answer
        });
        console.log('[WebRTC Student] Sent answer back to teacher');
      } else if (type === 'candidate' && signal) {
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(signal));
        } else {
          candidateQueue.push(signal);
        }
      }
    } catch (err) {
      console.warn('[WebRTC Student] Error handling signal from teacher:', err);
    }
  };

  const cleanup = () => {
    if (pc) {
      try { pc.close(); } catch {}
      pc = null;
    }
    candidateQueue = [];
    remoteStream = null;
  };

  return {
    requestStream,
    handleSignal,
    cleanup,
    getStream: () => remoteStream
  };
}
