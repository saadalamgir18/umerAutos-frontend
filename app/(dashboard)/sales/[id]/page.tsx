"use client"

import { useState, useEffect, use } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Printer, Loader2, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

// Define interface for the sale items
interface SaleItem {
  id: string
  productName: string
  quantitySold: number
  totalPrice: number
}
type Props = {
  params: Promise<{ id: string }>; // 👈 `params` is a Promise now
};

export default function SaleDetailsPage({ params }:  Props) {
  const router = useRouter()
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
    const { id } = use(params); // ✅ unwrap the Promise with `use()`
  

  useEffect(() => {
    // Try to get the sale items from sessionStorage
    const storedItems = sessionStorage.getItem(`saleItems-${id}`)

    if (storedItems) {
      try {
        const parsedItems = JSON.parse(storedItems)
        setSaleItems(parsedItems)
        setLoading(false)
      } catch (err) {
        console.error("Error parsing stored sale items:", err)
        setError("Error loading sale items. Please go back and try again.")
        setLoading(false)
      }
    } else {
      // If not in sessionStorage, redirect back to sales page
      setError("Sale items not found. Please go back to the sales list.")
      setLoading(false)
    }
  }, [id])

  // Calculate totals from the sale items
  const totalQuantity = saleItems.reduce((sum, item) => sum + item.quantitySold, 0)
  const totalAmount = saleItems.reduce((sum, item) => sum + item.totalPrice, 0)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading sale items...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
        <p className="text-red-500 mb-2">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    )
  }

  if (saleItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-8 w-8 text-amber-500 mb-4" />
        <p className="text-muted-foreground mb-2">No items found for this sale</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Sale Items</h1>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print List
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items Purchased</CardTitle>
          <CardDescription>
            Sale #{id.substring(0, 8)} - {totalQuantity} items - PKR {totalAmount.toFixed(2)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {saleItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell>{item.quantitySold}</TableCell>
                  <TableCell>PKR {(item.totalPrice / item.quantitySold).toFixed(2)}</TableCell>
                  <TableCell className="text-right">PKR {item.totalPrice.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={2} />
                <TableCell className="font-bold">Total</TableCell>
                <TableCell className="text-right font-bold">PKR {totalAmount.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
