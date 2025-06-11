"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Search, ArrowUpDown, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { v4 as uuidv4 } from "uuid"
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

// Mock expense categories
const expenseCategories = [
  { value: "food", label: "Food & Beverages" },
  { value: "utilities", label: "Utilities" },
  { value: "supplies", label: "Office Supplies" },
  { value: "maintenance", label: "Maintenance" },
  { value: "transport", label: "Transportation" },
  { value: "other", label: "Other" },
]

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  createdAt: string
}

export default function ExpensesPage() {
  const { toast } = useToast()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<string>("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(6)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Form state
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchExpenses()
  }, [currentPage, itemsPerPage])

  const fetchExpenses = async () => {
    setIsLoading(true)
    try {
      // Build the URL with query parameters
      let url = "http://localhost:8083/api/v1/expenses"

      // Add query parameters
      const params = new URLSearchParams()

      // Add pagination parameters
      params.append("page", currentPage.toString())
      params.append("limit", itemsPerPage.toString())

      // Add search parameter if exists
      if (searchTerm) {
        params.append("search", searchTerm)
      }

      // Add sort parameters
      if (sortField) {
        params.append("sortBy", sortField)
        params.append("sortOrder", sortDirection)
      }

      // Append parameters to URL
      url += `?${params.toString()}`

      const res = await fetch(url, { credentials: "include"})
      const json = await res.json()

        const expensesData = json.data || json.data
        setExpenses(expensesData)
        setFilteredExpenses(expensesData)

        // Update pagination information if available in the response
        if (json.pagination) {
          setTotalItems(json.pagination.totalItems || 0)
          setTotalPages(json.pagination.totalPages || 1)
          setCurrentPage(json.pagination.currentPage || 1)
        } else {
          // If no pagination info, calculate based on array length
          setTotalItems(expensesData.length)
          setTotalPages(Math.ceil(expensesData.length / itemsPerPage))
        }
      
    } catch (err) {
      console.error("Failed to fetch expenses:", err)
      toast({
        title: "Error",
        description: "Failed to load expenses. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      setFilteredExpenses(
        expenses.filter(
          (expense) =>
            expense.description.toLowerCase().includes(term) || expense.category.toLowerCase().includes(term),
        ),
      )
    } else {
      setFilteredExpenses(expenses)
    }
  }, [searchTerm, expenses])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }

    // Apply sorting
    const sorted = [...filteredExpenses].sort((a, b) => {
      if (field === "date") {
        return sortDirection === "asc"
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime()
      } else if (field === "amount") {
        return sortDirection === "asc" ? a.amount - b.amount : b.amount - a.amount
      } else if (field === "description") {
        return sortDirection === "asc"
          ? a.description.localeCompare(b.description)
          : b.description.localeCompare(a.description)
      }
      return 0
    })

    setFilteredExpenses(sorted)
  }

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

  const handleAddExpense = async () => {
    if (!description || !amount || !category || !date) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const amountValue = Number.parseFloat(amount)
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const newExpense = {
        description,
        amount: amountValue,
        category,
        date,
      }

      const response = await fetch("http://localhost:8083/api/v1/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newExpense),
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error("Failed to add expense")
      }

      const data = await response.json()

        // Add the new expense to the state
        const createdExpense = {
          ...newExpense,
          id: data.data.id || uuidv4(),
          createdAt: new Date().toISOString(),
        }

        setExpenses([...expenses, createdExpense])
        setFilteredExpenses([...filteredExpenses, createdExpense])

        toast({
          title: "Success",
          description: "Expense added successfully",
        })

        // Reset form
        setDescription("")
        setAmount("")
        setCategory("")
        setDate(new Date().toISOString().split("T")[0])

        // Refresh expenses to update pagination
        fetchExpenses()
     
    } catch (error) {
      console.error("Error adding expense:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add expense",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteExpense = (id: string) => {
    setExpenseToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!expenseToDelete) return

    try {
      const response = await fetch(`http://localhost:8083/api/v1/expenses/${expenseToDelete}`, {
        method: "DELETE",
         credentials: "include"
      })

      if (!response.ok) {
        throw new Error("Failed to delete expense")
      }

      // Remove the expense from state
      setExpenses(expenses.filter((expense) => expense.id !== expenseToDelete))
      setFilteredExpenses(filteredExpenses.filter((expense) => expense.id !== expenseToDelete))

      if (filteredExpenses.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      } else {
        // Refresh the current page
        fetchExpenses()
      }

      toast({
        title: "Success",
        description: "Expense deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting expense:", error)
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setExpenseToDelete(null)
    }
  }

  // Function to generate empty rows to fill the table when there are fewer items
  const getEmptyRows = () => {
    if (isLoading || filteredExpenses.length === 0) return null

    // Calculate how many empty rows we need to add
    const rowsToAdd = Math.max(0, itemsPerPage - filteredExpenses.length)

    if (rowsToAdd === 0) return null

    return Array(rowsToAdd)
      .fill(0)
      .map((_, index) => (
        <TableRow key={`empty-${index}`}>
          <TableCell colSpan={4} className="h-[52px]"></TableCell>
        </TableRow>
      ))
  }

  const getCategoryLabel = (categoryValue: string) => {
    const category = expenseCategories.find((c) => c.value === categoryValue)
    return category ? category.label : categoryValue
  }

  // Calculate total expenses for today
  const today = new Date().toDateString()
  const todayExpenses = expenses
    .filter((expense) => new Date(expense.date).toDateString() === today)
    .reduce((sum, expense) => sum + expense.amount, 0)

  // Calculate total expenses for this month
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlyExpenses = expenses
    .filter((expense) => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
    })
    .reduce((sum, expense) => sum + expense.amount, 0)

  if (!mounted) return null

  return (
    <div className="space-y-4">
     

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
         
            </CardHeader>
            <CardContent className="flex flex-col h-[600px]">
              <div className="flex flex-col space-y-4 flex-grow overflow-hidden">
                <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search expenses..."
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
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("date")}
                            className="flex items-center gap-1 p-0 font-medium"
                          >
                            Date
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("description")}
                            className="flex items-center gap-1 p-0 font-medium"
                          >
                            Description
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("amount")}
                            className="flex items-center gap-1 p-0 font-medium"
                          >
                            Amount
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                              <p>Loading expenses...</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredExpenses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">
                            No expenses found
                          </TableCell>
                        </TableRow>
                      ) : (
                        <>
                          {filteredExpenses.map((expense) => (
                            <TableRow key={expense.id}>
                              <TableCell>{format(new Date(expense.createdAt), "MMM d, yyyy")}</TableCell>
                              <TableCell className="font-medium">{expense.description}</TableCell>
                              <TableCell>PKR {expense.amount.toFixed(2)}</TableCell>
                              <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                                    onClick={() => handleDeleteExpense(expense.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
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
                {!isLoading && filteredExpenses.length > 0 && (
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
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Expense</CardTitle>
              <CardDescription>Record a new operational expense</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g., Staff Lunch, Tea, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (PKR)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleAddExpense} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>Adding Expense...</>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expense Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Today's Expenses:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">PKR {todayExpenses.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>This Month's Expenses:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">PKR {monthlyExpenses.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Expenses:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    PKR {expenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the expense from your records.
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
