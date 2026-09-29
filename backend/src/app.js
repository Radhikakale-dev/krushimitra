/**
 * app.js
 * KrushiMitra AI — Production-Ready Express Application
 * Full middleware stack, all routes, error handling, security hardening.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// ── Route Imports ─────────────────────────────────────────────────────────────
import authRoutes         from './routes/authRoutes.js';
import dashboardRoutes    from './routes/dashboardRoutes.js';
import billRoutes         from './routes/billRoutes.js';
import productRoutes      from './routes/productRoutes.js';
import categoryRoutes     from './routes/categoryRoutes.js';
import customerRoutes     from './routes/customerRoutes.js';
import supplierRoutes     from './routes/supplierRoutes.js';
import inventoryRoutes    from './routes/inventoryRoutes.js';
import reportRoutes       from './routes/reportRoutes.js';
import expenseRoutes      from './routes/expenseRoutes.js';
import userRoutes         from './routes/userRoutes.js';
import aiRoutes           from './routes/aiRoutes.js';
import { backupRouter }     from './routes/backupRoutes.js';
import { settingsRouter, notificationRouter, auditRouter, emailRouter } from './routes/utilityRoutes.js';

const app = express();

// ─────────────────────────────────────────────────────────────────────────────
// Trust proxy (for rate limiting behind reverse proxy / load balancer)
// ─────────────────────────────────────────────────────────────────────────────
app.set('trust proxy', 1);

// ─────────────────────────────────────────────────────────────────────────────
// Security Middleware
// ─────────────────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS — allow Vite dev server + Electron
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'app://.',
      'file://',
    ];
    // Allow requests with no origin (Electron, Postman)
    if (!origin || allowed.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else if (process.env.NODE_ENV !== 'production') {
      callback(null, true); // Allow all in dev
    } else {
      callback(new Error('CORS: Origin not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limiting
// ─────────────────────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production', // Skip rate limiting in dev
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 600,
  message: { success: false, message: 'API rate limit exceeded.' },
  skip: (req) => process.env.NODE_ENV !== 'production',
});

// ─────────────────────────────────────────────────────────────────────────────
// Body Parsing
// ─────────────────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ─────────────────────────────────────────────────────────────────────────────
// Request Logging
// ─────────────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ─────────────────────────────────────────────────────────────────────────────
// Health Check (no auth required)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'KrushiMitra AI API is running 🌱',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api/auth',          authLimiter,  authRoutes);
app.use('/api/dashboard',     apiLimiter,   dashboardRoutes);
app.use('/api/bills',         apiLimiter,   billRoutes);
app.use('/api/products',      apiLimiter,   productRoutes);
app.use('/api/categories',    apiLimiter,   categoryRoutes);
app.use('/api/customers',     apiLimiter,   customerRoutes);
app.use('/api/suppliers',     apiLimiter,   supplierRoutes);
app.use('/api/inventory',     apiLimiter,   inventoryRoutes);
app.use('/api/reports',       apiLimiter,   reportRoutes);
app.use('/api/expenses',      apiLimiter,   expenseRoutes);
app.use('/api/users',         apiLimiter,   userRoutes);
app.use('/api/ai',            apiLimiter,   aiRoutes);
app.use('/api/settings',      apiLimiter,   settingsRouter);
app.use('/api/backup',        apiLimiter,   backupRouter);
app.use('/api/notifications',  apiLimiter,  notificationRouter);
app.use('/api/audit',          apiLimiter,  auditRouter);
app.use('/api',                apiLimiter,  emailRouter);

// ─────────────────────────────────────────────────────────────────────────────
// 404 & Global Error Handler (must be LAST)
// ─────────────────────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
