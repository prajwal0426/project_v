import { useAuth } from '../context/AuthContext.jsx';
import Logo from './Logo.jsx';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user } = useAuth();

  if (!user) {
    return (
      <section className="auth-page">
        <div className="auth-card glass">
          <Logo />
          <h2>Login required</h2>
          <p>Please sign in to view this page.</p>
        </div>
      </section>
    );
  }

  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    return (
      <section className="auth-page">
        <div className="auth-card glass">
          <Logo />
          <h2>Access denied</h2>
          <p>Your account cannot access this page.</p>
        </div>
      </section>
    );
  }

  return children;
}
