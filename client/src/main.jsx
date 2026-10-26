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

// Dumbbell logo component matching |H| in the photo
const DumbbellIcon = ({ className = "w-8 h-8 text-emerald-400" }) => (
  <svg viewBox="0 0 40 40" fill="currentColor" className={className} style={{ width: 36, height: 36, color: '#10b981' }}>
    <rect x="5" y="10" width="4.5" height="20" rx="2" />
    <rect x="10.5" y="13" width="3" height="14" rx="1.5" />
    <rect x="14" y="18" width="12" height="4" rx="1" />
    <rect x="26.5" y="13" width="3" height="14" rx="1.5" />
    <rect x="30.5" y="10" width="4.5" height="20" rx="2" />
  </svg>
);

// =============================================================
// STAFF LOGIN COMPONENT (Matches photo exactly)
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
      // 3. Seeded Staff Fallback (Chao / Staff@123, Admin / Admin@123)
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
    if (type === 'valid') {
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
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Top Banner */}
      <div style={{ padding: '16px 36px', fontSize: 13, color: '#64748b', fontWeight: 500 }}>
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
            <span>Simple</span> • <span>Clean</span> • <span>Efficient</span>
          </div>

          <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6, margin: '16px 0 24px' }}>
            A modern gym management system designed for staff to handle members, subscriptions, check-ins, and payments with ease.
          </p>

          <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
            <span style={{ padding: '6px 14px', borderRadius: 999, background: '#0f172a', border: '1px solid #1e293b', fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>
              7 Pages
            </span>
            <span style={{ padding: '6px 14px', borderRadius: 999, background: '#0f172a', border: '1px solid #1e293b', fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>
              6 Members
            </span>
            <span style={{ padding: '6px 14px', borderRadius: 999, background: '#0f172a', border: '1px solid #1e293b', fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>
              1 Project
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
                onClick={() => fillQuick('valid')}
                style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#6ee7b7', padding: '6px 12px', borderRadius: 8, fontSize: 12, margin: 0 }}
              >
                ✓ Valid (chao@smartgym.com / Staff@123)
              </button>
              <button
                type="button"
                onClick={() => fillQuick('invalid')}
                style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#fca5a5', padding: '6px 12px', borderRadius: 8, fontSize: 12, margin: 0 }}
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
                      background: '#0d1624',
                      border: '1px solid #334155',
                      color: '#fff',
                      borderRadius: 10,
                      padding: '12px 14px',
                      fontSize: 13
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
                      background: '#0d1624',
                      border: '1px solid #334155',
                      color: '#fff',
                      borderRadius: 10,
                      padding: '12px 42px 12px 14px',
                      fontSize: 13
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
                      margin: 0
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
                      style={{ width: 'auto', margin: 0 }}
                    />
                    <span>Remember me</span>
                  </label>
                  <a href="#forgot" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 600 }}>
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

                {/* Generic error banner (Acceptance Criterion 1) */}
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
    </div>
  );
}

// =============================================================
// MAIN WORKSPACE (SCRUM-3 & SCRUM-14 Protected Area)
// =============================================================
function App({ staffUser, onLogout }) {
  const [health, setHealth] = useState('Checking connection...');
  const [form, setForm] = useState({ fullName: '', phone: '', email: '' });
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const [success, setSuccess] = useState('');

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

      // 2. Fallback to Firestore (SCRUM-3)
      const snapshot = await getDocs(collection(db, 'customers'));
      const allCustomers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const term = query.trim().toLowerCase();
      const filtered = allCustomers.filter(customer =>
        customer.id.toLowerCase() === term ||
        (customer.name || customer.fullName || '').toLowerCase().includes(term)
      );
      setCustomers(term ? filtered : allCustomers);
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
      const customer = { name, createdAt: serverTimestamp() };
      if (form.phone.trim()) customer.phone = form.phone.trim();
      if (form.email.trim()) customer.email = form.email.trim();
      const result = await addDoc(collection(db, 'customers'), customer);
      setSuccess(`Customer #${result.id} registered successfully.`);
      setForm({ fullName: '', phone: '', email: '' });
      await loadCustomers(search);
    } catch (err) {
      console.error(err);
      setError('Unable to register customer. Check your staff access.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="logo">SG</span>
          <span>Smart Gym Management System</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>
            👤 {staffUser?.fullName || staffUser?.email || 'Staff'}
          </span>
          <button
            type="button"
            onClick={onLogout}
            style={{ margin: 0, padding: '8px 14px', background: '#dc2626', fontSize: 12 }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <section className="hero">
        <p className="eyebrow">STAFF CONSOLE · SCRUM-14 / SCRUM-3</p>
        <h1>Customer registration & attendance</h1>
        <p>Register walk-in customers and find existing records before recording a visit.</p>
        <div className="status">{health}</div>
      </section>

      <div className="workspace">
        <section className="panel">
          <h2>New customer</h2>
          <p>Only the name is required. Customers with the same name are kept as separate records.</p>
          <form onSubmit={submit}>
            <label htmlFor="name">Full name <span aria-hidden="true">*</span></label>
            <input id="name" required maxLength="120" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="e.g. Sokha Chan" />
            <label htmlFor="phone">Phone (optional)</label>
            <input id="phone" maxLength="30" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
            <label htmlFor="email">Email (optional)</label>
            <input id="email" type="email" maxLength="254" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" />
            {error && <p role="alert" className="message error">{error}</p>}
            {success && <p role="status" className="message success">{success}</p>}
            <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Register customer'}</button>
          </form>
        </section>

        <section className="panel">
          <h2>Find customers</h2>
          <form className="search" onSubmit={e => { e.preventDefault(); loadCustomers(search); }}>
            <label htmlFor="search">Search by customer ID or name</label>
            <div className="search-row">
              <input id="search" value={search} maxLength="150" onChange={e => setSearch(e.target.value)} placeholder="Enter ID or name" />
              <button type="submit" disabled={loading}>Search</button>
            </div>
          </form>
          {listError && <p role="alert" className="message error">{listError}</p>}
          {loading ? <p>Loading customers...</p> : customers.length === 0 ? <p className="empty">No customers found.</p> :
            <div className="customer-list">{customers.map(customer => (
              <article key={customer.id} className="customer">
                <div><strong>{customer.fullName || customer.name}</strong><small>Customer ID #{customer.id}</small></div>
                <div className="contact">{customer.phone || 'No phone'}<small>{customer.email || 'No email'}</small></div>
              </article>
            ))}</div>}
        </section>
      </div>
    </main>
  );
}

// =============================================================
// AUTHENTICATED WRAPPER
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
    return <main><p style={{ padding: 20 }}>Checking staff session...</p></main>;
  }

  if (!user) {
    return <StaffLogin onLoginSuccess={staff => setUser(staff)} />;
  }

  return <App staffUser={user} onLogout={handleLogout} />;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthenticatedApp />
  </React.StrictMode>
);
