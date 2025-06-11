"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart } from "lucide-react"
import { Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
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
import { RefreshCcw } from "lucide-react"


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
  createdAt: Date
}

export default function DailySalesPage() {
  const { sales } = useSelector((state: RootState) => state.sales)
  const [dailySales, setDailySales] = useState<DailySaleItem[]>([])


  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)


  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(7)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const fetchSales = async (page = currentPage, limit = itemsPerPage) => {
    setIsLoading(true)
    try {
      // Build the URL with query parameters
      let url = "http://localhost:8083/api/v1/sales"

      // Add query parameters
      const params = new URLSearchParams()

      // Add pagination parameters
      params.append("page", page.toString())
      params.append("limit", limit.toString())

      // Append params to URL if there are any
      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const res = await fetch(url, { credentials: "include"})
      const json = await res.json()

        // Assuming the API returns data in this format
        const itemsArray = json.data || []
        const meta = json.pagination || { total: itemsArray.length, page: 1, limit, totalPages: 1 }
        // const sorted = [...itemsArray].sort((a, b) =>
        //   new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        // );


        setDailySales(itemsArray)
        setTotalItems(meta.totalItems || itemsArray.length)
        setTotalPages(meta.totalPages || Math.ceil(itemsArray.length / limit))

    
    } catch (err) {
      console.error("Failed to fetch sales:", err)
      toast({
        title: "Error",
        description: "Failed to fetch sales data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSales(currentPage, itemsPerPage)
  }, [currentPage, itemsPerPage])

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (value: string) => {
    const newLimit = Number.parseInt(value)
    setItemsPerPage(newLimit)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5 // Maximum number of page links to show

    if (totalPages <= maxPagesToShow) {
      // If we have fewer pages than the max, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always show first page
      pageNumbers.push(1)

      // Calculate start and end of page range around current page
      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if we're near the start
      if (currentPage <= 3) {
        endPage = 4
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3
      }

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pageNumbers.push(null) // null represents ellipsis
      }

      // Add page numbers in the middle
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push(null) // null represents ellipsis
      }

      // Always show last page
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }



  const handleEditSale = (id: string) => {
    router.push(`/all-sales/edit/${id}`)
  }

  const handleDeleteSale = (id: string) => {
    setSaleToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!saleToDelete) return

    try {
      const response = await fetch(`http://localhost:8083/api/v1/sales/${saleToDelete}`, {
        method: "DELETE",
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error("Failed to delete sale")
      }

      // Remove the deleted item from the state
      setDailySales(dailySales.filter((sale) => sale.id !== saleToDelete))
      if (dailySales.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      } else {
        // Refresh the current page
        fetchSales()
      }

      toast({
        title: "Success",
        description: "Sale deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting sale:", error)
      toast({
        title: "Error",
        description: "Failed to delete sale",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setSaleToDelete(null)
    }
  }

  const getEmptyRows = () => {
    if (isLoading || dailySales.length === 0) return null

    // Calculate how many empty rows we need to add
    const rowsToAdd = Math.max(0, itemsPerPage - dailySales.length)

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
    <div className="space-y-6 ">
      {/* <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Sales Report</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchSales()} disabled={isLoading}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
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
      </div> */}

      {/* Summary Cards */}

      {/* Sales Table */}
      <Card className="shadow-sm ">
        <CardHeader className="pb-3">
          <CardTitle>Items Sold</CardTitle>
          <CardDescription>Detailed breakdown of all items sold</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col h-[600px]">
          <div className="rounded-md border flex-grow overflow-hidden flex flex-col">
            <div className="overflow-auto flex-grow">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Date</TableHead>

                  <TableHead>Product Name</TableHead>
                  <TableHead className="text-center">Quantity Sold</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Total Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading state
                  Array(itemsPerPage)
                    .fill(0)
                    .map((_, index) => (
                      <TableRow key={`loading-${index}`}>
                        <TableCell className="py-4">
                          <div className="h-5 w-3/4 animate-pulse rounded bg-muted"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-1/2 animate-pulse rounded bg-muted"></div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="h-5 w-8 mx-auto animate-pulse rounded bg-muted"></div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="h-5 w-20 ml-auto animate-pulse rounded bg-muted"></div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="h-5 w-24 ml-auto animate-pulse rounded bg-muted"></div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-8 w-8 animate-pulse rounded bg-muted"></div>
                            <div className="h-8 w-8 animate-pulse rounded bg-muted"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                )
                  : dailySales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <ShoppingCart className="h-12 w-12 mb-2 opacity-20" />
                          <p>No sales recorded</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                    {dailySales.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {item.createdAt ? format(new Date(item.createdAt), "MMM d, yyyy HH:mm") : "N/A"}
                        </TableCell>

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
                        <TableCell className="text-right">

                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditSale(item.id)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteSale(item.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                      {/* Add empty rows to maintain fixed height */}
                      {getEmptyRows()}
                    </>
                  )}
              </TableBody>
            </Table>
            </div>
            <div className="flex items-center justify-between mt-4 pt-2 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {dailySales.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
                {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
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
                        <PaginationLink isActive={page === currentPage} onClick={() => handlePageChange(page as number)}>
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

              <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">Show</span>
                      <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue placeholder={itemsPerPage.toString()} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7</SelectItem>
                          <SelectItem value="14">14</SelectItem>
                          <SelectItem value="21">21</SelectItem>
                          <SelectItem value="28">28</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">per page</span>
                    </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the sale record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
