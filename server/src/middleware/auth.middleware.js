import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
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

    const table = req.user.role === 'company' ? 'companies' : 'users';
    const { rows } = await query(
      `select account_status, suspension_until, token_version, restriction_data
       from ${table}
       where id = $1`,
      [req.user.id]
    );
    const account = rows[0];

    if (!account) {
      return res.status(401).json({ message: 'Account no longer exists' });
    }

    if (Number(account.token_version || 0) !== Number(req.user.tokenVersion || 0)) {
      return res.status(401).json({ message: 'Session expired. Please sign in again.' });
    }

    if (account.account_status === 'BLOCKED') {
      return res.status(403).json({ message: 'This account is blocked.' });
    }

    if (account.account_status === 'SUSPENDED') {
      const suspensionUntil = account.suspension_until ? new Date(account.suspension_until) : null;
      if (!suspensionUntil || suspensionUntil > new Date()) {
        return res.status(403).json({ message: 'This account is suspended.' });
      }
    }

    req.accountControls = {
      status: account.account_status,
      restrictions: account.restriction_data || {}
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

    const table = req.user.role === 'company' ? 'companies' : 'users';
    const { rows } = await query(
      `select privacy_policy_accepted, terms_accepted, age_confirmed, privacy_policy_version, terms_version
       from ${table}
       where id = $1`,
      [req.user.id]
    );

    if (!hasLatestLegalConsent(rows[0])) {
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
