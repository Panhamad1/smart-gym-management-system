import React, { useState } from 'react';
import { collection, doc } from 'firebase/firestore';
import { filterCustomers, customerReference, phoneHint } from './customer-data';
import { membershipStatus, planChoiceLabel, purchaseMembership, saveMembershipPlan, subscriptionCustomerName, subscriptionError, subscriptionRecordStatus, usd } from './subscription-data';
import { cambodiaDate } from './cambodia-day';

const blankPlan = { label: '', months: '1', price: '', active: true };

export function MembershipPanel({ db, staffId, customers, plans, states, subscriptions }) {
  const [planForm, setPlanForm] = useState(blankPlan);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [confirmedIdentity, setConfirmedIdentity] = useState(false);
  const [method, setMethod] = useState('');
  const [received, setReceived] = useState(false);
  const [operationId, setOperationId] = useState(() => doc(collection(db, 'subscriptions')).id);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const planList = plans.records || [];
  const memberStates = states.records || [];
  const activePlans = planList.filter(plan => plan.active !== false);
  const selectedPlan = activePlans.find(plan => plan.id === selectedPlanId);
  const selectedState = memberStates.find(state => state.customerId === selectedCustomer?.id);
  const currentStatus = membershipStatus(selectedState);
  const matches = filterCustomers(customers, search).slice(0, 30);

  async function savePlan(event) {
    event.preventDefault();
    const price = Number(planForm.price);
    const amountMinor = Math.round(price * 100);
    if (!Number.isFinite(price) || price < 0 || !Number.isSafeInteger(amountMinor) ||
      Math.abs(price * 100 - amountMinor) > 0.00001) {
      setError('Price must be a nonnegative amount with at most two decimal places.');
      return;
    }
    setBusy(true); setError(''); setMessage('');
    try {
      await saveMembershipPlan(db, staffId, {
        label: planForm.label, months: Number(planForm.months), amountMinor,
        active: planForm.active
      }, editingPlanId);
      setPlanForm(blankPlan); setEditingPlanId(null);
      setMessage('Membership plan saved.');
    } catch (failure) {
      setError(subscriptionError(failure));
    } finally { setBusy(false); }
  }

  function choosePlan(plan) {
    setEditingPlanId(plan.id);
    setPlanForm({
      label: plan.label, months: String(plan.months),
      price: (plan.amountMinor / 100).toFixed(2), active: plan.active !== false
    });
    setError(''); setMessage('');
  }

  async function seedExamples() {
    if (planList.length > 0) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await saveMembershipPlan(db, staffId, { label: 'Monthly', months: 1, amountMinor: 5000, active: true });
      await saveMembershipPlan(db, staffId, { label: 'Yearly', months: 12, amountMinor: 50000, active: true });
      setMessage('Two example plans created. Review and adjust prices before selling.');
    } catch (failure) { setError(subscriptionError(failure)); }
    finally { setBusy(false); }
  }

  async function purchase(event) {
    event.preventDefault();
    if (!selectedCustomer || !confirmedIdentity) {
      setError('Select and confirm the correct customer before purchase.'); return;
    }
    if (!selectedPlan) { setError('Select an active plan.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await purchaseMembership(db, staffId, {
        customerId: selectedCustomer.id, planId: selectedPlan.id,
        method, paymentReceived: received, operationId,
        expectedAmountMinor: selectedPlan.amountMinor, expectedMonths: selectedPlan.months
      });
      setMessage((result.duplicate ? 'Already recorded: ' : 'Recorded: ') + result.purpose +
        ' from ' + result.startDay + ' until ' + result.endDayExclusive +
        ' (end day excluded). Payment: ' + usd(result.amountMinor ?? selectedPlan.amountMinor) + '.');
      setOperationId(doc(collection(db, 'subscriptions')).id);
      setReceived(false); setMethod(''); setConfirmedIdentity(false);
    } catch (failure) { setError(subscriptionError(failure)); }
    finally { setBusy(false); }
  }

  if (plans.error || states.error || subscriptions.error) return (
    <section className="walk-in-panel" role="alert">
      <h1>Memberships</h1>
      <p className="walk-in-error">{plans.error || states.error || subscriptions.error}</p>
      <p>Review staff authorization and deployed Firestore security rules before using subscriptions.</p>
    </section>
  );

  return (
    <section className="walk-in-panel" aria-labelledby="membership-title">
      <h1 id="membership-title">Plans &amp; Subscriptions</h1>
      <p>All dates use Cambodia time. Memberships cover the start day, but not the expiry day.
        Prices are in USD. Cash/bank payments must be received before recording.</p>
      {error && <p role="alert" className="walk-in-error">{error}</p>}
      {message && <p role="status" className="walk-in-success">{message}</p>}
      <h2>Membership plans</h2>
      {!plans.records && <p role="status">Loading plans…</p>}
      {plans.records && planList.length === 0 && (
        <div>
          <p>No plans saved yet. The example plans cost $50/month and $500/year; these are not approved real-world prices.</p>
          <button type="button" disabled={busy} onClick={seedExamples}>Create example plans</button>
        </div>
      )}
      <ul className="walk-in-records">
        {planList.map(plan => (
          <li key={plan.id}>
            <span><strong>{plan.label}</strong> — {plan.months} month(s) — {usd(plan.amountMinor)}
              <small>{plan.active === false ? 'Inactive (cannot sell)' : 'Available'}</small></span>
            <button type="button" disabled={busy} onClick={() => choosePlan(plan)}>Edit plan</button>
          </li>
        ))}
      </ul>
      <form className="walk-in-form" onSubmit={savePlan}>
        <h2>{editingPlanId ? 'Edit plan' : 'Create a plan'}</h2>
        <fieldset disabled={busy}>
          <label htmlFor="plan-name">Name</label>
          <input id="plan-name" required maxLength={80} value={planForm.label}
            onChange={e => setPlanForm({ ...planForm, label: e.target.value })} />
          <label htmlFor="plan-months">Duration in calendar months</label>
          <input id="plan-months" type="number" required min="1" max="120" step="1" value={planForm.months}
            onChange={e => setPlanForm({ ...planForm, months: e.target.value })} />
          <label htmlFor="plan-price">Price (USD)</label>
          <input id="plan-price" required type="number" min="0" max="1000000" step="0.01" value={planForm.price}
            onChange={e => setPlanForm({ ...planForm, price: e.target.value })} />
          <label className="walk-in-confirm">
            <input type="checkbox" checked={planForm.active}
              onChange={e => setPlanForm({ ...planForm, active: e.target.checked })} /> Available for new purchases
          </label>
          <div className="walk-in-mode">
            <button type="submit" className="walk-in-primary">{busy ? 'Saving…' : editingPlanId ? 'Save plan changes' : 'Create plan'}</button>
            {editingPlanId && <button type="button" onClick={() => { setEditingPlanId(null); setPlanForm(blankPlan); }}>Cancel edit</button>}
          </div>
        </fieldset>
      </form>

      <h2>Purchase or renew membership</h2>
      <p>Returning customers may have the same name or share a phone. Confirm the customer reference before charging.</p>
      <form className="walk-in-form" onSubmit={purchase}>
        <fieldset disabled={busy || !plans.records || !states.records}>
          <label htmlFor="member-search">Find customer by name, phone or reference</label>
          <input id="member-search" type="search" value={search}
            onChange={e => { setSearch(e.target.value); setSelectedCustomer(null); setConfirmedIdentity(false); }} />
          {selectedCustomer ? (
            <div>
              <p><strong>{selectedCustomer.fullName}</strong> — {customerReference(selectedCustomer.id, customers)}</p>
              <p>{phoneHint(selectedCustomer.phone)} · Membership: <strong>{currentStatus}</strong></p>
              {currentStatus === 'active' && <p>Renewal will start after current coverage expires: {selectedState.paidThroughExclusive}.</p>}
              <label className="walk-in-confirm">
                <input type="checkbox" checked={confirmedIdentity}
                  onChange={e => setConfirmedIdentity(e.target.checked)} /> I verified this customer's reference or contact details
              </label>
              <button type="button" onClick={() => { setSelectedCustomer(null); setConfirmedIdentity(false); }}>Choose another customer</button>
            </div>
          ) : search.trim() && (
            <ul className="walk-in-customer-results">
              {matches.length === 0 && <li>No matching customers.</li>}
              {matches.map(customer => (
                <li key={customer.id}>
                  <button type="button" onClick={() => { setSelectedCustomer(customer); setConfirmedIdentity(false); }}>
                    <strong>{customer.fullName}</strong><small>{customerReference(customer.id, customers)} · {phoneHint(customer.phone)}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <label htmlFor="member-plan">Active plan</label>
          <select id="member-plan" required value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)}>
            <option value="">Choose plan</option>
            {activePlans.map(plan => <option key={plan.id} value={plan.id}>{planChoiceLabel(plan)}</option>)}
          </select>
          <label htmlFor="member-pay-method">Payment method</label>
          <select id="member-pay-method" required value={method} onChange={e => setMethod(e.target.value)}>
            <option value="">Choose payment method</option>
            <option value="cash">Cash</option><option value="bank">Bank transfer</option>
          </select>
          <label className="walk-in-confirm">
            <input type="checkbox" checked={received} onChange={e => setReceived(e.target.checked)} />
            I actually received {selectedPlan ? usd(selectedPlan.amountMinor) : 'the payment'} and checked its amount
          </label>
          <button type="submit" className="walk-in-primary" disabled={busy || !selectedCustomer || !confirmedIdentity || !selectedPlan || !method || !received}>
            {busy ? 'Recording…' : 'Confirm payment and activate or renew'}
          </button>
        </fieldset>
      </form>

      <h2>Member coverage</h2>
      {!states.records && <p role="status">Loading membership status…</p>}
      <ul className="walk-in-records">
        {memberStates.map(state => (
          <li key={state.customerId}>
            <span><strong>{subscriptionCustomerName(state.customerId, customers)}</strong>
              <small>{customerReference(state.customerId, customers)} · {membershipStatus(state)}</small>
              <small>{state.coveredFromDay} to {state.paidThroughExclusive} (end excluded)</small>
            </span>
          </li>
        ))}
      </ul>

      <h2>Purchase and renewal history</h2>
      {!subscriptions.records && <p role="status">Loading subscription history…</p>}
      <ul className="walk-in-records">
        {(subscriptions.records || []).slice().sort((a,b) => a.startDay.localeCompare(b.startDay) * -1).map(sub => (
          <li key={sub.id}><span>
            <strong>{subscriptionCustomerName(sub.customerId, customers)}</strong> — {sub.planName}
            <small>{sub.purpose} · {subscriptionRecordStatus(sub, cambodiaDate())} · {sub.startDay} to {sub.endDayExclusive}</small>
            <small>Purchase ID: {sub.id} · {usd(sub.amountMinor)}</small>
          </span></li>
        ))}
      </ul>
    </section>
  );
}
