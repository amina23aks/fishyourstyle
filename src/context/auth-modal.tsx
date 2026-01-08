"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type AuthModalOptions = {
  returnTo?: string;
};

type AuthModalContextValue = {
  isOpen: boolean;
  returnTo?: string;
  openModal: (options?: AuthModalOptions) => void;
  closeModal: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [returnTo, setReturnTo] = useState<string | undefined>(undefined);

  const openModal = useCallback((options?: AuthModalOptions) => {
    setReturnTo(options?.returnTo);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      returnTo,
      openModal,
      closeModal,
    }),
    [isOpen, returnTo, openModal, closeModal],
  );

  return (
    <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>
  );
}

export function useAuthModal(): AuthModalContextValue {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return context;
}
