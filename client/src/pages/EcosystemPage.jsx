import {
  ArrowRight,
  Award,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Code2,
  Coins,
  Compass,
  FolderGit2,
  GitBranch,
  GraduationCap,
  Layers,
  Lightbulb,
  MessageSquare,
  Network,
  Rocket,
  Sparkles,
  TrendingUp,
  Trophy,
  Upload,
  UserRound,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import CinematicScene from '../components/CinematicScene.jsx';
import PublicNavigation from '../components/PublicNavigation.jsx';
import '../styles/public-pages.css';

const ECOSYSTEM_NODES = {
  students: {
    id: 'students',
    label: 'STUDENTS / DEVELOPERS',
    sublabel: 'Central Builders Hub',
    title: 'Students & Developers',
    summary:
      'Students discover projects, collaborate with peers, develop practical engineering skills, build portfolios, and demonstrate their capabilities through real output.',
    connectedTo: ['projects', 'companies', 'outcomes'],
    connections: [
      'Join active Projects to apply engineering skills in real collaborative teams.',
      'Engage with Company Challenges to demonstrate capability directly through submitted code.',
      'Build verifiable Outcomes across Experience, Recognition, Portfolio growth, and Rewards.'
    ],
    actionLabel: 'Explore Builder Experience',
    actionRoute: 'features',
    icon: GraduationCap,
    posClass: 'node-students'
  },
  projects: {
    id: 'projects',
    label: 'PROJECTS',
    sublabel: 'The Shared Bridge',
    title: 'Projects Connect Ideas & Execution',
    summary:
      'Projects bring people, ideas, collaborative teams, and real deliverables together into a measurable workflow from concept to verified completion.',
    connectedTo: ['students', 'companies', 'outcomes'],
    connections: [
      'Give Students structured challenges, milestones, and team collaboration workflows.',
      'Allow Companies to host real-world problem statements and evaluate completed submissions.',
      'Convert delivered code and feedback into lasting Portfolio items and Recognition.'
    ],
    actionLabel: 'Explore Projects',
    actionRoute: 'projects',
    icon: FolderGit2,
    posClass: 'node-projects'
  },
  companies: {
    id: 'companies',
    label: 'COMPANIES',
    sublabel: 'Challenges & Discovery',
    title: 'Companies & Industry Partners',
    summary:
      'Companies introduce technical challenges, collaborate alongside student teams, and discover emerging talent based on demonstrated project work rather than resumes alone.',
    connectedTo: ['students', 'projects', 'outcomes'],
    connections: [
      'Publish real-world project briefs tailored to technical skills that matter.',
      'Connect directly with Students delivering verified milestones and clean implementations.',
      'Foster meaningful project experiences that surface genuine engineering aptitude.'
    ],
    actionLabel: 'View Company Space',
    actionRoute: 'company',
    icon: Building2,
    posClass: 'node-companies'
  },
  outcomes: {
    id: 'outcomes',
    label: 'OUTCOMES',
    sublabel: 'Tangible Proof & Value',
    title: 'Verified Ecosystem Outcomes',
    summary:
      'Completed projects produce cumulative proof: hands-on experience, leaderboard recognition, portfolio growth, collaboration history, rewards, and new opportunities.',
    connectedTo: ['students', 'projects', 'companies'],
    connections: [
      'Experience & Portfolio growth strengthened with every reviewed milestone.',
      'Recognition & Rewards tracked transparently through rankings and coin balances.',
      'Collaboration & Opportunities arising naturally from visible, verified work.'
    ],
    actionLabel: 'View Rankings',
    actionRoute: 'rankings',
    icon: Award,
    posClass: 'node-outcomes'
  }
};

const NETWORK_EDGES = [
  { id: 'students-projects', from: 'students', to: 'projects', d: 'M 50 50 Q 32 38 20 19' },
  { id: 'students-companies', from: 'students', to: 'companies', d: 'M 50 50 Q 68 38 80 19' },
  { id: 'students-outcomes', from: 'students', to: 'outcomes', d: 'M 50 50 L 50 84' },
  { id: 'projects-companies', from: 'projects', to: 'companies', d: 'M 20 19 Q 50 11 80 19' },
  { id: 'projects-outcomes', from: 'projects', to: 'outcomes', d: 'M 20 19 Q 22 62 50 84' },
  { id: 'companies-outcomes', from: 'companies', to: 'outcomes', d: 'M 80 19 Q 78 62 50 84' }
];

const LIFECYCLE_STAGES = [
  {
    step: '01',
    key: 'IDEA',
    label: 'IDEA',
    title: 'Challenge & Concept Framing',
    detail: 'A technical brief or product idea defines clear scope, skills, and expected outcomes.',
    progress: 16,
    status: 'Scoped',
    icon: Lightbulb
  },
  {
    step: '02',
    key: 'TEAM',
    label: 'TEAM',
    title: 'Collaborative Formation',
    detail: 'Builders align around complementary roles across frontend, backend, and architecture.',
    progress: 34,
    status: 'Team Ready',
    icon: Users
  },
  {
    step: '03',
    key: 'BUILD',
    label: 'BUILD',
    title: 'Active Implementation',
    detail: 'Teams iterate on code, architecture, and integrations while tracking shared milestones.',
    progress: 62,
    status: 'In Progress',
    icon: Code2
  },
  {
    step: '04',
    key: 'SUBMIT',
    label: 'SUBMIT',
    title: 'Deliverable Packaging',
    detail: 'Completed source artifacts and documentation are uploaded into the VERTEX submission flow.',
    progress: 80,
    status: 'Submitted',
    icon: Upload
  },
  {
    step: '05',
    key: 'FEEDBACK',
    label: 'FEEDBACK',
    title: 'Structured Evaluation',
    detail: 'Submissions are reviewed against project criteria with actionable engineering feedback.',
    progress: 92,
    status: 'Reviewed',
    icon: MessageSquare
  },
  {
    step: '06',
    key: 'ACHIEVEMENT',
    label: 'ACHIEVEMENT',
    title: 'Verified Proof & Recognition',
    detail: 'Completed work records into your portfolio, leaderboard points, and wallet rewards.',
    progress: 100,
    status: 'Completed',
    icon: Trophy
  }
];

const OUTCOMES_LIST = [
  {
    title: 'Experience',
    desc: 'Hands-on problem solving on multi-step technical projects that sharpen practical engineering judgment.',
    icon: Compass
  },
  {
    title: 'Recognition',
    desc: 'Visible standing on transparent monthly rankings and achievement badges earned from verified work.',
    icon: Trophy
  },
  {
    title: 'Portfolio',
    desc: 'A living track record of completed deliverables demonstrating real architecture and execution.',
    icon: FolderGit2
  },
  {
    title: 'Rewards',
    desc: 'Coin rewards and activity credits tracked cleanly through the VERTEX wallet experience.',
    icon: Coins
  },
  {
    title: 'Company connections',
    desc: 'Direct engagement with organizations hosting challenges and reviewing builder submissions.',
    icon: Building2
  },
  {
    title: 'Opportunities',
    desc: 'Ongoing invitations to collaborate on deeper challenges as your body of verified work grows.',
    icon: Sparkles
  }
];

const GROWTH_LOOP_NODES = [
  { step: '01', label: 'STUDENTS', desc: 'Ambitious learners and builders enter the platform ready to create.' },
  { step: '02', label: 'BUILD PROJECTS', desc: 'Students collaborate in teams on practical technical briefs and products.' },
  { step: '03', label: 'DEMONSTRATE SKILLS', desc: 'Submitted code, milestones, and reviews prove capability objectively.' },
  { step: '04', label: 'COMPANIES DISCOVER TALENT', desc: 'Organizations evaluate real delivered work rather than static resumes.' },
  { step: '05', label: 'COLLABORATION', desc: 'Builders and companies engage around meaningful technical challenges.' },
  { step: '06', label: 'NEW PROJECTS', desc: 'Fresh initiatives and real-world challenges continuously enter the ecosystem.' },
  { step: '07', label: 'STUDENT GROWTH', desc: 'Rising experience, confidence, and portfolio proof propel each builder forward.' }
];

export default function EcosystemPage({ setPage }) {
  const [selectedNodeId, setSelectedNodeId] = useState('students');
  const [activeStageIdx, setActiveStageIdx] = useState(2);
  const [activeLoopIdx, setActiveLoopIdx] = useState(0);

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

  const selectedNode = ECOSYSTEM_NODES[selectedNodeId] || ECOSYSTEM_NODES.students;
  const activeStage = LIFECYCLE_STAGES[activeStageIdx] || LIFECYCLE_STAGES[0];
  const activeLoopNode = GROWTH_LOOP_NODES[activeLoopIdx] || GROWTH_LOOP_NODES[0];

  return (
    <main className="public-page ecosystem-page">
      <PublicNavigation activePage="ecosystem" setPage={setPage} />
      <CinematicScene className="public-cinematic-scene" />

      {/* Section 1: Ecosystem Hero (No giant 3D logo — focuses on interconnected constellation) */}
      <section className="vx-section ecosystem-hero">
        <div className="ecosystem-hero-backdrop" aria-hidden="true">
          <svg className="ecosystem-hero-svg" viewBox="0 0 1200 480" fill="none">
            <path d="M120 340 Q 380 120 600 220 T 1080 160" stroke="rgba(192, 132, 252, 0.25)" strokeWidth="1.5" strokeDasharray="6 8" />
            <path d="M180 140 Q 480 320 760 190 T 1060 330" stroke="rgba(168, 85, 247, 0.2)" strokeWidth="1.2" strokeDasharray="5 7" />
            <circle cx="180" cy="140" r="4" fill="#c084fc" />
            <circle cx="600" cy="220" r="5" fill="#e9d5ff" />
            <circle cx="760" cy="190" r="4" fill="#a855f7" />
            <circle cx="1060" cy="330" r="4" fill="#c084fc" />
          </svg>
        </div>

        <div className="ecosystem-hero-inner">
          <div className="about-kicker-pill">
            <Network size={13} aria-hidden="true" />
            <span>THE VERTEX NETWORK</span>
          </div>
          <h1 className="ecosystem-hero-title">
            One ecosystem. <span className="highlight-gradient">Endless possibilities.</span>
          </h1>
          <p className="ecosystem-hero-desc">
            Students, projects, companies, and opportunities connected through a platform built to turn potential into progress.
          </p>
          <div className="features-hero-actions">
            <button
              className="vertex-action"
              type="button"
              onClick={() => {
                const el = document.getElementById('ecosystem-network');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
            >
              <Network size={17} aria-hidden="true" />
              <span>Explore the Network</span>
            </button>
            <button className="vertex-action-ghost" type="button" onClick={() => setPage('projects')}>
              <span>Explore Projects</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Section 2: Interactive Ecosystem Network */}
      <section className="vx-section vx-reveal" id="ecosystem-network" aria-label="Interactive Ecosystem Network">
        <div className="section-header-centered">
          <p className="public-kicker">INTERCONNECTED ARCHITECTURE</p>
          <h2 className="section-title">
            How Everything <span>Connects</span>
          </h2>
          <p className="section-subtitle">
            Select any node in the VERTEX network to inspect its role and see how value flows between students, projects, companies, and outcomes.
          </p>
        </div>

        <div className="ecosystem-network-layout">
          {/* Interactive Topology Canvas */}
          <div className="vx-glass-card network-canvas-card">
            <svg className="network-svg-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {NETWORK_EDGES.map((edge) => {
                const isConnected = edge.from === selectedNodeId || edge.to === selectedNodeId;
                return (
                  <path
                    key={edge.id}
                    d={edge.d}
                    className={`network-edge-line ${isConnected ? 'active' : ''}`}
                  />
                );
              })}
            </svg>

            <div className="network-nodes-stage" role="group" aria-label="Ecosystem network nodes">
              {Object.values(ECOSYSTEM_NODES).map((node) => {
                const Icon = node.icon;
                const isActive = node.id === selectedNodeId;
                const isConnected = selectedNode.connectedTo.includes(node.id);
                return (
                  <button
                    key={node.id}
                    type="button"
                    className={`network-node-btn ${node.posClass} ${isActive ? 'active' : ''} ${isConnected ? 'connected' : ''}`}
                    onClick={() => setSelectedNodeId(node.id)}
                    aria-pressed={isActive}
                  >
                    <div className="network-node-icon">
                      <Icon size={18} aria-hidden="true" />
                    </div>
                    <strong>{node.label}</strong>
                    <span>{node.sublabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Node Detail Glass Panel */}
          <aside className="vx-glass-card network-info-panel" aria-live="polite">
            <div key={selectedNode.id} className="showcase-stage-inner">
              <div>
                <span className="vx-pill-tag accent">Selected Node</span>
                <h3 className="network-info-title">{selectedNode.title}</h3>
                <p className="network-info-desc">{selectedNode.summary}</p>
              </div>

              <div className="network-connections-list">
                {selectedNode.connections.map((line) => (
                  <div className="network-connection-item" key={line}>
                    <CheckCircle2 size={16} aria-hidden="true" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="showcase-demo-footer">
              <span className="showcase-footer-note">Tap any node to inspect its connections</span>
              <button
                type="button"
                className="vertex-action"
                onClick={() => setPage(selectedNode.actionRoute)}
              >
                <span>{selectedNode.actionLabel}</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </aside>
        </div>
      </section>

      {/* Section 3: Students */}
      <section className="vx-section vx-reveal" aria-label="For Students">
        <div className="ecosystem-split">
          <div className="ecosystem-split-copy">
            <span className="vx-pill-tag accent">FOR STUDENTS &amp; DEVELOPERS</span>
            <h2>Potential becomes progress.</h2>
            <p>
              VERTEX gives builders a structured environment to move beyond solo exercises: discover real projects, join collaborative teams, receive meaningful feedback, and turn completed milestones into a clear professional identity.
            </p>
            <ul className="ecosystem-bullet-list">
              <li><CheckCircle2 size={16} aria-hidden="true" /><span>Discover projects &amp; briefs</span></li>
              <li><CheckCircle2 size={16} aria-hidden="true" /><span>Join collaborative teams</span></li>
              <li><CheckCircle2 size={16} aria-hidden="true" /><span>Build real projects</span></li>
              <li><CheckCircle2 size={16} aria-hidden="true" /><span>Receive structured feedback</span></li>
              <li><CheckCircle2 size={16} aria-hidden="true" /><span>Showcase achievements</span></li>
              <li><CheckCircle2 size={16} aria-hidden="true" /><span>Build lasting portfolios</span></li>
            </ul>
          </div>

          <div className="vx-glass-card ecosystem-preview-card">
            <div className="preview-profile-header">
              <div className="preview-avatar-group">
                <div className="preview-avatar-circle">AB</div>
                <div>
                  <strong style={{ display: 'block', color: '#ffffff' }}>Student Builder Profile</strong>
                  <span className="mini-preview-muted">Full-Stack Track · Verified Portfolio</span>
                </div>
              </div>
              <span className="vx-demo-badge">Illustrative Preview</span>
            </div>

            <div className="preview-skills-row">
              <span className="vx-pill-tag accent">React &amp; UI Architecture</span>
              <span className="vx-pill-tag">Node.js APIs</span>
              <span className="vx-pill-tag">Database Design</span>
              <span className="vx-pill-tag">Team Delivery</span>
            </div>

            <div className="preview-metrics-row">
              <div className="preview-stat-box">
                <span>Projects</span>
                <strong>4 Completed</strong>
              </div>
              <div className="preview-stat-box">
                <span>Achievements</span>
                <strong>Top Tier</strong>
              </div>
              <div className="preview-stat-box">
                <span>Progress</span>
                <strong>86% Track</strong>
              </div>
            </div>

            <div className="feature-mini-preview">
              <div className="mini-preview-row">
                <strong>Portfolio Milestone Progress</strong>
                <span className="vx-pill-tag success">Active</span>
              </div>
              <div className="mini-progress-track">
                <div className="mini-progress-fill" style={{ width: '86%' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Companies */}
      <section className="vx-section vx-reveal" aria-label="For Companies">
        <div className="ecosystem-split reversed">
          <div className="ecosystem-split-copy">
            <span className="vx-pill-tag accent">FOR COMPANIES</span>
            <h2>Connect with emerging talent through real work.</h2>
            <p>
              Companies engage with builders by introducing structured project challenges, collaborating on implementation tracks, and evaluating demonstrated skills directly through completed work.
            </p>
            <ul className="ecosystem-bullet-list">
              <li><CheckCircle2 size={16} aria-hidden="true" /><span>Introduce real challenges</span></li>
              <li><CheckCircle2 size={16} aria-hidden="true" /><span>Collaborate on projects</span></li>
              <li><CheckCircle2 size={16} aria-hidden="true" /><span>Discover talented developers</span></li>
              <li><CheckCircle2 size={16} aria-hidden="true" /><span>Evaluate demonstrated skills</span></li>
            </ul>
          </div>

          <div className="vx-glass-card ecosystem-preview-card">
            <div className="preview-profile-header">
              <div>
                <span className="vx-pill-tag accent">Company Challenge Preview</span>
                <h3 style={{ margin: '8px 0 2px', fontFamily: "'Orbitron', sans-serif", fontSize: '1.06rem', color: '#ffffff' }}>
                  Developer Analytics Dashboard Brief
                </h3>
              </div>
              <span className="vx-demo-badge">Active Challenge</span>
            </div>

            <p className="feature-module-desc">
              Design and deliver a responsive telemetry summary module with role-aware filtering, clean state handling, and documented API integration.
            </p>

            <div>
              <span className="mini-preview-muted" style={{ display: 'block', marginBottom: 6 }}>Required Skills</span>
              <div className="preview-skills-row">
                <span className="vx-pill-tag">Frontend UI</span>
                <span className="vx-pill-tag">REST Integration</span>
                <span className="vx-pill-tag">State Management</span>
              </div>
            </div>

            <div className="feature-mini-preview">
              <div className="mini-preview-row">
                <span>Team Progress (Illustrative)</span>
                <span>72% · In Review</span>
              </div>
              <div className="mini-progress-track">
                <div className="mini-progress-fill" style={{ width: '72%' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Projects — The Bridge */}
      <section className="vx-section vx-reveal" aria-label="Projects Bridge">
        <div className="section-header-centered">
          <p className="public-kicker">THE BRIDGE</p>
          <h2 className="section-title">
            Where ideas become <span>proof.</span>
          </h2>
          <p className="section-subtitle">
            Projects are the meeting point between aspiring builders and organizations—turning shared briefs into verifiable milestones.
          </p>
        </div>

        <div className="bridge-lifecycle-grid" role="tablist" aria-label="Project lifecycle stages">
          {LIFECYCLE_STAGES.map((stage, index) => {
            const Icon = stage.icon;
            const isActive = index === activeStageIdx;
            return (
              <button
                key={stage.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`bridge-stage-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveStageIdx(index)}
              >
                <span className="bridge-stage-num">{stage.step}</span>
                <Icon size={20} aria-hidden="true" />
                <strong>{stage.label}</strong>
              </button>
            );
          })}
        </div>

        <div className="vx-glass-card bridge-preview-banner">
          <div key={activeStage.key} className="showcase-stage-inner">
            <div>
              <span className="vx-pill-tag accent">Lifecycle Stage {activeStage.step}: {activeStage.label}</span>
              <h3 style={{ margin: '10px 0 8px', fontFamily: "'Orbitron', sans-serif", fontSize: '1.25rem', color: '#ffffff' }}>
                {activeStage.title}
              </h3>
              <p className="feature-module-desc">{activeStage.detail}</p>
            </div>
          </div>

          <div className="feature-mini-preview">
            <div className="mini-preview-row">
              <strong>Sample Project: Cloud Metric Explorer</strong>
              <span className="vx-demo-badge">Demo Card</span>
            </div>
            <div className="mini-preview-row mini-preview-muted">
              <span>Category: Full-Stack</span>
              <span>Status: {activeStage.status}</span>
            </div>
            <div className="mini-preview-row mini-preview-muted">
              <span>Team: 3 Collaborators</span>
              <span>{activeStage.progress}% Progress</span>
            </div>
            <div className="mini-progress-track">
              <div className="mini-progress-fill" style={{ width: `${activeStage.progress}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Opportunities & Outcomes */}
      <section className="vx-section vx-reveal" aria-label="Opportunities and Outcomes">
        <div className="section-header-centered">
          <p className="public-kicker">ECOSYSTEM OUTCOMES</p>
          <h2 className="section-title">
            Build something. Let your <span>work speak.</span>
          </h2>
          <p className="section-subtitle">
            Every completed milestone strengthens what matters most: practical capability, recognized proof, and genuine ecosystem connections.
          </p>
        </div>

        <div className="outcomes-grid">
          {OUTCOMES_LIST.map((outcome) => {
            const Icon = outcome.icon;
            return (
              <article className="vx-glass-card vx-glass-card-interactive outcome-card" key={outcome.title}>
                <div className="outcome-card-icon">
                  <Icon size={20} aria-hidden="true" />
                </div>
                <h3>{outcome.title}</h3>
                <p>{outcome.desc}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Section 7: The Ecosystem Growth Loop */}
      <section className="vx-section vx-reveal" aria-label="Ecosystem Growth Loop">
        <div className="section-header-centered">
          <p className="public-kicker">CONTINUOUS MOMENTUM</p>
          <h2 className="section-title">
            Growth creates <span>opportunity.</span>
          </h2>
          <p className="section-subtitle">
            Every project creates experience. Every collaboration creates connections. Every achievement helps the ecosystem grow.
          </p>
        </div>

        <div className="growth-loop-stage">
          <svg className="growth-loop-svg" viewBox="0 0 720 620" aria-hidden="true">
            <defs>
              <linearGradient id="growthLoopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#9333ea" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#e9d5ff" stopOpacity="0.95" />
              </linearGradient>
            </defs>
            <circle cx="360" cy="310" r="222" className="growth-ring-track" />
            <circle cx="360" cy="310" r="222" className="growth-ring-pulse" />
          </svg>

          <div className="vx-glass-card growth-loop-center" aria-live="polite">
            <GitBranch size={20} color="#d8b4fe" aria-hidden="true" />
            <span className="vx-pill-tag accent">Step {activeLoopNode.step}</span>
            <h3>{activeLoopNode.label}</h3>
            <p>{activeLoopNode.desc}</p>
          </div>

          {GROWTH_LOOP_NODES.map((node, index) => {
            const angle = (-Math.PI / 2) + (index * 2 * Math.PI) / GROWTH_LOOP_NODES.length;
            const leftPct = 50 + Math.cos(angle) * 32.5;
            const topPct = 50 + Math.sin(angle) * 37.5;
            const isActive = index === activeLoopIdx;

            return (
              <button
                key={node.label}
                type="button"
                className={`growth-node-card ${isActive ? 'active' : ''}`}
                style={{ left: `${leftPct.toFixed(2)}%`, top: `${topPct.toFixed(2)}%` }}
                onClick={() => setActiveLoopIdx(index)}
                onMouseEnter={() => setActiveLoopIdx(index)}
              >
                <span className="growth-node-step">{node.step}</span>
                <strong>{node.label}</strong>
              </button>
            );
          })}
        </div>
      </section>

      {/* Section 8: Final CTA */}
      <section className="vx-section vx-reveal" aria-label="Join Ecosystem">
        <div className="vx-glass-card vx-final-cta-card">
          <div className="about-kicker-pill">
            <Layers size={13} aria-hidden="true" />
            <span>THE NEXT STEP</span>
          </div>
          <h2>
            Be part of <span className="highlight-gradient">something bigger.</span>
          </h2>
          <p>Build. Collaborate. Showcase. Grow.</p>
          <div className="vx-cta-actions">
            <button className="vertex-action" type="button" onClick={() => setPage('projects')}>
              <Rocket size={17} aria-hidden="true" />
              <span>Explore Projects</span>
              <ArrowRight size={17} aria-hidden="true" />
            </button>
            <button className="vertex-action-ghost" type="button" onClick={() => setPage('register')}>
              <UserRound size={16} aria-hidden="true" />
              <span>Join the Ecosystem</span>
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
