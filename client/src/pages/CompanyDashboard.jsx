import { BriefcaseBusiness, CheckCircle2, Users } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ProgressSystem from '../components/ProgressSystem.jsx';
import GlassStatCard from '../components/GlassStatCard.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useApiResource from '../hooks/useApiResource.js';

function rupees(value) {
  return `₹${Number(value ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function coinsToInr(coins) {
  return Number(coins || 0) * 2.5;
}

export default function CompanyDashboard({ setPage }) {
  const { user, token } = useAuth();
  const { projects, dashboard, loadDashboard } = useAppData();
  const { loading, error } = useApiResource(() => loadDashboard('company', token), [token]);
  const companyProjects = Array.isArray(projects) ? projects : [];
  const completed = companyProjects.filter((project) => project?.status === 'completed').length;
  const projectProgress = companyProjects.length ? Math.round((completed / companyProjects.length) * 100) : 0;

  return (
    <section className="page">
      <div className="dash-head glass padded">
        <div>
          <h2>{user?.name || 'Company dashboard'}</h2>
          <p>Manage project activity from database-backed records.</p>
        </div>
        <BriefcaseBusiness />
      </div>
      {loading ? <LoadingState label="Loading company dashboard..." /> : null}
      {error ? <EmptyState title="Company dashboard unavailable" message={error} /> : null}
      <div className="metric-grid">
        <GlassStatCard icon={BriefcaseBusiness} label="Projects" value={companyProjects.length} detail="Owned by this company" />
        <GlassStatCard icon={Users} label="Submissions" value={companyProjects.reduce((total, project) => total + Number(project?.submissions ?? 0), 0)} detail="From project records" />
        <GlassStatCard icon={CheckCircle2} label="Completed" value={completed} detail="Project status" />
      </div>
      <div className="split-grid">
        <ProgressSystem projectProgress={projectProgress} />
        <section className="panel glass">
          <h3>My Projects</h3>
          {!companyProjects.length ? <EmptyState title="No company projects yet" /> : null}
          {companyProjects.slice(0, 5).map((project) => (
            <div className="activity" key={project?.id || project?.title}>
              <BriefcaseBusiness size={18} />
              <div>
                <strong>{project?.title || 'Untitled project'}</strong>
                <span>{project?.description || 'No description has been added yet.'}</span>
              </div>
              <b>{rupees(project?.reward_pool_inr || coinsToInr(project?.coin_reward ?? 0))}</b>
              <small>{project?.status || 'open'}</small>
            </div>
          ))}
        </section>
      </div>
      <div className="cta-row dashboard-actions">
        <button className="ghost" onClick={() => setPage('projects')}>View all projects</button>
      </div>
    </section>
  );
}
