import { Building2, ClipboardList, FileText, ShieldCheck, Users, Wallet } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import PageIntro from '../components/PageIntro.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useApiResource from '../hooks/useApiResource.js';

const adminModules = [
  { title: 'User Management', page: 'admin-users', icon: Users, text: 'View users, block access, manage restrictions, force logout, and request password resets.' },
  { title: 'Company Management', page: 'admin-companies', icon: Building2, text: 'View companies, manage account status, restrictions, and reset workflows.' },
  { title: 'Projects', page: 'projects', icon: FileText, text: 'Review platform project activity through existing project controls.' },
  { title: 'Reports System', page: 'admin-reports', icon: FileText, text: 'Open protected platform account and financial summaries.' },
  { title: 'Audit Logs', page: 'admin-audit', icon: ClipboardList, text: 'Review important admin actions across users and companies.' },
  { title: 'Withdrawal Approval', page: 'admin-reports', icon: Wallet, text: 'Monitor pending withdrawal queues and financial actions.' }
];

export default function AdminDashboard({ setPage }) {
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
          <Wallet />
          <span>Pending Withdrawals (₹)</span>
          <strong>{Number(dashboard?.pending_withdrawals ?? 0).toLocaleString()}</strong>
          <small>Transaction queue</small>
        </article>
      </div>
      <div className="admin-grid">
        {adminModules.map(({ title, page, icon: Icon, text }) => (
          <article className="panel glass admin-module-card" key={title}>
            <Icon />
            <h3>{title}</h3>
            <p>{text}</p>
            <button className="ghost" type="button" onClick={() => setPage(page)}>Open</button>
          </article>
        ))}
      </div>
    </section>
  );
}
