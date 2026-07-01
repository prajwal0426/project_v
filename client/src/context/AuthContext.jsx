import { createContext, useContext, useMemo, useState } from 'react';
import { authApi } from '../services/api.js';

const AuthContext = createContext(null);

function readStoredSession() {
  try {
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

  const user = session?.user ?? null;
  const token = session?.token ?? '';

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
      window.localStorage.setItem('vertex.session', JSON.stringify(nextSession));
      return nextSession.user;
    } catch (error) {
      setAuthError(error.message || 'Unable to sign in');
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }

  async function register({ role, name, email, password, dateOfBirth, privacyPolicyAccepted, termsAccepted, ageConfirmed, privacyPolicyVersion, termsVersion }) {
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
      formData.append('privacyPolicyAccepted', String(Boolean(privacyPolicyAccepted)));
      formData.append('termsAccepted', String(Boolean(termsAccepted)));
      formData.append('ageConfirmed', String(Boolean(ageConfirmed)));
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
      window.localStorage.setItem('vertex.session', JSON.stringify(nextSession));
      return nextSession.user;
    } catch (error) {
      setAuthError(error.message || 'Unable to register');
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    setSession(null);
    setAuthError('');
    window.localStorage.removeItem('vertex.session');
  }

  const value = useMemo(
    () => ({ user, token, login, register, logout, authError, authLoading }),
    [user, token, authError, authLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
