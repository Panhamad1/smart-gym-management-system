import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
async function request(path, options) {
  const response = await fetch(`${API}${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed. Please try again.');
  return data;
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
      const data = await request(`/api/customers?search=${encodeURIComponent(query)}`);
      setCustomers(data.customers);
    } catch (e) { setListError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    request('/api/health')
      .then(data => setHealth(`API online · MySQL ${data.database}`))
      .catch(() => setHealth('API or database unavailable'));
    loadCustomers();
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const data = await request('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      setSuccess(`Customer #${data.customer.id} registered successfully.`);
      setForm({ fullName: '', phone: '', email: '' });
      await loadCustomers(search);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
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
          <input id="name" required maxLength="150" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="e.g. Sample Customer" />
          <label htmlFor="phone">Phone (optional)</label>
          <input id="phone" maxLength="30" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
          <label htmlFor="email">Email (optional)</label>
          <input id="email" type="email" maxLength="255" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" />
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
            <div><strong>{customer.fullName}</strong><small>Customer ID #{customer.id}</small></div>
            <div className="contact">{customer.phone || 'No phone'}<small>{customer.email || 'No email'}</small></div>
          </article>)}</div>}
      </section>
    </div>
  </main>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
