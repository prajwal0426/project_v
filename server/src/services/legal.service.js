export const LEGAL_VERSIONS = {
  privacyPolicy: process.env.LEGAL_PRIVACY_POLICY_VERSION || '1.0',
  terms: process.env.LEGAL_TERMS_VERSION || '1.0'
};

export function legalRequirements(account) {
  return {
    privacyPolicyVersion: LEGAL_VERSIONS.privacyPolicy,
    termsVersion: LEGAL_VERSIONS.terms,
    ageConfirmationRequired: !account?.ageConfirmed
  };
}

export function acceptedLegal(body) {
  return {
    privacyPolicyAccepted: body.privacyPolicyAccepted === true || body.privacyPolicyAccepted === 'true',
    termsAccepted: body.termsAccepted === true || body.termsAccepted === 'true',
    ageConfirmed: body.ageConfirmed === true || body.ageConfirmed === 'true',
    privacyPolicyVersion: body.privacyPolicyVersion || '',
    termsVersion: body.termsVersion || ''
  };
}

export function validateLegalAcceptance(body) {
  const consent = acceptedLegal(body);
  const missing = [];

  if (!consent.privacyPolicyAccepted) missing.push('Privacy Policy must be accepted');
  if (!consent.termsAccepted) missing.push('Terms & Conditions must be accepted');
  if (!consent.ageConfirmed) missing.push('Age confirmation is required');
  if (consent.privacyPolicyVersion !== LEGAL_VERSIONS.privacyPolicy) missing.push('Latest Privacy Policy version must be accepted');
  if (consent.termsVersion !== LEGAL_VERSIONS.terms) missing.push('Latest Terms & Conditions version must be accepted');

  if (missing.length) {
    const error = new Error(missing.join('. '));
    error.status = 422;
    throw error;
  }

  return consent;
}

export function validatePolicyAcceptance(body, { requireAge = false } = {}) {
  const privacyPolicyAccepted = body.privacyPolicyAccepted === true || body.privacyPolicyAccepted === 'true';
  const termsAccepted = body.termsAccepted === true || body.termsAccepted === 'true';
  const ageConfirmed = body.ageConfirmed === true || body.ageConfirmed === 'true';
  const missing = [];

  if (!privacyPolicyAccepted) missing.push('Please accept the Privacy Policy.');
  if (!termsAccepted) missing.push('Please accept the Terms & Conditions.');
  if (requireAge && !ageConfirmed) missing.push('Please confirm that you are 18 years of age or older.');

  if (missing.length) {
    const error = new Error(missing.join(' '));
    error.status = 422;
    throw error;
  }

  return { privacyPolicyAccepted, termsAccepted, ageConfirmed };
}

export function hasLatestLegalConsent(account) {
  return Boolean(
    account?.privacyPolicyAccepted &&
    account?.termsAccepted &&
    account?.ageConfirmed &&
    account?.privacyPolicyVersion === LEGAL_VERSIONS.privacyPolicy &&
    account?.termsVersion === LEGAL_VERSIONS.terms
  );
}
