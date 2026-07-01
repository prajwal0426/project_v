import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return (
      <section className="auth-page">
        <div className="auth-card glass">
          <h1>VERTEX</h1>
          <h2>Login required</h2>
          <p>Please sign in to view this page.</p>
        </div>
      </section>
    );
  }

  return children;
}
