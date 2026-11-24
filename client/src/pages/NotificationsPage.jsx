import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import PageIntro from '../components/PageIntro.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { notificationsApi } from '../services/notifications.js';

export default function NotificationsPage() {
  const { token } = useAuth();
  const { notifications, setNotifications, setNotificationUnreadCount } = useAppData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewingId, setViewingId] = useState('');
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    notificationsApi.list(token, { limit: 50 })
      .then((response) => {
        if (cancelled) return;
        const rows = Array.isArray(response?.rows) ? response.rows : [];
        setNotifications(rows);
        setTotal(Number(response?.total || 0));
        setNotificationUnreadCount(Number(response?.unreadCount || 0));
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message || 'Unable to load notifications');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [token, setNotifications, setNotificationUnreadCount]);

  async function loadMore() {
    setLoadingMore(true);
    setError('');
    try {
      const response = await notificationsApi.list(token, { limit: 50, skip: notifications.length });
      const rows = Array.isArray(response?.rows) ? response.rows : [];
      setNotifications((current) => [...current, ...rows]);
      setTotal(Number(response?.total || 0));
      setNotificationUnreadCount(Number(response?.unreadCount || 0));
    } catch (loadError) {
      setError(loadError.message || 'Unable to load more notifications');
    } finally {
      setLoadingMore(false);
    }
  }

  async function openNotification(notification) {
    if (notification.isRead || viewingId === notification.id) return;
    setViewingId(notification.id);
    setError('');
    try {
      const response = await notificationsApi.view(token, notification.id);
      const viewed = response?.notification;
      setNotifications((current) => current.map((row) => row.id === notification.id ? { ...row, ...viewed, isRead: true } : row));
      setNotificationUnreadCount((count) => Math.max(0, count - 1));
    } catch (viewError) {
      setError(viewError.message || 'Unable to open notification');
    } finally {
      setViewingId('');
    }
  }

  return (
    <section className="page">
      <PageIntro icon={Bell} title="Notifications" text="Account notifications from the VERTEX API." />
      {loading ? <LoadingState label="Loading notifications..." /> : null}
      {error ? <EmptyState title="Notifications unavailable" message={error} /> : null}
      {!loading && !error && !notifications?.length ? <EmptyState title="No notifications yet" /> : null}
      <section className="panel glass">
        {(notifications || []).map((notification) => (
          <div
            className="activity"
            key={notification?.id || notification?.title}
            role="button"
            tabIndex={0}
            aria-label={`${notification.isRead ? 'Viewed' : 'Unread'} notification: ${notification?.title || 'Notification'}`}
            onClick={() => openNotification(notification)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openNotification(notification);
              }
            }}
          >
            <Bell size={18} />
            <div>
              <strong>{notification?.title || 'Notification'}</strong>
              <span>{notification?.body || 'No details provided'}</span>
            </div>
            <small>{notification.isRead ? 'Viewed' : 'Unread'}{notification?.created_at ? ` · ${new Date(notification.created_at).toLocaleString()}` : ''}{viewingId === notification.id ? ' · Saving…' : ''}</small>
          </div>
        ))}
      </section>
      {!loading && notifications.length < total ? <button className="ghost" type="button" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading...' : 'Load more notifications'}</button> : null}
    </section>
  );
}
