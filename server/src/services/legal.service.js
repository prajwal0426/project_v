export const LEGAL_VERSIONS = {
  privacyPolicy: '1.0',
  terms: '1.0'
};

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

export function hasLatestLegalConsent(account) {
  return Boolean(
    account?.privacy_policy_accepted &&
    account?.terms_accepted &&
    account?.age_confirmed &&
    account?.privacy_policy_version === LEGAL_VERSIONS.privacyPolicy &&
    account?.terms_version === LEGAL_VERSIONS.terms
  );
}
