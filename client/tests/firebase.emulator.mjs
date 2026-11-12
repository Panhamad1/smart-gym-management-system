import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, collection, addDoc, getDocsFromServer, serverTimestamp, updateDoc } from 'firebase/firestore';
import { customerPayload, filterCustomers, normalizeCustomer } from '../src/customer-data.js';

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
  const first = await addDoc(customers, customerPayload(form, serverTimestamp()));
  const second = await addDoc(customers, customerPayload(form, serverTimestamp()));
  assert.notEqual(first.id, second.id);
  const snapshot = await getDocsFromServer(firestoreFor(t, approved));
  const records = snapshot.docs.map(doc => normalizeCustomer(doc.id, doc.data()));
  assert.equal(filterCustomers(records, first.id)[0].fullName, name);
  assert.equal(filterCustomers(records, name.toUpperCase()).length, 2);
  await assert.rejects(updateDoc(first, { name: 'Edited' }), { code: 'permission-denied' });
  await assert.rejects(addDoc(customers, { name: '', createdAt: serverTimestamp() }), { code: 'permission-denied' });
});

test('signed-out and unapproved clients cannot read or write customer records', async t => {
  for (const uid of [undefined, 'unapproved']) {
    const customers = firestoreFor(t, uid);
    await assert.rejects(getDocsFromServer(customers), { code: 'permission-denied' });
    const data = customerPayload({ fullName: 'Test customer', phone: '', email: '' }, serverTimestamp());
    await assert.rejects(addDoc(customers, data), { code: 'permission-denied' });
  }
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
