import { Bell, BriefcaseBusiness, LayoutDashboard, LogOut, Moon, ShieldCheck, Sun, Trophy, Wallet } from 'lucide-react';
import { useRef, useState } from 'react';
import LegalDocumentModal from '../components/LegalDocumentModal.jsx';
import Logo from '../components/Logo.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['user'] },
  { id: 'company', label: 'Company', icon: BriefcaseBusiness, roles: ['company'] },
  { id: 'admin', label: 'Admin', icon: ShieldCheck, roles: ['admin'] },
  { id: 'projects', label: 'Projects', icon: BriefcaseBusiness, roles: ['user', 'company', 'admin'] },
  { id: 'rankings', label: 'Rankings', icon: Trophy, roles: ['user', 'company', 'admin'] },
  { id: 'wallet', label: 'Wallet', icon: Wallet, roles: ['user'] },
  { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['user', 'company', 'admin'] }
];

function homePageFor(role) {
  if (role === 'company') return 'company';
  if (role === 'admin') return 'admin';
  return 'dashboard';
}

export default function AppLayout({ children, page, setPage, bright, setBright }) {
  const { user, logout } = useAuth();
  const { resetData } = useAppData();
  const [legalDocument, setLegalDocument] = useState(null);
  const legalReturnFocusRef = useRef(null);
  const role = user?.role || 'user';
  const visibleNav = navItems.filter((item) => item.roles.includes(role));

  function handleLogout() {
    resetData();
    logout();
    setPage('login');
  }

  function openLegalDocument(event, documentType) {
    legalReturnFocusRef.current = event.currentTarget;
    setLegalDocument(documentType);
  }

  return (
    <>
      <header className="topbar glass">
        <button className="brand-button" onClick={() => setPage(homePageFor(role))} aria-label="Go to dashboard">
          <Logo />
        </button>
        <nav className="nav">
          {visibleNav.map(({ id, label, icon: Icon }) => (
            <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}>
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
        <div className="top-actions">
          <button className="icon-button" onClick={() => setBright((value) => !value)} aria-label="Toggle theme">
            {bright ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="ghost" onClick={handleLogout}>
            <LogOut size={17} />
            Log out
          </button>
        </div>
      </header>
      {children}
      <footer className="footer">
        VERTEX production modules: authentication, projects, rankings, wallet, dashboards, notifications, progress.
        {' '}
        <button type="button" onClick={(event) => openLegalDocument(event, 'privacy')}>Privacy Policy</button>
        {' '}
        <button type="button" onClick={(event) => openLegalDocument(event, 'terms')}>Terms & Conditions</button>
      </footer>
      <LegalDocumentModal documentType={legalDocument} onClose={() => setLegalDocument(null)} returnFocusRef={legalReturnFocusRef} />
    </>
  );
}
