import { Eye, EyeOff, LockKeyhole, Moon, ShieldCheck, Sun, UserRound } from 'lucide-react';
import { useState } from 'react';
import CinematicScene from '../components/CinematicScene.jsx';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminLoginPage({ bright, setBright, onAuthenticated, onBack, onNavigate }) {
  const { loginAdmin, authError, authLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function navigate(page) {
    if (onNavigate) {
      onNavigate(page);
      return;
    }
    onBack?.();
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
    try {
      await loginAdmin({ username, password });
      onAuthenticated('admin');
    } catch {
      // AuthContext displays the error returned by the admin endpoint.
    }
  }

  return (
    <section className="auth-shell vertex-auth-shell admin-auth-shell">
      <header className="auth-nav">
        <button className="auth-brand" type="button" onClick={() => navigate('home')} aria-label="Go to VERTEX home"><Logo variant="navigation" /></button>
        <nav>
          <button type="button" onClick={() => navigate('home')}>Home</button>
          <button type="button" onClick={() => navigate('about')}>About</button>
          <button type="button" onClick={() => navigate('contact')}>Contact</button>
          <button type="button" onClick={() => navigate('login')}>Login / Register</button>
          <button className="active" type="button" onClick={() => navigate('admin-login')}>Admin Login</button>
        </nav>
      </header>

      <button className="auth-theme icon-button" type="button" onClick={() => setBright((value) => !value)} aria-label="Toggle theme">
        {bright ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <main className="vertex-auth-stage admin-auth-stage" onPointerMove={updateParallax} onPointerLeave={resetParallax}>
        <CinematicScene />
        <section className="vertex-auth-brand" aria-label="VERTEX administrator access">
          <Logo variant="auth" showText={false} className="vertex-auth-logo" />
          <p>SECURE. VERIFIED. ADMINISTRATIVE.</p>
        </section>

        <section className="vertex-auth-panel admin-auth-panel" aria-labelledby="admin-auth-title">
          <div className="vertex-auth-heading">
            <ShieldCheck size={28} aria-hidden="true" />
            <p>ADMIN ACCESS</p>
            <h1 id="admin-auth-title">Sign in with your VERTEX administrator credentials</h1>
          </div>

          <form className="vertex-auth-form" onSubmit={handleSubmit}>
            <label>
              ADMIN USERNAME
              <span className="vertex-input"><UserRound size={18} /><input value={username} onChange={(event) => setUsername(event.target.value)} type="text" autoComplete="username" required /></span>
            </label>
            <label>
              PASSWORD
              <span className="vertex-input"><LockKeyhole size={18} /><input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="current-password" minLength={8} required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></span>
            </label>
            {authError ? <p className="form-error">{authError}</p> : null}
            <button className="vertex-auth-submit" type="submit" disabled={authLoading}>{authLoading ? 'VERIFYING...' : 'ENTER ADMIN CONSOLE'}</button>
          </form>
          <p className="vertex-mode-switch">Need a user account? <button type="button" onClick={() => navigate('login')}>Return to Login</button></p>
        </section>
      </main>
    </section>
  );
}
