import { Building2, ClipboardList, FileText, ShieldAlert, ShieldCheck, Users, Wallet } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import PageIntro from '../components/PageIntro.jsx';
import GlassStatCard from '../components/GlassStatCard.jsx';
import { GlassButton, GlassCard } from '../components/GlassPrimitives.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useApiResource from '../hooks/useApiResource.js';
import '../styles/admin-device-notice.css';

const adminModules = [
  { title: 'User Management', page: 'admin-users', icon: Users, text: 'View users, block access, manage restrictions, force logout, and request password resets.' },
  { title: 'Company Management', page: 'admin-companies', icon: Building2, text: 'View companies, manage account status, restrictions, and reset workflows.' },
  { title: 'Projects', page: 'projects', icon: FileText, text: 'Review platform project activity through existing project controls.' },
  { title: 'Reports System', page: 'admin-reports', icon: FileText, text: 'Open protected platform account and financial summaries.' },
  { title: 'Audit Logs', page: 'admin-audit', icon: ClipboardList, text: 'Review important admin actions across users and companies.' },
  { title: 'Withdrawal Approval', page: 'admin-reports', icon: Wallet, text: 'Monitor pending withdrawal queues and financial actions.' }
];

export default function AdminDashboard({ setPage }) {
  const { token, user } = useAuth();
  const { dashboard, loadDashboard } = useAppData();
  const { loading, error } = useApiResource(() => loadDashboard('admin', token), [token]);

  return (
    <section className="page">
      <PageIntro icon={ShieldCheck} title="Admin Dashboard" text="Operate VERTEX with user, company, payment, analytics, and report controls." />
      {user?.deviceRegistered ? (
        <GlassCard as="aside" className="admin-device-login-notice" role="status">
          <ShieldAlert size={19} aria-hidden="true" />
          <p>A new Admin device was authorized. Review your device and security activity.</p>
          <GlassButton type="button" onClick={() => setPage('admin-security')}>Review devices</GlassButton>
        </GlassCard>
      ) : null}
      {loading ? <LoadingState label="Loading admin dashboard..." /> : null}
      {error ? <EmptyState title="Admin dashboard unavailable" message={error} /> : null}
      <div className="metric-grid">
        <GlassStatCard icon={Users} label="Users" value={Number(dashboard?.users ?? 0).toLocaleString()} detail="Registered accounts" />
        <GlassStatCard icon={ShieldCheck} label="Companies" value={Number(dashboard?.companies ?? 0).toLocaleString()} detail="Registered companies" />
        <GlassStatCard icon={Wallet} label="Pending Withdrawals (₹)" value={`₹${Number(dashboard?.pending_withdrawals ?? 0).toLocaleString('en-IN')}`} detail="Transaction queue" />
      </div>
      <div className="admin-grid">
        {adminModules.map(({ title, page, icon: Icon, text }) => (
          <GlassCard as="article" className="panel admin-module-card" key={title}>
            <Icon />
            <h3>{title}</h3>
            <p>{text}</p>
            <GlassButton type="button" onClick={() => setPage(page)}>Open</GlassButton>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
