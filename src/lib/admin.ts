import { useEffect, useState } from "react";
import type { User } from "firebase/auth";

import { useAuth } from "@/context/auth";

export async function getAdminClaim(user: User | null): Promise<boolean> {
  if (!user) return false;

  const idTokenResult = await user.getIdTokenResult();
  return idTokenResult.claims.admin === true;
}

export function useAdmin() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkedUid, setCheckedUid] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setIsAdmin(false);
      setCheckedUid(null);
      return () => {
        cancelled = true;
      };
    }

    setCheckedUid(null);
    getAdminClaim(user)
      .then((hasAdminClaim) => {
        if (!cancelled) {
          setIsAdmin(hasAdminClaim);
          setCheckedUid(user.uid);
        }
      })
      .catch((error) => {
        console.error("[admin] Failed to read admin claim", error);
        if (!cancelled) {
          setIsAdmin(false);
          setCheckedUid(user.uid);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const claimLoading = Boolean(user) && checkedUid !== user?.uid;

  return { user, loading: loading || claimLoading, isAdmin };
}
