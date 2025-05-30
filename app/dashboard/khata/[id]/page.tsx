"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Calendar, PlusCircle, CreditCard, User } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface SaleItem {
  id: string | null
  productId: string
  productName: string
  quantitySold: number
  totalPrice: number
  profit: number
  createdAt: string
}

interface Sale {
  customerName: string
  totalAmountSummary: number
  quantitySoldSummary: number
  saleItems: SaleItem[]
  paymentStatus: "PAID" | "UNPAID" | "PARTIAL"
  createdAt: string
  id: string
}

export default function SaleDetailPage({ params }: { params: { id: string } }) {
  const [mounted, setMounted] = useState(false)
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [paymentAmount, setPaymentAmount] = useState("")
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [paymentType, setPaymentType] = useState<"selected" | "all" | "single">("selected")
  const [singleItemId, setSingleItemId] = useState<string>("")
  const router = useRouter()
  const { toast } = useToast()

  const saleId = params.id

  useEffect(() => {
    setMounted(true)
    fetchSaleData()
  }, [saleId])

  const fetchSaleData = async () => {
    setLoading(true)
    setError(null)

    try {
      // In a real app, you would fetch a specific sale by ID
      // For now, we'll fetch all sales and find the one with matching ID
      const response = await fetch(`http://localhost:8083/api/v1/sales-summary?status=unpaid&limit=1000`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Find the sale with the matching ID
      const foundSale = data.data.find((s: Sale) => s.id === saleId)

      if (!foundSale) {
        setError("Sale not found or has no outstanding balance")
        return
      }

      setSale(foundSale)
    } catch (err) {
      console.error("Error fetching sale data:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleItemSelection = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems)
    if (checked) {
      newSelected.add(itemId)
    } else {
      newSelected.delete(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked && sale) {
      const allItemIds = sale.saleItems.map((item) => item.productId)
      setSelectedItems(new Set(allItemIds))
    } else {
      setSelectedItems(new Set())
    }
  }

  const openPaymentDialog = (type: "selected" | "all" | "single", itemId?: string) => {
    setPaymentType(type)
    if (type === "single" && itemId && sale) {
      setSingleItemId(itemId)
      const item = sale.saleItems.find((item) => item.productId === itemId)
      setPaymentAmount(item?.totalPrice.toString() || "")
    } else if (type === "selected") {
      const selectedTotal = getSelectedItemsTotal()
      setPaymentAmount(selectedTotal.toString())
    } else if (type === "all" && sale) {
      setPaymentAmount(sale.totalAmountSummary.toString())
    }
    setIsPaymentDialogOpen(true)
  }

  const getSelectedItemsTotal = () => {
    if (!sale) return 0
    return sale.saleItems
      .filter((item) => selectedItems.has(item.productId))
      .reduce((total, item) => total + item.totalPrice, 0)
  }

  const handlePaymentSubmit = async () => {
    try {
      const amount = Number.parseFloat(paymentAmount)
      if (amount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid payment amount",
          variant: "destructive",
        })
        return
      }

      // Here you would make an API call to record the payment
      // For now, we'll just show a success message

      let itemsToUpdate: SaleItem[] = []

      if (paymentType === "single" && sale) {
        const item = sale.saleItems.find((item) => item.productId === singleItemId)
        if (item) itemsToUpdate = [item]
      } else if (paymentType === "selected" && sale) {
        itemsToUpdate = sale.saleItems.filter((item) => selectedItems.has(item.productId))
      } else if (paymentType === "all" && sale) {
        itemsToUpdate = sale.saleItems
      }

      // API call would go here
      // await recordPayment(saleId, amount, itemsToUpdate)

      toast({
        title: "Payment Recorded",
        description: `Payment of ${formatCurrency(amount)} recorded successfully for ${itemsToUpdate.length} item(s)`,
      })

      setIsPaymentDialogOpen(false)
      setPaymentAmount("")
      setSelectedItems(new Set())

      // Refresh the data
      fetchSaleData()
    } catch (err) {
      toast({
        title: "Payment Failed",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!mounted) return null

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading sale data...</p>
        </div>
      </div>
    )
  }

  if (error || !sale) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error || "Sale not found"}</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const selectedTotal = getSelectedItemsTotal()

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Sale #{sale.id.slice(-6)}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sale Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Customer: {sale.customerName}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Date: {formatDate(sale.createdAt)}</span>
            </div>
            <div className="pt-4">
              <div className="text-sm text-muted-foreground mb-1">Total Outstanding</div>
              <div className="text-3xl font-bold text-primary">{formatCurrency(sale.totalAmountSummary)}</div>
            </div>
            <div className="pt-2">
              <div className="text-sm text-muted-foreground mb-1">Total Items</div>
              <div className="text-xl font-semibold">{sale.quantitySoldSummary} items</div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button className="flex-1" onClick={() => openPaymentDialog("all")}>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay All ({formatCurrency(sale.totalAmountSummary)})
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Selected Items</CardTitle>
            <CardDescription>
              {selectedItems.size} item(s) selected
              {selectedItems.size > 0 && ` - Total: ${formatCurrency(selectedTotal)}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedItems.size > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  You have selected {selectedItems.size} item(s) worth {formatCurrency(selectedTotal)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Select items below to make a partial payment</p>
            )}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              disabled={selectedItems.size === 0}
              onClick={() => openPaymentDialog("selected")}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Pay Selected ({formatCurrency(selectedTotal)})
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Sale Items</span>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedItems.size === sale.saleItems.length && sale.saleItems.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="text-sm font-normal">
                Select All
              </Label>
            </div>
          </CardTitle>
          <CardDescription>All items in this sale</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Select</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.saleItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No items found
                    </TableCell>
                  </TableRow>
                ) : (
                  sale.saleItems.map((item) => {
                    const isSelected = selectedItems.has(item.productId)

                    return (
                      <TableRow key={item.productId} className={isSelected ? "bg-muted/50" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleItemSelection(item.productId, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell className="text-right">{item.quantitySold}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPaymentDialog("single", item.productId)}
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Pay
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              {paymentType === "single" && "Enter payment for the selected item"}
              {paymentType === "selected" && `Enter payment for ${selectedItems.size} selected item(s)`}
              {paymentType === "all" && "Enter payment for all items in this sale"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Payment Amount (PKR)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                {paymentType === "single" && singleItemId && (
                  <>
                    Item total:{" "}
                    {formatCurrency(sale.saleItems.find((item) => item.productId === singleItemId)?.totalPrice || 0)}
                  </>
                )}
                {paymentType === "selected" && <>Selected items total: {formatCurrency(selectedTotal)}</>}
                {paymentType === "all" && <>Total outstanding: {formatCurrency(sale.totalAmountSummary)}</>}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handlePaymentSubmit} disabled={!paymentAmount || Number.parseFloat(paymentAmount) <= 0}>
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
