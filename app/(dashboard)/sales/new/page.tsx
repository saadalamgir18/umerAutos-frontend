"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/lib/redux/store"
import { addItemToSale, removeItemFromSale, updateItemQuantity, clearSale } from "@/lib/redux/slices/salesSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Search, Plus, Trash2, Save, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { toastUtils } from "@/lib/utils/toast-utils"
import { API_URL } from "@/lib/api";

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

// Define the sale request interface based on the Spring Boot DTOs
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

  useEffect(() => {
    setMounted(true)
    // No initial fetch of all products
  }, [])

  useEffect(() => {
    // Debounce search to avoid too many API calls
    const handler = setTimeout(() => {
      if (searchTerm) {
        fetchProducts(searchTerm)
      } else {
        // Clear results when search is empty
        setFilteredProducts([])
      }
    }, 300)

    return () => {
      clearTimeout(handler)
    }
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
      const response = await fetch(url, { credentials: "include"})

      if (!response.ok) {
        throw new Error(`Error fetching products: ${response.status}`)
      }

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
        tax: 0, // Default tax rate
        total: quantity * selectedProduct.sellingPrice, // Including tax
      }),
    )

    setSelectedProduct(null)
    setQuantity(1)
    setSearchTerm("")
    setFilteredProducts([]) // Clear search results after adding item
  }

  const handleRemoveItem = (productId: string) => {
    dispatch(removeItemFromSale(productId))
  }

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity > 0) {
      dispatch(updateItemQuantity({ productId, quantity: newQuantity }))
    }
  }

  const handleCompleteSale = async () => {
    const loadingToastId = toastUtils.loading("Creating sale...")
    
    if (currentSale.items.length === 0) {
      toastUtils.update(loadingToastId, "warning", "No item selected")
      
      return
    }

    // Validate payment amount for partial or paid status
    if (paymentStatus === "PAID" && paymentAmount < currentSale.total) {
      toastUtils.update(loadingToastId, "info", "PAID")
     
      return
    }

    if (paymentStatus === "PARTIAL" && (paymentAmount <= 0 || paymentAmount >= currentSale.total)) {
           toastUtils.update(loadingToastId, "info", "PARTIAL")

      return
    }

    if (paymentStatus === "UNPAID" && paymentAmount > 0) {
        toastUtils.update(loadingToastId, "warning", "UNPAID")

      return
    }

    // Calculate total quantity sold
    const totalQuantitySold = currentSale.items.reduce((total, item) => total + item.quantity, 0)

    // Create the sale request object for the API based on the DTO structure
    const saleRequest: SaleRequest = {
      customerName: customerName || "Walk-in Customer",
      paymentStatus: paymentStatus,
      totalAmountSummary: currentSale.total,
      quantitySoldSummary: totalQuantitySold,
      saleItems: currentSale.items.map((item) => ({
        productId: item.productId,
        quantitySold: item.quantity,
        totalAmount: item.total,
      })),
    }

    

    setIsSaving(true)

    try {
      // Send the sale data to the API
      const response = await fetch(`${API_URL}/api/v1/sales-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saleRequest),
         credentials: "include"
      })

      if (!response.ok) {
        throw new Error(`Error saving sale: ${response.status}`)
      }


      toastUtils.update(loadingToastId , "success", "Sales created successfully")
      

      // Update inventory in Redux store
      // Complete the sale in Redux store for local state
      dispatch(clearSale())

      
      router.push("/sales")
    } catch (err) {
      console.error("Failed to save sale:", err)
      toastUtils.update(loadingToastId, "error", "fail to save sale")

    } finally {
      setIsSaving(false)
    }
  }

  // Helper function to format compatible models for display
  const formatCompatibleModels = (models: string[]) => {
    if (!models || models.length === 0) return "N/A"
    return models.join(", ")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">New Sale</h1>
        <Button onClick={handleCompleteSale} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Complete Sale
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Products</CardTitle>
              <CardDescription>Search and add products to the current sale</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="productSearch">Search Product</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="productSearch"
                        placeholder="Search by name..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2">Loading products...</span>
                    </div>
                  ) : error ? (
                    <div className="text-center py-4 text-red-500">{error}</div>
                  ) : searchTerm && filteredProducts.length > 0 ? (
                    <div className="max-h-[200px] overflow-auto border rounded-md">
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
                            <TableRow
                              key={product.id}
                              className={selectedProduct?.id === product.id ? "bg-accent" : ""}
                              onClick={() => {
                                setSelectedProduct(product)
                                setQuantity(1)
                              }}
                            >
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell>{product.brandName || "N/A"}</TableCell>
                              <TableCell className="max-w-[150px] truncate">
                                {formatCompatibleModels(product.compatibleModels)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                                >
                                  {product.shelfCodeName || "N/A"}
                                </Badge>
                              </TableCell>
                              <TableCell>PKR {product.sellingPrice.toFixed(2)}</TableCell>
                              <TableCell>{product.quantityInStock}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProduct(product)
                                    setQuantity(1)
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

                  {selectedProduct && (
                    <div className="space-y-4 border rounded-md p-4 mt-2">
                      <div className="font-medium">
                        Selected Product: {selectedProduct.name}
                        <div className="text-sm mt-1">
                          <span className="font-medium">Brand:</span> {selectedProduct.brandName || "N/A"}
                        </div>
                        {selectedProduct.compatibleModels && selectedProduct.compatibleModels.length > 0 && (
                          <div className="text-sm mt-1">
                            <span className="font-medium">Compatible Models:</span>
                            <ul className="list-disc pl-5 mt-1 text-muted-foreground">
                              {selectedProduct.compatibleModels.map((model, index) => (
                                <li key={index}>{model}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedProduct.shelfCodeName && (
                          <div className="mt-2">
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                            >
                              Shelf: {selectedProduct.shelfCodeName}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="quantity">Quantity</Label>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              disabled={quantity <= 1}
                            >
                              -
                            </Button>
                            <Input
                              id="quantity"
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
                              className="h-8 w-8"
                              onClick={() => setQuantity(Math.min(selectedProduct.quantityInStock, quantity + 1))}
                              disabled={quantity >= selectedProduct.quantityInStock}
                            >
                              +
                            </Button>
                          </div>
                          {selectedProduct.quantityInStock < 5 && (
                            <p className="text-xs text-amber-500">Only {selectedProduct.quantityInStock} in stock</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sellingPrice">Selling Price (PKR)</Label>
                          <Input
                            id="sellingPrice"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={selectedProduct.sellingPrice}
                            onChange={(e) => {
                              const newPrice = Number.parseFloat(e.target.value) || 0
                              setSelectedProduct({ ...selectedProduct, sellingPrice: newPrice })
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <div className="font-medium">
                          Total: PKR {(selectedProduct.sellingPrice * quantity).toFixed(2)}
                        </div>
                        <Button onClick={handleAddItem} disabled={!selectedProduct || quantity <= 0}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add to Sale
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Compatible Models</TableHead>
                        <TableHead>Shelf</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Quantity</TableHead>
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
                            <TableCell className="font-medium">{item.productName}</TableCell>
                            <TableCell>{item.brandName || "N/A"}</TableCell>
                            <TableCell className="max-w-[150px] truncate">
                              {item.compatibleModels && item.compatibleModels.length > 0
                                ? formatCompatibleModels(item.compatibleModels)
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                              >
                                {item.shelfCode || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell>PKR {item.unitPrice.toFixed(2)}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  -
                                </Button>
                                <span className="w-8 text-center">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
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
                                className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                                onClick={() => handleRemoveItem(item.productId)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remove</span>
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

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sale Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer Name (Optional)</Label>
                <Input
                  id="customer"
                  placeholder="Walk-in Customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-status">Payment Status</Label>
                <Select
                  value={paymentStatus}
                  onValueChange={(value: "PAID" | "UNPAID" | "PARTIAL") => {
                    setPaymentStatus(value)
                    if (value === "PAID") {
                      setPaymentAmount(currentSale.total)
                    } else if (value === "UNPAID") {
                      setPaymentAmount(0)
                    }
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
                <div className="space-y-2">
                  <Label htmlFor="payment-amount">Payment Amount</Label>
                  <Input
                    id="payment-amount"
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
                {/* <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-PKR {currentSale.discount.toFixed(2)}</span>
                </div> */}
                {/* <div className="flex justify-between">
                  <span>Tax (10%):</span>
                  <span>PKR {currentSale.tax.toFixed(2)}</span>
                </div> */}
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span>PKR {currentSale.total.toFixed(2)}</span>
                </div>
                {paymentStatus === "PARTIAL" && (
                  <>
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Paid:</span>
                      <span>PKR {paymentAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-600 dark:text-red-400">
                      <span>Balance:</span>
                      <span>PKR {(currentSale.total - paymentAmount).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleCompleteSale} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
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
