"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { collection, getDocs, limit, orderBy, query, type Timestamp } from "firebase/firestore";

import { getServerDb } from "@/lib/firestore";
import { isFirebaseConfigured } from "@/lib/firebaseConfig";

export type AdminContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
};

type FirestoreContact = {
  name?: string;
  email?: string;
  message?: string;
  createdAt?: Timestamp | string | Date;
};

function toIsoString(value?: Timestamp | string | Date): string {
  if (!value) return "";
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  try {
    return value.toDate().toISOString();
  } catch {
    return "";
  }
}

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

export function ContactMessagesClient() {
  const [messages, setMessages] = useState<AdminContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<AdminContactMessage | null>(null);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!isFirebaseConfigured()) {
        throw new Error("Firebase is not configured. Please add your environment variables.");
      }

      const db = getServerDb();
      const snapshot = await getDocs(
        query(collection(db, "contactMessages"), orderBy("createdAt", "desc"), limit(50)),
      );

      const mapped = snapshot.docs.map((doc) => {
        const data = doc.data() as FirestoreContact;

        return {
          id: doc.id,
          name: data.name ?? "",
          email: data.email ?? "",
          message: data.message ?? "",
          createdAt: toIsoString(data.createdAt),
        };
      });

      setMessages(mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load contact messages.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const isEmpty = !loading && !error && messages.length === 0;

  const messageCountLabel = useMemo(() => {
    const count = messages.length;
    return `${count} ${count === 1 ? "message" : "messages"}`;
  }, [messages.length]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Contact</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Contact messages</h1>
        <p className="max-w-3xl text-sm text-sky-100/90 sm:text-base">
          Read customer inquiries submitted through the contact form. Reach out quickly to keep conversations flowing
          and resolve any issues.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 justify-between">
        <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-sky-100/80">
          Showing {messageCountLabel}
        </span>
        <button
          type="button"
          onClick={() => void loadMessages()}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-900/30 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <span className={`h-2 w-2 rounded-full ${loading ? "animate-pulse bg-amber-300" : "bg-emerald-300"}`} />
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl shadow-sky-900/50 backdrop-blur">
        {error ? (
          <div className="px-6 py-10 text-center text-sky-100/85">
            <p className="text-lg font-semibold text-white">Failed to load contact messages</p>
            <p className="mt-2 text-sm text-sky-100/75">{error}</p>
            <button
              type="button"
              onClick={() => void loadMessages()}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow shadow-sky-900/40 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="divide-y divide-white/5">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="grid grid-cols-4 gap-4 px-6 py-4 sm:grid-cols-4">
                {[...Array(4)].map((__, skeletonIndex) => (
                  <span
                    key={skeletonIndex}
                    className="h-4 rounded-full bg-white/10 animate-pulse"
                    aria-hidden="true"
                  />
                ))}
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="px-6 py-12 text-center text-sky-100/85">
            <p className="text-lg font-semibold text-white">No contact messages yet.</p>
            <p className="mt-2 text-sm">
              When shoppers reach out, their messages will appear here so you can respond and keep them engaged.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-sky-100/85">
              <thead className="bg-slate-950/60 backdrop-blur">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200">Name</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200">Email</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200">Message</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200">Created at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {messages.map((message) => (
                  <tr
                    key={message.id}
                    className="cursor-pointer transition hover:bg-white/5"
                    onClick={() => setSelectedMessage(message)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedMessage(message);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <td className="px-6 py-4 text-white">
                      <div className="font-semibold">{message.name || "Anonymous"}</div>
                      <div className="text-xs text-sky-100/70">{message.id.slice(0, 8)}…</div>
                    </td>
                    <td className="px-6 py-4">
                      {message.email ? (
                        <a
                          href={`mailto:${message.email}`}
                          className="font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {message.email}
                        </a>
                      ) : (
                        <span className="text-sky-100/70">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sky-100/85">
                      <p className="max-w-xl break-words text-sm leading-relaxed text-sky-50 line-clamp-2">
                        {message.message || "No message provided."}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sky-100/80">{formatDateTime(message.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedMessage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setSelectedMessage(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900/90 p-6 text-sky-50 shadow-2xl shadow-sky-900/40">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Contact message</p>
                <h2 className="text-2xl font-semibold text-white">{selectedMessage.name || "Anonymous"}</h2>
                <p className="text-sm text-sky-100/80">{formatDateTime(selectedMessage.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="inline-flex items-center rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex flex-col gap-1 text-sm text-sky-100/85">
                <span className="text-xs uppercase tracking-[0.18em] text-sky-200">Email</span>
                {selectedMessage.email ? (
                  <a
                    href={`mailto:${selectedMessage.email}`}
                    className="font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
                  >
                    {selectedMessage.email}
                  </a>
                ) : (
                  <span className="text-sky-100/70">—</span>
                )}
              </div>

              <div className="space-y-2 text-sm text-sky-100/90">
                <span className="text-xs uppercase tracking-[0.18em] text-sky-200">Message</span>
                <div className="max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-sky-50 shadow-inner shadow-sky-900/40">
                  {selectedMessage.message || "No message provided."}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
