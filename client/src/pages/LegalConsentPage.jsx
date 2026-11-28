import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import LegalDocumentModal from '../components/LegalDocumentModal.jsx';
import CinematicScene from '../components/CinematicScene.jsx';
import { authApi } from '../services/api.js';
import { LEGAL_VERSIONS } from '../services/legal.js';
import '../styles/registration-otp.css';

function formatOtpDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function LegalConsentPage({ onAccepted }) {
  const { user, acceptLatestLegal, authError, authLoading, logout } = useAuth();
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpNotice, setOtpNotice] = useState('A code was requested for your Google account email.');
  const [otpResendAt, setOtpResendAt] = useState(user?.emailVerificationResendAvailableAt || '');
  const [otpExpiresAt, setOtpExpiresAt] = useState(user?.emailVerificationExpiresAt || '');
  const [otpSeconds, setOtpSeconds] = useState({ expires: 0, resend: 0 });
  const [legalDocument, setLegalDocument] = useState(null);
  const returnFocusRef = useRef(null);
  const requirements = user?.legalRequirements || {};
  const privacyVersion = requirements.privacyPolicyVersion || LEGAL_VERSIONS.privacyPolicy;
  const termsVersion = requirements.termsVersion || LEGAL_VERSIONS.terms;
  const needsAgeConfirmation = Boolean(requirements.ageConfirmationRequired);
  const emailOtpRequired = Boolean(user?.emailVerificationRequired);

  useEffect(() => {
    if (!emailOtpRequired) return undefined;
    const updateCountdown = () => {
      const now = Date.now();
      setOtpSeconds({
        expires: Math.max(0, Math.ceil((new Date(otpExpiresAt).getTime() - now) / 1000)),
        resend: Math.max(0, Math.ceil((new Date(otpResendAt).getTime() - now) / 1000))
      });
    };
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [emailOtpRequired, otpExpiresAt, otpResendAt]);

  async function submit(event) {
    event.preventDefault();
    try {
      await acceptLatestLegal({
        privacyPolicyAccepted: true,
        termsAccepted: true,
        ...(needsAgeConfirmation ? { ageConfirmed } : {}),
        ...(emailOtpRequired ? { otp } : {})
      });
      onAccepted?.();
    } catch {
      // AuthContext keeps the server validation message visible in this form.
    }
  }

  function openDocument(event, type) {
    returnFocusRef.current = event.currentTarget;
    setLegalDocument(type);
  }

  async function resendOtp() {
    setOtpError('');
    try {
      const response = await authApi.resendRegistrationOtp({ email: user?.email });
      setOtpNotice(response?.message || 'If this email has an active verification request, a new code has been sent.');
      setOtpExpiresAt(response?.expiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString());
      setOtpResendAt(response?.resendAvailableAt || new Date(Date.now() + 60 * 1000).toISOString());
      setOtp('');
    } catch (error) {
      setOtpError(error.message || 'Unable to resend the verification code.');
    }
  }

  const canSubmit = privacyAccepted && termsAccepted && (!needsAgeConfirmation || ageConfirmed) && (!emailOtpRequired || otp.length === 6);

  return (
    <main className="app legal-consent-page">
      <CinematicScene className="app-cinematic-scene" />
      <section className="legal-consent-panel glass" aria-labelledby="legal-consent-title">
        <p className="eyebrow">VERTEX ACCOUNT</p>
        <h1 id="legal-consent-title">Review updated agreements</h1>
        <p className="legal-consent-copy">
          {user?.name ? `Hi ${user.name}, ` : ''}accept the current documents to continue to your VERTEX account.
        </p>
        <form onSubmit={submit}>
          {emailOtpRequired ? (
            <div className="registration-otp-step legal-registration-otp">
              <p className="registration-otp-message" role="status">{otpNotice} Enter the 6-digit code for <strong>{user?.email}</strong>.</p>
              <label className="registration-otp-label">
                EMAIL VERIFICATION CODE
                <span className="vertex-input registration-otp-field">
                  <input
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    aria-label="6-digit email verification code"
                    aria-describedby="google-otp-countdown"
                    required
                  />
                </span>
              </label>
              <p className="registration-otp-countdown" id="google-otp-countdown">Code expires in {formatOtpDuration(otpSeconds.expires)}.</p>
              <div className="registration-otp-actions">
                <button type="button" onClick={resendOtp} disabled={authLoading || otpSeconds.resend > 0}>
                  {otpSeconds.resend > 0 ? `Resend code in ${formatOtpDuration(otpSeconds.resend)}` : 'Resend code'}
                </button>
              </div>
              {otpError ? <p className="form-error" role="alert">{otpError}</p> : null}
            </div>
          ) : null}
          <div className="vertex-consent legal-consent-checks">
            <label>
              <input type="checkbox" checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)} />
              I have read and agree to the <button type="button" onClick={(event) => openDocument(event, 'privacy')}>Privacy Policy</button> (version {privacyVersion}).
            </label>
            <label>
              <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} />
              I have read and agree to the <button type="button" onClick={(event) => openDocument(event, 'terms')}>Terms &amp; Conditions</button> (version {termsVersion}).
            </label>
            {needsAgeConfirmation ? (
              <label>
                <input type="checkbox" checked={ageConfirmed} onChange={(event) => setAgeConfirmed(event.target.checked)} />
                I confirm that I am 18 years of age or older.
              </label>
            ) : null}
          </div>
          {authError ? <p className="form-error" role="alert">{authError}</p> : null}
          <button className="vertex-auth-submit" type="submit" disabled={!canSubmit || authLoading}>
            {authLoading ? 'SAVING...' : 'ACCEPT AND CONTINUE'}
          </button>
        </form>
        <button className="legal-consent-logout" type="button" onClick={logout}>Sign out</button>
      </section>
      <LegalDocumentModal
        documentType={legalDocument}
        onClose={() => setLegalDocument(null)}
        returnFocusRef={returnFocusRef}
        version={legalDocument === 'privacy' ? privacyVersion : termsVersion}
      />
    </main>
  );
}
