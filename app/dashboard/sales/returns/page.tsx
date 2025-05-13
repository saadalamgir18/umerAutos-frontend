"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/lib/redux/store"
import { addReturn } from "@/lib/redux/slices/salesSlice"
import { updateStock } from "@/lib/redux/slices/productSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Search, ArrowUpDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

export default function SalesReturnsPage() {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const { toast } = useToast()
  const { sales, returns } = useSelector((state: RootState) => state.sales)
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSale, setSelectedSale] = useState<any>(null)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [returnQuantity, setReturnQuantity] = useState(1)
  const [returnReason, setReturnReason] = useState("")
  const [sortField, setSortField] = useState<string>("returnDate")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const filteredSales = searchTerm
    ? sales.filter(
        (sale) =>
          sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (sale.customerName && sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    : sales

  const sortedReturns = [...returns].sort((a, b) => {
    if (sortField === "returnDate") {
      return sortDirection === "asc"
        ? new Date(a.returnDate).getTime() - new Date(b.returnDate).getTime()
        : new Date(b.returnDate).getTime() - new Date(a.returnDate).getTime()
    }
    return 0
  })

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleSelectSale = (saleId: string) => {
    const sale = sales.find((s) => s.id === saleId)
    setSelectedSale(sale)
    setSelectedProduct(null)
    setReturnQuantity(1)
  }

  const handleSelectProduct = (productId: string) => {
    const product = selectedSale?.items.find((item: any) => item.productId === productId)
    setSelectedProduct(product)
    setReturnQuantity(1)
  }

  const handleProcessReturn = () => {
    if (!selectedSale || !selectedProduct) {
      toast({
        title: "Error",
        description: "Please select a sale and product",
        variant: "destructive",
      })
      return
    }

    if (returnQuantity <= 0 || returnQuantity > selectedProduct.quantity) {
      toast({
        title: "Error",
        description: `Return quantity must be between 1 and ${selectedProduct.quantity}`,
        variant: "destructive",
      })
      return
    }

    if (!returnReason) {
      toast({
        title: "Error",
        description: "Please provide a reason for the return",
        variant: "destructive",
      })
      return
    }

    // Create return object
    const returnItem = {
      saleId: selectedSale.id,
      productId: selectedProduct.productId,
      productName: selectedProduct.productName,
      sku: selectedProduct.sku,
      quantity: returnQuantity,
      unitPrice: selectedProduct.unitPrice,
      reason: returnReason,
      returnDate: new Date().toISOString(),
    }

    // Add return to store
    dispatch(addReturn(returnItem))

    // Update inventory
    dispatch(updateStock({ id: selectedProduct.productId, quantity: returnQuantity }))

    toast({
      title: "Success",
      description: "Return processed successfully",
    })

    // Reset form
    setSelectedSale(null)
    setSelectedProduct(null)
    setReturnQuantity(1)
    setReturnReason("")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Sales Returns</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Return History</CardTitle>
              <CardDescription>View all processed returns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("returnDate")}
                          className="flex items-center gap-1 p-0 font-medium"
                        >
                          Date
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedReturns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          No returns found
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedReturns.map((returnItem) => (
                        <TableRow key={`${returnItem.saleId}-${returnItem.productId}-${returnItem.returnDate}`}>
                          <TableCell>{format(new Date(returnItem.returnDate), "MMM d, yyyy")}</TableCell>
                          <TableCell className="font-medium">{returnItem.productName}</TableCell>
                          <TableCell>{returnItem.sku}</TableCell>
                          <TableCell>{returnItem.quantity}</TableCell>
                          <TableCell>PKR {(returnItem.quantity * returnItem.unitPrice).toFixed(2)}</TableCell>
                          <TableCell>{returnItem.reason}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Process Return</CardTitle>
              <CardDescription>Select a sale and product to process a return</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="saleSearch">Search Sale</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="saleSearch"
                    placeholder="Search by sale ID or customer name"
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sale">Select Sale</Label>
                <Select value={selectedSale?.id || ""} onValueChange={handleSelectSale}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sale" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSales.map((sale) => (
                      <SelectItem key={sale.id} value={sale.id}>
                        {format(new Date(sale.createdAt), "MMM d, yyyy")} - {sale.customerName || "Walk-in Customer"}{" "}
                        (PKR {sale.total.toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSale && (
                <div className="space-y-2">
                  <Label htmlFor="product">Select Product</Label>
                  <Select value={selectedProduct?.productId || ""} onValueChange={handleSelectProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedSale.items.map((item: any) => (
                        <SelectItem key={item.productId} value={item.productId}>
                          {item.productName} - {item.quantity} units
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedProduct && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="returnQuantity">Return Quantity</Label>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setReturnQuantity(Math.max(1, returnQuantity - 1))}
                        disabled={returnQuantity <= 1}
                      >
                        -
                      </Button>
                      <Input
                        id="returnQuantity"
                        type="number"
                        min="1"
                        max={selectedProduct.quantity}
                        value={returnQuantity}
                        onChange={(e) => setReturnQuantity(Number.parseInt(e.target.value) || 1)}
                        className="w-20 text-center"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setReturnQuantity(Math.min(selectedProduct.quantity, returnQuantity + 1))}
                        disabled={returnQuantity >= selectedProduct.quantity}
                      >
                        +
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Maximum: {selectedProduct.quantity} units</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="returnReason">Return Reason</Label>
                    <Textarea
                      id="returnReason"
                      placeholder="Enter reason for return"
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between">
                      <span>Unit Price:</span>
                      <span>PKR {selectedProduct.unitPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total Refund:</span>
                      <span>PKR {(selectedProduct.unitPrice * returnQuantity).toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={handleProcessReturn}
                disabled={!selectedSale || !selectedProduct || !returnReason}
              >
                Process Return
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
