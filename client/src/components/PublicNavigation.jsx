import { Box, Building2, Home, Info, Layers, Menu, UserRound, X } from 'lucide-react';
import { useState } from 'react';

export default function PublicNavigation({ activePage = 'home', setPage }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAuth = activePage === 'login' || activePage === 'register';

  function handleNav(target) {
    setMobileOpen(false);
    setPage?.(target);
  }

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
      <button className="auth-brand" type="button" onClick={() => handleNav('home')} aria-label="Go to VERTEX home">
        <div className="nav-brand-container">
          <div className="nav-brand-badge">
            <span className="nav-brand-logo-frame">
              <img className="nav-brand-logo-img" src="/login-logo.png" alt="Vertex" />
            </span>
          </div>
          <div className="nav-brand-text">
            <strong className="nav-brand-name">Vertex</strong>
            <span className="nav-brand-sub">Build · Rank · Earn</span>
          </div>
        </div>
      </button>

      <div className="nav-divider" aria-hidden="true" />

      {/* Center Navigation Links matching reference */}
      <nav className={`nav-links ${mobileOpen ? 'mobile-open' : ''}`}>
        <button
          className={activePage === 'home' ? 'nav-link-item active' : 'nav-link-item'}
          type="button"
          onClick={() => handleNav('home')}
        >
          <Home size={15} aria-hidden="true" />
          <span>Home</span>
        </button>
        <button
          className={activePage === 'features' ? 'nav-link-item active' : 'nav-link-item'}
          type="button"
          onClick={() => handleNav('features')}
        >
          <Box size={15} aria-hidden="true" />
          <span>Features</span>
        </button>
        <button
          className={activePage === 'ecosystem' ? 'nav-link-item active' : 'nav-link-item'}
          type="button"
          onClick={() => handleNav('ecosystem')}
        >
          <Layers size={15} aria-hidden="true" />
          <span>Ecosystem</span>
        </button>
        <button
          className={activePage === 'company' ? 'nav-link-item active' : 'nav-link-item'}
          type="button"
          onClick={() => handleNav('company')}
        >
          <Building2 size={15} aria-hidden="true" />
          <span>Companies</span>
        </button>
        <button
          className={activePage === 'about' ? 'nav-link-item active' : 'nav-link-item'}
          type="button"
          onClick={() => handleNav('about')}
        >
          <Info size={15} aria-hidden="true" />
          <span>About</span>
        </button>
      </nav>

      <div className="nav-divider" aria-hidden="true" />

      {/* Right Action: Login / Register ONLY (Admin Login omitted per strict security requirement) */}
      <div className="nav-actions">
        <button
          className={isAuth ? 'nav-action-btn active' : 'nav-action-btn'}
          type="button"
          onClick={() => handleNav('login')}
        >
          <UserRound size={15} aria-hidden="true" />
          <span>Login / Register</span>
        </button>

        <button
          className="nav-mobile-toggle"
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
    </header>
  );
}
