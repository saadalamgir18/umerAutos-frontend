"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/hooks/use-auth"
import { Button } from "@/components/ui/button"
import {
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Menu,
  Home,
  Receipt,
  AlertTriangle,
  ChevronDown,
  BellRing,
  Calendar,
  BookOpen,
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Define interfaces for better type safety
interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  adminOnly?: boolean
}

// Navigation items
const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <Home className="h-5 w-5" />,
  },
  {
    title: "Products",
    href: "/dashboard/products",
    icon: <Package className="h-5 w-5" />,
  },
  {
    title: "Sales",
    href: "/dashboard/sales",
    icon: <ShoppingCart className="h-5 w-5" />,
  },
  {
    title: "Today Sales",
    href: "/dashboard/daily-sales",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    title: "All Sales",
    href: "/dashboard/all-sales",
    icon: <Calendar className="h-5 w-5" />,
  },

  {
    title: "Khata",
    href: "/dashboard/khata",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    title: "Expenses",
    href: "/dashboard/expenses",
    icon: <Receipt className="h-5 w-5" />,
  },

  {
    title: "Suppliers",
    href: "/dashboard/suppliers",
    icon: <Users className="h-5 w-5" />,
  },

]

// Helper function to get user initials
const getUserInitials = (name?: string): string => {
  if (!name) return "U"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
}

// Separate component for the user avatar to reduce re-renders
const UserAvatar = React.memo(({ name, role }: { name?: string; role?: string }) => {
  const initials = getUserInitials(name)

  return (
    <div className="flex items-center gap-2">
      <Avatar>
        <AvatarImage src="/avatar-placeholder.png" alt={name || "User"} />
        <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="font-medium">{name}</span>
        <span className="text-xs text-muted-foreground capitalize">{role}</span>
      </div>
    </div>
  )
})
UserAvatar.displayName = "UserAvatar"

