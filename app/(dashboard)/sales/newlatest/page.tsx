"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/lib/redux/store"
import { addItemToSale, removeItemFromSale, updateItemQuantity, clearSale } from "@/lib/redux/slices/salesSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Save,
  Loader2,
  ShoppingCart,
  Package,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toastUtils } from "@/lib/utils/toast-utils"

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
  const [customerName, setCustomerName] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "UNPAID" | "PARTIAL">("PAID")
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set())

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Debounce search to avoid too many API calls
    const handler = setTimeout(() => {
      if (searchTerm) {
        fetchProducts(searchTerm)
      } else {
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
      const url = `http://localhost:8083/api/v1/products?name=${encodeURIComponent(search)}`
      const response = await fetch(url, { credentials: "include" })

      if (!response.ok) {
        throw new Error(`Error fetching products: ${response.status}`)
      }

      const data = await response.json()
      setFilteredProducts(data.data || [])
    } catch (err) {
      console.error("Failed to fetch products:", err)
      setError("Failed to load products. Please try again.")
      setFilteredProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) return null

  const handleAddItem = (product: Product, quantity: number) => {
    if (quantity <= 0 || quantity > product.quantityInStock) return

    dispatch(
      addItemToSale({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        brandName: product.brandName,
        compatibleModels: product.compatibleModels,
        shelfCode: product.shelfCodeName || "N/A",
        quantity,
        unitPrice: product.sellingPrice,
        discount: 0,
        tax: 0,
        total: quantity * product.sellingPrice,
      }),
    )

    // Add visual feedback
    setAddedProducts((prev) => new Set(prev).add(product.id))
    setTimeout(() => {
      setAddedProducts((prev) => {
        const newSet = new Set(prev)
        newSet.delete(product.id)
        return newSet
      })
    }, 2000)
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
      toastUtils.update(loadingToastId, "warning", "No items selected")
      return
    }

    // Validate payment amount for partial or paid status
    if (paymentStatus === "PAID" && paymentAmount < currentSale.total) {
      toastUtils.update(loadingToastId, "error", "Payment amount must equal total for PAID status")
      return
    }

    if (paymentStatus === "PARTIAL" && (paymentAmount <= 0 || paymentAmount >= currentSale.total)) {
      toastUtils.update(loadingToastId, "error", "Partial payment must be between 0 and total amount")
      return
    }

    if (paymentStatus === "UNPAID" && paymentAmount > 0) {
      toastUtils.update(loadingToastId, "error", "Payment amount must be 0 for UNPAID status")
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
      const response = await fetch("http://localhost:8083/api/v1/sales-summary", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saleRequest),
        
      })

      if (!response.ok) {
        throw new Error(`Error saving sale: ${response.status}`)
      }

      toastUtils.update(loadingToastId, "success", "Sale created successfully")
      dispatch(clearSale())
      router.push("/sales")
    } catch (err) {
      console.error("Failed to save sale:", err)
      toastUtils.update(loadingToastId, "error", "Failed to save sale")
    } finally {
      setIsSaving(false)
    }
  }

  const getStockBadgeVariant = (stock: number) => {
    if (stock === 0) return "destructive"
    if (stock <= 5) return "secondary"
    return "default"
  }

  const getStockBadgeText = (stock: number) => {
    if (stock === 0) return "Out of Stock"
    if (stock <= 5) return `Low Stock (${stock})`
    return `In Stock (${stock})`
  }

  const isProductInCart = (productId: string) => {
    return currentSale.items.some((item) => item.productId === productId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">New Sale</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Search products and create a new sale transaction</p>
          </div>
          <Button
            onClick={handleCompleteSale}
            disabled={isSaving || currentSale.items.length === 0}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Complete Sale
              </>
            )}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Search */}
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Search className="h-5 w-5 text-blue-600" />
                  Search Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Enhanced Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search products by name..."
                      className="pl-9 h-10 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {isLoading && (
                      <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-blue-600" />
                    )}
                  </div>

                  {/* Search Results */}
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                        <p className="text-slate-600 dark:text-slate-400">Searching products...</p>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                      <Button variant="outline" onClick={() => fetchProducts(searchTerm)} className="mt-3">
                        Try Again
                      </Button>
                    </div>
                  ) : searchTerm && filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-2">
                      {filteredProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onAddToCart={handleAddItem}
                          isInCart={isProductInCart(product.id)}
                          isAdded={addedProducts.has(product.id)}
                        />
                      ))}
                    </div>
                  ) : searchTerm ? (
                    <div className="text-center py-8">
                      <Package className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-600 dark:text-slate-400">No products found</p>
                      <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Try adjusting your search terms</p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Search className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-600 dark:text-slate-400">Start typing to search products</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Shopping Cart */}
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  Shopping Cart
                  {currentSale.items.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {currentSale.items.length} items
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentSale.items.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600 dark:text-slate-400">Your cart is empty</p>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                      Search and add products to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentSale.items.map((item) => (
                      <CartItem
                        key={item.productId}
                        item={item}
                        onQuantityChange={handleQuantityChange}
                        onRemove={handleRemoveItem}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sale Summary Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm sticky top-6">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-xl">Sale Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Customer Information */}
                <div className="space-y-1">
                  <Label htmlFor="customer" className="text-sm font-medium">
                    Customer Name
                  </Label>
                  <Input
                    id="customer"
                    placeholder="Walk-in Customer"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-9"
                  />
                </div>

                {/* Payment Status */}
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Payment Status</Label>
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
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAID">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Paid
                        </div>
                      </SelectItem>
                      <SelectItem value="UNPAID">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Unpaid
                        </div>
                      </SelectItem>
                      <SelectItem value="PARTIAL">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          Partially Paid
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Amount */}
                {paymentStatus !== "UNPAID" && (
                  <div className="space-y-1">
                    <Label htmlFor="payment-amount" className="text-sm font-medium">
                      Payment Amount
                    </Label>
                    <Input
                      id="payment-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number.parseFloat(e.target.value) || 0)}
                      className="h-9"
                    />
                  </div>
                )}

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
                    <span className="font-medium">PKR {currentSale.subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-green-600 dark:text-green-400">PKR {currentSale.total.toFixed(2)}</span>
                  </div>

                  {paymentStatus === "PARTIAL" && (
                    <>
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span>Paid:</span>
                        <span>PKR {paymentAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                        <span>Balance:</span>
                        <span>PKR {(currentSale.total - paymentAmount).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full h-10 bg-green-600 hover:bg-green-700 text-white shadow-md"
                  onClick={handleCompleteSale}
                  disabled={isSaving || currentSale.items.length === 0}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Complete Sale
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Product Card Component - More Compact Version
function ProductCard({
  product,
  onAddToCart,
  isInCart,
  isAdded,
}: {
  product: Product
  onAddToCart: (product: Product, quantity: number) => void
  isInCart: boolean
  isAdded: boolean
}) {
  const [quantity, setQuantity] = useState(1)

  const getStockBadgeVariant = (stock: number) => {
    if (stock === 0) return "destructive"
    if (stock <= 5) return "secondary"
    return "default"
  }

  return (
    <div
      className={`border rounded-md p-2 transition-all duration-200 ${
        isAdded
          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
          : isInCart
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h3 className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">{product.name}</h3>
            <Badge variant={getStockBadgeVariant(product.quantityInStock)} className="text-[10px] h-4">
              {product.quantityInStock}
            </Badge>
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate">{product.sku}</span>
            {product.brandName && (
              <>
                <span>•</span>
                <span className="truncate">{product.brandName}</span>
              </>
            )}
            {product.shelfCodeName && (
              <>
                <span>•</span>
                <span className="truncate">Shelf: {product.shelfCodeName}</span>
              </>
            )}
          </div>

          {product.compatibleModels && product.compatibleModels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {product.compatibleModels.slice(0, 2).map((model, index) => (
                <Badge key={index} variant="secondary" className="text-[10px] h-4 px-1">
                  {model}
                </Badge>
              ))}
              {product.compatibleModels.length > 2 && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1">
                  +{product.compatibleModels.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="text-right whitespace-nowrap">
          <p className="font-bold text-sm text-slate-900 dark:text-slate-100">PKR {product.sellingPrice.toFixed(2)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Input
            type="number"
            min="1"
            max={product.quantityInStock}
            value={quantity}
            onChange={(e) =>
              setQuantity(Math.max(1, Math.min(product.quantityInStock, Number.parseInt(e.target.value) || 1)))
            }
            className="w-10 text-center h-6 px-1 text-xs"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => setQuantity(Math.min(product.quantityInStock, quantity + 1))}
            disabled={quantity >= product.quantityInStock}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <Button
          size="sm"
          onClick={() => onAddToCart(product, quantity)}
          disabled={product.quantityInStock === 0 || isInCart}
          className={`h-7 text-xs ${
            isAdded
              ? "bg-green-600 hover:bg-green-700"
              : isInCart
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200"
          } text-white dark:text-slate-900`}
        >
          {isAdded ? (
            <>
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Added
            </>
          ) : isInCart ? (
            "In Cart"
          ) : (
            <>
              <Plus className="mr-1 h-3 w-3" />
              Add
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// Cart Item Component - More Compact Version
function CartItem({
  item,
  onQuantityChange,
  onRemove,
}: {
  item: any
  onQuantityChange: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
}) {
  return (
    <div className="border rounded-md p-2 bg-slate-50 dark:bg-slate-800/50">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">{item.productName}</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
            {item.brandName || "No Brand"} • {item.shelfCode} • PKR {item.unitPrice.toFixed(2)} each
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(item.productId)}
          className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => onQuantityChange(item.productId, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => onQuantityChange(item.productId, item.quantity + 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <div className="text-right">
          <p className="font-bold text-sm text-slate-900 dark:text-slate-100">PKR {item.total.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}
