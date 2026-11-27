import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCustomer, filterCustomers, customerPayload, customerReference, phoneHint } from '../src/customer-data.js';

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

test('same-name customers remain distinct even if they share a phone number', () => {
  const customers = [
    normalizeCustomer('aa11112222abcdefghij', { name: 'Sokha', phone: '+855 12 345 678' }),
    normalizeCustomer('bb11112222abcdefghij', { name: 'Sokha', phone: '+855 12 345 678' })
  ];
  assert.equal(filterCustomers(customers, 'Sokha').length, 2);
  assert.equal(filterCustomers(customers, '5678').length, 2);
  assert.notEqual(customerReference(customers[0].id, customers), customerReference(customers[1].id, customers));
  assert.deepEqual(filterCustomers(customers, customerReference(customers[0].id, customers)).map(x => x.id), [customers[0].id]);
  assert.equal(phoneHint(customers[0].phone), 'Phone ending 5678');
});

test('colliding short references are expanded, while authoritative IDs remain distinct', () => {
  const customers = [
    normalizeCustomer('sameid001aaaaa', { name: 'Dara' }),
    normalizeCustomer('sameid002bbbbb', { name: 'Dara' })
  ];
  assert.notEqual(customerReference(customers[0].id, customers), customerReference(customers[1].id, customers));
  assert.equal(filterCustomers(customers, customerReference(customers[1].id, customers))[0].id, customers[1].id);
  assert.equal(phoneHint(''), 'No phone on file');
  assert.equal(filterCustomers(customers, '1234').length, 0);
});

test('phone lookups ignore common Cambodia dialing punctuation', () => {
  const customers = [normalizeCustomer('oneuniqueid', { name: 'Alice', phone: '+855 (12) 345-678' })];
  assert.equal(filterCustomers(customers, '012345').length, 0);
  assert.equal(filterCustomers(customers, '85512345678').length, 1);
  assert.equal(filterCustomers(customers, '5678').length, 1);
});
