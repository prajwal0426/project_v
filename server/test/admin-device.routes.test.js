import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-not-used-outside-the-test-suite';
const { app } = await import('../src/app.js');
const { signToken } = await import('../src/services/token.service.js');

test('Admin device APIs reject unauthenticated requests', async () => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/devices`);
    assert.equal(response.status, 401);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('regular users and companies cannot list or revoke Admin devices', async () => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  const tokenByRole = Object.fromEntries(['user', 'company'].map((role) => [
    role,
    signToken({ id: '507f1f77bcf86cd799439011', role })
  ]));

  try {
    const responses = await Promise.all(Object.values(tokenByRole).flatMap((token) => [
      fetch(`http://127.0.0.1:${port}/api/admin/devices`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`http://127.0.0.1:${port}/api/admin/devices/507f1f77bcf86cd799439011`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
    ]));
    assert.deepEqual(responses.map((response) => response.status), [403, 403, 403, 403]);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
