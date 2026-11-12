import { randomBytes } from 'node:crypto';

const endpoint = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/demo-smart-gym/accounts';
const accounts = [
  { localId: 'emulator-approved-staff', email: 'staff@example.test', displayName: 'Approved Test Staff' },
  { localId: 'emulator-unapproved-staff', email: 'unapproved@example.test', displayName: 'Unapproved Test Staff' }
];
const headers = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' };

for (const account of accounts) {
  const password = randomBytes(18).toString('base64url');
  const create = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...account, password })
  });
  if (!create.ok) {
    const error = (await create.json()).error?.message;
    if (error !== 'DUPLICATE_LOCAL_ID' && error !== 'EMAIL_EXISTS') {
      throw new Error('Unable to seed the local Auth emulator: ' + error);
    }
    const update = await fetch(endpoint + ':update', {
      method: 'POST',
      headers,
      body: JSON.stringify({ localId: account.localId, password })
    });
    if (!update.ok) throw new Error('Unable to reset the synthetic account in the local Auth emulator.');
  }
  console.log(account.email + '  ' + password);
}
