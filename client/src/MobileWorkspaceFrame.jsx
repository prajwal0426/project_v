import { useEffect, useRef, useState } from 'react';
import {
  Bell, BriefcaseBusiness, Building2, ChevronUp, ClipboardList, FileText, Home,
  LayoutDashboard, LogOut, Moon, MoreHorizontal, ShieldCheck, Trophy, UserRound, Users, Wallet, X, Sun
} from 'lucide-react';
import LegalDocumentModal from './components/LegalDocumentModal.jsx';
import Logo from './components/Logo.jsx';
import { useAppData } from './context/AppDataContext.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { LEGAL_VERSIONS } from './services/legal.js';
import './styles/mobile-experience.css';

const pageTitles = {
  dashboard: 'Dashboard', company: 'Company', admin: 'Overview', projects: 'Projects',
  rankings: 'Rankings', wallet: 'Wallet', notifications: 'Notifications', profile: 'Profile',
  'admin-users': 'Users', 'admin-companies': 'Companies', 'admin-notifications': 'Notifications',
  'admin-reports': 'Reports', 'admin-audit': 'Audit logs', 'admin-security': 'Security & Devices'
};

const tabSets = {
  user: [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'projects', label: 'Projects', icon: BriefcaseBusiness },
    { id: 'rankings', label: 'Ranks', icon: Trophy },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'notifications', label: 'Alerts', icon: Bell }
  ],
  company: [
    { id: 'company', label: 'Home', icon: Home },
    { id: 'projects', label: 'Projects', icon: BriefcaseBusiness },
    { id: 'rankings', label: 'Ranks', icon: Trophy },
    { id: 'notifications', label: 'Alerts', icon: Bell },
    { id: 'profile', label: 'Profile', icon: UserRound }
  ],
  admin: [
    { id: 'admin', label: 'Overview', icon: Home },
    { id: 'admin-users', label: 'Users', icon: Users },
    { id: 'projects', label: 'Projects', icon: BriefcaseBusiness },
    { id: 'admin-notifications', label: 'Alerts', icon: Bell },
    { id: 'more', label: 'More', icon: MoreHorizontal }
  ]
};

const extraPages = {
  user: [{ id: 'profile', label: 'Profile', icon: UserRound }],
  company: [],
  admin: [
    { id: 'admin-companies', label: 'Company management', icon: Building2 },
    { id: 'rankings', label: 'Rankings', icon: Trophy },
    { id: 'admin-reports', label: 'Reports', icon: FileText },
    { id: 'admin-audit', label: 'Audit logs', icon: ClipboardList },
    { id: 'admin-security', label: 'Security & devices', icon: ShieldCheck }
  ]
};

