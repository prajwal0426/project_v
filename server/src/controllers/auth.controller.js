import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { Company, User, Wallet } from '../models/index.js';
import { hasLatestLegalConsent, legalRequirements, LEGAL_VERSIONS, validateLegalAcceptance, validatePolicyAcceptance } from '../services/legal.service.js';
import { signToken } from '../services/token.service.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function assertAdult(dateOfBirth) {
  const ageMs = Date.now() - new Date(dateOfBirth).getTime();
  const age = new Date(ageMs).getUTCFullYear() - 1970;
  if (age < 18) {
    const error = new Error('VERTEX requires users to be 18 or older');
    error.status = 403;
    throw error;
  }
}

function assertAccountCanAuthenticate(account) {
  if (account.accountStatus === 'BLOCKED') {
    const error = new Error('This account is blocked. Contact VERTEX support.');
    error.status = 403;
    throw error;
  }
  if (account.accountStatus === 'SUSPENDED') {
    const suspensionUntil = account.suspensionUntil ? new Date(account.suspensionUntil) : null;
    if (!suspensionUntil || suspensionUntil > new Date()) {
      const error = new Error('This account is suspended. Contact VERTEX support.');
      error.status = 403;
      throw error;
    }
  }
}

async function createAccount({ Model, role, body, idFilePath }) {
  const legalConsent = validateLegalAcceptance(body);

  if (role === 'user') assertAdult(body.dateOfBirth);

  const passwordHash = await bcrypt.hash(body.password, 12);

  const fields = {
    name: body.name,
    email: body.email.toLowerCase(),
    passwordHash,
    privacyPolicyAccepted: legalConsent.privacyPolicyAccepted,
    termsAccepted: legalConsent.termsAccepted,
    ageConfirmed: legalConsent.ageConfirmed,
    legalAcceptedAt: new Date(),
    privacyPolicyVersion: LEGAL_VERSIONS.privacyPolicy,
    termsVersion: LEGAL_VERSIONS.terms
  };

  if (role === 'user') {
    fields.dateOfBirth = body.dateOfBirth;
    fields.governmentIdFile = idFilePath;
  } else {
    fields.verificationFile = idFilePath;
  }

  const account = await Model.create(fields);
  const owner = role === 'company' ? { companyId: account._id } : { userId: account._id };
  await Wallet.updateOne(owner, { $setOnInsert: owner }, { upsert: true, setDefaultsOnInsert: true });
  return {
    account: { id: account._id, name: account.name, email: account.email },
    token: signToken({ id: account._id, role, email: account.email })
  };
}

async function loginAccount({ Model, role, email, password }) {
  const account = await Model.findOne({ email: email?.toLowerCase() }).select('+passwordHash');

  if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  assertAccountCanAuthenticate(account);

  await Model.findByIdAndUpdate(account._id, { lastLoginAt: new Date() });
  const consentRequired = !hasLatestLegalConsent(account);

  return {
    account: {
      id: account._id, name: account.name, email: account.email,
      accountStatus: account.accountStatus || 'ACTIVE', consentRequired,
      legalRequirements: consentRequired ? legalRequirements(account) : undefined
    },
    token: signToken({ id: account._id, role, email: account.email, tokenVersion: account.tokenVersion || 0 })
  };
}

export function getLegalRequirements(_req, res) {
  return res.json({
    privacyPolicyVersion: LEGAL_VERSIONS.privacyPolicy,
    termsVersion: LEGAL_VERSIONS.terms
  });
}

