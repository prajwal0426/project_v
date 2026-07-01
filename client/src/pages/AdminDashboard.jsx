import { CircleDollarSign, ShieldCheck, Users } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import PageIntro from '../components/PageIntro.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useApiResource from '../hooks/useApiResource.js';

export default function AdminDashboard() {
  const { token } = useAuth();
  const { dashboard, loadDashboard } = useAppData();
  const { loading, error } = useApiResource(() => loadDashboard('admin', token), [token]);

  return (
    <section className="page">
      <PageIntro icon={ShieldCheck} title="Admin Dashboard" text="Operate VERTEX with user, company, payment, analytics, and report controls." />
      {loading ? <LoadingState label="Loading admin dashboard..." /> : null}
      {error ? <EmptyState title="Admin dashboard unavailable" message={error} /> : null}
      <div className="metric-grid">
        <article className="metric glass">
          <Users />
          <span>Users</span>
          <strong>{Number(dashboard?.users ?? 0).toLocaleString()}</strong>
          <small>Registered users</small>
        </article>
        <article className="metric glass">
          <ShieldCheck />
          <span>Companies</span>
          <strong>{Number(dashboard?.companies ?? 0).toLocaleString()}</strong>
          <small>Registered companies</small>
        </article>
        <article className="metric glass">
          <CircleDollarSign />
          <span>Pending Withdrawals (₹)</span>
          <strong>{Number(dashboard?.pending_withdrawals ?? 0).toLocaleString()}</strong>
          <small>Transaction queue</small>
        </article>
      </div>
      <div className="admin-grid">
        {['User Management', 'Company Management', 'Fraud Detection', 'Withdrawal Approval', 'Analytics', 'Reports System', 'Coin Management'].map((module) => (
          <article className="panel glass" key={module}>
            <ShieldCheck />
            <h3>{module}</h3>
            <p>Role-protected controls should connect to the corresponding admin API before enabling mutations.</p>
          </article>
        ))}
      </div>
    </section>
  );
}
