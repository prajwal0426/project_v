import { BriefcaseBusiness, FileCheck2, Upload } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import PageIntro from '../components/PageIntro.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import useApiResource from '../hooks/useApiResource.js';

function rupees(value) {
  return `₹${Number(value ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function coinsToInr(coins) {
  return Number(coins || 0) * 2.5;
}

export default function ProjectsPage() {
  const { projects, loadProjects } = useAppData();
  const { loading, error } = useApiResource(loadProjects, []);

  return (
    <section className="page">
      <PageIntro icon={BriefcaseBusiness} title="Projects" text="Complete real work, submit files, receive feedback, and earn coins." />
      {loading ? <LoadingState label="Loading projects..." /> : null}
      {error ? <EmptyState title="Projects unavailable" message={error} /> : null}
      {!loading && !error && !projects?.length ? <EmptyState title="No projects available yet" /> : null}
      <div className="card-grid">
        {(projects || []).map((project) => (
          <article className="item-card glass" key={project?.id || project?.title}>
            <div className="card-icon">
              <FileCheck2 />
            </div>
            <span className="pill">{project?.difficulty || 'open'}</span>
            <h3>{project?.title || 'Untitled project'}</h3>
            <p>{project?.description || 'No description has been added yet.'}</p>
            <div className="upload-zone">
              <Upload size={18} />
              Submit project files
            </div>
            <div className="card-foot">
              <b>{Number(project?.coin_reward ?? project?.coins ?? 0).toLocaleString()} coins / {rupees(project?.reward_pool_inr || coinsToInr(project?.coin_reward ?? project?.coins ?? 0))}</b>
              <span>{project?.status || 'open'}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
