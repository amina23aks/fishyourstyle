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
  const [claimLoading, setClaimLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setIsAdmin(false);
      setClaimLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setClaimLoading(true);
    getAdminClaim(user)
      .then((hasAdminClaim) => {
        if (!cancelled) setIsAdmin(hasAdminClaim);
      })
      .catch((error) => {
        console.error("[admin] Failed to read admin claim", error);
        if (!cancelled) setIsAdmin(false);
      })
      .finally(() => {
        if (!cancelled) setClaimLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { user, loading: loading || claimLoading, isAdmin };
}