// Separate component for the navigation menu
const NavigationMenu = React.memo(
  ({
    items,
    pathname,
    isSidebarCollapsed,
    lowStockCount,
  }: {
    items: NavItem[]
    pathname: string
    isSidebarCollapsed: boolean
    lowStockCount: number
  }) => {
    return (
      <TooltipProvider>
        <nav>
          <ul className="grid gap-1">
            {items.map((item) => (
              <li key={item.href}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        pathname === item.href
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {item.icon}
                      {!isSidebarCollapsed && <span>{item.title}</span>}
                      {!isSidebarCollapsed && item.title === "Products" && lowStockCount > 0}
                    </Link>
                  </TooltipTrigger>
                  {isSidebarCollapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
                </Tooltip>
              </li>
            ))}
          </ul>
        </nav>
      </TooltipProvider>
    )
  },
)
NavigationMenu.displayName = "NavigationMenu"

// Separate component for the mobile navigation
const MobileNavigation = React.memo(
  ({
    items,
    pathname,
    user,
    logout,
  }: {
    items: NavItem[]
    pathname: string
    user: any
    logout: () => void
  }) => {
    const initials = getUserInitials(user?.name)

    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b p-4">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">{user?.name}</span>
                <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
              </div>
            </div>
            <nav className="flex-1 overflow-auto py-4">
              <ul className="grid gap-1 px-2">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        pathname === item.href
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {item.icon}
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="border-t p-4">
              <Button variant="outline" className="w-full justify-start gap-2" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  },
)
MobileNavigation.displayName = "MobileNavigation"

// Separate component for the header actions
const HeaderActions = React.memo(
  ({
    lowStockCount,
    router,
    user,
    logout,
  }: {
    lowStockCount: number
    router: any
    user: any
    logout: () => void
  }) => {
    const initials = getUserInitials(user?.name)

    return (
      <div className="flex items-center gap-4">
        {lowStockCount > 0 && (
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/products/low-stock")}
            className="flex items-center gap-2 group"
          >
            <AlertTriangle className="h-4 w-4 text-amber-500 group-hover:animate-pulse" />
            <span>Low Stock</span>
            <Badge variant="destructive" className="ml-1 group-hover:scale-110 transition-transform">
              {lowStockCount}
            </Badge>
          </Button>
        )}
        {/* <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => router.push("/dashboard/products/low-stock")}
        >
          <BellRing className="h-5 w-5" />
          {lowStockCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground animate-pulse">
              {lowStockCount}
            </span>
          )}
        </Button> */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8 ring-2 ring-primary/10 transition-all hover:ring-primary/30">
                <AvatarImage src="/avatar-placeholder.png" alt={user?.name || "User"} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  },
)
HeaderActions.displayName = "HeaderActions"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const { products } = useSelector((state: RootState) => state.products)

  // Memoize low stock count calculation to avoid recalculating on every render
  const lowStockCount = useMemo(() => {
    if (!products || products.length === 0) return 0
    const lowStock = products.filter((p) => p.quantityInStock > 0 && p.quantityInStock <= 5).length
    const outOfStock = products.filter((p) => p.quantityInStock === 0).length
    return lowStock + outOfStock
  }, [products])

  // Filter nav items based on user role
  const filteredNavItems = useMemo(() => {
    return navItems.filter((item) => !item.adminOnly || user?.role === "admin")
  }, [user?.role])

  // Get current page title
  const currentPageTitle = useMemo(() => {
    return filteredNavItems.find((item) => item.href === pathname)?.title || "Dashboard"
  }, [filteredNavItems, pathname])

  // Toggle sidebar with memoized callback
  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const newState = !prev
      localStorage.setItem("sidebarCollapsed", String(newState))
      return newState
    })
  }, [])

  // Initialize component and handle authentication
  useEffect(() => {
    setIsMounted(true)

    // Check for sidebar state in localStorage
    const savedSidebarState = localStorage.getItem("sidebarCollapsed")
    if (savedSidebarState) {
      setIsSidebarCollapsed(savedSidebarState === "true")
    }
  }, [])

  // Handle authentication redirects
  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.push("/login")
    }
  }, [isMounted, isAuthenticated, router])

  // Early return for non-mounted or non-authenticated state
  if (!isMounted || !isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur px-4 md:hidden">
        <MobileNavigation items={filteredNavItems} pathname={pathname} user={user} logout={logout} />
        <div className="flex items-center">
          <span className="font-bold text-lg">
            Moto<span className="text-primary">Parts</span>
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <BellRing className="h-5 w-5" />
            {lowStockCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                {lowStockCount}
              </span>
            )}
          </Button>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getUserInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden md:flex flex-col border-r bg-card transition-all duration-300 sticky top-0 h-screen ${
            isSidebarCollapsed ? "w-[4.5rem]" : "w-64"
          }`}
        >
          <div className="flex h-16 items-center gap-2 border-b px-4">
            {!isSidebarCollapsed && (
              <span className="font-bold text-lg">
                Moto<span className="text-primary">Parts</span>
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={`${isSidebarCollapsed ? "mx-auto" : "ml-auto"}`}
              onClick={toggleSidebar}
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <ChevronDown
                className={`h-5 w-5 transition-transform duration-200 ${
                  isSidebarCollapsed ? "-rotate-90" : "rotate-0"
                }`}
              />
            </Button>
          </div>
          <div className="flex flex-col h-[calc(100vh-4rem)] p-4">
            {!isSidebarCollapsed && <UserAvatar name={user?.name} role={user?.role} />}

            <div className="flex flex-col justify-between h-full mt-6">
              <NavigationMenu
                items={filteredNavItems}
                pathname={pathname}
                isSidebarCollapsed={isSidebarCollapsed}
                lowStockCount={lowStockCount}
              />

              <div className="mt-auto pt-6">
                <div className="flex flex-col gap-2">
                  {!isSidebarCollapsed ? (
                    <>
                      <div className="flex items-center justify-between px-2">
                        <span className="text-sm text-muted-foreground">Theme</span>
                        <ThemeToggle />
                      </div>
                      <Button variant="outline" className="justify-start" onClick={logout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex justify-center">
                            <ThemeToggle />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">Toggle theme</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={logout}>
                            <LogOut className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Logout</TooltipContent>
                      </Tooltip>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* Desktop Header */}
          <header className="hidden md:flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur px-6 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{currentPageTitle}</h1>
            </div>
            <HeaderActions lowStockCount={lowStockCount} router={router} user={user} logout={logout} />
          </header>
          <div className="container py-6 px-3">{children}</div>
        </main>
      </div>
    </div>
  )
}
