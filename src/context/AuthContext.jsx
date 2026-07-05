import { createContext, useContext, useState, useEffect } from 'react';
import { auth, authApi } from '../utils/api';

const AuthContext = createContext(null);

// // Returns true if user can VIEW a given page.
// // null permissions = full admin (no restrictions).
// // Handles both old flat boolean and new nested { view, add, update, delete } structures.
// function checkPermission(user, pageKey) {
//   if (!user) return false;
//   if (user.permissions === null || user.permissions === undefined) return true;
//   const p = user.permissions[pageKey];
//   if (p === null || p === undefined) return false;
//   if (typeof p === 'boolean') return p;          // legacy flat format
//   return !!p.view;                               // new nested format
// }

// // Returns true if user can perform a specific operation on a page.
// function checkOp(user, pageKey, op) {
//   if (!user) return false;
//   if (user.permissions === null || user.permissions === undefined) return true;
//   const p = user.permissions[pageKey];
//   if (!p) return false;
//   if (typeof p === 'boolean') return p;
//   return !!p[op];
// }

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
          // permissions: fresh.permissions ?? null,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      // Backend sets HTTP-only cookie; store only profile data locally
      // Response shape: { data: { user: {...} } } OR { data: {...} }
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
      // Call backend to clear the HTTP-only cookie
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
  // True when user is a full admin with no page restrictions
  const isFullAdmin = isAdmin && (user?.permissions === null || user?.permissions === undefined);

  // const can    = (pageKey)       => checkPermission(user, pageKey);
  // const canOp  = (pageKey, op)  => checkOp(user, pageKey, op);

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
