import { ArrowRight, Award, Bell, BriefcaseBusiness, ShieldCheck, UserRound } from 'lucide-react';
import PublicNavigation from '../components/PublicNavigation.jsx';
import Logo from '../components/Logo.jsx';
import CinematicScene from '../components/CinematicScene.jsx';

const offerings = [
  ['Project discovery', BriefcaseBusiness],
  ['User and company profiles', UserRound],
  ['Project rankings', Award],
  ['Notifications', Bell],
  ['Secure authentication', ShieldCheck]
];

const steps = [
  ['01', 'BUILD', 'Complete meaningful projects.'],
  ['02', 'RANK', 'Build progress and reputation through project activity.'],
  ['03', 'EARN', 'Earn rewards through completed work.']
];

export default function AboutPage({ setPage }) {
  return (
    <main className="public-page">
      <PublicNavigation activePage="about" setPage={setPage} />
      <CinematicScene className="public-cinematic-scene" />
      <div className="public-page-grid" aria-hidden="true" />

      <section className="about-hero public-section">
        <div className="public-copy">
          <p className="public-kicker">VERTEX PLATFORM</p>
          <h1>ABOUT <span>VERTEX</span></h1>
          <p className="public-tagline">Build. Rank. Earn.</p>
          <p className="public-lead">VERTEX brings ambitious people, companies, and meaningful projects into one focused platform for real progress.</p>
        </div>
        <Logo variant="showcase" showText={false} className="about-logo-image" />
      </section>

      <section className="public-section mission-section">
        <p className="public-kicker">OUR MISSION</p>
        <h2>Progress that feels <span>earned.</span></h2>
        <p>We connect users, companies, and projects in one place so opportunity, recognition, and real work can move forward together.</p>
      </section>

      <section className="public-section">
        <div className="section-heading">
          <p className="public-kicker">WHAT VERTEX OFFERS</p>
          <h2>Everything aligned for <span>momentum.</span></h2>
        </div>
        <div className="offer-grid">
          {offerings.map(([label, Icon], index) => (
            <article className="offer-item" key={label}>
              <span className="offer-number">0{index + 1}</span>
              <Icon size={22} aria-hidden="true" />
              <h3>{label}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="public-section work-section">
        <p className="public-kicker">HOW VERTEX WORKS</p>
        <div className="step-grid">
          {steps.map(([number, title, copy]) => (
            <article className="work-step" key={title}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="public-cta public-section">
        <p className="public-kicker">VERTEX AWAITS</p>
        <h2>BUILD YOUR FUTURE WITH <span>VERTEX</span></h2>
        <button className="vertex-action" type="button" onClick={() => setPage('register')}>
          Get Started <ArrowRight size={18} />
        </button>
      </section>
    </main>
  );
}
