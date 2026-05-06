import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { loginRequest } from '../auth/authConfig';
import { usersApi } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  // `user` holds the profile from OUR backend (with internal id + role from DB).
  // The Azure account info (name, email) is in `accounts[0]` but we still need
  // to call /users/me so we know the user's internal Id and Admin role.
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Whenever auth state settles, fetch our backend's profile.
  useEffect(() => {
    // Wait until MSAL finishes any in-flight interaction.
    if (inProgress !== 'none') return;

    if (!isAuthenticated || accounts.length === 0) {
      setUser(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    usersApi.getMe()
      .then((res) => { if (!cancelled) setUser(res.data); })
      .catch((err) => {
        console.error('Failed to load user profile:', err);
        if (!cancelled) setUser(null);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [isAuthenticated, accounts, inProgress]);

  // ─── Public API ────────────────────────────────────────────────────────
  const login = useCallback(async () => {
    // Redirect-based flow plays well with the IUS tenant and avoids popup blockers.
    // Use loginPopup() instead if you prefer a popup window.
    await instance.loginRedirect(loginRequest);
  }, [instance]);

  const logout = useCallback(async () => {
    setUser(null);
    await instance.logoutRedirect({
      postLogoutRedirectUri: 'http://localhost:5173/'
    });
  }, [instance]);

  const isAdmin = user?.role === 'Admin';
  const isSeller = !!user; // every authenticated user can list and sell

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin,
        isSeller,
        // Backwards-compat: components that read `register` won't break.
        // Registration in Azure AD happens in the tenant admin portal, not here.
        register: login
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
