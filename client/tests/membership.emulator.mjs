import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase/app';
import { collection, connectFirestoreEmulator, deleteDoc, doc, getDocFromServer, getDocsFromServer,
  getFirestore, setDoc, serverTimestamp, updateDoc, Timestamp } from 'firebase/firestore';
import { registerCustomer } from '../src/customer-data.js';
import { saveMembershipPlan, purchaseMembership, membershipStatus, countMembershipStatuses } from '../src/subscription-data.js';
import { checkInMember, checkOutMember } from '../src/member-visits-data.js';
import { checkInWalkIn, archiveCustomer } from '../src/walk-in-data.js';
import { cambodiaDate, cambodiaMidnight } from '../src/cambodia-day.js';

const projectId = 'demo-smart-gym';
const hostPort = process.env.FIRESTORE_EMULATOR_HOST;
assert.match(hostPort || '', /^127\.0\.0\.1:\d+$/);
const approved = 'emulator-approved-staff';

function context(t, uid = approved) {
  const app = initializeApp({ projectId, apiKey: 'emulator-only' }, randomUUID());
  t.after(() => deleteApp(app));
  const db = getFirestore(app);
  const [host, port] = hostPort.split(':');
  connectFirestoreEmulator(db, host, Number(port), uid ? { mockUserToken: { sub: uid } } : {});
  return db;
}

async function customer(db, name, phone = '') {
  return registerCustomer(db, { fullName: name, phone, email: '' });
}

async function examplePlan(db, months = 1, amountMinor = 5000, active = true) {
  return saveMembershipPlan(db, approved, {
    label: months === 12 ? 'Yearly' : 'Monthly', months, amountMinor, active
  });
}

test('plans can be created, edited and made inactive; unauthorized staff cannot read or write', async t => {
  const db = context(t);
  const planId = await examplePlan(db);
  const ref = doc(db, 'membershipPlans', planId);
  assert.equal((await getDocFromServer(ref)).data().amountMinor, 5000);
  await saveMembershipPlan(db, approved, { label: 'Updated monthly', months: 1, amountMinor: 6000, active: false }, planId);
  const plan = (await getDocFromServer(ref)).data();
  assert.equal(plan.amountMinor, 6000);
  assert.equal(plan.active, false);
  await assert.rejects(setDoc(ref, { active: true }), { code: 'permission-denied' });
  await assert.rejects(updateDoc(ref, { createdAt: serverTimestamp() }), { code: 'permission-denied' });
  await assert.rejects(deleteDoc(ref), { code: 'permission-denied' });
  await assert.rejects(saveMembershipPlan(db, approved, { label: 'Invalid', months: 0, amountMinor: -2, active: true }));
  for (const uid of [undefined, 'unapproved-staff']) {
    const unauthorized = context(t, uid);
    await assert.rejects(getDocsFromServer(collection(unauthorized, 'membershipPlans')), { code: 'permission-denied' });
    await assert.rejects(saveMembershipPlan(unauthorized, approved, {
      label: 'Not allowed', months: 1, amountMinor: 5000, active: true
    }), { code: 'permission-denied' });
  }
});

test('atomic manual payment, renewal, historical pricing and idempotent operation ID', async t => {
  const db = context(t);
  const customerId = await customer(db, 'Dara A');
  const planId = await examplePlan(db);
  const operationId = doc(collection(db, 'subscriptions')).id;
  await assert.rejects(purchaseMembership(db, approved, {
    customerId, planId, operationId, method: 'cash', paymentReceived: false
  }), /Confirm receiving money/);
  assert.equal((await getDocFromServer(doc(db, 'subscriptions', operationId))).exists(), false);
  const sale = await purchaseMembership(db, approved, {
    customerId, planId, operationId, method: 'cash', paymentReceived: true
  });
  assert.equal(sale.purpose, 'purchase');
  const paid = (await getDocFromServer(doc(db, 'subscriptionPayments', operationId))).data();
  assert.equal(paid.subscriptionId, operationId);
  assert.equal(paid.amountMinor, 5000);
  assert.equal(paid.status, 'paid');
  const savedSub = (await getDocFromServer(doc(db, 'subscriptions', operationId))).data();
  const savedState = (await getDocFromServer(doc(db, 'customerMemberships', customerId))).data();
  assert.equal(savedSub.customerId, customerId);
  assert.equal(savedState.latestSubscriptionId, operationId);
  assert.equal(savedState.paidThroughExclusive, sale.endDayExclusive);
  assert.equal(savedState.coveredFromAt.toMillis(), cambodiaMidnight(savedState.coveredFromDay));
  assert.equal(savedState.paidThroughAt.toMillis(), cambodiaMidnight(savedState.paidThroughExclusive));
  assert.equal(membershipStatus(savedState), 'active');
  assert.deepEqual(countMembershipStatuses([{...savedState}, {...savedState, customerId: 'duplicate'}]).active, 2);

  const duplicate = await purchaseMembership(db, approved, {
    customerId, planId, operationId, method: 'cash', paymentReceived: true
  });
  assert.equal(duplicate.duplicate, true);
  assert.equal((await getDocsFromServer(collection(db, 'subscriptionPayments'))).docs.filter(item => item.id === operationId).length, 1);
  await saveMembershipPlan(db, approved, { label: 'Monthly', months: 1, amountMinor: 6000, active: true }, planId);
  const renewId = doc(collection(db, 'subscriptions')).id;
  const renewal = await purchaseMembership(db, approved, {
    customerId, planId, operationId: renewId, method: 'bank', paymentReceived: true
  });
  assert.equal(renewal.purpose, 'renewal');
  assert.equal(renewal.startDay, sale.endDayExclusive);
  assert.equal((await getDocFromServer(doc(db, 'subscriptionPayments', operationId))).data().amountMinor, 5000);
  assert.equal((await getDocFromServer(doc(db, 'subscriptionPayments', renewId))).data().amountMinor, 6000);
  assert.equal((await getDocFromServer(doc(db, 'subscriptions', operationId))).data().endDayExclusive, sale.endDayExclusive);

  await assert.rejects(setDoc(doc(db, 'subscriptionPayments', doc(collection(db, 'subscriptionPayments')).id), {
    customerId, subscriptionId: renewId, planId, purpose: 'purchase', amountMinor: 1, currency: 'USD',
    method: 'cash', status: 'paid', receivedAt: serverTimestamp(), recordedBy: approved
  }), { code: 'permission-denied' });
  await assert.rejects(updateDoc(doc(db, 'subscriptionPayments', renewId), { amountMinor: 1 }), { code: 'permission-denied' });
  await assert.rejects(deleteDoc(doc(db, 'subscriptions', renewId)), { code: 'permission-denied' });
  await saveMembershipPlan(db, approved, { label: 'Monthly', months: 1, amountMinor: 6000, active: false }, planId);
  await assert.rejects(purchaseMembership(db, approved, {
    customerId, planId, operationId: doc(collection(db, 'subscriptions')).id, method: 'cash', paymentReceived: true
  }), /Inactive plans/);
});

