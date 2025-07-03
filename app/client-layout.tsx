"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { AuthProvider, useAuth } from "@/lib/contexts/auth-context"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { ReduxProvider } from "@/lib/redux/provider"

function AuthenticatedApp({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth()
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

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

  // Define public routes that don't need authentication
  const publicRoutes = ["/login", "/signup"]
  const isPublicRoute = publicRoutes.includes(pathname)


  return (
    <>
      {isPublicRoute ? (
        // Public pages (login, signup) without dashboard layout
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
        // Show loading for protected routes while middleware handles redirect
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
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
