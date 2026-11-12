import React, { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { walkInError, walkInFee, walkInMethods } from './walk-in-data';

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Phnom_Penh'
});

export function visitTime(timestamp) {
  return dateFormat.format(timestamp.toDate());
}

function paymentAmount({ amountMinor, currency }) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amountMinor / 100);
}

export function useWalkInRecords(db, enabled, collectionName, maxRecords = 50) {
  const [result, setResult] = useState({ records: null, error: '' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setResult({ records: null, error: '' });
    if (!enabled) return;
    const source = collection(db, collectionName);
    const recordsQuery = collectionName === 'walkInReceipts'
      ? query(source, orderBy('checkedOutAt', 'desc'), limit(maxRecords))
      : query(source, orderBy('checkedInAt', 'desc'));
    const timeout = setTimeout(() => {
      setResult({ records: null, error: 'Unable to load walk-in records. Check your connection and retry.' });
    }, 10000);
    const unsubscribe = onSnapshot(recordsQuery, { includeMetadataChanges: true }, snapshot => {
      if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
      clearTimeout(timeout);
      setResult({ records: snapshot.docs.map(record => record.data()), error: '' });
    }, error => {
      clearTimeout(timeout);
      setResult({ records: null, error: walkInError(error) });
    });
    return () => { clearTimeout(timeout); unsubscribe(); };
  }, [db, enabled, collectionName, maxRecords, attempt]);
  return { ...result, retry: () => setAttempt(value => value + 1) };
}

function RecordList({ result, empty, children }) {
  if (result.error) return (
    <>
      <p className="walk-in-error" role="alert">{result.error}</p>
      <button type="button" onClick={result.retry}>Retry</button>
    </>
  );
  if (!result.records) return <p role="status">Loading…</p>;
  if (!result.records.length) return <p>{empty}</p>;
  return <ul className="walk-in-records">{result.records.map(children)}</ul>;
}

export function OpenWalkIns({ db, result, initialVisit, onCheckout }) {
  const [showHistory, setShowHistory] = useState(false);
  const [selected, setSelected] = useState(initialVisit ?? null);
  const [method, setMethod] = useState('');
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function chooseVisit(visit) {
    setSelected(visit);
    setMethod('');
    setPaymentReceived(false);
    setError('');
    setSuccess('');
  }

  async function checkout(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await onCheckout({ ...selected, method, paymentReceived });
      setSuccess(selected.customerName + ' checked out. Payment recorded.');
      setSelected(null);
    } catch (failure) {
      setError(walkInError(failure));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="walk-in-panel" aria-labelledby="open-walk-ins-title">
      <h1 id="open-walk-ins-title">Open Visits</h1>
      <div className="walk-in-mode" role="group" aria-label="Visit view">
        <button type="button" aria-pressed={!showHistory} disabled={saving} onClick={() => setShowHistory(false)}>In gym</button>
        <button type="button" aria-pressed={showHistory} disabled={saving} onClick={() => setShowHistory(true)}>Visit history</button>
      </div>
      {showHistory ? <VisitHistory db={db} /> : (
        <>
          <p>Walk-in customers currently in the gym.</p>
          {success && <p className="walk-in-success" role="status">{success}</p>}
          {selected && (
            <form className="walk-in-form" onSubmit={checkout}>
              <h2>Check out {selected.customerName}</h2>
              <p>Payment due {paymentAmount(walkInFee)} USD</p>
              <fieldset disabled={saving}>
                <label htmlFor="walk-in-payment-method">Payment method</label>
                <select id="walk-in-payment-method" required value={method} onChange={event => setMethod(event.target.value)}>
                  <option value="">Choose a payment method</option>
                  {Object.entries(walkInMethods).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <label className="walk-in-confirm">
                  <input type="checkbox" checked={paymentReceived} onChange={event => setPaymentReceived(event.target.checked)} />
                  I received the payment
                </label>
                <div className="walk-in-mode">
                  <button type="button" onClick={() => chooseVisit(null)}>Cancel</button>
                  <button type="submit" className="walk-in-primary" disabled={!method || !paymentReceived}>
                    {saving ? 'Saving…' : 'Confirm paid checkout'}
                  </button>
                </div>
              </fieldset>
              {error && <p className="walk-in-error" role="alert">{error}</p>}
            </form>
          )}
          <RecordList result={result} empty="No open walk-in visits.">
            {visit => (
              <li key={visit.visitId}>
                <div><strong>{visit.customerName}</strong><small>Checked in {visitTime(visit.checkedInAt)}</small></div>
                <button type="button" disabled={saving} onClick={() => chooseVisit(visit)}>Check out</button>
              </li>
            )}
          </RecordList>
        </>
      )}
    </section>
  );
}

function VisitHistory({ db }) {
  const [pageSize, setPageSize] = useState(50);
  const result = useWalkInRecords(db, true, 'walkInReceipts', pageSize + 1);
  const hasMore = result.records?.length > pageSize;
  const visible = { ...result, records: result.records?.slice(0, pageSize) };

  return (
    <>
      <p>Completed walk-ins. Times are shown in Cambodia local time.</p>
      <RecordList result={visible} empty="No completed walk-in visits.">
        {receipt => (
          <li key={receipt.visitId}>
            <div>
              <strong>{receipt.customerName}</strong>
              <small>Checked in {visitTime(receipt.checkedInAt)}</small>
              <small>Checked out {visitTime(receipt.checkedOutAt)}</small>
              <small>Visit ID {receipt.visitId}</small>
            </div>
            <div>
              <strong>{paymentAmount(receipt)} USD paid</strong>
              <small>{walkInMethods[receipt.method]}</small>
            </div>
          </li>
        )}
      </RecordList>
      {hasMore && <button type="button" onClick={() => setPageSize(size => size + 50)}>Show older visits</button>}
    </>
  );
}

export function WalkInPayments({ db }) {
  const result = useWalkInRecords(db, true, 'walkInReceipts');
  return (
    <section className="walk-in-panel" aria-labelledby="walk-in-payments-title">
      <h1 id="walk-in-payments-title">Payments</h1>
      <p>Most recent 50 walk-in payments.</p>
      <RecordList result={result} empty="No walk-in payments recorded.">
        {receipt => (
          <li key={receipt.visitId}>
            <div><strong>{receipt.customerName}</strong><small>{visitTime(receipt.checkedOutAt)} · {walkInMethods[receipt.method]}</small></div>
            <strong>{paymentAmount(receipt)} USD</strong>
          </li>
        )}
      </RecordList>
    </section>
  );
}
