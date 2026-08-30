import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Redirected away from when already logged in — showing a login/register form to
// someone who's already signed in serves no purpose.
const LOGGED_OUT_ONLY_PAGES = ["/login", "/register"];
// Always reachable regardless of session state. A password-reset link must work even
// if the browser happens to have an unrelated active session — e.g. resetting on a
// shared/borrowed device, or after suspecting the account was compromised.
const ALWAYS_ACCESSIBLE_AUTH_PAGES = ["/forgot-password", "/reset-password"];
const PUBLIC_PREFIXES = [
  "/api/auth",
  "/api/register",
  "/api/password-reset",
  "/_next",
  "/favicon.ico",
];

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const isApiRoute = pathname.startsWith("/api/");

  if (ALWAYS_ACCESSIBLE_AUTH_PAGES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (LOGGED_OUT_ONLY_PAGES.some((p) => pathname.startsWith(p))) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
