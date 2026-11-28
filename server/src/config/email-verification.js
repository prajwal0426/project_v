export function isEmailVerificationEnabled() {
  const configured = process.env.EMAIL_VERIFICATION_ENABLED;
  if (typeof configured !== 'string' || configured.trim() === '') return true;
  return configured.trim().toLowerCase() !== 'false';
}

export function isRegistrationOtpValid(value) {
  return !isEmailVerificationEnabled() || /^\d{6}$/.test(String(value ?? ''));
}
