"use client"

import React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Edit, Trash2, AlertTriangle, ArrowUpDown, Package, Loader2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toastUtils } from "@/lib/utils/toast-utils"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock data for demonstration
const mockProducts = [
  {
    id: "1",
    name: "Brake Pad Set",
    brand: "BrakeTech",
    compatibleModels: ["Honda CD 70"],
    category: "brakes",
    sku: "BP-1001",
    description: "High-performance brake pads for sport bikes",
    quantityInStock: 25,
    purchasePrice: 45.99,
    sellingPrice: 89.99,
    supplierId: "1",
    shelfCode: { id: "1", name: "B12" },
    createdAt: "2023-01-15T00:00:00Z",
    updatedAt: "2023-01-15T00:00:00Z",
  },
  // Other mock products...
]

// Update the ProductActions component to use the API delete function
const ProductActions = React.memo(
  ({
    product,
    user,
    router,
    onDelete,
  }: { product: any; user: any; router: any; onDelete: (id: string) => Promise<void> }) => {
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
      setIsDeleting(true)
      await onDelete(product.id)
      setIsDeleting(false)
    }

    return (
      <TooltipProvider>
        <div className="flex justify-end space-x-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/products/edit/${product.id}`)}>
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View & Edit</TooltipContent>
          </Tooltip>
          {user?.role === "admin" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the product from your inventory.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </TooltipProvider>
    )
  },
)
ProductActions.displayName = "ProductActions"

// Separate component for stock badge to reduce re-renders
const StockBadge = React.memo(({ quantity }: { quantity: number }) => {
  if (quantity === 0) {
    return (
      <Badge variant="destructive" className="flex items-center justify-center gap-1 ml-auto">
        <AlertTriangle className="h-3 w-3" />
        Out
      </Badge>
    )
  } else if (quantity <= 5) {
    return (
      <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 ml-auto">
        {quantity}
      </Badge>
    )
  } else {
    return <span className="status-badge status-badge-success ml-auto">{quantity}</span>
  }
})
StockBadge.displayName = "StockBadge"

