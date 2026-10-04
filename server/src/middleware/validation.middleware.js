import { validationResult } from 'express-validator';

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const fields = errors.array().map((error) => error.path || error.param);
    const consentFields = ['privacyPolicyAccepted', 'termsAccepted', 'ageConfirmed'];
    const message = consentFields.some((field) => fields.includes(field))
      ? 'Please review and accept the Privacy Policy and Terms & Conditions before creating your account.'
      : 'Please check the form and try again.';

    return res.status(422).json({ message, errors: errors.array() });
  }
  return next();
}
