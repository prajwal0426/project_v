import { Home } from 'lucide-react';
import CinematicScene from '../components/CinematicScene.jsx';
import Logo from '../components/Logo.jsx';

export default function NotFoundPage({ setPage }) {
  return (
    <section className="auth-page">
      <CinematicScene className="app-cinematic-scene" />
      <div className="auth-card glass">
        <Logo />
        <h2>Page Not Found</h2>
        <p>The page you requested does not exist in VERTEX.</p>
        <button className="primary" type="button" onClick={() => setPage('home')}>
          <Home size={17} />
          Go Home
        </button>
      </div>
    </section>
  );
}
