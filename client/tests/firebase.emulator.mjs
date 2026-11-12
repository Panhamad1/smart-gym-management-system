import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, collection, addDoc, doc, getDocFromServer, getDocsFromServer, serverTimestamp, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { filterCustomers, normalizeCustomer, registerCustomer } from '../src/customer-data.js';
import { archiveCustomer, checkInWalkIn, checkOutWalkIn } from '../src/walk-in-data.js';

const projectId = 'demo-smart-gym';
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
assert.match(firestoreHost ?? '', /^127\.0\.0\.1:\d+$/);
assert.match(authHost ?? '', /^127\.0\.0\.1:\d+$/);

function appFor(t) {
  const app = initializeApp({ projectId, apiKey: 'emulator-only' }, randomUUID());
  t.after(() => deleteApp(app));
  return app;
}

function firestoreFor(t, uid) {
  const db = getFirestore(appFor(t));
  const [host, port] = firestoreHost.split(':');
  connectFirestoreEmulator(db, host, Number(port), uid ? { mockUserToken: { sub: uid } } : {});
  return collection(db, 'customers');
}

test('Firebase email login rejects wrong credentials and sign-out clears the session', async t => {
  const auth = getAuth(appFor(t));
  connectAuthEmulator(auth, 'http://' + authHost, { disableWarnings: true });
  const email = randomUUID() + '@example.test';
  const password = randomUUID();
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await signOut(auth);
  await assert.rejects(signInWithEmailAndPassword(auth, email, 'incorrect'));
  assert.equal(auth.currentUser, null);
  const signedIn = await signInWithEmailAndPassword(auth, email, password);
  assert.equal(signedIn.user.uid, user.uid);
  await signOut(auth);
  assert.equal(auth.currentUser, null);
});

test('approved staff save distinct same-name records that a fresh client can find', async t => {
  const approved = 'emulator-approved-staff';
  const customers = firestoreFor(t, approved);
  const name = 'Test customer ' + randomUUID();
  const form = { fullName: name, phone: '', email: '' };
  const first = await registerCustomer(customers.firestore, form);
  const second = await registerCustomer(customers.firestore, form);
  assert.notEqual(first, second);
  const snapshot = await getDocsFromServer(firestoreFor(t, approved));
  const records = snapshot.docs.map(doc => normalizeCustomer(doc.id, doc.data()));
  assert.equal(filterCustomers(records, first)[0].fullName, name);
  assert.equal(filterCustomers(records, name.toUpperCase()).length, 2);
  await assert.rejects(updateDoc(doc(customers, first), { name: 'Edited' }), { code: 'permission-denied' });
  await assert.rejects(addDoc(customers, { name: '', createdAt: serverTimestamp() }), { code: 'permission-denied' });
});

test('signed-out and unapproved clients cannot read or write customer records', async t => {
  for (const uid of [undefined, 'unapproved']) {
    const customers = firestoreFor(t, uid);
    await assert.rejects(getDocsFromServer(customers), { code: 'permission-denied' });
    const form = { fullName: 'Test customer', phone: '', email: '' };
    await assert.rejects(registerCustomer(customers.firestore, form), { code: 'permission-denied' });
  }
});

test('an offline registration fails and does not write after reconnecting', { timeout: 15000 }, async t => {
  const customers = firestoreFor(t, 'emulator-approved-staff');
  const name = 'Offline customer ' + randomUUID();
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
  try {
    await assert.rejects(registerCustomer(customers.firestore, { fullName: name, phone: '', email: '' }), /offline/);
  } finally {
    delete navigator.onLine;
  }
  const snapshot = await getDocsFromServer(customers);
  assert.equal(snapshot.docs.some(record => record.data().name === name), false);
});

