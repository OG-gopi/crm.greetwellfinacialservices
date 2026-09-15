import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { CONFIG } from './config';

const app = express();

// Configure explicit CORS for deployed frontend domain and local development
const allowedOrigins = [
  'https://crmgreetwellfinacialservices.vercel.app',
  'https://crm-greetwellfinacialservicescrm.vercel.app',
  'https://crm-greetwellfinacialservices.vercel.app',
  'http://localhost:3001',
  'http://localhost:5000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5000',
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || (process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS.split(',').includes(origin))) {
      return callback(null, true);
    }
    if (origin.endsWith('.vercel.app') || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically with automatic sample document fallback
app.use('/uploads', express.static(CONFIG.UPLOAD_DIR));
app.use('/uploads', (req, res) => {
  const defaultSamplePath = path.join(CONFIG.UPLOAD_DIR, 'default_sample.pdf');
  if (fs.existsSync(defaultSamplePath)) {
    res.setHeader('Content-Type', 'application/pdf');
    return res.sendFile(defaultSamplePath);
  }
  return res.status(404).send('Document not found');
});

// Health check endpoints (both /health and /api/health)
app.get(['/health', '/api/health'], (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes (mounted on both /api and root for Vercel serverless rewrite resilience)
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// Serve frontend static build if available
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/health')) {
    return next();
  }
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

// Explicit fallback handler for unmatched API routes
app.use((req, res, next) => {
  if (res.headersSent) return next();
  return res.status(404).json({
    success: false,
    message: `API Route Not Found: ${req.method} ${req.originalUrl || req.path}`,
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
