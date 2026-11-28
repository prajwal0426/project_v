import {
  ArrowDown,
  ArrowRight,
  Award,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Coins,
  Compass,
  Eye,
  FolderGit2,
  GraduationCap,
  Hammer,
  Layers,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import CinematicScene from '../components/CinematicScene.jsx';
import Logo from '../components/Logo.jsx';
import PublicNavigation from '../components/PublicNavigation.jsx';
import '../styles/public-pages.css';

const PROBLEMS = [
  {
    num: '01',
    title: 'Skills are difficult to demonstrate through traditional resumes.',
    detail:
      'Static bullet points and generic certificates rarely communicate how someone actually thinks, designs, collaborates, and ships real software.',
    icon: Target
  },
  {
    num: '02',
    title: 'Students often lack access to real-world projects and collaboration.',
    detail:
      'Many aspiring builders complete isolated exercises without experiencing shared repositories, structured feedback, and team delivery workflows.',
    icon: Users
  },
  {
    num: '03',
    title: 'Companies struggle to discover capable emerging talent.',
    detail:
      'Organizations review stacks of near-identical resumes while finding it hard to evaluate practical engineering execution before hiring or partnering.',
    icon: Building2
  }
];

const ECOSYSTEM_CHAIN = [
  {
    id: 'builders',
    label: 'STUDENTS / BUILDERS',
    summary: 'Ambitious learners and developers step in ready to build meaningful software beyond classroom assignments.',
    routeLabel: 'Explore Builder Features',
    routeTarget: 'features',
    icon: GraduationCap
  },
  {
    id: 'projects',
    label: 'REAL PROJECTS',
    summary: 'Structured real-world challenges give builders clear technical specifications, deadlines, and tangible deliverables.',
    routeLabel: 'Explore Projects',
    routeTarget: 'projects',
    icon: FolderGit2
  },
  {
    id: 'collaboration',
    label: 'COLLABORATION',
    summary: 'Builders work across shared initiatives, submit milestones, receive structured feedback, and sharpen teamwork habits.',
    routeLabel: 'See Workflow',
    routeTarget: 'features',
    icon: Users
  },
  {
    id: 'companies',
    label: 'COMPANIES',
    summary: 'Organizations host project briefs, follow real implementation progress, and discover talent through demonstrated work.',
    routeLabel: 'Open Company Space',
    routeTarget: 'company',
    icon: Building2
  },
  {
    id: 'opportunities',
    label: 'OPPORTUNITIES',
    summary: 'Completed submissions translate into portfolio proof, ranking recognition, earned coins, and meaningful connections.',
    routeLabel: 'Explore Full Ecosystem',
    routeTarget: 'ecosystem',
    icon: Award
  }
];

const CORE_VALUES = [
  {
    title: 'BUILD',
    desc: 'Create real things and turn ideas into reality.',
    icon: Hammer
  },
  {
    title: 'COLLABORATE',
    desc: 'Work together and learn from others.',
    icon: Users
  },
  {
    title: 'GROW',
    desc: 'Develop skills through practical experience.',
    icon: TrendingUp
  },
  {
    title: 'RECOGNIZE',
    desc: 'Let meaningful work demonstrate your abilities.',
    icon: Trophy
  },
  {
    title: 'EARN',
    desc: 'Create value through contribution and achievement.',
    icon: Coins
  }
];

export default function AboutPage({ setPage }) {
  const [activeEcoIdx, setActiveEcoIdx] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });

    const nodes = Array.from(document.querySelectorAll('.vx-reveal'));
    const revealVisibleOrPassed = () => {
      const cutoff = window.innerHeight * 0.96;
      nodes.forEach((node) => {
        if (node.getBoundingClientRect().top <= cutoff) {
          node.classList.add('is-revealed');
        }
      });
    };

    revealVisibleOrPassed();

    if (!('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('is-revealed'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting || entry.boundingClientRect.top <= window.innerHeight * 0.96) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
    );

    nodes.forEach((node) => observer.observe(node));
    window.addEventListener('scroll', revealVisibleOrPassed, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', revealVisibleOrPassed);
    };
  }, []);

  const activeEcoStage = ECOSYSTEM_CHAIN[activeEcoIdx] || ECOSYSTEM_CHAIN[0];

  return (
    <main className="public-page about-page">
      <PublicNavigation activePage="about" setPage={setPage} />
      <CinematicScene className="public-cinematic-scene" />

      {/* Section 1: Hero */}
      <section className="about-v2-hero">
        <div className="about-hero-copy">
          <div className="about-kicker-pill">
            <Sparkles size={13} aria-hidden="true" />
            <span>ABOUT VERTEX</span>
          </div>
          <h1 className="about-v2-hero-title">
            We&apos;re Building a Future Where <span className="highlight-gradient">Skills Create Opportunities.</span>
          </h1>
          <p className="about-lead">
            VERTEX connects builders, projects, and companies through real-world collaboration, meaningful work, and opportunities to grow.
          </p>
          <div className="about-hero-actions">
            <button className="vertex-action" type="button" onClick={() => setPage('ecosystem')}>
              <Layers size={17} aria-hidden="true" />
              <span>Explore the VERTEX Ecosystem</span>
              <ArrowRight size={17} aria-hidden="true" />
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

      {/* Section 2: Our Story */}
      <section className="vx-section vx-reveal" aria-label="Our Story">
        <div className="about-story-grid">
          <article className="vx-glass-card about-story-card">
            <span className="vx-pill-tag accent">OUR STORY</span>
            <h2>Why We Created VERTEX</h2>
            <p>
              Too many talented students and self-taught developers spend years learning hard technical skills only to be summarized by a single-page PDF resume or passive course certificate.
            </p>
            <p>
              VERTEX was born from a simple conviction: capability is best shown by building real things. By giving builders a structured space to take on practical projects, collaborate with peers, receive real feedback, and track verified accomplishments, potential becomes visible proof.
            </p>
          </article>

          <aside className="vx-glass-card about-contrast-panel" aria-label="Traditional resumes compared to project proof">
            <div className="about-contrast-row">
              <span className="vx-pill-tag">Before VERTEX</span>
              <strong>Certificates &amp; Static Resumes</strong>
              <span>Unverified claims, isolated toy exercises, and limited visibility into real execution.</span>
            </div>
            <div className="about-contrast-row vertex-shift">
              <span className="vx-pill-tag accent">The VERTEX Approach</span>
              <strong>Demonstrated Real-World Execution</strong>
              <span>Completed project submissions, structured reviews, ranking recognition, and a living work portfolio.</span>
            </div>
          </aside>
        </div>
      </section>

      {/* Section 3: The Problem We Solve */}
      <section className="vx-section vx-reveal" aria-label="The Problem We Solve">
        <div className="section-header-centered">
          <p className="public-kicker">THE PROBLEM WE SOLVE</p>
          <h2 className="section-title">
            Closing the <span>Proof Gap</span>
          </h2>
          <p className="section-subtitle">
            Three structural disconnects hold back both emerging developers and the organizations eager to work with them.
          </p>
        </div>

        <div className="about-problem-grid">
          {PROBLEMS.map((problem) => {
            const Icon = problem.icon;
            return (
              <article className="vx-glass-card vx-glass-card-interactive about-problem-card" key={problem.num}>
                <div className="feature-module-head">
                  <div className="feature-module-icon">
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <span className="about-problem-num">PROBLEM {problem.num}</span>
                </div>
                <h3>{problem.title}</h3>
                <p>{problem.detail}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Sections 4 & 5: Our Mission & Our Vision */}
      <section className="vx-section vx-reveal" aria-label="Our Mission and Vision">
        <div className="about-mv-grid">
          <article className="vx-glass-card vx-glass-card-interactive about-mv-card">
            <div className="feature-module-icon">
              <Target size={22} aria-hidden="true" />
            </div>
            <span className="pillar-label">OUR MISSION</span>
            <h2>Turn Potential Into Proof.</h2>
            <p>
              VERTEX helps people build real projects, demonstrate their skills through completed deliverables, collaborate alongside teams, and create meaningful opportunities through verified effort.
            </p>
          </article>

          <article className="vx-glass-card vx-glass-card-interactive about-mv-card">
            <div className="feature-module-icon">
              <Eye size={22} aria-hidden="true" />
            </div>
            <span className="pillar-label">OUR VISION</span>
            <h2>A World Where What You Build Matters.</h2>
            <p>
              We envision an open merit-driven ecosystem where talent, real-world projects, forward-thinking organizations, earned recognition, and growth opportunities connect seamlessly around tangible work.
            </p>
          </article>
        </div>
      </section>

      {/* Section 6: The VERTEX Ecosystem */}
      <section className="vx-section vx-reveal" aria-label="The VERTEX Ecosystem">
        <div className="section-header-centered">
          <p className="public-kicker">INTERCONNECTED FLOW</p>
          <h2 className="section-title">
            The <span>VERTEX</span> Ecosystem
          </h2>
          <p className="section-subtitle">
            Select any stage in the flow to see how builders, projects, companies, and outcomes reinforce each other.
          </p>
        </div>

        <div className="vx-glass-card about-eco-shell">
          <div className="about-eco-chain" role="tablist" aria-label="VERTEX ecosystem flow">
            {ECOSYSTEM_CHAIN.map((item, idx) => {
              const Icon = item.icon;
              const isActive = idx === activeEcoIdx;
              const hasArrow = idx < ECOSYSTEM_CHAIN.length - 1;
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`about-eco-node ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveEcoIdx(idx)}
                  >
                    <span className="about-eco-node-left">
                      <Icon size={18} aria-hidden="true" />
                      <strong>{item.label}</strong>
                    </span>
                    <span className="vx-pill-tag">{`0${idx + 1}`}</span>
                  </button>
                  {hasArrow ? (
                    <div className="about-eco-arrow" aria-hidden="true">
                      <ArrowDown size={16} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="about-eco-detail" role="tabpanel" aria-live="polite">
            <div key={activeEcoStage.id} className="showcase-stage-inner">
              <span className="vx-pill-tag accent">Stage 0{activeEcoIdx + 1}</span>
              <h3>{activeEcoStage.label}</h3>
              <p>{activeEcoStage.summary}</p>
              <div>
                <button
                  type="button"
                  className="vertex-action"
                  onClick={() => setPage(activeEcoStage.routeTarget)}
                >
                  <span>{activeEcoStage.routeLabel}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Our Core Values */}
      <section className="vx-section vx-reveal" aria-label="Our Core Values">
        <div className="section-header-centered">
          <p className="public-kicker">OUR CORE VALUES</p>
          <h2 className="section-title">
            Five Principles That <span>Guide Us</span>
          </h2>
        </div>

        <div className="about-values-grid">
          {CORE_VALUES.map((value) => {
            const Icon = value.icon;
            return (
              <article className="vx-glass-card vx-glass-card-interactive about-value-card" key={value.title}>
                <div className="value-icon-box">
                  <Icon size={19} aria-hidden="true" />
                </div>
                <h3>{value.title}</h3>
                <p>{value.desc}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Section 8: Our Future */}
      <section className="vx-section vx-reveal" aria-label="Our Future">
        <div className="vx-glass-card about-future-card">
          <div className="about-future-head">
            <span className="vx-pill-tag accent">LOOKING AHEAD</span>
            <h2>
              Evolving Into a Larger <span className="highlight-gradient">Builder Ecosystem</span>
            </h2>
            <p>
              VERTEX is growing steadily around real engineering execution—expanding how projects, organizations, collaboration, recognition, and opportunities connect, while staying transparent about what works today versus what we are evolving toward next.
            </p>
          </div>

          <div className="about-future-columns">
            <div className="about-future-box">
              <span className="vx-pill-tag success">Available Today</span>
              <h3>Current Platform Experience</h3>
              <ul className="about-future-list">
                <li>
                  <CheckCircle2 size={15} aria-hidden="true" />
                  <span>Browse project briefs, submit deliverables, and track completion status.</span>
                </li>
                <li>
                  <CheckCircle2 size={15} aria-hidden="true" />
                  <span>User, company, and workspace dashboards with progress indicators and profiles.</span>
                </li>
                <li>
                  <CheckCircle2 size={15} aria-hidden="true" />
                  <span>Monthly rankings leaderboard, notification updates, and personal coin wallet ledger.</span>
                </li>
              </ul>
            </div>

            <div className="about-future-box">
              <span className="vx-pill-tag accent">Future Vision</span>
              <h3>Long-Term Ecosystem Direction</h3>
              <ul className="about-future-list">
                <li>
                  <Compass size={15} aria-hidden="true" />
                  <span>Deeper multi-company project tracks and broader cross-team collaboration flows.</span>
                </li>
                <li>
                  <Compass size={15} aria-hidden="true" />
                  <span>Richer portfolio verification signals linking delivered milestones with recognition tiers.</span>
                </li>
                <li>
                  <Compass size={15} aria-hidden="true" />
                  <span>Expanded community challenges connecting emerging developers with real-world organizations.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 9: Final CTA */}
      <section className="vx-section vx-reveal" aria-label="Final Call to Action">
        <div className="vx-glass-card vx-final-cta-card">
          <div className="about-kicker-pill">
            <Rocket size={13} aria-hidden="true" />
            <span>START BUILDING</span>
          </div>
          <h2>
            Your Next Opportunity Starts With <span className="highlight-gradient">What You Build.</span>
          </h2>
          <p>Explore active projects or create your account to join builders and companies on VERTEX.</p>
          <div className="vx-cta-actions">
            <button className="vertex-action" type="button" onClick={() => setPage('projects')}>
              <BriefcaseBusiness size={17} aria-hidden="true" />
              <span>Explore Projects</span>
              <ArrowRight size={17} aria-hidden="true" />
            </button>
            <button className="vertex-action-ghost" type="button" onClick={() => setPage('register')}>
              <span>Join VERTEX</span>
            </button>
          </div>
        </div>
      </section>

      {/* Consistent Public Footer */}
      <footer className="public-footer">
        <p className="public-footer-copy">© {new Date().getFullYear()} VERTEX. All rights reserved.</p>
        <div className="public-footer-links">
          <button type="button" onClick={() => setPage('home')}>Home</button>
          <span aria-hidden="true">•</span>
          <button type="button" onClick={() => setPage('features')}>Features</button>
          <span aria-hidden="true">•</span>
          <button type="button" onClick={() => setPage('ecosystem')}>Ecosystem</button>
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
