import { Bell, BriefcaseBusiness, Code2, Coins, IndianRupee, Layers3, Plus, Trophy, Wallet, Zap } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ProgressSystem from '../components/ProgressSystem.jsx';
import GlassStatCard from '../components/GlassStatCard.jsx';
import { GlassButton } from '../components/GlassPrimitives.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useApiResource from '../hooks/useApiResource.js';

function formatMoney(value) {
  return `₹${Number(value ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function UserDashboard({ setPage }) {
  const { user, token } = useAuth();
  const { wallet, rankings, projects, notifications, loadDashboard, loadProjects, loadRankings } = useAppData();
  const { loading, error } = useApiResource(async () => {
    await Promise.all([loadDashboard('user', token), loadProjects(), loadRankings()]);
  }, [token]);

  const firstRank = rankings?.[0] ?? null;
  const projectProgress = projects?.length ? Math.round((projects.filter((project) => project?.status === 'completed').length / projects.length) * 100) : 0;

  return (
    <section className="page user-dashboard-page">
      <div className="dash-head glass padded">
        <div>
          <h2>Welcome back, {user?.name || 'VERTEX user'}!</h2>
          <p>Build projects, earn rewards and climb the rankings.</p>
          <div className="dash-hero-actions">
            <GlassButton variant="primary" type="button" onClick={() => setPage('projects')}><Plus size={18} />Create Project</GlassButton>
            <GlassButton type="button" onClick={() => setPage('rankings')}><Trophy size={16} />View Rankings</GlassButton>
          </div>
        </div>
      </div>
      {loading ? <LoadingState /> : null}
      {error ? <EmptyState title="Dashboard data unavailable" message={error} /> : null}
      <div className="metric-grid">
        <GlassStatCard icon={Coins} label="Coin Balance" value={Number(wallet?.coins ?? 0).toLocaleString()} detail="From wallet API" />
        <GlassStatCard icon={IndianRupee} label="Rupee Balance" value={formatMoney(wallet?.inr)} detail="Database balance" />
        <GlassStatCard icon={Trophy} label="Current Rank" value={firstRank ? `#${firstRank.rank ?? 1}` : '-'} detail={firstRank?.badge || 'No ranking yet'} />
        <GlassStatCard icon={Code2} label="Projects" value={projects?.length ?? 0} detail="Available projects" />
      </div>
      <div className="split-grid">
        <ProgressSystem projectProgress={projectProgress} compact />
        <section className="panel glass">
          <div className="panel-heading-row notification-heading">
            <h3><Bell size={20} aria-hidden="true" />Recent Notifications</h3>
            <button className="text-action" type="button" onClick={() => setPage('notifications')}>View All</button>
          </div>
          {notifications?.length ? (
            notifications.map((notification) => (
              <div className="activity" key={notification?.id || notification?.title}>
                <Bell size={18} />
                <div>
                  <strong>{notification?.title || 'Notification'}</strong>
                  <span>{notification?.body || 'No details provided'}</span>
                </div>
                <small>{notification?.created_at ? new Date(notification.created_at).toLocaleDateString() : ''}</small>
              </div>
            ))
          ) : <p className="dashboard-empty-copy">No notifications yet</p>}
        </section>
      </div>
      <section className="panel glass quick-actions-panel">
        <div className="panel-heading-row"><h3><Zap size={18} aria-hidden="true" />Quick Actions</h3></div>
        <div className="quick-actions-grid">
          <GlassButton type="button" onClick={() => setPage('projects')}><Code2 size={19} aria-hidden="true" />Browse Projects <span aria-hidden="true">›</span></GlassButton>
          <GlassButton type="button" onClick={() => setPage('rankings')}><Trophy size={19} aria-hidden="true" />View Rankings <span aria-hidden="true">›</span></GlassButton>
          <GlassButton type="button" onClick={() => setPage('wallet')}><Wallet size={19} aria-hidden="true" />Open Wallet <span aria-hidden="true">›</span></GlassButton>
        </div>
      </section>
      <section className="panel glass recent-projects">
        <div className="panel-heading-row">
          <h3><Layers3 size={21} aria-hidden="true" />Your Recent Projects</h3>
          <button className="text-action" type="button" onClick={() => setPage('projects')}>View All</button>
        </div>
        {projects?.length ? projects.slice(0, 3).map((project) => (
          <div className="activity" key={project?.id || project?.title}>
            <BriefcaseBusiness size={18} aria-hidden="true" />
            <div><strong>{project?.title || 'Untitled project'}</strong><span>{project?.description || 'No description has been added yet.'}</span></div>
            <small>{project?.status || 'open'}</small>
          </div>
        )) : (
          <div className="recent-projects-empty">
            <p>No projects yet.</p>
            <GlassButton type="button" onClick={() => setPage('projects')}><Plus size={17} />Create Your First Project</GlassButton>
          </div>
        )}
      </section>
    </section>
  );
}
