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
