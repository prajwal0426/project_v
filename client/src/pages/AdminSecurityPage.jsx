import { useCallback, useEffect, useState } from 'react';
import { Clock3, Monitor, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import PageIntro from '../components/PageIntro.jsx';
import { GlassButton, GlassCard } from '../components/GlassPrimitives.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { adminApi } from '../services/api.js';
import '../styles/admin-security.css';

function formatDate(value) {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export default function AdminSecurityPage({ setPage }) {
  const { token, logout } = useAuth();
  const [data, setData] = useState({ devices: [], events: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revokingId, setRevokingId] = useState('');

  const loadDevices = useCallback(async () => {
    setError('');
    try {
      setData(await adminApi.devices(token));
    } catch (loadError) {
      setError(loadError.message || 'Unable to load Admin devices.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  async function handleRevoke(device) {
    const prompt = device.isCurrent
      ? 'Revoke this device? All sessions on it will stop working and you will be returned to Admin login.'
      : `Revoke access for ${device.name}? All sessions on that device will stop working.`;
    if (!window.confirm(prompt)) return;

    setRevokingId(device.id);
    setNotice('');
    setError('');
    try {
      await adminApi.revokeDevice(device.id, token);
      if (device.isCurrent) {
        await logout();
        setPage('admin-login');
        return;
      }
      setNotice(`${device.name} was revoked. Its Admin sessions are no longer valid.`);
      await loadDevices();
    } catch (revokeError) {
      setError(revokeError.message || 'Unable to revoke this device.');
    } finally {
      setRevokingId('');
    }
  }

  const activeCount = data.devices.filter((device) => device.status === 'active').length;

  return (
    <section className="page admin-security-page">
      <PageIntro icon={ShieldCheck} title="Security & Devices" text="Review authorized Admin devices and revoke sessions you no longer trust." />
      <GlassCard as="section" className="admin-device-summary" aria-live="polite">
        <div>
          <span className="admin-device-kicker">DEVICE LIMIT</span>
          <strong>{activeCount} of 3 authorized</strong>
        </div>
        <p>New browsers need an available slot. Removing a device immediately invalidates all of its Admin sessions.</p>
      </GlassCard>

      {notice ? <p className="admin-device-feedback success" role="status">{notice}</p> : null}
      {error ? <p className="admin-device-feedback error" role="alert">{error}</p> : null}
      {loading ? <LoadingState label="Loading authorized devices..." /> : null}
      {!loading && error && !data.devices.length ? <EmptyState title="Device list unavailable" message={error} /> : null}

      {!loading && data.devices.length ? (
        <section className="admin-device-section" aria-labelledby="admin-devices-heading">
          <div className="admin-device-section-heading"><div><p className="eyebrow">ADMIN ACCOUNT</p><h2 id="admin-devices-heading">Authorized devices</h2></div><span>{activeCount} active</span></div>
          <div className="admin-device-grid">
            {data.devices.map((device) => (
              <GlassCard as="article" className={`admin-device-card${device.isCurrent ? ' is-current' : ''}`} key={device.id}>
                <div className="admin-device-card-heading">
                  <span className="admin-device-icon"><Monitor size={20} aria-hidden="true" /></span>
                  <div className="admin-device-title"><h3>{device.name}</h3><p>{device.browser} · {device.operatingSystem}</p></div>
                  <span className={`admin-device-status ${device.status}`}>{device.status}</span>
                </div>
                <dl className="admin-device-facts">
                  <div><dt>Registered</dt><dd>{formatDate(device.registeredAt)}</dd></div>
                  <div><dt>Last active</dt><dd><Clock3 size={14} aria-hidden="true" />{formatDate(device.lastActiveAt)}</dd></div>
                </dl>
                <div className="admin-device-card-footer">
                  {device.isCurrent ? <span className="admin-current-device"><ShieldCheck size={15} aria-hidden="true" />Current device</span> : <span />}
                  {device.status === 'active' ? (
                    <GlassButton className="admin-device-revoke" type="button" disabled={revokingId === device.id} onClick={() => handleRevoke(device)}>
                      <Trash2 size={15} aria-hidden="true" />{revokingId === device.id ? 'Revoking...' : 'Revoke'}
                    </GlassButton>
                  ) : null}
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      ) : null}

      {!loading ? (
        <section className="admin-device-section" aria-labelledby="admin-security-events-heading">
          <div className="admin-device-section-heading"><div><p className="eyebrow">ACCOUNT ACTIVITY</p><h2 id="admin-security-events-heading">Security activity</h2></div></div>
          {data.events.length ? (
            <div className="admin-device-events">
              {data.events.map((event) => (
                <GlassCard as="article" className="admin-device-event" key={event.id}>
                  <ShieldAlert size={18} aria-hidden="true" />
                  <div><strong>{event.message}</strong><span>{formatDate(event.createdAt)}</span></div>
                </GlassCard>
              ))}
            </div>
          ) : <EmptyState title="No security activity yet" message="New device registrations and revocations will appear here." />}
        </section>
      ) : null}
    </section>
  );
}
