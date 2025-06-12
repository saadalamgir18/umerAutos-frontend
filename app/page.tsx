"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import DashboardClientPage from "../components/DashboardClientPage"
import { useAuth } from "@/lib/contexts/auth-context"

export default function HomePage() {
  const { isAuthenticated, isInitializing } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace("/login")
    }
  }, [isAuthenticated, isInitializing, router])

  // Show loading while checking authentication
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Show dashboard content when authenticated
  return <DashboardClientPage />
}
