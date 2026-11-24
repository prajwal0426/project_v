import { useEffect, useState } from 'react';
import { CalendarDays, Check, CircleUserRound, Pencil, X } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import PageIntro from '../components/PageIntro.jsx';
import { GlassButton, GlassInput } from '../components/GlassPrimitives.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { profileApi } from '../services/api.js';

export default function ProfilePage() {
  const { user, token, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    profileApi.get(token)
      .then((response) => {
        if (!active) return;
        const nextProfile = response?.profile || null;
        setProfile(nextProfile);
        setName(nextProfile?.name || '');
      })
      .catch((loadError) => { if (active) setError(loadError.message || 'Unable to load your profile.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  async function saveProfile(event) {
    event.preventDefault();
    setSaveError('');
    setSaved(false);
    setSaving(true);
    try {
      const response = await profileApi.update(token, { name });
      setProfile(response?.profile || profile);
      setName(response?.profile?.name || name.trim());
      if (response?.profile) updateUser(response.profile);
      setEditing(false);
      setSaved(true);
    } catch (saveError) {
      setSaveError(saveError.message || 'Unable to update your profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page profile-page">
      <PageIntro icon={CircleUserRound} title="Profile" text="Manage the account details connected to your VERTEX workspace." />
      {loading ? <LoadingState label="Loading profile..." /> : null}
      {!loading && error ? <EmptyState title="Profile unavailable" message={error} /> : null}
      {!loading && profile ? (
        <div className="profile-content-grid">
          <section className="panel glass profile-overview">
            <div className="profile-large-avatar" aria-hidden="true">{String(profile.name || user?.name || 'V').trim().charAt(0).toUpperCase()}</div>
            <h2>{profile.name || 'VERTEX account'}</h2>
            <p>{profile.email || 'Email unavailable'}</p>
            <span className="profile-status"><i aria-hidden="true" />{String(profile.accountStatus || 'ACTIVE').toLowerCase()}</span>
          </section>

          <section className="panel glass profile-details">
            <div className="panel-heading-row">
              <div><p className="eyebrow">ACCOUNT</p><h3>Personal details</h3></div>
              {!editing ? <GlassButton className="profile-edit-button" type="button" onClick={() => { setName(profile.name || ''); setEditing(true); setSaved(false); }}><Pencil size={16} /> Edit name</GlassButton> : null}
            </div>
            {saved ? <p className="profile-feedback success" role="status">Profile updated.</p> : null}
            {saveError ? <p className="profile-feedback error" role="alert">{saveError}</p> : null}
            {editing ? (
              <form className="profile-edit-form" onSubmit={saveProfile}>
                <label className="field"><span>Full name</span><GlassInput autoComplete="name" maxLength={160} required value={name} onChange={(event) => setName(event.target.value)} /></label>
                <div className="profile-form-actions">
                  <GlassButton variant="primary" type="submit" disabled={saving || !name.trim()}>{saving ? 'Saving...' : <><Check size={16} /> Save changes</>}</GlassButton>
                  <GlassButton type="button" disabled={saving} onClick={() => { setEditing(false); setName(profile.name || ''); }}><X size={16} /> Cancel</GlassButton>
                </div>
              </form>
            ) : null}
            <dl className="profile-details-list">
              <div><dt>Name</dt><dd>{profile.name || 'Not provided'}</dd></div>
              <div><dt>Email</dt><dd>{profile.email || 'Not provided'}</dd></div>
              <div><dt>Account type</dt><dd>{String(profile.role || user?.role || 'user').replace(/^./, (letter) => letter.toUpperCase())}</dd></div>
              <div><dt>Member since</dt><dd><CalendarDays size={15} />{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date unavailable'}</dd></div>
            </dl>
          </section>
        </div>
      ) : null}
    </section>
  );
}
