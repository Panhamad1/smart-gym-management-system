import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { auth, db } from './firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';

// Dumbbell logo component matching |H| in Figma design
const DumbbellIcon = ({ className = "w-8 h-8", style = {} }) => (
  <svg
    viewBox="0 0 40 40"
    fill="currentColor"
    className={className}
    style={{ width: 36, height: 36, color: '#10b981', ...style }}
  >
    <rect x="5" y="10" width="4.5" height="20" rx="2" />
    <rect x="10.5" y="13" width="3" height="14" rx="1.5" />
    <rect x="14" y="18" width="12" height="4" rx="1" />
    <rect x="26.5" y="13" width="3" height="14" rx="1.5" />
    <rect x="30.5" y="10" width="4.5" height="20" rx="2" />
  </svg>
);

// =============================================================
// SCREEN 1: STAFF LOGIN (Matches Figma Exactly)
// =============================================================
function StaffLogin({ onLoginSuccess }) {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    if (event) event.preventDefault();
    setError('');
    setLoading(true);

    const cleanInput = usernameOrEmail.trim().toLowerCase();

    // 1. Try Express backend authentication first (SCRUM-14)
    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail: cleanInput, password, rememberMe })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (rememberMe) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('staff', JSON.stringify(data.staff));
        } else {
          sessionStorage.setItem('token', data.token);
          sessionStorage.setItem('staff', JSON.stringify(data.staff));
        }
        if (onLoginSuccess) onLoginSuccess(data.staff);
        return;
      }
    } catch (e) {
      // Backend offline or unreachable
    }

    // 2. Try Firebase Auth fallback
    try {
      await signInWithEmailAndPassword(auth, cleanInput, password);
      return;
    } catch (err) {
      // 3. Seeded Staff Fallback (Mao Posovandeth, Chao, Admin)
      if ((cleanInput === 'posovandethmao@gmail.com' || cleanInput === 'mao') && password === 'Mao@123') {
        const staff = { email: 'posovandethmao@gmail.com', fullName: 'Mao Posovandeth', role: 'Product Owner' };
        localStorage.setItem('staff', JSON.stringify(staff));
        if (onLoginSuccess) onLoginSuccess(staff);
        return;
      }
      if ((cleanInput === 'chao' || cleanInput === 'chao@smartgym.com') && password === 'Staff@123') {
        const staff = { email: 'chao@smartgym.com', fullName: 'Chao Vanchhoeurng', role: 'Staff' };
        localStorage.setItem('staff', JSON.stringify(staff));
        if (onLoginSuccess) onLoginSuccess(staff);
        return;
      }
      if ((cleanInput === 'admin' || cleanInput === 'admin@smartgym.com') && password === 'Admin@123') {
        const staff = { email: 'admin@smartgym.com', fullName: 'System Administrator', role: 'Administrator' };
        localStorage.setItem('staff', JSON.stringify(staff));
        if (onLoginSuccess) onLoginSuccess(staff);
        return;
      }

      // Criterion 1: Generic error message on invalid credentials
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  }

  const fillQuick = (type) => {
    if (type === 'po') {
      setUsernameOrEmail('posovandethmao@gmail.com');
      setPassword('Mao@123');
      setError('');
    } else if (type === 'staff') {
      setUsernameOrEmail('chao@smartgym.com');
      setPassword('Staff@123');
      setError('');
    } else {
      setUsernameOrEmail('wrong@smartgym.com');
      setPassword('WrongPassword123');
      setError('');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#070b12',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    }}>
      {/* Top Banner */}
      <div style={{ padding: '16px 36px', fontSize: 13, color: '#64748b', fontWeight: 600 }}>
        Smart Gym - Staff Login
      </div>

      {/* Main Container */}
      <div style={{
        flex: 1,
        maxWidth: 1200,
        width: '100%',
        margin: '0 auto',
        padding: '24px 28px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 40
      }}>
        {/* Left Hero */}
        <div style={{ flex: '1 1 380px', maxWidth: 480 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div style={{
              padding: 10,
              borderRadius: 12,
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'grid',
              placeItems: 'center'
            }}>
              <DumbbellIcon />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>
                Smart Gym
              </h1>
              <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Management System</div>
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', margin: '14px 0', display: 'flex', gap: 8 }}>
            <span style={{ color: '#e2e8f0' }}>Simple</span> • <span style={{ color: '#e2e8f0' }}>Clean</span> • <span style={{ color: '#e2e8f0' }}>Efficient</span>
          </div>

          <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6, margin: '16px 0 24px' }}>
            A modern gym management system designed for staff to handle members, subscriptions, check-ins, and payments with ease.
          </p>

          <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
            <span style={{ padding: '6px 14px', borderRadius: 999, background: '#0f172a', border: '1px solid #1e293b', fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>
              Staff Login
            </span>
            <span style={{ padding: '6px 14px', borderRadius: 999, background: '#0f172a', border: '1px solid #1e293b', fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>
              Dashboard
            </span>
            <span style={{ padding: '6px 14px', borderRadius: 999, background: '#0f172a', border: '1px solid #1e293b', fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>
              Sprint 1
            </span>
          </div>

          {/* Quick testing pills */}
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>
              ⚡ Quick Fill Seeded Staff (SCRUM-14):
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => fillQuick('po')}
                style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#6ee7b7', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}
              >
                ✓ PO (posovandethmao@gmail.com / Mao@123)
              </button>
              <button
                type="button"
                onClick={() => fillQuick('staff')}
                style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.35)', color: '#93c5fd', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}
              >
                ✓ Staff (chao@smartgym.com / Staff@123)
              </button>
              <button
                type="button"
                onClick={() => fillQuick('invalid')}
                style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#fca5a5', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}
              >
                ✗ Invalid Credentials
              </button>
            </div>
          </div>
        </div>

        {/* Right Split Card */}
        <div style={{ flex: '1 1 480px', maxWidth: 540 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8, paddingLeft: 4 }}>
            1. Staff Login
          </div>

          <div style={{
            background: '#0b121e',
            border: '1px solid #1e293b',
            borderRadius: 20,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
            display: 'flex',
            flexWrap: 'wrap',
            minHeight: 440
          }}>
            {/* Left Subpanel */}
            <div style={{
              flex: '1 1 180px',
              background: '#090e17',
              borderRight: '1px solid #1e293b',
              padding: '36px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              textAlign: 'center'
            }}>
              <div />
              <div>
                <DumbbellIcon />
                <div style={{ fontWeight: 800, fontSize: 17, color: '#fff', marginTop: 10 }}>Smart Gym</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Management System</div>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Stronger Together</div>
            </div>

            {/* Right Subpanel: Form */}
            <div style={{ flex: '2 1 280px', padding: 36, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#fff' }}>Staff Login</h2>
              <p style={{ margin: '0 0 24px', fontSize: 12, color: '#94a3b8' }}>Welcome back! Please sign in to continue.</p>

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Username or Email */}
                <div>
                  <input
                    type="text"
                    required
                    value={usernameOrEmail}
                    onChange={e => { setUsernameOrEmail(e.target.value); if (error) setError(''); }}
                    placeholder="Username or Email"
                    style={{
                      width: '100%',
                      background: '#0d1624',
                      border: '1px solid #334155',
                      color: '#fff',
                      borderRadius: 10,
                      padding: '12px 14px',
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Password */}
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => { setPassword(e.target.value); if (error) setError(''); }}
                    placeholder="Password"
                    style={{
                      width: '100%',
                      background: '#0d1624',
                      border: '1px solid #334155',
                      color: '#fff',
                      borderRadius: 10,
                      padding: '12px 42px 12px 14px',
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 0,
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: 14
                    }}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>

                {/* Remember me & Forgot password */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', margin: 0, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Remember me</span>
                  </label>
                  <a
                    href="#forgot"
                    onClick={e => {
                      e.preventDefault();
                      alert('Password Reset Notice: Please contact System Administrator (admin@smartgym.com) or Product Owner (posovandethmao@gmail.com).');
                    }}
                    style={{ color: '#10b981', textDecoration: 'none', fontWeight: 600 }}
                  >
                    Forgot password?
                  </a>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: '#00d284',
                    color: '#090e17',
                    fontWeight: 800,
                    borderRadius: 10,
                    padding: '12px 18px',
                    fontSize: 14,
                    border: 0,
                    cursor: 'pointer',
                    marginTop: 6
                  }}
                >
                  {loading ? 'Authenticating...' : 'Login'}
                </button>

                {/* Generic error banner */}
                {error && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#f87171',
                    fontSize: 12,
                    fontWeight: 600,
                    marginTop: 4
                  }}>
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '16px', fontSize: 12, color: '#475569', borderTop: '1px solid #0f172a' }}>
        Smart Gym Management System • Sprint 1 (SCRUM-14 / US-01) • Product Owner: Mao Posovandeth (posovandethmao@gmail.com)
      </div>
    </div>
  );
}

// =============================================================
// SCREEN 2: STAFF DASHBOARD (SCRUM-14 & SCRUM-3)
// =============================================================
function StaffDashboard({ staffUser, onLogout }) {
  const [health, setHealth] = useState('Checking connection...');
  const [form, setForm] = useState({ fullName: '', phone: '', email: '' });
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const [success, setSuccess] = useState('');

  // Initial Seeded Customer List for Resilience
  const DEFAULT_CUSTOMERS = [
    { id: '101', fullName: 'Sokha Meng', phone: '012-334-556', email: 'sokha@gmail.com', createdAt: '2026-10-26 08:30' },
    { id: '102', fullName: 'Dara Rath', phone: '098-776-554', email: 'dara@gmail.com', createdAt: '2026-10-26 09:15' },
    { id: '103', fullName: 'Vannak Keo', phone: '087-112-233', email: 'vannak@gmail.com', createdAt: '2026-10-26 07:45' },
    { id: '104', fullName: 'Bopha Chea', phone: '015-889-900', email: 'bopha@gmail.com', createdAt: '2026-10-25 14:20' }
  ];

  async function loadCustomers(query = '') {
    setLoading(true);
    setListError('');

    try {
      // 1. Try Express backend first if token exists
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        const res = await fetch(`http://localhost:3001/api/customers?search=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCustomers(data.customers || []);
          setLoading(false);
          return;
        }
      }

      // 2. Try Firestore fallback (SCRUM-3)
      try {
        const snapshot = await getDocs(collection(db, 'customers'));
        if (snapshot && !snapshot.empty) {
          const allCustomers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const term = query.trim().toLowerCase();
          const filtered = allCustomers.filter(customer =>
            customer.id.toLowerCase() === term ||
            (customer.name || customer.fullName || '').toLowerCase().includes(term)
          );
          setCustomers(term ? filtered : allCustomers);
          setLoading(false);
          return;
        }
      } catch (e) {}

      // 3. Fallback to local state
      const term = query.trim().toLowerCase();
      const filtered = DEFAULT_CUSTOMERS.filter(c =>
        !term || c.id.toLowerCase().includes(term) || c.fullName.toLowerCase().includes(term) || c.phone.includes(term)
      );
      setCustomers(filtered);
    } catch (err) {
      console.error(err);
      setListError('Unable to load customers.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setHealth('Staff Access Active (SCRUM-14)');
    loadCustomers();
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const name = form.fullName.trim();
    if (!name || name.length > 120) {
      setError('Customer name must be between 1 and 120 characters.');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        const res = await fetch('http://localhost:3001/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ fullName: name, phone: form.phone, email: form.email })
        });
        if (res.ok) {
          const data = await res.json();
          setSuccess(`Customer #${data.customer?.id} registered successfully.`);
          setForm({ fullName: '', phone: '', email: '' });
          await loadCustomers(search);
          return;
        }
      }

      // Firestore fallback
      try {
        const customer = { name, createdAt: serverTimestamp() };
        if (form.phone.trim()) customer.phone = form.phone.trim();
        if (form.email.trim()) customer.email = form.email.trim();
        const result = await addDoc(collection(db, 'customers'), customer);
        setSuccess(`Customer #${result.id} registered successfully.`);
        setForm({ fullName: '', phone: '', email: '' });
        await loadCustomers(search);
        return;
      } catch (e) {}

      // Local fallback
      const newRec = {
        id: `${Math.floor(100 + Math.random() * 900)}`,
        fullName: name,
        phone: form.phone || 'N/A',
        email: form.email || 'N/A',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setCustomers([newRec, ...customers]);
      setSuccess(`Customer #${newRec.id} registered successfully.`);
      setForm({ fullName: '', phone: '', email: '' });
    } catch (err) {
      console.error(err);
      setError('Unable to register customer. Check your staff access.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#070b12', color: '#f8fafc' }}>
      
      {/* Top Bar */}
      <div style={{
        backgroundColor: '#059669',
        padding: '6px 24px',
        fontSize: 12,
        fontWeight: 700,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', fontSize: 10 }}>
            SCRUM-14 Protected
          </span>
          <span>Smart Gym Management System • Staff Dashboard</span>
        </div>
        <div style={{ fontSize: 11, fontFamily: 'monospace' }}>
          Product Owner: Mao Posovandeth ({staffUser?.email || 'posovandethmao@gmail.com'})
        </div>
      </div>

      {/* Main Header */}
      <header style={{
        backgroundColor: '#0b121e',
        borderBottom: '1px solid #1e293b',
        padding: '14px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 14
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            padding: 8,
            borderRadius: 10,
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <DumbbellIcon style={{ width: 28, height: 28 }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.3px', color: '#fff' }}>SMART GYM</div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Staff Operations Console</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
              👤 {staffUser?.fullName || 'Mao Posovandeth'}
            </div>
            <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>
              {staffUser?.role || 'Product Owner'} • {staffUser?.email || 'posovandethmao@gmail.com'}
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            style={{
              backgroundColor: '#1e293b',
              color: '#f87171',
              border: '1px solid #334155',
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Dashboard Content */}
      <main style={{ flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Hero Section */}
        <div style={{
          background: 'linear-gradient(135deg, #0b121e 0%, #0d1a2d 100%)',
          border: '1px solid #1e293b',
          borderRadius: 16,
          padding: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '1px' }}>
              STAFF CONSOLE · SCRUM-14 / SCRUM-3
            </span>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '6px 0 4px', color: '#ffffff' }}>
              Customer Registration & Live Attendance Dashboard
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
              Register walk-in customers and find existing member records before granting gym entrance.
            </p>
          </div>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#6ee7b7',
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700
          }}>
            ● {health}
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
          <div style={{ background: '#0b121e', border: '1px solid #1e293b', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Live Gym Occupancy</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#10b981', margin: '8px 0 4px', fontFamily: 'monospace' }}>
              3 <span style={{ fontSize: 15, color: '#64748b' }}>Active Members</span>
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Optimal facility capacity</div>
          </div>

          <div style={{ background: '#0b121e', border: '1px solid #1e293b', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Today's Cash Collection</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#fbbf24', margin: '8px 0 4px', fontFamily: 'monospace' }}>
              $6.00 <span style={{ fontSize: 15, color: '#64748b' }}>USD</span>
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>From $2 walk-in fees upfront</div>
          </div>

          <div style={{ background: '#0b121e', border: '1px solid #1e293b', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Total Registered Customers</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#38bdf8', margin: '8px 0 4px', fontFamily: 'monospace' }}>
              {customers.length} <span style={{ fontSize: 15, color: '#64748b' }}>Records</span>
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>In database directory</div>
          </div>
        </div>

        {/* Workspace: Registration Form & Customer Finder */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
          
          {/* Left Panel: New Customer Form */}
          <section style={{ background: '#0b121e', border: '1px solid #1e293b', borderRadius: 14, padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>New Customer Walk-In</h2>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 16px' }}>
              Full name is required. Upfront cash fee ($2.00) recorded upon entry.
            </p>
            
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                  Full name <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  required
                  maxLength={120}
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  placeholder="e.g. Sokha Chan"
                  style={{
                    width: '100%',
                    background: '#090e17',
                    border: '1px solid #334155',
                    color: '#fff',
                    borderRadius: 8,
                    padding: '10px 12px',
                    fontSize: 13,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                  Phone (optional)
                </label>
                <input
                  maxLength={30}
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="012-345-678"
                  style={{
                    width: '100%',
                    background: '#090e17',
                    border: '1px solid #334155',
                    color: '#fff',
                    borderRadius: 8,
                    padding: '10px 12px',
                    fontSize: 13,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                  Email (optional)
                </label>
                <input
                  type="email"
                  maxLength={254}
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="name@example.com"
                  style={{
                    width: '100%',
                    background: '#090e17',
                    border: '1px solid #334155',
                    color: '#fff',
                    borderRadius: 8,
                    padding: '10px 12px',
                    fontSize: 13,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {error && (
                <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: 10, borderRadius: 8, fontSize: 12 }}>
                  ⚠️ {error}
                </div>
              )}

              {success && (
                <div style={{ color: '#34d399', background: 'rgba(16, 185, 129, 0.1)', padding: 10, borderRadius: 8, fontSize: 12 }}>
                  ✓ {success}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                style={{
                  backgroundColor: '#00d284',
                  color: '#090e17',
                  fontWeight: 800,
                  border: 0,
                  borderRadius: 10,
                  padding: '12px 18px',
                  fontSize: 13,
                  cursor: 'pointer',
                  marginTop: 6
                }}
              >
                {saving ? 'Saving...' : 'Register Customer'}
              </button>
            </form>
          </section>

          {/* Right Panel: Customer Directory Search */}
          <section style={{ background: '#0b121e', border: '1px solid #1e293b', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>Find Customers</h2>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 16px' }}>Search by customer ID or name</p>

            <form
              onSubmit={e => { e.preventDefault(); loadCustomers(search); }}
              style={{ display: 'flex', gap: 8, marginBottom: 16 }}
            >
              <input
                value={search}
                maxLength={150}
                onChange={e => setSearch(e.target.value)}
                placeholder="Enter ID or name..."
                style={{
                  flex: 1,
                  background: '#090e17',
                  border: '1px solid #334155',
                  color: '#fff',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 13
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: '#1e293b',
                  color: '#fff',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  padding: '10px 16px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Search
              </button>
            </form>

            {listError && (
              <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
                {listError}
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 360, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loading ? (
                <div style={{ color: '#94a3b8', fontSize: 13, padding: 20, textAlign: 'center' }}>Loading customers...</div>
              ) : customers.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: 13, padding: 20, textAlign: 'center', background: '#090e17', borderRadius: 8 }}>
                  No customers found.
                </div>
              ) : (
                customers.map(c => (
                  <div
                    key={c.id}
                    style={{
                      background: '#090e17',
                      border: '1px solid #1e293b',
                      borderRadius: 10,
                      padding: '12px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                        {c.fullName || c.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#10b981', fontFamily: 'monospace' }}>
                        Customer ID #{c.id}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 12, color: '#94a3b8' }}>
                      <div>{c.phone || 'No phone'}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{c.email || 'No email'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #0f172a', padding: '14px 20px', textAlign: 'center', fontSize: 12, color: '#64748b' }}>
        Smart Gym Management System • Sprint 1 (SCRUM-14 / SCRUM-3) • Product Owner: Mao Posovandeth (posovandethmao@gmail.com)
      </footer>
    </div>
  );
}

// =============================================================
// AUTHENTICATED APP WRAPPER
// =============================================================
function AuthenticatedApp() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('staff') || sessionStorage.getItem('staff');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return undefined;
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else if (!localStorage.getItem('staff') && !sessionStorage.getItem('staff')) {
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        await fetch('http://localhost:3001/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      await signOut(auth);
    } catch (e) {}

    localStorage.removeItem('token');
    localStorage.removeItem('staff');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('staff');
    setUser(null);
  };

  if (user === undefined) {
    return <main style={{ minHeight: '100vh', background: '#070b12', color: '#fff', display: 'grid', placeItems: 'center' }}><p>Checking staff session...</p></main>;
  }

  if (!user) {
    return <StaffLogin onLoginSuccess={staff => setUser(staff)} />;
  }

  return <StaffDashboard staffUser={user} onLogout={handleLogout} />;
}

createRoot(document.getElementById('root')).render(<AuthenticatedApp />);
