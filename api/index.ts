import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoints
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), message: 'CRM API Serverless Function is healthy' });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), message: 'CRM API Serverless Function is healthy' });
});

// Import compiled backend routes
let apiRoutes: any;
let errorHandler: any;

try {
  const distRoutesPath = path.resolve(__dirname, '../backend/dist/routes');
  if (fs.existsSync(distRoutesPath + '.js') || fs.existsSync(distRoutesPath)) {
    apiRoutes = require('../backend/dist/routes').default;
    errorHandler = require('../backend/dist/middleware/errorHandler').errorHandler;
  } else {
    apiRoutes = require('../backend/src/routes').default;
    errorHandler = require('../backend/src/middleware/errorHandler').errorHandler;
  }
} catch (e1: any) {
  console.warn('Fallback loading src routes:', e1?.message);
  try {
    apiRoutes = require('../backend/src/routes').default;
    errorHandler = require('../backend/src/middleware/errorHandler').errorHandler;
  } catch (e2: any) {
    console.error('Failed to load routes:', e2);
  }
}

if (apiRoutes) {
  app.use('/api', apiRoutes);
  app.use('/', apiRoutes);
}

if (errorHandler) {
  app.use(errorHandler);
}

// Global fallback handler for serverless safety
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Serverless Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err?.message || 'An unexpected error occurred',
  });
});

export default app;
