import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import routes from './routes/index.js';
import { runMigrations } from './services/migration.service.js';
import { startRankingCron } from './services/ranking.service.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 250, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'VERTEX API' });
});

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

try {
  await runMigrations();
  startRankingCron();

  app.listen(port, () => {
    console.log(`VERTEX API running on port ${port}`);
  });
} catch (error) {
  console.error('Failed to start VERTEX API', error);
  process.exit(1);
}
