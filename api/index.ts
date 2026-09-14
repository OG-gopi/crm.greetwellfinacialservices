import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import apiRoutes from '../backend/src/routes';
import { errorHandler } from '../backend/src/middleware/errorHandler';

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

// Mount API routes
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// Error handler middleware
app.use(errorHandler);

// Global fallback handler for serverless safety
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Serverless Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err?.message || 'An unexpected error occurred',
  });
});

export default app;
