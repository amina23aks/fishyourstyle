import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale } from "./i18n/config";

const PUBLIC_FILE = /\.[^/]+$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_FILE.test(pathname) || pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}`;
    return NextResponse.redirect(url);
  }

  const [, localeCandidate, ...rest] = pathname.split("/");

  if (!isLocale(localeCandidate)) {
    const url = request.nextUrl.clone();
    if (localeCandidate && localeCandidate.length === 2) {
      const restPath = rest.join("/");
      url.pathname = restPath ? `/${defaultLocale}/${restPath}` : `/${defaultLocale}`;
    } else {
      url.pathname = `/${defaultLocale}${pathname}`;
    }
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", localeCandidate);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
