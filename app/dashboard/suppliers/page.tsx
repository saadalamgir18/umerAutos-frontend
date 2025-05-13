"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit, Trash2, Search, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
} from "@/components/ui/alert-dialog"
import { toastUtils } from "@/lib/utils/toast-utils"

export default function SuppliersPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(6)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const fetchSuppliers = async (page = currentPage, limit = itemsPerPage) => {
    setIsLoading(true)
    try {
      // Build the URL with query parameters
      let url = "http://localhost:8083/api/v1/suppliers"

      // Add query parameters
      const params = new URLSearchParams()

      // Add pagination parameters
      params.append("page", page.toString())
      params.append("limit", limit.toString())

      // Add search parameter if exists
      if (searchTerm) {
        params.append("search", searchTerm)
      }

      // Append parameters to URL
      url += `?${params.toString()}`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Failed to fetch suppliers")
      }
      const data = await response.json()
      if (data.isSuccess) {
        setSuppliers(data.data.items || data.data)
        setFilteredSuppliers(data.data.items || data.data)

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
      }
      return data
    } catch (error) {
      console.error("Error fetching suppliers:", error)
      toastUtils.error("fetch", "suppliers", "Failed to fetch suppliers. Please try again.")
      return { data: [] }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchSuppliers()
  }, [currentPage, itemsPerPage])

  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      setFilteredSuppliers(
        suppliers.filter(
          (s) =>
            s.contactPerson.toLowerCase().includes(term) ||
            s.company.toLowerCase().includes(term) ||
            s.email.toLowerCase().includes(term),
        ),
      )
    } else {
      setFilteredSuppliers(suppliers)
    }
  }, [searchTerm, suppliers])

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

  const handleDeleteSupplier = async (id: string) => {
    setSupplierToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!supplierToDelete) return

    try {
      const response = await fetch(`http://localhost:8083/api/v1/suppliers/${supplierToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete supplier")
      }

      // Remove the deleted item from the state
      setSuppliers(suppliers.filter((supplier) => supplier.id !== supplierToDelete))
      setFilteredSuppliers(filteredSuppliers.filter((supplier) => supplier.id !== supplierToDelete))

      if (filteredSuppliers.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      } else {
        // Refresh the current page
        fetchSuppliers()
      }

      toastUtils.successDelete("Supplier")
    } catch (error) {
      console.error("Error deleting supplier:", error)
      toastUtils.error("delete", "supplier", "Failed to delete supplier. Please try again.")
    } finally {
      setDeleteDialogOpen(false)
      setSupplierToDelete(null)
    }
  }

  // Function to generate empty rows to fill the table when there are fewer items
  const getEmptyRows = () => {
    if (isLoading || filteredSuppliers.length === 0) return null

    // Calculate how many empty rows we need to add
    const rowsToAdd = Math.max(0, itemsPerPage - filteredSuppliers.length)

    if (rowsToAdd === 0) return null

    return Array(rowsToAdd)
      .fill(0)
      .map((_, index) => (
        <TableRow key={`empty-${index}`}>
          <TableCell colSpan={5} className="h-[52px]"></TableCell>
        </TableRow>
      ))
  }

  if (!mounted) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
        <Button onClick={() => router.push("/dashboard/suppliers/add")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Directory</CardTitle>
          <CardDescription>Manage your motorcycle parts suppliers</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col h-[600px]">
          <div className="flex flex-col space-y-4 flex-grow overflow-hidden">
            <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search suppliers..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
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

            <div className="table-container flex-grow overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p>Loading suppliers...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredSuppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No suppliers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {filteredSuppliers.map((supplier, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{supplier.company}</TableCell>
                          <TableCell>{supplier.contactPerson}</TableCell>
                          <TableCell className="hidden md:table-cell">{supplier.email}</TableCell>
                          <TableCell className="hidden md:table-cell">{supplier.phoneNumber}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/dashboard/suppliers/edit/${supplier.id}`)}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              {user?.role === "admin" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                                    onClick={() => handleDeleteSupplier(supplier.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                              )}
                            </div>
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
            {!isLoading && filteredSuppliers.length > 0 && (
              <div className="flex items-center justify-between">
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
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the supplier from your database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
