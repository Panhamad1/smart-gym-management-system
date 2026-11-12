import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

function startServer(secret) {
  return spawn(process.execPath, ['src/index.js'], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    env: { ...process.env, JWT_SECRET: secret, PORT: '0', DB_HOST: '127.0.0.1', DB_PORT: '1' }
  });
}

test('the legacy server refuses to start without a configured signing secret', async () => {
  const child = startServer('');
  let output = '';
  child.stderr.setEncoding('utf8').on('data', chunk => { output += chunk; });
  const [code] = await once(child, 'close');
  assert.notEqual(code, 0);
  assert.match(output, /Set JWT_SECRET/);
});

test('legacy endpoints reject anonymous reads and login fails closed when MySQL is unavailable', { timeout: 10000 }, async t => {
  const child = startServer(randomBytes(32).toString('hex'));
  const closed = once(child, 'close');
  t.after(async () => {
    child.kill();
    await closed;
  });
  const base = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', code => reject(new Error('Legacy API exited with code ' + code)));
    child.stdout.setEncoding('utf8').on('data', chunk => {
      const url = chunk.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
      if (url) resolve(url);
    });
  });
  for (const endpoint of ['customers', 'payments', 'attendance']) {
    assert.equal((await fetch(base + '/api/' + endpoint)).status, 401);
  }
  const login = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail: 'synthetic-staff@example.test', password: randomBytes(16).toString('hex') })
  });
  assert.equal(login.status, 503);
});
