"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileDown, BarChart3, PieChart, TrendingUp } from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { useAuth } from "@/lib/hooks/use-auth"
import { useRouter } from "next/navigation"

// Colors for charts
const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#84cc16", "#10b981"]

export default function ReportsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { products } = useSelector((state: RootState) => state.products)
  const { sales } = useSelector((state: RootState) => state.sales)
  const { purchases } = useSelector((state: RootState) => state.purchases)
  const [mounted, setMounted] = useState(false)
  const [timeRange, setTimeRange] = useState("month")

  useEffect(() => {
    setMounted(true)

    // Redirect if not admin
    if (mounted && user?.role !== "admin") {
      router.push("/")
    }
  }, [mounted, router, user])

  if (!mounted || user?.role !== "admin") return null

  // Generate mock data for sales by category
  const salesByCategory = [
    { name: "Engine", value: 4200 },
    { name: "Brakes", value: 3800 },
    { name: "Electrical", value: 2900 },
    { name: "Body", value: 2400 },
    { name: "Tires", value: 1900 },
    { name: "Maintenance", value: 3200 },
  ]

  // Generate mock data for monthly sales and purchases
  const monthlyData = [
    { name: "Jan", sales: 4000, purchases: 2400 },
    { name: "Feb", sales: 3000, purchases: 1398 },
    { name: "Mar", sales: 5000, purchases: 3800 },
    { name: "Apr", sales: 2780, purchases: 3908 },
    { name: "May", sales: 1890, purchases: 4800 },
    { name: "Jun", sales: 2390, purchases: 3800 },
    { name: "Jul", sales: 3490, purchases: 4300 },
    { name: "Aug", sales: 4000, purchases: 2400 },
    { name: "Sep", sales: 3000, purchases: 1398 },
    { name: "Oct", sales: 2000, purchases: 9800 },
    { name: "Nov", sales: 2780, purchases: 3908 },
    { name: "Dec", sales: 1890, purchases: 4800 },
  ]

  // Generate mock data for profit trend
  const profitTrend = [
    { name: "Jan", profit: 1600 },
    { name: "Feb", profit: 1602 },
    { name: "Mar", profit: 1200 },
    { name: "Apr", profit: -1128 },
    { name: "May", profit: -2910 },
    { name: "Jun", profit: -1410 },
    { name: "Jul", profit: -810 },
    { name: "Aug", profit: 1600 },
    { name: "Sep", profit: 1602 },
    { name: "Oct", profit: -7800 },
    { name: "Nov", profit: -1128 },
    { name: "Dec", profit: -2910 },
  ]

  // Generate mock data for best-selling products
  const bestSellingProducts = [
    { name: "Brake Pad Set", sales: 120 },
    { name: "Oil Filter", sales: 98 },
    { name: "Chain Lubricant", sales: 86 },
    { name: "Front Tire", sales: 72 },
    { name: "Spark Plug Set", sales: 65 },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sales">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">
            <BarChart3 className="mr-2 h-4 w-4" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <PieChart className="mr-2 h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="profit">
            <TrendingUp className="mr-2 h-4 w-4" />
            Profit
          </TabsTrigger>
          <TabsTrigger value="products">
            <BarChart3 className="mr-2 h-4 w-4" />
            Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sales by Month</CardTitle>
                <CardDescription>Monthly sales and purchases comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="sales" fill="#6366f1" name="Sales" />
                      <Bar dataKey="purchases" fill="#f43f5e" name="Purchases" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Sales and Profit</CardTitle>
                <CardDescription>Daily comparison of sales revenue and profit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { day: "Mon", sales: 2400, profit: 800 },
                        { day: "Tue", sales: 1800, profit: 620 },
                        { day: "Wed", sales: 3200, profit: 1100 },
                        { day: "Thu", sales: 2800, profit: 950 },
                        { day: "Fri", sales: 4200, profit: 1500 },
                        { day: "Sat", sales: 3800, profit: 1300 },
                        { day: "Sun", sales: 1500, profit: 500 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="sales" stroke="#6366f1" name="Sales" strokeWidth={2} />
                      <Line type="monotone" dataKey="profit" stroke="#10b981" name="Profit" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sales Summary</CardTitle>
              <CardDescription>Key sales metrics for the selected time period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold">
                    PKR {sales.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Average Sale</p>
                  <p className="text-2xl font-bold">
                    PKR
                    {sales.length
                      ? (sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{sales.length}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Unpaid Invoices</p>
                  <p className="text-2xl font-bold">
                    {sales.filter((sale) => sale.paymentStatus === "unpaid" || sale.paymentStatus === "partial").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Daily Inventory Movement</CardTitle>
                <CardDescription>Daily product inflow and outflow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { day: "Mon", inflow: 24, outflow: 18 },
                        { day: "Tue", inflow: 18, outflow: 12 },
                        { day: "Wed", inflow: 32, outflow: 28 },
                        { day: "Thu", inflow: 28, outflow: 22 },
                        { day: "Fri", inflow: 42, outflow: 35 },
                        { day: "Sat", inflow: 38, outflow: 30 },
                        { day: "Sun", inflow: 15, outflow: 10 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="inflow" fill="#6366f1" name="Items In" />
                      <Bar dataKey="outflow" fill="#f43f5e" name="Items Out" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory Status</CardTitle>
                <CardDescription>Overview of current inventory levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: "In Stock",
                          value: products.filter((p) => p.quantityInStock > 5).length,
                        },
                        {
                          name: "Low Stock",
                          value: products.filter((p) => p.quantityInStock > 0 && p.quantityInStock <= 5).length,
                        },
                        {
                          name: "Out of Stock",
                          value: products.filter((p) => p.quantityInStock === 0).length,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Summary</CardTitle>
              <CardDescription>Key inventory metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{products.length}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Stock Value</p>
                  <p className="text-2xl font-bold">
                    PKR
                    {products
                      .reduce((sum, product) => sum + product.purchasePrice * product.quantityInStock, 0)
                      .toFixed(2)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Low Stock Items</p>
                  <p className="text-2xl font-bold">
                    {products.filter((p) => p.quantityInStock > 0 && p.quantityInStock <= 5).length}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Out of Stock Items</p>
                  <p className="text-2xl font-bold">{products.filter((p) => p.quantityInStock === 0).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profit Trend</CardTitle>
              <CardDescription>Monthly profit trend over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={profitTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="profit" stroke="#6366f1" activeDot={{ r: 8 }} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Profit Margin by Category</CardTitle>
                <CardDescription>Average profit margin across product categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Engine", margin: 32 },
                        { name: "Brakes", margin: 45 },
                        { name: "Electrical", margin: 38 },
                        { name: "Body", margin: 28 },
                        { name: "Tires", margin: 42 },
                        { name: "Maintenance", margin: 55 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="margin" fill="#6366f1" name="Profit Margin (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profit Summary</CardTitle>
                <CardDescription>Key profit metrics for the selected time period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">
                      PKR {sales.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="text-2xl font-bold">
                      PKR {purchases.reduce((sum, purchase) => sum + purchase.total, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Gross Profit</p>
                    <p className="text-2xl font-bold">
                      PKR
                      {(
                        sales.reduce((sum, sale) => sum + sale.total, 0) -
                        purchases.reduce((sum, purchase) => sum + purchase.total, 0)
                      ).toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Average Profit Margin</p>
                    <p className="text-2xl font-bold">38%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Best-Selling Products</CardTitle>
                <CardDescription>Top products by sales volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={bestSellingProducts}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="sales" fill="#6366f1" name="Units Sold" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Most Profitable Products</CardTitle>
                <CardDescription>Top products by profit margin</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Chain Lubricant", margin: 92 },
                        { name: "Brake Pad Set", margin: 85 },
                        { name: "Spark Plug Set", margin: 78 },
                        { name: "Oil Filter", margin: 72 },
                        { name: "Front Tire", margin: 65 },
                      ]}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="margin" fill="#6366f1" name="Profit Margin (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Product Performance Summary</CardTitle>
              <CardDescription>Overview of product performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{products.length}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Average Selling Price</p>
                  <p className="text-2xl font-bold">
                    PKR
                    {products.length
                      ? (products.reduce((sum, product) => sum + product.sellingPrice, 0) / products.length).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Average Purchase Price</p>
                  <p className="text-2xl font-bold">
                    PKR
                    {products.length
                      ? (products.reduce((sum, product) => sum + product.purchasePrice, 0) / products.length).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Average Markup</p>
                  <p className="text-2xl font-bold">
                    {products.length
                      ? (
                          (products.reduce((sum, product) => sum + (product.sellingPrice - product.purchasePrice), 0) /
                            products.reduce((sum, product) => sum + product.purchasePrice, 0)) *
                          100
                        ).toFixed(2)
                      : "0.00"}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
