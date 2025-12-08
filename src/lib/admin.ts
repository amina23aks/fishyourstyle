import { useMemo } from "react";
import type { User } from "firebase/auth";

import { useAuth } from "@/context/auth";

export const ADMIN_EMAILS = ["fishyourstyle.supp@gmail.com"] as const;

export function isAdminUser(user: User | null): boolean {
  return ADMIN_EMAILS.includes((user?.email ?? "") as (typeof ADMIN_EMAILS)[number]);
}

export function useAdmin() {
  const { user, loading } = useAuth();

  const isAdmin = useMemo(() => isAdminUser(user), [user]);

  return { user, loading, isAdmin };
}
