import { Bell, ChevronDown, Menu, Moon, Search, Sun, UserRound, LogOut } from 'lucide-react';
import { GlassDropdown, GlassInput } from './GlassPrimitives.jsx';

export default function GlassTopbar({
  pageTitle,
  projectSearch,
  setProjectSearch,
  unreadCount,
  bright,
  setBright,
  user,
  role,
  profileOpen,
  setProfileOpen,
  onNavigate,
  onOpenMobileNav,
  onLogout
}) {
  const initials = String(user?.name || user?.email || 'V').trim().charAt(0).toUpperCase();

  return (
    <header className="workspace-topbar glass">
      <button className="icon-button mobile-menu-button" type="button" onClick={onOpenMobileNav} aria-label="Open navigation">
        <Menu size={19} />
      </button>
      <div className="workspace-heading">
        <h1>{pageTitle}</h1>
      </div>
      <label className="workspace-search glass" aria-label="Search projects">
        <Search size={17} aria-hidden="true" />
        <GlassInput type="search" value={projectSearch} onChange={(event) => setProjectSearch(event.target.value)} placeholder="Search projects..." />
      </label>
      <div className="workspace-actions">
        <button className="icon-button notification-button" type="button" onClick={() => onNavigate('notifications')} aria-label={unreadCount ? `${unreadCount} unread notifications` : 'Notifications'}>
          <Bell size={18} />
          {unreadCount > 0 ? <span className="notification-dot" aria-hidden="true" /> : null}
        </button>
        <button className="icon-button" type="button" onClick={() => setBright((value) => !value)} aria-label={bright ? 'Switch to dark theme' : 'Switch to light theme'}>
          {bright ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <GlassDropdown open={profileOpen} onOpenChange={setProfileOpen}>
          <button className="profile-menu-trigger" type="button" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} aria-haspopup="menu">
            <span className="profile-avatar" aria-hidden="true">{initials}</span>
            <span className="profile-summary"><strong>{user?.name || 'VERTEX account'}</strong><small>{role}</small></span>
            <ChevronDown size={16} aria-hidden="true" />
          </button>
          {profileOpen ? (
            <div className="profile-menu glass" role="menu">
              <div className="profile-menu-account">
                <strong>{user?.name || 'VERTEX account'}</strong>
                {user?.email ? <span>{user.email}</span> : null}
              </div>
              {role !== 'admin' ? <button type="button" role="menuitem" onClick={() => onNavigate('profile')}><UserRound size={16} />View Profile</button> : null}
              <button type="button" role="menuitem" onClick={onLogout}><LogOut size={16} />Logout</button>
            </div>
          ) : null}
        </GlassDropdown>
      </div>
    </header>
  );
}
