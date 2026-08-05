import { useEffect, useRef, useState } from 'react';
import { Apple, Eye, EyeOff, LockKeyhole, Moon, Sun, X } from 'lucide-react';
import LegalDocumentModal from '../components/LegalDocumentModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { API_BASE_URL } from '../services/api.js';
import { LEGAL_VERSIONS } from '../services/legal.js';
import { useGoogleLogin } from "@react-oauth/google";


function landingFor(role) {
  if (role === 'company') return 'company';
  if (role === 'admin') return 'admin';
  return 'dashboard';
}

export default function LoginPage({ bright, setBright, onAuthenticated }) {
  const { login, register, authError, authLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState('register');
  const [role, setRole] = useState('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [legalDocument, setLegalDocument] = useState(null);
  const [validationMessages, setValidationMessages] = useState([]);
  const legalReturnFocusRef = useRef(null);

  const isRegister = authTab === 'register';
  const roles = isRegister ? ['user', 'company'] : ['user', 'company', 'admin'];
  const legalAccepted = privacyAccepted && termsAccepted && ageConfirmed;


  useEffect(() => {
    if (!authOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function closeOnEscape(event) {
      if (event.key === 'Escape' && !legalDocument) {
        setAuthOpen(false);
      }
    }

    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [authOpen, legalDocument]);

  function openAuth() {
    setAuthOpen(true);
    if (authTab === 'register' && role === 'admin') {
      setRole('user');
    }
  }

  function switchAuthTab(nextTab) {
    setAuthTab(nextTab);
    setValidationMessages([]);
    if (nextTab === 'register' && role === 'admin') {
      setRole('user');
    }
  }

  function openLegalDocument(event, documentType) {
    event.preventDefault();
    legalReturnFocusRef.current = event.currentTarget;
    setLegalDocument(documentType);
  }
  const googleLogin = useGoogleLogin({
    flow: "implicit",

    onSuccess: async (tokenResponse) => {
        const res = await fetch(`${API_BASE_URL}/auth/google`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(tokenResponse),
        });

        const data = await res.json();
        console.log(data);
    },

    onError: () => {
        console.log("Google Login Failed");
    },
});

  function redirectToOAuth(event, provider) {
    event.preventDefault();
    console.log(`OAuth login with ${provider} is not configured yet.`);
    alert(`OAuth login with ${provider} is not configured yet.`);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const missing = [];
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
        privacyPolicyVersion: LEGAL_VERSIONS.privacyPolicy,
        termsVersion: LEGAL_VERSIONS.terms
      });
      onAuthenticated(landingFor(user?.role || role));
    } catch {
      // AuthContext owns the visible error message.
    }
  }

  return (
    <section className={authOpen ? 'auth-shell auth-shell-form' : 'auth-shell'}>
      <header className="auth-nav">
        <span />
        <nav>
          <button type="button">home</button>
          <button type="button">about</button>
          <button type="button">contact</button>
          <button type="button" onClick={openAuth}>login/register</button>
        </nav>
      </header>

      <button className="auth-theme icon-button" onClick={() => setBright((value) => !value)} aria-label="Toggle theme">
        {bright ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <div className="auth-landing">
        <h1>HI THERE, WELCOME TO<br />VERTEX</h1>
        <div className="login-logo" aria-label="VERTEX">
          <img className="login-hero-image" src="/login-logo.png" alt="VERTEX" />
        </div>
        <div className="social-login">
         
        <button
    className="google"
    type="button"
    onClick={() => googleLogin()}
>
    <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt="Google"
        width="22"
    />

    Continue with Google
</button>


          <button className="microsoft" type="button" onClick={(event) => redirectToOAuth(event, 'microsoft')}><span>■</span>Continue with Microsoft</button>
          <button className="apple" type="button" onClick={(event) => redirectToOAuth(event, 'apple')}><Apple size={22} />Continue with Apple</button>
        </div>
      </div>

      {authOpen ? (
        <div className="auth-modal-layer" onClick={() => setAuthOpen(false)} role="presentation">
          <div className="auth-card auth-form-card glass" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <button className="auth-close icon-button" type="button" onClick={() => setAuthOpen(false)} aria-label="Close authentication">
              <X size={18} />
            </button>
            <div className="auth-mode-tabs">
              <button className={!isRegister ? 'active' : ''} type="button" onClick={() => switchAuthTab('login')}>Login</button>
              <button className={isRegister ? 'active' : ''} type="button" onClick={() => switchAuthTab('register')}>Register</button>
            </div>
            <h2 id="auth-title">{isRegister ? 'Create VERTEX Account' : 'Sign in to VERTEX'}</h2>
            <p>{isRegister ? 'Register as a user or company.' : 'Use your registered user, company, or admin account.'}</p>
            {isRegister ? (
              <p className="legal-inline-links">
                Read the <button type="button" onClick={(event) => openLegalDocument(event, 'privacy')}>Privacy Policy</button> and <button type="button" onClick={(event) => openLegalDocument(event, 'terms')}>Terms & Conditions</button>.
              </p>
            ) : null}
            <div className="auth-tabs" role="tablist" aria-label="Account type">
              {roles.map((nextRole) => (
                <button key={nextRole} className={role === nextRole ? 'active' : ''} onClick={() => setRole(nextRole)} type="button">
                  {nextRole}
                </button>
              ))}
            </div>
                        
            <form onSubmit={handleSubmit}>
              {isRegister ? (
                <label>
                  Name
                  <input value={name} onChange={(event) => setName(event.target.value)} type="text" autoComplete="name" required />
                </label>
              ) : null}
              <label>
                Email
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required />
              </label>
              <label>
                Password
                <span className="password-field">
                  <input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={8} required />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>
              {isRegister && role === 'user' ? (
                <label>
                  Date of Birth
                  <input value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} type="date" required />
                </label>
              ) : null}
              {isRegister ? (
                <label className="check">
                  <input checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)} type="checkbox" required />
                  <span>I have read and agree to the <button type="button" onClick={(event) => openLegalDocument(event, 'privacy')}>Privacy Policy</button>.</span>
                </label>
              ) : null}
              {isRegister ? (
                <label className="check">
                  <input checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} type="checkbox" required />
                  <span>I have read and agree to the <button type="button" onClick={(event) => openLegalDocument(event, 'terms')}>Terms & Conditions</button>.</span>
                </label>
              ) : null}
              {isRegister ? (
                <label className="check">
                  <input checked={ageConfirmed} onChange={(event) => setAgeConfirmed(event.target.checked)} type="checkbox" required />
                  <span>I confirm that I am 18 years of age or older.</span>
                </label>
              ) : null}
              {validationMessages.length ? (
                <div className="form-error">
                  {validationMessages.map((message) => <p key={message}>{message}</p>)}
                </div>
              ) : null}
              {authError ? <p className="form-error">{authError}</p> : null}
              <button className="primary" type="submit" disabled={authLoading || (isRegister && !legalAccepted)}>
                <LockKeyhole size={17} />
                {authLoading ? 'Please wait...' : isRegister ? 'Create Account' : 'Continue Securely'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
      <footer className="auth-legal-footer">
        <button type="button" onClick={(event) => openLegalDocument(event, 'privacy')}>Privacy Policy</button>
        <button type="button" onClick={(event) => openLegalDocument(event, 'terms')}>Terms & Conditions</button>
      </footer>
      <LegalDocumentModal documentType={legalDocument} onClose={() => setLegalDocument(null)} returnFocusRef={legalReturnFocusRef} />
    </section>
  );
}
