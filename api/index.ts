import express from 'express';
import cors from 'cors';
import apiRoutes from '../backend/src/routes';
import { errorHandler } from '../backend/src/middleware/errorHandler';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API routes on both /api and root
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

app.use(errorHandler);

export default app;
