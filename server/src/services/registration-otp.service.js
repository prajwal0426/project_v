import crypto from 'node:crypto';
import { isEmailVerificationEnabled } from '../config/email-verification.js';
import { Company, EmailVerificationChallenge, User } from '../models/index.js';
import { isEmailDeliveryConfigured, sendRegistrationCode } from './email.service.js';

export const REGISTRATION_OTP_TTL_MS = 5 * 60 * 1000;
export const REGISTRATION_OTP_RESEND_MS = 60 * 1000;
export const REGISTRATION_OTP_MAX_ATTEMPTS = 5;
export const REGISTRATION_OTP_MAX_SENDS_PER_HOUR = 5;
const SEND_WINDOW_MS = 60 * 60 * 1000;
const CHALLENGE_RETENTION_MS = 24 * 60 * 60 * 1000;
const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function serviceError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function secretKey() {
  const secret = process.env.EMAIL_OTP_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw serviceError(503, 'Email verification is not configured. Contact the VERTEX administrator.');
  }
  return secret;
}

function keyedHash(purpose, value) {
  return crypto.createHmac('sha256', secretKey()).update(`${purpose}:${value}`).digest('hex');
}

function constantTimeEqual(left = '', right = '') {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function makeSessionToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function makeOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function responseWindow(now, challenge) {
  return {
    verificationRequired: true,
    expiresAt: challenge?.expiresAt || new Date(now.getTime() + REGISTRATION_OTP_TTL_MS),
    resendAvailableAt: challenge?.resendAfter || new Date(now.getTime() + REGISTRATION_OTP_RESEND_MS)
  };
}

function privateChallengeQuery(query) {
  return query.select('+sessionHash +otpHash');
}

function makeChallengeData({ emailHash, sessionHash, otpHash, now, sendCount, windowStartedAt }) {
  return {
    emailHash,
    sessionHash,
    otpHash,
    attempts: 0,
    codeCreatedAt: now,
    expiresAt: new Date(now.getTime() + REGISTRATION_OTP_TTL_MS),
    resendAfter: new Date(now.getTime() + REGISTRATION_OTP_RESEND_MS),
    windowStartedAt,
    sendCount,
    verifiedAt: null,
    consumedAt: null,
    purgeAt: new Date(now.getTime() + CHALLENGE_RETENTION_MS)
  };
}

async function hasExistingAccount(email, models) {
  const [user, company] = await Promise.all([
    models.User.exists({ email }),
    models.Company.exists({ email })
  ]);
  return Boolean(user || company);
}

function genericWindow(now, sessionToken) {
  return {
    sessionToken,
    ...responseWindow(now)
  };
}

export function createRegistrationOtpService({
  models = { User, Company, Challenge: EmailVerificationChallenge },
  sendEmail = sendRegistrationCode,
  isDeliveryConfigured = isEmailDeliveryConfigured,
  clock = () => new Date(),
  randomSession = makeSessionToken,
  randomCode = makeOtp
} = {}) {
  let indexesReady;

  async function ensureIndexes() {
    if (typeof models.Challenge.createIndexes !== 'function') return;
    if (!indexesReady) {
      indexesReady = models.Challenge.createIndexes().catch((error) => {
        indexesReady = null;
        throw error;
      });
    }
    await indexesReady;
  }

  async function issue({ email, sessionToken }) {
    if (!isEmailVerificationEnabled()) return { verificationRequired: false };

    const now = clock();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!isDeliveryConfigured()) {
      throw serviceError(503, 'Email verification is not configured. Contact the VERTEX administrator.');
    }
    await ensureIndexes();

    const emailHash = keyedHash('email', normalizedEmail);
    let activeSession = SESSION_TOKEN_PATTERN.test(String(sessionToken || '')) ? sessionToken : randomSession();
    const existingAccount = await hasExistingAccount(normalizedEmail, models);
    if (existingAccount) return genericWindow(now, randomSession());

    const currentSessionHash = keyedHash('session', activeSession);
    const existingBySession = await privateChallengeQuery(
      models.Challenge.findOne({ sessionHash: currentSessionHash })
    );
    if (existingBySession && existingBySession.emailHash !== emailHash) {
      activeSession = randomSession();
    }
    const sessionHash = keyedHash('session', activeSession);
    const existing = await privateChallengeQuery(models.Challenge.findOne({ emailHash }));

    if (existing && existing.sessionHash === sessionHash && !existing.consumedAt && existing.resendAfter > now) {
      return { sessionToken: activeSession, ...responseWindow(now, existing) };
    }

    if (existing && existing.resendAfter > now) {
      return genericWindow(now, randomSession());
    }

    const windowActive = existing?.windowStartedAt && now.getTime() - existing.windowStartedAt.getTime() < SEND_WINDOW_MS;
    if (existing && windowActive && existing.sendCount >= REGISTRATION_OTP_MAX_SENDS_PER_HOUR) {
      return genericWindow(now, randomSession());
    }

    const code = randomCode();
    const codeHash = keyedHash('otp', `${emailHash}:${sessionHash}:${code}`);
    const windowStartedAt = windowActive ? existing.windowStartedAt : now;
    const sendCount = windowActive ? existing.sendCount + 1 : 1;
    const data = makeChallengeData({ emailHash, sessionHash, otpHash: codeHash, now, sendCount, windowStartedAt });
    let challenge;

    if (existing) {
      challenge = await models.Challenge.findOneAndUpdate(
        {
          _id: existing._id,
          sessionHash: existing.sessionHash,
          codeCreatedAt: existing.codeCreatedAt,
          resendAfter: existing.resendAfter,
          sendCount: existing.sendCount
        },
        { $set: data },
        { new: true }
      );
      if (!challenge) return genericWindow(now, randomSession());
    } else {
      try {
        challenge = await models.Challenge.create(data);
      } catch (error) {
        if (error.code === 11000) return genericWindow(now, randomSession());
        throw error;
      }
    }

    try {
      await sendEmail(normalizedEmail, code);
    } catch {
      await models.Challenge.updateOne(
        { _id: challenge._id, sessionHash },
        { $set: { otpHash: null, expiresAt: now, resendAfter: new Date(now.getTime() + REGISTRATION_OTP_RESEND_MS) } }
      );
      throw serviceError(503, 'Unable to send the verification email. Please try again shortly.');
    }

    return { sessionToken: activeSession, ...responseWindow(now, challenge) };
  }

  async function resend({ email, sessionToken }) {
    if (!isEmailVerificationEnabled()) return { verificationRequired: false };

    const now = clock();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!isDeliveryConfigured()) {
      throw serviceError(503, 'Email verification is not configured. Contact the VERTEX administrator.');
    }
    await ensureIndexes();

    const sessionHash = SESSION_TOKEN_PATTERN.test(String(sessionToken || ''))
      ? keyedHash('session', sessionToken)
      : '';
    const emailHash = keyedHash('email', normalizedEmail);
    const challenge = sessionHash
      ? await privateChallengeQuery(models.Challenge.findOne({ emailHash, sessionHash }))
      : null;

    if (!challenge || challenge.consumedAt || challenge.resendAfter > now) {
      return responseWindow(now);
    }

    const windowActive = challenge.windowStartedAt && now.getTime() - challenge.windowStartedAt.getTime() < SEND_WINDOW_MS;
    if (windowActive && challenge.sendCount >= REGISTRATION_OTP_MAX_SENDS_PER_HOUR) {
      return responseWindow(now, challenge);
    }

    const [user, company] = await Promise.all([
      models.User.exists({ email: normalizedEmail }),
      models.Company.exists({ email: normalizedEmail })
    ]);
    if (user || company) return responseWindow(now);

    const code = randomCode();
    const codeHash = keyedHash('otp', `${emailHash}:${sessionHash}:${code}`);
    const windowStartedAt = windowActive ? challenge.windowStartedAt : now;
    const sendCount = windowActive ? challenge.sendCount + 1 : 1;
    const data = makeChallengeData({ emailHash, sessionHash, otpHash: codeHash, now, sendCount, windowStartedAt });
    const updated = await models.Challenge.findOneAndUpdate(
      {
        _id: challenge._id,
        sessionHash,
        codeCreatedAt: challenge.codeCreatedAt,
        resendAfter: challenge.resendAfter,
        sendCount: challenge.sendCount,
        consumedAt: null
      },
      { $set: data },
      { new: true }
    );
    if (!updated) return responseWindow(now);

    try {
      await sendEmail(normalizedEmail, code);
    } catch {
      await models.Challenge.updateOne(
        { _id: updated._id, sessionHash },
        { $set: { otpHash: null, expiresAt: now, resendAfter: new Date(now.getTime() + REGISTRATION_OTP_RESEND_MS) } }
      );
      throw serviceError(503, 'Unable to send the verification email. Please try again shortly.');
    }

    return responseWindow(now, updated);
  }

  async function consume({ email, otp, sessionToken }) {
    const now = clock();
    if (!isEmailVerificationEnabled()) return { verifiedAt: now, verificationRequired: false };

    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!SESSION_TOKEN_PATTERN.test(String(sessionToken || '')) || !/^\d{6}$/.test(String(otp || ''))) {
      throw serviceError(400, 'Invalid or expired verification code. Please request a new one.');
    }
    await ensureIndexes();

    const emailHash = keyedHash('email', normalizedEmail);
    const sessionHash = keyedHash('session', sessionToken);
    const challenge = await privateChallengeQuery(
      models.Challenge.findOne({ emailHash, sessionHash })
    );

    if (!challenge || challenge.consumedAt || !challenge.expiresAt || challenge.expiresAt <= now || !challenge.otpHash) {
      throw serviceError(400, 'Invalid or expired verification code. Please request a new one.');
    }
    if (challenge.attempts >= REGISTRATION_OTP_MAX_ATTEMPTS) {
      throw serviceError(429, 'Too many attempts. Please request a new code.');
    }

    const candidateHash = keyedHash('otp', `${emailHash}:${sessionHash}:${otp}`);
    if (!constantTimeEqual(candidateHash, challenge.otpHash)) {
      const updated = await models.Challenge.findOneAndUpdate(
        {
          _id: challenge._id,
          sessionHash,
          consumedAt: null,
          expiresAt: { $gt: now },
          attempts: { $lt: REGISTRATION_OTP_MAX_ATTEMPTS }
        },
        { $inc: { attempts: 1 } },
        { new: true }
      );
      if (!updated || updated.attempts >= REGISTRATION_OTP_MAX_ATTEMPTS) {
        await models.Challenge.updateOne(
          { _id: challenge._id, attempts: { $gte: REGISTRATION_OTP_MAX_ATTEMPTS } },
          { $set: { otpHash: null, expiresAt: now } }
        );
        throw serviceError(429, 'Too many attempts. Please request a new code.');
      }
      throw serviceError(400, 'Incorrect verification code. Please try again.');
    }

    const consumed = await models.Challenge.findOneAndUpdate(
      {
        _id: challenge._id,
        sessionHash,
        otpHash: candidateHash,
        consumedAt: null,
        attempts: { $lt: REGISTRATION_OTP_MAX_ATTEMPTS },
        expiresAt: { $gt: now }
      },
      { $set: { verifiedAt: now, consumedAt: now, otpHash: null } },
      { new: true }
    );
    if (!consumed) throw serviceError(400, 'Invalid or expired verification code. Please request a new one.');
    return { verifiedAt: now };
  }

  return { issue, resend, consume };
}

const registrationOtpService = createRegistrationOtpService();
export const issueRegistrationOtp = registrationOtpService.issue;
export const resendRegistrationOtp = registrationOtpService.resend;
export const consumeRegistrationOtp = registrationOtpService.consume;
