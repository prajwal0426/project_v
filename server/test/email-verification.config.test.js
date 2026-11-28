import test from 'node:test';
import assert from 'node:assert/strict';
import { isEmailVerificationEnabled, isRegistrationOtpValid } from '../src/config/email-verification.js';

test('email verification defaults to required and only an explicit false disables it', (t) => {
  const previous = process.env.EMAIL_VERIFICATION_ENABLED;
  t.after(() => {
    if (previous === undefined) delete process.env.EMAIL_VERIFICATION_ENABLED;
    else process.env.EMAIL_VERIFICATION_ENABLED = previous;
  });

  delete process.env.EMAIL_VERIFICATION_ENABLED;
  assert.equal(isEmailVerificationEnabled(), true);
  assert.equal(isRegistrationOtpValid(undefined), false);

  process.env.EMAIL_VERIFICATION_ENABLED = 'false';
  assert.equal(isEmailVerificationEnabled(), false);
  assert.equal(isRegistrationOtpValid(undefined), true);
  assert.equal(isRegistrationOtpValid('not-an-otp'), true);

  process.env.EMAIL_VERIFICATION_ENABLED = 'true';
  assert.equal(isEmailVerificationEnabled(), true);
  assert.equal(isRegistrationOtpValid('123456'), true);
  assert.equal(isRegistrationOtpValid('12345'), false);

  process.env.EMAIL_VERIFICATION_ENABLED = 'off';
  assert.equal(isEmailVerificationEnabled(), true);
});
