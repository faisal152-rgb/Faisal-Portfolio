import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import portfolioRoutes from './routes/portfolio.routes.js';
import adminRoutes from './routes/admin.routes.js';
import messageRoutes from './routes/message.routes.js';
import leadRoutes from './routes/lead.routes.js';
import aiRoutes from './routes/ai.routes.js';
import securityRoutes from './routes/security.routes.js';
import systemRoutes from './routes/system.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { authMiddleware } from './middleware/auth.middleware.js';
import { initializeSocket } from './services/socket.service.js';
import { setIO } from './services/io.js';
import { seedDatabase } from './utils/seeder.js';
import { getSecurityCache } from './utils/securityCache.js';

dotenv.config();

const ADMIN_SECRET_PATH = (process.env.ADMIN_SECRET_PATH || 'manage-9f2k8x1p').trim();

const normalizeOrigin = (origin = '') => origin.replace(/\/$/, '').trim();

const allowedOrigins = [
  process.env.CLIENT_URL,
  ...(process.env.CLIENT_URLS || '').split(','),
  'https://faisal-abbas.vercel.app',
].filter(Boolean)
  .map(normalizeOrigin);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  const normalizedOrigin = normalizeOrigin(origin);

  // In development, allow any localhost/127.0.0.1 port (Vite can shift port if busy).
  if (
    process.env.NODE_ENV !== 'production' &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalizedOrigin)
  ) {
    return true;
  }

  // In development, also allow local network IPs (192.168.x.x, 172.x.x.x, 10.x.x.x)
  // so the app is accessible from other devices on the same network.
  if (
    process.env.NODE_ENV !== 'production' &&
    /^https?:\/\/(192\.168\.\d+\.\d+|172\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/i.test(normalizedOrigin)
  ) {
    return true;
  }

  return allowedOrigins.includes(normalizedOrigin);
};

const app = express();
const uploadsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../uploads');
fs.mkdirSync(uploadsDirectory, { recursive: true });
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },
});

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'ws:', 'wss:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// IP Blocking Middleware
app.use(async (req, res, next) => {
  try {
    const cache = await getSecurityCache();
    if (cache.blockedIps && cache.blockedIps.includes(req.ip)) {
      return res.status(403).json({ success: false, message: 'Access denied: Your IP is blocked.' });
    }
  } catch (err) {
    console.error('[BlockedIPCheck] Error:', err.message);
  }
  next();
});

// Dynamic Rate Limiting Middleware
const minuteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: async (req) => {
    const cache = await getSecurityCache();
    return cache.rateLimit?.requestsPerMinute || 30;
  },
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admin panel and auth state check
    return req.path.startsWith(`/${ADMIN_SECRET_PATH}`) || req.path.startsWith('/auth/me');
  }
});

const hourLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: async (req) => {
    const cache = await getSecurityCache();
    return cache.rateLimit?.requestsPerHour || 200;
  },
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith(`/${ADMIN_SECRET_PATH}`) || req.path.startsWith('/auth/me')
});

const dayLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: async (req) => {
    const cache = await getSecurityCache();
    return cache.rateLimit?.requestsPerDay || 1000;
  },
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith(`/${ADMIN_SECRET_PATH}`) || req.path.startsWith('/auth/me')
});

app.use('/api', minuteLimiter);
app.use('/api', hourLimiter);
app.use('/api', dayLimiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts, please try again later' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsing with limits
// Image analysis sends a base64 data URL after multipart upload.
// 15 MB covers the 10 MB attachment limit plus base64 encoding overhead.
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization
app.use(mongoSanitize());
app.use(xss());

// Compression
app.use(compression());
app.use('/uploads', express.static(uploadsDirectory, { dotfiles: 'deny', index: false, maxAge: '1h' }));

// Detailed request logging helps diagnose API and upload issues in production.
app.use((req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(0)}ms`);
  });

  next();
});

// Welcome/Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Faisal Portfolio API Server is running.',
    frontend: 'https://faisal-abbas.vercel.app',
    healthCheck: '/api/health'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use(`/api/${ADMIN_SECRET_PATH}`, authMiddleware, adminRoutes);
app.use(`/api/${ADMIN_SECRET_PATH}/ai`, authMiddleware, aiRoutes);
app.use(`/api/${ADMIN_SECRET_PATH}/leads`, authMiddleware, leadRoutes);
app.use(`/api/${ADMIN_SECRET_PATH}/messages`, authMiddleware, messageRoutes);
app.use(`/api/${ADMIN_SECRET_PATH}/security`, authMiddleware, securityRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/leads', leadRoutes);  // Keep public create lead route
app.use('/api/security', authMiddleware, securityRoutes);

// Public AI chat endpoint (no auth)
app.use('/api/ai', aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(errorHandler);

// Initialize Socket.io
setIO(io);
initializeSocket(io);

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Drop old duplicate index 'title' if it exists on projects collection
    try {
      const db = conn.connection.db;
      const collections = await db.listCollections({ name: 'projects' }).toArray();
      if (collections.length > 0) {
        const indexes = await db.collection('projects').indexes();
        for (const idx of indexes) {
          if (idx.name.includes('title')) {
            console.log(`Dropping obsolete unique index "${idx.name}" from projects collection...`);
            await db.collection('projects').dropIndex(idx.name);
            console.log(`Obsolete index "${idx.name}" dropped successfully.`);
          }
        }
      }
    } catch (indexErr) {
      console.error('Failed to cleanup projects collection indexes:', indexErr.message);
    }
    
    // Seed database after connection
    await seedDatabase();
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    console.log('Starting server without MongoDB...');
    // Don't exit, continue without database
  }
};

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  connectDB();
  httpServer.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  httpServer.close(() => process.exit(1));
});

export { app, io };