export default function ProductsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [sortField, setSortField] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Add this function to handle product deletion
  const handleDeleteProduct = async (productId: string) => {
    try {
      const response = await fetch(`http://localhost:8083/api/v1/products/${productId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Failed to delete product: ${response.status}`)
      }

      // If successful, update the local state
      setProducts(products.filter((product) => product.id !== productId))
      setFilteredProducts(filteredProducts.filter((product) => product.id !== productId))

      // Recalculate pagination if needed
      if (filteredProducts.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      }

      // Use our toast utility for consistent messaging
      toastUtils.successDelete("Product")

      // Refresh products to update pagination
      fetchProducts()
    } catch (error) {
      console.error("Error deleting product:", error)

      // Use our toast utility for error messaging
      toastUtils.error("delete", "product", "There was a problem deleting the product. Please try again.")
    }
  }

  // Create a function to fetch products with search, sort, and pagination parameters
  const fetchProducts = useCallback(async () => {
    setIsLoading(true)

    try {
      // Build the URL with query parameters
      let url = "http://localhost:8083/api/v1/products"

      // Add query parameters
      const params = new URLSearchParams()

      // Add pagination parameters
      params.append("page", currentPage.toString())
      params.append("limit", itemsPerPage.toString())

      // Add search parameter if exists
      if (searchTerm && searchTerm.trim() !== "") {
        params.append("name", searchTerm.trim())
      }

      // Add sort parameters

      // Append parameters to URL
      url += `?${params.toString()}`

      console.log(url)

      console.log("Fetching products from:", url)

      const response = await fetch(url)
      

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      console.log(data);


        setProducts(data.data)
        setFilteredProducts(data.data)

        // Update pagination information if available in the response
        if (data.pagination) {
          setTotalItems(data.pagination.totalItems || 0)
          setTotalPages(data.pagination.totalPages || 1)
          setCurrentPage(data.pagination.currentPage || 1)
        } else {
          // If no pagination info, calculate based on array length
          setTotalItems(data.data.length)
          setTotalPages(Math.ceil(data.data.length / itemsPerPage))
        }
      
    } catch (error) {
      console.error("Failed to fetch products:", error)
      // If API fails, use mock data as fallback
      setProducts(mockProducts)
      setFilteredProducts(mockProducts)
      setTotalItems(mockProducts.length)
      setTotalPages(Math.ceil(mockProducts.length / itemsPerPage))
      toastUtils.update("error", "warning", "Could not connect to the server. Showing cached data instead.")
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, itemsPerPage, searchTerm, sortField, sortDirection])

  useEffect(() => {
    setMounted(true)
    fetchProducts()
  }, [fetchProducts])

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1) // Reset to first page on new search
  }

  // Handle sorting
  const handleSort = useMemo(
    () => (field: string) => {
      if (sortField === field) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc")
      } else {
        setSortField(field)
        setSortDirection("asc")
      }
      setCurrentPage(1) // Reset to first page on sort change
    },
    [sortField, sortDirection],
  )

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    setCurrentPage(page)
  }

  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  // Memoize low stock counts to prevent unnecessary re-renders
  const { lowStockProducts, outOfStockProducts } = useMemo(() => {
    return {
      lowStockProducts: products.filter((product) => product.quantityInStock > 0 && product.quantityInStock <= 5),
      outOfStockProducts: products.filter((product) => product.quantityInStock === 0),
    }
  }, [products])

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages is less than max pages to show
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always show first page
      pageNumbers.push(1)

      if (currentPage > 3) {
        pageNumbers.push(null) // Add ellipsis
      }

      // Show current page and surrounding pages
      const startPage = Math.max(2, currentPage - 1)
      const endPage = Math.min(totalPages - 1, currentPage + 1)

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }

      if (currentPage < totalPages - 2) {
        pageNumbers.push(null) // Add ellipsis
      }

      // Always show last page
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }

  if (!mounted) return null

  // Function to generate empty rows to fill the table when there are fewer items
  const getEmptyRows = () => {
    if (isLoading || filteredProducts.length === 0) return null

    // Calculate how many empty rows we need to add
    const rowsToAdd = Math.max(0, itemsPerPage - filteredProducts.length)

    if (rowsToAdd === 0) return null

    return Array(rowsToAdd)
      .fill(0)
      .map((_, index) => (
        <TableRow key={`empty-${index}`}>
          <TableCell colSpan={6} className="h-[52px]"></TableCell>
        </TableRow>
      ))
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight"></h1>
        <div className="flex flex-wrap gap-2 justify-end px-2">
          <Button onClick={() => router.push("/dashboard/products/add")} className="bg-primary text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      <Card className="card-hover">
        <CardHeader className="pb-3">
          <CardTitle>Product Inventory</CardTitle>
          <CardDescription>Manage your motorcycle spare parts inventory</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col h-[600px]">
          <div className="flex flex-col space-y-4 flex-grow overflow-hidden">
            <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0 overflow-auto flex-grow">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground " />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-8 pr-10 focus:outline-dashed"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-9 w-9"
                    onClick={() => {
                      setSearchTerm("")
                      setCurrentPage(1)
                    }}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Clear search</span>
                  </Button>
                )}
              </div>
          
            </div>

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
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("shelfCode")}
                        className="flex items-center gap-1 p-0 font-medium"
                      >
                        Shelf
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Brand</TableHead>

                    <TableHead className="hidden lg:table-cell">Compatible Models</TableHead>

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
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("purchasePrice")}
                        className="flex items-center gap-1 p-0 font-medium ml-auto"
                      >
                        Purchase Price
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("sellingPrice")}
                        className="flex items-center gap-1 p-0 font-medium ml-auto"
                      >
                        Selling Price
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p>Loading products...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-[400px] text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Package className="h-12 w-12 text-muted-foreground mb-2" />
                          <p className="text-lg font-medium">No products found</p>
                          <p className="text-sm text-muted-foreground max-w-md">
                            {searchTerm ? (
                              <>
                                No products matching "<span className="font-medium">{searchTerm}</span>"
                                <Button
                                  variant="link"
                                  onClick={() => setSearchTerm("")}
                                  className="px-1 h-auto text-primary"
                                >
                                  Clear search
                                </Button>
                              </>
                            ) : (
                              "Add some products to get started"
                            )}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id} className="table-row-hover">
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                            >
                              {product.shelfCodeName || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{product.brandName} </TableCell>

                          <TableCell className="hidden lg:table-cell">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {product?.compatibleModels?.length > 3 ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center">
                                        <Badge
                                          variant="outline"
                                          className="bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300"
                                        >
                                          {product?.compatibleModels[0]}
                                        </Badge>
                                        <Badge
                                          variant="outline"
                                          className="bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300"
                                        >
                                          {product?.compatibleModels[1]}
                                        </Badge>
                                        <Badge
                                          variant="outline"
                                          className="bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300"
                                        >
                                          +{product?.compatibleModels?.length - 2}
                                        </Badge>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="max-w-[250px]">
                                        {product.compatibleModels.map((model: string, index: number) => (
                                          <span key={index} className="block text-xs">
                                            {model}
                                          </span>
                                        ))}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                product?.compatibleModels?.map((model: string, index: number) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300"
                                  >
                                    {model}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="text-right">
                            <StockBadge quantity={product.quantityInStock} />
                          </TableCell>
                          <TableCell className="text-right">PKR {product.purchasePrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right">PKR {product.sellingPrice.toFixed(2)}</TableCell>

                          <TableCell className="text-right">
                            <ProductActions
                              product={product}
                              user={user}
                              router={router}
                              onDelete={handleDeleteProduct}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      {getEmptyRows()}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {!isLoading && filteredProducts.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
                  {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} products
                </div>

                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(currentPage - 1)}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>

                    {getPageNumbers().map((page, index) => (
                      <PaginationItem key={index}>
                        {page === null ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            isActive={page === currentPage}
                            onClick={() => handlePageChange(page as number)}
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(currentPage + 1)}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                 <div className="flex gap-2">
                <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Items per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 per page</SelectItem>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="20">20 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
