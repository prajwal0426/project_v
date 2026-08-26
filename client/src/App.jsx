import { useMemo, useState } from 'react';
import { AppDataProvider } from './context/AppDataContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import CompanyDashboard from './pages/CompanyDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminAuditLogsPage from './pages/AdminAuditLogsPage.jsx';
import AdminManagementPage from './pages/AdminManagementPage.jsx';
import AdminReportsPage from './pages/AdminReportsPage.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';
import RankingsPage from './pages/RankingsPage.jsx';
import WalletPage from './pages/WalletPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import './styles/app.css';

const protectedPages = {
  dashboard: UserDashboard,
  company: CompanyDashboard,
  admin: AdminDashboard,
  projects: ProjectsPage,
  rankings: RankingsPage,
  wallet: WalletPage,
  notifications: NotificationsPage,
  'admin-users': (props) => <AdminManagementPage {...props} kind="users" />,
  'admin-companies': (props) => <AdminManagementPage {...props} kind="companies" />,
  'admin-audit': AdminAuditLogsPage,
  'admin-reports': AdminReportsPage
};

const pageRoles = {
  dashboard: ['user'],
  company: ['company'],
  admin: ['admin'],
  projects: ['user', 'company', 'admin'],
  rankings: ['user', 'company', 'admin'],
  wallet: ['user'],
  notifications: ['user', 'company', 'admin'],
  'admin-users': ['admin'],
  'admin-companies': ['admin'],
  'admin-audit': ['admin'],
  'admin-reports': ['admin']
};

function pageForRole(role) {
  if (role === 'company') return 'company';
  if (role === 'admin') return 'admin';
  return 'dashboard';
}

function AppRoutes() {
  const { user } = useAuth();
  const [page, setPage] = useState(() => pageForRole(user?.role));
  const [bright, setBright] = useState(false);

  const ActivePage = useMemo(() => protectedPages[page] ?? UserDashboard, [page]);

  function navigate(nextPage) {
    setPage(nextPage);
  }

  if (page === 'admin-login' && !user) {
    return (
      <main className={bright ? 'app bright' : 'app'}>
        <AdminLoginPage bright={bright} setBright={setBright} onAuthenticated={navigate} onBack={() => navigate('login')} />
      </main>
    );
  }

  if (!user) {
    if (page === 'admin') {
      return (
        <main className={bright ? 'app bright' : 'app'}>
          <AdminLoginPage bright={bright} setBright={setBright} onAuthenticated={navigate} onBack={() => navigate('login')} />
        </main>
      );
    }

    return (
      <main className={bright ? 'app bright' : 'app'}>
        <LoginPage bright={bright} setBright={setBright} onAuthenticated={navigate} onAdminLogin={() => navigate('admin-login')} />
      </main>
    );
  }

  const allowedRoles = pageRoles[page] ?? ['user'];
  if (!allowedRoles.includes(user.role)) {
    const fallbackPage = pageForRole(user.role);
    const FallbackPage = protectedPages[fallbackPage] ?? UserDashboard;

    return (
      <main className={bright ? 'app bright' : 'app'}>
        <AppLayout page={fallbackPage} setPage={navigate} bright={bright} setBright={setBright}>
          <ProtectedRoute allowedRoles={[user.role]}>
            <FallbackPage setPage={navigate} />
          </ProtectedRoute>
        </AppLayout>
      </main>
    );
  }

  return (
    <main className={bright ? 'app bright' : 'app'}>
      <AppLayout page={page} setPage={navigate} bright={bright} setBright={setBright}>
        <ProtectedRoute allowedRoles={allowedRoles}>
          <ActivePage setPage={navigate} />
        </ProtectedRoute>
      </AppLayout>
    </main>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppDataProvider>
          <AppRoutes />
        </AppDataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
