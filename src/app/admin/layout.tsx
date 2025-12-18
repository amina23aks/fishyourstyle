import type { ReactNode } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin, verifyIdToken } from "@/lib/firebaseAdmin";

async function requireAdmin() {
  const headerList = await headers();
  const authHeader = headerList.get("authorization") ?? headerList.get("Authorization");
  let token = authHeader?.startsWith("Bearer ") ? authHeader.replace("Bearer ", "").trim() : null;

  if (!token) {
    const cookieStore = await cookies();
    token =
      cookieStore.get("__session")?.value ??
      cookieStore.get("session")?.value ??
      cookieStore.get("idToken")?.value ??
      null;
  }

  if (!token) {
    redirect("/");
  }

  try {
    const decoded = await verifyIdToken(token);

    if (!isAdmin(decoded)) {
      redirect("/");
    }
  } catch {
    redirect("/");
  }
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
