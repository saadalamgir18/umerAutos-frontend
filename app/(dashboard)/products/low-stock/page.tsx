"use client"

import { useState, useEffect, useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/redux/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, AlertTriangle, ShoppingCart, Truck, ArrowUpDown, Eye, Edit } from "lucide-react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"

export default function LowStockPage() {
  const router = useRouter()
  const { products } = useSelector((state: RootState) => state.products)
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [sortField, setSortField] = useState<string>("quantityInStock")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
    const [isLoading, setIsLoading] = useState(false)
    const dispatch = useDispatch<AppDispatch>()
    const { toast } = useToast()


  // Define low stock threshold
  const LOW_STOCK_THRESHOLD = 5
     const fetchProducts = useCallback(async () => {
        setIsLoading(true)
        try {
          // Build the URL with query parameters
          let url = "http://localhost:8083/api/v1/products"
    
          // Add search parameter if exists
          if (searchTerm) {
            url += `?name=${encodeURIComponent(searchTerm)}`
          }
    
          const response = await fetch(url, { credentials: "include"})
    
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`)
          }
    
          const data = await response.json()
          
          dispatch({ type: "products/fetchProductsSuccess", payload: data.data })
        } catch (error) {
          console.error("Failed to fetch products:", error)
          // If API fails, use mock data as fallback
          toast({
            title: "Connection Error",
            description: "Could not connect to the server. Showing cached data instead.",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }, [dispatch, searchTerm, toast])

  useEffect(() => {
    setMounted(true)

    // Get all low stock and out of stock products

    const lowStockItems = products.filter((p) => p.quantityInStock <= LOW_STOCK_THRESHOLD)
    setFilteredProducts(lowStockItems)
  }, [products])

  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const lowStockItems = products.filter((p) => p.quantityInStock <= LOW_STOCK_THRESHOLD)
      setFilteredProducts(
        lowStockItems.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.brandName.toLowerCase().includes(term)
        )
      )
    } else {
      const lowStockItems = products.filter((p) => p.quantityInStock <= LOW_STOCK_THRESHOLD)
      setFilteredProducts(lowStockItems)
    }
  }, [searchTerm, products])

  if (!mounted) return null

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortField === "name") {
      return sortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    } else if (sortField === "quantityInStock") {
      return sortDirection === "asc" ? a.quantityInStock - b.quantityInStock : b.quantityInStock - a.quantityInStock
    } else if (sortField === "category") {
      return sortDirection === "asc" ? a.category.localeCompare(b.category) : b.category.localeCompare(a.category)
    }
    return 0
  })

  const outOfStockProducts = sortedProducts.filter((p) => p.quantityInStock === 0)
  const lowStockProducts = sortedProducts.filter(
    (p) => p.quantityInStock > 0 && p.quantityInStock <= LOW_STOCK_THRESHOLD,
  )

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Inventory Alerts</h1>
        </div>
       
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1 card-hover">
          <CardHeader className="pb-2">
            <CardTitle>Inventory Status</CardTitle>
            <CardDescription>Overview of stock levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm hover:border-destructive/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="h-8 w-8 rounded-full p-2">
                      <AlertTriangle className="h-4 w-4" />
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">Out of Stock</p>
                      <p className="text-xs text-muted-foreground">Needs immediate attention</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{outOfStockProducts.length}</p>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm hover:border-amber-300/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="h-8 w-8 rounded-full p-2 bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">Low Stock</p>
                      <p className="text-xs text-muted-foreground">Running low on inventory</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{lowStockProducts.length}</p>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="h-8 w-8 rounded-full p-2 bg-primary/10 text-primary dark:bg-primary/20"
                    >
                      <Truck className="h-4 w-4" />
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">Total Items</p>
                      <p className="text-xs text-muted-foreground">Needing attention</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{filteredProducts.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 card-hover">
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
            <CardDescription>Products that need to be restocked soon</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="mb-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Items</TabsTrigger>
                <TabsTrigger value="out">Out of Stock</TabsTrigger>
                <TabsTrigger value="low">Low Stock</TabsTrigger>
              </TabsList>

              <div className="my-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search low stock products..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <TabsContent value="all">
                <div className="table-container">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("name")}
                            className="flex items-center gap-1 p-0 font-medium"
                          >
                            Name
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("category")}
                            className="flex items-center gap-1 p-0 font-medium"
                          >
                            Category
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("quantityInStock")}
                            className="flex items-center gap-1 p-0 font-medium ml-auto"
                          >
                            Stock
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">
                            No low stock items found
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedProducts.map((product) => (
                          <TableRow key={product.id} className="table-row-hover">
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.sku}</TableCell>
                            <TableCell className="capitalize">{product.category}</TableCell>
                            <TableCell>{product.brand}</TableCell>
                            <TableCell className="text-right">
                              {product.quantityInStock === 0 ? (
                                <Badge variant="destructive" className="flex items-center justify-center gap-1 ml-auto">
                                  <AlertTriangle className="h-3 w-3" />
                                  Out of Stock
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 ml-auto"
                                >
                                  {product.quantityInStock} left
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <TooltipProvider>
                                <div className="flex justify-end gap-2">
                                
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.push(`/products/edit/${product.id}`)}
                                      >
                                        <Edit className="h-4 w-4 mr-1" />
                                        Edit
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit Product</TooltipContent>
                                  </Tooltip>
                              
                                </div>
                              </TooltipProvider>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="out">
                <div className="table-container">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outOfStockProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">
                            No out of stock items found
                          </TableCell>
                        </TableRow>
                      ) : (
                        outOfStockProducts.map((product) => (
                          <TableRow key={product.id} className="table-row-hover">
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.sku}</TableCell>
                            <TableCell className="capitalize">{product.category}</TableCell>
                            <TableCell>{product.brand}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="destructive" className="flex items-center justify-center gap-1 ml-auto">
                                <AlertTriangle className="h-3 w-3" />
                                Out of Stock
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/products/edit/${product.id}`)}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/purchases/new`)}
                                  className="bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary"
                                >
                                  <Truck className="h-4 w-4 mr-1" />
                                  Order
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="low">
                <div className="table-container">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">
                            No low stock items found
                          </TableCell>
                        </TableRow>
                      ) : (
                        lowStockProducts.map((product) => (
                          <TableRow key={product.id} className="table-row-hover">
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.sku}</TableCell>
                            <TableCell className="capitalize">{product.category}</TableCell>
                            <TableCell>{product.brand}</TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant="outline"
                                className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 ml-auto"
                              >
                                {product.quantityInStock} left
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/products/edit/${product.id}`)}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/purchases/new`)}
                                  className="bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary"
                                >
                                  <Truck className="h-4 w-4 mr-1" />
                                  Order
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
