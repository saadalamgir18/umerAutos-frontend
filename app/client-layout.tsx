"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { ReduxProvider } from "@/lib/redux/provider"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isInitializing } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || isInitializing) return

    // If not authenticated and not on login page, redirect to login
    if (!isAuthenticated && pathname !== "/login") {
      router.replace("/login")
      return
    }

    // If authenticated and on login page, redirect to home/dashboard
    if (isAuthenticated && pathname === "/login") {
      router.replace("/")
      return
    }
  }, [isAuthenticated, isInitializing, pathname, router, isMounted])

  // Show loading during initialization
  if (!isMounted || isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ReduxProvider>
        {/* Show login page without dashboard layout */}
        {
          pathname === "/login" ? (
            <>
              {children}
              <Toaster />
            </>
          ) : isAuthenticated ? (
            /* Show dashboard layout for authenticated pages */
            <>
              <DashboardLayout>{children}</DashboardLayout>
              <Toaster />
            </>
          ) : null /* Don't render anything during redirects */
        }
      </ReduxProvider>
    </ThemeProvider>
  )
}
