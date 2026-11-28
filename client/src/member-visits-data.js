import { collection, doc, getDocFromServer, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import { activeMembership } from './subscription-data.js';
import { cambodiaDate } from './cambodia-day.js';
import { normalizeCustomer } from './customer-data.js';

export async function checkInMember(db, staffId, customerId) {
  if (!staffId) throw new Error('Staff login required.');
  if (!customerId) throw new Error('Choose a customer before check-in.');
  if (globalThis.navigator?.onLine === false) throw new Error('Reconnect before checking in.');
  const customerRef = doc(db, 'customers', customerId);
  const membershipRef = doc(db, 'customerMemberships', customerId);
  const openMemberRef = doc(db, 'openMemberVisits', customerId);
  const openWalkInRef = doc(db, 'openWalkIns', customerId);
  const visitId = doc(collection(db, 'memberVisitHistory')).id;
  try {
    await runTransaction(db, async transaction => {
      const [customer, membership, memberOpen, walkInOpen] = await Promise.all([
        transaction.get(customerRef), transaction.get(membershipRef),
        transaction.get(openMemberRef), transaction.get(openWalkInRef)
      ]);
      if (!customer.exists() || customer.data().archivedAt) throw new Error('Active customer record not found.');
      if (memberOpen.exists() || walkInOpen.exists()) throw new Error('This customer is already checked in.');
      if (!membership.exists() || !activeMembership(membership.data(), cambodiaDate())) {
        throw new Error('This customer has no active subscription. Choose paid walk-in check-in instead.');
      }
      const state = membership.data();
      const now = Timestamp.now();
      if (now.toMillis() < state.coveredFromAt.toMillis() || now.toMillis() >= state.paidThroughAt.toMillis()) {
        throw new Error('Membership is not valid today.');
      }
      transaction.set(openMemberRef, {
        customerId, customerName: normalizeCustomer(customerId, customer.data()).fullName,
        visitId, subscriptionId: state.latestSubscriptionId,
        checkedInAt: serverTimestamp(), checkedInBy: staffId
      });
    });
  } catch (failure) {
    if (failure.code === 'permission-denied') {
      const open = await getDocFromServer(openMemberRef).catch(() => null);
      if (open?.exists()) throw new Error('This customer is already checked in.');
    }
    throw failure;
  }
  return { customerId, visitId, type: 'subscription' };
}

export async function checkOutMember(db, staffId, { customerId, visitId }) {
  if (!staffId) throw new Error('Staff login required.');
  if (!customerId || !visitId) throw new Error('Choose an open subscription visit.');
  if (globalThis.navigator?.onLine === false) throw new Error('Reconnect before checkout.');
  const open = doc(db, 'openMemberVisits', customerId);
  const receipt = doc(db, 'memberVisitHistory', visitId);
  try {
    await runTransaction(db, async transaction => {
      const visit = await transaction.get(open);
      if (!visit.exists() || visit.data().visitId !== visitId) throw new Error('This visit is already checked out.');
      const data = visit.data();
      transaction.set(receipt, {
        customerId, customerName: data.customerName, visitId,
        subscriptionId: data.subscriptionId,
        checkedInAt: data.checkedInAt, checkedInBy: data.checkedInBy,
        checkedOutAt: serverTimestamp(), checkedOutBy: staffId,
        amountMinor: 0, currency: 'USD', visitType: 'subscription'
      });
      transaction.delete(open);
    });
  } catch (failure) {
    if (failure.code === 'permission-denied') {
      const completed = await getDocFromServer(receipt).catch(() => null);
      if (completed?.exists()) throw new Error('This visit is already checked out.');
    }
    throw failure;
  }
  return { customerId, visitId };
}
