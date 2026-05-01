require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const passport = require('./utils/passport');

const authRoutes = require('./routes/auth');
const workspaceRoutes = require('./routes/workspaces');
const boardRoutes = require('./routes/boards');
const stripeRoutes = require('./routes/stripe');

// Validate ENV
const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'CLIENT_URL'];
requiredEnv.forEach(key => {
  if (!process.env[key]) console.warn(`⚠️ Warning: ${key} is not defined in .env`);
});

const app = express();
const httpServer = http.createServer(app);

// ─── SOCKET.IO ─────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL, credentials: true },
});

io.on('connection', (socket) => {
  socket.on('join-board', (boardId) => socket.join(`board:${boardId}`));
  socket.on('leave-board', (boardId) => socket.leave(`board:${boardId}`));
  socket.on('card-updated', (data) => socket.to(`board:${data.boardId}`).emit('card-updated', data));
  socket.on('card-moved', (data) => socket.to(`board:${data.boardId}`).emit('card-moved', data));
  socket.on('card-created', (data) => socket.to(`board:${data.boardId}`).emit('card-created', data));
  socket.on('card-deleted', (data) => socket.to(`board:${data.boardId}`).emit('card-deleted', data));
});

app.set('io', io);

// ─── MIDDLEWARE ────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(morgan('dev'));

// Capture raw body for Stripe webhook
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    if (req.originalUrl.startsWith('/api/stripe/webhook')) {
      req.rawBody = buf;
    }
  },
}));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// ─── ROUTES ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/stripe', stripeRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date().toISOString() }));

// 404
app.use((req, res) => res.status(404).json({ message: 'Route nuk u gjet.' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err);
  res.status(err.status || 500).json({ 
    message: err.message || 'Gabim i brendshëm i serverit.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined 
  });
});

// ─── DATABASE + START ──────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB u lidh me sukses.');
    const PORT = process.env.PORT || 5001;
    httpServer.listen(PORT, () => {
      console.log(`🚀 TaskFlow API aktiv në http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB gabim:', err.message);
    process.exit(1);
  });
