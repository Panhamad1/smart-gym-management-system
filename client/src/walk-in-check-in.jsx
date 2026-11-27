import React, { useState } from 'react';
import { filterCustomers, customerReference, phoneHint } from './customer-data';
import { walkInError } from './walk-in-data';
import { membershipStatus } from './subscription-data';

const emptyCustomer = { fullName: '', phone: '', email: '' };

export function WalkInCheckIn({ customers, initialCustomer, memberships = [], onCheckIn, onViewOpenVisits }) {
  const [mode, setMode] = useState(initialCustomer ? 'existing' : 'new');
  const [search, setSearch] = useState(initialCustomer?.fullName ?? '');
  const [selectedCustomer, setSelectedCustomer] = useState(initialCustomer ?? null);
  const [identityConfirmed, setIdentityConfirmed] = useState(false);
  const [visitType, setVisitType] = useState('walk-in');
  const [form, setForm] = useState(emptyCustomer);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function changeMode(nextMode) {
    setMode(nextMode);
    setSelectedCustomer(null);
    setIdentityConfirmed(false);
    setVisitType('walk-in');
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
    if (mode === 'existing' && !identityConfirmed) {
      setError('Confirm the customer identity before checking in.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const customerName = mode === 'new' ? form.fullName.trim() : selectedCustomer.fullName;
      const input = mode === 'new' ? { form } : { customerId: selectedCustomer.id, type: visitType };
      const result = await onCheckIn(input);
      const reference = customerReference(result?.customerId || selectedCustomer?.id, customers);
      setSuccess(customerName + ' checked in. Customer reference: ' + reference + '.');
      setForm(emptyCustomer);
      setSelectedCustomer(null);
      setIdentityConfirmed(false);
      setVisitType('walk-in');
      setSearch('');
    } catch (failure) {
      setError(walkInError(failure));
    } finally {
      setSaving(false);
    }
  }

  const matches = filterCustomers(customers, search);
  const member = memberships.find(item => item.customerId === selectedCustomer?.id);
  const status = membershipStatus(member);

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
              <label htmlFor="walk-in-customer-search">Search by name, phone, ID, or customer reference</label>
              <input id="walk-in-customer-search" value={search} onChange={event => {
                setSearch(event.target.value);
                setSelectedCustomer(null);
                setIdentityConfirmed(false);
                setVisitType('walk-in');
              }} />
              {selectedCustomer ? (
                <div className="walk-in-identity-confirmation">
                  <p>Selected: <strong>{selectedCustomer.fullName}</strong></p>
                  <p>Customer reference: <strong>{customerReference(selectedCustomer.id, customers)}</strong></p>
                  <p>{phoneHint(selectedCustomer.phone)}</p>
                  <p>Membership status: <strong>{status}</strong></p>
                  <label htmlFor="visit-type">Visit type</label>
                  <select id="visit-type" value={visitType} onChange={event => setVisitType(event.target.value)}>
                    <option value="walk-in">Paid walk-in ($2 at checkout)</option>
                    <option value="subscription" disabled={status !== 'active'}>Subscription-covered (no visit fee)</option>
                  </select>
                  {status !== 'active' && <p>Expired or missing membership cannot cover a visit. Choose walk-in or renew the membership.</p>}
                  <label>
                    <input type="checkbox" checked={identityConfirmed}
                      onChange={event => setIdentityConfirmed(event.target.checked)} />
                    I confirmed this is the correct customer using their contact details or customer reference.
                  </label>
                  <button type="button" onClick={() => { setSelectedCustomer(null); setIdentityConfirmed(false); setVisitType('walk-in'); }}>
                    Choose another customer
                  </button>
                  {!selectedCustomer.phone && <p>Without a phone on file, ask for their reference or other reliable details. If unsure, do not reuse someone else's record.</p>}
                </div>
              ) : search.trim() && (
                <>
                  <p>Names may repeat. Check the phone ending and customer reference before selecting a record.</p>
                  <ul className="walk-in-customer-results">
                    {matches.length === 0 && <li>No matching customers.</li>}
                    {matches.map(customer => (
                      <li key={customer.id}>
                        <button type="button" onClick={() => { setSelectedCustomer(customer); setIdentityConfirmed(false); setVisitType('walk-in'); }}>
                          <strong>{customer.fullName}</strong>
                          <small>{customerReference(customer.id, customers)} · {phoneHint(customer.phone)}</small>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          ) : (
            <>
              <label htmlFor="walk-in-name">Full name</label>
              <input id="walk-in-name" required maxLength={120} value={form.fullName}
                onChange={event => setForm({ ...form, fullName: event.target.value })} />
              <label htmlFor="walk-in-phone">Phone (recommended for finding returning customers)</label>
              <input id="walk-in-phone" type="tel" maxLength={30} value={form.phone}
                onChange={event => setForm({ ...form, phone: event.target.value })} />
              <label htmlFor="walk-in-email">Email (optional)</label>
              <input id="walk-in-email" type="email" maxLength={254} value={form.email}
                onChange={event => setForm({ ...form, email: event.target.value })} />
            </>
          )}
          <button type="submit" className="walk-in-primary" disabled={mode === 'existing' && (!selectedCustomer || !identityConfirmed)}>{saving ? 'Saving…' : 'Check in'}</button>
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
