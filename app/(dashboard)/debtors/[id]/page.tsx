"use client"

import React, { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  User,
  Calendar,
  Receipt,
  CreditCard,
  Plus,
  ShoppingCart,
  Search,
  Loader2,
  Package,
  Minus,
  Check,
  X,
} from "lucide-react"
import { format } from "date-fns"
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

interface SaleData {
  id: string
  customerName: string
  totalAmountSummary: number
  quantitySoldSummary: number
  saleItems: SaleItem[]
  paymentStatus: "PAID" | "UNPAID"
  createdAt: string
}

interface Product {
  id: string
  name: string
  sku: string
  description: string
  quantityInStock: number
  purchasePrice: number
  sellingPrice: number
  brandName: string
  modelName: string | null
  categoryName: string | null
  supplierName: string | null
  shelfCodeName: string
  compatibleModels: string[]
}

interface ProductSearchResponse {
  data: Product[]
  pagination: {
    totalItems: number
    totalPages: number
    currentPage: number
    itemsPerPage: number
  }
}

interface CartItem {
  productId: string
  product: Product
  quantity: number
  discount: number
  tax: number
  unitPrice: number
  discountAmount: number
  taxAmount: number
  totalPrice: number
}
type Props = {
  params: Promise<{ id: string }>; // 👈 `params` is a Promise now
};

