import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './db.js';

const app = express();
const port = Number(process.env.PORT || 3001);
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '16kb' }));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Database health check failed:', error.code || error.message);
    res.status(503).json({ status: 'degraded', database: 'unavailable' });
  }
});

app.get('/api/customers', async (req, res, next) => {
  try {
    const query = String(req.query.search || '').trim();
    if (query.length > 150) return res.status(400).json({ error: 'Search must be 150 characters or fewer.' });
    const like = `%${query.replace(/[\\%_]/g, '\\$&')}%`;
    const [rows] = await pool.execute(
      `SELECT id, full_name AS fullName, phone, email, created_at AS createdAt
       FROM customers
       WHERE (? = '' OR CAST(id AS CHAR) = ? OR full_name LIKE ?)
       ORDER BY id DESC LIMIT 100`,
      [query, query, like]
    );
    res.json({ customers: rows });
  } catch (error) { next(error); }
});

app.post('/api/customers', async (req, res, next) => {
  try {
    const { fullName, phone, email } = req.body || {};
    if (typeof fullName !== 'string' || !fullName.trim() || fullName.trim().length > 150)
      return res.status(400).json({ error: 'Customer name is required (maximum 150 characters).' });
    if (phone != null && (typeof phone !== 'string' || phone.trim().length > 30))
      return res.status(400).json({ error: 'Phone must be 30 characters or fewer.' });
    if (email != null && (typeof email !== 'string' || email.trim().length > 255 || (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))))
      return res.status(400).json({ error: 'Enter a valid email address.' });
    const [result] = await pool.execute(
      'INSERT INTO customers (full_name, phone, email) VALUES (?, ?, ?)',
      [fullName.trim(), phone?.trim() || null, email?.trim() || null]
    );
    const [rows] = await pool.execute(
      'SELECT id, full_name AS fullName, phone, email, created_at AS createdAt FROM customers WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json({ customer: rows[0] });
  } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  console.error('API error:', error.code || error.message);
  res.status(500).json({ error: 'Unable to complete the request. Please try again.' });
});

app.listen(port, () => console.log(`Smart Gym API listening on http://localhost:${port}`));
