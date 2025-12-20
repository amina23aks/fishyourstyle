"use client";

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getAuthInstance } from "@/lib/firebaseClient";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: FirebaseError | null;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
  const [error, setError] = useState<FirebaseError | null>(null);

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

  const signIn = useCallback(async (email: string, password: string) => {
    const auth = getAuthInstanceOrThrow();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setError(null);
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const auth = getAuthInstanceOrThrow();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setError(null);
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const auth = getAuthInstanceOrThrow();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account",
    });
    try {
      await signInWithPopup(auth, provider);
      setError(null);
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    const auth = getAuthInstanceOrThrow();
    try {
      await firebaseSignOut(auth);
      setError(null);
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      signIn,
      register,
      signInWithGoogle,
      signOut,
    }),
    [user, loading, error, signIn, register, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
