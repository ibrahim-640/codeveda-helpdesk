import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until /auth/me answers

  // On page load, ask the API who we are (the cookie is sent automatically)
  useEffect(() => {
    api("/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const loggedIn = await api("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setUser(loggedIn);
    return loggedIn;
  }

  // Signup doesn't log you in on the server, so we log in right after
  async function signup(name, email, password) {
    await api("/auth/signup", {
      method: "POST",
      body: { name, email, password },
    });
    return login(email, password);
  }

  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}