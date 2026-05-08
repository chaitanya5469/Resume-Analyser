import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import resumeRoutes from './routes/resume.routes.js';
import analysisRoutes from './routes/analysis.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { notFound } from './middleware/notFound.middleware.js';
import { responseMiddleware } from './middleware/response.middleware.js';
import { logger } from './utils/logger.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many auth requests, please try again later.' },
});

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));
app.use(responseMiddleware);

// ─── Static Files ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/analyses', analysisRoutes);
app.use('/api/analytics', analyticsRoutes);

// ─── Error Handling ──────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info('server_started', { url: `http://localhost:${PORT}`, environment: process.env.NODE_ENV });
});

export default app;