export async function getAuthSession(req, res, next) {
  try {
    if (req.user.role === 'admin') {
      return res.json({ account: { id: req.user.id, name: 'VERTEX Admin', username: req.user.username, role: 'admin' } });
    }

    if (req.user.role === 'google-pending') {
      return res.json({
        account: {
          id: null, name: req.user.name, email: req.user.email, role: 'user',
          consentRequired: true,
          legalRequirements: { ...legalRequirements(null), ageConfirmationRequired: true }
        }
      });
    }

    if (!['user', 'company'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Invalid session role' });
    }

    const Model = req.user.role === 'company' ? Company : User;
    const account = await Model.findById(req.user.id).select('+googleSubject');
    if (!account) return res.status(401).json({ message: 'Account no longer exists' });
    if (Number(account.tokenVersion || 0) !== Number(req.user.tokenVersion || 0)) {
      return res.status(401).json({ message: 'Session expired. Please sign in again.' });
    }

    assertAccountCanAuthenticate(account);
    const consentRequired = !hasLatestLegalConsent(account);
    return res.json({
      account: {
        id: account._id, name: account.name, email: account.email,
        role: req.user.role, accountStatus: account.accountStatus || 'ACTIVE', consentRequired,
        legalRequirements: consentRequired ? legalRequirements(account) : undefined
      }
    });
  } catch (error) {
    return next(error);
  }
}

function timingSafeEqualText(left = '', right = '') {
  const l = Buffer.from(String(left));
  const r = Buffer.from(String(right));
  if (l.length !== r.length) return false;
  return crypto.timingSafeEqual(l, r);
}

export async function registerUser(req, res, next) {
  try {
    res.status(201).json(await createAccount({ Model: User, role: 'user', body: req.body, idFilePath: req.file?.path }));
  } catch (error) { next(error); }
}

export async function loginUser(req, res, next) {
  try {
    res.json(await loginAccount({ Model: User, role: 'user', ...req.body }));
  } catch (error) { next(error); }
}

export async function registerCompany(req, res, next) {
  try {
    res.status(201).json(await createAccount({ Model: Company, role: 'company', body: req.body, idFilePath: req.file?.path }));
  } catch (error) { next(error); }
}

export async function loginCompany(req, res, next) {
  try {
    res.json(await loginAccount({ Model: Company, role: 'company', ...req.body }));
  } catch (error) { next(error); }
}

export async function loginAdmin(req, res) {
  try {
    const configuredUsername = process.env.ADMIN_USERNAME;
    const configuredPassword = process.env.ADMIN_PASSWORD;
    const { username = '', password = '' } = req.body;

    if (!configuredUsername || !configuredPassword) {
      return res.status(500).json({ message: 'Admin login is not configured' });
    }

    const usernameMatches = timingSafeEqualText(String(username).trim(), configuredUsername);
    const passwordMatches = timingSafeEqualText(password, configuredPassword);

    if (!usernameMatches || !passwordMatches) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    return res.json({
      account: { id: 'env-admin', name: 'VERTEX Admin', username: configuredUsername },
      token: signToken({ id: 'env-admin', role: 'admin', username: configuredUsername })
    });
  } catch {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }
}

export async function logoutAdmin(_req, res) {
  res.json({ message: 'Admin logged out' });
}

export async function appleLogin(_req, res) {
  res.json({
    message: 'Apple login must verify an Apple identity token server-side before issuing a VERTEX session.'
  });
}

export async function googleLogin(req, res, next) {
  try {
    const { credential, access_token } = req.body;

    if (!credential && !access_token) {
      return res.status(400).json({ message: 'Google credential or access token is required' });
    }

    let email, name, googleSubject;

    if (credential) {
      const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      googleSubject = payload.sub;
      if (!payload.email_verified) return res.status(400).json({ message: 'Google account email must be verified' });
    } else {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      if (!response.ok) return res.status(400).json({ message: 'Failed to verify Google access token' });
      const payload = await response.json();
      email = payload.email;
      name = payload.name;
      googleSubject = payload.sub;
      if (!payload.email_verified) return res.status(400).json({ message: 'Google account email must be verified' });
    }

    if (!email || !name || !googleSubject) {
      return res.status(400).json({ message: 'Google identity response is incomplete' });
    }

    let user = await User.findOne({ $or: [{ googleSubject }, { email: email.toLowerCase() }] }).select('+googleSubject');

    if (!user) {
      const hasExplicitConsent = req.body.privacyPolicyAccepted === true || req.body.privacyPolicyAccepted === 'true';
      const hasExplicitTerms = req.body.termsAccepted === true || req.body.termsAccepted === 'true';
      const hasExplicitAge = req.body.ageConfirmed === true || req.body.ageConfirmed === 'true';
      if (hasExplicitConsent && hasExplicitTerms && hasExplicitAge) {
        const legalConsent = validateLegalAcceptance(req.body);
        user = await User.create({
          name, email: email.toLowerCase(), googleSubject,
          privacyPolicyAccepted: legalConsent.privacyPolicyAccepted,
          termsAccepted: legalConsent.termsAccepted,
          ageConfirmed: legalConsent.ageConfirmed,
          legalAcceptedAt: new Date(),
          privacyPolicyVersion: LEGAL_VERSIONS.privacyPolicy,
          termsVersion: LEGAL_VERSIONS.terms
        });
        await Wallet.updateOne({ userId: user._id }, { $setOnInsert: { userId: user._id } }, { upsert: true, setDefaultsOnInsert: true });
      } else {
        const token = signToken(
          { role: 'google-pending', googleSubject, email: email.toLowerCase(), name },
          { expiresIn: '15m' }
        );
        return res.json({
          token,
          account: { id: null, name, email: email.toLowerCase(), consentRequired: true, legalRequirements: { ...legalRequirements(null), ageConfirmationRequired: true } }
        });
      }
    } else if (!user.googleSubject || user.googleSubject !== googleSubject) {
      return res.status(401).json({ message: 'Google account does not match this VERTEX account' });
    }

    assertAccountCanAuthenticate(user);
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    const consentRequired = !hasLatestLegalConsent(user);
    const token = signToken({ id: user._id, role: 'user', email: user.email, tokenVersion: user.tokenVersion || 0 });
    res.json({ token, account: {
      id: user._id, name: user.name, email: user.email, consentRequired,
      legalRequirements: consentRequired ? legalRequirements(user) : undefined
    } });
  } catch (err) {
    next(err);
  }
}

export async function acceptLatestLegal(req, res, next) {
  try {
    const consent = validatePolicyAcceptance(req.body, {
      requireAge: req.user?.role === 'google-pending'
    });

    if (req.user?.role === 'google-pending') {
      if (!req.user.googleSubject || !req.user.email || !req.user.name) {
        return res.status(401).json({ message: 'Google consent session is invalid or expired' });
      }
      const user = await User.create({
        name: req.user.name,
        email: req.user.email,
        googleSubject: req.user.googleSubject,
        privacyPolicyAccepted: true,
        termsAccepted: true,
        ageConfirmed: consent.ageConfirmed,
        legalAcceptedAt: new Date(),
        privacyPolicyVersion: LEGAL_VERSIONS.privacyPolicy,
        termsVersion: LEGAL_VERSIONS.terms
      });
      await Wallet.updateOne({ userId: user._id }, { $setOnInsert: { userId: user._id } }, { upsert: true, setDefaultsOnInsert: true });
      return res.status(201).json({
        account: { id: user._id, name: user.name, email: user.email, role: 'user', consentRequired: false },
        token: signToken({ id: user._id, role: 'user', email: user.email, tokenVersion: user.tokenVersion || 0 })
      });
    }

    if (!['user', 'company'].includes(req.user?.role)) {
      return res.status(403).json({ message: 'Legal consent update is available for user and company accounts only' });
    }

    const Model = req.user.role === 'company' ? Company : User;
    const existing = await Model.findById(req.user.id);
    if (!existing) return res.status(401).json({ message: 'Account no longer exists' });
    assertAccountCanAuthenticate(existing);
    if (Number(existing.tokenVersion || 0) !== Number(req.user.tokenVersion || 0)) {
      return res.status(401).json({ message: 'Session expired. Please sign in again.' });
    }
    if (!existing.ageConfirmed && !consent.ageConfirmed) {
      return res.status(422).json({ message: 'Please confirm that you are 18 years of age or older.' });
    }

    existing.privacyPolicyAccepted = true;
    existing.termsAccepted = true;
    existing.ageConfirmed = existing.ageConfirmed || consent.ageConfirmed;
    existing.legalAcceptedAt = new Date();
    existing.privacyPolicyVersion = LEGAL_VERSIONS.privacyPolicy;
    existing.termsVersion = LEGAL_VERSIONS.terms;
    await existing.save();

    return res.json({
      account: { id: existing._id, name: existing.name, email: existing.email, role: req.user.role, consentRequired: false },
      token: signToken({ id: existing._id, role: req.user.role, email: existing.email, tokenVersion: existing.tokenVersion || 0 })
    });
  } catch (error) {
    return next(error);
  }
}
