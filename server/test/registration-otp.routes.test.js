import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { OAuth2Client } from 'google-auth-library';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-not-used-outside-the-test-suite';
process.env.EMAIL_OTP_SECRET = 'registration-otp-route-test-secret';
process.env.EMAIL_VERIFICATION_ENABLED = 'true';
const { app } = await import('../src/app.js');
const { User, Wallet } = await import('../src/models/index.js');
const { LEGAL_VERSIONS } = await import('../src/services/legal.service.js');

async function withServer(run) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test('registration OTP endpoint rejects malformed email addresses', async () => {
  await withServer(async (baseUrl) => {
    const requirements = await fetch(`${baseUrl}/api/auth/legal-requirements`);
    assert.equal((await requirements.json()).emailVerificationRequired, true);

    const invalidResponse = await fetch(`${baseUrl}/api/auth/registration-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' })
    });
    assert.equal(invalidResponse.status, 422);
  });
});

test('OTP-specific rate limiting remains active when verification is enabled', async () => {
  process.env.EMAIL_VERIFICATION_ENABLED = 'true';
  await withServer(async (baseUrl) => {
    const responses = [];
    for (let attempt = 0; attempt < 8; attempt += 1) {
      responses.push(await fetch(`${baseUrl}/api/auth/registration-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email' })
      }));
    }
    assert.equal(responses.at(-1).status, 429);
  });
});

test('registration route rejects missing OTP and rejects a six-digit OTP without its server session cookie', async () => {
  await withServer(async (baseUrl) => {
    const payload = {
      name: 'Test Member',
      email: 'new-member@custom-domain.example',
      password: 'long-enough-password',
      dateOfBirth: '2000-01-01',
      privacyPolicyAccepted: 'true',
      termsAccepted: 'true',
      ageConfirmed: 'true',
      privacyPolicyVersion: LEGAL_VERSIONS.privacyPolicy,
      termsVersion: LEGAL_VERSIONS.terms
    };

    const withoutCode = await fetch(`${baseUrl}/api/auth/user/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    assert.equal(withoutCode.status, 422);

    const malformedCode = await fetch(`${baseUrl}/api/auth/user/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, otp: 'abc123' })
    });
    assert.equal(malformedCode.status, 422);
    assert.equal(JSON.stringify(await malformedCode.json()).includes('abc123'), false);

    const withoutSession = await fetch(`${baseUrl}/api/auth/user/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, otp: '123456' })
    });
    assert.equal(withoutSession.status, 400);
    assert.match((await withoutSession.json()).message, /Invalid or expired verification code/);
  });
});

test('disabled verification allows normal registration without OTP, rejects duplicate email, and preserves login', async (t) => {
  const previous = process.env.EMAIL_VERIFICATION_ENABLED;
  t.after(() => {
    if (previous === undefined) delete process.env.EMAIL_VERIFICATION_ENABLED;
    else process.env.EMAIL_VERIFICATION_ENABLED = previous;
  });
  process.env.EMAIL_VERIFICATION_ENABLED = 'false';

  const accounts = new Map();
  t.mock.method(User, 'create', async (fields) => {
    const key = fields.email.toLowerCase();
    if (accounts.has(key)) throw Object.assign(new Error('duplicate'), { code: 11000 });
    const account = { _id: '507f1f77bcf86cd799439011', ...fields };
    accounts.set(key, account);
    return account;
  });
  t.mock.method(Wallet, 'updateOne', async () => ({ acknowledged: true }));

  await withServer(async (baseUrl) => {
    const payload = {
      name: 'Test Member',
      email: 'new-member@custom-domain.example',
      password: 'long-enough-password',
      dateOfBirth: '2000-01-01',
      privacyPolicyAccepted: 'true',
      termsAccepted: 'true',
      ageConfirmed: 'true',
      privacyPolicyVersion: LEGAL_VERSIONS.privacyPolicy,
      termsVersion: LEGAL_VERSIONS.terms
    };

    const response = await fetch(`${baseUrl}/api/auth/user/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    assert.equal(response.status, 201);
    const registered = await response.json();
    assert.equal(registered.account.email, payload.email);
    assert.ok(registered.token);

    const duplicate = await fetch(`${baseUrl}/api/auth/user/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    assert.equal(duplicate.status, 409);

    t.mock.method(User, 'findOne', (filter) => ({ select: async () => accounts.get(filter.email) || null }));
    t.mock.method(User, 'findByIdAndUpdate', async () => ({ acknowledged: true }));
    const login = await fetch(`${baseUrl}/api/auth/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: payload.email, password: payload.password })
    });
    assert.equal(login.status, 200);
    assert.ok((await login.json()).token);

    const requirements = await fetch(`${baseUrl}/api/auth/legal-requirements`);
    assert.equal((await requirements.json()).emailVerificationRequired, false);

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const otpStart = await fetch(`${baseUrl}/api/auth/registration-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `member-${attempt}@custom-domain.example` })
      });
      assert.equal(otpStart.status, 200);
      assert.equal((await otpStart.json()).verificationRequired, false);
    }
  });
});

test('Google sign-in remains available while disabled and first-time Google registration completes consent without OTP', async (t) => {
  const previous = process.env.EMAIL_VERIFICATION_ENABLED;
  t.after(() => {
    if (previous === undefined) delete process.env.EMAIL_VERIFICATION_ENABLED;
    else process.env.EMAIL_VERIFICATION_ENABLED = previous;
  });
  process.env.EMAIL_VERIFICATION_ENABLED = 'false';

  t.mock.method(OAuth2Client.prototype, 'verifyIdToken', async () => ({
    getPayload: () => ({ email: 'google-member@example.com', name: 'Google Member', sub: 'google-subject', email_verified: true })
  }));
  t.mock.method(User, 'findOne', () => ({ select: async () => null }));
  t.mock.method(User, 'create', async (fields) => ({ _id: '507f1f77bcf86cd799439012', ...fields }));
  t.mock.method(User, 'findByIdAndUpdate', async () => ({ acknowledged: true }));
  t.mock.method(Wallet, 'updateOne', async () => ({ acknowledged: true }));

  await withServer(async (baseUrl) => {
    const google = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'test-google-credential' })
    });
    assert.equal(google.status, 200);
    const pending = await google.json();
    assert.equal(pending.account.emailVerificationRequired, false);
    assert.ok(pending.token);

    const consent = await fetch(`${baseUrl}/api/auth/legal-consent`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pending.token}`
      },
      body: JSON.stringify({
        privacyPolicyAccepted: true,
        termsAccepted: true,
        ageConfirmed: true
      })
    });
    assert.equal(consent.status, 201);
    const account = await consent.json();
    assert.equal(account.account.email, 'google-member@example.com');
    assert.ok(account.token);
  });
});
