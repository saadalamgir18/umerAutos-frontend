"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/lib/redux/store"
import { addItemToSale, removeItemFromSale, updateItemQuantity, clearSale } from "@/lib/redux/slices/salesSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Search, Plus, Trash2, Save, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { toastUtils } from "@/lib/utils/toast-utils"
import { API_URL } from "@/lib/api"

// dialog
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

// Define the product type based on the API response
interface Product {
  id: string
  name: string
  sku: string
  description: string
  quantityInStock: number
  purchasePrice: number
  sellingPrice: number
  brandId: string
  brandName: string
  modelId: string | null
  modelName: string | null
  categoryId: string | null
  categoryName: string | null
  supplierId: string | null
  supplierName: string | null
  shelfCodeId: string | null
  shelfCodeName: string | null
  compatibleModels: string[]
  createdAt: string
  updatedAt: string
}

// Define the SaleDTO interface
interface SaleDTO {
  productId: string
  quantitySold: number
  totalAmount: number
}

// Define the sale request interface
interface SaleRequest {
  customerName: string
  paymentStatus: string
  totalAmountSummary: number
  quantitySoldSummary: number
  saleItems: SaleDTO[]
}

export default function NewSalePage() {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const { currentSale } = useSelector((state: RootState) => state.sales)

  const [searchTerm, setSearchTerm] = useState("")
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)

  const [customerName, setCustomerName] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "UNPAID" | "PARTIAL">("PAID")
  const [paymentAmount, setPaymentAmount] = useState(0)

  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm) {
        fetchProducts(searchTerm)
      } else {
        setFilteredProducts([])
      }
    }, 300)
    return () => clearTimeout(handler)
  }, [searchTerm])

  useEffect(() => {
    setPaymentAmount(currentSale.total)
  }, [currentSale.total])

  const fetchProducts = async (search = "") => {
    if (!search) return
    setIsLoading(true)
    setError(null)
    try {
      const url = `${API_URL}/api/v1/products?name=${encodeURIComponent(search)}`
      const response = await fetch(url, { credentials: "include" })
      if (!response.ok) throw new Error(`Error fetching products: ${response.status}`)
      const data = await response.json()
      setFilteredProducts(data.data)
    } catch (err) {
      console.error("Failed to fetch products:", err)
      setError("Failed to load products. Please try again.")
      setFilteredProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) return null

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) return

    dispatch(
      addItemToSale({
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        sku: selectedProduct.sku,
        brandName: selectedProduct.brandName,
        compatibleModels: selectedProduct.compatibleModels,
        shelfCode: selectedProduct.shelfCodeName || "N/A",
        quantity,
        unitPrice: selectedProduct.sellingPrice,
        discount: 0,
        tax: 0,
        total: quantity * selectedProduct.sellingPrice,
      })
    )

    setSelectedProduct(null)
    setQuantity(1)
    setSearchTerm("")
    setFilteredProducts([])
  }

  const handleRemoveItem = (productId: string) => {
    dispatch(removeItemFromSale(productId))
  }

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity > 0) {
      dispatch(updateItemQuantity({ productId, quantity: newQuantity }))
    }
  }

  // helper
  const formatCompatibleModels = (models: string[]) =>
    !models || models.length === 0 ? "N/A" : models.join(", ")

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="grid gap-4">
                  <div className="relative mt-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2">Loading products...</span>
                    </div>
                  ) : error ? (
                    <div className="text-center py-4 text-red-500">{error}</div>
                  ) : searchTerm && filteredProducts.length > 0 ? (
                    <div className="max-h-[400px] overflow-auto border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Brand</TableHead>
                            <TableHead>Compatible Models</TableHead>
                            <TableHead>Shelf</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProducts.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell>{product.name}</TableCell>
                              <TableCell>{product.brandName || "N/A"}</TableCell>
                              <TableCell className="max-w-[150px] truncate">
                                {formatCompatibleModels(product.compatibleModels)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{product.shelfCodeName || "N/A"}</Badge>
                              </TableCell>
                              <TableCell>PKR {product.sellingPrice.toFixed(2)}</TableCell>
                              <TableCell>{product.quantityInStock}</TableCell>
                              <TableCell>
                                <Button
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedProduct(product)
                                    setQuantity(1)
                                    setIsDialogOpen(true)
                                  }}
                                >
                                  Select
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : searchTerm ? (
                    <div className="text-center py-4 text-muted-foreground">No products found</div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">Type to search products</div>
                  )}
                </div>

                {/* Dialog for selected product */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{selectedProduct?.name}</DialogTitle>
                    </DialogHeader>

                    {selectedProduct && (
                      <div className="space-y-4">
                        <div>
                          <Label>Quantity</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              disabled={quantity <= 1}
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              max={selectedProduct.quantityInStock}
                              value={quantity}
                              onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                              className="w-20 text-center"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                setQuantity(Math.min(selectedProduct.quantityInStock, quantity + 1))
                              }
                              disabled={quantity >= selectedProduct.quantityInStock}
                            >
                              +
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label>Selling Price (PKR)</Label>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={selectedProduct.sellingPrice}
                            onChange={(e) =>
                              setSelectedProduct({
                                ...selectedProduct,
                                sellingPrice: Number.parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>

                        <div className="font-medium">
                          Total: PKR {(selectedProduct.sellingPrice * quantity).toFixed(2)}
                        </div>
                      </div>
                    )}

                    <DialogFooter>
                      <Button
                      variant={"destructive"}
                        onClick={() => {
                          handleAddItem()
                          setIsDialogOpen(false)
                        }}
                        disabled={!selectedProduct || quantity <= 0}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add to Sale
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Selected items table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Models</TableHead>
                        <TableHead>Shelf</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentSale.items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center">
                            No items added to sale
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentSale.items.map((item) => (
                          <TableRow key={item.productId}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell>{item.brandName || "N/A"}</TableCell>
                            <TableCell className="max-w-[150px] truncate">
                              {item.compatibleModels?.length
                                ? formatCompatibleModels(item.compatibleModels)
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.shelfCode || "N/A"}</Badge>
                            </TableCell>
                            <TableCell>PKR {item.unitPrice.toFixed(2)}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  -
                                </Button>
                                <span className="w-8 text-center">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                >
                                  +
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>PKR {item.total.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500"
                                onClick={() => handleRemoveItem(item.productId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right side summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sale Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Customer Name (Optional)</Label>
                <Input
                  placeholder="Walk-in Customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div>
                <Label>Payment Status</Label>
                <Select
                  value={paymentStatus}
                  onValueChange={(value: "PAID" | "UNPAID" | "PARTIAL") => {
                    setPaymentStatus(value)
                    if (value === "PAID") setPaymentAmount(currentSale.total)
                    else if (value === "UNPAID") setPaymentAmount(0)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="UNPAID">Unpaid</SelectItem>
                    <SelectItem value="PARTIAL">Partially Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentStatus !== "UNPAID" && (
                <div>
                  <Label>Payment Amount</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number.parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}

              <div className="space-y-1 pt-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>PKR {currentSale.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span>PKR {currentSale.total.toFixed(2)}</span>
                </div>
                {paymentStatus === "PARTIAL" && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <span>Paid:</span>
                      <span>PKR {paymentAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Balance:</span>
                      <span>PKR {(currentSale.total - paymentAmount).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant={"destructive"} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Complete Sale"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
