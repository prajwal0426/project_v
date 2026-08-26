import { Building2, Eye, KeyRound, LogOut, Search, ShieldAlert, ShieldCheck, SlidersHorizontal, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import PageIntro from '../components/PageIntro.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { adminApi } from '../services/api.js';

const statusOptions = ['', 'ACTIVE', 'BLOCKED', 'RESTRICTED', 'SUSPENDED'];

const restrictionOptions = {
  users: [
    ['submitProjects', 'Cannot submit projects'],
    ['withdraw', 'Cannot withdraw/redeem coins'],
    ['financialActions', 'Cannot perform financial actions']
  ],
  companies: [
    ['createProjects', 'Cannot create new projects'],
    ['editProjects', 'Cannot edit existing projects'],
    ['manageSubmissions', 'Cannot manage project submissions'],
    ['financialActions', 'Cannot perform financial actions']
  ]
};

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '-';
}

function titleFor(kind) {
  return kind === 'companies' ? 'Company Management' : 'User Management';
}

function introFor(kind) {
  return kind === 'companies'
    ? 'Manage registered companies, access status, restrictions, and reset workflows.'
    : 'Manage registered users, access status, restrictions, and reset workflows.';
}

function nameFor(account, kind) {
  if (!account) return 'Account';
  return kind === 'companies' ? account.name || 'Company' : account.name || account.email || 'User';
}

