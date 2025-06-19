import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define route patterns
const publicRoutes = ["/login", "/signup"]
const protectedRoutes = [
  "/dashboard",
  "/products",
  "/suppliers",
  "/sales",
  "/brands",
  "/shelf-code",
  "/compatible-models",
  "/low-stock",
  "/daily-sales",
  "/all-sales",
  "/debtors",
]
const adminRoutes = ["/users", "/expenses"]

// Helper function to check if route is protected
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some((route) => pathname.startsWith(route)) || pathname === "/"
}

// Helper function to check if route is admin only
function isAdminRoute(pathname: string): boolean {
  return adminRoutes.some((route) => pathname.startsWith(route))
}

// Helper function to check if route is public (auth pages)
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.includes(pathname)
}

// Helper function to verify token with Spring Boot backend
async function verifyTokenWithBackend(token: string): Promise<{ isValid: boolean; user?: any }> {
  try {
    console.log("🔍 Verifying token with Spring Boot backend...")

    const response = await fetch("http://localhost:8083/api/auth/me", {
      method: "GET",
      headers: {
        Cookie: `token=${token}`,
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      const userData = await response.json()
      console.log("✅ Token verified successfully:", userData)
      return {
        isValid: true,
        user: {
          email: userData.username,
          role: userData.role || [],
          isAdmin: userData.role?.includes("ROLE_ADMIN") || false,
        },
      }
    } else {
      console.log("❌ Token verification failed:", response.status)
      return { isValid: false }
    }
  } catch (error) {
    console.error("❌ Error verifying token with backend:", error)
    return { isValid: false }
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next()
  }

  console.log(`🔍 Middleware: ${pathname}`)

  // Get token from cookies
  const token = request.cookies.get("token")?.value
  console.log(`🔐 Token exists: ${!!token}`)

  let isAuthenticated = false
  let isAdmin = false
  let user = null

  // Verify token with Spring Boot backend if it exists
  if (token) {
    const { isValid, user: userData } = await verifyTokenWithBackend(token)
    if (isValid && userData) {
      isAuthenticated = true
      isAdmin = userData.isAdmin
      user = userData
      console.log(`✅ User authenticated: ${userData.email}, Admin: ${isAdmin}`)
    } else {
      console.log("❌ Invalid token, clearing cookie")
      // Clear invalid token
      const response = NextResponse.next()
      response.cookies.delete("token")
      return response
    }
  }

  console.log(`🔐 Auth status: ${isAuthenticated}, Admin: ${isAdmin}`)

  // Handle public routes (login, signup)
  if (isPublicRoute(pathname)) {
    if (isAuthenticated) {
      console.log("🔄 Authenticated user accessing auth page, redirecting to dashboard")
      return NextResponse.redirect(new URL("/", request.url))
    }
    console.log("👤 Non-authenticated user accessing auth route, allowing access")
    return NextResponse.next()
  }

  // Handle protected routes
  if (isProtectedRoute(pathname)) {
    if (!isAuthenticated) {
      console.log("🚫 Non-authenticated user accessing protected route, redirecting to login")
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Check admin routes
    if (isAdminRoute(pathname) && !isAdmin) {
      console.log("🚫 Non-admin user accessing admin route, redirecting to dashboard")
      return NextResponse.redirect(new URL("/", request.url))
    }

    console.log("✅ Authenticated user accessing protected route, allowing access")
    return NextResponse.next()
  }

  // Default: allow access
  console.log("➡️ Default: allowing access")
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
