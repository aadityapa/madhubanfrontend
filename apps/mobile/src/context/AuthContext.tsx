import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthUser, UserRole } from "@madhuban/types";
import { configureAuthTokenGetter } from "@madhuban/api";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const TOKEN_KEY = "madhuban_token";
const USER_KEY = "madhuban_user";

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  role: UserRole | string | undefined;
  isReady: boolean;
  setSession: (token: string, user: AuthUser) => Promise<void>;
  clearSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    configureAuthTokenGetter(() => token);
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [t, u] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (cancelled) return;
        setToken(t);
        if (u) setUser(JSON.parse(u) as AuthUser);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setSession = useCallback(async (nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken);
    setUser(nextUser);
    await AsyncStorage.multiSet([
      [TOKEN_KEY, nextToken],
      [USER_KEY, JSON.stringify(nextUser)],
    ]);
  }, []);

  const clearSession = useCallback(async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      role: user?.role as UserRole | string | undefined,
      isReady,
      setSession,
      clearSession,
    }),
    [token, user, isReady, setSession, clearSession],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
