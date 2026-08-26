import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { Company, User } from '../models/index.js';
import { hasLatestLegalConsent, LEGAL_VERSIONS, validateLegalAcceptance } from '../services/legal.service.js';
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
  return {
    account: { id: account._id, name: account.name, email: account.email },
    token: signToken({ id: account._id, role, email: account.email })
  };
}

async function loginAccount({ Model, role, email, password }) {
  const account = await Model.findOne({ email: email?.toLowerCase() });

  if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  assertAccountCanAuthenticate(account);

  if ((role === 'user' || role === 'company') && !hasLatestLegalConsent(account)) {
    const error = new Error('Latest Privacy Policy, Terms & Conditions, and age confirmation must be accepted before accessing VERTEX');
    error.status = 403;
    throw error;
  }

  await Model.findByIdAndUpdate(account._id, { lastLoginAt: new Date() });

  return {
    account: { id: account._id, name: account.name, email: account.email, accountStatus: account.accountStatus || 'ACTIVE' },
    token: signToken({ id: account._id, role, email: account.email, tokenVersion: account.tokenVersion || 0 })
  };
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
    message: 'Apple login endpoint ready. Verify Apple identity token server-side before issuing JWT.',
    clientId: process.env.APPLE_CLIENT_ID
  });
}

export async function googleLogin(req, res, next) {
  try {
    const { credential, access_token } = req.body;

    if (!credential && !access_token) {
      return res.status(400).json({ message: 'Google credential or access token is required' });
    }

    let email, name;

    if (credential) {
      const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
    } else {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      if (!response.ok) return res.status(400).json({ message: 'Failed to verify Google access token' });
      const payload = await response.json();
      email = payload.email;
      name = payload.name;
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash: '',
        dateOfBirth: new Date('2000-01-01'),
        privacyPolicyAccepted: true,
        termsAccepted: true,
        ageConfirmed: true,
        legalAcceptedAt: new Date(),
        privacyPolicyVersion: LEGAL_VERSIONS.privacyPolicy,
        termsVersion: LEGAL_VERSIONS.terms
      });
    }

    assertAccountCanAuthenticate(user);
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    const token = signToken({ id: user._id, role: 'user', email: user.email, tokenVersion: user.tokenVersion || 0 });
    res.json({ token, account: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    next(err);
  }
}

export async function acceptLatestLegal(req, res, next) {
  try {
    if (!['user', 'company'].includes(req.user?.role)) {
      return res.status(403).json({ message: 'Legal consent update is available for user and company accounts only' });
    }

    const consent = validateLegalAcceptance(req.body);
    const Model = req.user.role === 'company' ? Company : User;

    const account = await Model.findByIdAndUpdate(
      req.user.id,
      {
        privacyPolicyAccepted: consent.privacyPolicyAccepted,
        termsAccepted: consent.termsAccepted,
        ageConfirmed: consent.ageConfirmed,
        legalAcceptedAt: new Date(),
        privacyPolicyVersion: LEGAL_VERSIONS.privacyPolicy,
        termsVersion: LEGAL_VERSIONS.terms
      },
      { new: true, select: 'name email privacyPolicyVersion termsVersion legalAcceptedAt' }
    );

    return res.json({ account });
  } catch (error) {
    return next(error);
  }
}
