import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/training", "/profile", "/onboarding"];
const AUTH_PATHS = ["/login", "/register"];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  const hasRefreshCookie = request.cookies.has("iron-refresh");

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthPage = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // Unauthenticated user hitting a protected route → redirect to login
  if (isProtected && !hasRefreshCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user visiting login/register → redirect to home
  if (isAuthPage && hasRefreshCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run on all paths except:
     * - _next/static (static files)
     * - _next/image  (image optimization)
     * - favicon.ico
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|api/).*)",
  ],
};
