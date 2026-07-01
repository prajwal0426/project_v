import { Bell } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import PageIntro from '../components/PageIntro.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useApiResource from '../hooks/useApiResource.js';

export default function NotificationsPage() {
  const { user, token } = useAuth();
  const { notifications, loadDashboard } = useAppData();
  const { loading, error } = useApiResource(() => loadDashboard(user?.role, token), [user?.role, token]);

  return (
    <section className="page">
      <PageIntro icon={Bell} title="Notifications" text="Account notifications from the VERTEX API." />
      {loading ? <LoadingState label="Loading notifications..." /> : null}
      {error ? <EmptyState title="Notifications unavailable" message={error} /> : null}
      {!loading && !error && !notifications?.length ? <EmptyState title="No notifications yet" /> : null}
      <section className="panel glass">
        {(notifications || []).map((notification) => (
          <div className="activity" key={notification?.id || notification?.title}>
            <Bell size={18} />
            <div>
              <strong>{notification?.title || 'Notification'}</strong>
              <span>{notification?.body || 'No details provided'}</span>
            </div>
            <small>{notification?.created_at ? new Date(notification.created_at).toLocaleString() : ''}</small>
          </div>
        ))}
      </section>
    </section>
  );
}
