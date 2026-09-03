import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import type { UserProfile } from "../services/api";

interface AuthContextType {
  user: UserProfile | null;
  pendingEmail: string;
  setPendingEmail: (email: string) => void;
  loading: boolean;
  fetchUser: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const sessionRequestId = useRef(0);

  const fetchUser = useCallback(async (): Promise<UserProfile | null> => {
    const requestId = ++sessionRequestId.current;

    try {
      const response = await api.get<{ user: UserProfile }>("/api/auth/me");
      const authenticatedUser = response.data.user;

      if (requestId === sessionRequestId.current) {
        setUser(authenticatedUser);
        setLoading(false);
      }

      return authenticatedUser;
    } catch {
      if (requestId === sessionRequestId.current) {
        setUser(null);
        setLoading(false);
      }

      return null;
    }
  }, []);

  const logout = async () => {
    // Ignore any in-flight session lookup that began before logout.
    sessionRequestId.current += 1;

    try {
      await api.post("/api/auth/logout");
    } finally {
      setUser(null);
      setPendingEmail("");
    }
  };

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        pendingEmail,
        setPendingEmail,
        loading,
        fetchUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
