import { FileText, ShieldCheck } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import PageIntro from '../components/PageIntro.jsx';
import GlassStatCard from '../components/GlassStatCard.jsx';
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
        <GlassStatCard icon={ShieldCheck} label="Total Users" value={Number(dashboard?.users ?? 0).toLocaleString()} detail="Registered accounts" />
        <GlassStatCard icon={ShieldCheck} label="Total Companies" value={Number(dashboard?.companies ?? 0).toLocaleString()} detail="Registered companies" />
        <GlassStatCard icon={ShieldCheck} label="Pending Withdrawals (₹)" value={`₹${Number(dashboard?.pending_withdrawals ?? 0).toLocaleString('en-IN')}`} detail="Transaction queue" />
      </div>
    </section>
  );
}
