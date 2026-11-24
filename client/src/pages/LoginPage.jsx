import { Apple, ArrowRight, Eye, EyeOff, FileText, Home, Info, LockKeyhole, Mail, Moon, Rocket, ShieldCheck, Sun, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import LegalDocumentModal from '../components/LegalDocumentModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { API_BASE_URL, authApi } from '../services/api.js';
import { LEGAL_VERSIONS } from '../services/legal.js';
import Logo from '../components/Logo.jsx';
import Vertex3DEmblem from '../components/Vertex3DEmblem.jsx';
import VertexEnergyPlatform from '../components/VertexEnergyPlatform.jsx';
import CinematicScene from '../components/CinematicScene.jsx';
import PublicNavigation from '../components/PublicNavigation.jsx';

function landingFor(role) {
  return role === 'company' ? 'company' : 'dashboard';
}

export default function LoginPage({ bright, setBright, authMode = null, onAuthenticated, onAuthNavigate }) {
  const { login, loginWithGoogle, register, authError, authLoading } = useAuth();
  const [role, setRole] = useState('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [legalDocument, setLegalDocument] = useState(null);
  const [validationMessages, setValidationMessages] = useState([]);
  const [legalVersions, setLegalVersions] = useState(LEGAL_VERSIONS);
  const [legalVersionsReady, setLegalVersionsReady] = useState(false);
  const legalReturnFocusRef = useRef(null);
  const isRegister = authMode === 'register';
  const isAuthPage = authMode === 'login' || isRegister;
  const legalAccepted = privacyAccepted && termsAccepted && ageConfirmed;

  useEffect(() => {
    let active = true;
    authApi.legalRequirements()
      .then((requirements) => {
        if (!active) return;
        setLegalVersions({
          privacyPolicy: requirements?.privacyPolicyVersion || LEGAL_VERSIONS.privacyPolicy,
          terms: requirements?.termsVersion || LEGAL_VERSIONS.terms
        });
      })
      .catch(() => {})
      .finally(() => { if (active) setLegalVersionsReady(true); });
    return () => { active = false; };
  }, []);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const legalConsent = isRegister ? {
          privacyPolicyAccepted: privacyAccepted,
          termsAccepted,
          ageConfirmed,
          privacyPolicyVersion: legalVersions.privacyPolicy,
          termsVersion: legalVersions.terms
        } : {};
        const user = await loginWithGoogle(tokenResponse, legalConsent);
        onAuthenticated?.(landingFor(user?.role || 'user'));
      } catch (error) {
        console.error('Google login failed:', error);
      }
    },
    onError: () => console.error('Google Login Failed')
  });

  function openLegalDocument(event, documentType) {
    event.preventDefault();
    legalReturnFocusRef.current = event.currentTarget;
    setLegalDocument(documentType);
  }

  function redirectToOAuth(event, provider) {
    event.stopPropagation();
    window.location.href = `${API_BASE_URL}/auth/${provider}`;
  }

  function switchMode(nextMode) {
    setValidationMessages([]);
    onAuthNavigate?.(nextMode);
  }

  function updateParallax(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    event.currentTarget.style.setProperty('--pointer-x', x.toFixed(3));
    event.currentTarget.style.setProperty('--pointer-y', y.toFixed(3));
  }

  function resetParallax(event) {
    event.currentTarget.style.setProperty('--pointer-x', '0');
    event.currentTarget.style.setProperty('--pointer-y', '0');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const missing = [];

    if (isRegister && password !== confirmPassword) {
      missing.push('Passwords do not match.');
    }
    if (isRegister && !privacyAccepted) missing.push('Please accept the Privacy Policy.');
    if (isRegister && !termsAccepted) missing.push('Please accept the Terms & Conditions.');
    if (isRegister && !ageConfirmed) missing.push('Please confirm that you are 18 years of age or older.');

    if (missing.length) {
      setValidationMessages(missing);
      return;
    }

    setValidationMessages([]);

    try {
      const action = isRegister ? register : login;
      const user = await action({
        role,
        name,
        email,
        password,
        dateOfBirth,
        privacyPolicyAccepted: privacyAccepted,
        termsAccepted,
        ageConfirmed,
        privacyPolicyVersion: legalVersions.privacyPolicy,
        termsVersion: legalVersions.terms
      });
      onAuthenticated?.(landingFor(user?.role || role));
    } catch {
      // AuthContext displays the backend error inside the form.
    }
  }

  return (
    <section className={isAuthPage ? 'auth-shell vertex-auth-shell' : 'auth-shell homepage'}>
      <PublicNavigation
        activePage={isAuthPage ? (isRegister ? 'register' : 'login') : 'home'}
        setPage={onAuthNavigate}
      />

      <button className="auth-theme icon-button" type="button" onClick={() => setBright((value) => !value)} aria-label="Toggle theme">
        {bright ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      {isAuthPage ? (
        <main className="vertex-auth-stage" onPointerMove={updateParallax} onPointerLeave={resetParallax}>
          <CinematicScene />
          <section className="vertex-auth-brand" aria-label="VERTEX branding">
            <Logo variant="auth" showText={false} className="vertex-auth-logo" />
            <p>PERFORMANCE. PRECISION. POWER.</p>
          </section>

          <section className="vertex-auth-panel" aria-labelledby="vertex-auth-title">
            <div className="vertex-auth-heading">
              <p>{isRegister ? 'CREATE YOUR ACCOUNT' : 'WELCOME BACK'}</p>
              <h1 id="vertex-auth-title">{isRegister ? 'Create your VERTEX account to get started' : 'Sign in to continue to your account'}</h1>
            </div>

            <form className="vertex-auth-form" onSubmit={handleSubmit}>
              {isRegister ? (
                <>
                  <div className="account-type-control" role="group" aria-label="Account type">
                    <button className={role === 'user' ? 'active' : ''} type="button" onClick={() => setRole('user')}>User</button>
                    <button className={role === 'company' ? 'active' : ''} type="button" onClick={() => setRole('company')}>Company</button>
                  </div>
                  <label>
                    NAME
                    <span className="vertex-input"><UserRound size={18} /><input value={name} onChange={(event) => setName(event.target.value)} type="text" autoComplete="name" required /></span>
                  </label>
                </>
              ) : null}

              <label>
                EMAIL OR USERNAME
                <span className="vertex-input"><Mail size={18} /><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required /></span>
              </label>

              <label>
                PASSWORD
                <span className="vertex-input"><LockKeyhole size={18} /><input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={8} required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></span>
              </label>

              {isRegister ? (
                <label>
                  CONFIRM PASSWORD
                  <span className="vertex-input"><LockKeyhole size={18} /><input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} required /><button type="button" onClick={() => setShowConfirmPassword((value) => !value)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>{showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></span>
                </label>
              ) : null}

              {isRegister && role === 'user' ? <label>DATE OF BIRTH<input className="vertex-plain-input" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} type="date" required /></label> : null}

              {!isRegister ? <button className="forgot-password" type="button" onClick={() => setValidationMessages(['Password recovery is not available yet.'])}>Forgot Password?</button> : null}

              {isRegister ? (
                <div className="vertex-consent">
                  <label><input checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)} type="checkbox" required />I agree to the <button type="button" onClick={(event) => openLegalDocument(event, 'privacy')}>Privacy Policy</button>.</label>
                  <label><input checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} type="checkbox" required />I agree to the <button type="button" onClick={(event) => openLegalDocument(event, 'terms')}>Terms &amp; Conditions</button>.</label>
                  <label><input checked={ageConfirmed} onChange={(event) => setAgeConfirmed(event.target.checked)} type="checkbox" required />I confirm that I am 18 years of age or older.</label>
                </div>
              ) : null}

              {validationMessages.length ? <div className="form-error">{validationMessages.map((message) => <p key={message}>{message}</p>)}</div> : null}
              {authError ? <p className="form-error">{authError}</p> : null}

              <button className="vertex-auth-submit" type="submit" disabled={authLoading || (isRegister && (!legalAccepted || !legalVersionsReady))}>
                {authLoading ? 'PLEASE WAIT...' : isRegister ? 'CREATE ACCOUNT' : 'LOGIN'}
              </button>
            </form>

            {(!isRegister || (role === 'user' && legalAccepted)) ? <><div className="vertex-divider"><span>OR</span></div><button className="vertex-google" type="button" onClick={() => googleLogin()}><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" />Continue with Google</button></> : null}

            <p className="vertex-mode-switch">{isRegister ? 'Already have an account?' : "Don't have an account?"} <button type="button" onClick={() => switchMode(isRegister ? 'login' : 'register')}>{isRegister ? 'Sign In' : 'Sign Up'}</button></p>

            {!isRegister ? <div className="vertex-provider-links"><button type="button" onClick={(event) => redirectToOAuth(event, 'microsoft')}>Continue with Microsoft</button><button type="button" onClick={(event) => redirectToOAuth(event, 'apple')}><Apple size={14} />Continue with Apple</button></div> : null}
          </section>
        </main>
      ) : (
        <main className="auth-landing cinematic-home" onPointerMove={updateParallax} onPointerLeave={resetParallax}>
          <CinematicScene />
          <div className="home-hero-content">
            <div className="home-kicker-wrapper">
              <span className="kicker-line kicker-line-left" aria-hidden="true" />
              <p className="home-kicker">LEARN · BUILD · EARN</p>
              <span className="kicker-line kicker-line-right" aria-hidden="true" />
            </div>

            <div className="home-hero-title-group">
              <h1 className="home-welcome-lead">HI THERE, WELCOME TO</h1>
              <h2 className="home-welcome-brand">VERTEX</h2>
            </div>

            <div className="home-logo-stage">
              <Vertex3DEmblem />
              <div className="vertex-wordmark-container" aria-label="VERTEX">
                <img
                  src="/vertex-wordmark-original.png"
                  alt="VERTEX"
                  className="vertex-wordmark-img"
                  draggable="false"
                />
              </div>
              <VertexEnergyPlatform />
            </div>

            <button
              className="vertex-action home-cta"
              type="button"
              onClick={() => onAuthNavigate?.('about')}
              onPointerMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                e.currentTarget.style.setProperty('--btn-light-x', `${x.toFixed(1)}%`);
                e.currentTarget.style.setProperty('--btn-light-y', `${y.toFixed(1)}%`);
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.setProperty('--btn-light-x', '50%');
                e.currentTarget.style.setProperty('--btn-light-y', '50%');
              }}
            >
              <Rocket size={18} aria-hidden="true" />
              <span>EXPLORE VERTEX</span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        </main>
      )}

      <footer className="auth-legal-footer">
        <button type="button" onClick={(event) => openLegalDocument(event, 'privacy')} className="footer-legal-link">
          <ShieldCheck size={14} aria-hidden="true" />
          <span>Privacy Policy</span>
        </button>
        <span className="footer-legal-divider" aria-hidden="true">|</span>
        <button type="button" onClick={(event) => openLegalDocument(event, 'terms')} className="footer-legal-link">
          <FileText size={14} aria-hidden="true" />
          <span>Terms &amp; Conditions</span>
        </button>
      </footer>
      <LegalDocumentModal documentType={legalDocument} onClose={() => setLegalDocument(null)} returnFocusRef={legalReturnFocusRef}
        version={legalDocument === 'privacy' ? legalVersions.privacyPolicy : legalVersions.terms} />
    </section>
  );
}
