import './config/env.js';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { closeDB, connectDB, isDatabaseReady } from './config/db.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import routes from './routes/index.js';
import { startRankingCron } from './services/ranking.service.js';

export const app = express();
const port = process.env.PORT || 5000;

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: Boolean(process.env.CLIENT_URL) }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use('/uploads', express.static('uploads'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 250, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (_req, res) => {
  const databaseReady = isDatabaseReady();
  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? 'ok' : 'unavailable',
    service: 'VERTEX API',
    database: databaseReady ? 'ready' : 'unavailable'
  });
});

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDB();
  startRankingCron();

  const server = app.listen(port, () => {
    console.log(`VERTEX API running on port ${port}`);
  });

  let closing = false;
  const shutdown = async (signal) => {
    if (closing) return;
    closing = true;
    console.log(`${signal} received; shutting down VERTEX API`);
    server.close(async () => {
      await closeDB();
      process.exit(0);
    });
  };

  process.once('SIGINT', () => { shutdown('SIGINT').catch(() => process.exit(1)); });
  process.once('SIGTERM', () => { shutdown('SIGTERM').catch(() => process.exit(1)); });
}

if (process.env.NODE_ENV !== 'test') {
  start().catch((error) => {
    console.error('Failed to start VERTEX API', error.message);
    process.exit(1);
  });
}
