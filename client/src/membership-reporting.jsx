import React, { useState } from 'react';
import { cambodiaDate } from './cambodia-day';
import { customerReference, phoneHint } from './customer-data';
import { checkOutMember } from './member-visits-data';
import { subscriptionCustomerName, subscriptionError, usd } from './subscription-data';
export { dashboardReport } from './gym-reporting-data.js';

function displayTime(timestamp) {
  return timestamp?.toDate ? new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Phnom_Penh'
  }).format(timestamp.toDate()) : 'Unknown';
}

function visitDay(timestamp) {
  return timestamp?.toDate ? cambodiaDate(timestamp.toDate()) : '';
}

export function MemberOpenVisits({ db, staffId, customers, result }) {
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (!selected || !confirmed || busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await checkOutMember(db, staffId, { customerId: selected.customerId, visitId: selected.visitId });
      setMessage(selected.customerName + ' checked out. Covered by membership: no extra payment.');
      setSelected(null); setConfirmed(false);
    } catch (failure) { setError(subscriptionError(failure)); }
    finally { setBusy(false); }
  }

  return (
    <section className="walk-in-panel" aria-label="Open subscription visits">
      <h2>Subscription-covered visitors in gym</h2>
      <p>These visits do not require another payment at checkout.</p>
      {result.error && <p role="alert" className="walk-in-error">{result.error}</p>}
      {!result.records && !result.error && <p role="status">Loading subscription visits…</p>}
      {message && <p role="status" className="walk-in-success">{message}</p>}
      {error && <p role="alert" className="walk-in-error">{error}</p>}
      {selected && (
        <form className="walk-in-form" onSubmit={submit}>
          <h2>Check out {selected.customerName}</h2>
          <p>{customerReference(selected.customerId, customers)} ·
            {phoneHint(customers.find(customer => customer.id === selected.customerId)?.phone)}</p>
          <label className="walk-in-confirm">
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />
            I confirmed this is the correct customer
          </label>
          <div className="walk-in-mode">
            <button type="button" onClick={() => { setSelected(null); setConfirmed(false); }}>Cancel</button>
            <button className="walk-in-primary" type="submit" disabled={busy || !confirmed}>
              {busy ? 'Saving…' : 'Check out without another charge'}
            </button>
          </div>
        </form>
      )}
      {result.records?.length === 0 && <p>No subscription members are currently in the gym.</p>}
      <ul className="walk-in-records">
        {(result.records || []).map(visit => (
          <li key={visit.visitId}>
            <span><strong>{visit.customerName}</strong>
              <small>{customerReference(visit.customerId, customers)} · {phoneHint(customers.find(c => c.id === visit.customerId)?.phone)}</small>
              <small>Checked in {displayTime(visit.checkedInAt)}</small>
            </span>
            <button type="button" disabled={busy} onClick={() => { setSelected(visit); setConfirmed(false); }}>
              Check out
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function GymAttendance({ customers, walks, members, initialCustomerId = null }) {
  const [search, setSearch] = useState(initialCustomerId || '');
  const [from, setFrom] = useState('');
  const [through, setThrough] = useState('');
  const invalidRange = Boolean(from && through && from > through);
  const combined = [
    ...(walks.records || []).map(record => ({ ...record, type: 'walk-in' })),
    ...(members.records || []).map(record => ({ ...record, type: 'subscription' }))
  ].filter(visit => {
    const q = search.trim().toLowerCase();
    const name = subscriptionCustomerName(visit.customerId, customers).toLowerCase();
    const matches = !q || visit.customerId.toLowerCase() === q ||
      name.includes(q) || customerReference(visit.customerId, customers).toLowerCase() === q;
    const date = visitDay(visit.checkedInAt);
    return matches && (!from || date >= from) && (!through || date <= through);
  }).sort((a,b) => (b.checkedInAt?.toMillis?.() || 0) - (a.checkedInAt?.toMillis?.() || 0));
  return (
    <section className="walk-in-panel">
      <h1>Attendance history</h1>
      <p>Paid walk-ins and membership-covered completed visits, without extra subscription visit charges.</p>
      {(walks.error || members.error) && <p role="alert" className="walk-in-error">{walks.error || members.error}</p>}
      <div className="walk-in-mode">
        <label>Customer name, ID or reference
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} />
        </label>
        <label>From <input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
        <label>Through <input type="date" value={through} onChange={e => setThrough(e.target.value)} /></label>
      </div>
      {invalidRange && <p role="alert" className="walk-in-error">The start date must be before or equal to the end date.</p>}
      {(!walks.records || !members.records) && !walks.error && !members.error && <p role="status">Loading history…</p>}
      {!invalidRange && walks.records && members.records && combined.length === 0 && <p>No visits match the filters.</p>}
      {!invalidRange && walks.records && members.records && (
        <ul className="walk-in-records">
          {combined.map(visit => (
            <li key={visit.visitId}><span>
              <strong>{visit.customerName}</strong> · {visit.type}
              <small>{customerReference(visit.customerId, customers)} · {displayTime(visit.checkedInAt)} to {displayTime(visit.checkedOutAt)}</small>
              <small>{visit.type === 'subscription' ? 'Covered by subscription — $0 additional' : 'Walk-in payment — ' + usd(visit.amountMinor)}</small>
            </span></li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function GymPayments({ customers, walks, payments, initialCustomerId = null }) {
  const [purpose, setPurpose] = useState('all');
  const [search, setSearch] = useState(initialCustomerId || '');
  const [from, setFrom] = useState('');
  const [through, setThrough] = useState('');
  const invalidRange = Boolean(from && through && from > through);
  const all = [
    ...(walks.records || []).map(record => ({ ...record, paymentPurpose: 'walk-in', time: record.checkedOutAt })),
    ...(payments.records || []).map(record => ({ ...record, paymentPurpose: record.purpose, time: record.receivedAt }))
  ];
  const filtered = all.filter(payment => {
    const q = search.trim().toLowerCase();
    const name = subscriptionCustomerName(payment.customerId, customers).toLowerCase();
    const matches = !q || payment.customerId.toLowerCase() === q || name.includes(q) ||
      customerReference(payment.customerId, customers).toLowerCase() === q;
    const date = visitDay(payment.time);
    return matches && (purpose === 'all' || payment.paymentPurpose === purpose) &&
      (!from || date >= from) && (!through || date <= through);
  }).sort((a,b) => (b.time?.toMillis?.() || 0) - (a.time?.toMillis?.() || 0));
  const total = filtered.reduce((sum, payment) => sum + payment.amountMinor, 0);
  return (
    <section className="walk-in-panel">
      <h1>Manual payment history</h1>
      <p>Each subscription purchase/renewal has its own linked payment. Subscription-covered visits never create another payment.</p>
      {(walks.error || payments.error) && <p role="alert" className="walk-in-error">{walks.error || payments.error}</p>}
      <div className="walk-in-mode">
        <label>Payment purpose
          <select value={purpose} onChange={e => setPurpose(e.target.value)}>
            <option value="all">All payments</option>
            <option value="walk-in">Walk-in</option>
            <option value="purchase">Subscription purchase</option>
            <option value="renewal">Subscription renewal</option>
          </select>
        </label>
        <label>Customer ID, reference or name <input type="search" value={search} onChange={e => setSearch(e.target.value)} /></label>
        <label>From <input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
        <label>Through <input type="date" value={through} onChange={e => setThrough(e.target.value)} /></label>
      </div>
      {invalidRange && <p role="alert" className="walk-in-error">Invalid date range.</p>}
      {(!walks.records || !payments.records) && !walks.error && !payments.error && <p role="status">Loading payments…</p>}
      {!invalidRange && walks.records && payments.records && (
        <>
          <h2>Total matching payments: {usd(total)}</h2>
          <ul className="walk-in-records">
            {filtered.map(payment => (
              <li key={payment.id || payment.visitId}><span>
                <strong>{subscriptionCustomerName(payment.customerId, customers)}</strong>
                <small>{payment.paymentPurpose} · {payment.method === 'bank' ? 'Bank transfer' : 'Cash'} · {displayTime(payment.time)}</small>
                <small>{customerReference(payment.customerId, customers)} · {payment.subscriptionId ? 'Subscription ' + payment.subscriptionId : 'Visit ' + payment.visitId}</small>
              </span><strong>{usd(payment.amountMinor)}</strong></li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
