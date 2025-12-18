import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdminFromDecodedToken, verifyIdTokenFromHeaders } from "@/lib/auth/serverAuth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const headerList = await headers();
  const decodedToken = await verifyIdTokenFromHeaders(headerList);

  if (!decodedToken || !isAdminFromDecodedToken(decodedToken)) {
    redirect("/");
  }

  return <>{children}</>;
}
