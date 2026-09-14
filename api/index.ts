import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), message: 'CRM API Serverless Function is healthy' });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), message: 'CRM API Serverless Function is healthy' });
});

// Lazy import routes to catch any module import errors safely
try {
  const apiRoutes = require('../backend/src/routes').default;
  const { errorHandler } = require('../backend/src/middleware/errorHandler');

  app.use('/api', apiRoutes);
  app.use('/', apiRoutes);
  app.use(errorHandler);
} catch (importErr: any) {
  console.error('Module initialization error in api/index.ts:', importErr);
  app.use((req: Request, res: Response) => {
    res.status(500).json({
      error: 'Module initialization error',
      message: importErr?.message || String(importErr),
      stack: process.env.NODE_ENV === 'development' ? importErr?.stack : undefined,
    });
  });
}

// Fallback global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Serverless Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err?.message || 'An unexpected error occurred',
  });
});

export default app;
