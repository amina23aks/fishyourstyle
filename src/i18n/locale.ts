import "server-only";

import { headers } from "next/headers";
import { resolveLocale } from "./config";

export async function getLocaleFromHeaders() {
  const localeHeader = (await headers()).get("x-locale");
  return resolveLocale(localeHeader);
}