export default function KhataSaleDetailPage({ params }: Props) {
  const {id}  = use(params)
  const router = useRouter()
  const { toast } = useToast()

  const [saleData, setSaleData] = useState<SaleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [payingAll, setPayingAll] = useState(false)
  const [payingItems, setPayingItems] = useState<Set<string>>(new Set())

  // Simplified product search and cart state
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [addingProducts, setAddingProducts] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

  // Quick add states for each product
  const [quickAddQuantities, setQuickAddQuantities] = useState<Record<string, number>>({})
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set())

  // Search products with debouncing
  const searchProducts = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setSearchResults([])
        return
      }

      setSearchLoading(true)
      try {
        const response = await fetch(
          `http://localhost:8083/api/v1/products?name=${encodeURIComponent(searchQuery)}&limit=20&page=0`,
          {
            credentials: "include",
          },
        )

        if (response.ok) {
          const data: ProductSearchResponse = await response.json()
          const availableProducts = data.data.filter((product) => product.quantityInStock > 0)
          setSearchResults(availableProducts)

          // Initialize quick add quantities
          const quantities: Record<string, number> = {}
          availableProducts.forEach((product) => {
            quantities[product.id] = 1
          })
          setQuickAddQuantities(quantities)
        } else {
          throw new Error("Failed to search products")
        }
      } catch (error) {
        console.error("Error searching products:", error)
        toast({
          title: "Search Error",
          description: "Failed to search products. Please try again.",
          variant: "destructive",
        })
      } finally {
        setSearchLoading(false)
      }
    },
    [toast],
  )

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts(searchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, searchProducts])

  // Fetch sale data from API
  useEffect(() => {
    const fetchSaleData = async () => {
      try {
        const response = await fetch(`http://localhost:8083/api/v1/sales-summary/${id}`, {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          setSaleData(data)
        } else {
          throw new Error("Failed to fetch sale data")
        }
      } catch (error) {
        console.error("Error fetching sale data:", error)
        toast({
          title: "Error",
          description: "Failed to load sale data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSaleData()
  }, [id, toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sale details...</p>
        </div>
      </div>
    )
  }

  if (!saleData) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Sale Not Found</h2>
          <p className="text-muted-foreground mb-4">The sale you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/debtors")}>Back to Debtors</Button>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM dd, yyyy 'at' hh:mm a")
    } catch (error) {
      return "Invalid Date"
    }
  }

  const handlePayAll = async () => {
    setPayingAll(true)
    try {
      const response = await fetch(`http://localhost:8083/api/v1/sales-summary/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          paymentStatus: "PAID",
        }),
      })

      if (response.ok) {
        toast({
          title: "Payment Successful",
          description: `All items for ${saleData.customerName} have been marked as paid.`,
        })
        // Refresh sale data
        const updatedResponse = await fetch(`http://localhost:8083/api/v1/sales-summary/${id}`, {
          credentials: "include",
        })
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json()
          setSaleData(updatedData)
        }
      } else {
        throw new Error("Payment failed")
      }
    } catch (error) {
      console.error("Error processing payment:", error)
      toast({
        title: "Payment Failed",
        description: "There was an error processing the payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setPayingAll(false)
    }
  }

  const handlePaySingleItem = async (productId: string) => {
    setPayingItems((prev) => new Set(prev).add(productId))
    try {
      const response = await fetch(`http://localhost:8083/api/v1/sale-items/${productId}/payment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          productId: productId,
        }),
      })

      if (response.ok) {
        const product = searchResults.find((p) => p.id === productId)
        toast({
          title: "Payment Successful",
          description: `Payment for ${product?.name || "item"} has been processed.`,
        })
        // Refresh sale data
        const updatedResponse = await fetch(`http://localhost:8083/api/v1/sales-summary/${id}`, {
          credentials: "include",
        })
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json()
          setSaleData(updatedData)
        }
      } else {
        throw new Error("Payment failed")
      }
    } catch (error) {
      console.error("Error processing single item payment:", error)
      toast({
        title: "Payment Failed",
        description: "There was an error processing the payment. Please try again.",
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

  // Quick add product directly to cart
  const quickAddToCart = async (product: Product) => {
    const quantity = quickAddQuantities[product.id] || 1

    // Check if already in cart
    if (cart.find((item) => item.productId === product.id)) {
      toast({
        title: "Already Added",
        description: "This product is already in your cart.",
        variant: "destructive",
      })
      return
    }

    // Check stock
    if (quantity > product.quantityInStock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.quantityInStock} items available.`,
        variant: "destructive",
      })
      return
    }

    setAddingToCart((prev) => new Set(prev).add(product.id))

    // Add to cart with animation delay
    setTimeout(() => {
      const cartItem: CartItem = {
        productId: product.id,
        product: product,
        quantity: quantity,
        discount: 0,
        tax: 0,
        unitPrice: product.sellingPrice,
        discountAmount: 0,
        taxAmount: 0,
        totalPrice: product.sellingPrice * quantity,
      }

      setCart((prev) => [...prev, cartItem])
      setAddingToCart((prev) => {
        const newSet = new Set(prev)
        newSet.delete(product.id)
        return newSet
      })

      toast({
        title: "Added to Cart",
        description: `${product.name} (${quantity}x) added successfully.`,
      })
    }, 500)
  }

  // Update quick add quantity
  const updateQuickQuantity = (productId: string, quantity: number) => {
    setQuickAddQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, quantity),
    }))
  }

  // Update cart item
  const updateCartItem = (productId: string, field: keyof CartItem, value: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const updatedItem = { ...item, [field]: value }

          // Recalculate totals
          const subtotal = updatedItem.unitPrice * updatedItem.quantity
          const discountAmount = (subtotal * updatedItem.discount) / 100
          const taxableAmount = subtotal - discountAmount
          const taxAmount = (taxableAmount * updatedItem.tax) / 100
          const totalPrice = taxableAmount + taxAmount

          return {
            ...updatedItem,
            discountAmount,
            taxAmount,
            totalPrice,
          }
        }
        return item
      }),
    )
  }

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId))
    toast({
      title: "Removed",
      description: "Product removed from cart.",
    })
  }

  // Submit new products
  const submitNewProducts = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add some products to cart before submitting.",
        variant: "destructive",
      })
      return
    }

    setAddingProducts(true)
    try {
      const productsToAdd = cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        discount: item.discount,
        tax: item.tax,
      }))

      const response = await fetch(`http://localhost:8083/api/v1/sales-summary/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          products: productsToAdd,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success!",
          description: `${cart.length} product(s) added to ${saleData.customerName}'s Debtors.`,
        })

        // Clear everything and refresh
        setCart([])
        setSearchResults([])
        setSearchTerm("")
        setQuickAddQuantities({})

        const updatedResponse = await fetch(`http://localhost:8083/api/v1/sales-summary/${id}`, {
          credentials: "include",
        })
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json()
          setSaleData(updatedData)
        }
      } else {
        throw new Error("Failed to add products")
      }
    } catch (error) {
      console.error("Error adding products:", error)
      toast({
        title: "Error",
        description: "Failed to add products. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAddingProducts(false)
    }
  }

  // Calculate cart totals
  const cartSubtotal = cart.reduce((total, item) => total + item.unitPrice * item.quantity, 0)
  const cartDiscount = cart.reduce((total, item) => total + item.discountAmount, 0)
  const cartTax = cart.reduce((total, item) => total + item.taxAmount, 0)
  const cartTotal = cartSubtotal - cartDiscount + cartTax

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <GoBackButton />
        <h1 className="text-3xl font-bold tracking-tight">Sale Details</h1>
      </div>

      <div className="grid gap-6">
        {/* Sale Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Sale Information
            </CardTitle>
            <CardDescription>Details of the credit sale</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Customer Name</p>
                  <p className="font-medium">{saleData.customerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Quantity</p>
                  <p className="font-medium">{saleData.quantitySoldSummary} items</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Sale Date</p>
                  <p className="font-medium">{formatDate(saleData.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <Badge variant={saleData.paymentStatus === "PAID" ? "default" : "outline"}>
                    {saleData.paymentStatus}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sale Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Sale Items</CardTitle>
              <CardDescription>Items purchased in this transaction</CardDescription>
            </div>
            {saleData.paymentStatus === "UNPAID" && (
              <Button onClick={handlePayAll} disabled={payingAll} className="gap-2">
                <CreditCard className="h-4 w-4" />
                {payingAll ? "Processing..." : `Pay All (Rs. ${saleData.totalAmountSummary.toLocaleString()})`}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-right">Total Price</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saleData.saleItems.map((item, index) => {
                    const isPayingThisItem = payingItems.has(item.productId)

                    return (
                      <TableRow key={`${item.productId}-${index}`}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell className="text-center">{item.quantitySold}</TableCell>
                        <TableCell className="text-right">Rs. {item.totalPrice.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{format(new Date(item.createdAt), "MMM dd, yyyy")}</TableCell>
                        <TableCell className="text-right">
                          {saleData.paymentStatus === "UNPAID" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePaySingleItem(item.productId)}
                              disabled={isPayingThisItem}
                            >
                              {isPayingThisItem ? "Processing..." : "Pay"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex justify-end">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">Rs. {saleData.totalAmountSummary.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Add Products Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Products to {saleData.customerName}'s Debtors
            </CardTitle>
            <CardDescription>Search and quickly add products to this sale</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search Bar */}
            <div className="space-y-2">
              <Label htmlFor="product-search">Search Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="product-search"
                  placeholder="Type product name, SKU, or brand to search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-lg h-12"
                />
                {searchLoading && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                )}
              </div>
            </div>

            {/* Search Results - Simplified Cards */}
            {searchTerm && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {searchLoading
                      ? "Searching..."
                      : searchResults.length > 0
                        ? `Found ${searchResults.length} product(s)`
                        : "No products found"}
                  </p>
                </div>

                {searchResults.length > 0 && (
                  <div className="grid gap-3">
                    {searchResults.map((product) => {
                      const isInCart = cart.some((item) => item.productId === product.id)
                      const isAdding = addingToCart.has(product.id)
                      const quantity = quickAddQuantities[product.id] || 1

                      return (
                        <div
                          key={product.id}
                          className={`border rounded-lg p-4 transition-all ${
                            isInCart ? "bg-green-50 border-green-200" : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-3">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg">{product.name}</h3>
                                  <div className="flex items-center gap-4 mt-1">
                                    <span className="text-sm text-muted-foreground">
                                      {product.sku} • {product.brandName}
                                    </span>
                                    <Badge variant={product.quantityInStock <= 5 ? "destructive" : "secondary"}>
                                      Stock: {product.quantityInStock}
                                    </Badge>
                                    <span className="font-semibold text-lg">
                                      Rs. {product.sellingPrice.toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {product.shelfCodeName} • {product.categoryName}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 ml-4">
                              {!isInCart && (
                                <>
                                  {/* Quick Quantity Selector */}
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => updateQuickQuantity(product.id, quantity - 1)}
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
                                        updateQuickQuantity(product.id, Number.parseInt(e.target.value) || 1)
                                      }
                                      className="w-16 text-center"
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => updateQuickQuantity(product.id, quantity + 1)}
                                      disabled={quantity >= product.quantityInStock}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>

                                  {/* Add Button */}
                                  <Button
                                    onClick={() => quickAddToCart(product)}
                                    disabled={isAdding}
                                    className="gap-2 min-w-[100px]"
                                  >
                                    {isAdding ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Plus className="h-4 w-4" />
                                    )}
                                    {isAdding ? "Adding..." : "Add"}
                                  </Button>
                                </>
                              )}

                              {isInCart && (
                                <div className="flex items-center gap-2 text-green-600">
                                  <Check className="h-4 w-4" />
                                  <span className="font-medium">Added to Cart</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Shopping Cart - Simplified */}
            {cart.length > 0 && (
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Cart ({cart.length} items)
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}>
                    {showAdvancedOptions ? "Hide" : "Show"} Advanced Options
                  </Button>
                </div>

                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.productId} className="border rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.product.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.product.sku} • Rs. {item.unitPrice.toLocaleString()} each
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Quantity Control */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartItem(item.productId, "quantity", Math.max(1, item.quantity - 1))}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              max={item.product.quantityInStock}
                              value={item.quantity}
                              onChange={(e) =>
                                updateCartItem(item.productId, "quantity", Number.parseInt(e.target.value) || 1)
                              }
                              className="w-16 text-center"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartItem(item.productId, "quantity", item.quantity + 1)}
                              disabled={item.quantity >= item.product.quantityInStock}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Advanced Options */}
                          {showAdvancedOptions && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={item.discount}
                                onChange={(e) =>
                                  updateCartItem(item.productId, "discount", Number.parseFloat(e.target.value) || 0)
                                }
                                placeholder="Discount %"
                                className="w-24"
                              />
                              <Input
                                type="number"
                                min="0"
                                value={item.tax}
                                onChange={(e) =>
                                  updateCartItem(item.productId, "tax", Number.parseFloat(e.target.value) || 0)
                                }
                                placeholder="Tax %"
                                className="w-20"
                              />
                            </div>
                          )}

                          {/* Total and Remove */}
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-lg">Rs. {item.totalPrice.toLocaleString()}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeFromCart(item.productId)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cart Summary and Submit */}
                <div className="bg-primary/5 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <p className="text-sm text-muted-foreground">Items</p>
                        <p className="text-lg font-semibold">{cart.length} products</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-2xl font-bold">Rs. {cartTotal.toLocaleString()}</p>
                      </div>
                    </div>

                    <Button onClick={submitNewProducts} disabled={addingProducts} size="lg" className="gap-2">
                      <Package className="h-5 w-5" />
                      {addingProducts ? "Adding to Debtors..." : "Add to Debtors"}
                    </Button>
                  </div>

                  {(cartDiscount > 0 || cartTax > 0) && (
                    <div className="text-sm text-muted-foreground border-t pt-2">
                      <div className="flex justify-between">
                        <span>Subtotal: Rs. {cartSubtotal.toLocaleString()}</span>
                        {cartDiscount > 0 && <span>Discount: -Rs. {cartDiscount.toLocaleString()}</span>}
                        {cartTax > 0 && <span>Tax: +Rs. {cartTax.toLocaleString()}</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
