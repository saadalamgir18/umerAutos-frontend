"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/lib/redux/store"
import { addProduct } from "@/lib/redux/slices/productSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
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

interface Supplier {
  id: string
  companyName: string
}

interface ShelfCode {
  id: string
  name: string
}

// Form data type
interface ProductFormData {
  name: string
  brandId: string
  modelId: string[]
  sku: string
  description: string
  quantityInStock: number
  purchasePrice: number
  sellingPrice: number
  shelfCodeId: string
}

export default function AddProductPage() {
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

  // Initialize react-hook-form
  const form = useForm<ProductFormData>({
    defaultValues: {
      name: "",
      brandId: "",
      modelId: [],
      sku: "",
      description: "",
      quantityInStock: 0,
      purchasePrice: 0,
      sellingPrice: 0,
      shelfCodeId: "",
    },
  })

  // Fetch related entities
  useEffect(() => {
    const fetchRelatedData = async () => {
      setIsLoading(true)
      setApiErrors(null)

      try {
        // Fetch brands
        const brandsResponse = await fetch("http://localhost:8083/api/v1/brands", { credentials: "include"})
        if (!brandsResponse.ok) throw new Error("Failed to fetch brands")
        const brandsData = await brandsResponse.json()
        setBrands(brandsData.data)

        // Fetch compatible models
        const modelsResponse = await fetch("http://localhost:8083/api/v1/compatible-models", { credentials: "include"})
        if (!modelsResponse.ok) throw new Error("Failed to fetch compatible models")
        const modelsData = await modelsResponse.json()
        setCompatibleModels(modelsData.data)

        // Fetch shelf codes
        const shelfCodesResponse = await fetch("http://localhost:8083/api/v1/shelf", { credentials: "include"})
        if (!shelfCodesResponse.ok) throw new Error("Failed to fetch shelf codes")
        const shelfCodesData = await shelfCodesResponse.json()
        setShelfCodes(shelfCodesData.data)
      } catch (error) {
        console.error("Error fetching related data:", error)
        toastUtils.update(
          "error in product",
          "error",
          "Failed to load some required data. Some options may not be available.",
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchRelatedData()
  }, [])

  const onSubmit = async (data: ProductFormData) => {
    setApiErrors(null)
    const loadingToastId = toastUtils.loading("Creating product...")

    try {
      setIsSubmitting(true)

      // Format the data according to the Spring Boot entity structure
      const productData = {
        name: data.name,
        brandId: data.brandId,
        compatibleModelIds: data.modelId,
        sku: data.sku,
        description: data.description,
        quantityInStock: data.quantityInStock,
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        shelfCodeId: data.shelfCodeId ? data.shelfCodeId : null,
      }

      const response = await fetch("http://localhost:8083/api/v1/products", {
        method: "POST",
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

          throw new Error(responseData.message || "Failed to add product")
        }
        throw new Error(responseData.message || `API error: ${response.status}`)
      }

      // Add to Redux store
      dispatch(addProduct(responseData))
      toastUtils.update(loadingToastId, "success", "Product added successfully")
      router.push("/products")
    } catch (error) {
      console.error("Failed to add product:", error)
      toastUtils.update(loadingToastId, "error", error instanceof Error ? error.message : "Failed to add product")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading product form...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Add New Product</h1>
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
              <CardDescription>Enter the details of the new product</CardDescription>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a brand" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {brands.map((brand) => (
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                name="modelId"
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
                      <FormLabel>Purchase Price ($) *</FormLabel>
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
                      <FormLabel>Selling Price ($) *</FormLabel>
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
                  "Save Product"
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  )
}
