import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRegistrationOtpService,
  REGISTRATION_OTP_MAX_ATTEMPTS,
  REGISTRATION_OTP_MAX_SENDS_PER_HOUR,
  REGISTRATION_OTP_RESEND_MS,
  REGISTRATION_OTP_TTL_MS
} from '../src/services/registration-otp.service.js';
import { EmailVerificationChallenge } from '../src/models/index.js';

process.env.EMAIL_OTP_SECRET = 'registration-otp-unit-test-secret';

function clone(value) {
  return value ? structuredClone(value) : null;
}

function matches(record, filter) {
  if (!record) return false;
  return Object.entries(filter).every(([key, expected]) => {
    const actual = record[key];
    if (expected && typeof expected === 'object' && !(expected instanceof Date) && !Array.isArray(expected)) {
      if ('$lt' in expected) return actual < expected.$lt;
      if ('$lte' in expected) return actual <= expected.$lte;
      if ('$gt' in expected) return actual > expected.$gt;
      if ('$gte' in expected) return actual >= expected.$gte;
      return false;
    }
    if (expected instanceof Date) return actual instanceof Date && actual.getTime() === expected.getTime();
    if (expected === null) return actual == null;
    return actual === expected;
  });
}

function createFakeModels({ registeredEmail = null } = {}) {
  const records = [];
  let nextId = 0;
  const lookup = (filter) => records.find((record) => matches(record, filter)) || null;
  const collection = {
    findOne(filter) {
      return { select: async () => clone(lookup(filter)) };
    },
    async create(data) {
      if (records.some((record) => record.emailHash === data.emailHash || record.sessionHash === data.sessionHash)) {
        throw Object.assign(new Error('duplicate key'), { code: 11000 });
      }
      const record = { _id: `challenge-${++nextId}`, ...clone(data) };
      records.push(record);
      return clone(record);
    },
    async findOneAndUpdate(filter, update) {
      const record = lookup(filter);
      if (!record) return null;
      Object.assign(record, clone(update.$set || {}));
      for (const [key, amount] of Object.entries(update.$inc || {})) record[key] = (record[key] || 0) + amount;
      return clone(record);
    },
    async updateOne(filter, update) {
      const record = lookup(filter);
      if (!record) return { modifiedCount: 0 };
      Object.assign(record, clone(update.$set || {}));
      return { modifiedCount: 1 };
    }
  };
  const exists = async ({ email }) => email === registeredEmail ? { _id: 'existing' } : null;
  return { User: { exists }, Company: { exists }, Challenge: collection, records };
}

function setup(options = {}) {
  const models = createFakeModels(options);
  const sent = [];
  let now = new Date('2026-11-28T10:00:00.000Z');
  let code = '123456';
  let sessionNumber = 0;
  const service = createRegistrationOtpService({
    models,
    sendEmail: async (email, otp) => sent.push({ email, otp }),
    isDeliveryConfigured: () => true,
    clock: () => new Date(now),
    randomCode: () => code,
    randomSession: () => `${String(++sessionNumber).padStart(32, '0')}${'a'.repeat(11)}`
  });
  return {
    service,
    models,
    sent,
    get now() { return now; },
    set now(value) { now = value; },
    set code(value) { code = value; }
  };
}

test('OTP policy is five minutes, five attempts, and at most five sends per hour', () => {
  assert.equal(REGISTRATION_OTP_TTL_MS, 5 * 60 * 1000);
  assert.equal(REGISTRATION_OTP_RESEND_MS, 60 * 1000);
  assert.equal(REGISTRATION_OTP_MAX_ATTEMPTS, 5);
  assert.equal(REGISTRATION_OTP_MAX_SENDS_PER_HOUR, 5);
  assert.equal(EmailVerificationChallenge.schema.path('otpHash').options.select, false);
  assert.equal(EmailVerificationChallenge.schema.path('sessionHash').options.select, false);
  assert.equal(EmailVerificationChallenge.schema.path('emailHash').options.select, false);
  const indexes = EmailVerificationChallenge.schema.indexes();
  assert.ok(indexes.some(([keys, options]) => keys.emailHash === 1 && options.unique));
  assert.ok(indexes.some(([keys, options]) => keys.sessionHash === 1 && options.unique));
  assert.ok(indexes.some(([keys, options]) => keys.purgeAt === 1 && options.expireAfterSeconds === 0));
});

test('issues a 6-digit code without returning or storing the plaintext code', async () => {
  const { service, models, sent } = setup();
  const result = await service.issue({ email: 'student@university.edu' });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].email, 'student@university.edu');
  assert.match(sent[0].otp, /^\d{6}$/);
  assert.equal(models.records.length, 1);
  assert.notEqual(models.records[0].otpHash, sent[0].otp);
  assert.equal(JSON.stringify(result).includes(sent[0].otp), false);
});

test('incorrect codes are counted and the fifth attempt invalidates the code', async () => {
  const { service, models } = setup();
  const issued = await service.issue({ email: 'member@custom-domain.example' });

  for (let attempt = 1; attempt < REGISTRATION_OTP_MAX_ATTEMPTS; attempt += 1) {
    await assert.rejects(
      service.consume({ email: 'member@custom-domain.example', otp: '000000', sessionToken: issued.sessionToken }),
      (error) => error.status === 400 && /Incorrect verification code/.test(error.message)
    );
  }
  await assert.rejects(
    service.consume({ email: 'member@custom-domain.example', otp: '000000', sessionToken: issued.sessionToken }),
    (error) => error.status === 429 && /Too many attempts/.test(error.message)
  );
  assert.equal(models.records[0].attempts, REGISTRATION_OTP_MAX_ATTEMPTS);
  assert.equal(models.records[0].otpHash, null);
});

