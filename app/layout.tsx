import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastProvider } from "@/components/toast-provider"
import "./globals.css"
import { ReduxProvider } from "@/lib/redux/provider"

export const metadata = {
  title: "Inventory Management System",
  description: "A comprehensive inventory management system",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ReduxProvider>
            {children}
            <ToastProvider />
          </ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