test('manual test accounts can sign in and enforce their different access levels', async t => {
  const seed = () => execFileSync(process.execPath, ['scripts/seed-emulator.mjs'], { encoding: 'utf8' });
  seed();
  const credentials = seed().trim().split(/\r?\n/);
  assert.equal(credentials.length, 2);

  for (const line of credentials) {
    const [email, password] = line.trim().split(/\s+/);
    const app = appFor(t);
    const auth = getAuth(app);
    connectAuthEmulator(auth, 'http://' + authHost, { disableWarnings: true });
    const db = getFirestore(app);
    const [host, port] = firestoreHost.split(':');
    connectFirestoreEmulator(db, host, Number(port));

    await signInWithEmailAndPassword(auth, email, password);
    const customers = collection(db, 'customers');
    if (email === 'staff@example.test') {
      await getDocsFromServer(customers);
    } else {
      assert.equal(email, 'unapproved@example.test');
      await assert.rejects(getDocsFromServer(customers), { code: 'permission-denied' });
    }
  }
});

const approvedStaff = 'emulator-approved-staff';

test('archiving is blocked during an open visit and preserves the completed receipt', async t => {
  const db = firestoreFor(t, approvedStaff).firestore;
  const visit = await checkInWalkIn(db, approvedStaff, {
    form: { fullName: 'Archive Test', phone: '', email: '' }
  });
  const customerRef = doc(db, 'customers', visit.customerId);
  await assert.rejects(archiveCustomer(db, approvedStaff, visit.customerId), /Check out/);
  await assert.rejects(updateDoc(customerRef, { archivedAt: serverTimestamp(), archivedBy: approvedStaff }),
    { code: 'permission-denied' });
  await checkOutWalkIn(db, approvedStaff, { ...visit, method: 'cash', paymentReceived: true });
  await archiveCustomer(db, approvedStaff, visit.customerId);
  const archived = (await getDocFromServer(customerRef)).data();
  assert.equal(archived.archivedBy, approvedStaff);
  assert.ok(archived.archivedAt.toMillis() > 0);
  assert.equal((await getDocFromServer(doc(db, 'walkInReceipts', visit.visitId))).data().status, 'paid');
  await assert.rejects(checkInWalkIn(db, approvedStaff, { customerId: visit.customerId }), /archived/);
  await assert.rejects(deleteDoc(customerRef), { code: 'permission-denied' });
});

test('a new walk-in saves a customer and an open visit that survive a fresh client', async t => {
  const db = firestoreFor(t, approvedStaff).firestore;
  await assert.rejects(checkInWalkIn(db, approvedStaff, { customerId: randomUUID() }), /record not found/);
  const fullName = 'Walk-in ' + randomUUID();
  const { customerId, visitId } = await checkInWalkIn(db, approvedStaff, {
    form: { fullName, phone: '', email: '' }
  });
  const fresh = firestoreFor(t, approvedStaff).firestore;
  const customer = await getDocFromServer(doc(fresh, 'customers', customerId));
  const visit = await getDocFromServer(doc(fresh, 'openWalkIns', customerId));
  assert.equal(customer.data().name, fullName);
  assert.equal(visit.data().customerName, fullName);
  assert.equal(visit.data().visitId, visitId);
  assert.equal(visit.data().checkedInBy, approvedStaff);
  assert.equal(typeof visit.data().checkedInAt.toMillis(), 'number');
});