export default function AdminManagementPage({ kind }) {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const Icon = kind === 'companies' ? Building2 : Users;
  const labels = useMemo(() => restrictionOptions[kind], [kind]);

  async function loadRows(nextSearch = search, nextStatus = status) {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.listAccounts(kind, token, { search: nextSearch, status: nextStatus });
      setRows(Array.isArray(response?.rows) ? response.rows : []);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load accounts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows('', '');
    setSelected(null);
    setSearch('');
    setStatus('');
    setMessage('');
    setError('');
  }, [kind]);

  async function openProfile(account) {
    setSaving(true);
    setError('');
    try {
      const response = await adminApi.getAccount(kind, account.id, token);
      setSelected(response?.account || account);
    } catch (profileError) {
      setError(profileError.message || 'Unable to load profile');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(account, nextStatus) {
    const prompt = nextStatus === 'BLOCKED'
      ? `Are you sure you want to block this ${kind === 'companies' ? 'company' : 'user'}?`
      : `Confirm ${nextStatus.toLowerCase()} for ${nameFor(account, kind)}?`;

    if (!window.confirm(prompt)) return;

    const reason = nextStatus === 'SUSPENDED' ? window.prompt('Suspension reason', '') || '' : '';
    const permanent = nextStatus === 'SUSPENDED' ? window.confirm('Make this suspension permanent?') : false;
    const suspensionUntil = nextStatus === 'SUSPENDED' && !permanent ? window.prompt('Suspension end date/time, optional', '') || null : null;

    setSaving(true);
    setMessage('');
    setError('');
    try {
      await adminApi.updateStatus(kind, account.id, token, { status: nextStatus, reason, permanent, suspensionUntil });
      setMessage(`${nameFor(account, kind)} updated to ${nextStatus}.`);
      await loadRows();
      if (selected?.id === account.id) {
        await openProfile(account);
      }
    } catch (statusError) {
      setError(statusError.message || 'Unable to update status');
    } finally {
      setSaving(false);
    }
  }

  async function toggleRestriction(account, key, checked) {
    const current = account.restriction_data || {};
    const nextRestrictions = { ...current, [key]: checked };

    if (!window.confirm(`Confirm restriction change for ${nameFor(account, kind)}?`)) return;

    setSaving(true);
    setMessage('');
    setError('');
    try {
      await adminApi.updateRestrictions(kind, account.id, token, nextRestrictions);
      setMessage(checked ? 'Restriction enabled.' : 'Restriction updated.');
      await loadRows();
      if (selected?.id === account.id) {
        await openProfile(account);
      }
    } catch (restrictionError) {
      setError(restrictionError.message || 'Unable to update restrictions');
    } finally {
      setSaving(false);
    }
  }

  async function forceLogout(account) {
    if (!window.confirm(`Force logout for ${nameFor(account, kind)}?`)) return;
    setSaving(true);
    setError('');
    try {
      await adminApi.forceLogout(kind, account.id, token);
      setMessage('Active sessions invalidated.');
    } catch (logoutError) {
      setError(logoutError.message || 'Unable to force logout');
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword(account) {
    if (!window.confirm(`Send password reset workflow for ${nameFor(account, kind)}?`)) return;
    setSaving(true);
    setError('');
    try {
      const response = await adminApi.requestPasswordReset(kind, account.id, token);
      setMessage(response?.message || 'Password reset requested.');
    } catch (resetError) {
      setError(resetError.message || 'Unable to request password reset');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page">
      <PageIntro icon={Icon} title={titleFor(kind)} text={introFor(kind)} />
      <div className="admin-tools glass">
        <label>
          <Search size={16} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or email" />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          {statusOptions.map((option) => <option value={option} key={option}>{option || 'All statuses'}</option>)}
        </select>
        <button className="ghost" type="button" onClick={() => loadRows()}>
          <SlidersHorizontal size={16} />
          Apply
        </button>
      </div>

      {loading ? <LoadingState label="Loading accounts..." /> : null}
      {saving ? <LoadingState label="Applying admin action..." /> : null}
      {message ? <div className="state-card glass"><p>{message}</p></div> : null}
      {error ? <EmptyState title="Admin action unavailable" message={error} /> : null}

      <div className="admin-table glass">
        {!rows.length && !loading ? <EmptyState title={`No ${kind} found`} /> : null}
        {rows.length ? (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last login</th>
                <th>{kind === 'companies' ? 'Projects' : 'Completed'}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((account) => (
                <tr key={account.id}>
                  <td>{account.id}</td>
                  <td>{account.username || account.email || '-'}</td>
                  <td>{account.name || '-'}</td>
                  <td>{account.email || '-'}</td>
                  <td><span className={`status-pill status-${String(account.account_status || 'ACTIVE').toLowerCase()}`}>{account.account_status || 'ACTIVE'}</span></td>
                  <td>{formatDate(account.created_at)}</td>
                  <td>{formatDate(account.last_login_at)}</td>
                  <td>{kind === 'companies' ? account.project_count ?? 0 : account.completed_projects ?? 0}</td>
                  <td>
                    <div className="admin-actions">
                      <button type="button" onClick={() => openProfile(account)}><Eye size={15} />View</button>
                      <button type="button" onClick={() => updateStatus(account, 'BLOCKED')}><ShieldAlert size={15} />Block</button>
                      <button type="button" onClick={() => updateStatus(account, 'ACTIVE')}><ShieldCheck size={15} />Unblock</button>
                      <button type="button" onClick={() => updateStatus(account, 'SUSPENDED')}>Suspend</button>
                      <button type="button" onClick={() => forceLogout(account)}><LogOut size={15} />Logout</button>
                      <button type="button" onClick={() => resetPassword(account)}><KeyRound size={15} />Reset</button>
                    </div>
                    <div className="restriction-list">
                      {labels.map(([key, label]) => (
                        <label key={key}>
                          <input
                            checked={Boolean(account.restriction_data?.[key])}
                            onChange={(event) => toggleRestriction(account, key, event.target.checked)}
                            type="checkbox"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      {selected ? (
        <div className="legal-modal-layer" role="presentation" onClick={() => setSelected(null)}>
          <article className="legal-modal glass" role="dialog" aria-modal="true" aria-labelledby="profile-title" onClick={(event) => event.stopPropagation()}>
            <button className="auth-close icon-button" type="button" onClick={() => setSelected(null)} aria-label="Close profile">x</button>
            <h2 id="profile-title">{nameFor(selected, kind)}</h2>
            <p className="tagline">Complete non-sensitive profile. Passwords, hashes, tokens, and secrets are never shown.</p>
            <div className="profile-grid">
              {Object.entries(selected).map(([key, value]) => (
                <div key={key}>
                  <span>{key.replaceAll('_', ' ')}</span>
                  <strong>{typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '-')}</strong>
                </div>
              ))}
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
