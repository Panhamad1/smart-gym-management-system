import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { auth } from './firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';







function StaffLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError('Unable to sign in. Check your email and password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <header>
        <span className="logo">SG</span>
        <span>Smart Gym Management System</span>
      </header>

      <section className="panel" style={{
        maxWidth: 420,
        margin: '60px auto',
        padding: 30
      }}>
        <h1>Staff Login</h1>
        <p>Sign in to access customer management.</p>

        <form onSubmit={handleLogin}>
          <label htmlFor="staff-email">Email</label>
          <input
            id="staff-email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <label htmlFor="staff-password">Password</label>
          <input
            id="staff-password"
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          {error && (
            <p role="alert" className="message error">{error}</p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </section>
    </main>
  );
}


function App() {
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
    const snapshot = await getDocs(collection(db, 'customers'));

    const allCustomers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const term = query.trim().toLowerCase();

    const filtered = allCustomers.filter(customer =>
      customer.id.toLowerCase() === term ||
      (customer.name || '').toLowerCase().includes(term)
    );

    setCustomers(term ? filtered : allCustomers);
  } catch (err) {
    console.error(err);
    setListError('Unable to load customers from Firestore.');
  } finally {
    setLoading(false);
  }
}


  useEffect(() => {
  setHealth('Firebase Authentication + Cloud Firestore');
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
    const customer = {
      name,
      createdAt: serverTimestamp()
    };

    if (form.phone.trim()) {
      customer.phone = form.phone.trim();
    }

    if (form.email.trim()) {
      customer.email = form.email.trim();
    }

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


  return <main>
    <header><span className="logo">SG</span><span>Smart Gym Management System</span></header>
    <section className="hero">
      <p className="eyebrow">FRONT DESK · SCRUM-3</p>
      <h1>Customer registration</h1>
      <p>Register walk-in customers and find existing records before recording a visit.</p>
      <div className="status">{health}</div>
    </section>
    <div className="workspace">
      <section className="panel">
        <h2>New customer</h2>
        <p>Only the name is required. Customers with the same name are kept as separate records.</p>
        <form onSubmit={submit}>
          <label htmlFor="name">Full name <span aria-hidden="true">*</span></label>
          <input id="name" required maxLength="120" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="e.g. Sample Customer" />
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
        {loading ? <p>Loading customers...</p> : customers.length === 0 ? <p className="empty">No customers found. Register a customer or try another search.</p> :
          <div className="customer-list">{customers.map(customer => <article key={customer.id} className="customer">
            <div><strong>{customer.name}</strong><small>Customer ID #{customer.id}</small></div>
            <div className="contact">{customer.phone || 'No phone'}<small>{customer.email || 'No email'}</small></div>
          </article>)}</div>}
      </section>
    </div>
  </main>;
}

function AuthenticatedApp() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);

  if (user === undefined) {
    return <main><p>Checking staff session...</p></main>;
  }

  if (!user) {
    return <StaffLogin />;
  }

  return (
    <>
      <div style={{ textAlign: 'right', padding: '12px 24px' }}>
        <span>{user.email} </span>
        <button type="button" onClick={() => signOut(auth)}>
          Sign Out
        </button>
      </div>
      <App />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthenticatedApp />
  </React.StrictMode>
);

