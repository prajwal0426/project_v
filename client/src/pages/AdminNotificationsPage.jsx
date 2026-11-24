import { useEffect, useState } from 'react';
import { Bell, Megaphone, Search, Send, Trash2, Users } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import GlassStatCard from '../components/GlassStatCard.jsx';
import LoadingState from '../components/LoadingState.jsx';
import PageIntro from '../components/PageIntro.jsx';
import { GlassButton, GlassInput } from '../components/GlassPrimitives.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { adminNotificationsApi } from '../services/notifications.js';

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : 'Not viewed';
}

export default function AdminNotificationsPage() {
  const { token } = useAuth();
  const [mode, setMode] = useState('broadcast');
  const [audience, setAudience] = useState('all');
  const [recipientRole, setRecipientRole] = useState('user');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [recipientId, setRecipientId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('normal');
  const [status, setStatus] = useState('history');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [stats, setStats] = useState({ total: 0, activeBroadcasts: 0, individual: 0, expired: 0, read: 0, unread: 0 });
  const [loading, setLoading] = useState(true);
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const timer = window.setTimeout(() => {
      Promise.all([
        adminNotificationsApi.list(token, { status, type: typeFilter, search, limit: 50, skip }),
        adminNotificationsApi.stats(token)
      ]).then(([listResponse, statsResponse]) => {
        if (cancelled) return;
        const nextRows = Array.isArray(listResponse?.rows) ? listResponse.rows : [];
        setRows((current) => skip ? [...current, ...nextRows] : nextRows);
        setTotal(Number(listResponse?.total || 0));
        setStats((current) => ({ ...current, ...(statsResponse || {}) }));
      }).catch((loadError) => {
        if (!cancelled) setError(loadError.message || 'Unable to load notification management');
      }).finally(() => {
        if (!cancelled) setLoading(false);
      });
    }, 180);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [token, status, typeFilter, search, refreshKey, skip]);

  useEffect(() => {
    if (mode !== 'individual') return undefined;
    let cancelled = false;
    setRecipientLoading(true);
    const timer = window.setTimeout(() => {
      adminNotificationsApi.searchRecipients(token, { role: recipientRole, search: recipientSearch })
        .then((response) => {
          if (cancelled) return;
          const nextRecipients = Array.isArray(response?.rows) ? response.rows : [];
          setRecipients(nextRecipients);
          setRecipientId((current) => nextRecipients.some((recipient) => recipient.id === current) ? current : '');
        })
        .catch((loadError) => { if (!cancelled) setError(loadError.message || 'Unable to search recipients'); })
        .finally(() => { if (!cancelled) setRecipientLoading(false); });
    }, 220);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [token, mode, recipientRole, recipientSearch]);

  async function sendNotification(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const content = { title: title.trim(), body: body.trim(), category, priority };
      if (mode === 'broadcast') {
        await adminNotificationsApi.createBroadcast(token, { ...content, audience });
      } else {
        if (!recipientId) throw new Error('Choose a recipient before sending.');
        await adminNotificationsApi.createIndividual(token, { ...content, recipientId, recipientRole });
      }
      setMessage(mode === 'broadcast' ? 'Broadcast sent. It will expire 24 hours after creation.' : 'Individual notification sent. Its 24-hour expiry starts when viewed.');
      setTitle('');
      setBody('');
      setSkip(0);
      setRefreshKey((value) => value + 1);
    } catch (sendError) {
      setError(sendError.message || 'Unable to send notification');
    } finally {
      setSaving(false);
    }
  }

  async function deleteNotification(notification) {
    if (!window.confirm(`Delete “${notification.title}” for all recipients?`)) return;
    setError('');
    setMessage('');
    try {
      await adminNotificationsApi.remove(token, notification.id);
      setMessage('Notification removed from recipient access. It remains in deleted history.');
      setSkip(0);
      setRefreshKey((value) => value + 1);
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete notification');
    }
  }

  return (
    <section className="page">
      <PageIntro icon={Bell} title="Notification Management" text="Send broadcasts and direct notifications, and review delivery and view history." />

      <div className="metric-grid">
        <GlassStatCard icon={Bell} label="Total Notifications" value={stats.total} detail="Retained history" />
        <GlassStatCard icon={Megaphone} label="Active Broadcasts" value={stats.activeBroadcasts} detail="Expires 24 hours after sending" />
        <GlassStatCard icon={Users} label="Individual" value={stats.individual} detail="Recipient-specific notices" />
        <GlassStatCard icon={Bell} label="Read / Unread" value={`${stats.read} / ${stats.unread}`} detail={`${stats.expired} expired`} />
      </div>

      <form className="admin-tools glass" onSubmit={sendNotification}>
        <label><span>Notification type</span><GlassInput as="select" value={mode} onChange={(event) => setMode(event.target.value)}>
          <option value="broadcast">Broadcast</option><option value="individual">Individual</option>
        </GlassInput></label>
        {mode === 'broadcast' ? (
          <label><span>Target audience</span><GlassInput as="select" value={audience} onChange={(event) => setAudience(event.target.value)}>
            <option value="all">All users and companies</option><option value="users">Users</option><option value="companies">Companies</option>
          </GlassInput></label>
        ) : (
          <>
            <label><span>Recipient type</span><GlassInput as="select" value={recipientRole} onChange={(event) => { setRecipientRole(event.target.value); setRecipientId(''); }}>
              <option value="user">User</option><option value="company">Company</option>
            </GlassInput></label>
            <label><Search size={16} aria-hidden="true" /><GlassInput value={recipientSearch} onChange={(event) => { setRecipientSearch(event.target.value); setRecipientId(''); }} placeholder="Search recipients" /></label>
            <label><span>Recipient</span><GlassInput as="select" value={recipientId} onChange={(event) => setRecipientId(event.target.value)} required>
              <option value="">{recipientLoading ? 'Searching…' : 'Select a recipient'}</option>
              {recipients.map((recipient) => <option value={recipient.id} key={recipient.id}>{recipient.name} · {recipient.email}</option>)}
            </GlassInput></label>
          </>
        )}
        <label><span>Category</span><GlassInput as="select" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="general">General</option><option value="project">Project</option><option value="account">Account</option><option value="security">Security</option><option value="reward">Reward</option>
        </GlassInput></label>
        <label><span>Priority</span><GlassInput as="select" value={priority} onChange={(event) => setPriority(event.target.value)}>
          <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option>
        </GlassInput></label>
        <label><span>Title</span><GlassInput value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} required /></label>
        <label style={{ gridColumn: '1 / -1' }}><span>Message</span><GlassInput as="textarea" rows={4} value={body} onChange={(event) => setBody(event.target.value)} maxLength={10000} required style={{ width: '100%', minHeight: 110, padding: 12, resize: 'vertical' }} /></label>
        <GlassButton className="primary" type="submit" disabled={saving || (mode === 'individual' && !recipientId)}><Send size={16} />{saving ? 'Sending…' : 'Send Notification'}</GlassButton>
      </form>

      {message ? <div className="state-card glass"><p>{message}</p></div> : null}
      {error ? <EmptyState title="Notification action unavailable" message={error} /> : null}

      <div className="admin-tools glass">
        <label><Search size={16} aria-hidden="true" /><GlassInput value={search} onChange={(event) => { setSearch(event.target.value); setSkip(0); }} placeholder="Search notification history" /></label>
        <GlassInput as="select" value={status} onChange={(event) => { setStatus(event.target.value); setSkip(0); }}>
          <option value="history">History</option><option value="active">Active</option><option value="expired">Expired</option><option value="deleted">Deleted</option>
        </GlassInput>
        <GlassInput as="select" value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setSkip(0); }}>
          <option value="">All types</option><option value="broadcast">Broadcast</option><option value="individual">Individual</option>
        </GlassInput>
      </div>

      {loading ? <LoadingState label="Loading notification history..." /> : null}
      {!loading && !error && !rows.length ? <EmptyState title="No notifications found" /> : null}
      {!loading ? rows.map((notification) => (
        <article className="activity" key={notification.id}>
          <Bell size={18} aria-hidden="true" />
          <div>
            <strong>{notification.title}</strong>
            <span>{notification.body}</span>
            <span>{notification.category} · {notification.priority}</span>
            <span>{notification.type === 'broadcast'
              ? `Broadcast · ${(notification.audienceRoles || []).join(', ') || 'all users'} · ${notification.readCount}/${notification.totalRecipients} viewed`
              : `${notification.recipientRole || 'user'} · ${notification.recipient?.name || notification.recipient?.email || 'Recipient unavailable'} · ${notification.isRead ? 'Viewed' : 'Unread'}`}</span>
            <small>Sent {formatDate(notification.createdAt)} · Viewed {formatDate(notification.viewedAt)} · Expires {formatDate(notification.expiresAt)}</small>
          </div>
          {status !== 'deleted' ? <div className="admin-actions"><button type="button" onClick={() => deleteNotification(notification)} aria-label={`Delete ${notification.title}`}><Trash2 size={15} />Delete</button></div> : null}
        </article>
      )) : null}
      {!loading && rows.length < total ? <GlassButton type="button" onClick={() => setSkip((value) => value + 50)}>Load more notifications</GlassButton> : null}
    </section>
  );
}