test('same-name members remain distinct; checkout has no extra payment and prevents duplicates', async t => {
  const db = context(t);
  const first = await customer(db, 'Sokha Same', '012345678');
  const second = await customer(db, 'Sokha Same', '088765432');
  const planId = await examplePlan(db);
  for (const id of [first, second]) {
    await purchaseMembership(db, approved, {
      customerId: id, planId, operationId: doc(collection(db, 'subscriptions')).id,
      method: 'cash', paymentReceived: true
    });
  }
  const firstVisit = await checkInMember(db, approved, first);
  const secondVisit = await checkInMember(db, approved, second);
  assert.notEqual(firstVisit.visitId, secondVisit.visitId);
  await assert.rejects(checkInMember(db, approved, first), /already checked in/);
  await assert.rejects(checkInWalkIn(db, approved, { customerId: first }), /already checked in/);
  await assert.rejects(archiveCustomer(db, approved, first), /Check out/);
  await checkOutMember(db, approved, firstVisit);
  await assert.rejects(checkOutMember(db, approved, firstVisit), /already checked out/);
  const receipt = (await getDocFromServer(doc(db, 'memberVisitHistory', firstVisit.visitId))).data();
  assert.equal(receipt.amountMinor, 0);
  assert.equal(receipt.visitType, 'subscription');
  assert.equal(receipt.customerId, first);
  assert.equal((await getDocFromServer(doc(db, 'openMemberVisits', first))).exists(), false);
  assert.equal((await getDocFromServer(doc(db, 'openMemberVisits', second))).exists(), true);
  assert.equal((await getDocsFromServer(collection(db, 'walkInReceipts'))).size, 0);
  await checkOutMember(db, approved, secondVisit);
  await assert.rejects(updateDoc(doc(db, 'memberVisitHistory', firstVisit.visitId), { amountMinor: 200 }), { code: 'permission-denied' });
});

test('missing/expired membership is not accepted as a covered visit, but walk-in remains available', async t => {
  const db = context(t);
  const noMember = await customer(db, 'No subscription');
  await assert.rejects(checkInMember(db, approved, noMember), /no active subscription/);
  const walkIn = await checkInWalkIn(db, approved, { customerId: noMember });
  await assert.rejects(checkInMember(db, approved, noMember), /already checked in/);
  assert.ok(walkIn.visitId);

  const planId = await examplePlan(db);
  await saveMembershipPlan(db, approved, { label: 'Monthly', months: 1, amountMinor: 5000, active: false }, planId);
  await assert.rejects(purchaseMembership(db, approved, {
    customerId: noMember, planId, operationId: doc(collection(db, 'subscriptions')).id,
    method: 'cash', paymentReceived: true
  }), /Inactive plans/);
});

test('unauthorized user cannot access memberships or subscription visits or forge receipt', async t => {
  const db = context(t);
  const customerId = await customer(db, 'Protected member');
  const planId = await examplePlan(db);
  const operationId = doc(collection(db, 'subscriptions')).id;
  await purchaseMembership(db, approved, { customerId, planId, method: 'cash', paymentReceived: true, operationId });
  const walk = await checkInMember(db, approved, customerId);
  for (const uid of [undefined, 'not-approved']) {
    const other = context(t, uid);
    for (const name of ['customerMemberships', 'subscriptions', 'subscriptionPayments', 'openMemberVisits', 'memberVisitHistory']) {
      await assert.rejects(getDocsFromServer(collection(other, name)), { code: 'permission-denied' });
    }
    await assert.rejects(checkInMember(other, uid, customerId), { code: 'permission-denied' });
    await assert.rejects(purchaseMembership(other, uid || 'fake', {
      customerId, planId, operationId: doc(collection(other, 'subscriptions')).id,
      method: 'cash', paymentReceived: true
    }), { code: 'permission-denied' });
  }
  await assert.rejects(setDoc(doc(db, 'memberVisitHistory', walk.visitId), {
    customerId, customerName: 'Protected member', visitId: walk.visitId, subscriptionId: operationId,
    checkedInAt: Timestamp.now(), checkedInBy: approved, checkedOutAt: serverTimestamp(),
    checkedOutBy: approved, amountMinor: 0, currency: 'USD', visitType: 'subscription'
  }), { code: 'permission-denied' });
  await checkOutMember(db, approved, walk);
});
