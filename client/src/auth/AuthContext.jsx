import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../api.js";
import { connectSocket, default as socket } from "../socket.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const res = await api("/auth");
      setUser(res.data);
      // connect socket and request joining rooms using token (server validates token)
      try {
        connectSocket();
        const token2 = localStorage.getItem("token");
        if (token2) {
          if (socket.connected) socket.emit("auth:join", { token: token2 });
          else socket.once("connect", () => socket.emit("auth:join", { token: token2 }));
        }
      } catch (e) {
        // ignore socket errors
      }
      return res.data;
    } catch {
      localStorage.removeItem("token");
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email, password) => {
    const res = await api("/auth/login", { method: "POST", body: { email, password } });
    localStorage.setItem("token", res.token);
    setUser(res.data);
    try {
      connectSocket();
      const token2 = localStorage.getItem("token");
      if (token2) {
        if (socket.connected) socket.emit("auth:join", { token: token2 });
        else socket.once("connect", () => socket.emit("auth:join", { token: token2 }));
      }
    } catch (e) {}
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    try { if (socket && socket.connected) socket.disconnect(); } catch (e) {}
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refreshUser,
    }),
    [user, loading, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
