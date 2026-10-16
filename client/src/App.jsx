import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppDataProvider } from './context/AppDataContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import CompanyDashboard from './pages/CompanyDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminAuditLogsPage from './pages/AdminAuditLogsPage.jsx';
import AdminManagementPage from './pages/AdminManagementPage.jsx';
import AdminReportsPage from './pages/AdminReportsPage.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';
import RankingsPage from './pages/RankingsPage.jsx';
import WalletPage from './pages/WalletPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx'
import LoadingState from './components/LoadingState.jsx';
import './styles/app.css';

const protectedPages = {
  dashboard: UserDashboard, company: CompanyDashboard, admin: AdminDashboard,
  projects: ProjectsPage, rankings: RankingsPage, wallet: WalletPage, notifications: NotificationsPage,
  'admin-users': (props) => <AdminManagementPage {...props} kind="users" />,
  'admin-companies': (props) => <AdminManagementPage {...props} kind="companies" />,
  'admin-audit': AdminAuditLogsPage, 'admin-reports': AdminReportsPage
};

const pagePaths = {
  home: '/', about: '/about', contact: '/contact', login: '/login', register: '/register',
  'admin-login': '/admin-login', dashboard: '/dashboard', company: '/company', admin: '/admin',
  'legal-consent': '/legal-consent',
  projects: '/projects', rankings: '/rankings', wallet: '/wallet', notifications: '/notifications',
  'admin-users': '/admin/users', 'admin-companies': '/admin/companies',
  'admin-audit': '/admin/audit-logs', 'admin-reports': '/admin/reports'
};

const pathPages = Object.fromEntries(Object.entries(pagePaths).map(([page, path]) => [path, page]));
const pageRoles = {
  dashboard: ['user'], company: ['company'], admin: ['admin'],
  projects: ['user', 'company', 'admin'], rankings: ['user', 'company', 'admin'], wallet: ['user'],
  notifications: ['user', 'company', 'admin'], 'admin-users': ['admin'],
  'admin-companies': ['admin'], 'admin-audit': ['admin'], 'admin-reports': ['admin']
};

function pageFromPath(pathname = '/') { return pathPages[pathname] || 'not-found'; }
function pageForRole(role) {
  if (role === 'company') return 'company';
  if (role === 'admin') return 'admin';
  return 'dashboard';
}

function AppRoutes() {
  const { user, authReady } = useAuth();
  const [page, setPage] = useState(() => pageFromPath(window.location.pathname));
  const [bright, setBright] = useState(false);

  const navigate = useCallback((nextPage, { replace = false } = {}) => {
    const nextPath = pagePaths[nextPage] || pagePaths.home;
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (currentPath !== nextPath) {
      window.history[replace ? 'replaceState' : 'pushState']({ page: nextPage }, '', nextPath);
    }
    setPage(nextPage);
  }, []);

  useEffect(() => {
    const handlePopState = () => setPage(pageFromPath(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (user?.consentRequired && page !== 'legal-consent') {
      navigate('legal-consent', { replace: true });
      return;
    }
    if (user && !user.consentRequired && page === 'legal-consent') {
      navigate(pageForRole(user.role), { replace: true });
      return;
    }
    if (!user && page === 'legal-consent') {
      navigate('login', { replace: true });
      return;
    }
    if (!user && pageRoles[page]) {
      navigate(page === 'admin' || page.startsWith('admin-') ? 'admin-login' : 'login', { replace: true });
      return;
    }
    if (user && ['login', 'register', 'admin-login'].includes(page)) {
      navigate(pageForRole(user.role), { replace: true });
    }
  }, [authReady, navigate, page, user]);

  const ActivePage = useMemo(() => protectedPages[page] ?? UserDashboard, [page]);
  const isPublicAuthPage = page === 'home' || page === 'login' || page === 'register';

  if (!authReady) return <main className={bright ? 'app bright' : 'app'}><LoadingState label="Restoring your session..." /></main>;
  if (user?.consentRequired) {
    return <LegalConsentPage onAccepted={() => navigate(pageForRole(user.role), { replace: true })} />;
  }

  if (page === 'not-found') return <main className={bright ? 'app bright' : 'app'}><NotFoundPage setPage={navigate} /></main>;
  if (page === 'about') return <main className={bright ? 'app bright' : 'app'}><AboutPage setPage={navigate} /></main>;
  if (page === 'contact') return <main className={bright ? 'app bright' : 'app'}><ContactPage setPage={navigate} /></main>;

  if (isPublicAuthPage) {
    return <main className={bright ? 'app bright' : 'app'}><LoginPage bright={bright} setBright={setBright}
      authMode={page === 'home' ? null : page} onAuthenticated={(nextPage) => navigate(nextPage, { replace: true })}
      onAdminLogin={() => navigate('admin-login')} onAuthNavigate={navigate}
      onCloseAuth={() => navigate('home', { replace: true })} /></main>;
  }

  if (!user && page === 'admin-login') {
    return <main className={bright ? 'app bright' : 'app'}><AdminLoginPage bright={bright} setBright={setBright}
      onAuthenticated={(nextPage) => navigate(nextPage, { replace: true })} onBack={() => navigate('home')} onNavigate={navigate} /></main>;
  }

  if (!user) {
    const requiresAdminLogin = page === 'admin' || page.startsWith('admin-');
    return (
      <main className={bright ? 'app bright' : 'app'}>
        {requiresAdminLogin ? (
          <AdminLoginPage bright={bright} setBright={setBright} onAuthenticated={(nextPage) => navigate(nextPage, { replace: true })} onBack={() => navigate('home')} onNavigate={navigate} />
        ) : (
          <LoginPage bright={bright} setBright={setBright} authMode="login" onAuthenticated={(nextPage) => navigate(nextPage, { replace: true })}
            onAdminLogin={() => navigate('admin-login')} onAuthNavigate={navigate} onCloseAuth={() => navigate('home', { replace: true })} />
        )}
      </main>
    );
  }

  const allowedRoles = pageRoles[page] ?? [];
  if (!allowedRoles.includes(user.role)) {
    const fallbackPage = pageForRole(user.role);
    const FallbackPage = protectedPages[fallbackPage];
    return <main className={bright ? 'app bright' : 'app'}><AppLayout page={fallbackPage} setPage={navigate} bright={bright} setBright={setBright} onLoggedOut={() => navigate('home', { replace: true })}>
      <ProtectedRoute allowedRoles={[user.role]}><FallbackPage setPage={navigate} /></ProtectedRoute>
    </AppLayout></main>;
  }

  return <main className={bright ? 'app bright' : 'app'}><AppLayout page={page} setPage={navigate} bright={bright} setBright={setBright} onLoggedOut={() => navigate('home', { replace: true })}>
    <ProtectedRoute allowedRoles={allowedRoles}><ActivePage setPage={navigate} /></ProtectedRoute>
  </AppLayout></main>;
}

export default function App() {
  return <ErrorBoundary><AuthProvider><AppDataProvider><AppRoutes /></AppDataProvider></AuthProvider></ErrorBoundary>;
}
