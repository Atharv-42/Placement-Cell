import { createContext, useContext, useEffect, useMemo, useState } from "react";
import API from "../services/api";

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getInitialTheme = () => {
  const storedTheme = localStorage.getItem("theme");

  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("token")));
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    let active = true;

    const syncUser = async () => {
      if (!token) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      try {
        const response = await API.get("/auth/me");
        if (!active) {
          return;
        }

        const nextUser = response.data.user;
        setUser(nextUser);
        localStorage.setItem("user", JSON.stringify(nextUser));
      } catch {
        if (!active) {
          return;
        }

        setUser(null);
        setToken("");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    syncUser();

    return () => {
      active = false;
    };
  }, [token]);

  const login = ({ token: nextToken, user: nextUser }) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem("token", nextToken);
    localStorage.setItem("user", JSON.stringify(nextUser));
  };

  const logout = async () => {
    try {
      await API.post("/auth/logout");
    } catch {
      // Logout is best-effort on the client side.
    } finally {
      setUser(null);
      setToken("");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  };

  const pushNotification = () => {};

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      theme,
      login,
      logout,
      pushNotification,
      setUser,
      setTheme,
      toggleTheme
    }),
    [user, token, loading, theme]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
