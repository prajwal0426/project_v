import {
  ArrowRight,
  Award,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  Circle,
  Code2,
  Coins,
  Compass,
  FolderGit2,
  Hammer,
  Layers,
  MessageSquare,
  Rocket,
  Sparkles,
  TrendingUp,
  Trophy,
  Upload,
  UserRound,
  Users,
  Wallet
} from 'lucide-react';
import { useEffect, useState } from 'react';
import CinematicScene from '../components/CinematicScene.jsx';
import PublicNavigation from '../components/PublicNavigation.jsx';
import '../styles/public-pages.css';

const CORE_FEATURES = [
  {
    id: 'project-hub',
    tabLabel: 'Project Hub',
    shortDesc: 'Explore & build ideas',
    title: 'Project Hub',
    description:
      'Discover opportunities, explore innovative ideas, join teams, and build projects that demonstrate your abilities.',
    icon: FolderGit2,
    actionLabel: 'Explore Projects',
    actionRoute: 'projects'
  },
  {
    id: 'collaboration',
    tabLabel: 'Company Collaboration',
    shortDesc: 'Real-world challenges',
    title: 'Company Collaboration',
    description:
      'Connect with companies through real-world challenges, collaborative projects, and opportunities to demonstrate your talent.',
    icon: Building2,
    actionLabel: 'View Company Space',
    actionRoute: 'company'
  },
  {
    id: 'rankings',
    tabLabel: 'Rankings',
    shortDesc: 'Leaderboard recognition',
    title: 'Rankings & Recognition',
    description:
      'Showcase your achievements and gain recognition through your project contributions, performance, and accomplishments.',
    icon: Trophy,
    actionLabel: 'Open Rankings',
    actionRoute: 'rankings'
  },
  {
    id: 'rewards',
    tabLabel: 'Rewards',
    shortDesc: 'Coins & wallet activity',
    title: 'Rewards & Wallet',
    description:
      'Track your rewards, earned coins, and platform activity through your personal rewards experience.',
    icon: Wallet,
    actionLabel: 'Open Wallet',
    actionRoute: 'wallet'
  },
  {
    id: 'skill-showcase',
    tabLabel: 'Skill Showcase',
    shortDesc: 'Verified work portfolio',
    title: 'Skill Showcase',
    description:
      'Build a profile that highlights your projects, skills, accomplishments, and the work you have completed.',
    icon: UserRound,
    actionLabel: 'View Profile Space',
    actionRoute: 'profile'
  },
  {
    id: 'progress',
    tabLabel: 'Progress Tracking',
    shortDesc: 'Milestones & feedback',
    title: 'Progress Tracking',
    description:
      'Track your project journey, completion progress, feedback, milestones, and achievements.',
    icon: BarChart3,
    actionLabel: 'Open Dashboard',
    actionRoute: 'dashboard'
  }
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'DISCOVER',
    description: 'Explore projects, opportunities, and challenges.',
    icon: Compass
  },
  {
    step: '02',
    title: 'JOIN',
    description: 'Find projects and collaborate with teams.',
    icon: Users
  },
  {
    step: '03',
    title: 'BUILD',
    description: 'Work on meaningful projects and develop your skills.',
    icon: Hammer
  },
  {
    step: '04',
    title: 'SUBMIT',
    description: 'Showcase completed work and receive feedback.',
    icon: Upload
  },
  {
    step: '05',
    title: 'GROW',
    description: 'Build experience, achievements, recognition, and your portfolio.',
    icon: TrendingUp
  }
];

