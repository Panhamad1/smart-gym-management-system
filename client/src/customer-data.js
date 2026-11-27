import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';

export function normalizeCustomer(id, data) {
  return { ...data, id, fullName: String(data.name || data.fullName || '') };
}

// This is a staff-facing lookup hint, not a replacement for the immutable Firestore document ID.
// Increase the prefix if two records would show the same reference in the current directory.
export function customerReference(id, customers = []) {
  const fullId = String(id || '');
  if (!fullId) return 'GYM-UNKNOWN';
  let size = Math.min(6, fullId.length);
  while (size < fullId.length && customers.some(customer =>
    String(customer.id) !== fullId &&
    String(customer.id).slice(0, size).toLowerCase() === fullId.slice(0, size).toLowerCase()
  )) {
    size = Math.min(size + 2, fullId.length);
  }
  return 'GYM-' + fullId.slice(0, size).toUpperCase();
}

export function phoneHint(phone) {
  const digits = String(phone || '').replace(/\\D/g, '');
  return digits.length >= 4 ? 'Phone ending ' + digits.slice(-4) : 'No phone on file';
}

export function filterCustomers(customers, search) {
  const query = search.trim().toLowerCase();
  const digits = query.replace(/\\D/g, '');
  return customers.filter(customer =>
    !query ||
    String(customer.id).toLowerCase() === query ||
    customer.fullName.toLowerCase().includes(query) ||
    customerReference(customer.id, customers).toLowerCase() === query ||
    (digits.length >= 4 && String(customer.phone || '').replace(/\\D/g, '').includes(digits))
  );
}

export function customerPayload(form, createdAt) {
  const name = form.fullName.trim();
  const phone = form.phone.trim();
  const email = form.email.trim();
  if (!name || name.length > 120) throw new Error('Enter a customer name of 1–120 characters.');
  if (phone.length > 30) throw new Error('Phone must be at most 30 characters.');
  if (email.length > 254 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) throw new Error('Enter a valid email address of at most 254 characters.');
  return { name, ...(phone ? { phone } : {}), ...(email ? { email } : {}), createdAt };
}
export async function registerCustomer(db, form) {
  const payload = customerPayload(form, serverTimestamp());
  if (globalThis.navigator?.onLine === false) {
    throw new Error('You are offline. Reconnect before registering a customer.');
  }
  const customer = doc(collection(db, 'customers'));
  // Transactions fail offline instead of queueing a customer write after the form closes.
  await runTransaction(db, async transaction => {
    transaction.set(customer, payload);
  }, { maxAttempts: 1 });
  return customer.id;
}
