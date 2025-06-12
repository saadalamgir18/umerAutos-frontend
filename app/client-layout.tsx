"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/lib/contexts/auth-context"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { ReduxProvider } from "@/lib/redux/provider"

function AuthenticatedApp({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Don't do anything until component is mounted and auth is initialized
    if (!isMounted || isInitializing) {
      console.log("⏳ Waiting for initialization", {
        isMounted,
        isInitializing,
        pathname,
      })
      return
    }

    console.log("🔍 Checking auth state", {
      isAuthenticated,
      pathname,
    })

    // Handle redirects based on authentication state
    if (!isAuthenticated && pathname !== "/login") {
      console.log("🔄 Redirecting to login - user not authenticated")
      router.replace("/login")
    } else if (isAuthenticated && pathname === "/login") {
      console.log("🔄 Redirecting to home - user already authenticated")
      router.replace("/")
    } else {
      console.log("✅ No redirect needed")
    }
  }, [isAuthenticated, isInitializing, pathname, router, isMounted])

  // Show loading during initialization or mounting
  if (!isMounted || isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">{!isMounted ? "Loading..." : "Checking authentication..."}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {pathname === "/login" ? (
        // Login page without dashboard layout
        <>
          {children}
          <Toaster />
        </>
      ) : isAuthenticated ? (
        // Dashboard layout for authenticated pages
        <>
          <DashboardLayout>{children}</DashboardLayout>
          <Toaster />
        </>
      ) : (
        // Show loading while redirect is happening
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Redirecting...</p>
          </div>
        </div>
      )}
    </>
  )
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ReduxProvider>
        <AuthProvider>
          <AuthenticatedApp>{children}</AuthenticatedApp>
        </AuthProvider>
      </ReduxProvider>
    </ThemeProvider>
  )
}
