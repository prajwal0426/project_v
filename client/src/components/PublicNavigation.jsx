import { Home, Info, Mail, ShieldCheck, UserRound } from 'lucide-react';

export default function PublicNavigation({ activePage = 'home', setPage }) {
  const isAuth = activePage === 'login' || activePage === 'register';

  return (
    <header
      className="auth-nav"
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        e.currentTarget.style.setProperty('--nav-glow-x', `${x.toFixed(1)}%`);
        e.currentTarget.style.setProperty('--nav-glow-y', `${y.toFixed(1)}%`);
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.setProperty('--nav-glow-x', '50%');
        e.currentTarget.style.setProperty('--nav-glow-y', '50%');
      }}
    >
      <button className="auth-brand" type="button" onClick={() => setPage?.('home')} aria-label="Go to VERTEX home">
        <div className="nav-brand-container">
          <div className="nav-brand-badge">
            <span className="nav-brand-logo-frame">
              <img className="nav-brand-logo-img" src="/login-logo.png" alt="Vertex" />
            </span>
          </div>
          <div className="nav-brand-text">
            <strong className="nav-brand-name">Vertex</strong>
            <span className="nav-brand-sub">build. rank. earn.</span>
          </div>
        </div>
      </button>

      <div className="nav-divider" aria-hidden="true" />

      <nav className="nav-links">
        <button
          className={activePage === 'home' ? 'nav-link-item active' : 'nav-link-item'}
          type="button"
          onClick={() => setPage?.('home')}
        >
          <Home size={15} aria-hidden="true" />
          <span>Home</span>
        </button>
        <button
          className={activePage === 'about' ? 'nav-link-item active' : 'nav-link-item'}
          type="button"
          onClick={() => setPage?.('about')}
        >
          <Info size={15} aria-hidden="true" />
          <span>About</span>
        </button>
        <button
          className={activePage === 'contact' ? 'nav-link-item active' : 'nav-link-item'}
          type="button"
          onClick={() => setPage?.('contact')}
        >
          <Mail size={15} aria-hidden="true" />
          <span>Contact</span>
        </button>
      </nav>

      <div className="nav-divider" aria-hidden="true" />

      <div className="nav-actions">
        <button
          className={isAuth ? 'nav-action-btn active' : 'nav-action-btn'}
          type="button"
          onClick={() => setPage?.('login')}
        >
          <UserRound size={15} aria-hidden="true" />
          <span>Login / Register</span>
        </button>
        <button
          className={activePage === 'admin-login' ? 'nav-admin-btn active' : 'nav-admin-btn'}
          type="button"
          onClick={() => setPage?.('admin-login')}
        >
          <ShieldCheck size={15} aria-hidden="true" />
          <span>Admin Login</span>
        </button>
      </div>
    </header>
  );
}
