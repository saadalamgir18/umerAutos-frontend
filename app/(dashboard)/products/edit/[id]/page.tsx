"use client"

import { useState, useEffect, use } from "react"
import { useDispatch } from "react-redux"
import type { AppDispatch } from "@/lib/redux/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { toastUtils } from "@/lib/utils/toast-utils"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"

// Types for related entities
interface Brand {
  id: string
  name: string
}

interface CompatibleModel {
  id: string
  name: string
}

interface ShelfCode {
  id: string
  name: string
}

// Form data type
interface ProductFormData {
  name: string
  brandId: string
  compatibleModelsIds: string[]
  sku: string
  description: string
  quantityInStock: number
  purchasePrice: number
  sellingPrice: number
  shelfCodeId: string
}

type Props = {
  params: Promise<{ id: string }>
}

export default function EditProductPage({ params }: Props) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()

  // State for related entities
  const [brands, setBrands] = useState<Brand[]>([])
  const [compatibleModels, setCompatibleModels] = useState<CompatibleModel[]>([])
  const [shelfCodes, setShelfCodes] = useState<ShelfCode[]>([])

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiErrors, setApiErrors] = useState<Record<string, string> | null>(null)

  const { id } = use(params)

  // Initialize react-hook-form
  const form = useForm<ProductFormData>({
    defaultValues: {
      name: "",
      brandId: "",
      compatibleModelsIds: [],
      sku: "",
      description: "",
      quantityInStock: 0,
      purchasePrice: 0,
      sellingPrice: 0,
      shelfCodeId: "",
    },
  })

  // Fetch product and related entities
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setApiErrors(null)

      try {
        // Fetch product
        const productResponse = await fetch(`http://localhost:8083/api/v1/products/${id}`, { credentials: "include"})
        if (!productResponse.ok) throw new Error("Failed to fetch product")
        const productData = await productResponse.json()

        // Fetch brands
        const brandsResponse = await fetch("http://localhost:8083/api/v1/brands", { credentials: "include"})
        if (!brandsResponse.ok) throw new Error("Failed to fetch brands")
        const brandsData = await brandsResponse.json()
        setBrands(brandsData)

        // Fetch compatible models
        const modelsResponse = await fetch("http://localhost:8083/api/v1/compatible-models", { credentials: "include"})
        if (!modelsResponse.ok) throw new Error("Failed to fetch compatible models")
        const modelsData = await modelsResponse.json()
        setCompatibleModels(modelsData)

        // Fetch shelf codes
        const shelfCodesResponse = await fetch("http://localhost:8083/api/v1/shelf", { credentials: "include"})
        if (!shelfCodesResponse.ok) throw new Error("Failed to fetch shelf codes")
        const shelfCodesData = await shelfCodesResponse.json()
        setShelfCodes(shelfCodesData)

        // Extract model IDs from the product's compatible models
        let compatibleModelsIds: string[] = []
        const product = productData
        if (product.compatibleModels && Array.isArray(product.compatibleModelsIds)) {
          compatibleModelsIds = product.compatibleModelsIds.map((model: any) => model.id || model)
        }

        // Set form data from product
        form.reset({
          name: product.name || "",
          brandId: product.brandId || "",
          compatibleModelsIds: compatibleModelsIds,
          sku: product.sku || "",
          description: product.description || "",
          quantityInStock: product.quantityInStock || 0,
          purchasePrice: product.purchasePrice || 0,
          sellingPrice: product.sellingPrice || 0,
          shelfCodeId: product.shelfCodeId || "",
        })
      } catch (error) {
        console.error("Error fetching data:", error)
        setApiErrors({ general: "Failed to load product data. Please try again." })
        toastUtils.update("error", "error", "Failed to load product data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, form])

  const onSubmit = async (data: ProductFormData) => {
    setApiErrors(null)

    try {
      setIsSubmitting(true)

      // Format the data according to the Spring Boot entity structure
      const productData = {
        id: id,
        name: data.name,
        brandId: data.brandId,
        compatibleModelIds: data.compatibleModelsIds,
        sku: data.sku,
        description: data.description,
        quantityInStock: data.quantityInStock,
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        shelfCodeId: data.shelfCodeId ? data.shelfCodeId : null,
      }

      const response = await fetch(`http://localhost:8083/api/v1/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
        credentials: "include"
      })

      const responseData = await response.json()

      if (!response.ok) {
        // Handle validation errors from API
        if (response.status === 400 && responseData.data) {
          setApiErrors(responseData.data)

          // Set form errors from API response
          Object.entries(responseData.data).forEach(([field, message]) => {
            form.setError(field as any, {
              type: "server",
              message: message as string,
            })
          })

          throw new Error(responseData.message || "Failed to update product")
        }
        throw new Error(responseData.message || `API error: ${response.status}`)
      }

      toastUtils.update("", "success", "Product updated successfully")
      router.push("/products")
    } catch (error) {
      console.error("Failed to update product:", error)
      toastUtils.error("error", error instanceof Error ? error.message : "Failed to update product")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading product data...</p>
        </div>
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
          <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
        </div>
      </div>

      {apiErrors && Object.keys(apiErrors).length > 0 && !form.formState.isDirty && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Error</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 space-y-1">
              {Object.entries(apiErrors).map(([field, message]) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>Update the details of the product</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  rules={{
                    required: "Product name is required",
                    minLength: {
                      value: 3,
                      message: "Product name must be at least 3 characters",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Brake Pad Set" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brandId"
                  rules={{ required: "Brand is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a brand" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {brands?.map((brand) => (
                            <SelectItem key={brand.id} value={brand.id}>
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="sku"
                  rules={{
                    required: "SKU is required",
                    pattern: {
                      value: /^[A-Za-z0-9-]+$/,
                      message: "SKU must contain only letters, numbers, and hyphens",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU/Part Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., BP-1001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shelfCodeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shelf Code</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a shelf code" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {shelfCodes.map((shelfCode) => (
                            <SelectItem key={shelfCode.id} value={shelfCode.id}>
                              {shelfCode.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="compatibleModelsIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compatible Motorcycle Models</FormLabel>
                    <div className="border rounded p-2 max-h-40 overflow-y-auto space-y-1">
                      {compatibleModels.map((model) => (
                        <div key={model.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`model-${model.id}`}
                            checked={field.value.includes(model.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...field.value, model.id])
                              } else {
                                field.onChange(field.value.filter((id) => id !== model.id))
                              }
                            }}
                          />
                          <label htmlFor={`model-${model.id}`} className="text-sm">
                            {model.name}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter product description" rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="quantityInStock"
                  rules={{
                    min: {
                      value: 0,
                      message: "Quantity cannot be negative",
                    },
                    validate: (value) => {
                      if (value !== undefined && !Number.isInteger(Number(value))) {
                        return "Quantity must be a whole number"
                      }
                      return true
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity in Stock</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchasePrice"
                  rules={{
                    required: "Purchase price is required",
                    min: {
                      value: 0.01,
                      message: "Purchase price must be greater than 0",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Price (PKR) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sellingPrice"
                  rules={{
                    required: "Selling price is required",
                    min: {
                      value: 0.01,
                      message: "Selling price must be greater than 0",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling Price (PKR) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push("/products")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                    Saving...
                  </>
                ) : (
                  "Update Product"
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  )
}
