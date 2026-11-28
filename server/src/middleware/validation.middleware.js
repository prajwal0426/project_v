import { validationResult } from 'express-validator';

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationErrors = errors.array();
    const fields = validationErrors.map((error) => error.path || error.param);
    const consentFields = ['privacyPolicyAccepted', 'termsAccepted', 'ageConfirmed'];
    const message = consentFields.some((field) => fields.includes(field))
      ? 'Please review and accept the Privacy Policy and Terms & Conditions before creating your account.'
      : 'Please check the form and try again.';

    const safeErrors = validationErrors.map((error) => {
      if (['password', 'otp', 'access_token', 'credential'].includes(error.path)) {
        const safeError = { ...error };
        delete safeError.value;
        return safeError;
      }
      return error;
    });
    return res.status(422).json({ message, errors: safeErrors });
  }
  return next();
}
