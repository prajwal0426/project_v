import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/api.js';

const AuthContext = createContext(null);

function readStoredSession() {
  try {
    const adminSession = window.sessionStorage.getItem('vertex.admin.session');
    if (adminSession) {
      return JSON.parse(adminSession);
    }

    const stored = window.localStorage.getItem('vertex.session');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const user = session?.user ?? null;
  const token = session?.token ?? '';

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      if (!session?.token) {
        if (active) setAuthReady(true);
        return;
      }
      try {
        const response = await authApi.session(session.token);
        if (!active) return;
        const restored = { token: session.token, user: response?.account || null };
        setSession(restored);
        const storage = restored.user?.role === 'admin' ? window.sessionStorage : window.localStorage;
        const key = restored.user?.role === 'admin' ? 'vertex.admin.session' : 'vertex.session';
        storage.setItem(key, JSON.stringify(restored));
      } catch {
        if (!active) return;
        setSession(null);
        window.localStorage.removeItem('vertex.session');
        window.sessionStorage.removeItem('vertex.admin.session');
      } finally {
        if (active) setAuthReady(true);
      }
    }
    restoreSession();
    return () => { active = false; };
  }, []);

  // Restored missing normal login function.
  async function login({ role, email, password }) {
    setAuthLoading(true);
    setAuthError('');

    try {
      const response = await authApi.login(role, { email, password });

      const nextSession = {
        token: response?.token || '',
        user: {
          ...(response?.account || {}),
          role
        }
      };

      setSession(nextSession);
      setAuthReady(true);
      window.localStorage.setItem(
        'vertex.session',
        JSON.stringify(nextSession)
      );

      return nextSession.user;
    } catch (error) {
      setAuthError(error.message || 'Unable to sign in');
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }

  async function loginWithGoogle(tokenResponse, legalConsent = {}) {
    setAuthLoading(true);
    setAuthError('');

    try {
      const response = await authApi.loginWithGoogle({ ...tokenResponse, ...legalConsent });

      const nextSession = {
        token: response?.token || '',
        user: {
          ...(response?.account || {}),
          role: 'user'
        }
      };

      setSession(nextSession);
      setAuthReady(true);
      window.localStorage.setItem(
        'vertex.session',
        JSON.stringify(nextSession)
      );

      return nextSession.user;
    } catch (error) {
      setAuthError(error.message || 'Unable to sign in with Google');
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }

  async function loginAdmin({ username, password }) {
    setAuthLoading(true);
    setAuthError('');

    try {
      const response = await authApi.adminLogin({ username, password });
      const nextSession = {
        token: response?.token || '',
        user: {
          ...(response?.account || {}),
          role: 'admin'
        }
      };

      setSession(nextSession);
      setAuthReady(true);
      window.localStorage.removeItem('vertex.session');
      window.sessionStorage.setItem(
        'vertex.admin.session',
        JSON.stringify(nextSession)
      );

      return nextSession.user;
    } catch (error) {
      setAuthError(error.message || 'Invalid admin credentials');
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }

  async function register({
    role,
    name,
    email,
    password,
    dateOfBirth,
    privacyPolicyAccepted,
    termsAccepted,
    ageConfirmed,
    privacyPolicyVersion,
    termsVersion
  }) {
    setAuthLoading(true);
    setAuthError('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);

      if (dateOfBirth) {
        formData.append('dateOfBirth', dateOfBirth);
      }

      formData.append(
        'privacyPolicyAccepted',
        String(Boolean(privacyPolicyAccepted))
      );
      formData.append(
        'termsAccepted',
        String(Boolean(termsAccepted))
      );
      formData.append(
        'ageConfirmed',
        String(Boolean(ageConfirmed))
      );
      formData.append('privacyPolicyVersion', privacyPolicyVersion);
      formData.append('termsVersion', termsVersion);

      const response = await authApi.register(role, formData);

      const nextSession = {
        token: response?.token || '',
        user: {
          ...(response?.account || {}),
          role
        }
      };

      setSession(nextSession);
      setAuthReady(true);
      window.localStorage.setItem(
        'vertex.session',
        JSON.stringify(nextSession)
      );

      return nextSession.user;
    } catch (error) {
      setAuthError(error.message || 'Unable to register');
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }

  async function logout() {
    const activeToken = token;
    const activeRole = user?.role;

    setSession(null);
    setAuthError('');

    window.localStorage.removeItem('vertex.session');
    window.sessionStorage.removeItem('vertex.admin.session');

    if (activeRole === 'admin' && activeToken) {
      try {
        await authApi.adminLogout(activeToken);
      } catch {
        // Local logout should still complete if the stateless API token is already invalid.
      }
    }
  }

  async function acceptLatestLegal(consent) {
    setAuthLoading(true);
    setAuthError('');
    try {
      const response = await authApi.acceptLegal(token, consent);
      const nextSession = {
        token: response?.token || token,
        user: { ...(response?.account || {}), role: response?.account?.role || user?.role, consentRequired: false }
      };
      setSession(nextSession);
      const isAdmin = nextSession.user?.role === 'admin';
      const storage = isAdmin ? window.sessionStorage : window.localStorage;
      const key = isAdmin ? 'vertex.admin.session' : 'vertex.session';
      storage.setItem(key, JSON.stringify(nextSession));
      return nextSession.user;
    } catch (error) {
      setAuthError(error.message || 'Unable to save legal acceptance');
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      loginWithGoogle,
      loginAdmin,
      register,
      acceptLatestLegal,
      logout,
      authReady,
      authError,
      authLoading
    }),
    [user, token, authError, authLoading, authReady]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
