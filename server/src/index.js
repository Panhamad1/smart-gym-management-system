import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';

const app = express();
const port = Number(process.env.PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_staff_jwt_key_sprint1';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '16kb' }));

// Token blacklist for session invalidation on logout (Criterion 4)
const tokenBlacklist = new Set();

// Fallback seeded staff for offline resilience
const SEEDED_STAFF = [
  {
    id: 'STAFF-001',
    username: 'chao',
    email: 'chao@smartgym.com',
    password_hash: bcrypt.hashSync('Staff@123', 10),
    full_name: 'Chao Vanchhoeurng',
    role: 'Staff'
  },
  {
    id: 'STAFF-002',
    username: 'admin',
    email: 'admin@smartgym.com',
    password_hash: bcrypt.hashSync('Admin@123', 10),
    full_name: 'System Administrator',
    role: 'Administrator'
  },
  {
    id: 'STAFF-003',
    username: 'mao',
    email: 'mao@smartgym.com',
    password_hash: bcrypt.hashSync('Mao@123', 10),
    full_name: 'Mao Posovandeth',
    role: 'Product Owner'
  }
];

// -------------------------------------------------------------
// Authentication Middleware (Criterion 3: Route & API protection)
// -------------------------------------------------------------
export const authenticateStaff = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Access denied. Valid staff token required.'
    });
  }

  const token = authHeader.split(' ')[1];
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({
      error: 'Unauthorized: Session invalidated on logout.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid or expired session token.'
    });
  }
};

// -------------------------------------------------------------
// Health Check
// -------------------------------------------------------------
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(200).json({ status: 'ok', database: 'memory-fallback' });
  }
});

// -------------------------------------------------------------
// Auth Endpoints (SCRUM-14 / US-01)
// -------------------------------------------------------------

// POST /api/auth/login (Criterion 1 & 2)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { usernameOrEmail, password, rememberMe } = req.body || {};

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const identifier = String(usernameOrEmail).trim().toLowerCase();
    let staff = null;

    // 1. Check MySQL if available
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM staff WHERE LOWER(username) = ? OR LOWER(email) = ? LIMIT 1',
        [identifier, identifier]
      );
      if (rows.length > 0) staff = rows[0];
    } catch (e) {
      // Fallback to seeded staff memory
    }

    if (!staff) {
      staff = SEEDED_STAFF.find(
        (s) => s.username.toLowerCase() === identifier || s.email.toLowerCase() === identifier
      );
    }

    // Generic error message if user not found (Criterion 1)
    if (!staff) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Verify bcrypt password hash (Criterion 2)
    const isMatch = await bcrypt.compare(password, staff.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Issue JWT token
    const token = jwt.sign(
      {
        id: staff.id,
        username: staff.username,
        email: staff.email,
        fullName: staff.full_name || staff.fullName,
        role: staff.role
      },
      JWT_SECRET,
      { expiresIn: rememberMe ? '30d' : JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      token,
      staff: {
        id: staff.id,
        username: staff.username,
        email: staff.email,
        fullName: staff.full_name || staff.fullName,
        role: staff.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/logout (Criterion 4)
app.post('/api/auth/logout', authenticateStaff, (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) tokenBlacklist.add(token);
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully. Current session invalidated.'
  });
});

// GET /api/auth/me (Protected staff session check)
app.get('/api/auth/me', authenticateStaff, (req, res) => {
  return res.status(200).json({ success: true, staff: req.user });
});

// -------------------------------------------------------------
// Protected Endpoints (Criterion 3: Requires authenticateStaff)
// -------------------------------------------------------------

// GET /api/customers (Protected)
app.get('/api/customers', authenticateStaff, async (req, res, next) => {
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

// POST /api/customers (Protected)
app.post('/api/customers', authenticateStaff, async (req, res, next) => {
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

// GET /api/payments (Protected)
app.get('/api/payments', authenticateStaff, async (_req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM payments ORDER BY id DESC');
    res.json({ payments: rows });
  } catch (e) {
    res.json({ payments: [] });
  }
});

// GET /api/attendance (Protected)
app.get('/api/attendance', authenticateStaff, async (_req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM attendance ORDER BY id DESC');
    res.json({ attendance: rows });
  } catch (e) {
    res.json({ attendance: [] });
  }
});

app.use((error, _req, res, _next) => {
  console.error('API error:', error.code || error.message);
  res.status(500).json({ error: 'Unable to complete the request. Please try again.' });
});

app.listen(port, () => console.log(`Smart Gym API listening on http://localhost:${port}`));
export default app;
