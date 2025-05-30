"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, ArrowUpDown, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Define the API response interface
interface SaleItem {
  id: string
  productName: string
  quantitySold: number
  totalPrice: number
}

interface SaleSummary {
  id: string
  customerName: string
  totalAmountSummary: number
  quantitySoldSummary: number
  saleItems: SaleItem[]
  createdAt?: string
  paymentStatus?: string
}

interface ApiResponse {
  data: SaleSummary[]
  pagination?: {
    totalItems: number
    totalPages: number
    currentPage: number
    itemsPerPage: number
  }
}

export default function SalesPage() {
  const router = useRouter()
  const [sales, setSales] = useState<SaleSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<string>("createdAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchSales()
  }, [currentPage, itemsPerPage, sortField, sortDirection])

  const fetchSales = async () => {
    setLoading(true)
    setError(null)

    try {
      // Add pagination parameters to the API request
      const response = await fetch(
        `http://localhost:8083/api/v1/sales-summary?page=${currentPage}&limit=${itemsPerPage}&sortBy=${sortField}&sortDirection=${sortDirection}`,
      )

      if (!response.ok) {
        throw new Error(`Error fetching sales: ${response.status}`)
      }

      const data: ApiResponse = await response.json()

        // Add a default createdAt if it doesn't exist in the API response
        const salesWithDefaults = data.data.map((sale) => ({
          ...sale,
          createdAt: sale.createdAt || new Date().toISOString(),
          paymentStatus: sale.paymentStatus || "paid", // Default to paid if not provided
        }))
        setSales(salesWithDefaults)

        // Update pagination information
        if (data.pagination) {
          setTotalItems(data.pagination.totalItems)
          setTotalPages(data.pagination.totalPages)
          setCurrentPage(data.pagination.currentPage)
        } else {
          // If API doesn't provide pagination info, calculate based on data length
          setTotalItems(salesWithDefaults.length)
          setTotalPages(Math.ceil(salesWithDefaults.length / itemsPerPage))
        }
      
    } catch (err) {
      console.error("Error fetching sales:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
    setCurrentPage(1) // Reset to first page when sorting changes
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1) // Reset to first page when items per page changes
  }

  const sortedSales = [...sales].sort((a, b) => {
    if (sortField === "createdAt" && a.createdAt && b.createdAt) {
      return sortDirection === "asc"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    } else if (sortField === "totalAmountSummary") {
      return sortDirection === "asc"
        ? a.totalAmountSummary - b.totalAmountSummary
        : b.totalAmountSummary - a.totalAmountSummary
    } else if (sortField === "customerName") {
      return sortDirection === "asc"
        ? a.customerName.localeCompare(b.customerName)
        : b.customerName.localeCompare(a.customerName)
    }
    return 0
  })

  const getPaymentStatusBadge = (status?: string) => {
    switch (status) {
      case "PAID":
      case "paid":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
            Paid
          </Badge>
        )
      case "UNPAID":
      case "unpaid":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
            Unpaid
          </Badge>
        )
      case "PARTIAL":
      case "partial":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
            Partial
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
            Paid
          </Badge>
        )
    }
  }

  const handleViewSaleDetails = (sale: SaleSummary) => {
    // Store the sale items in sessionStorage before navigating
    if (sale.saleItems && sale.saleItems.length > 0) {
      sessionStorage.setItem(`saleItems-${sale.id}`, JSON.stringify(sale.saleItems))
    }
    router.push(`/dashboard/sales/${sale.id}`)
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages are less than or equal to maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always include first page
      pageNumbers.push(1)

      if (currentPage > 3) {
        pageNumbers.push("ellipsis-start")
      }

      // Pages around current page
      const startPage = Math.max(2, currentPage - 1)
      const endPage = Math.min(totalPages - 1, currentPage + 1)

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }

      if (currentPage < totalPages - 2) {
        pageNumbers.push("ellipsis-end")
      }

      // Always include last page
      if (totalPages > 1) {
        pageNumbers.push(totalPages)
      }
    }

    return pageNumbers
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
        <Button onClick={() => router.push("/dashboard/sales/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Sale
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
          <CardDescription>View and manage all sales transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>Error loading sales: {error}</p>
              <Button variant="outline" onClick={fetchSales} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("createdAt")}
                          className="flex items-center gap-1 p-0 font-medium"
                        >
                          Date
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("customerName")}
                          className="flex items-center gap-1 p-0 font-medium"
                        >
                          Customer
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("totalAmountSummary")}
                          className="flex items-center gap-1 p-0 font-medium"
                        >
                          Total
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          No sales found
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>
                            {sale.createdAt ? format(new Date(sale.createdAt), "MMM d, yyyy HH:mm") : "N/A"}
                          </TableCell>
                          <TableCell>{sale.customerName || "Walk-in Customer"}</TableCell>
                          <TableCell>{sale.quantitySoldSummary} items</TableCell>
                          <TableCell>PKR {sale.totalAmountSummary.toFixed(2)}</TableCell>
                          <TableCell>{getPaymentStatusBadge(sale.paymentStatus)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleViewSaleDetails(sale)}>
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Only show pagination if there are sales */}
              {sortedSales.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{" "}
                      {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
                    </p>
                    
                  </div>

                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(currentPage - 1)}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {getPageNumbers().map((page, index) =>
                        page === "ellipsis-start" || page === "ellipsis-end" ? (
                          <PaginationItem key={`ellipsis-${index}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={index}>
                            <PaginationLink
                              isActive={currentPage === page}
                              onClick={() => handlePageChange(page as number)}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ),
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(currentPage + 1)}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">Show</span>
                      <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue placeholder={itemsPerPage.toString()} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">per page</span>
                    </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
