/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { auth, authApi } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(auth.getUser());
  const [loading,      setLoading]      = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Verify session with server on every mount / page refresh
  useEffect(() => {
    authApi.me().then(res => {
      // Backend wraps user in { success, message, data: {...} }
      const fresh = res?.data ?? res;
      if (fresh?.id) {
        const updated = {
          id: fresh.id, username: fresh.username, email: fresh.email,
          role: fresh.role, phone_no: fresh.phone_no, address: fresh.address,
        };
        auth.setSession(updated);
        setUser(updated);
      }
    }).catch(() => {
      auth.clearSession();
      setUser(null);
    }).finally(() => {
      setInitializing(false);
    });
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      // Backend sets HTTP-only cookie; store only profile data locally
      const userData = res?.data?.user ?? res?.data ?? res?.user;
      auth.setSession(userData);
      setUser(userData);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      auth.clearSession();
      setUser(null);
    }
  };

  // Call after profile updates that may change stored user data
  const refreshUser = (updated) => {
    const merged = { ...user, ...updated };
    auth.setSession(merged);
    setUser(merged);
  };

  const isAdmin    = user?.role === 'ADMIN';
  const isLoggedIn = !!user;
  const isFullAdmin = isAdmin;

  return (
    <AuthContext.Provider value={{
      user, loading, initializing, login, logout, refreshUser,
      isAdmin, isLoggedIn, isFullAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
