import jwt from 'jsonwebtoken';
import { Company, User } from '../models/index.js';
import { hasLatestLegalConsent } from '../services/legal.service.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export async function requireActiveAccount(req, res, next) {
  try {
    if (!['user', 'company'].includes(req.user?.role)) {
      return next();
    }

    const Model = req.user.role === 'company' ? Company : User;
    const account = await Model.findById(req.user.id)
      .select('accountStatus suspensionUntil tokenVersion restrictionData')
      .lean();

    if (!account) {
      return res.status(401).json({ message: 'Account no longer exists' });
    }

    if (Number(account.tokenVersion || 0) !== Number(req.user.tokenVersion || 0)) {
      return res.status(401).json({ message: 'Session expired. Please sign in again.' });
    }

    if (account.accountStatus === 'BLOCKED') {
      return res.status(403).json({ message: 'This account is blocked.' });
    }

    if (account.accountStatus === 'SUSPENDED') {
      const suspensionUntil = account.suspensionUntil ? new Date(account.suspensionUntil) : null;
      if (!suspensionUntil || suspensionUntil > new Date()) {
        return res.status(403).json({ message: 'This account is suspended.' });
      }
    }

    req.accountControls = {
      status: account.accountStatus,
      restrictions: account.restrictionData || {}
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireNoRestriction(restrictionKey) {
  return (req, res, next) => {
    const restrictions = req.accountControls?.restrictions || {};
    if (restrictions[restrictionKey]) {
      return res.status(403).json({ message: 'This action is restricted for your account.' });
    }
    return next();
  };
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    return next();
  };
}

export async function requireLatestLegalConsent(req, res, next) {
  try {
    if (!['user', 'company'].includes(req.user?.role)) {
      return next();
    }

    const Model = req.user.role === 'company' ? Company : User;
    const account = await Model.findById(req.user.id)
      .select('privacyPolicyAccepted termsAccepted ageConfirmed privacyPolicyVersion termsVersion')
      .lean();

    if (!hasLatestLegalConsent(account)) {
      return res.status(403).json({
        code: 'LEGAL_CONSENT_REQUIRED',
        message: 'Please accept the latest Privacy Policy and Terms & Conditions before continuing.'
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
}
