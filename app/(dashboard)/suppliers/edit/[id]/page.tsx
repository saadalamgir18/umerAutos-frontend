"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/lib/redux/store"
import { updateSupplier } from "@/lib/redux/slices/supplierSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { API_URL } from "@/lib/api";

interface SupplierFormData {
  name: string
  companyName: string
  phone: string
  email: string
  address: string
}

export default function EditSupplierPage({ params }: { params: { id: string } }) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const { suppliers } = useSelector((state: RootState) => state.suppliers)
  const [supplier, setSupplier] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiErrors, setApiErrors] = useState<Record<string, string> | null>(null)

  // Initialize react-hook-form
  const form = useForm<SupplierFormData>({
    defaultValues: {
      name: "",
      companyName: "",
      phone: "",
      email: "",
      address: "",
    },
  })

  useEffect(() => {
    setMounted(true)
    const foundSupplier = suppliers.find((s) => s.id === params.id)
    setSupplier(foundSupplier)

    if (foundSupplier) {
      form.reset({
        name: foundSupplier.name,
        companyName: foundSupplier.companyName,
        phone: foundSupplier.phone,
        email: foundSupplier.email,
        address: foundSupplier.address,
      })
    }
  }, [suppliers, params.id, form])

  if (!mounted) return null
  if (!supplier) return <div>Supplier not found</div>

  const onSubmit = async (data: SupplierFormData) => {
    setApiErrors(null)
    setIsSubmitting(true)

    try {
      // Update supplier
      const updatedSupplier = {
        ...supplier,
        name: data.name,
        companyName: data.companyName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        updatedAt: new Date().toISOString(),
      }

      // In a real application, you would make an API call here
      // const response = await fetch(`${API_URL}/api/v1/suppliers/${params.id}`, {
      //   method: "PUT",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify(data),
      // })
      //
      // const responseData = await response.json()
      //
      // if (!response.ok) {
      //   if (response.status === 400 && responseData.data) {
      //     setApiErrors(responseData.data)
      //
      //     // Set form errors from API response
      //     Object.entries(responseData.data).forEach(([field, message]) => {
      //       form.setError(field as any, {
      //         type: "server",
      //         message: message as string,
      //       })
      //     })
      //
      //     throw new Error(responseData.message || "Failed to update supplier")
      //   }
      //   throw new Error(responseData.message || `API error: ${response.status}`)
      // }

      dispatch(updateSupplier(updatedSupplier))
      router.push("/suppliers")
    } catch (error) {
      console.error("Error updating supplier:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Edit Supplier</h1>
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
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Supplier Information</CardTitle>
              <CardDescription>Update the supplier details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  rules={{
                    required: "Contact person name is required",
                    minLength: {
                      value: 3,
                      message: "Name must be at least 3 characters",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyName"
                  rules={{
                    required: "Company name is required",
                    minLength: {
                      value: 2,
                      message: "Company name must be at least 2 characters",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., MotoTech Parts" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phone"
                  rules={{
                    required: "Phone number is required",
                    pattern: {
                      value: /^[0-9+\-\s()]+$/,
                      message: "Please enter a valid phone number",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 555-123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  rules={{
                    required: "Email address is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Please enter a valid email address",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter supplier address" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push("/suppliers")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                    Saving...
                  </>
                ) : (
                  "Save Supplier"
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  )
}
