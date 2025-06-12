"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Search, AlertTriangle, TrendingDown, ShoppingCart, Plus, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

interface Product {
    id: string
    name: string
    description: string
    brandName: string
    sku: string
    sellingPrice: number
    purchasePrice: number
    quantityInStock: number
    shelfCode: string
    compatibleModels: string[]
}

export default function LowStockPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const router = useRouter()

    // Fetch products from API
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true)
                setError(null)

                const response = await fetch("http://localhost:8083/api/v1/products", { credentials: "include" })

                if (!response.ok) {
                    throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`)
                }

                const data = await response.json()
                setProducts(data.data)
            } catch (err) {
                console.error("Error fetching products:", err)
                setError(err instanceof Error ? err.message : "Failed to fetch products")
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
    }, [])

    // Filter products with low stock (10 or fewer) or out of stock
    const lowStockProducts = products.filter((product) => product.quantityInStock <= 3)
    const outOfStockProducts = products.filter((product) => product.quantityInStock === 0)
    const criticalStockProducts = products.filter(
        (product) => product.quantityInStock > 0 && product.quantityInStock <= 3,
    )
    const lowStockCount = products.filter(
        (product) => product.quantityInStock > 3 && product.quantityInStock <= 3,
    ).length

    const filteredProducts = lowStockProducts.filter(
        (product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    const getStockStatus = (quantity: number) => {
        if (quantity == 0) {
            return (
                <Badge variant="destructive" className="font-medium">
                    Out of Stock
                </Badge>
            )
        } else if (quantity <= 3) {
            return (
                <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">
                    Critical
                </Badge>
            )
        } else {
            return (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                    Low Stock
                </Badge>
            )
        }
    }

    const getStockColor = (quantity: number) => {
        if (quantity === 0) return "text-red-600 font-bold"
        if (quantity <= 3) return "text-orange-600 font-semibold"
        return "text-yellow-600 font-medium"
    }

  

    // Loading state
    if (loading) {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-40" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-12" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Products Table */}
                <Card>
                    <CardHeader className="pb-3">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-80" />
                            <div className="space-y-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full" />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="space-y-6">


                <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                        <strong>Error Loading Products:</strong> {error}
                    </AlertDescription>
                </Alert>

                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Failed to Load Products</h3>
                        <p className="text-muted-foreground mb-4 text-center">
                            Unable to fetch products from the server. Please check your connection and try again.
                        </p>
                        <Button onClick={() => window.location.reload()}>
                            <Loader2 className="mr-2 h-4 w-4" />
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
        



            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">




            </div>

            {/* Products Table */}
            <Card>
                <CardHeader className="pb-3">

                </CardHeader>
                <CardContent>
                    {/* Search */}
                    <div className="flex items-center mb-6">
                        <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search low stock products by name, SKU, brand, or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-md"
                        />
                    </div>

                    {/* Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product Details</TableHead>
                                    <TableHead> Brand</TableHead>
                                    <TableHead className="text-center">Compatible Models</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                            {lowStockProducts.length === 0 ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Package className="h-12 w-12 opacity-50" />
                                                    <p className="text-lg font-medium">Great! No low stock products</p>
                                                    <p className="text-sm">All your products are well stocked</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Search className="h-8 w-8 opacity-50" />
                                                    <p>No products found matching your search</p>
                                                    <p className="text-sm">Try adjusting your search terms</p>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredProducts
                                        .sort((a, b) => a.quantityInStock - b.quantityInStock) // Sort by stock level (lowest first)
                                        .map((product) => (
                                            <TableRow key={product.id} >
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{product.name}</div>
                                                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                                        </div>
                                                        {product.shelfCode && (
                                                            <div className="text-xs text-muted-foreground mt-1">Location: {product.shelfCode}</div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-mono text-sm flex gap-1">{product.compatibleModels.map((model, index) => <Badge key={index}>{model}</Badge> )}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-mono text-sm">{product.brandName}</div>
                                                    </div>
                                                </TableCell>
                                               
                                                <TableCell className="text-center">
                                                    <span className={getStockColor(product.quantityInStock)}>{product.quantityInStock}</span>
                                                </TableCell>
                                                <TableCell className="text-center">{getStockStatus(product.quantityInStock)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div>
                                                        <div className="font-medium">Rs. {product.sellingPrice.toLocaleString()}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            Cost: Rs. {product.purchasePrice.toLocaleString()}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => router.push(`/products/edit/${product.id}`)}
                                                        >
                                                            Update Stock
                                                        </Button>
                                                        {product.quantityInStock === 0 && (
                                                            <Button
                                                                size="sm"
                                                                className="bg-red-600 hover:bg-red-700"
                                                                onClick={() => router.push(`/products/edit/${product.id}`)}
                                                            >
                                                                Restock Now
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Summary */}
                    {filteredProducts.length > 0 && (
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                Showing {filteredProducts.length} of {lowStockProducts.length} low stock products
                                {searchTerm && ` matching "${searchTerm}"`}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
