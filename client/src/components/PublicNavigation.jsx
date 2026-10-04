import Logo from './Logo.jsx';

export default function PublicNavigation({ activePage, setPage }) {
  return (
    <header className="public-nav">
      <button className="public-brand" type="button" onClick={() => setPage('home')} aria-label="Go to VERTEX home">
        <Logo />
      </button>
      <nav aria-label="Public navigation">
        <button className={activePage === 'home' ? 'active' : ''} type="button" onClick={() => setPage('home')}>Home</button>
        <button className={activePage === 'about' ? 'active' : ''} type="button" onClick={() => setPage('about')}>About</button>
        <button className={activePage === 'contact' ? 'active' : ''} type="button" onClick={() => setPage('contact')}>Contact</button>
        <button type="button" onClick={() => setPage('login')}>Login / Register</button>
        <button type="button" onClick={() => setPage('admin-login')}>Admin Login</button>
      </nav>
    </header>
  );
}
