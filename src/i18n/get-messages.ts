import "server-only";

import type { Locale } from "./config";
import { resolveLocale } from "./config";

export type Messages = Record<string, string>;

export async function getMessages(locale: Locale | string): Promise<Messages> {
  const resolvedLocale = resolveLocale(locale);
  const messages = (await import(`./messages/${resolvedLocale}.json`)).default;
  return messages as Messages;
}
