"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Package,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  RefreshCw,
  WifiOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { API_URL } from "@/lib/api";
import { useAuth } from "@/lib/contexts/auth-context"

interface Product {
  id: string
  name: string
  sku: string
  description: string
  quantityInStock: number
  purchasePrice: number
  sellingPrice: number
  brandName: string
  shelfCodeName: string
  compatibleModels: string[]
  categoryName?: string
  modelName?: string
  supplierName?: string
}

interface Pagination {
  totalItems: number
  totalPages: number
  currentPage: number
  itemsPerPage: number
}

interface ApiResponse {
  data: Product[]
  pagination: Pagination
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)
    const { user } = useAuth()
    const isAdmin = user?.role[0] === "ROLE_ADMIN"

  const router = useRouter()
  const { toast } = useToast()

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Reset to first page when search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      setCurrentPage(1)
    }
  }, [debouncedSearchTerm, searchTerm])

  const fetchProducts = useCallback(
    async (page = 1, searchQuery = "") => {
      try {
        setError(null)
        if (searchQuery) {
          setSearching(true)
        } else {
          setLoading(true)
        }

        const params = new URLSearchParams({
          page: page.toString(),
          limit: itemsPerPage.toString(),
        })

        if (searchQuery.trim()) {
          params.append("name", searchQuery.trim())
        }

        const apiUrl = `${API_URL}/api/v1/products?${params.toString()}`

        const response = await fetch(apiUrl, {credentials: "include"})

        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`)
        }

        const apiResponse = await response.json()

        // Handle API response with pagination object
        if (apiResponse.data && apiResponse.pagination) {
          setProducts(apiResponse.data || [])
          setTotalItems(apiResponse.pagination.totalItems || 0)
          setTotalPages(apiResponse.pagination.totalPages || 1)
          setCurrentPage(apiResponse.pagination.currentPage || page)
          setItemsPerPage(apiResponse.pagination.itemsPerPage || 10)

          // Calculate hasNext and hasPrevious
          setHasNext(apiResponse.pagination.currentPage < apiResponse.pagination.totalPages)
          setHasPrevious(apiResponse.pagination.currentPage > 1)
        } else if (Array.isArray(apiResponse)) {
          // Direct array response
          setProducts(apiResponse)
          setTotalItems(apiResponse.length)
          setTotalPages(1)
          setCurrentPage(1)
          setHasNext(false)
          setHasPrevious(false)
        } else if (apiResponse.data) {
          // Response with data but no pagination
          setProducts(apiResponse.data || [])
          setTotalItems(apiResponse.data.length)
          setTotalPages(1)
          setCurrentPage(1)
          setHasNext(false)
          setHasPrevious(false)
        } else {
          // Unknown structure
          console.error("Unknown API response structure:", apiResponse)
          setProducts([])
          setTotalItems(0)
          setTotalPages(1)
        }
      } catch (err) {
        console.error("Error fetching products:", err)
        setError(err instanceof Error ? err.message : "Failed to load products")
        setProducts([])
        setTotalItems(0)
        setTotalPages(1)
      } finally {
        setLoading(false)
        setSearching(false)
        setRetrying(false)
      }
    },
    [itemsPerPage],
  )

  // Initial load
  useEffect(() => {
    fetchProducts(1, "")
  }, [fetchProducts])

  // Search when debounced term changes
  useEffect(() => {
    if (debouncedSearchTerm !== undefined) {
      fetchProducts(1, debouncedSearchTerm)
    }
  }, [debouncedSearchTerm, fetchProducts])


  const handleRetry = async () => {
    setRetrying(true)
    await fetchProducts(currentPage, debouncedSearchTerm)
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      fetchProducts(page, debouncedSearchTerm)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/products/${id}`, {
        method: "DELETE",
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error(`Failed to delete product: ${response.status}`)
      }

      // Refresh current page after deletion
      await fetchProducts(currentPage, debouncedSearchTerm)

      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>
    } else if (quantity <= 5) {
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">Low Stock</Badge>
    }
  }

  // Loading state
  if (loading && !searching) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4">
              <Skeleton className="h-10 w-64" />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <TableHead key={i}>
                        <Skeleton className="h-4 w-20" />
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your inventory and product catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/low-stock")}>
            <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
            Low Stock
          </Button>
          <Button onClick={() => router.push("/products/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div> */}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={handleRetry} disabled={retrying} className="ml-4">
              {retrying ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        {/* <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            Product Inventory
            {!error && (
              <Badge variant="secondary" className="ml-2">
                {totalItems} total products
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {error
              ? "Unable to load products. Please check your connection and try again."
              : ``}
          </CardDescription>
        </CardHeader> */}
        <CardContent>
          {!error && (
            <div className="flex items-center mb-4 gap-2 mt-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
                {searching && (
                  <RefreshCw className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {searchTerm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("")
                    setDebouncedSearchTerm("")
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          )}

          <div className="rounded-sm border overflow-x-auto p-2">
            <Table>
              <TableHeader  className="border-b-2 border-gray-400">
                <TableRow className="">
                  <TableHead  className="text-black font-semibold">Product Name</TableHead>
                  
                  <TableHead className="text-black font-semibold">Compatible Models</TableHead>
                  <TableHead className="text-black font-semibold">Brand</TableHead>
                  <TableHead className="text-black font-semibold">Shelf Code</TableHead>
                  
                  <TableHead className="text-center text-black font-semibold w-12">Stock</TableHead>
                  {/* <TableHead className="text-right">Purchase Price</TableHead> */}
                  <TableHead className="text-right text-black font-semibold">Selling Price</TableHead>
                  {
                    isAdmin ?? <TableHead className="text-right text-black font-semibold">Actions</TableHead>
                  }
                  
                </TableRow>
              </TableHeader>
              <TableBody>
                {error ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-4 text-muted-foreground">
                        <WifiOff className="h-12 w-12 opacity-50" />
                        <div className="text-center">
                          <p className="text-lg font-medium">Unable to load products</p>
                          <p className="text-sm">Please check your internet connection and try again</p>
                        </div>
                        <Button onClick={handleRetry} disabled={retrying}>
                          {retrying ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Retrying...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Try Again
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-4 text-muted-foreground">
                        <Package className="h-12 w-12 opacity-50" />
                        <div className="text-center">
                          <p className="text-lg font-medium">{searchTerm ? "No products found" : "No products yet"}</p>
                          <p className="text-sm">
                            {searchTerm
                              ? `No products match "${searchTerm}". Try a different search term.`
                              : "Get started by adding your first product"}
                          </p>
                        </div>
                        {!searchTerm && (
                          <Button onClick={() => router.push("/products/add")}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Your First Product
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="text-blue-700 font-bold">{product.name}</div>
                        </div>
                      </TableCell>
                     
                     
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {product.compatibleModels && product.compatibleModels.length > 0 ? (
                            product.compatibleModels.map((model, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {model}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">No models</span>
                          )}
                        </div>
                      </TableCell>
                       <TableCell>
                        <span className="font-medium">
                          {product.brandName || "No Brand"}
                        </span>
                      </TableCell>
                       <TableCell width={2}>
                        <Badge variant="destructive" className="font-mono">
                          {product.shelfCodeName || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-2">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-medium text-lg">{product.quantityInStock}</span>
                          {/* {getStockStatus(product.quantityInStock)} */}
                        </div>
                      </TableCell>
                      {/* <TableCell className="text-right">
                        <div className="font-medium">Rs. {product.purchasePrice.toLocaleString()}</div>
                      </TableCell> */}
                      <TableCell className="text-center w-24">
                        <div className="font-medium text-green-600">Rs. {product.sellingPrice.toLocaleString()}</div>
                      </TableCell>
                      {
                        isAdmin ?? <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(`/products/edit/${product.id}`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the product "{product.name}". This action cannot be
                                    undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(product.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      }
                      
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Simple Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!hasPrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center">
                {/* Always show first page */}
                <Button
                  variant={currentPage === 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  className="w-9 h-9 p-0"
                >
                  1
                </Button>

                {/* Ellipsis after first page if needed */}
                {currentPage > 3 && totalPages > 5 && <span className="mx-1 text-muted-foreground">...</span>}

                {/* Pages around current page */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Skip first and last page as they're always shown
                    if (page === 1 || page === totalPages) return false

                    // For small page counts, show all pages
                    if (totalPages <= 5) return true

                    // For large page counts, show pages around current
                    return Math.abs(page - currentPage) <= 1
                  })
                  .map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="w-9 h-9 p-0 mx-1"
                    >
                      {page}
                    </Button>
                  ))}

                {/* Ellipsis before last page if needed */}
                {currentPage < totalPages - 2 && totalPages > 5 && (
                  <span className="mx-1 text-muted-foreground">...</span>
                )}

                {/* Always show last page if more than 1 page */}
                {totalPages > 1 && totalPages !== 1 && (
                  <Button
                    variant={currentPage === totalPages ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    className="w-9 h-9 p-0"
                  >
                    {totalPages}
                  </Button>
                )}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Pagination Info */}
          {!error && totalItems > 0 && (
            <div className="text-sm text-muted-foreground text-center mt-4">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
              {totalItems} products
              {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
