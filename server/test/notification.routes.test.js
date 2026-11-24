import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-not-used-outside-the-test-suite';
const { app } = await import('../src/app.js');
const { signToken } = await import('../src/services/token.service.js');

test('notification APIs reject unauthenticated requests', async () => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();

  try {
    const responses = await Promise.all([
      fetch(`http://127.0.0.1:${port}/api/notifications`),
      fetch(`http://127.0.0.1:${port}/api/notifications/unread-count`),
      fetch(`http://127.0.0.1:${port}/api/admin/notifications`),
      fetch(`http://127.0.0.1:${port}/api/admin/notifications/recipients`)
    ]);
    assert.deepEqual(responses.map((response) => response.status), [401, 401, 401, 401]);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('notification admin APIs reject authenticated users and companies', async () => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  const tokens = ['user', 'company'].map((role) => signToken({ id: '507f1f77bcf86cd799439011', role }));

  try {
    const responses = await Promise.all(tokens.map((token) => fetch(
      `http://127.0.0.1:${port}/api/admin/notifications`,
      { headers: { Authorization: `Bearer ${token}` } }
    )));
    assert.deepEqual(responses.map((response) => response.status), [403, 403]);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
