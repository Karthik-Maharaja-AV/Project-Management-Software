import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/reset-password"];
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
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  if (isAuthPage) {
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
