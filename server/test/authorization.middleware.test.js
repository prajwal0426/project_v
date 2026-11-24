import test from 'node:test';
import assert from 'node:assert/strict';
import { authorize } from '../src/middleware/auth.middleware.js';

function runAuthorization(roles, role) {
  let nextCalled = false;
  let responseStatus;
  let responseBody;
  const middleware = authorize(...roles);
  middleware(
    { user: { role } },
    {
      status(status) { responseStatus = status; return this; },
      json(body) { responseBody = body; return this; }
    },
    () => { nextCalled = true; }
  );
  return { nextCalled, responseStatus, responseBody };
}

test('admin authorization rejects user and company roles', () => {
  assert.equal(runAuthorization(['admin'], 'user').responseStatus, 403);
  assert.equal(runAuthorization(['admin'], 'company').responseStatus, 403);
});

test('role-specific authorization permits only the configured role', () => {
  assert.equal(runAuthorization(['company'], 'company').nextCalled, true);
  assert.equal(runAuthorization(['user'], 'company').responseStatus, 403);
});
