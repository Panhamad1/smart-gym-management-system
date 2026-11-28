import { collection, doc, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import { cambodiaDate, cambodiaMidnight } from './cambodia-day.js';
import { createSubscriptionPeriod, validatePlan, subscriptionStatus } from './subscription-domain.js';
import { normalizeCustomer } from './customer-data.js';

export function usd(amountMinor) {
  return '$' + (amountMinor / 100).toFixed(2);
}

export function subscriptionError(error) {
  if (error?.code === 'permission-denied') {
    return 'Staff permission denied. Ask an administrator to review your Firestore access.';
  }
  return error?.message || 'Unable to load or save membership information.';
}

export function membershipStatus(state, today = cambodiaDate()) {
  if (!state) return 'none';
  if (state.inactive === true) return 'inactive';
  if (today < state.coveredFromDay) return 'upcoming';
  return today < state.paidThroughExclusive ? 'active' : 'expired';
}

export function activeMembership(state, today = cambodiaDate()) {
  return membershipStatus(state, today) === 'active';
}

export function countMembershipStatuses(states, today = cambodiaDate()) {
  const result = { active: 0, expired: 0, upcoming: 0, inactive: 0 };
  for (const item of states || []) {
    const status = membershipStatus(item, today);
    if (Object.hasOwn(result, status)) result[status]++;
  }
  return result;
}

export async function saveMembershipPlan(db, staffId, input, planId = null) {
  if (!staffId) throw new Error('Staff login required.');
  if (globalThis.navigator?.onLine === false) throw new Error('Reconnect before saving a plan.');
  const name = String(input.label || '').trim();
  const months = Number(input.months);
  const amountMinor = Number(input.amountMinor);
  const active = input.active !== false;
  const value = { id: planId || 'new-plan', label: name, months, amountMinor, currency: 'USD', active };
  validatePlan({ ...value, active: true });
  if (planId && !/^[A-Za-z0-9]{20}$/.test(planId)) throw new Error('Invalid plan ID.');
  const ref = planId ? doc(db, 'membershipPlans', planId) : doc(collection(db, 'membershipPlans'));
  await runTransaction(db, async transaction => {
    if (planId) {
      const old = await transaction.get(ref);
      if (!old.exists()) throw new Error('Plan no longer exists.');
      transaction.update(ref, { label: name, months, amountMinor, active, updatedAt: serverTimestamp(), updatedBy: staffId });
    } else {
      transaction.set(ref, {
        label: name, months, amountMinor, currency: 'USD', active,
        createdAt: serverTimestamp(), createdBy: staffId
      });
    }
  });
  return ref.id;
}

export async function purchaseMembership(db, staffId, {
  customerId, planId, method, paymentReceived, operationId,
  expectedAmountMinor = null, expectedMonths = null
}) {
  if (!staffId) throw new Error('Staff login required.');
  if (!paymentReceived) throw new Error('Confirm receiving money before recording the membership.');
  if (!['cash', 'bank'].includes(method)) throw new Error('Select cash or bank transfer.');
  if (!/^[A-Za-z0-9]{20}$/.test(customerId || '') || !/^[A-Za-z0-9]{20}$/.test(planId || '')) {
    throw new Error('Choose a valid customer and membership plan.');
  }
  if (!/^[A-Za-z0-9]{20}$/.test(operationId || '')) throw new Error('Missing unique purchase operation ID.');
  if (globalThis.navigator?.onLine === false) throw new Error('Reconnect before recording payment.');

  const customerRef = doc(db, 'customers', customerId);
  const planRef = doc(db, 'membershipPlans', planId);
  const stateRef = doc(db, 'customerMemberships', customerId);
  const subRef = doc(db, 'subscriptions', operationId);
  const paymentRef = doc(db, 'subscriptionPayments', operationId);
  let output;
  await runTransaction(db, async tx => {
    const [customer, planSnapshot, stateSnapshot, existing] = await Promise.all([
      tx.get(customerRef), tx.get(planRef), tx.get(stateRef), tx.get(subRef)
    ]);
    if (existing.exists()) {
      if (existing.data().customerId !== customerId || existing.data().planId !== planId) {
        throw new Error('Purchase operation ID was already used for another membership.');
      }
      output = { subscriptionId: operationId, duplicate: true, ...existing.data() };
      return;
    }
    if (!customer.exists() || customer.data().archivedAt) throw new Error('Active customer record not found.');
    if (!planSnapshot.exists()) throw new Error('Membership plan not found.');
    const plan = { ...planSnapshot.data(), id: planRef.id };
    validatePlan(plan);
    // A plan can be edited while staff collects cash/bank payment.
    // Never record the new price if the staff confirmed payment for the old price.
    if ((expectedAmountMinor !== null && expectedAmountMinor !== plan.amountMinor) ||
        (expectedMonths !== null && expectedMonths !== plan.months)) {
      throw new Error('The plan price or duration changed. Refresh plans and confirm the correct payment before retrying.');
    }
    const today = cambodiaDate();
    const current = stateSnapshot.exists() ? stateSnapshot.data() : null;
    const alreadyCovered = current && current.paidThroughExclusive > today;
    const startDay = alreadyCovered ? current.paidThroughExclusive : today;
    const { endDayExclusive } = createSubscriptionPeriod(startDay, plan);
    const coveredFromDay = alreadyCovered ? current.coveredFromDay : today;
    const purpose = alreadyCovered ? 'renewal' : 'purchase';
    const subscription = {
      customerId, planId, planName: plan.label, months: plan.months,
      amountMinor: plan.amountMinor, currency: 'USD', startDay, endDayExclusive,
      purpose, recordedAt: serverTimestamp(), recordedBy: staffId
    };
    const payment = {
      customerId, subscriptionId: operationId, planId, purpose,
      amountMinor: plan.amountMinor, currency: 'USD', method, status: 'paid',
      receivedAt: serverTimestamp(), recordedBy: staffId
    };
    tx.set(subRef, subscription);
    tx.set(paymentRef, payment);
    tx.set(stateRef, {
      customerId, coveredFromDay, paidThroughExclusive: endDayExclusive,
      coveredFromAt: Timestamp.fromMillis(cambodiaMidnight(coveredFromDay)),
      paidThroughAt: Timestamp.fromMillis(cambodiaMidnight(endDayExclusive)),
      latestSubscriptionId: operationId, updatedAt: serverTimestamp(), updatedBy: staffId
    });
    output = { subscriptionId: operationId, purpose, startDay, endDayExclusive, duplicate: false };
  });
  return output;
}

export function subscriptionRecordStatus(record, day = cambodiaDate()) {
  return subscriptionStatus(record, day);
}

export function subscriptionCustomerName(customerId, customers) {
  return customers.find(customer => customer.id === customerId)?.fullName || 'Customer ' + customerId.slice(0, 6);
}

export function planChoiceLabel(plan) {
  return plan.label + ' — ' + plan.months + ' month(s), ' + usd(plan.amountMinor);
}
