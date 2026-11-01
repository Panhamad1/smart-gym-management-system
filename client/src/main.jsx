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
// SCREEN 2: STAFF DASHBOARD (Matches Figma Exactly)
// =============================================================

// Crisp SVG Icons matching Figma design
const IconDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const IconCustomers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconPlans = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const IconCheckin = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

const IconOpenVisits = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);

const IconPayments = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

const IconSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconUserSilhouette = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
  </svg>
);

const IconClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconUserPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);

const IconIdCard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <line x1="6" y1="8" x2="10" y2="8" />
    <line x1="6" y1="12" x2="14" y2="12" />
    <line x1="6" y1="16" x2="12" y2="16" />
    <circle cx="17" cy="9" r="2" />
  </svg>
);

function StaffDashboard({ staffUser, onLogout }) {
  const [search, setSearch] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showVisitsModal, setShowVisitsModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Core metrics matching Figma Screen 2
  const [metrics, setMetrics] = useState({
    totalMembers: 124,
    activeSubscriptions: 98,
    todayCheckins: 42,
    openVisits: 18
  });

  // Recent Check-ins matching Figma Screen 2
  const [checkins, setCheckins] = useState([
    { id: 1, name: 'Sok Chan', time: '10:24 AM', type: 'Member' },
    { id: 2, name: 'Da Ra', time: '10:12 AM', type: 'Member' },
    { id: 3, name: 'Vireak S.', time: '09:58 AM', type: 'Walk-in' },
    { id: 4, name: 'Chea Srey', time: '09:45 AM', type: 'Member' },
    { id: 5, name: 'Tith Dara', time: '09:32 AM', type: 'Member' }
  ]);

  // Customer registration form state
  const [regForm, setRegForm] = useState({ fullName: '', phone: '', email: '' });
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [regSuccess, setRegSuccess] = useState('');
  const [regError, setRegError] = useState('');

  // Quick check-in form state
  const [checkinName, setCheckinName] = useState('');
  const [checkinType, setCheckinType] = useState('Member');

  // Handle register customer (SCRUM-3)
  const handleRegisterCustomer = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    const name = regForm.fullName.trim();
    if (!name) {
      setRegError('Please enter a customer name.');
      return;
    }

    setSavingCustomer(true);
    try {
      // 1. Try Express backend if token exists
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        try {
          await fetch('http://localhost:3001/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
            body: JSON.stringify({ fullName: name, phone: regForm.phone, email: regForm.email })
          });
        } catch (e) {}
      }

      // 2. Try Firestore fallback
      try {
        await addDoc(collection(db, 'customers'), {
          name,
          phone: regForm.phone.trim() || null,
          email: regForm.email.trim() || null,
          createdAt: serverTimestamp()
        });
      } catch (e) {}

      // Increment metrics
      setMetrics(prev => ({ ...prev, totalMembers: prev.totalMembers + 1 }));
      setRegSuccess('Customer "' + name + '" registered successfully.');
      setRegForm({ fullName: '', phone: '', email: '' });
      setTimeout(() => {
        setRegSuccess('');
        setShowRegisterModal(false);
      }, 1500);
    } catch (err) {
      setRegError('Error saving customer.');
    } finally {
      setSavingCustomer(false);
    }
  };

  // Handle quick check-in
  const handlePerformCheckin = (e) => {
    e.preventDefault();
    if (!checkinName.trim()) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newEntry = {
      id: Date.now(),
      name: checkinName.trim(),
      time: timeStr,
      type: checkinType
    };

    setCheckins([newEntry, ...checkins]);
    setMetrics(prev => ({
      ...prev,
      todayCheckins: prev.todayCheckins + 1,
      openVisits: prev.openVisits + 1
    }));
    setCheckinName('');
    setShowCheckinModal(false);
  };

  // Filter check-ins based on search
  const filteredCheckins = checkins.filter(c =>
    !search.trim() ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#060911',
      color: '#f8fafc',
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      padding: '24px 28px',
      boxSizing: 'border-box'
    }}>
      {/* Top Breadcrumb / Title Label matching Figma Screen 2 */}
      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 12 }}>
        Smart Gym - 2. Dashboard
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 20px', color: '#ffffff', letterSpacing: '-0.3px' }}>
        2. Dashboard
      </h2>

      {/* Main Outer App Frame */}
      <div style={{
        backgroundColor: '#0c1322',
        border: '1px solid #1a263d',
        borderRadius: 20,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        minHeight: 740,
        overflow: 'hidden'
      }}>
        
        {/* ========================================================= */}
        {/* LEFT SIDEBAR                                              */}
        {/* ========================================================= */}
        <aside style={{
          width: 230,
          backgroundColor: '#080d19',
          borderRight: '1px solid #192338',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, paddingLeft: 8 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'grid',
                placeItems: 'center'
              }}>
                <DumbbellIcon style={{ width: 22, height: 22 }} />
              </div>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#ffffff', letterSpacing: '-0.3px' }}>
                Smart Gym
              </div>
            </div>

            {/* Main Nav Links */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Dashboard (Active) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 10,
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#34d399',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}>
                <IconDashboard />
                <span>Dashboard</span>
              </div>

              {/* Customers */}
              <div
                onClick={() => setShowRegisterModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 10,
                  color: '#94a3b8',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s'
                }}
              >
                <IconCustomers />
                <span>Customers</span>
              </div>

              {/* Plans & Subscriptions */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 10,
                color: '#94a3b8',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'default'
              }}>
                <IconPlans />
                <span>Plans &amp; Subscriptions</span>
              </div>

              {/* Check-in */}
              <div
                onClick={() => setShowCheckinModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 10,
                  color: '#94a3b8',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                <IconCheckin />
                <span>Check-in</span>
              </div>

              {/* Open Visits */}
              <div
                onClick={() => setShowVisitsModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 10,
                  color: '#94a3b8',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                <IconOpenVisits />
                <span>Open Visits</span>
              </div>

              {/* Payments */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 10,
                color: '#94a3b8',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'default'
              }}>
                <IconPayments />
                <span>Payments</span>
              </div>
            </nav>
          </div>

          {/* Bottom Nav Links */}
          <div style={{ borderTop: '1px solid #192338', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Settings */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 10,
              color: '#94a3b8',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'default'
            }}>
              <IconSettings />
              <span>Settings</span>
            </div>

            {/* Log out */}
            <div
              onClick={onLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 10,
                color: '#94a3b8',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <IconLogout />
              <span>Log out</span>
            </div>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* RIGHT MAIN CONTENT AREA                                   */}
        {/* ========================================================= */}
        <main style={{ flex: 1, padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto' }}>
          
          {/* Top Bar: Search, Notification Bell, Staff Profile */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
              <div style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center'
              }}>
                <IconSearch />
              </div>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                style={{
                  width: '100%',
                  backgroundColor: '#0d1627',
                  border: '1px solid #1d2a42',
                  borderRadius: 10,
                  color: '#ffffff',
                  padding: '9px 12px 9px 36px',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Right Header: Bell & Staff Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Notification Bell */}
              <button
                type="button"
                style={{
                  background: 'transparent',
                  border: 0,
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <IconBell />
              </button>

              {/* Staff Profile Badge */}
              <div style={{ position: 'relative' }}>
                <div
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: '#334155',
                    color: '#94a3b8',
                    display: 'grid',
                    placeItems: 'center'
                  }}>
                    <IconUserSilhouette />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                      {staffUser?.fullName || 'Staff'}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ color: '#10b981', fontSize: 10 }}>●</span> Active
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: '#64748b', marginLeft: 4 }}>⌄</span>
                </div>

                {/* Profile dropdown */}
                {showProfileMenu && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '120%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: 12,
                    padding: 12,
                    width: 220,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    zIndex: 20
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
                      {staffUser?.fullName || 'Mao Posovandeth'}
                    </div>
                    <div style={{ fontSize: 11, color: '#10b981', margin: '2px 0 10px' }}>
                      {staffUser?.email || 'posovandethmao@gmail.com'}
                    </div>
                    <button
                      type="button"
                      onClick={onLogout}
                      style={{
                        width: '100%',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        color: '#f87171',
                        padding: '6px 10px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dashboard Header: Title, Subtitle, Date */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px', color: '#ffffff', letterSpacing: '-0.3px' }}>
                Dashboard
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
                Here's what's happening at your gym today.
              </p>
            </div>

            {/* Date Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#0d1627',
              border: '1px solid #1d2a42',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 600,
              color: '#cbd5e1'
            }}>
              <IconCalendar />
              <span>Oct 26, 2026</span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* ROW 1: 4 METRIC CARDS                                     */}
          {/* ========================================================= */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: 16
          }}>
            {/* Card 1: Total Members */}
            <div style={{
              backgroundColor: '#0d1627',
              border: '1px solid #1a273f',
              borderRadius: 14,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                display: 'grid',
                placeItems: 'center'
              }}>
                <IconCustomers />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Total Members</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', margin: '4px 0 2px' }}>
                  {metrics.totalMembers}
                </div>
                <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>+5 this month</div>
              </div>
            </div>

            {/* Card 2: Active Subscriptions */}
            <div style={{
              backgroundColor: '#0d1627',
              border: '1px solid #1a273f',
              borderRadius: 14,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                color: '#3b82f6',
                display: 'grid',
                placeItems: 'center'
              }}>
                <IconPlans />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Active Subscriptions</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', margin: '4px 0 2px' }}>
                  {metrics.activeSubscriptions}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>79% of total</div>
              </div>
            </div>

            {/* Card 3: Today's Check-ins */}
            <div style={{
              backgroundColor: '#0d1627',
              border: '1px solid #1a273f',
              borderRadius: 14,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: 'rgba(168, 85, 247, 0.12)',
                color: '#a855f7',
                display: 'grid',
                placeItems: 'center'
              }}>
                <IconClock />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Today's Check-ins</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', margin: '4px 0 2px' }}>
                  {metrics.todayCheckins}
                </div>
                <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>+12% vs yesterday</div>
              </div>
            </div>

            {/* Card 4: Open Visits */}
            <div style={{
              backgroundColor: '#0d1627',
              border: '1px solid #1a273f',
              borderRadius: 14,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                color: '#f59e0b',
                display: 'grid',
                placeItems: 'center'
              }}>
                <IconOpenVisits />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Open Visits</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', margin: '4px 0 2px' }}>
                  {metrics.openVisits}
                </div>
                <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>Currently inside</div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* ROW 2: QUICK ACTIONS & RECENT CHECK-INS                   */}
          {/* ========================================================= */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr', gap: 20 }}>
            
            {/* Quick Actions Panel */}
            <div style={{
              backgroundColor: '#0d1627',
              border: '1px solid #1a273f',
              borderRadius: 14,
              padding: 22,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', marginBottom: 18 }}>
                Quick Actions
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Register Customer Button */}
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(true)}
                  style={{
                    background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                    border: 0,
                    borderRadius: 12,
                    color: '#ffffff',
                    padding: '14px 18px',
                    fontSize: 13,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
                    transition: 'transform 0.1s'
                  }}
                >
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    display: 'grid',
                    placeItems: 'center'
                  }}>
                    <IconUserPlus />
                  </div>
                  <span>Register Customer</span>
                </button>

                {/* Check-in Button */}
                <button
                  type="button"
                  onClick={() => setShowCheckinModal(true)}
                  style={{
                    background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                    border: 0,
                    borderRadius: 12,
                    color: '#ffffff',
                    padding: '14px 18px',
                    fontSize: 13,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.25)',
                    transition: 'transform 0.1s'
                  }}
                >
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    display: 'grid',
                    placeItems: 'center'
                  }}>
                    <IconIdCard />
                  </div>
                  <span>Check-in</span>
                </button>

                {/* Open Visits Button */}
                <button
                  type="button"
                  onClick={() => setShowVisitsModal(true)}
                  style={{
                    background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)',
                    border: 0,
                    borderRadius: 12,
                    color: '#ffffff',
                    padding: '14px 18px',
                    fontSize: 13,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.25)',
                    transition: 'transform 0.1s'
                  }}
                >
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    display: 'grid',
                    placeItems: 'center'
                  }}>
                    <IconOpenVisits />
                  </div>
                  <span>Open Visits</span>
                </button>
              </div>
            </div>

            {/* Recent Check-ins Panel */}
            <div style={{
              backgroundColor: '#0d1627',
              border: '1px solid #1a273f',
              borderRadius: 14,
              padding: 22,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', marginBottom: 16 }}>
                Recent Check-ins
              </div>

              {/* Table Column Headers */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.2fr 1fr',
                padding: '0 8px 10px',
                borderBottom: '1px solid #19243a',
                fontSize: 12,
                color: '#64748b',
                fontWeight: 600
              }}>
                <div>Name</div>
                <div>Time</div>
                <div style={{ textAlign: 'right' }}>Type</div>
              </div>

              {/* Table Rows */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredCheckins.length === 0 ? (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                    No check-ins match your search.
                  </div>
                ) : (
                  filteredCheckins.map(item => (
                    <div
                      key={item.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1.2fr 1fr',
                        alignItems: 'center',
                        padding: '12px 8px',
                        borderBottom: '1px solid rgba(25, 36, 58, 0.6)',
                        fontSize: 13
                      }}
                    >
                      {/* Name with Avatar Silhouette */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          backgroundColor: '#1a273f',
                          color: '#64748b',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0
                        }}>
                          <IconUserSilhouette />
                        </div>
                        <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                          {item.name}
                        </span>
                      </div>

                      {/* Time */}
                      <div style={{ color: '#94a3b8', fontSize: 12 }}>
                        {item.time}
                      </div>

                      {/* Type Badge */}
                      <div style={{ textAlign: 'right', color: '#38bdf8', fontWeight: 600, fontSize: 12 }}>
                        {item.type}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODAL: REGISTER CUSTOMER (SCRUM-3)                        */}
      {/* ========================================================= */}
      {showRegisterModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 100,
          padding: 16
        }}>
          <div style={{
            backgroundColor: '#0c1322',
            border: '1px solid #1e293b',
            borderRadius: 16,
            width: '100%',
            maxWidth: 440,
            padding: 24,
            boxShadow: '0 25px 50px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#ffffff' }}>Register New Customer</div>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                style={{ background: 'transparent', border: 0, color: '#94a3b8', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '0 0 18px', fontSize: 12, color: '#94a3b8' }}>
              Add a walk-in or new gym member record directly to the database.
            </p>

            <form onSubmit={handleRegisterCustomer} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                  Full Name <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  required
                  value={regForm.fullName}
                  onChange={e => setRegForm({ ...regForm, fullName: e.target.value })}
                  placeholder="e.g. Bopha Chea"
                  style={{
                    width: '100%',
                    backgroundColor: '#070d18',
                    border: '1px solid #1e293b',
                    borderRadius: 8,
                    color: '#fff',
                    padding: '10px 12px',
                    fontSize: 13,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                  Phone Number
                </label>
                <input
                  value={regForm.phone}
                  onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                  placeholder="012-889-900"
                  style={{
                    width: '100%',
                    backgroundColor: '#070d18',
                    border: '1px solid #1e293b',
                    borderRadius: 8,
                    color: '#fff',
                    padding: '10px 12px',
                    fontSize: 13,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={regForm.email}
                  onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                  placeholder="customer@example.com"
                  style={{
                    width: '100%',
                    backgroundColor: '#070d18',
                    border: '1px solid #1e293b',
                    borderRadius: 8,
                    color: '#fff',
                    padding: '10px 12px',
                    fontSize: 13,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {regError && (
                <div style={{ color: '#f87171', fontSize: 12, fontWeight: 600 }}>⚠️ {regError}</div>
              )}
              {regSuccess && (
                <div style={{ color: '#34d399', fontSize: 12, fontWeight: 600 }}>✓ {regSuccess}</div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: '#cbd5e1',
                    borderRadius: 8,
                    padding: '10px 16px',
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustomer}
                  style={{
                    background: '#10b981',
                    border: 0,
                    borderRadius: 8,
                    color: '#090e17',
                    padding: '10px 18px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {savingCustomer ? 'Saving...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CHECK-IN QUICK ACTION                              */}
      {/* ========================================================= */}
      {showCheckinModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 100,
          padding: 16
        }}>
          <div style={{
            backgroundColor: '#0c1322',
            border: '1px solid #1e293b',
            borderRadius: 16,
            width: '100%',
            maxWidth: 400,
            padding: 24,
            boxShadow: '0 25px 50px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#ffffff' }}>Gym Check-in</div>
              <button
                type="button"
                onClick={() => setShowCheckinModal(false)}
                style={{ background: 'transparent', border: 0, color: '#94a3b8', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePerformCheckin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                  Member / Visitor Name
                </label>
                <input
                  required
                  value={checkinName}
                  onChange={e => setCheckinName(e.target.value)}
                  placeholder="e.g. Chan Dara"
                  style={{
                    width: '100%',
                    backgroundColor: '#070d18',
                    border: '1px solid #1e293b',
                    borderRadius: 8,
                    color: '#fff',
                    padding: '10px 12px',
                    fontSize: 13,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                  Entry Type
                </label>
                <select
                  value={checkinType}
                  onChange={e => setCheckinType(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#070d18',
                    border: '1px solid #1e293b',
                    borderRadius: 8,
                    color: '#fff',
                    padding: '10px 12px',
                    fontSize: 13,
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Member">Member</option>
                  <option value="Walk-in">Walk-in ($2.00 fee)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowCheckinModal(false)}
                  style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: '#cbd5e1',
                    borderRadius: 8,
                    padding: '10px 16px',
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#3b82f6',
                    border: 0,
                    borderRadius: 8,
                    color: '#ffffff',
                    padding: '10px 18px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Confirm Check-in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: OPEN VISITS                                        */}
      {/* ========================================================= */}
      {showVisitsModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 100,
          padding: 16
        }}>
          <div style={{
            backgroundColor: '#0c1322',
            border: '1px solid #1e293b',
            borderRadius: 16,
            width: '100%',
            maxWidth: 440,
            padding: 24,
            boxShadow: '0 25px 50px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#ffffff' }}>Active Open Visits</div>
                <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>{metrics.openVisits} members currently inside</div>
              </div>
              <button
                type="button"
                onClick={() => setShowVisitsModal(false)}
                style={{ background: 'transparent', border: 0, color: '#94a3b8', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
              {checkins.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    backgroundColor: '#070d18',
                    borderRadius: 8,
                    border: '1px solid #1e293b'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#10b981', fontSize: 10 }}>●</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{item.name}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Entered {item.time}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setShowVisitsModal(false)}
                style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  color: '#cbd5e1',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
