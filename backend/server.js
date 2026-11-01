require('dotenv').config();

// Prevent process exit on unhandled errors or rejected promises
process.on('uncaughtException', (err) => {
  console.error('[CRASH_PREVENTED] Uncaught Exception:', err?.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[CRASH_PREVENTED] Unhandled Promise Rejection:', reason?.message || reason);
});

const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path');
const { initDb, getDb } = require('./config/db');


// Route Handlers
const authRoutes = require('./routes/authRoutes');
const scraperRoutes = require('./routes/scraperRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const questionRoutes = require('./routes/questionRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const dataRoutes = require('./routes/dataRoutes');
const aiRoutes = require('./routes/aiRoutes');
const courseRoutes = require('./routes/courseRoutes');
const testRoutes = require('./routes/testRoutes');
const universityRoutes = require('./routes/universityRoutes');
const liveRoutes = require('./routes/liveRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const higherStudyRoutes = require('./routes/higherStudyRoutes');
const mlPredictorRoutes = require('./routes/mlPredictorRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const noticeRoutes = require('./routes/noticeRoutes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Global Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve Static Uploads (Videos, Documents, PDFs)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize Socket.io Server attached to HTTP server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Attach io to express app so routes can broadcast updates if needed
app.set('io', io);

// Mount Modular API Routes
app.use(authRoutes);
app.use(scraperRoutes);
app.use(studentRoutes);
app.use(adminRoutes);
app.use(questionRoutes);
app.use(uploadRoutes);
app.use(dataRoutes);
app.use(aiRoutes);
app.use(courseRoutes);
app.use(testRoutes);
app.use(universityRoutes);
app.use(liveRoutes);
app.use(teacherRoutes);
app.use(mentorRoutes);
app.use(paymentRoutes);
app.use(higherStudyRoutes);
app.use(mlPredictorRoutes);
app.use(promotionRoutes);
app.use(noticeRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Real-time active live class REST status
app.get('/api/live/active', (req, res) => {
  res.json({ success: true, activeLiveClass });
});

// -------------------------------------------------------------
// REAL-TIME SOCKET.IO ENGINE (Live Classes, Whiteboard & Chat)
// -------------------------------------------------------------
const activeUsers = new Map();
let activeLiveClass = null;
let activePoll = null;
let activeMediaStatus = { isCamOn: true, isMicOn: true, isScreenSharing: false };

// Real-Time Live Classroom Active Viewers Tracking
const liveClassViewers = new Map(); // socket.id -> { sessionId, studentName, studentId, joinedAt }

const broadcastLiveClassViewers = (sessionId) => {
  const allViewers = Array.from(liveClassViewers.values());
  const viewersInSession = sessionId
    ? allViewers.filter(v => String(v.sessionId) === String(sessionId))
    : allViewers;
  const count = viewersInSession.length;
  io.emit('class:viewer_count', {
    sessionId: sessionId || activeLiveClass?.id,
    count,
    viewers: viewersInSession.map(v => ({ studentName: v.studentName, studentId: v.studentId }))
  });
};

// -------------------------------------------------------------
// REAL-TIME VIRTUAL STUDY LOUNGE ENGINE
// -------------------------------------------------------------
const studyLoungeUsers = new Map(); // socket.id -> { roomId, user }

const broadcastStudyLoungeState = () => {
  const counts = { Physics: 0, Chemistry: 0, Math: 0, Biology: 0 };
  const roomPeers = { Physics: [], Chemistry: [], Math: [], Biology: [] };

  studyLoungeUsers.forEach(({ roomId, user }) => {
    if (counts[roomId] !== undefined) {
      counts[roomId]++;
      roomPeers[roomId].push({
        id: user?.id || user?.email || 'guest',
        name: user?.name || 'EduFast Student',
        college: user?.college || user?.institution || 'College Student',
        avatar: user?.avatar || '👨‍🎓',
        streak: user?.streak || 7,
        status: user?.status || `Solving in ${roomId}`
      });
    }
  });

  io.emit('study_lounge:update', {
    counts,
    totalActive: studyLoungeUsers.size,
    roomPeers
  });
};

io.on('connection', (socket) => {
  // If there is an active live class, immediately inform the newly connected socket
  if (activeLiveClass) {
    socket.emit('class:status_change', activeLiveClass);
    if (activeMediaStatus) {
      socket.emit('class:media_status', activeMediaStatus);
    }
    if (activePoll) {
      socket.emit('poll:new', activePoll);
    }
  }

  // Track user presence
  socket.on('user:join', (user) => {
    if (user && user.id) {
      activeUsers.set(socket.id, user);
      io.emit('users:online_update', {
        onlineCount: activeUsers.size,
        users: Array.from(new Set(Array.from(activeUsers.values()).map(u => u.name)))
      });
    }
  });

  // Helper to persist live classes in data/liveClasses.json
  const persistLiveClassStatus = (session, status) => {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, 'data', 'liveClasses.json');
      if (fs.existsSync(filePath)) {
        let list = JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]');
        const idx = list.findIndex(c => c.id === session.id);
        const updatedEntry = { ...session, status };
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...updatedEntry };
        } else {
          list.unshift(updatedEntry);
        }
        fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf8');
      }
    } catch (e) {
      console.warn('Error persisting live class to file:', e.message);
    }
  };

  // Provide currently active live class and hardware media status on demand
  socket.on('class:get_active', (callback) => {
    if (activeMediaStatus) {
      socket.emit('class:media_status', activeMediaStatus);
    }
    if (typeof callback === 'function') {
      callback(activeLiveClass);
    } else {
      socket.emit('class:status_change', activeLiveClass);
    }
  });

  // 1. Live Class Started by Teacher
  socket.on('class:start', (sessionData) => {
    activeLiveClass = {
      ...sessionData,
      status: 'LIVE',
      startedAt: new Date().toISOString()
    };
    persistLiveClassStatus(activeLiveClass, 'LIVE');
    liveClassViewers.clear();
    broadcastLiveClassViewers(activeLiveClass.id);
    // Instantly broadcast to ALL connected students and mentors
    io.emit('class:status_change', activeLiveClass);
  });

  // 2. Live Class Ended by Teacher
  socket.on('class:end', (data) => {
    const endId = data?.sessionId || data?.id;
    if (endId) {
      try {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, 'data', 'liveClasses.json');
        if (fs.existsSync(filePath)) {
          let list = JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]');
          list = list.filter(c => String(c.id) !== String(endId));
          fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf8');
        }
      } catch (e) {
        console.warn('Error removing ended class from liveClasses.json:', e.message);
      }
    }

    // If teacher provided a pending recording placeholder for this ended live class
    if (data?.session) {
      try {
        const fs = require('fs');
        const path = require('path');
        const recFile = path.join(__dirname, 'data', 'recordings.json');
        let recs = [];
        if (fs.existsSync(recFile)) {
          recs = JSON.parse(fs.readFileSync(recFile, 'utf8') || '[]');
        }
        const pendingRec = data.session;
        const recId = pendingRec.id || `rec-${endId || Date.now()}`;
        const formattedPending = { ...pendingRec, id: recId };
        const idx = recs.findIndex(r => r.id === recId);
        if (idx >= 0) recs[idx] = { ...recs[idx], ...formattedPending };
        else recs.unshift(formattedPending);
        fs.writeFileSync(recFile, JSON.stringify(recs, null, 2), 'utf8');
        io.emit('recording:new', formattedPending);
        io.emit('recording:update', formattedPending);
      } catch (err) {
        console.warn('Error saving pending recording on class:end:', err.message);
      }
    }

    activeLiveClass = null;
    activePoll = null;
    activeMediaStatus = { isCamOn: false, isMicOn: false, isScreenSharing: false };
    liveClassViewers.clear();
    broadcastLiveClassViewers(endId);
    io.emit('class:status_change', {
      id: endId,
      status: 'ENDED',
      endedAt: new Date().toISOString()
    });
  });

  // Dedicated Real-time Recording Create Listener
  socket.on('recording:create', (recordingData) => {
    try {
      const fs = require('fs');
      const path = require('path');
      const recFile = path.join(__dirname, 'data', 'recordings.json');
      let recs = [];
      if (fs.existsSync(recFile)) {
        recs = JSON.parse(fs.readFileSync(recFile, 'utf8') || '[]');
      }
      const recId = recordingData.id || 'rec-' + Date.now();
      const formattedRec = { ...recordingData, id: recId };
      const idx = recs.findIndex(r => r.id === recId);
      if (idx >= 0) recs[idx] = { ...recs[idx], ...formattedRec };
      else recs.unshift(formattedRec);
      fs.writeFileSync(recFile, JSON.stringify(recs, null, 2), 'utf8');
      io.emit('recording:new', formattedRec);
      io.emit('recording:update', formattedRec);
    } catch (e) {
      console.warn('Error saving recording via socket:', e.message);
    }
  });

  // Dedicated Real-time Recording Update Listener
  socket.on('recording:update', (recordingData) => {
    try {
      const fs = require('fs');
      const path = require('path');
      const recFile = path.join(__dirname, 'data', 'recordings.json');
      let recs = [];
      if (fs.existsSync(recFile)) {
        recs = JSON.parse(fs.readFileSync(recFile, 'utf8') || '[]');
      }
      const recId = recordingData?.id;
      if (recId) {
        const formattedRec = { ...recordingData, id: recId };
        const idx = recs.findIndex(r => r.id === recId);
        if (idx >= 0) recs[idx] = { ...recs[idx], ...formattedRec };
        else recs.unshift(formattedRec);
        fs.writeFileSync(recFile, JSON.stringify(recs, null, 2), 'utf8');
        io.emit('recording:new', formattedRec);
        io.emit('recording:update', formattedRec);
      }
    } catch (e) {
      console.warn('Error updating recording via socket:', e.message);
    }
  });

  // Dedicated Real-time Recording Delete Listener
  socket.on('recording:delete', ({ id }) => {
    try {
      const fs = require('fs');
      const path = require('path');
      const recFile = path.join(__dirname, 'data', 'recordings.json');
      if (fs.existsSync(recFile)) {
        let recs = JSON.parse(fs.readFileSync(recFile, 'utf8') || '[]');
        recs = recs.filter(r => String(r.id) !== String(id));
        fs.writeFileSync(recFile, JSON.stringify(recs, null, 2), 'utf8');
      }
      io.emit('recording:deleted', { id });
    } catch (e) {
      console.warn('Error deleting recording via socket:', e.message);
    }
  });

  // 3. Real-Time Whiteboard Streaming (Teacher draws, students see in real-time)
  socket.on('class:draw_stroke', (strokeData) => {
    socket.broadcast.emit('class:draw_stroke', strokeData);
  });

  socket.on('class:clear_board', () => {
    io.emit('class:clear_board');
  });

  // Presentation Mode Switch (Whiteboard vs Slides)
  socket.on('class:mode_change', (modeData) => {
    socket.broadcast.emit('class:mode_change', modeData);
  });

  // Teacher Hardware Media Status (Mic, Cam, Screen Share)
  socket.on('class:media_status', (mediaData) => {
    activeMediaStatus = { ...activeMediaStatus, ...mediaData };
    socket.broadcast.emit('class:media_status', activeMediaStatus);
  });

  // WebRTC Live Video & Audio Signaling (Teacher broadcast to Students)
  socket.on('webrtc:signal', (data) => {
    if (data && data.to) {
      io.to(data.to).emit('webrtc:signal', {
        from: socket.id,
        signal: data.signal,
        type: data.type
      });
    } else {
      socket.broadcast.emit('webrtc:signal', {
        from: socket.id,
        signal: data.signal,
        type: data.type
      });
    }
  });

  // Real-Time Live Classroom Viewers Join / Leave / Query Handlers
  socket.on('class:join_room', ({ sessionId, studentName, studentId }) => {
    const sId = sessionId || activeLiveClass?.id || 'live';
    liveClassViewers.set(socket.id, {
      sessionId: sId,
      studentName: studentName || 'শিক্ষার্থী',
      studentId: studentId || socket.id,
      joinedAt: Date.now()
    });
    broadcastLiveClassViewers(sId);
  });

  socket.on('class:leave_room', ({ sessionId }) => {
    if (liveClassViewers.has(socket.id)) {
      const viewer = liveClassViewers.get(socket.id);
      liveClassViewers.delete(socket.id);
      broadcastLiveClassViewers(sessionId || viewer?.sessionId);
    }
  });

  socket.on('class:get_viewers', (query, callback) => {
    const sId = query?.sessionId || activeLiveClass?.id;
    const allViewers = Array.from(liveClassViewers.values());
    const viewersInSession = sId
      ? allViewers.filter(v => String(v.sessionId) === String(sId))
      : allViewers;
    const count = viewersInSession.length;
    if (typeof callback === 'function') {
      callback({ count, viewers: viewersInSession });
    } else {
      socket.emit('class:viewer_count', { sessionId: sId, count, viewers: viewersInSession });
    }
  });

  socket.on('webrtc:viewer_join', (data) => {
    const sId = data?.sessionId || activeLiveClass?.id || 'live';
    if (!liveClassViewers.has(socket.id)) {
      liveClassViewers.set(socket.id, {
        sessionId: sId,
        studentName: data?.studentName || 'Student',
        studentId: socket.id,
        joinedAt: Date.now()
      });
      broadcastLiveClassViewers(sId);
    }
    socket.broadcast.emit('webrtc:viewer_joined', {
      socketId: socket.id,
      studentName: data?.studentName || 'Student',
      sessionId: sId
    });
  });

  // 4. Live Classroom Chat & Q&A
  socket.on('chat:send_message', (msgData) => {
    const msg = {
      ...msgData,
      id: msgData.id || 'msg_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    io.emit('chat:new_message', msg);
  });

  // 5. Student Hand Raise / Doubt Alert
  socket.on('class:raise_hand', (studentData) => {
    io.emit('class:hand_raised', {
      studentId: studentData.id,
      studentName: studentData.name,
      time: new Date().toLocaleTimeString('bn-BD')
    });
  });

  // 6. Real-Time Live Quiz Poll
  socket.on('poll:create', (pollData) => {
    activePoll = {
      id: pollData.id || Date.now(),
      question: pollData.question,
      options: pollData.options,
      votes: pollData.votes || new Array(pollData.options.length).fill(0)
    };
    io.emit('poll:new', activePoll);
  });

  socket.on('poll:vote', ({ optionIndex }) => {
    if (activePoll && activePoll.votes && activePoll.votes[optionIndex] !== undefined) {
      activePoll.votes[optionIndex] += 1;
      io.emit('poll:vote_update', { votes: activePoll.votes });
    }
  });

  socket.on('poll:resolve', () => {
    activePoll = null;
    io.emit('poll:resolved');
  });

  // -----------------------------------------------------------
  // Study Lounge Real-Time Handlers
  // -----------------------------------------------------------
  socket.on('study_lounge:join_room', ({ roomId, user }) => {
    if (roomId) {
      studyLoungeUsers.set(socket.id, { roomId, user: user || { name: 'Student' } });
      broadcastStudyLoungeState();
    }
  });

  socket.on('study_lounge:leave_room', () => {
    if (studyLoungeUsers.has(socket.id)) {
      studyLoungeUsers.delete(socket.id);
      broadcastStudyLoungeState();
    }
  });

  socket.on('study_lounge:get_state', () => {
    const counts = { Physics: 0, Chemistry: 0, Math: 0, Biology: 0 };
    const roomPeers = { Physics: [], Chemistry: [], Math: [], Biology: [] };
    studyLoungeUsers.forEach(({ roomId, user }) => {
      if (counts[roomId] !== undefined) {
        counts[roomId]++;
        roomPeers[roomId].push({
          id: user?.id || user?.email || 'guest',
          name: user?.name || 'EduFast Student',
          college: user?.college || user?.institution || 'College Student',
          avatar: user?.avatar || '👨‍🎓',
          streak: user?.streak || 7,
          status: user?.status || `Solving in ${roomId}`
        });
      }
    });
    socket.emit('study_lounge:update', {
      counts,
      totalActive: studyLoungeUsers.size,
      roomPeers
    });
  });

  socket.on('disconnect', () => {
    activeUsers.delete(socket.id);
    io.emit('users:online_update', {
      onlineCount: activeUsers.size,
      users: Array.from(new Set(Array.from(activeUsers.values()).map(u => u.name)))
    });

    if (liveClassViewers.has(socket.id)) {
      const viewer = liveClassViewers.get(socket.id);
      liveClassViewers.delete(socket.id);
      broadcastLiveClassViewers(viewer?.sessionId);
    }

    if (studyLoungeUsers.has(socket.id)) {
      studyLoungeUsers.delete(socket.id);
      broadcastStudyLoungeState();
    }
  });
});

// Initialize database and start HTTP + Socket.io Server
async function startServer() {
  try {
    const db = await initDb();
    try {
      const { seedDatabase } = require('./database/seed');
      await seedDatabase(db);
    } catch (sErr) {
      console.warn('[Seed Notice]:', sErr.message);
    }
    server.listen(PORT, () => {
      console.log(`\n=============================================================`);
      console.log(`  🚀 EduFast Backend with Socket.io running on http://localhost:${PORT}`);
      console.log(`  ⚡ Real-Time Live Class Broadcast Engine: ACTIVE`);
      console.log(`=============================================================\n`);
    });
  } catch (err) {
    console.error('Failed to start EduFast backend server:', err);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server, io };