test('competing staff sessions can open and close a returning customer visit only once', async t => {
  const first = firestoreFor(t, approvedStaff).firestore;
  const second = firestoreFor(t, approvedStaff).firestore;
  const customerId = await registerCustomer(first, { fullName: 'Returning Walk-in', phone: '', email: '' });
  const checkIns = await Promise.allSettled([first, second].map(db => checkInWalkIn(db, approvedStaff, { customerId })));
  assert.equal(checkIns.filter(result => result.status === 'fulfilled').length, 1);
  assert.match(checkIns.find(result => result.status === 'rejected').reason.message, /already checked in/);
  const { visitId } = checkIns.find(result => result.status === 'fulfilled').value;

  const details = { customerId, visitId, method: 'cash', paymentReceived: true };
  await assert.rejects(checkOutWalkIn(first, approvedStaff, { ...details, paymentReceived: false }), /received/);
  await assert.rejects(checkOutWalkIn(first, approvedStaff, { ...details, method: 'other' }), /cash or bank/);
  const checkouts = await Promise.allSettled([first, second].map(db => checkOutWalkIn(db, approvedStaff, details)));
  assert.equal(checkouts.filter(result => result.status === 'fulfilled').length, 1);
  assert.match(checkouts.find(result => result.status === 'rejected').reason.message, /no longer open/);

  const fresh = firestoreFor(t, approvedStaff).firestore;
  const openRef = doc(fresh, 'openWalkIns', customerId);
  const receiptRef = doc(fresh, 'walkInReceipts', visitId);
  const receipt = (await getDocFromServer(receiptRef)).data();
  assert.equal((await getDocFromServer(openRef)).exists(), false);
  assert.equal(receipt.customerId, customerId);
  assert.equal(receipt.amountMinor, 200);
  assert.equal(receipt.currency, 'USD');
  assert.equal(receipt.method, 'cash');
  assert.equal(receipt.status, 'paid');
  assert.equal(receipt.recordedBy, approvedStaff);
  assert.ok(receipt.checkedOutAt.toMillis() >= receipt.checkedInAt.toMillis());

  const next = await checkInWalkIn(first, approvedStaff, { customerId });
  assert.notEqual(next.visitId, visitId);
  await assert.rejects(checkOutWalkIn(second, approvedStaff, details), /no longer open/);
  assert.equal((await getDocFromServer(openRef)).data().visitId, next.visitId);
  await checkOutWalkIn(first, approvedStaff, { ...next, method: 'bank', paymentReceived: true });
  assert.equal((await getDocFromServer(doc(fresh, 'walkInReceipts', next.visitId))).data().method, 'bank');
});

test('Firestore requires a matching $2 USD receipt and open-visit deletion in the same write', async t => {
  const db = firestoreFor(t, approvedStaff).firestore;
  const { customerId, visitId } = await checkInWalkIn(db, approvedStaff, {
    form: { fullName: 'Guarded Walk-in', phone: '', email: '' }
  });
  const openRef = doc(db, 'openWalkIns', customerId);
  const receiptRef = doc(db, 'walkInReceipts', visitId);
  const visit = (await getDocFromServer(openRef)).data();
  const receipt = {
    ...visit, amountMinor: 200, currency: 'USD', method: 'bank', status: 'paid',
    checkedOutAt: serverTimestamp(), recordedBy: approvedStaff
  };
  await assert.rejects(deleteDoc(openRef), { code: 'permission-denied' });
  await assert.rejects(setDoc(receiptRef, receipt), { code: 'permission-denied' });
  for (const override of [{ amountMinor: 201 }, { method: 'other' }, { customerName: 'Wrong customer' }]) {
    const batch = writeBatch(db);
    batch.delete(openRef);
    batch.set(receiptRef, { ...receipt, ...override });
    await assert.rejects(batch.commit(), { code: 'permission-denied' });
  }
  assert.equal((await getDocFromServer(openRef)).exists(), true);
  assert.equal((await getDocFromServer(receiptRef)).exists(), false);
  await checkOutWalkIn(db, approvedStaff, { customerId, visitId, method: 'bank', paymentReceived: true });
  await assert.rejects(updateDoc(receiptRef, { method: 'cash' }), { code: 'permission-denied' });

  for (const uid of [undefined, 'unapproved']) {
    const unauthorized = firestoreFor(t, uid).firestore;
    await assert.rejects(getDocsFromServer(collection(unauthorized, 'openWalkIns')), { code: 'permission-denied' });
    await assert.rejects(getDocsFromServer(collection(unauthorized, 'walkInReceipts')), { code: 'permission-denied' });
    await assert.rejects(checkInWalkIn(unauthorized, uid, { customerId }), { code: 'permission-denied' });
  }
});
