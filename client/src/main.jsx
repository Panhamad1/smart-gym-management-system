import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { normalizeCustomer } from './customer-data';
import { archiveCustomer, checkInWalkIn, checkOutWalkIn } from './walk-in-data';
import { CustomerDirectory } from './customer-directory';
import { WalkInCheckIn } from './walk-in-check-in';
import { OpenWalkIns, WalkInPayments, useTodayCheckIns, useWalkInRecords, visitTime } from './walk-in-visits';
import { auth, db } from './firebase';
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  collection,
  onSnapshot
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
function StaffLogin() {
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

    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, cleanInput, password);
    } catch (error) {
      setError(error.code === 'auth/network-request-failed'
        ? 'Unable to connect. Check your internet connection and try again.'
        : error.code === 'auth/too-many-requests'
          ? 'Too many attempts. Please try again later.'
          : 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

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
            Sign in to register and find customer records.
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

          <p style={{ color: '#94a3b8', fontSize: 13 }}>Sign in with your authorized staff email and password. Contact your administrator if you need access.</p>
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
                {/* Staff Email */}
                <div>
                  <input
                    type="email"
                    aria-label="Staff email"
                    autoComplete="username"
                    required
                    value={usernameOrEmail}
                    onChange={e => { setUsernameOrEmail(e.target.value); if (error) setError(''); }}
                    placeholder="Staff email"
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
                    aria-label="Password"
                    autoComplete="current-password"
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

                {/* Remember me */}
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

const IconUserPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);

function PlannedFeature({ icon: Icon, children }) {
  return (
    <div className="planned-feature">
      <span className="planned-feature-name"><Icon />{children}</span>
      <span className="planned-badge">Planned</span>
    </div>
  );
}

function VisitLink({ icon: Icon, tab, activeTab, onNavigate, children }) {
  return (
    <button className="planned-feature visit-link" type="button" aria-current={activeTab === tab ? 'page' : undefined}
      onClick={() => onNavigate(tab)}>
      <span className="planned-feature-name"><Icon />{children}</span>
    </button>
  );
}

function PlannedMetric({ label, icon: Icon, accent, tint, value, status = 'Planned' }) {
  return (
    <div className="planned-metric">
      <span className="planned-metric-icon" style={{ color: accent, backgroundColor: tint }}><Icon /></span>
      <div>
        <div className="planned-metric-label">{label}</div>
        <div className="planned-metric-value">{value ?? '—'}</div>
        {value == null && <div className="planned-metric-label">{status}</div>}
      </div>
    </div>
  );
}

function StaffDashboard({ staffUser, onLogout }) {
  const [{ tab: activeTab, customer, visit }, setScreen] = useState({ tab: 'dashboard' });
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [customerTotal, setCustomerTotal] = useState(null);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState('');
  const [customerRefresh, setCustomerRefresh] = useState(0);
  const openVisits = useWalkInRecords(db, customerTotal !== null, 'openWalkIns');
  const todayCheckIns = useTodayCheckIns(db, customerTotal !== null && activeTab === 'dashboard', openVisits);
  useEffect(() => {
    setCustomersLoading(true);
    setCustomersError('');
    const loadingTimeout = setTimeout(() => {
      setCustomersError('Unable to reach the customer database. Check your connection, then retry.');
      setCustomerTotal(null);
      setCustomersLoading(false);
    }, 10000);
    const unsubscribe = onSnapshot(collection(db, 'customers'), { includeMetadataChanges: true }, snapshot => {
      if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
      clearTimeout(loadingTimeout);
      setCustomersError('');
      const availableCustomers = snapshot.docs.map(doc => normalizeCustomer(doc.id, doc.data()))
        .filter(customer => !customer.archivedAt);
      setCustomers(availableCustomers);
      setCustomerTotal(availableCustomers.length);
      setCustomersLoading(false);
    }, error => {
      clearTimeout(loadingTimeout);
      setCustomersError(error.code === 'permission-denied'
        ? 'Your account does not have customer access. Contact your administrator.'
        : 'Unable to load customers. Check your connection and retry.');
      setCustomerTotal(null);
      setCustomersLoading(false);
    });
    return () => { clearTimeout(loadingTimeout); unsubscribe(); };
  }, [customerRefresh]);

  function setActiveTab(tab, selection = {}) {
    setScreen({ tab, ...selection });
  }
  const pageTitle = {
    dashboard: '2. Dashboard', customers: '3. Customer Management',
    'check-in': 'Check-in', 'open-visits': 'Open Visits', payments: 'Payments'
  }[activeTab];
  const visitNavigation = { activeTab, onNavigate: setActiveTab };

  if (customerTotal === null) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeContent: 'center', padding: 24, backgroundColor: '#070b12', color: '#f8fafc' }}>
        {customersLoading ? (
          <p role="status" style={{ color: '#cbd5e1' }}>Checking customer access…</p>
        ) : (
          <>
            <p role="alert" style={{ color: '#fca5a5' }}>{customersError}</p>
            <button type="button" onClick={() => setCustomerRefresh(value => value + 1)}>Retry</button>
            <button type="button" onClick={onLogout}>Sign out</button>
          </>
        )}
      </main>
    );
  }

  return (
    <div className="staff-workspace" style={{
      minHeight: '100vh',
      backgroundColor: '#060911',
      color: '#f8fafc',
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      boxSizing: 'border-box'
    }}>
      {/* Top Breadcrumb / Title Label */}
      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 12 }}>
        Smart Gym - {pageTitle}
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 20px', color: '#ffffff', letterSpacing: '-0.3px' }}>
        {pageTitle}
      </h2>

      {/* Main Outer App Frame */}
      <div className="staff-layout" style={{
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
        <aside className="staff-sidebar" style={{
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
            <nav className="staff-nav" aria-label="Staff navigation" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Dashboard Nav Item */}
              <button type="button" aria-current={activeTab === 'dashboard' ? 'page' : undefined}
                onClick={() => setActiveTab('dashboard')}
                style={{
                  display: 'flex',
                  textAlign: 'left',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 10,
                  backgroundColor: activeTab === 'dashboard' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                  border: activeTab === 'dashboard' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
                  color: activeTab === 'dashboard' ? '#34d399' : '#94a3b8',
                  fontSize: 13,
                  fontWeight: activeTab === 'dashboard' ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s'
                }}
              >
                <IconDashboard />
                <span>Dashboard</span>
              </button>

              {/* Customers Nav Item (Active Pill matches Screen 3) */}
              <button type="button" aria-current={activeTab === 'customers' ? 'page' : undefined}
                onClick={() => setActiveTab('customers')}
                style={{
                  display: 'flex',
                  textAlign: 'left',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 10,
                  backgroundColor: activeTab === 'customers' ? '#0d9488' : 'transparent',
                  border: activeTab === 'customers' ? '1px solid #14b8a6' : '1px solid transparent',
                  color: activeTab === 'customers' ? '#ffffff' : '#94a3b8',
                  fontSize: 13,
                  fontWeight: activeTab === 'customers' ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s'
                }}
              >
                <IconCustomers />
                <span>Customers</span>
              </button>

              <PlannedFeature icon={IconPlans}>Plans &amp; Subscriptions</PlannedFeature>
              <VisitLink icon={IconCheckin} tab="check-in" {...visitNavigation}>Check-in</VisitLink>
              <VisitLink icon={IconOpenVisits} tab="open-visits" {...visitNavigation}>Open Visits</VisitLink>
              <VisitLink icon={IconPayments} tab="payments" {...visitNavigation}>Payments</VisitLink>
            </nav>
          </div>

          {/* Bottom Nav Links */}
          <div style={{ borderTop: '1px solid #192338', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <PlannedFeature icon={IconSettings}>Settings</PlannedFeature>
            {/* Log out */}
            <button type="button" className="staff-logout"
              onClick={onLogout}
              style={{
                display: 'flex',
                textAlign: 'left',
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
            </button>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* RIGHT MAIN CONTENT AREA                                   */}
        {/* ========================================================= */}
        <main className="staff-main" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
            {/* Staff profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
                      <span style={{ color: '#10b981', fontSize: 10 }}>●</span> online
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
                      {staffUser?.fullName || 'Staff'}
                    </div>
                    <div style={{ fontSize: 11, color: '#10b981', margin: '2px 0 10px' }}>
                      {staffUser?.email}
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

          {/* ========================================================= */}
          {/* TAB 1: DASHBOARD VIEW (Figma Screen 2)                    */}
          {/* ========================================================= */}
          {activeTab === 'dashboard' && (
            <>
              {/* Dashboard Header: Title, Subtitle, Date */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px', color: '#ffffff', letterSpacing: '-0.3px' }}>
                    Dashboard
                  </h1>
                  <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
                    View your customer count or register a customer.
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
                  <span>{new Date().toLocaleDateString('en-US', { dateStyle: 'medium', timeZone: 'Asia/Phnom_Penh' })}</span>
                </div>
              </div>

              {/* Registered customer count */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: 16
              }}>
                {/* Card 1: Registered Customers */}
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
                    <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Registered Customers</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', margin: '4px 0 2px' }}>
                      {customerTotal}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Firestore customer records</div>
                  </div>
                </div>

                <PlannedMetric label="Active Subscriptions" icon={IconPlans} accent="#3b82f6" tint="rgba(59, 130, 246, 0.12)" />
                <PlannedMetric label="Today's Check-ins (Cambodia)" icon={IconCheckin} accent="#a855f7" tint="rgba(168, 85, 247, 0.12)"
                  value={todayCheckIns.count} status={todayCheckIns.status} />
                <PlannedMetric label="Open Visits" icon={IconOpenVisits} accent="#f59e0b" tint="rgba(245, 158, 11, 0.12)"
                  value={openVisits.records?.length} status={openVisits.error ? 'Unavailable' : 'Loading…'} />
              </div>

              {/* Customer actions and attendance preview */}
              <div className="dashboard-panels">
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
                    <button
                      type="button"
                      onClick={() => setActiveTab('check-in')}
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
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)'
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
                      <span>New walk-in</span>
                    </button>

                    <button type="button" className="customer-directory-action" onClick={() => setActiveTab('customers')}>
                      View Customers
                    </button>
                    <VisitLink icon={IconOpenVisits} tab="open-visits" {...visitNavigation}>Open Visits</VisitLink>
                  </div>
                </div>
                <section className="planned-metric attendance-preview" aria-labelledby="recent-checkins-title">
                  <h2 id="recent-checkins-title">Recent Open Check-ins</h2>
                  <div className="attendance-preview-columns" aria-hidden="true">
                    <span>Name</span><span>Time</span><span>Type</span>
                  </div>
                  {openVisits.records?.slice(0, 5).map(visit => (
                    <div className="attendance-preview-columns" key={visit.visitId}>
                      <span>{visit.customerName}</span><span>{visitTime(visit.checkedInAt)}</span><span>Walk-in</span>
                    </div>
                  ))}
                  {openVisits.error && <p>Walk-in records are unavailable.</p>}
                  {!openVisits.error && !openVisits.records && <p>Loading open visits…</p>}
                  {openVisits.records?.length === 0 && <p>No open walk-in visits.</p>}
                </section>
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* TAB 2: CUSTOMERS MANAGEMENT VIEW (Figma Screen 3)         */}
          {/* ========================================================= */}
          {activeTab === 'check-in' && (
            <WalkInCheckIn customers={customers} initialCustomer={customer} onCheckIn={input => checkInWalkIn(db, staffUser.uid, input)}
              onViewOpenVisits={() => setActiveTab('open-visits')} />
          )}
          {activeTab === 'open-visits' && (
            <OpenWalkIns db={db} result={openVisits} initialVisit={visit} onCheckout={input => checkOutWalkIn(db, staffUser.uid, input)} />
          )}
          {activeTab === 'payments' && <WalkInPayments db={db} />}
          {activeTab === 'customers' && (
            <CustomerDirectory customers={customers} openVisits={openVisits}
              onNewWalkIn={() => setActiveTab('check-in')}
              onCheckIn={customer => setActiveTab('check-in', { customer })}
              onArchive={customerId => archiveCustomer(db, staffUser.uid, customerId)}
              onCheckout={visit => setActiveTab('open-visits', { visit })} />
          )}
        </main>
      </div>

    </div>
  );
}
// =============================================================
function AuthenticatedApp() {
  const [user, setUser] = useState(undefined);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    // Remove legacy demo/API sessions; only Firebase restores a staff session.
    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem('token');
      storage.removeItem('staff');
    }
    return onAuthStateChanged(auth, firebaseUser => {
      setUser(firebaseUser ? {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        fullName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Staff'
      } : null);
    }, () => setAuthError('Unable to check your staff session. Please refresh and try again.'));
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      setAuthError('Unable to sign out. Please try again.');
    }
  };

  if (authError) {
    return <main className="session-error" role="alert"><p>{authError}</p><button onClick={() => window.location.reload()}>Retry</button></main>;
  }

  if (user === undefined) {
    return <main style={{ minHeight: '100vh', background: '#070b12', color: '#fff', display: 'grid', placeItems: 'center' }}><p>Checking staff session...</p></main>;
  }

  if (!user) {
    return <StaffLogin />;
  }

  return <StaffDashboard staffUser={user} onLogout={handleLogout} />;
}

createRoot(document.getElementById('root')).render(<AuthenticatedApp />);