const VALUE_PROPOSITIONS = [
  {
    title: 'Real project experience',
    desc: 'Practice solving structured technical briefs and real implementation challenges beyond static tutorials.',
    icon: Code2
  },
  {
    title: 'Collaboration experience',
    desc: 'Work alongside fellow builders and coordinate deliverables across shared project workflows.',
    icon: Users
  },
  {
    title: 'A portfolio of completed work',
    desc: 'Every submitted deliverable builds a clear, verifiable history of what you have designed and shipped.',
    icon: FolderGit2
  },
  {
    title: 'Feedback and recognition',
    desc: 'Receive structured evaluations on completed milestones and earn visible leaderboard badges.',
    icon: MessageSquare
  },
  {
    title: 'Skills demonstration',
    desc: 'Let your delivered code, architecture, and problem-solving speak directly through completed projects.',
    icon: Sparkles
  },
  {
    title: 'Company connections',
    desc: 'Engage with organizations hosting challenges and reviewing demonstrated project execution.',
    icon: Building2
  },
  {
    title: 'Growth opportunities',
    desc: 'Track your momentum over time and continue advancing across progressively deeper challenges.',
    icon: TrendingUp
  }
];

const DEMO_PROJECTS = [
  { title: 'Distributed Telemetry Collector', category: 'Backend', status: 'Open', team: '3 Builders' },
  { title: 'Interactive Analytics Workspace', category: 'Frontend', status: 'In Progress', team: '4 Builders' },
  { title: 'Automated API Validation Suite', category: 'Full-Stack', status: 'Open', team: '2 Builders' },
  { title: 'Design System Token Explorer', category: 'UI/UX', status: 'Completed', team: '3 Builders' }
];

const DEMO_MILESTONES = [
  { id: 'm1', label: 'Architecture & schema setup', status: 'Done' },
  { id: 'm2', label: 'Core implementation & tests', status: 'Done' },
  { id: 'm3', label: 'Peer & reviewer feedback pass', status: 'In Review' },
  { id: 'm4', label: 'Final deliverable submission', status: 'Pending' }
];

