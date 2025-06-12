"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, DollarSign, TrendingUp, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/contexts/auth-context"

export default function DashboardClientPage() {
  const [mounted, setMounted] = useState(false)
  const { user } = useAuth()
  const isAdmin = user?.role[0] === "ROLE_ADMIN"
  console.log(user);
  
  console.log("isAdmin: ", isAdmin);
  

  const [todayExpenses, setTodayExpenses] = useState<number>(0)
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(0)
  const [todaySales, setTodaySales] = useState<any[]>([])
  const [monthlySales, setMonthlySales] = useState<any[]>([])
  const [todaySalesRevenue, setTodaySalesRevenue] = useState<number>(0)
  const [monthlySalesRevenue, setMonthlySalesRevenue] = useState<number>(0)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)

    async function fetchData() {
      try {
        const [todayExpRes, monthlyExpRes, monthlySales, todaySales] = await Promise.all([
          fetch("http://localhost:8083/api/v1/expenses/today", {credentials: "include"}),
          fetch("http://localhost:8083/api/v1/expenses/monthly", {credentials: "include"}),
          fetch("http://localhost:8083/api/v1/sales/monthly-revenue", {credentials: "include"}),
          fetch("http://localhost:8083/api/v1/today-sale/totalSale", {credentials: "include"}),
        ])

        const todayExpData = await todayExpRes.json()
        const monthlyExpData = await monthlyExpRes.json()
        const salesData = await monthlySales.json()
        const todaySalesValue = await todaySales.json()

          setTodayExpenses(todayExpData)

          setMonthlyExpenses(monthlyExpData)
      

        if (salesData) {


          setTodaySales([])
          setMonthlySales([])
          setTodaySalesRevenue(todaySalesValue)
          setMonthlySalesRevenue(salesData)
        }
      } catch (err) {
        console.error("Failed to fetch data", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (!mounted || loading) return null

  const todayNetRevenue = todaySalesRevenue - todayExpenses
  const monthlyNetRevenue = monthlySalesRevenue - monthlyExpenses

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Welcome Back, {user?.name || "User"}!</h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/sales/new" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              New Sale
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="daily">Daily Overview</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Overview</TabsTrigger>
        </TabsList>

        {/* Daily Overview */}
        <TabsContent value="daily" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>Today's Performance</CardTitle>
              <CardDescription>Summary of today's business activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 p-4 border rounded-lg bg-card">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Sales</h3>
                  </div>
                  <p className="text-2xl font-bold">{todaySales.length}</p>
                </div>

                {isAdmin && (
                  <div className="space-y-2 p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-amber-500" />
                      <h3 className="font-medium">Expenses</h3>
                    </div>
                    <p className="text-2xl font-bold text-red-500">PKR {todayExpenses.toFixed(2)}</p>

                  </div>
                )}

                {isAdmin && (
                  <div className="space-y-2 p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <h3 className="font-medium">Net Revenue</h3>
                    </div>
                    <p className={`text-2xl font-bold ${todayNetRevenue >= 0 ? "text-green-500" : "text-red-500"}`}>
                      PKR {todayNetRevenue.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Overview */}
        <TabsContent value="monthly" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>Monthly Performance</CardTitle>
              <CardDescription>Summary of this month's business activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 p-4 border rounded-lg bg-card">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Sales</h3>
                  </div>
                  <p className="text-2xl font-bold">{monthlySales.length}</p>
                </div>

                {isAdmin && (
                  <div className="space-y-2 p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-amber-500" />
                      <h3 className="font-medium">Expenses</h3>
                    </div>
                    <p className="text-2xl font-bold text-red-500">PKR {monthlyExpenses.toFixed(2)}</p>
                  </div>
                )}

                {isAdmin && (
                  <div className="space-y-2 p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <h3 className="font-medium">Net Revenue</h3>
                    </div>
                    <p className={`text-2xl font-bold ${monthlyNetRevenue >= 0 ? "text-green-500" : "text-red-500"}`}>
                      PKR {monthlyNetRevenue.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Link
              href="/products/add"
              className="flex flex-col items-center justify-center p-4 border rounded-lg bg-card hover:bg-muted transition-colors"
            >
              <Package className="h-8 w-8 text-primary mb-2" />
              <span className="text-sm font-medium">Add Product</span>
            </Link>

            <Link
              href="/sales/new"
              className="flex flex-col items-center justify-center p-4 border rounded-lg bg-card hover:bg-muted transition-colors"
            >
              <ShoppingCart className="h-8 w-8 text-primary mb-2" />
              <span className="text-sm font-medium">New Sale</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
