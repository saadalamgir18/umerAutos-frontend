"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Phone, ArrowRight, Plus, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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

interface Transaction {
  saleId: string
  date: string
  amount: number
  paid: number
  remaining: number
}

interface Customer {
  id: string
  name: string
  phone: string
  address: string
  totalCredit: number
  transactions: Transaction[]
}

interface ApiResponse {
  data: Customer[]
  message: string
  status: number
  isSuccess: boolean
  pagination?: {
    totalItems: number
    totalPages: number
    currentPage: number
    itemsPerPage: number
  }
}

export default function KhataPage() {
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const { customers } = useSelector((state: RootState) => state.sales)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [allCustomers, setAllCustomers] = useState<Customer[]>([])

  // Mock data for initial development
  const mockCustomers = [
    {
      id: "cust-1",
      name: "Ahmed Ali",
      phone: "0300-1234567",
      address: "Street 5, Rawalpindi",
      totalCredit: 15000,
      transactions: [
        {
          saleId: "sale-1",
          date: "2023-04-15T10:30:00Z",
          amount: 10000,
          paid: 5000,
          remaining: 5000,
        },
        {
          saleId: "sale-2",
          date: "2023-05-20T14:45:00Z",
          amount: 12000,
          paid: 2000,
          remaining: 10000,
        },
      ],
    },
    {
      id: "cust-2",
      name: "Muhammad Imran",
      phone: "0333-9876543",
      address: "Main Road, Lahore",
      totalCredit: 8500,
      transactions: [
        {
          saleId: "sale-3",
          date: "2023-06-10T09:15:00Z",
          amount: 8500,
          paid: 0,
          remaining: 8500,
        },
      ],
    },
    {
      id: "cust-3",
      name: "Farhan Khan",
      phone: "0321-5554433",
      address: "Model Town, Karachi",
      totalCredit: 3200,
      transactions: [
        {
          saleId: "sale-4",
          date: "2023-07-05T16:20:00Z",
          amount: 5200,
          paid: 2000,
          remaining: 3200,
        },
      ],
    },
  ]

  useEffect(() => {
    setMounted(true)
    fetchCustomers()
  }, [currentPage, itemsPerPage])

  const fetchCustomers = async () => {
    setLoading(true)
    setError(null)

    try {
      // In a real app, you would fetch from an API with pagination
      // For now, we'll simulate pagination with the mock data

      // Simulate API call with pagination
      // const response = await fetch(`http://localhost:8083/api/v1/customers?page=${currentPage}&limit=${itemsPerPage}`)
      // const data: ApiResponse = await response.json()

      // For now, use mock data
      const combinedCustomers = [...mockCustomers, ...customers]
      setAllCustomers([])

      // Simulate pagination
      const totalItems = combinedCustomers.length
      const totalPages = Math.ceil(totalItems / itemsPerPage)

      setTotalItems(totalItems)
      setTotalPages(totalPages)
    } catch (err) {
      console.error("Error fetching customers:", err)
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

  if (!mounted) return null

  // Filter customers based on search query
  const filteredCustomers = searchQuery
    ? allCustomers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchQuery.toLowerCase()) || customer.phone.includes(searchQuery),
      )
    : allCustomers

  // Apply pagination to filtered customers
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Khata (Credit Ledger)</h1>
        <Button onClick={() => router.push("/dashboard/khata/add")}>
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Credit Records</CardTitle>
          <CardDescription>Manage customers who have outstanding balances (udhar)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by customer name or phone..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>Error loading customers: {error}</p>
              <Button variant="outline" onClick={fetchCustomers} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead className="text-right">Outstanding Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          No customers with outstanding balances found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                              {customer.phone}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={customer.totalCredit > 10000 ? "destructive" : "secondary"}
                              className="text-sm"
                            >
                              {formatCurrency(customer.totalCredit)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/dashboard/khata/${customer.id}`)}
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Only show pagination if there are customers */}
              {filteredCustomers.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredCustomers.length)} to{" "}
                      {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length}{" "}
                      entries
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
