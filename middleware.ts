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

    const response = await fetch("http://localhost:8083/api/auth/me", {
      method: "GET",
      headers: {
        Cookie: `token=${token}`,
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      const userData = await response.json()
      return {
        isValid: true,
        user: {
          email: userData.username,
          role: userData.role || [],
          isAdmin: userData.role?.includes("ROLE_ADMIN") || false,
        },
      }
    } else {
      return { isValid: false }
    }
  } catch (error) {
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


  // Get token from cookies
  const token = request.cookies.get("token")?.value

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
    } else {
      // Clear invalid token
      const response = NextResponse.next()
      response.cookies.delete("token")
      return response
    }
  }


  // Handle public routes (login, signup)
  if (isPublicRoute(pathname)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  // Handle protected routes
  if (isProtectedRoute(pathname)) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Check admin routes
    if (isAdminRoute(pathname) && !isAdmin) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    return NextResponse.next()
  }

  // Default: allow access
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
