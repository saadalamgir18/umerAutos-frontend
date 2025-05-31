"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, CreditCard, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import GoBackButton from "@/components/GoBackButton"

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
  const [payingAll, setPayingAll] = useState(false)
  const [payingItems, setPayingItems] = useState<Set<string>>(new Set())
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
      const response = await fetch(`http://localhost:8083/api/v1/sales-summary/${saleId}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data) {
        setError("Sale not found or has no outstanding balance")
        return
      }

      setSale(data)
    } catch (err) {
      console.error("Error fetching sale data:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handlePayAll = async () => {
    if (!sale) return

    setPayingAll(true)
    try {
      const response = await fetch(`http://localhost:8083/api/v1/sales-summary/${saleId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentStatus: "PAID",
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      toast({
        title: "Payment Successful",
        description: `Full payment of ${formatCurrency(sale.totalAmountSummary)} recorded successfully`,
      })

      // Refresh the data
      fetchSaleData()
    } catch (err) {
      console.error("Error processing payment:", err)
      toast({
        title: "Payment Failed",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setPayingAll(false)
    }
  }

  const handlePaySingleItem = async (productId: string, productName: string, amount: number) => {
    setPayingItems((prev) => new Set(prev).add(productId))

    try {
      const response = await fetch(`http://localhost:8083/api/v1/sale-items/${productId}/payment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: productId,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      toast({
        title: "Payment Successful",
        description: `Payment of ${formatCurrency(amount)} for ${productName} recorded successfully`,
      })

      // Refresh the data
      fetchSaleData()
    } catch (err) {
      console.error("Error processing item payment:", err)
      toast({
        title: "Payment Failed",
        description: `Failed to process payment for ${productName}. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setPayingItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
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
    return <GoBackButton />
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

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <GoBackButton />
        <h1 className="text-3xl font-bold tracking-tight">Sale #{sale.id.slice(-6)}</h1>
      </div>

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
        <CardFooter>
          <Button className="w-full" onClick={handlePayAll} disabled={payingAll}>
            <CreditCard className="mr-2 h-4 w-4" />
            {payingAll ? "Processing..." : `Pay All (${formatCurrency(sale.totalAmountSummary)})`}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sale Items</CardTitle>
          <CardDescription>All items in this sale</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.saleItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      No items found
                    </TableCell>
                  </TableRow>
                ) : (
                  sale.saleItems.map((item) => {
                    const isPayingThisItem = payingItems.has(item.productId)

                    return (
                      <TableRow key={item.productId}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell className="text-right">{item.quantitySold}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePaySingleItem(item.productId, item.productName, item.totalPrice)}
                            disabled={isPayingThisItem}
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            {isPayingThisItem ? "Processing..." : "Pay"}
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
    </div>
  )
}
