import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import LegalDocumentModal from '../components/LegalDocumentModal.jsx';
import { LEGAL_VERSIONS } from '../services/legal.js';

export default function LegalConsentPage({ onAccepted }) {
  const { user, acceptLatestLegal, authError, authLoading, logout } = useAuth();
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [legalDocument, setLegalDocument] = useState(null);
  const returnFocusRef = useRef(null);
  const requirements = user?.legalRequirements || {};
  const privacyVersion = requirements.privacyPolicyVersion || LEGAL_VERSIONS.privacyPolicy;
  const termsVersion = requirements.termsVersion || LEGAL_VERSIONS.terms;
  const needsAgeConfirmation = Boolean(requirements.ageConfirmationRequired);

  async function submit(event) {
    event.preventDefault();
    try {
      await acceptLatestLegal({
        privacyPolicyAccepted: true,
        termsAccepted: true,
        ...(needsAgeConfirmation ? { ageConfirmed: ageConfirmed } : {})
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

  const canSubmit = privacyAccepted && termsAccepted && (!needsAgeConfirmation || ageConfirmed);

  return (
    <main className="app legal-consent-page">
      <section className="legal-consent-panel glass" aria-labelledby="legal-consent-title">
        <p className="eyebrow">VERTEX ACCOUNT</p>
        <h1 id="legal-consent-title">Review updated agreements</h1>
        <p className="legal-consent-copy">
          {user?.name ? `Hi ${user.name}, ` : ''}accept the current documents to continue to your VERTEX account.
        </p>
        <form onSubmit={submit}>
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
