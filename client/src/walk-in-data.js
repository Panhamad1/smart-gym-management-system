import { collection, doc, getDocFromServer, runTransaction, serverTimestamp } from 'firebase/firestore';
import { customerPayload, normalizeCustomer } from './customer-data.js';

export const walkInFee = { amountMinor: 200, currency: 'USD' };
export const walkInMethods = { cash: 'Cash', bank: 'Bank transfer' };

export function walkInError(error) {
  if (error.code === 'permission-denied') return 'Your account does not have walk-in access. Contact your administrator.';
  return error.code ? 'Unable to reach the walk-in database. Check your connection and try again.' : error.message;
}

export async function checkInWalkIn(db, staffId, { customerId, form }) {
  if (globalThis.navigator?.onLine === false) {
    throw new Error('Reconnect before checking in a customer.');
  }
  const customerRef = form ? doc(collection(db, 'customers')) : doc(db, 'customers', customerId);
  const openRef = doc(db, 'openWalkIns', customerRef.id);
  const visitId = doc(collection(db, 'walkInReceipts')).id;
  const newCustomer = form ? customerPayload(form, serverTimestamp()) : null;

  const writeVisit = runTransaction(db, async transaction => {
    const open = await transaction.get(openRef);
    if (open.exists()) throw new Error('This customer is already checked in.');

    let customerName = newCustomer?.name;
    if (!newCustomer) {
      const customer = await transaction.get(customerRef);
      if (!customer.exists()) throw new Error('Customer record not found.');
      if (customer.data().archivedAt) throw new Error('This customer is archived.');
      customerName = normalizeCustomer(customer.id, customer.data()).fullName;
      if (!customerName.trim()) throw new Error('This customer record has no name.');
    }

    if (newCustomer) transaction.set(customerRef, newCustomer);
    transaction.set(openRef, {
      customerId: customerRef.id,
      customerName,
      visitId,
      checkedInAt: serverTimestamp(),
      checkedInBy: staffId
    });
  });
  try {
    await writeVisit;
  } catch (error) {
    if (error.code === 'permission-denied') {
      const open = await getDocFromServer(openRef).catch(() => null);
      if (open?.exists()) throw new Error('This customer is already checked in.');
    }
    throw error;
  }

  return { customerId: customerRef.id, visitId };
}

export async function archiveCustomer(db, staffId, customerId) {
  const customerRef = doc(db, 'customers', customerId);
  const openRef = doc(db, 'openWalkIns', customerId);
  await runTransaction(db, async transaction => {
    const customer = await transaction.get(customerRef);
    if (!customer.exists()) throw new Error('Customer record not found.');
    if (customer.data().archivedAt) return;
    const visit = await transaction.get(openRef);
    if (visit.exists()) throw new Error('Check out this customer before archiving.');
    transaction.update(customerRef, { archivedAt: serverTimestamp(), archivedBy: staffId });
  });
}

export async function checkOutWalkIn(db, staffId, { customerId, visitId, method, paymentReceived }) {
  if (paymentReceived !== true) throw new Error('Confirm that the payment was received before checkout.');
  if (!Object.hasOwn(walkInMethods, method)) throw new Error('Select cash or bank transfer.');
  if (globalThis.navigator?.onLine === false) throw new Error('Reconnect before checking out a customer.');

  const openRef = doc(db, 'openWalkIns', customerId);
  const receiptRef = doc(db, 'walkInReceipts', visitId);
  const closeVisit = runTransaction(db, async transaction => {
    const open = await transaction.get(openRef);
    if (!open.exists() || open.data().visitId !== visitId) throw new Error('This visit is no longer open.');
    const { customerName, checkedInAt, checkedInBy } = open.data();
    transaction.set(receiptRef, {
      customerId, customerName, visitId, checkedInAt, checkedInBy,
      ...walkInFee, method, status: 'paid', checkedOutAt: serverTimestamp(), recordedBy: staffId
    });
    transaction.delete(openRef);
  });
  try {
    await closeVisit;
  } catch (error) {
    // Rules can reject a competing write before Firestore retries the transaction.
    if (error.code === 'permission-denied') {
      const receipt = await getDocFromServer(receiptRef).catch(() => null);
      if (receipt?.data()?.customerId === customerId) throw new Error('This visit is no longer open.');
    }
    throw error;
  }
}
