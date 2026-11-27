import React, { useState } from 'react';
import { customerReference } from './customer-data';

// Profile changes are saved by Firestore transactions and allowed only by reviewed Security Rules.
export function CustomerEditor({ customer, customers, onSave, onCancel }) {
  const [form, setForm] = useState({
    fullName: customer.fullName,
    phone: customer.phone || '',
    email: customer.email || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await onSave(customer.id, form);
      setSuccess('Customer details saved. Existing visits and payment records were not changed.');
    } catch (failure) {
      setError(failure?.code === 'permission-denied'
        ? 'Your staff account is not allowed to update customer details. Ask an administrator to review Firestore access.'
        : failure?.message || 'Unable to save customer changes. Please retry.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="walk-in-form" aria-labelledby="edit-customer-title">
      <h2 id="edit-customer-title">Edit customer details</h2>
      <p><strong>{customer.fullName}</strong> · {customerReference(customer.id, customers)}</p>
      <p>Customer identity stays the same. Editing contact details will not change older visit or payment records.</p>
      <form onSubmit={submit}>
        <fieldset disabled={saving}>
          <label htmlFor="edit-customer-name">Full name</label>
          <input id="edit-customer-name" required maxLength={120} value={form.fullName}
            onChange={event => setForm({ ...form, fullName: event.target.value })} />
          <label htmlFor="edit-customer-phone">Phone (recommended, not unique)</label>
          <input id="edit-customer-phone" type="tel" maxLength={30} value={form.phone}
            onChange={event => setForm({ ...form, phone: event.target.value })} />
          <label htmlFor="edit-customer-email">Email (optional)</label>
          <input id="edit-customer-email" type="email" maxLength={254} value={form.email}
            onChange={event => setForm({ ...form, email: event.target.value })} />
          <div className="walk-in-mode">
            <button type="button" onClick={onCancel}>Close</button>
            <button className="walk-in-primary" type="submit">{saving ? 'Saving…' : 'Save details'}</button>
          </div>
        </fieldset>
      </form>
      {error && <p className="walk-in-error" role="alert">{error}</p>}
      {success && <p className="walk-in-success" role="status">{success}</p>}
    </section>
  );
}
