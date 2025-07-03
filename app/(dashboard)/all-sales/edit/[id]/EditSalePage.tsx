'use client'

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Save, Loader2, AlertCircle } from "lucide-react"
import { toast } from "react-toastify"
import { FormProvider, useForm, useWatch } from "react-hook-form"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Define interfaces for the sale data based on the actual API response
interface Product {
    id: string
    productName: string
    sku: string
}

interface Sale {
    id: string
    product: Product
    quantitySold: number
    totalPrice: number
}

interface SaleFormData {
    quantity: number
    unitPrice: number
    totalPrice: number
}

type Props = {
    id: string
}

export default function EditSalePage({ id }: Props) {
    const router = useRouter()

    // State for the sale data
    const [sale, setSale] = useState<Sale | null>(null)
    const [productName, setProductName] = useState("")
    const [sku, setSku] = useState("")
    const [payment_status, setPayment_status] = useState("")

    // Loading and error states
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [apiErrors, setApiErrors] = useState<Record<string, string> | null>(null)




    // Initialize react-hook-form
    const form = useForm<SaleFormData>({
        defaultValues: {
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0,
        },
    })

    // Fetch the sale data when the component mounts
    useEffect(() => {
        const fetchSale = async () => {
            setIsLoading(true)
            setApiErrors(null)

            try {
                const response = await fetch(`http://localhost:8083/api/v1/sales/${id}`, { credentials: "include"})

                if (!response.ok) {
                    throw new Error(`Failed to fetch sale: ${response.status}`)
                }

                const data = await response.json()



                if (data) {
                    const saleData = data
                    setSale(saleData)

                    // Set product info
                    setProductName(saleData.product.productName || "")
                    setSku(saleData.product.sku || "")

                    setPayment_status(saleData.paymentStatus)

                    // Calculate unit price from total price and quantity
                    const calculatedUnitPrice = saleData.quantitySold > 0 ? saleData.totalPrice / saleData.quantitySold : 0

                    // Set form values
                    form.reset({
                        quantity: saleData.quantitySold || 1,
                        unitPrice: calculatedUnitPrice,
                        totalPrice: saleData.totalPrice || 0,
                    })

                    toast.info("Sale data loaded successfully", {
                        position: "top-right",
                        autoClose: 2000,
                    })
                } else {
                    throw new Error("Invalid sale data received")
                }
            } catch (err) {
                console.error("Error fetching sale:", err)
                setApiErrors({ general: err instanceof Error ? err.message : "Failed to load sale data" })
                toast.error("Failed to load sale data", {
                    position: "top-right",
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchSale()
    }, [id])

    const quantity = useWatch({ control: form.control, name: "quantity" });
    const unitPrice = useWatch({ control: form.control, name: "unitPrice" });
    const totalPrice = useWatch({ control: form.control, name: "totalPrice" });

    useEffect(() => {
        if (quantity != null && unitPrice != null) {
            form.setValue("totalPrice", quantity * unitPrice, { shouldValidate: true });
        }
    }, [quantity, unitPrice]);

    // Optionally recalculate unitPrice when totalPrice is edited directly
    useEffect(() => {
        if (totalPrice != null && quantity > 0) {
            form.setValue("unitPrice", totalPrice / quantity, { shouldValidate: true });
        }
    }, [totalPrice]);


    const onSubmit = async (data: SaleFormData) => {
        setApiErrors(null)
        setIsSaving(true)

        try {
            // Prepare the update data based on the API structure
            const updateData = {
                id,
                product: {
                    id: sale?.product.id,
                    productName,
                    sku,
                },
                quantitySold: data.quantity,
                totalPrice: data.totalPrice,
            }

            // Send the update request
            const response = await fetch(`http://localhost:8083/api/v1/sales/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(updateData),
            })

            const responseData = await response.json()

            if (!response.ok) {
                // Handle validation errors from API
                if (response.status === 400 && responseData.data) {
                    setApiErrors(responseData.data)

                    // Set form errors from API response
                    Object.entries(responseData.data).forEach(([field, message]) => {
                        // Map API field names to form field names if needed
                        const formField = field === "quantitySold" ? "quantity" : field
                        form.setError(formField as any, {
                            type: "server",
                            message: message as string,
                        })
                    })

                    throw new Error(responseData.message || "Failed to update sale")
                }
                throw new Error(responseData.message || `API error: ${response.status}`)
            }

            // Show success message
            toast.success("Sale updated successfully", {
                position: "top-right",
                autoClose: 2000,
            })

            // Redirect back to the sales list
            router.push("/all-sales")
        } catch (err) {
            console.error("Error updating sale:", err)
            toast.error(err instanceof Error ? err.message : "Failed to update sale", {
                position: "top-right",
            })
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading sale data...</p>
            </div>
        )
    }

    if (apiErrors?.general) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
                <p className="text-red-500 mb-2">{apiErrors.general}</p>
                <Button variant="outline" onClick={() => router.back()}>
                    Go Back
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Sale</h1>
                </div>
                <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
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

            <Card>
                <CardHeader>
                    <CardTitle>Edit Sale Details</CardTitle>
                    <CardDescription>Update the sale information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Product Information */}
                    <div className="space-y-4">


                        <FormProvider {...form}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <FormLabel htmlFor="product-name">Product Name</FormLabel>
                                    <Input
                                        id="product-name"
                                        value={productName || "hello"}
                                        onChange={(e) => setProductName(e.target.value)}
                                        disabled
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FormLabel htmlFor="sku">SKU</FormLabel>
                                    <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} disabled />
                                </div>
                                <div className="space-y-2">
                                    <FormLabel htmlFor="payment_status">Status</FormLabel>
                                    <select
                                        id="payment_status"
                                        value={payment_status}
                                        onChange={(e) => setPayment_status(e.target.value)}
                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                    >
                                        <option value="PAID">PAID</option>
                                        <option value="UNPAID">UNPAID</option>
                                    </select>
                                </div>

                            </div>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        name="quantity"
                                        rules={{
                                            required: "Quantity is required",
                                            min: {
                                                value: 1,
                                                message: "Quantity must be at least 1",
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
                                                <FormLabel>Quantity</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        {...field}
                                                        onChange={(e) => field.onChange(e.target.valueAsNumber || 1)}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="unitPrice"
                                        rules={{
                                            required: "Unit price is required",
                                            min: {
                                                value: 0.01,
                                                message: "Unit price must be greater than 0",
                                            },
                                        }}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Unit Price (PKR)</FormLabel>
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
                                        name="totalPrice"
                                        rules={{
                                            required: "Total price is required",
                                            min: {
                                                value: 0.01,
                                                message: "Total price must be greater than 0",
                                            },
                                        }}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Total Price (PKR)</FormLabel>
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
                            </form>
                        </FormProvider>
                    </div>

                    {/* Sale Summary */}
                    <div className="border rounded-md p-4 bg-muted/20">
                        <h3 className="font-medium mb-2">Sale Summary</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Unit Price</TableHead>
                                    <TableHead>Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell>{productName}</TableCell>
                                    <TableCell>{sku}</TableCell>
                                    <TableCell>{form.watch("quantity")}</TableCell>
                                    <TableCell>PKR {form.watch("unitPrice").toFixed(2)}</TableCell>
                                    <TableCell className="font-medium">PKR {form.watch("totalPrice").toFixed(2)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
