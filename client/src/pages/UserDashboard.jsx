import { Bell, BriefcaseBusiness, CircleDollarSign, Trophy, Wallet } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ProgressSystem from '../components/ProgressSystem.jsx';
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
    <section className="page">
      <div className="dash-head glass padded">
        <div>
          <h2>Welcome back, {user?.name || 'VERTEX user'}</h2>
          <p>Your live account data appears here after the API returns it.</p>
        </div>
        <Bell />
      </div>
      {loading ? <LoadingState /> : null}
      {error ? <EmptyState title="Dashboard data unavailable" message={error} /> : null}
      <div className="metric-grid">
        <article className="metric glass">
          <CircleDollarSign />
          <span>Coin Balance</span>
          <strong>{Number(wallet?.coins ?? 0).toLocaleString()}</strong>
          <small>From wallet API</small>
        </article>
        <article className="metric glass">
          <Wallet />
          <span>Rupee Balance</span>
          <strong>{formatMoney(wallet?.inr)}</strong>
          <small>Database balance</small>
        </article>
        <article className="metric glass">
          <Trophy />
          <span>Current Rank</span>
          <strong>{firstRank ? `#${firstRank.rank ?? 1}` : '-'}</strong>
          <small>{firstRank?.badge || 'No ranking yet'}</small>
        </article>
        <article className="metric glass">
          <BriefcaseBusiness />
          <span>Projects</span>
          <strong>{projects?.length ?? 0}</strong>
          <small>Available projects</small>
        </article>
      </div>
      <div className="split-grid">
        <ProgressSystem projectProgress={projectProgress} />
        <section className="panel glass">
          <h3>Notifications</h3>
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
          ) : (
            <EmptyState title="No notifications yet" />
          )}
        </section>
      </div>
      <div className="cta-row dashboard-actions">
        <button className="ghost" onClick={() => setPage('projects')}>View projects</button>
        <button className="ghost" onClick={() => setPage('rankings')}>View rankings</button>
        <button className="ghost" onClick={() => setPage('wallet')}>Open wallet</button>
      </div>
    </section>
  );
}
