import type { ReactNode } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"

export default function DashboardPageLayout({
  children,
}: {
  children: ReactNode
}) {
  return <DashboardLayout>{children}</DashboardLayout>
}
