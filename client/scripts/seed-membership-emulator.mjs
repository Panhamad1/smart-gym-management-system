// SCRUM-13: synthetic demonstration records. This script REFUSES to run without a local Firebase emulator.
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore, collection, doc } from 'firebase/firestore';
import { registerCustomer } from '../src/customer-data.js';
import { saveMembershipPlan, purchaseMembership } from '../src/subscription-data.js';
import { checkInMember, checkOutMember } from '../src/member-visits-data.js';
import { checkInWalkIn, checkOutWalkIn } from '../src/walk-in-data.js';

const projectId = 'demo-smart-gym';
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8080',
  'For safety, run only with the local demo Firestore emulator at 127.0.0.1:8080.');
const app = initializeApp({ projectId, apiKey: 'emulator-only' });
const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080, { mockUserToken: { sub: 'emulator-approved-staff' } });
const staffId = 'emulator-approved-staff';

try {
  const monthly = await saveMembershipPlan(db, staffId, {
    label: 'Monthly (example)', months: 1, amountMinor: 5000, active: true
  });
  const yearly = await saveMembershipPlan(db, staffId, {
    label: 'Yearly (example)', months: 12, amountMinor: 50000, active: true
  });
  const first = await registerCustomer(db, { fullName: 'Sokha Demo', phone: '012345678', email: '' });
  const second = await registerCustomer(db, { fullName: 'Sokha Demo', phone: '098765432', email: '' });
  const purchaseId = doc(collection(db, 'subscriptions')).id;
  const purchase = await purchaseMembership(db, staffId, {
    customerId: first, planId: monthly, method: 'cash', paymentReceived: true, operationId: purchaseId
  });
  const memberVisit = await checkInMember(db, staffId, first);
  const walkIn = await checkInWalkIn(db, staffId, { customerId: second });
  await checkOutMember(db, staffId, memberVisit);
  await checkOutWalkIn(db, staffId, { ...walkIn, method: 'bank', paymentReceived: true });
  console.log(JSON.stringify({
    projectId, note: 'Synthetic emulator data only', planIds: [monthly, yearly],
    customerIds: [first, second], purchaseId, purchaseType: purchase.purpose,
    memberVisitId: memberVisit.visitId, walkInVisitId: walkIn.visitId
  }, null, 2));
} finally {
  await deleteApp(app);
}
