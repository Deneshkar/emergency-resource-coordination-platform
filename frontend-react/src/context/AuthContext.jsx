import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authService } from "../services/authService";
import { getStoredToken, getStoredUser, clearStoredAuth } from "../services/api";

const AuthContext = createContext(null);

const DEMO_CREDENTIALS = {
  Coordinator: { email: "coordinator@ercp.org", password: "Coord@123" },
  Admin: { email: "admin@ercp.org", password: "Admin@123" },
  Volunteer: { email: "volunteer@ercp.org", password: "Vol@123" },
  Citizen: { email: "citizen@ercp.org", password: "Citizen@123" },
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  // Synchronize on startup: verify current token by fetching /auth/me
  useEffect(() => {
    let alive = true;
    const initAuth = async () => {
      const savedToken = getStoredToken();
      if (!savedToken) {
        if (alive) setIsLoading(false);
        return;
      }

      try {
        const profile = await authService.getProfile();
        if (alive && profile) {
          setUser(profile);
        }
      } catch (err) {
        console.warn("Session expired or invalid token:", err.message);
        clearStoredAuth();
        if (alive) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    initAuth();

    // Listen to unauthorized events from api interceptor
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener("ercp:unauthorized", handleUnauthorized);

    return () => {
      alive = false;
      window.removeEventListener("ercp:unauthorized", handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const res = await authService.login(email, password);
      setToken(res.token);
      setUser(res.user);
      return res;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const demoLogin = useCallback(async (roleName) => {
    const creds = DEMO_CREDENTIALS[roleName];
    if (!creds) {
      throw new Error(`Unknown demo role: ${roleName}`);
    }
    return login(creds.email, creds.password);
  }, [login]);

  const register = useCallback(async (userData) => {
    setIsLoading(true);
    try {
      const res = await authService.register(userData);
      setToken(res.token);
      setUser(res.user);
      return res;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setToken(null);
    setUser(null);
  }, []);

  const role = user?.role || (token ? "Authenticated" : "Guest");
  const isAuthenticated = Boolean(token && user);

  const value = {
    user,
    token,
    role,
    isAuthenticated,
    isLoading,
    login,
    demoLogin,
    register,
    logout,
    hasRole: (allowedRoles) => {
      if (!allowedRoles || allowedRoles.length === 0) return true;
      if (!user) return false;
      const list = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      return list.includes(user.role);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
