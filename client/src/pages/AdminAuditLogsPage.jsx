import { ClipboardList } from 'lucide-react';
import { useEffect, useState } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import PageIntro from '../components/PageIntro.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { adminApi } from '../services/api.js';

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '-';
}

export default function AdminAuditLogsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadLogs() {
      setLoading(true);
      setError('');
      try {
        const response = await adminApi.auditLogs(token);
        if (active) {
          setRows(Array.isArray(response?.rows) ? response.rows : []);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Unable to load audit logs');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadLogs();
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <section className="page">
      <PageIntro icon={ClipboardList} title="Audit Logs" text="Review admin actions for users and companies." />
      {loading ? <LoadingState label="Loading audit logs..." /> : null}
      {error ? <EmptyState title="Audit logs unavailable" message={error} /> : null}
      <div className="admin-table glass">
        {!rows.length && !loading ? <EmptyState title="No audit logs yet" /> : null}
        {rows.length ? (
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Admin</th>
                <th>Target</th>
                <th>Action</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{formatDate(row.created_at)}</td>
                  <td>{row.admin_id || '-'}</td>
                  <td>{row.target_type} {row.target_id}</td>
                  <td>{row.action || '-'}</td>
                  <td>{row.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </section>
  );
}
