import { NextResponse } from "next/server";
import { AUTH_COOKIE, verifyAuthToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/login"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const loggedIn = await verifyAuthToken(request.cookies.get(AUTH_COOKIE)?.value);

  if (PUBLIC_PATHS.includes(pathname)) {
    // Already logged in? Skip the login page.
    if (pathname === "/login" && loggedIn) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (loggedIn) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // Everything except Next.js internals and static assets requires login
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
