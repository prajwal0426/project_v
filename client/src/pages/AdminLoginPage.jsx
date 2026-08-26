import { Eye, EyeOff, LockKeyhole, Moon, ShieldCheck, Sun } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminLoginPage({ bright, setBright, onAuthenticated, onBack }) {
  const { loginAdmin, authError, authLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await loginAdmin({ username, password });
      onAuthenticated('admin');
    } catch {
      // AuthContext owns the visible error message.
    }
  }

  return (
    <section className="auth-shell admin-auth-shell">
      <header className="auth-nav">
        <span />
        <nav>
          <button type="button" onClick={onBack}>home</button>
          <button type="button" onClick={onBack}>login/register</button>
        </nav>
      </header>

      <button className="auth-theme icon-button" onClick={() => setBright((value) => !value)} aria-label="Toggle theme">
        {bright ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <div className="auth-modal-layer auth-modal-layer-static" role="presentation">
        <div className="auth-card auth-form-card glass" role="dialog" aria-modal="true" aria-labelledby="admin-auth-title">
          <div className="auth-header">
            <div>
              <ShieldCheck size={34} />
              <h2 id="admin-auth-title">Admin Login</h2>
              <p>Sign in with your VERTEX admin credentials.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="admin-login-form">
            <label>
              Username
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                type="text"
                autoComplete="username"
                required
              />
            </label>
            <label>
              Password
              <span className="password-field">
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  minLength={8}
                  required
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            {authError ? <p className="form-error">{authError}</p> : null}
            <button className="primary" type="submit" disabled={authLoading}>
              <LockKeyhole size={17} />
              {authLoading ? 'Please wait...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
