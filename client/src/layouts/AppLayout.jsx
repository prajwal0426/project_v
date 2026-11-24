import { Bell, BriefcaseBusiness, Building2, ClipboardList, FileText, LayoutDashboard, ShieldCheck, Trophy, UserRound, Users, Wallet } from 'lucide-react';
import { useRef, useState } from 'react';
import CinematicScene from '../components/CinematicScene.jsx';
import GlassSidebar from '../components/GlassSidebar.jsx';
import GlassTopbar from '../components/GlassTopbar.jsx';
import LegalDocumentModal from '../components/LegalDocumentModal.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { LEGAL_VERSIONS } from '../services/legal.js';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['user'] },
  { id: 'company', label: 'Company', icon: BriefcaseBusiness, roles: ['company'] },
  { id: 'admin', label: 'Overview', icon: ShieldCheck, roles: ['admin'] },
  { id: 'admin-users', label: 'Users', icon: Users, roles: ['admin'] },
  { id: 'admin-companies', label: 'Companies', icon: Building2, roles: ['admin'] },
  { id: 'projects', label: 'Projects', icon: BriefcaseBusiness, roles: ['user', 'company', 'admin'] },
  { id: 'rankings', label: 'Rankings', icon: Trophy, roles: ['user', 'company', 'admin'] },
  { id: 'wallet', label: 'Wallet', icon: Wallet, roles: ['user'] },
  { id: 'admin-reports', label: 'Reports', icon: FileText, roles: ['admin'] },
  { id: 'admin-audit', label: 'Audit Logs', icon: ClipboardList, roles: ['admin'] },
  { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['user', 'company'] },
  { id: 'admin-notifications', label: 'Notifications', icon: Bell, roles: ['admin'] },
  { id: 'profile', label: 'Profile', icon: UserRound, roles: ['user', 'company'] }
];

const pageTitles = {
  'admin-users': 'User Management',
  'admin-companies': 'Company Management',
  'admin-notifications': 'Notification Management',
  'admin-reports': 'Reports',
  'admin-audit': 'Audit Logs'
};

export default function AppLayout({ children, page, setPage, bright, setBright, onLoggedOut }) {
  const { user, logout } = useAuth();
  const { notificationUnreadCount, projectSearch, setProjectSearch, resetData } = useAppData();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [legalDocument, setLegalDocument] = useState(null);
  const legalReturnFocusRef = useRef(null);
  const role = user?.role || 'user';
  const visibleNav = navItems.filter((item) => item.roles.includes(role));
  const pageTitle = pageTitles[page] || navItems.find((item) => item.id === page)?.label || 'VERTEX';
  const unreadCount = Number(notificationUnreadCount || 0);

  async function handleLogout() {
    resetData();
    await logout();
    onLoggedOut?.();
  }

  function navigate(nextPage) {
    setProfileOpen(false);
    setMobileNavOpen(false);
    setPage(nextPage);
  }

  return (
    <div className="product-shell">
      <CinematicScene className="app-cinematic-scene" />

      {mobileNavOpen ? <button className="sidebar-backdrop" type="button" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} /> : null}
      <GlassSidebar
        navItems={visibleNav.map((item) => item.id === 'notifications' ? { ...item, badge: unreadCount } : item)}
        page={page}
        role={role}
        mobileNavOpen={mobileNavOpen}
        onNavigate={navigate}
        onLogout={handleLogout}
        onClose={() => setMobileNavOpen(false)}
      />

      <div className="workspace-main">
        <GlassTopbar
          pageTitle={pageTitle}
          projectSearch={projectSearch}
          setProjectSearch={setProjectSearch}
          unreadCount={unreadCount}
          bright={bright}
          setBright={setBright}
          user={user}
          role={role}
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
          onNavigate={(nextPage) => navigate(role === 'admin' && nextPage === 'notifications' ? 'admin-notifications' : nextPage)}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onLogout={handleLogout}
        />

        <main className="workspace-content">{children}</main>
        <footer className="workspace-footer">
          <span>VERTEX</span>
          <span>Build. Rank. Earn.</span>
          <span>Projects · Rankings · Wallet · Progress</span>
          <div className="workspace-legal-links">
            <button type="button" onClick={(event) => { legalReturnFocusRef.current = event.currentTarget; setLegalDocument('privacy'); }}>Privacy Policy</button>
            <button type="button" onClick={(event) => { legalReturnFocusRef.current = event.currentTarget; setLegalDocument('terms'); }}>Terms &amp; Conditions</button>
          </div>
        </footer>
      </div>
      <LegalDocumentModal
        documentType={legalDocument}
        onClose={() => setLegalDocument(null)}
        returnFocusRef={legalReturnFocusRef}
        version={legalDocument === 'privacy' ? LEGAL_VERSIONS.privacyPolicy : LEGAL_VERSIONS.terms}
      />
    </div>
  );
}
