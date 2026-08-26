import { FileText, ShieldCheck } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import PageIntro from '../components/PageIntro.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useApiResource from '../hooks/useApiResource.js';

export default function AdminReportsPage() {
  const { token } = useAuth();
  const { dashboard, loadDashboard } = useAppData();
  const { loading, error } = useApiResource(() => loadDashboard('admin', token), [token]);

  return (
    <section className="page">
      <PageIntro icon={FileText} title="Reports" text="Admin financial, account, and platform summaries from protected backend data." />
      {loading ? <LoadingState label="Loading reports..." /> : null}
      {error ? <EmptyState title="Reports unavailable" message={error} /> : null}
      <div className="metric-grid">
        <article className="metric glass">
          <ShieldCheck />
          <span>Total Users</span>
          <strong>{Number(dashboard?.users ?? 0).toLocaleString()}</strong>
          <small>Registered accounts</small>
        </article>
        <article className="metric glass">
          <ShieldCheck />
          <span>Total Companies</span>
          <strong>{Number(dashboard?.companies ?? 0).toLocaleString()}</strong>
          <small>Registered companies</small>
        </article>
        <article className="metric glass">
          <ShieldCheck />
          <span>Pending Withdrawals</span>
          <strong>{Number(dashboard?.pending_withdrawals ?? 0).toLocaleString()}</strong>
          <small>Transaction queue</small>
        </article>
      </div>
    </section>
  );
}
