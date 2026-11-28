import { issueRegistrationOtp, resendRegistrationOtp } from '../services/registration-otp.service.js';

const COOKIE_NAME = 'vertex_registration_session';
const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000;

function cookieSameSite() {
  const configured = String(process.env.REGISTRATION_COOKIE_SAME_SITE || '').toLowerCase();
  if (['strict', 'lax', 'none'].includes(configured)) return configured;
  return process.env.NODE_ENV === 'production' ? 'none' : 'lax';
}

export function readRegistrationSession(cookieHeader = '') {
  for (const part of String(cookieHeader).split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0 || part.slice(0, separator).trim() !== COOKIE_NAME) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

export function setRegistrationSessionCookie(res, sessionToken) {
  const sameSite = cookieSameSite();
  res.cookie(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || sameSite === 'none',
    sameSite,
    path: '/api/auth',
    maxAge: COOKIE_MAX_AGE
  });
}

export function clearRegistrationSessionCookie(res) {
  const sameSite = cookieSameSite();
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || sameSite === 'none',
    sameSite,
    path: '/api/auth'
  });
}

export async function startRegistrationOtp(req, res, next) {
  try {
    const result = await issueRegistrationOtp({
      email: req.body.email,
      sessionToken: readRegistrationSession(req.headers.cookie)
    });
    if (!result.verificationRequired) {
      clearRegistrationSessionCookie(res);
      return res.json({
        verificationRequired: false,
        message: 'Email verification is disabled for this environment.'
      });
    }
    setRegistrationSessionCookie(res, result.sessionToken);
    return res.status(202).json({
      verificationRequired: true,
      message: 'If this email address can be registered, a verification code has been sent.',
      expiresAt: result.expiresAt,
      resendAvailableAt: result.resendAvailableAt
    });
  } catch (error) {
    return next(error);
  }
}

export async function resendRegistrationOtpController(req, res, next) {
  try {
    const result = await resendRegistrationOtp({
      email: req.body.email,
      sessionToken: readRegistrationSession(req.headers.cookie)
    });
    if (!result.verificationRequired) {
      clearRegistrationSessionCookie(res);
      return res.json({
        verificationRequired: false,
        message: 'Email verification is disabled for this environment.'
      });
    }
    return res.status(202).json({
      verificationRequired: true,
      message: 'If this email address has an active verification request, a new code has been sent.',
      expiresAt: result.expiresAt,
      resendAvailableAt: result.resendAvailableAt
    });
  } catch (error) {
    return next(error);
  }
}
