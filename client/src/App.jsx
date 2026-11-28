import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppDataProvider } from './context/AppDataContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ResponsiveWorkspace from './ResponsiveWorkspace.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import FeaturesPage from './pages/FeaturesPage.jsx';
import EcosystemPage from './pages/EcosystemPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import CompanyDashboard from './pages/CompanyDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminAuditLogsPage from './pages/AdminAuditLogsPage.jsx';
import AdminManagementPage from './pages/AdminManagementPage.jsx';
import AdminReportsPage from './pages/AdminReportsPage.jsx';
import AdminSecurityPage from './pages/AdminSecurityPage.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';
import RankingsPage from './pages/RankingsPage.jsx';
import WalletPage from './pages/WalletPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx'
import AdminNotificationsPage from './pages/AdminNotificationsPage.jsx';
import LegalConsentPage from './pages/LegalConsentPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import LoadingState from './components/LoadingState.jsx';
import './styles/app.css';
import './styles/workspace-liquid.css';

const protectedPages = {
  dashboard: UserDashboard, company: CompanyDashboard, admin: AdminDashboard,
  projects: ProjectsPage, rankings: RankingsPage, wallet: WalletPage, notifications: NotificationsPage, profile: ProfilePage,
  'admin-users': (props) => <AdminManagementPage {...props} kind="users" />,
  'admin-companies': (props) => <AdminManagementPage {...props} kind="companies" />,
  'admin-audit': AdminAuditLogsPage, 'admin-reports': AdminReportsPage,
  'admin-security': AdminSecurityPage,
  'admin-notifications': AdminNotificationsPage
};

