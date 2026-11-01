export function normalizeCustomer(id, data) {
  return { ...data, id, fullName: String(data.name || data.fullName || '') };
}

export function filterCustomers(customers, search) {
  const query = search.trim().toLowerCase();
  return customers.filter(customer => !query || String(customer.id).toLowerCase() === query || customer.fullName.toLowerCase().includes(query));
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
