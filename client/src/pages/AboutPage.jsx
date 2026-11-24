import { ArrowRight, Award, Bell, BriefcaseBusiness, Eye, ShieldCheck, Sparkles, Target, UserRound } from 'lucide-react';
import PublicNavigation from '../components/PublicNavigation.jsx';
import Logo from '../components/Logo.jsx';
import CinematicScene from '../components/CinematicScene.jsx';

const pillars = [
  {
    kicker: 'OUR MISSION',
    title: 'Progress That Feels Earned',
    description: 'We connect builders, creators, and innovative companies into a unified meritocratic ecosystem where recognition and rewards directly mirror validated, high-impact output.',
    icon: Target
  },
  {
    kicker: 'OUR VISION',
    title: 'The Decentralized Meritocracy',
    description: 'Pioneering a futuristic digital workspace where talent is recognized purely through tangible execution, barriers to entry are eliminated, and opportunities are borderless.',
    icon: Eye
  },
  {
    kicker: 'CORE VALUES',
    title: 'Precision, Power, Integrity',
    description: 'Uncompromising execution standards, transparent reputation accounting, radical openness, and collaborative mechanics designed to elevate the entire network.',
    icon: ShieldCheck
  }
];

const offerings = [
  ['Project Discovery', 'Find curated bounties, open-source initiatives, and enterprise contracts matched to your skills.', BriefcaseBusiness],
  ['Verified Profiles', 'Showcase real-world proof of execution, cryptographically tracked progress, and verifiable accomplishments.', UserRound],
  ['Dynamic Rankings', 'Earn prestige on global competitive leaderboards updated transparently with every successful delivery.', Award],
  ['Real-Time Signals', 'Instant alerts for project milestones, peer reviews, compensation payouts, and rank tier promotions.', Bell],
  ['Institutional Security', 'Enterprise-grade authentication, role-based governance, and immutable audit logs for complete safety.', ShieldCheck]
];

const steps = [
  ['01', 'BUILD', 'Take on high-impact projects, deliver verified code, and solve genuine real-world challenges.'],
  ['02', 'RANK', 'Accumulate XP, level up your verified standing, and rise through global leaderboard tiers.'],
  ['03', 'EARN', 'Receive guaranteed bounties, premium contracts, and reputation credentials that open industry doors.']
];

export default function AboutPage({ setPage }) {
  return (
    <main className="public-page about-page">
      <PublicNavigation activePage="about" setPage={setPage} />
      <CinematicScene className="public-cinematic-scene" />

      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-copy">
          <div className="about-kicker-pill">
            <Sparkles size={13} aria-hidden="true" />
            <span>VERTEX PLATFORM</span>
          </div>
          <h1 className="about-hero-title">
            ABOUT <span className="highlight-gradient">VERTEX</span>
          </h1>
          <p className="about-tagline">BUILD . RANK . EARN.</p>
          <p className="about-lead">
            VERTEX brings ambitious builders, creators, and innovative companies together into one high-performance ecosystem for verifiable project execution, transparent reputation rankings, and earned momentum.
          </p>
          <div className="about-hero-actions">
            <button className="vertex-action" type="button" onClick={() => setPage('projects')}>
              <span>Explore Projects</span>
              <ArrowRight size={17} aria-hidden="true" />
            </button>
            <button className="vertex-action-ghost" type="button" onClick={() => setPage('register')}>
              <span>Join VERTEX</span>
            </button>
          </div>
        </div>

        <div className="about-hero-visual">
          <div className="about-visual-stage">
            <div className="about-visual-glow" aria-hidden="true" />
            <Logo variant="home" showText={false} className="about-logo-image" />
            <div className="about-visual-pedestal" aria-hidden="true">
              <svg className="pedestal-svg" viewBox="0 0 400 120" fill="none">
                <ellipse cx="200" cy="60" rx="170" ry="36" stroke="rgba(168, 85, 247, 0.35)" strokeWidth="1.5" />
                <ellipse cx="200" cy="60" rx="120" ry="24" stroke="rgba(192, 132, 252, 0.55)" strokeWidth="1.5" />
                <ellipse cx="200" cy="60" rx="65" ry="12" stroke="#ffffff" strokeWidth="2" />
              </svg>
              <div className="pedestal-hotspot" />
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, and Core Values Glass Cards */}
      <section className="about-pillars-section">
        <div className="section-header-centered">
          <p className="public-kicker">FOUNDATION &amp; PURPOSE</p>
          <h2 className="section-title">Built on <span>Principles</span></h2>
          <p className="section-subtitle">
            The driving principles behind every feature, leaderboard, and interaction across the VERTEX platform.
          </p>
        </div>

        <div className="about-pillars-grid">
          {pillars.map(({ kicker, title, description, icon: Icon }) => (
            <article className="pillar-glass-card" key={kicker}>
              <div className="pillar-icon-badge">
                <Icon size={24} aria-hidden="true" />
              </div>
              <p className="pillar-label">{kicker}</p>
              <h3 className="pillar-title">{title}</h3>
              <p className="pillar-text">{description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* How VERTEX Works */}
      <section className="about-steps-section">
        <div className="section-header-centered">
          <p className="public-kicker">HOW VERTEX WORKS</p>
          <h2 className="section-title">Three Steps to <span>Momentum</span></h2>
        </div>
        <div className="about-steps-grid">
          {steps.map(([num, label, desc]) => (
            <article className="about-step-card" key={num}>
              <span className="step-num">{num}</span>
              <div className="step-body">
                <h3>{label}</h3>
                <p>{desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Platform Capabilities / Offerings */}
      <section className="about-offerings-section">
        <div className="section-header-centered">
          <p className="public-kicker">PLATFORM CAPABILITIES</p>
          <h2 className="section-title">Everything Aligned for <span>Velocity</span></h2>
        </div>
        <div className="about-offerings-grid">
          {offerings.map(([title, desc, Icon], index) => (
            <article className="offering-glass-card" key={title}>
              <div className="offering-header">
                <span className="offering-index">0{index + 1}</span>
                <div className="offering-icon-frame">
                  <Icon size={19} aria-hidden="true" />
                </div>
              </div>
              <h4>{title}</h4>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="about-cta-section">
        <div className="about-cta-card">
          <div className="about-cta-glow" aria-hidden="true" />
          <p className="public-kicker">VERTEX AWAITS</p>
          <h2>BUILD YOUR FUTURE WITH <span>VERTEX</span></h2>
          <p>Join top developers and forward-thinking enterprises shaping the next era of earned recognition.</p>
          <button className="vertex-action" type="button" onClick={() => setPage('register')}>
            <span>Get Started</span>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Consistent Public Footer */}
      <footer className="public-footer">
        <p className="public-footer-copy">© {new Date().getFullYear()} VERTEX. All rights reserved.</p>
        <div className="public-footer-links">
          <button type="button" onClick={() => setPage('home')}>Home</button>
          <span aria-hidden="true">•</span>
          <button type="button" onClick={() => setPage('about')}>About</button>
          <span aria-hidden="true">•</span>
          <button type="button" onClick={() => setPage('contact')}>Contact</button>
          <span aria-hidden="true">•</span>
          <button type="button" onClick={() => setPage('login')}>Sign In</button>
        </div>
      </footer>
    </main>
  );
}