test('a correct code is single-use and cannot be replayed', async () => {
  const { service, sent, models } = setup();
  const issued = await service.issue({ email: 'person@company.com' });
  await service.consume({ email: 'person@company.com', otp: sent[0].otp, sessionToken: issued.sessionToken });
  await assert.rejects(
    service.consume({ email: 'person@company.com', otp: sent[0].otp, sessionToken: issued.sessionToken }),
    (error) => error.status === 400
  );
  assert.ok(models.records[0].verifiedAt);
  assert.ok(models.records[0].consumedAt);
});

test('expired codes fail and resend is blocked until the 60-second cooldown ends', async () => {
  const state = setup();
  const { service, sent } = state;
  const issued = await service.issue({ email: 'member@college.ac.in' });
  await service.resend({ email: 'member@college.ac.in', sessionToken: issued.sessionToken });
  assert.equal(sent.length, 1);

  state.now = new Date(issued.resendAvailableAt);
  state.code = '654321';
  await service.resend({ email: 'member@college.ac.in', sessionToken: issued.sessionToken });
  assert.equal(sent.length, 2);
  await assert.rejects(
    service.consume({ email: 'member@college.ac.in', otp: sent[0].otp, sessionToken: issued.sessionToken }),
    (error) => error.status === 400 && /Incorrect/.test(error.message)
  );
  await service.consume({ email: 'member@college.ac.in', otp: sent[1].otp, sessionToken: issued.sessionToken });

  const second = setup();
  const issuedSecond = await second.service.issue({ email: 'expired@outlook.com' });
  second.now = new Date(new Date(issuedSecond.expiresAt).getTime() + 1);
  await assert.rejects(
    second.service.consume({ email: 'expired@outlook.com', otp: second.sent[0].otp, sessionToken: issuedSecond.sessionToken }),
    (error) => error.status === 400 && /expired/.test(error.message)
  );
  assert.equal(second.models.records[0].attempts, 0);
});

test('resend replaces the previous code and the send limit blocks a sixth delivery', async () => {
  const state = setup();
  const issued = await state.service.issue({ email: 'learner@hotmail.com' });
  for (let send = 2; send <= REGISTRATION_OTP_MAX_SENDS_PER_HOUR; send += 1) {
    state.now = new Date(state.now.getTime() + REGISTRATION_OTP_RESEND_MS);
    state.code = String(123455 + send);
    await state.service.resend({ email: 'learner@hotmail.com', sessionToken: issued.sessionToken });
  }
  assert.equal(state.sent.length, REGISTRATION_OTP_MAX_SENDS_PER_HOUR);
  const currentCode = state.sent.at(-1).otp;
  state.now = new Date(state.now.getTime() + REGISTRATION_OTP_RESEND_MS);
  await state.service.resend({ email: 'learner@hotmail.com', sessionToken: issued.sessionToken });
  assert.equal(state.sent.length, REGISTRATION_OTP_MAX_SENDS_PER_HOUR);
  await state.service.consume({ email: 'learner@hotmail.com', otp: currentCode, sessionToken: issued.sessionToken });
});

test('duplicate addresses receive the same-shaped response without email delivery or account creation access', async () => {
  const { service, sent } = setup({ registeredEmail: 'already@vertex.com' });
  const result = await service.issue({ email: 'already@vertex.com' });
  assert.equal(sent.length, 0);
  assert.ok(result.sessionToken);
  assert.ok(result.expiresAt);
  await assert.rejects(
    service.consume({ email: 'already@vertex.com', otp: '123456', sessionToken: result.sessionToken }),
    (error) => error.status === 400
  );
});

test('disabled verification skips email, challenge storage, and OTP consumption', async (t) => {
  const previous = process.env.EMAIL_VERIFICATION_ENABLED;
  t.after(() => {
    if (previous === undefined) delete process.env.EMAIL_VERIFICATION_ENABLED;
    else process.env.EMAIL_VERIFICATION_ENABLED = previous;
  });
  process.env.EMAIL_VERIFICATION_ENABLED = 'false';

  const state = setup();
  assert.deepEqual(await state.service.issue({ email: 'member@vertex.test' }), { verificationRequired: false });
  assert.deepEqual(await state.service.resend({ email: 'member@vertex.test' }), { verificationRequired: false });
  const consumed = await state.service.consume({ email: 'member@vertex.test' });
  assert.equal(consumed.verificationRequired, false);
  assert.equal(state.sent.length, 0);
  assert.equal(state.models.records.length, 0);
});

test('parallel verification attempts can consume one code only once', async () => {
  const state = setup();
  const issued = await state.service.issue({ email: 'race@company.com' });
  const attempts = await Promise.allSettled([
    state.service.consume({ email: 'race@company.com', otp: state.sent[0].otp, sessionToken: issued.sessionToken }),
    state.service.consume({ email: 'race@company.com', otp: state.sent[0].otp, sessionToken: issued.sessionToken })
  ]);
  assert.equal(attempts.filter((attempt) => attempt.status === 'fulfilled').length, 1);
  assert.equal(attempts.filter((attempt) => attempt.status === 'rejected').length, 1);
});
