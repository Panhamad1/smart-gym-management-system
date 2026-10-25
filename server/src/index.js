import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './db.js';

const app = express();
const port = Number(process.env.PORT || 3001);
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Database health check failed:', error.code || error.message);
    res.status(503).json({ status: 'degraded', database: 'unavailable' });
  }
});

app.use((error, _req, res, _next) => {
  console.error('Unhandled request error:', error.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => console.log(`Smart Gym API listening on http://localhost:${port}`));
