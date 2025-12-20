import type { Metadata } from "next";

import type { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";

export type AdminContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
};

export const metadata: Metadata = {
  title: "Contact messages | Admin | Fish Your Style",
  description: "Review recent contact form submissions.",
};

function formatDateTime(isoString: string) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function fetchContactMessages(): Promise<AdminContactMessage[]> {
  const db = getAdminDb();
  if (!db) {
    throw new Error("Firebase Admin is not configured.");
  }

  const snapshot = await db
    .collection("contactMessages")
    .orderBy("createdAt", "desc")
    .limit(200)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data() as {
      name?: string;
      email?: string;
      message?: string;
      createdAt?: Timestamp;
    };

    return {
      id: doc.id,
      name: data.name ?? "",
      email: data.email ?? "",
      message: data.message ?? "",
      createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : "",
    };
  });
}

export default async function ContactMessagesPage() {
  let messages: AdminContactMessage[] = [];
  let error: string | null = null;

  try {
    messages = await fetchContactMessages();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load contact messages.";
    error = message;
  }

  const isEmpty = !error && messages.length === 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200">
          Contact
        </p>
        <h1 className="text-3xl font-semibold text-white">Contact messages</h1>
        <p className="max-w-3xl text-sky-100/90">
          Read customer inquiries submitted through the contact form. Reach out
          quickly to keep conversations flowing and resolve any issues.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl shadow-sky-900/50 backdrop-blur">
        <div className="border-b border-white/10 px-6 py-4 text-sm text-sky-100/80">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-sky-100/80">
            Showing {messages.length}{" "}
            {messages.length === 1 ? "message" : "messages"}
          </span>
        </div>

        {error ? (
          <div className="px-6 py-10 text-center text-sky-100/85">
            <p className="text-lg font-semibold text-white">
              Failed to load contact messages
            </p>
            <p className="mt-2 text-sm text-sky-100/75">{error}</p>
          </div>
        ) : isEmpty ? (
          <div className="px-6 py-12 text-center text-sky-100/85">
            <p className="text-lg font-semibold text-white">
              No contact messages yet.
            </p>
            <p className="mt-2 text-sm">
              When shoppers reach out, their messages will appear here so you
              can respond and keep them engaged.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-sky-100/85">
              <thead className="bg-slate-950/60 backdrop-blur">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200">
                    Name
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200">
                    Email
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200">
                    Message
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200">
                    Created at
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {messages.map((message) => (
                  <tr key={message.id} className="transition hover:bg-white/5">
                    <td className="px-6 py-4 text-white">
                      <div className="font-semibold">
                        {message.name || "Anonymous"}
                      </div>
                      <div className="text-xs text-sky-100/70">
                        {message.id.slice(0, 8)}…
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {message.email ? (
                        <a
                          href={`mailto:${message.email}`}
                          className="font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
                        >
                          {message.email}
                        </a>
                      ) : (
                        <span className="text-sky-100/70">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sky-100/85">
                      <p className="max-w-xl break-words text-sm leading-relaxed text-sky-50">
                        {message.message || "No message provided."}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sky-100/80">
                      {formatDateTime(message.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
