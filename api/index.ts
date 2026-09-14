import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/ping', (req: Request, res: Response) => {
  res.json({ status: 'ok', ping: 'pong', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

try {
  const apiRoutes = require('../backend/dist/routes').default || require('../backend/dist/routes');
  const { errorHandler } = require('../backend/dist/middleware/errorHandler');
  app.use('/api', apiRoutes);
  app.use('/', apiRoutes);
  if (errorHandler) app.use(errorHandler);
} catch (err: any) {
  console.error('Failed to attach backend routes:', err);
}

export default app;
