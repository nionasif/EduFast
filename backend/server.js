require('dotenv').config();
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

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

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

io.on('connection', (socket) => {
  // If there is an active live class, immediately inform the newly connected socket
  if (activeLiveClass) {
    socket.emit('class:status_change', activeLiveClass);
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

  // Provide currently active live class on demand
  socket.on('class:get_active', (callback) => {
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

    // Auto-save recording if provided
    let savedRecording = null;
    if (data?.recording) {
      try {
        const fs = require('fs');
        const path = require('path');
        const recFile = path.join(__dirname, 'data', 'recordings.json');
        let recs = [];
        if (fs.existsSync(recFile)) {
          recs = JSON.parse(fs.readFileSync(recFile, 'utf8') || '[]');
        }
        savedRecording = data.recording;
        const idx = recs.findIndex(r => r.id === savedRecording.id);
        if (idx >= 0) recs[idx] = { ...recs[idx], ...savedRecording };
        else recs.unshift(savedRecording);
        fs.writeFileSync(recFile, JSON.stringify(recs, null, 2), 'utf8');
        io.emit('recording:new', savedRecording);
      } catch (e) {
        console.warn('Error saving recording on class:end:', e.message);
      }
    }

    activeLiveClass = null;
    activePoll = null;
    io.emit('class:status_change', {
      id: endId,
      status: 'ENDED',
      endedAt: new Date().toISOString(),
      recording: savedRecording
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
    } catch (e) {
      console.warn('Error saving recording via socket:', e.message);
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
    socket.broadcast.emit('class:media_status', mediaData);
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

  socket.on('disconnect', () => {
    activeUsers.delete(socket.id);
    io.emit('users:online_update', {
      onlineCount: activeUsers.size,
      users: Array.from(new Set(Array.from(activeUsers.values()).map(u => u.name)))
    });
  });
});

// Initialize database and start HTTP + Socket.io Server
async function startServer() {
  try {
    await initDb();
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
