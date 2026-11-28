import {
  Apple,
  ArrowRight,
  BarChart3,
  ChevronRight,
  Code2,
  Coins,
  Eye,
  EyeOff,
  FileText,
  Github,
  HelpCircle,
  Linkedin,
  LockKeyhole,
  Mail,
  Moon,
  PlayCircle,
  Rocket,
  ShieldCheck,
  Sun,
  UserRound,
  Users,
  Youtube
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import LegalDocumentModal from '../components/LegalDocumentModal.jsx';
import HowItWorksModal from '../components/HowItWorksModal.jsx';
import SupportModal from '../components/SupportModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { API_BASE_URL, authApi } from '../services/api.js';
import { LEGAL_VERSIONS } from '../services/legal.js';
import Logo from '../components/Logo.jsx';
import Vertex3DEmblem from '../components/Vertex3DEmblem.jsx';
import VertexEnergyPlatform from '../components/VertexEnergyPlatform.jsx';
import CinematicScene from '../components/CinematicScene.jsx';
import PublicNavigation from '../components/PublicNavigation.jsx';
import '../styles/registration-otp.css';

function formatOtpDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function DiscordIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

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
  const [emailVerificationRequired, setEmailVerificationRequired] = useState(true);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState('');
  const [otpResendAvailableAt, setOtpResendAvailableAt] = useState('');
  const [otpSeconds, setOtpSeconds] = useState({ expires: 0, resend: 0 });
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const legalReturnFocusRef = useRef(null);
  const isRegister = authMode === 'register';
  const isAuthPage = authMode === 'login' || isRegister;
  const legalAccepted = privacyAccepted && termsAccepted && ageConfirmed;

  useEffect(() => {
    if (!otpStep) return undefined;
    const updateCountdown = () => {
      const now = Date.now();
      setOtpSeconds({
        expires: Math.max(0, Math.ceil((new Date(otpExpiresAt).getTime() - now) / 1000)),
        resend: Math.max(0, Math.ceil((new Date(otpResendAvailableAt).getTime() - now) / 1000))
      });
    };
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [otpStep, otpExpiresAt, otpResendAvailableAt]);

  useEffect(() => {
    let active = true;
    authApi.legalRequirements()
      .then((requirements) => {
        if (!active) return;
        setLegalVersions({
          privacyPolicy: requirements?.privacyPolicyVersion || LEGAL_VERSIONS.privacyPolicy,
          terms: requirements?.termsVersion || LEGAL_VERSIONS.terms
        });
        setEmailVerificationRequired(requirements?.emailVerificationRequired !== false);
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
    setOtpError('');
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

  function updateGlow(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    e.currentTarget.style.setProperty('--card-glow-x', `${x.toFixed(1)}%`);
    e.currentTarget.style.setProperty('--card-glow-y', `${y.toFixed(1)}%`);
  }

  function resetGlow(e) {
    e.currentTarget.style.setProperty('--card-glow-x', '50%');
    e.currentTarget.style.setProperty('--card-glow-y', '50%');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setOtpError('');
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

    let currentVerificationRequired = emailVerificationRequired;
    let currentOtpStep = otpStep;
    let currentLegalVersions = legalVersions;

    if (isRegister) {
      try {
        const requirements = await authApi.legalRequirements();
        currentVerificationRequired = requirements?.emailVerificationRequired !== false;
        currentLegalVersions = {
          privacyPolicy: requirements?.privacyPolicyVersion || legalVersions.privacyPolicy,
          terms: requirements?.termsVersion || legalVersions.terms
        };
        setEmailVerificationRequired(currentVerificationRequired);
        setLegalVersions(currentLegalVersions);

        if (!currentVerificationRequired || currentVerificationRequired !== emailVerificationRequired) {
          currentOtpStep = false;
          setOtpStep(false);
          setOtp('');
          setOtpMessage('');
          setOtpError('');
        }
      } catch {
        setOtpError('Unable to check registration requirements. Please try again.');
        return;
      }
    }

    if (isRegister && currentVerificationRequired && !currentOtpStep) {
      setOtpLoading(true);
      try {
        const response = await authApi.startRegistrationOtp({ email });
        if (response?.verificationRequired !== false) {
          setOtp('');
          setOtpMessage(response?.message || 'A verification code has been sent.');
          setOtpExpiresAt(response.expiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString());
          setOtpResendAvailableAt(response.resendAvailableAt || new Date(Date.now() + 60 * 1000).toISOString());
          setOtpStep(true);
          return;
        }
        currentVerificationRequired = false;
        setEmailVerificationRequired(false);
      } catch (error) {
        setOtpError(error.message || 'Unable to request a verification code.');
        return;
      } finally {
        setOtpLoading(false);
      }
    }

    if (isRegister && currentVerificationRequired && currentOtpStep && otp.length !== 6) {
      setOtpError('Enter the 6-digit verification code.');
      return;
    }

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
        privacyPolicyVersion: currentLegalVersions.privacyPolicy,
        termsVersion: currentLegalVersions.terms,
        ...(currentVerificationRequired ? { otp } : {})
      });
      onAuthenticated?.(landingFor(user?.role || role));
    } catch {
      if (isRegister) setOtp('');
      // AuthContext displays the backend error inside the form.
    }
  }

  async function resendOtp() {
    setOtpError('');
    setOtpLoading(true);
    try {
      const response = await authApi.resendRegistrationOtp({ email });
      setOtpMessage(response?.message || 'If this email has an active verification request, a new code has been sent.');
      setOtpExpiresAt(response?.expiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString());
      setOtpResendAvailableAt(response?.resendAvailableAt || new Date(Date.now() + 60 * 1000).toISOString());
      setOtp('');
    } catch (error) {
      setOtpError(error.message || 'Unable to resend the verification code.');
    } finally {
      setOtpLoading(false);
    }
  }

  function changeRegistrationEmail() {
    setOtpStep(false);
    setOtp('');
    setOtpError('');
    setOtpMessage('');
  }

  return (
    <section
      className={isAuthPage ? 'auth-shell vertex-auth-shell' : 'auth-shell homepage'}
      onPointerMove={!isAuthPage ? updateParallax : undefined}
      onPointerLeave={!isAuthPage ? resetParallax : undefined}
    >
      {!isAuthPage ? <CinematicScene /> : null}
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
              {isRegister && otpStep ? (
                <div className="registration-otp-step">
                  <p className="registration-otp-message" role="status">{otpMessage} Enter the 6-digit code for <strong>{email}</strong>.</p>
                  <label>
                    VERIFICATION CODE
                    <span className="vertex-input registration-otp-field">
                      <ShieldCheck size={18} aria-hidden="true" />
                      <input
                        value={otp}
                        onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        aria-label="6-digit email verification code"
                        aria-describedby="registration-otp-countdown"
                      />
                    </span>
                  </label>
                  <p className="registration-otp-countdown" id="registration-otp-countdown">
                    Code expires in {formatOtpDuration(otpSeconds.expires)}.
                  </p>
                </div>
              ) : (
                <>
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
                </>
              )}

              {validationMessages.length ? <div className="form-error">{validationMessages.map((message) => <p key={message}>{message}</p>)}</div> : null}
              {authError ? <p className="form-error">{authError}</p> : null}
              {otpError ? <p className="form-error" role="alert">{otpError}</p> : null}

              <button className="vertex-auth-submit" type="submit" disabled={authLoading || otpLoading || (isRegister && (!legalAccepted || !legalVersionsReady))}>
                {authLoading || otpLoading ? 'PLEASE WAIT...' : isRegister ? (otpStep ? 'VERIFY & CREATE ACCOUNT' : 'CREATE ACCOUNT') : 'LOGIN'}
              </button>

              {isRegister && otpStep ? (
                <div className="registration-otp-actions">
                  <button type="button" onClick={resendOtp} disabled={otpLoading || otpSeconds.resend > 0}>
                    {otpSeconds.resend > 0 ? `Resend code in ${formatOtpDuration(otpSeconds.resend)}` : 'Resend code'}
                  </button>
                  <button type="button" onClick={changeRegistrationEmail} disabled={otpLoading}>Change email</button>
                </div>
              ) : null}
            </form>

            {!otpStep && (!isRegister || (role === 'user' && legalAccepted)) ? <><div className="vertex-divider"><span>OR</span></div><button className="vertex-google" type="button" onClick={() => googleLogin()}><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" />Continue with Google</button></> : null}

            <p className="vertex-mode-switch">{isRegister ? 'Already have an account?' : "Don't have an account?"} <button type="button" onClick={() => switchMode(isRegister ? 'login' : 'register')}>{isRegister ? 'Sign In' : 'Sign Up'}</button></p>

            {!isRegister ? <div className="vertex-provider-links"><button type="button" onClick={(event) => redirectToOAuth(event, 'microsoft')}>Continue with Microsoft</button><button type="button" onClick={(event) => redirectToOAuth(event, 'apple')}><Apple size={14} />Continue with Apple</button></div> : null}
          </section>
        </main>
      ) : (
        <main className="auth-landing cinematic-home">
          <div className="home-hero-content">
            {/* Small Kicker */}
            <p className="home-kicker">LEARN · BUILD · COLLABORATE · EARN</p>

            {/* Main Welcome Heading */}
            <div className="home-hero-title-group">
              <h1 className="home-main-title">
                Welcome to <span className="title-gradient-vertex">Vertex</span>
              </h1>
              <p className="home-hero-desc">
                A unified platform to <span className="highlight-text">Build Projects</span>, <span className="highlight-text">Collaborate with Companies</span>, and <span className="highlight-text">Showcase</span> your real skills to the world.
              </p>
            </div>

            {/* Central 3D Logo Stage with Orbit Rings & Energy Platform */}
            <div className="home-logo-stage">
              <Vertex3DEmblem />
              <VertexEnergyPlatform />
            </div>

            {/* Four Feature Cards in one horizontal row */}
            <section id="vertex-features-section" className="home-feature-cards-row" aria-label="Key features">
              <button
                type="button"
                className="feature-card"
                onClick={() => onAuthNavigate?.('projects')}
                onPointerMove={updateGlow}
                onPointerLeave={resetGlow}
              >
                <div className="feature-card-glow" aria-hidden="true" />
                <div className="feature-icon-wrapper">
                  <Code2 size={22} aria-hidden="true" />
                </div>
                <h3 className="feature-card-title">Build Projects</h3>
                <p className="feature-card-desc">Work on real-world ideas</p>
              </button>

              <button
                type="button"
                className="feature-card"
                onClick={() => onAuthNavigate?.('company')}
                onPointerMove={updateGlow}
                onPointerLeave={resetGlow}
              >
                <div className="feature-card-glow" aria-hidden="true" />
                <div className="feature-icon-wrapper">
                  <Users size={22} aria-hidden="true" />
                </div>
                <h3 className="feature-card-title">Collaborate</h3>
                <p className="feature-card-desc">Partner with top companies</p>
              </button>

              <button
                type="button"
                className="feature-card"
                onClick={() => onAuthNavigate?.('rankings')}
                onPointerMove={updateGlow}
                onPointerLeave={resetGlow}
              >
                <div className="feature-card-glow" aria-hidden="true" />
                <div className="feature-icon-wrapper">
                  <BarChart3 size={22} aria-hidden="true" />
                </div>
                <h3 className="feature-card-title">Get Ranked</h3>
                <p className="feature-card-desc">Track your progress &amp; rank</p>
              </button>

              <button
                type="button"
                className="feature-card"
                onClick={() => onAuthNavigate?.('wallet')}
                onPointerMove={updateGlow}
                onPointerLeave={resetGlow}
              >
                <div className="feature-card-glow" aria-hidden="true" />
                <div className="feature-icon-wrapper">
                  <Coins size={22} aria-hidden="true" />
                </div>
                <h3 className="feature-card-title">Earn Rewards</h3>
                <p className="feature-card-desc">Convert your work into value</p>
              </button>
            </section>

            {/* CTA Buttons */}
            <div className="home-cta-group">
              <button
                className="home-primary-cta"
                type="button"
                onClick={() => onAuthNavigate?.('projects')}
              >
                <Rocket size={17} aria-hidden="true" />
                <span>Explore Vertex</span>
                <ChevronRight size={17} aria-hidden="true" />
              </button>

              <button
                className="home-secondary-cta"
                type="button"
                onClick={() => setShowVideoModal(true)}
              >
                <PlayCircle size={17} aria-hidden="true" />
                <span>Watch How It Works</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* Footer matching reference design */}
      <footer className="home-master-footer">
        {/* Left side */}
        <div className="footer-left-links">
          <button type="button" onClick={(event) => openLegalDocument(event, 'privacy')} className="footer-legal-link">
            <ShieldCheck size={14} aria-hidden="true" />
            <span>Privacy Policy</span>
          </button>
          <span className="footer-legal-divider" aria-hidden="true">|</span>
          <button type="button" onClick={(event) => openLegalDocument(event, 'terms')} className="footer-legal-link">
            <FileText size={14} aria-hidden="true" />
            <span>Terms &amp; Conditions</span>
          </button>
          <span className="footer-legal-divider" aria-hidden="true">|</span>
          <button type="button" onClick={() => setShowSupportModal(true)} className="footer-legal-link">
            <HelpCircle size={14} aria-hidden="true" />
            <span>Help &amp; Support</span>
          </button>
        </div>

        {/* Center */}
        <div className="footer-center-tagline">
          <span className="footer-tagline-line footer-tagline-line-left" aria-hidden="true" />
          <span className="footer-tagline-text">
            <strong className="footer-tagline-brand">Vertex</strong> &mdash; Build Today, Get Recognized Tomorrow
          </span>
          <span className="footer-tagline-line footer-tagline-line-right" aria-hidden="true" />
        </div>

        {/* Right side: Circular glass social icons */}
        <div className="footer-social-links" aria-label="Social media links">
          <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn" aria-label="Discord">
            <DiscordIcon />
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn" aria-label="GitHub">
            <Github size={15} />
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn" aria-label="YouTube">
            <Youtube size={15} />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn" aria-label="LinkedIn">
            <Linkedin size={15} />
          </a>
          <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn" aria-label="X (Twitter)">
            <XIcon />
          </a>
        </div>
      </footer>

      {/* Modals */}
      <LegalDocumentModal
        documentType={legalDocument}
        onClose={() => setLegalDocument(null)}
        returnFocusRef={legalReturnFocusRef}
        version={legalDocument === 'privacy' ? legalVersions.privacyPolicy : legalVersions.terms}
      />
      <HowItWorksModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        onExplore={() => onAuthNavigate?.('projects')}
      />
      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
    </section>
  );
}
