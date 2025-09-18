import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "development-secret-change-in-production");

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Allow access to login page and auth endpoints
  if (path === "/login" || path.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get("auth-token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Verify the token
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.authenticated === true) {
      return NextResponse.next();
    }
  } catch (error) {
    // Token is invalid or expired
    console.error("Invalid token:", error);
  }

  // Redirect to login if token is invalid
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