export default function FeaturesPage({ setPage }) {
  const [activeFeatureId, setActiveFeatureId] = useState('project-hub');
  const [projectFilter, setProjectFilter] = useState('All');
  const [rankingView, setRankingView] = useState('Podium');
  const [walletFilter, setWalletFilter] = useState('All');
  const [skillFilter, setSkillFilter] = useState('All');
  const [checkedMilestones, setCheckedMilestones] = useState({ m1: true, m2: true, m3: false, m4: false });

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

  const activeFeature = CORE_FEATURES.find((item) => item.id === activeFeatureId) || CORE_FEATURES[0];

  function selectAndScrollToShowcase(featureId) {
    setActiveFeatureId(featureId);
    const el = document.getElementById('features-showcase');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function toggleMilestone(id) {
    setCheckedMilestones((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const completedMilestoneCount = Object.values(checkedMilestones).filter(Boolean).length;
  const milestonePercent = Math.round((completedMilestoneCount / DEMO_MILESTONES.length) * 100);

  function renderMiniPreview(id) {
    switch (id) {
      case 'project-hub':
        return (
          <div className="feature-mini-preview">
            <div className="mini-preview-row">
              <strong>Telemetry Collector</strong>
              <span className="vx-pill-tag accent">Open</span>
            </div>
            <div className="mini-preview-row mini-preview-muted">
              <span>Backend · Team Collaboration</span>
              <span>3 Builders</span>
            </div>
          </div>
        );
      case 'collaboration':
        return (
          <div className="feature-mini-preview">
            <div className="mini-preview-row">
              <strong>Company API Challenge</strong>
              <span className="vx-pill-tag">Active</span>
            </div>
            <div className="mini-preview-row mini-preview-muted">
              <span>Partner Brief · File Submission</span>
              <span>Team Track</span>
            </div>
          </div>
        );
      case 'rankings':
        return (
          <div className="feature-mini-preview">
            <div className="mini-preview-row">
              <span>#1 Builder Preview</span>
              <span className="vx-pill-tag accent">Gold Tier</span>
            </div>
            <div className="mini-preview-row mini-preview-muted">
              <span>#2 &amp; #3 Monthly Standings</span>
              <span>Score Tracked</span>
            </div>
          </div>
        );
      case 'rewards':
        return (
          <div className="feature-mini-preview">
            <div className="mini-preview-row">
              <span>Personal Wallet View</span>
              <span className="vx-pill-tag">Coins</span>
            </div>
            <div className="mini-preview-row mini-preview-muted">
              <span>Completed Project Credits</span>
              <span>Activity Log</span>
            </div>
          </div>
        );
      case 'skill-showcase':
        return (
          <div className="feature-mini-preview">
            <div className="mini-preview-row">
              <strong>Developer Portfolio</strong>
              <span className="vx-pill-tag success">Verified Work</span>
            </div>
            <div className="mini-preview-row mini-preview-muted">
              <span>React · Node · APIs</span>
              <span>Completed Projects</span>
            </div>
          </div>
        );
      case 'progress':
      default:
        return (
          <div className="feature-mini-preview">
            <div className="mini-preview-row">
              <span>Milestone Progress</span>
              <span>75%</span>
            </div>
            <div className="mini-progress-track">
              <div className="mini-progress-fill" style={{ width: '75%' }} />
            </div>
          </div>
        );
    }
  }

  function renderShowcaseDemo() {
    switch (activeFeatureId) {
      case 'project-hub': {
        const filtered = DEMO_PROJECTS.filter(
          (item) => projectFilter === 'All' || item.status === projectFilter
        );
        return (
          <div className="showcase-workspace-frame">
            <div className="showcase-toolbar">
              <span className="vx-demo-badge">Interactive Project Preview</span>
              <div className="showcase-filter-pills" role="group" aria-label="Filter preview projects">
                {['All', 'Open', 'In Progress', 'Completed'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`showcase-filter-btn ${projectFilter === status ? 'active' : ''}`}
                    onClick={() => setProjectFilter(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            <div className="showcase-demo-grid">
              {filtered.map((item) => (
                <div className="showcase-item-box" key={item.title}>
                  <div className="mini-preview-row">
                    <span className="vx-pill-tag">{item.category}</span>
                    <span className={`vx-pill-tag ${item.status === 'Completed' ? 'success' : 'accent'}`}>
                      {item.status}
                    </span>
                  </div>
                  <h4>{item.title}</h4>
                  <p>Team status: {item.team} · File upload &amp; milestone feedback enabled upon joining.</p>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'collaboration':
        return (
          <div className="showcase-workspace-frame">
            <div className="showcase-toolbar">
              <span className="vx-demo-badge">Company Challenge Preview</span>
              <span className="vx-pill-tag accent">Company Track</span>
            </div>
            <div className="showcase-demo-grid">
              <div className="showcase-item-box">
                <div className="mini-preview-row">
                  <span className="vx-pill-tag accent">Cloud Infrastructure</span>
                  <span className="vx-pill-tag">Team Ready</span>
                </div>
                <h4>Real-Time Telemetry Pipeline Challenge</h4>
                <p>Design an ingestion endpoint, stream validation rules, and clean monitoring view aligned with partner specifications.</p>
              </div>
              <div className="showcase-item-box">
                <h4>Challenge Specifications</h4>
                <p>Deliverables: Source bundle, documentation notes, and milestone submission inside the VERTEX workspace.</p>
                <div className="preview-skills-row">
                  <span className="vx-pill-tag">Node.js</span>
                  <span className="vx-pill-tag">PostgreSQL</span>
                  <span className="vx-pill-tag">REST API</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'rankings':
        return (
          <div className="showcase-workspace-frame">
            <div className="showcase-toolbar">
              <span className="vx-demo-badge">Leaderboard Preview</span>
              <div className="showcase-filter-pills">
                {['Podium', 'Standings'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`showcase-filter-btn ${rankingView === mode ? 'active' : ''}`}
                    onClick={() => setRankingView(mode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            {rankingView === 'Podium' ? (
              <div className="showcase-demo-grid">
                {[
                  { rank: '#1', label: 'Top Contributor (Preview)', badge: 'Apex Builder', note: 'Consistent verified submissions' },
                  { rank: '#2', label: 'Rising Collaborator (Preview)', badge: 'Core Engineer', note: 'Team challenge delivery' }
                ].map((entry) => (
                  <div className="showcase-item-box" key={entry.rank}>
                    <div className="mini-preview-row">
                      <span className="vx-pill-tag accent">{entry.rank}</span>
                      <span className="vx-pill-tag">{entry.badge}</span>
                    </div>
                    <h4>{entry.label}</h4>
                    <p>{entry.note}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="showcase-demo-grid">
                <div className="showcase-item-box">
                  <h4>Score Calculation</h4>
                  <p>Rankings update directly from completed projects and verified scoring criteria stored in the database.</p>
                </div>
                <div className="showcase-item-box">
                  <h4>Recognition Tiers</h4>
                  <p>Earn leaderboard badges and showcase verifiable standing across monthly ranking cycles.</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'rewards':
        return (
          <div className="showcase-workspace-frame">
            <div className="showcase-toolbar">
              <span className="vx-demo-badge">Wallet Experience Preview</span>
              <div className="showcase-filter-pills">
                {['All', 'Earned', 'Pending'].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={`showcase-filter-btn ${walletFilter === filter ? 'active' : ''}`}
                    onClick={() => setWalletFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            <div className="showcase-demo-grid">
              <div className="showcase-item-box">
                <div className="mini-preview-row">
                  <span>Coin Ledger View</span>
                  <Coins size={16} aria-hidden="true" />
                </div>
                <h4>Platform Activity Ledger</h4>
                <p>Shows database-tracked coin balances and project reward history transparently inside your personal wallet.</p>
              </div>
              <div className="showcase-item-box">
                <div className="mini-preview-row">
                  <span>Filter: {walletFilter}</span>
                  <span className="vx-pill-tag accent">Transparent History</span>
                </div>
                <h4>Auditable Milestones</h4>
                <p>Each coin reward entry ties directly to a reviewed project submission and its verification status.</p>
              </div>
            </div>
          </div>
        );

      case 'skill-showcase':
        return (
          <div className="showcase-workspace-frame">
            <div className="showcase-toolbar">
              <span className="vx-demo-badge">Developer Profile Preview</span>
              <div className="showcase-filter-pills">
                {['All', 'Frontend', 'Systems'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`showcase-filter-btn ${skillFilter === tag ? 'active' : ''}`}
                    onClick={() => setSkillFilter(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div className="showcase-demo-grid">
              <div className="showcase-item-box">
                <div className="mini-preview-row">
                  <strong>Sample Builder Profile</strong>
                  <span className="vx-pill-tag success">Verified Projects</span>
                </div>
                <p>Highlights completed projects, demonstrated stacks, and milestone history in a clean profile view.</p>
                <div className="preview-skills-row">
                  {(skillFilter === 'All' || skillFilter === 'Frontend') && <span className="vx-pill-tag accent">React UI</span>}
                  {(skillFilter === 'All' || skillFilter === 'Systems') && <span className="vx-pill-tag accent">API Architecture</span>}
                  <span className="vx-pill-tag">Git Workflows</span>
                </div>
              </div>
              <div className="showcase-item-box">
                <h4>Proof Over Claims</h4>
                <p>Rather than static resume keywords, every showcased skill links directly to real work completed on VERTEX.</p>
              </div>
            </div>
          </div>
        );

      case 'progress':
      default:
        return (
          <div className="showcase-workspace-frame">
            <div className="showcase-toolbar">
              <span className="vx-demo-badge">Interactive Milestone Preview</span>
              <span className="vx-pill-tag accent">{milestonePercent}% Complete</span>
            </div>
            <div className="mini-progress-track">
              <div className="mini-progress-fill" style={{ width: `${milestonePercent}%` }} />
            </div>
            <div className="showcase-demo-grid">
              {DEMO_MILESTONES.map((milestone) => {
                const done = Boolean(checkedMilestones[milestone.id]);
                return (
                  <button
                    key={milestone.id}
                    type="button"
                    className={`showcase-checklist-btn ${done ? 'checked' : ''}`}
                    onClick={() => toggleMilestone(milestone.id)}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      {done ? <CheckCircle2 size={16} color="#86efac" /> : <Circle size={16} color="#c084fc" />}
                      <span>{milestone.label}</span>
                    </span>
                    <span className={`vx-pill-tag ${done ? 'success' : ''}`}>
                      {done ? 'Checked' : milestone.status}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
    }
  }

  return (
    <main className="public-page features-page">
      <PublicNavigation activePage="features" setPage={setPage} />
      <CinematicScene className="public-cinematic-scene" />

      {/* Section 1: Hero */}
      <section className="vx-section features-hero">
        <div className="features-hero-inner">
          <div className="about-kicker-pill">
            <Sparkles size={13} aria-hidden="true" />
            <span>PLATFORM CAPABILITIES</span>
          </div>
          <h1 className="features-hero-title">
            Everything you need to <span className="highlight-gradient">build your future.</span>
          </h1>
          <p className="features-hero-desc">
            Discover projects, collaborate with companies, showcase your skills, track your progress, and turn your work into meaningful opportunities.
          </p>
          <div className="features-hero-actions">
            <button className="vertex-action" type="button" onClick={() => setPage('projects')}>
              <Rocket size={17} aria-hidden="true" />
              <span>Explore Projects</span>
              <ArrowRight size={17} aria-hidden="true" />
            </button>
            <button className="vertex-action-ghost" type="button" onClick={() => setPage('ecosystem')}>
              <Layers size={16} aria-hidden="true" />
              <span>Discover VERTEX</span>
            </button>
          </div>

          <div className="features-capability-strip" aria-label="Platform highlights">
            <div className="capability-chip">
              <FolderGit2 size={17} aria-hidden="true" />
              <span>Project Discovery</span>
            </div>
            <div className="capability-chip">
              <Building2 size={17} aria-hidden="true" />
              <span>Company Challenges</span>
            </div>
            <div className="capability-chip">
              <Trophy size={17} aria-hidden="true" />
              <span>Transparent Rankings</span>
            </div>
            <div className="capability-chip">
              <BarChart3 size={17} aria-hidden="true" />
              <span>Milestone Tracking</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Core Features (6 Cards) */}
      <section className="vx-section vx-reveal" id="vertex-features-section" aria-label="Core Features">
        <div className="section-header-centered">
          <p className="public-kicker">WHAT YOU CAN DO WITH VERTEX</p>
          <h2 className="section-title">
            Six Core <span>Modules</span>
          </h2>
          <p className="section-subtitle">
            Each workspace module connects directly into one unified builder journey. Select any card to preview it interactively below.
          </p>
        </div>

        <div className="features-core-grid">
          {CORE_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.id}
                className="vx-glass-card vx-glass-card-interactive feature-module-card"
                onClick={() => selectAndScrollToShowcase(feature.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectAndScrollToShowcase(feature.id);
                  }
                }}
              >
                <div className="feature-module-head">
                  <div className="feature-module-icon">
                    <Icon size={21} aria-hidden="true" />
                  </div>
                  <span className="vx-demo-badge">Preview</span>
                </div>
                <h3 className="feature-module-title">{feature.title}</h3>
                <p className="feature-module-desc">{feature.description}</p>
                {renderMiniPreview(feature.id)}
                <span className="feature-card-footer-link">
                  <span>Inspect in showcase</span>
                  <ChevronRight size={15} aria-hidden="true" />
                </span>
              </article>
            );
          })}
        </div>
      </section>

      {/* Section 3: Interactive Feature Showcase */}
      <section className="vx-section vx-reveal" id="features-showcase" aria-label="Interactive Feature Showcase">
        <div className="section-header-centered">
          <p className="public-kicker">PRODUCT DEMONSTRATION</p>
          <h2 className="section-title">
            Interactive <span>Feature Showcase</span>
          </h2>
          <p className="section-subtitle">
            Switch between VERTEX capabilities on the left to inspect how projects, collaborations, rankings, and progress tracking fit together.
          </p>
        </div>

        <div className="vx-glass-card features-showcase-shell">
          <div className="showcase-selector-rail" role="tablist" aria-label="Select VERTEX feature">
            {CORE_FEATURES.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeFeatureId;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`showcase-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveFeatureId(item.id)}
                >
                  <div className="showcase-tab-icon">
                    <Icon size={17} aria-hidden="true" />
                  </div>
                  <div className="showcase-tab-meta">
                    <strong>{item.tabLabel}</strong>
                    <span>{item.shortDesc}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="showcase-demo-panel" role="tabpanel">
            <div className="showcase-stage-inner" key={activeFeature.id}>
              <div className="showcase-demo-top">
                <div>
                  <span className="vx-pill-tag accent">Active Module</span>
                  <h3 className="showcase-demo-title">{activeFeature.title}</h3>
                  <p className="showcase-demo-desc">{activeFeature.description}</p>
                </div>
              </div>

              {renderShowcaseDemo()}

              <div className="showcase-demo-footer">
                <span className="showcase-footer-note">
                  Illustrative UI preview &mdash; live workspace data loads once signed in.
                </span>
                <button
                  type="button"
                  className="vertex-action"
                  onClick={() => setPage(activeFeature.actionRoute)}
                >
                  <span>{activeFeature.actionLabel}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: How VERTEX Works */}
      <section className="vx-section vx-reveal" aria-label="How VERTEX Works">
        <div className="section-header-centered">
          <p className="public-kicker">END-TO-END WORKFLOW</p>
          <h2 className="section-title">
            How <span>VERTEX</span> Works
          </h2>
          <p className="section-subtitle">
            A clear, structured path from discovering your first challenge to building lasting proof of your capabilities.
          </p>
        </div>

        <div className="workflow-timeline">
          {WORKFLOW_STEPS.map((item, idx) => {
            const Icon = item.icon;
            const hasArrow = idx < WORKFLOW_STEPS.length - 1;
            return (
              <article className="vx-glass-card vx-glass-card-interactive workflow-step-card" key={item.title}>
                <div className="workflow-step-top">
                  <div className="workflow-step-badge">
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  {hasArrow ? (
                    <span className="workflow-step-arrow" aria-hidden="true">
                      <ArrowRight size={18} />
                    </span>
                  ) : null}
                </div>
                <span className="workflow-step-label">STEP {item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Section 5: Value Proposition */}
      <section className="vx-section vx-reveal" aria-label="What You Gain">
        <div className="section-header-centered">
          <p className="public-kicker">VALUE PROPOSITION</p>
          <h2 className="section-title">
            Built for <span>Meaningful Growth</span>
          </h2>
          <p className="section-subtitle">
            VERTEX focuses on practical execution, collaborative habits, and transparent portfolio proof.
          </p>
        </div>

        <div className="value-grid">
          {VALUE_PROPOSITIONS.map((item) => {
            const Icon = item.icon;
            return (
              <article className="vx-glass-card vx-glass-card-interactive value-card" key={item.title}>
                <div className="value-icon-box">
                  <Icon size={19} aria-hidden="true" />
                </div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Section 6: Final CTA */}
      <section className="vx-section vx-reveal" aria-label="Get Started">
        <div className="vx-glass-card vx-final-cta-card">
          <div className="about-kicker-pill">
            <Award size={13} aria-hidden="true" />
            <span>READY TO START</span>
          </div>
          <h2>
            Your next project could <span className="highlight-gradient">change your future.</span>
          </h2>
          <p>Start building, collaborating, and showcasing your potential.</p>
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

      {/* Public Footer */}
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
