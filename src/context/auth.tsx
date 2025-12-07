"use client";

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getAuthInstance } from "@/lib/firebaseClient";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  loginWithEmailPassword: (email: string, password: string) => Promise<void>;
  registerWithEmailPassword: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getAuthInstanceOrThrow() {
  const authInstance = getAuthInstance();
  if (!authInstance) {
    throw new Error("Firebase Auth is not available in this environment.");
  }
  return authInstance;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuthInstance();

    if (!auth) {
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmailPassword = useCallback(async (email: string, password: string) => {
    const auth = getAuthInstanceOrThrow();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("[auth] signIn error", error);
      throw error; // preserve .code
    }
  }, []);

  const registerWithEmailPassword = useCallback(async (email: string, password: string) => {
    const auth = getAuthInstanceOrThrow();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("[auth] register error", error);
      throw error;
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const auth = getAuthInstanceOrThrow();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("[auth] signInWithGoogle error", error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    const auth = getAuthInstanceOrThrow();
    await signOut(auth);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      loginWithEmailPassword,
      registerWithEmailPassword,
      loginWithGoogle,
      logout,
    }),
    [
      user,
      loading,
      loginWithEmailPassword,
      registerWithEmailPassword,
      loginWithGoogle,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
