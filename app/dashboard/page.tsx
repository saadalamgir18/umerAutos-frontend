import type { Metadata } from "next"
import DashboardClientPage from "./DashboardClientPage"

export const metadata: Metadata = {
  title: "Dashboard | Motorcycle Parts Inventory",
  description: "Dashboard overview for motorcycle parts inventory system",
}

export default function DashboardPage() {
  return <DashboardClientPage />
}
