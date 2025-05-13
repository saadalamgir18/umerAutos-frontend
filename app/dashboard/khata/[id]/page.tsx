"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Phone, MapPin, Calendar, Receipt, CheckCircle2, AlertCircle, PlusCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Customer, Sale } from "@/lib/redux/slices/salesSlice"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function CustomerKhataPage({ params }: { params: { id: string } }) {
  const [mounted, setMounted] = useState(false)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const router = useRouter()
  const { customers, sales } = useSelector((state: RootState) => state.sales)

  // Mock data for initial development
  const mockCustomers: Customer[] = [
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

  // Mock sales data
  const mockSales: Sale[] = [
    {
      id: "sale-1",
      items: [
        {
          productId: "prod-1",
          productName: "Engine Oil Filter",
          sku: "OIL-FLT-001",
          shelfCode: "A1",
          quantity: 2,
          unitPrice: 1500,
          discount: 0,
          tax: 0,
          total: 3000,
        },
        {
          productId: "prod-2",
          productName: "Brake Pads",
          sku: "BRK-PAD-002",
          shelfCode: "B3",
          quantity: 1,
          unitPrice: 7000,
          discount: 0,
          tax: 0,
          total: 7000,
        },
      ],
      customerId: "cust-1",
      customerName: "Ahmed Ali",
      customerPhone: "0300-1234567",
      subtotal: 10000,
      discount: 0,
      tax: 0,
      total: 10000,
      paymentStatus: "partial",
      paymentAmount: 5000,
      createdAt: "2023-04-15T10:30:00Z",
      updatedAt: "2023-04-15T10:30:00Z",
    },
    {
      id: "sale-2",
      items: [
        {
          productId: "prod-3",
          productName: "Chain Kit",
          sku: "CHN-KIT-003",
          shelfCode: "C2",
          quantity: 1,
          unitPrice: 12000,
          discount: 0,
          tax: 0,
          total: 12000,
        },
      ],
      customerId: "cust-1",
      customerName: "Ahmed Ali",
      customerPhone: "0300-1234567",
      subtotal: 12000,
      discount: 0,
      tax: 0,
      total: 12000,
      paymentStatus: "partial",
      paymentAmount: 2000,
      createdAt: "2023-05-20T14:45:00Z",
      updatedAt: "2023-05-20T14:45:00Z",
    },
    {
      id: "sale-3",
      items: [
        {
          productId: "prod-4",
          productName: "Carburetor",
          sku: "CRB-001",
          shelfCode: "D1",
          quantity: 1,
          unitPrice: 8500,
          discount: 0,
          tax: 0,
          total: 8500,
        },
      ],
      customerId: "cust-2",
      customerName: "Muhammad Imran",
      customerPhone: "0333-9876543",
      subtotal: 8500,
      discount: 0,
      tax: 0,
      total: 8500,
      paymentStatus: "unpaid",
      paymentAmount: 0,
      createdAt: "2023-06-10T09:15:00Z",
      updatedAt: "2023-06-10T09:15:00Z",
    },
    {
      id: "sale-4",
      items: [
        {
          productId: "prod-5",
          productName: "Clutch Plates",
          sku: "CLT-PLT-001",
          shelfCode: "E2",
          quantity: 1,
          unitPrice: 5200,
          discount: 0,
          tax: 0,
          total: 5200,
        },
      ],
      customerId: "cust-3",
      customerName: "Farhan Khan",
      customerPhone: "0321-5554433",
      subtotal: 5200,
      discount: 0,
      tax: 0,
      total: 5200,
      paymentStatus: "partial",
      paymentAmount: 2000,
      createdAt: "2023-07-05T16:20:00Z",
      updatedAt: "2023-07-05T16:20:00Z",
    },
  ]

  useEffect(() => {
    setMounted(true)

    // Find customer from Redux store or mock data
    const foundCustomer = [...customers, ...mockCustomers].find((c) => c.id === params.id)
    if (foundCustomer) {
      setCustomer(foundCustomer)
    }
  }, [params.id, customers])

  if (!mounted || !customer) return null

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
    })
  }

  // Get sale details for a transaction
  const getSaleDetails = (saleId: string) => {
    return [...sales, ...mockSales].find((sale) => sale.id === saleId)
  }

  // Handle payment submission
  const handlePaymentSubmit = () => {
    // In a real app, you would dispatch an action to update the customer's credit
    // For now, we'll just close the dialog
    setIsPaymentDialogOpen(false)
    setPaymentAmount("")

    // Show success message or update UI
    alert(`Payment of ${paymentAmount} PKR recorded successfully`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{customer.name}'s Khata</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{customer.phone}</span>
            </div>
            {customer.address && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{customer.address}</span>
              </div>
            )}
            <div className="pt-4">
              <div className="text-sm text-muted-foreground mb-1">Total Outstanding</div>
              <div className="text-3xl font-bold text-primary">{formatCurrency(customer.totalCredit)}</div>
            </div>
          </CardContent>
          <CardFooter>
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                  <DialogDescription>Enter the amount received from {customer.name}</DialogDescription>
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
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handlePaymentSubmit}
                    disabled={!paymentAmount || Number.parseFloat(paymentAmount) <= 0}
                  >
                    Record Payment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>All purchases and payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    customer.transactions.map((transaction, index) => {
                      const sale = getSaleDetails(transaction.saleId)
                      return (
                        <TableRow
                          key={index}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            if (sale) {
                              router.push(`/dashboard/sales/${transaction.saleId}`)
                            }
                          }}
                        >
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                              {formatDate(transaction.date)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Receipt className="mr-2 h-4 w-4 text-muted-foreground" />
                              {sale ? `Purchase - ${sale.items.length} items` : "Payment"}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(transaction.amount)}</TableCell>
                          <TableCell className="text-right">
                            {transaction.remaining > 0 ? (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                <AlertCircle className="mr-1 h-3 w-3" />
                                Partial
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Paid
                              </Badge>
                            )}
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

      <Card>
        <CardHeader>
          <CardTitle>Purchase Details</CardTitle>
          <CardDescription>All items purchased on credit</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.transactions
                  .filter((t) => {
                    const sale = getSaleDetails(t.saleId)
                    return sale !== undefined
                  })
                  .map((transaction, index) => {
                    const sale = getSaleDetails(transaction.saleId)!
                    return (
                      <TableRow
                        key={index}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/dashboard/sales/${transaction.saleId}`)}
                      >
                        <TableCell>{formatDate(sale.createdAt)}</TableCell>
                        <TableCell>#{sale.id.slice(-6)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            {sale.items.slice(0, 2).map((item, idx) => (
                              <span key={idx} className="text-sm">
                                {item.quantity}x {item.productName}
                              </span>
                            ))}
                            {sale.items.length > 2 && (
                              <span className="text-xs text-muted-foreground">+{sale.items.length - 2} more items</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(sale.total)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(sale.paymentAmount)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-destructive">
                          {formatCurrency(sale.total - sale.paymentAmount)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
