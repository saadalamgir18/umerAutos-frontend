"use client"

import { useState, useEffect } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Calendar, DollarSign, Package, ShoppingCart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
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

interface DailySaleItem {
  id: string
  productId: string
  productName: string
  sku: string
  quantitySold: number
  unitPrice: number
  totalPrice: number
  profit: number
}

interface ApiResponse {
  data: DailySaleItem[]
  pagination?: {
    totalItems: number
    totalPages: number
    currentPage: number
    itemsPerPage: number
  }
}

export default function DailySalesPage() {
  const [dailySales, setDailySales] = useState<DailySaleItem[]>([])
  const [totalSales, setTotalSales] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [totalProfit, setTotalProfit] = useState(0)
  const [totalTransactions, setTotalTransactions] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDailySales, setTotalDailySales] = useState(0)

  const router = useRouter()

  useEffect(() => {
    fetchTodaySales()
  }, [currentPage, itemsPerPage])

  const fetchTodaySales = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`http://localhost:8083/api/v1/today-sales?page=${currentPage}&limit=${itemsPerPage}`, { credentials: "include"})

      if (!res.ok) {
        throw new Error(`Error fetching daily sales: ${res.status}`)
      }

      const json = await res.json()

        const itemsArray = json

        

        if(itemsArray.length > 0){

       

        // Calculate totals
        const totalItemsSold = itemsArray.reduce((sum: number, item: DailySaleItem) => sum + item.quantitySold, 0)
        const totalSalesAmount = itemsArray.reduce((sum: number, item: DailySaleItem) => sum + item.totalPrice, 0)
        const totalProfit = itemsArray.reduce((sum: number, item: DailySaleItem) => sum + item.profit, 0)

        setTotalProfit(totalProfit)

        setDailySales(itemsArray)
        setTotalItems(totalItemsSold)
        setTotalSales(totalSalesAmount)
        setTotalTransactions(itemsArray.length)

        // Update pagination information
        if (json?.pagination) {
          setTotalDailySales(json.pagination.totalItems)
          setTotalPages(json.pagination.totalPages)
          setCurrentPage(json.pagination.currentPage)
        } else {
          // If API doesn't provide pagination info, calculate based on data length
          setTotalDailySales(itemsArray.length)
          setTotalPages(Math.ceil(itemsArray.length / itemsPerPage))
        }
      }
       
    } catch (err) {
      console.error("Failed to fetch today's sales:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1) // Reset to first page when items per page changes
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Daily Sales Report</h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-5 w-5" />
          <span>{format(new Date(), "MMMM d, yyyy")}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {totalSales.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground mt-1">{totalTransactions} transactions today</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
        
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <div className="text-sm text-muted-foreground mt-1">{dailySales.length} different products</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today Profit</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {totalProfit > 0 ? totalProfit?.toFixed(2) : "0.00"}</div>
            {/* <div className="text-sm text-muted-foreground mt-1">Per transaction</div> */}
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card className="shadow-sm">
       
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>Error loading daily sales: {error}</p>
              <Button variant="outline" onClick={fetchTodaySales} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead className="text-center">Quantity Sold</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Total Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailySales.length === 0 ? (
                      <TableRow>

                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <ShoppingCart className="h-12 w-12 mb-2 opacity-20" />
                            <p>No sales recorded today</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      dailySales.map((item, index) => (
                        <TableRow key={index} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                            >
                              {item.quantitySold}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">PKR {item?.profit?.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">PKR {item?.totalPrice?.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Only show pagination if there are daily sales */}
              {dailySales.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalDailySales)} to{" "}
                      {Math.min(currentPage * itemsPerPage, totalDailySales)} of {totalDailySales} entries
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