function normalizeAdminRoutePrefix(value) {
  const prefix = String(value || '').trim();
  if (!prefix.startsWith('/') || prefix.startsWith('//') || /[?#\\]/.test(prefix)) return null;

  const segments = prefix.split('/').filter(Boolean);
  if (!segments.length || segments.some((segment) => !/^[a-zA-Z0-9_-]{1,64}$/.test(segment))) return null;
  if (['about', 'contact', 'login', 'register', 'dashboard', 'company', 'projects', 'rankings', 'wallet', 'notifications', 'profile', 'admin', 'admin-login'].includes(segments[0].toLowerCase())) return null;

  return `/${segments.join('/')}`;
}

const ADMIN_ROUTE_PREFIX = normalizeAdminRoutePrefix(import.meta.env.VITE_ADMIN_ROUTE_PREFIX) || '/vx-9e2c7d4a1f83b6c0';
const publicPagePaths = {
  home: '/', about: '/about', contact: '/contact', features: '/features', ecosystem: '/ecosystem', login: '/login', register: '/register',
  dashboard: '/dashboard', company: '/company',
  'legal-consent': '/legal-consent',
  projects: '/projects', rankings: '/rankings', wallet: '/wallet', notifications: '/notifications', profile: '/profile',
};

const adminPagePaths = {
  'admin-login': `${ADMIN_ROUTE_PREFIX}/login`,
  admin: ADMIN_ROUTE_PREFIX,
  'admin-users': `${ADMIN_ROUTE_PREFIX}/users`,
  'admin-companies': `${ADMIN_ROUTE_PREFIX}/companies`,
  projects: `${ADMIN_ROUTE_PREFIX}/projects`,
  rankings: `${ADMIN_ROUTE_PREFIX}/rankings`,
  'admin-audit': `${ADMIN_ROUTE_PREFIX}/audit-logs`,
  'admin-reports': `${ADMIN_ROUTE_PREFIX}/reports`,
  'admin-security': `${ADMIN_ROUTE_PREFIX}/security`,
  'admin-notifications': `${ADMIN_ROUTE_PREFIX}/notifications`
};

const pagePaths = { ...publicPagePaths, ...adminPagePaths };
const pathPages = Object.fromEntries([
  ...Object.entries(publicPagePaths),
  ...Object.entries(adminPagePaths)
].map(([page, path]) => [path, page]));
const pageRoles = {
  dashboard: ['user'], company: ['company'], admin: ['admin'],
  projects: ['user', 'company', 'admin'], rankings: ['user', 'company', 'admin'], wallet: ['user'],
  notifications: ['user', 'company'], profile: ['user', 'company'], 'admin-users': ['admin'],
  'admin-companies': ['admin'], 'admin-audit': ['admin'], 'admin-reports': ['admin'],
  'admin-security': ['admin'], 'admin-notifications': ['admin']
};

function pageFromPath(pathname = '/') {
  return pathPages[pathname] || 'not-found';
}
function isAdminUiPath(pathname = '') {
  return pathname === ADMIN_ROUTE_PREFIX || pathname.startsWith(`${ADMIN_ROUTE_PREFIX}/`);
}
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
    const isAdminPage = nextPage === 'admin-login' || nextPage === 'admin' || nextPage.startsWith('admin-');
    const nextPath = user?.role === 'admin' && pagePaths[nextPage]
      ? pagePaths[nextPage]
      : isAdminPage
        ? adminPagePaths[nextPage]
        : publicPagePaths[nextPage];
    const resolvedPath = nextPath || publicPagePaths.home;
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (currentPath !== resolvedPath) {
      window.history[replace ? 'replaceState' : 'pushState']({ page: nextPage }, '', resolvedPath);
    }
    setPage(nextPage);
  }, [user?.role]);

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
    if (user && pageRoles[page] && !pageRoles[page].includes(user.role)) {
      navigate(pageForRole(user.role), { replace: true });
      return;
    }
    if (user?.role === 'admin' && ['projects', 'rankings'].includes(page) && window.location.pathname !== adminPagePaths[page]) {
      navigate(page, { replace: true });
      return;
    }
    if (!user && pageRoles[page]) {
      navigate(isAdminUiPath(window.location.pathname) || page === 'admin' || page.startsWith('admin-') ? 'admin-login' : 'login', { replace: true });
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
  if (page === 'features') return <main className={bright ? 'app bright' : 'app'}><FeaturesPage setPage={navigate} /></main>;
  if (page === 'ecosystem') return <main className={bright ? 'app bright' : 'app'}><EcosystemPage setPage={navigate} /></main>;

  if (isPublicAuthPage) {
    return <main className={bright ? 'app bright' : 'app'}><LoginPage bright={bright} setBright={setBright}
      authMode={page === 'home' ? null : page} onAuthenticated={(nextPage) => navigate(nextPage, { replace: true })}
      onAuthNavigate={navigate}
      onCloseAuth={() => navigate('home', { replace: true })} /></main>;
  }

  if (!user && page === 'admin-login') {
    return <main className={bright ? 'app bright' : 'app'}><AdminLoginPage bright={bright} setBright={setBright}
      onAuthenticated={(nextPage) => navigate(nextPage, { replace: true })} onBack={() => navigate('home')} onNavigate={navigate} /></main>;
  }

  if (!user) {
    const requiresAdminLogin = isAdminUiPath(window.location.pathname) || page === 'admin' || page.startsWith('admin-');
    return (
      <main className={bright ? 'app bright' : 'app'}>
        {requiresAdminLogin ? (
          <AdminLoginPage bright={bright} setBright={setBright} onAuthenticated={(nextPage) => navigate(nextPage, { replace: true })} onBack={() => navigate('home')} onNavigate={navigate} />
        ) : (
          <LoginPage bright={bright} setBright={setBright} authMode="login" onAuthenticated={(nextPage) => navigate(nextPage, { replace: true })}
            onAuthNavigate={navigate} onCloseAuth={() => navigate('home', { replace: true })} />
        )}
      </main>
    );
  }

  const allowedRoles = pageRoles[page] ?? [];
  if (!allowedRoles.includes(user.role)) {
    const fallbackPage = pageForRole(user.role);
    const FallbackPage = protectedPages[fallbackPage];
    return <main className={bright ? 'app bright' : 'app'}><ResponsiveWorkspace page={fallbackPage} setPage={navigate} bright={bright} setBright={setBright} onLoggedOut={() => navigate('login', { replace: true })}>
      <ProtectedRoute allowedRoles={[user.role]}><FallbackPage setPage={navigate} /></ProtectedRoute>
    </ResponsiveWorkspace></main>;
  }

  return <main className={bright ? 'app bright' : 'app'}><ResponsiveWorkspace page={page} setPage={navigate} bright={bright} setBright={setBright} onLoggedOut={() => navigate('login', { replace: true })}>
    <ProtectedRoute allowedRoles={allowedRoles}><ActivePage setPage={navigate} /></ProtectedRoute>
  </ResponsiveWorkspace></main>;
}

export default function App() {
  return <ErrorBoundary><AuthProvider><AppDataProvider><AppRoutes /></AppDataProvider></AuthProvider></ErrorBoundary>;
}
