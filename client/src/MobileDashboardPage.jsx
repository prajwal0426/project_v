import {
  ArrowRight, Bell, BriefcaseBusiness, Building2, CheckCircle2, Code2, Coins,
  FileText, IndianRupee, Layers3, Plus, ShieldCheck, Trophy, Users, Wallet, Zap
} from 'lucide-react';
import EmptyState from './components/EmptyState.jsx';
import LoadingState from './components/LoadingState.jsx';
import { useAppData } from './context/AppDataContext.jsx';
import { useAuth } from './context/AuthContext.jsx';
import useApiResource from './hooks/useApiResource.js';

function money(value) {
  return `₹${Number(value ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function Stat({ icon: Icon, label, value, detail }) {
  return (
    <article className="mobile-stat glass">
      <div className="mobile-stat-icon"><Icon size={19} aria-hidden="true" /></div>
      <div className="mobile-stat-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}

function Action({ icon: Icon, children, onClick, primary = false }) {
  return (
    <button className={`mobile-action${primary ? ' is-primary' : ''}`} type="button" onClick={onClick}>
      <Icon size={18} aria-hidden="true" />
      <span>{children}</span>
      <ArrowRight size={16} aria-hidden="true" />
    </button>
  );
}

export default function MobileDashboardPage({ page, setPage }) {
  const { user, token } = useAuth();
  const role = user?.role || (page === 'company' ? 'company' : page === 'admin' ? 'admin' : 'user');
  const { wallet, rankings, projects, notifications, dashboard, loadDashboard, loadProjects, loadRankings } = useAppData();
  const { loading, error } = useApiResource(async () => {
    if (role === 'user') {
      await Promise.all([loadDashboard('user', token), loadProjects(), loadRankings()]);
    } else {
      await loadDashboard(role, token);
    }
  }, [role, token]);

  const completedProjects = projects.filter((project) => project?.status === 'completed').length;
  const progress = projects.length ? Math.round((completedProjects / projects.length) * 100) : 0;
  const firstRank = rankings?.[0];
  const isAdmin = role === 'admin';
  const isCompany = role === 'company';
  const displayName = user?.name || (isAdmin ? 'Administrator' : isCompany ? 'Company workspace' : 'VERTEX member');
  const title = isAdmin ? 'Admin overview' : isCompany ? 'Company overview' : 'Your dashboard';

  const stats = isAdmin ? [
    { icon: Users, label: 'Users', value: Number(dashboard?.users ?? 0).toLocaleString(), detail: 'Registered accounts' },
    { icon: Building2, label: 'Companies', value: Number(dashboard?.companies ?? 0).toLocaleString(), detail: 'Registered companies' },
    { icon: Wallet, label: 'Pending withdrawals', value: money(dashboard?.pending_withdrawals), detail: 'INR review queue' }
  ] : isCompany ? [
    { icon: BriefcaseBusiness, label: 'Projects', value: projects.length, detail: 'Owned by your company' },
    { icon: Users, label: 'Submissions', value: projects.reduce((total, project) => total + Number(project?.submissions ?? 0), 0), detail: 'Across your projects' },
    { icon: CheckCircle2, label: 'Completed', value: completedProjects, detail: 'Completed projects' }
  ] : [
    { icon: Coins, label: 'Coin balance', value: Number(wallet?.coins ?? 0).toLocaleString(), detail: 'VERTEX Coins' },
    { icon: IndianRupee, label: 'Rupee balance', value: money(wallet?.inr), detail: 'Available wallet value' },
    { icon: Trophy, label: 'Current rank', value: firstRank ? `#${firstRank.rank ?? 1}` : '-', detail: firstRank?.badge || 'No ranking yet' },
    { icon: Code2, label: 'Projects', value: projects.length, detail: 'Your project activity' }
  ];

  const actions = isAdmin ? [
    { icon: Users, label: 'Manage users', page: 'admin-users' },
    { icon: Building2, label: 'Manage companies', page: 'admin-companies' },
    { icon: FileText, label: 'Open reports', page: 'admin-reports' }
  ] : isCompany ? [
    { icon: BriefcaseBusiness, label: 'Manage projects', page: 'projects', primary: true },
    { icon: Bell, label: 'Notifications', page: 'notifications' }
  ] : [
    { icon: Plus, label: 'Browse projects', page: 'projects', primary: true },
    { icon: Trophy, label: 'View rankings', page: 'rankings' },
    { icon: Wallet, label: 'Open wallet', page: 'wallet' }
  ];

  return (
    <section className="mobile-page mobile-dashboard-page">
      <header className="mobile-welcome glass">
        <span className="mobile-eyebrow"><Zap size={13} aria-hidden="true" />{title}</span>
        <h1>Welcome, {displayName}</h1>
        <p>{isAdmin ? 'Manage VERTEX activity and accounts.' : isCompany ? 'Keep your projects and participants moving.' : 'Build projects, earn rewards and climb the rankings.'}</p>
        {isCompany ? (
          <Action icon={BriefcaseBusiness} primary onClick={() => setPage('projects')}>Open company projects</Action>
        ) : null}
      </header>

      {loading ? <LoadingState label="Loading dashboard..." /> : null}
      {error ? <EmptyState title="Dashboard data unavailable" message={error} /> : null}

      <section className="mobile-stat-grid" aria-label="Account summary">
        {stats.map((stat) => <Stat key={stat.label} {...stat} />)}
      </section>

      {!isAdmin ? (
        <section className="mobile-panel glass mobile-progress-panel">
          <div className="mobile-section-heading"><div><span className="mobile-eyebrow">PROGRESS</span><h2>Project progress</h2></div><strong>{progress}%</strong></div>
          <div className="mobile-progress-track" role="progressbar" aria-label="Completed project progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>
          <p>{completedProjects} of {projects.length} projects completed</p>
        </section>
      ) : null}

      <section className="mobile-panel mobile-quick-actions">
        <div className="mobile-section-heading"><div><span className="mobile-eyebrow">SHORTCUTS</span><h2>Quick actions</h2></div><Zap size={19} aria-hidden="true" /></div>
        {actions.map((action) => <Action key={action.page} icon={action.icon} primary={action.primary} onClick={() => setPage(action.page)}>{action.label}</Action>)}
      </section>

      {!isAdmin ? (
        <>
          <section className="mobile-panel glass">
            <div className="mobile-section-heading"><div><span className="mobile-eyebrow">LATEST</span><h2>Notifications</h2></div><button type="button" className="mobile-text-action" onClick={() => setPage('notifications')}>See all</button></div>
            {notifications?.length ? notifications.slice(0, 3).map((notification) => (
              <article className="mobile-list-row" key={notification.id || notification.title}>
                <Bell size={17} aria-hidden="true" />
                <div><strong>{notification.title || 'Notification'}</strong><p>{notification.body || 'No details provided'}</p></div>
              </article>
            )) : <p className="mobile-empty-copy">No notifications yet.</p>}
          </section>

          <section className="mobile-panel glass">
            <div className="mobile-section-heading"><div><span className="mobile-eyebrow">WORKSPACE</span><h2>{isCompany ? 'My projects' : 'Recent projects'}</h2></div><button type="button" className="mobile-text-action" onClick={() => setPage('projects')}>See all</button></div>
            {projects?.length ? projects.slice(0, 3).map((project) => (
              <article className="mobile-list-row" key={project.id || project.title}>
                <Layers3 size={17} aria-hidden="true" />
                <div><strong>{project.title || 'Untitled project'}</strong><p>{project.status || 'open'}{project.reward_pool_inr ? ` · ${money(project.reward_pool_inr)}` : ''}</p></div>
              </article>
            )) : <div className="mobile-empty-copy"><p>No projects yet.</p><button type="button" className="mobile-inline-action" onClick={() => setPage('projects')}>Explore projects <ArrowRight size={15} /></button></div>}
          </section>
        </>
      ) : (
        <section className="mobile-panel glass">
          <div className="mobile-section-heading"><div><span className="mobile-eyebrow">ADMIN TOOLS</span><h2>Platform operations</h2></div><ShieldCheck size={19} aria-hidden="true" /></div>
          <button type="button" className="mobile-action" onClick={() => setPage('admin-notifications')}><Bell size={18} /><span>Notification management</span><ArrowRight size={16} /></button>
          <button type="button" className="mobile-action" onClick={() => setPage('admin-audit')}><ClipboardList size={18} /><span>Audit logs</span><ArrowRight size={16} /></button>
        </section>
      )}
    </section>
  );
}
