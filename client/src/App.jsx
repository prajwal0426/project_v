import { useMemo, useState } from 'react';
import { AppDataProvider } from './context/AppDataContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import CompanyDashboard from './pages/CompanyDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
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
  notifications: NotificationsPage
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

  if (!user) {
    return (
      <main className={bright ? 'app bright' : 'app'}>
        <LoginPage bright={bright} setBright={setBright} onAuthenticated={navigate} />
      </main>
    );
  }

  return (
    <main className={bright ? 'app bright' : 'app'}>
      <AppLayout page={page} setPage={navigate} bright={bright} setBright={setBright}>
        <ProtectedRoute>
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