export default function MobileWorkspaceFrame({ children, page, setPage, isMobile, bright, setBright, onLoggedOut }) {
  const { user, logout } = useAuth();
  const { notificationUnreadCount, resetData } = useAppData();
  const [profileOpen, setProfileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [legalDocument, setLegalDocument] = useState(null);
  const profileWrapRef = useRef(null);
  const profileButtonRef = useRef(null);
  const moreButtonRef = useRef(null);
  const legalReturnFocusRef = useRef(null);
  const role = user?.role || 'user';
  const tabs = tabSets[role] || tabSets.user;
  const extras = extraPages[role] || [];
  const unreadCount = Number(notificationUnreadCount || 0);

  useEffect(() => {
    if (!isMobile || (!profileOpen && !moreOpen)) return undefined;
    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        setProfileOpen(false);
        setMoreOpen(false);
        (profileOpen ? profileButtonRef.current : moreButtonRef.current)?.focus();
      }
    }
    function closeOnOutside(event) {
      if (profileOpen && !profileWrapRef.current?.contains(event.target)) setProfileOpen(false);
    }
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOnOutside);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOnOutside);
    };
  }, [isMobile, profileOpen, moreOpen]);

  if (!isMobile) return children;

  function navigate(nextPage) {
    setProfileOpen(false);
    setMoreOpen(false);
    setPage(nextPage);
  }

  async function handleLogout() {
    setProfileOpen(false);
    setMoreOpen(false);
    resetData();
    await logout();
    onLoggedOut?.();
  }

  function openLegal(event, type) {
    legalReturnFocusRef.current = event.currentTarget;
    setProfileOpen(false);
    setLegalDocument(type);
  }

  const title = pageTitles[page] || 'VERTEX';
  const name = user?.name || user?.username || (role === 'admin' ? 'Admin' : 'VERTEX');
  const initial = String(name).trim().charAt(0).toUpperCase() || 'V';

  return (
    <div className="mobile-workspace-frame">
      <header className="mobile-workspace-header">
        <button className="mobile-brand" type="button" onClick={() => navigate(role === 'admin' ? 'admin' : role === 'company' ? 'company' : 'dashboard')} aria-label="Go to workspace home">
          <Logo variant="navigation" showText={false} className="mobile-brand-logo" />
          <span>VERTEX</span>
        </button>
        <div className="mobile-header-page-title"><span>WORKSPACE</span><strong>{title}</strong></div>
        <div className="mobile-header-actions">
          <button className="mobile-icon-button" type="button" onClick={() => setBright((value) => !value)} aria-label={bright ? 'Switch to dark theme' : 'Switch to bright theme'}>
            {bright ? <Moon size={19} /> : <Sun size={19} />}
          </button>
          <div className="mobile-profile-wrap" ref={profileWrapRef}>
            <button ref={profileButtonRef} className="mobile-avatar-button" type="button" aria-haspopup="menu" aria-expanded={profileOpen} aria-controls="mobile-profile-menu" onClick={() => setProfileOpen((value) => !value)}>
              <span className="mobile-avatar">{initial}</span><ChevronUp size={15} className={profileOpen ? '' : 'is-collapsed'} aria-hidden="true" />
            </button>
            {profileOpen ? (
              <div className="mobile-profile-menu glass" id="mobile-profile-menu" role="menu">
                <div className="mobile-profile-summary"><strong>{name}</strong><span>{role === 'admin' ? 'Administrator' : role === 'company' ? 'Company' : 'User'}</span></div>
                {extras.map(({ id, label, icon: Icon }) => (
                  <button type="button" role="menuitem" key={id} onClick={() => navigate(id)}><Icon size={17} />{label}</button>
                ))}
                <button type="button" role="menuitem" onClick={handleLogout}><LogOut size={17} />Log out</button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mobile-workspace-page">{children}</div>

      <nav className="mobile-bottom-nav" aria-label={`${role} workspace navigation`}>
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = id === page || (id === 'more' && moreOpen);
          const badge = id === 'notifications' ? unreadCount : 0;
          return (
            <button
              key={id}
              type="button"
              className={active ? 'is-active' : ''}
              aria-current={id === page ? 'page' : undefined}
              aria-label={label === 'Alerts' && badge ? `${label}, ${badge} unread` : label}
              ref={id === 'more' ? moreButtonRef : undefined}
              onClick={() => id === 'more' ? setMoreOpen((value) => !value) : navigate(id)}
            >
              <span className="mobile-tab-icon"><Icon size={19} aria-hidden="true" />{badge > 0 ? <i>{badge > 99 ? '99+' : badge}</i> : null}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {moreOpen ? (
        <div className="mobile-more-backdrop" role="presentation" onClick={() => setMoreOpen(false)}>
          <section className="mobile-more-sheet glass" role="dialog" aria-modal="true" aria-labelledby="mobile-more-title" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-more-heading"><h2 id="mobile-more-title">More workspace</h2><button className="mobile-icon-button" type="button" onClick={() => setMoreOpen(false)} aria-label="Close menu"><X size={19} /></button></div>
            {extras.map(({ id, label, icon: Icon }) => (
              <button className="mobile-more-item" type="button" key={id} onClick={() => navigate(id)}><Icon size={19} /><span>{label}</span></button>
            ))}
            <button className="mobile-more-item" type="button" onClick={handleLogout}><LogOut size={19} /><span>Log out</span></button>
          </section>
        </div>
      ) : null}

      <footer className="mobile-legal-links">
        <button type="button" onClick={(event) => openLegal(event, 'privacy')}>Privacy Policy</button>
        <span aria-hidden="true">·</span>
        <button type="button" onClick={(event) => openLegal(event, 'terms')}>Terms &amp; Conditions</button>
      </footer>

      <LegalDocumentModal
        documentType={legalDocument}
        onClose={() => setLegalDocument(null)}
        returnFocusRef={legalReturnFocusRef}
        version={legalDocument === 'privacy' ? LEGAL_VERSIONS.privacyPolicy : LEGAL_VERSIONS.terms}
      />
    </div>
  );
}
