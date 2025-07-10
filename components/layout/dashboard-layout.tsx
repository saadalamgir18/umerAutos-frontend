"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/contexts/auth-context"
import { Button } from "@/components/ui/button"
import {
  Package,
  ShoppingCart,
  Users,
  LogOut,
  Menu,
  Home,
  Receipt,
  AlertTriangle,
  ChevronDown,
  BellRing,
  Calendar,
  BookOpen,
  Settings,
  Shield,
  Tag,
  Layers,
  Car,
  User,
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

// Navigation items with updated structure
const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: <Home className="h-5 w-5" />,
  },
  {
    title: "Products",
    href: "/products",
    icon: <Package className="h-5 w-5" />,
  },
  {
    title: "Low Stock",
    href: "/low-stock",
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  {
    title: "Sales",
    href: "/sales",
    icon: <ShoppingCart className="h-5 w-5" />,
  },
  {
    title: "Today Sales",
    href: "/daily-sales",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    title: "All Sales",
    href: "/all-sales",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    title: "Debtors",
    href: "/debtors",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    title: "Expenses",
    href: "/expenses",
    icon: <Receipt className="h-5 w-5" />,
  },
  {
    title: "Suppliers",
    href: "/suppliers",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Brands",
    href: "/brands",
    icon: <Tag className="h-5 w-5" />,
  },
  {
    title: "Shelf Code",
    href: "/shelf-code",
    icon: <Layers className="h-5 w-5" />,
  },
  {
    title: "Compatible Models",
    href: "/compatible-models",
    icon: <Car className="h-5 w-5" />,
  },
  {
    title: "Users",
    href: "/users",
    icon: <User className="h-5 w-5" />,
  }
]


const getUserInitials = (username?: string): string => {
  if (!username) return "U"

  // If username is an email, get the first letter before @
  if (username.includes("@")) {
    const name = username.split("@")[0]
    return name.charAt(0).toUpperCase()
  }

  return username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const { products } = useSelector((state: RootState) => state.products)

  const lowStockCount = useMemo(() => {
    if (!products || products.length === 0) return 0
    const lowStock = products.filter((p) => p.quantityInStock > 0 && p.quantityInStock <= 10).length
    const outOfStock = products.filter((p) => p.quantityInStock === 0).length
    return lowStock + outOfStock
  }, [products])

  const currentPageTitle = useMemo(() => {
    const item = navItems.find((item) => item.href === pathname)
    return item?.title || "Dashboard"
  }, [pathname])

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const newState = !prev
      localStorage.setItem("sidebarCollapsed", String(newState))
      return newState
    })
  }, [])

  useEffect(() => {
    const savedSidebarState = localStorage.getItem("sidebarCollapsed")
    if (savedSidebarState) {
      setIsSidebarCollapsed(savedSidebarState === "true")
    }
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const displayName = user?.username || "User"
  const userRole = user?.role?.includes("ROLE_ADMIN") ? "Admin" : "User"

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col bg-background">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur px-4 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-2 border-b p-4">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{displayName}</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {userRole === "Admin" && <Shield className="h-3 w-3 text-primary" />}
                      <span className="capitalize">{userRole}</span>
                    </div>
                  </div>
                </div>
                <nav className="flex-1 overflow-auto py-4">
                  <ul className="grid gap-1 px-2">
                    {navItems.map((item) => (
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
                          {item.title === "Low Stock" && lowStockCount > 0 && (
                            <Badge variant="destructive" className="ml-auto">
                              {lowStockCount}
                            </Badge>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="border-t p-4">
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center">
            <Link href="/" className="font-bold text-lg">
              Gear<span className="text-primary">Stock</span>
            </Link>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {lowStockCount > 0 && (
              <Button variant="ghost" size="icon" className="relative">
                <BellRing className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                  {lowStockCount}
                </span>
              </Button>
            )}
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getUserInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="flex flex-col">
                  <span>{displayName}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    {userRole === "Admin" && <Shield className="h-3 w-3 text-primary" />}
                    <span className="capitalize">{userRole}</span>
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
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
                <Link href="/" className="font-bold text-lg">
                  Gear<span className="text-primary">Stock</span>
                </Link>
              )}
              <Button
                variant="ghost"
                size="icon"
                className={`${isSidebarCollapsed ? "mx-auto" : "ml-auto"}`}
                onClick={toggleSidebar}
              >
                <ChevronDown
                  className={`h-5 w-5 transition-transform duration-200 ${
                    isSidebarCollapsed ? "-rotate-90" : "rotate-0"
                  }`}
                />
              </Button>
            </div>

            <div className="flex flex-col h-[calc(100vh-4rem)] p-4">
              {!isSidebarCollapsed && (
                <div className="flex items-center gap-2 mb-6">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{displayName}</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {userRole === "Admin" && <Shield className="h-3 w-3 text-primary" />}
                      <span className="capitalize">{userRole}</span>
                    </div>
                  </div>
                </div>
              )}

              <nav className="flex-1">
                <ul className="grid gap-1">
                  {navItems.map((item) => (
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
                            {!isSidebarCollapsed && (
                              <>
                                <span>{item.title}</span>
                                {item.title === "Low Stock" && lowStockCount > 0 && (
                                  <Badge variant="destructive" className="ml-auto">
                                    {lowStockCount}
                                  </Badge>
                                )}
                              </>
                            )}
                            {isSidebarCollapsed && item.title === "Low Stock" && lowStockCount > 0 && (
                              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                                {lowStockCount}
                              </span>
                            )}
                          </Link>
                        </TooltipTrigger>
                        {isSidebarCollapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
                      </Tooltip>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="mt-auto pt-6">
                <div className="flex flex-col gap-2">
                  {!isSidebarCollapsed ? (
                    <>
                      <div className="flex items-center justify-between px-2">
                        <span className="text-sm text-muted-foreground">Theme</span>
                        <ThemeToggle />
                      </div>
                      <Button variant="outline" className="justify-start" onClick={handleLogout}>
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
                          <Button variant="outline" size="icon" onClick={handleLogout}>
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
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {/* Desktop Header */}
            <header className="hidden md:flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur px-6 sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">{currentPageTitle}</h1>
              </div>
              <div className="flex items-center gap-4">
                {lowStockCount > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => router.push("/low-stock")}
                    className="flex items-center gap-2 group"
                  >
                    <AlertTriangle className="h-4 w-4 text-amber-500 group-hover:animate-pulse" />
                    <span>Low Stock</span>
                    <Badge variant="destructive" className="ml-1 group-hover:scale-110 transition-transform">
                      {lowStockCount}
                    </Badge>
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8 ring-2 ring-primary/10 transition-all hover:ring-primary/30">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getUserInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="flex flex-col">
                      <span>{displayName}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        {userRole === "Admin" && <Shield className="h-3 w-3 text-primary" />}
                        <span className="capitalize">{userRole}</span>
                      </span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isAdmin() && (
                      <DropdownMenuItem onClick={() => router.push("/settings")}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>
            <div className="container py-6 px-3">{children}</div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
