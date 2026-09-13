import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { CONFIG } from './config';

const app = express();

// Middlewares
app.use(cors());
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

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve frontend static build if available
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/health')) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Centralized error handler
app.use(errorHandler);

export default app;
