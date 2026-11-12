import React, { useState } from 'react';
import { filterCustomers } from './customer-data';
import { walkInError } from './walk-in-data';

const emptyCustomer = { fullName: '', phone: '', email: '' };

export function WalkInCheckIn({ customers, initialCustomer, onCheckIn, onViewOpenVisits }) {
  const [mode, setMode] = useState(initialCustomer ? 'existing' : 'new');
  const [search, setSearch] = useState(initialCustomer?.fullName ?? '');
  const [selectedCustomer, setSelectedCustomer] = useState(initialCustomer ?? null);
  const [form, setForm] = useState(emptyCustomer);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function changeMode(nextMode) {
    setMode(nextMode);
    setError('');
    setSuccess('');
  }

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    if (mode === 'existing' && !selectedCustomer) {
      setError('Select the customer to check in.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const customerName = mode === 'new' ? form.fullName.trim() : selectedCustomer.fullName;
      await onCheckIn(mode === 'new' ? { form } : { customerId: selectedCustomer.id });
      setSuccess(customerName + ' checked in.');
      setForm(emptyCustomer);
      setSelectedCustomer(null);
      setSearch('');
    } catch (failure) {
      setError(walkInError(failure));
    } finally {
      setSaving(false);
    }
  }

  const matches = filterCustomers(customers, search);

  return (
    <section className="walk-in-panel" aria-labelledby="walk-in-check-in-title">
      <h1 id="walk-in-check-in-title">Check-in</h1>
      <div className="walk-in-mode">
        <button type="button" aria-pressed={mode === 'existing'} disabled={saving} onClick={() => changeMode('existing')}>Returning customer</button>
        <button type="button" aria-pressed={mode === 'new'} disabled={saving} onClick={() => changeMode('new')}>New customer</button>
      </div>
      <form className="walk-in-form" onSubmit={submit}>
        <fieldset disabled={saving}>
          {mode === 'existing' ? (
            <>
              <label htmlFor="walk-in-customer-search">Customer name or ID</label>
              <input id="walk-in-customer-search" value={search} onChange={event => {
                setSearch(event.target.value);
                setSelectedCustomer(null);
              }} />
              {selectedCustomer ? (
                <p>Selected: <strong>{selectedCustomer.fullName}</strong></p>
              ) : search.trim() && (
                <ul className="walk-in-customer-results">
                  {matches.length === 0 && <li>No matching customers.</li>}
                  {matches.map(customer => (
                    <li key={customer.id}>
                      <button type="button" onClick={() => setSelectedCustomer(customer)}>
                        <strong>{customer.fullName}</strong><small>{customer.id}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <label htmlFor="walk-in-name">Full name</label>
              <input id="walk-in-name" required maxLength={120} value={form.fullName}
                onChange={event => setForm({ ...form, fullName: event.target.value })} />
              <label htmlFor="walk-in-phone">Phone (optional)</label>
              <input id="walk-in-phone" type="tel" maxLength={30} value={form.phone}
                onChange={event => setForm({ ...form, phone: event.target.value })} />
              <label htmlFor="walk-in-email">Email (optional)</label>
              <input id="walk-in-email" type="email" maxLength={254} value={form.email}
                onChange={event => setForm({ ...form, email: event.target.value })} />
            </>
          )}
          <button type="submit" className="walk-in-primary">{saving ? 'Saving…' : 'Check in'}</button>
        </fieldset>
      </form>
      {error && <p className="walk-in-error" role="alert">{error}</p>}
      {success && (
        <div>
          <p className="walk-in-success" role="status">{success}</p>
          <button type="button" onClick={onViewOpenVisits}>View open visits</button>
        </div>
      )}
    </section>
  );
}
