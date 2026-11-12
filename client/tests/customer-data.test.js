import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCustomer, filterCustomers, customerPayload } from '../src/customer-data.js';

test('optional blank contact fields are omitted to satisfy the published Firestore rules', () => {
  const timestamp = {};
  assert.deepEqual(customerPayload({ fullName: ' Alice ', phone: ' ', email: '' }, timestamp), { name: 'Alice', createdAt: timestamp });
});

test('contact fields are trimmed and preserved', () => {
  assert.deepEqual(customerPayload({ fullName: ' Alice ', phone: ' 012345678 ', email: ' alice@example.com ' }, 'timestamp'), { name: 'Alice', phone: '012345678', email: 'alice@example.com', createdAt: 'timestamp' });
});

test('invalid names and contact fields cannot be sent to the database', () => {
  const form = { fullName: 'Alice', phone: '', email: '' };
  for (const patch of [{ fullName: '  ' }, { fullName: 'a'.repeat(121) }, { phone: '1'.repeat(31) }, { email: 'invalid' }, { email: 'a'.repeat(250) + '@example.com' }]) {
    assert.throws(() => customerPayload({ ...form, ...patch }, 'timestamp'));
  }
});

test('search finds exact IDs and case-insensitive partial names without changing the total records', () => {
  const customers = [normalizeCustomer('abc123', { name: 'Alice Smith' }), normalizeCustomer('def456', { name: 'Bob' })];
  assert.equal(filterCustomers(customers, '  ALICE  ')[0].id, 'abc123');
  assert.equal(filterCustomers(customers, 'def456')[0].fullName, 'Bob');
  assert.equal(filterCustomers(customers, 'abc').length, 0);
  assert.equal(filterCustomers(customers, 'nobody').length, 0);
  assert.equal(filterCustomers(customers, '').length, 2);
  assert.equal(customers.length, 2);
});

test('document IDs are authoritative and legacy fullName records remain readable', () => {
  assert.deepEqual(normalizeCustomer('real-id', { id: 'incorrect-id', fullName: 'Alice' }), { id: 'real-id', fullName: 'Alice' });
});
