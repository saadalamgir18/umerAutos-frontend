import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"

export interface SaleItem {
  productId: string
  productName: string
  sku: string
  shelfCode: string
  quantity: number
  unitPrice: number
  discount: number
  tax: number
  total: number
  brandName: string
  compatibleModels: string[]
}

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  totalCredit: number
  transactions: {
    saleId: string
    date: string
    amount: number
    paid: number
    remaining: number
  }[]
}

export interface Sale {
  id: string
  items: SaleItem[]
  customerId?: string
  customerName?: string
  customerPhone?: string
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentStatus: "paid" | "unpaid" | "partial"
  paymentAmount: number
  createdAt: string
  updatedAt: string
}

export interface ReturnItem {
  saleId: string
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  reason: string
  returnDate: string
}

interface SalesState {
  sales: Sale[]
  returns: ReturnItem[]
  customers: Customer[]
  currentSale: {
    items: SaleItem[]
    subtotal: number
    discount: number
    tax: number
    total: number
  }
  isLoading: boolean
  error: string | null
}

const initialState: SalesState = {
  sales: [],
  returns: [],
  customers: [],
  currentSale: {
    items: [],
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
  },
  isLoading: false,
  error: null,
}

const salesSlice = createSlice({
  name: "sales",
  initialState,
  reducers: {
    fetchSalesStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    fetchSalesSuccess: (state, action: PayloadAction<Sale[]>) => {
      state.isLoading = false
      state.sales = action.payload
    },
    fetchSalesFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.error = action.payload
    },
    addItemToSale: (state, action: PayloadAction<SaleItem>) => {
      const existingItemIndex = state.currentSale.items.findIndex((item) => item.productId === action.payload.productId)

      if (existingItemIndex !== -1) {
        // Update existing item
        state.currentSale.items[existingItemIndex].quantity += action.payload.quantity
        state.currentSale.items[existingItemIndex].total =
          state.currentSale.items[existingItemIndex].quantity *
          state.currentSale.items[existingItemIndex].unitPrice *
          (1 - state.currentSale.items[existingItemIndex].discount / 100) *
          (1 + state.currentSale.items[existingItemIndex].tax / 100)
      } else {
        // Add new item
        state.currentSale.items.push(action.payload)
      }

      // Recalculate totals
      state.currentSale.subtotal = state.currentSale.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      )

      state.currentSale.discount = state.currentSale.items.reduce(
        (sum, item) => sum + (item.quantity * item.unitPrice * item.discount) / 100,
        0,
      )

      state.currentSale.tax = state.currentSale.items.reduce(
        (sum, item) => sum + (item.quantity * item.unitPrice * (1 - item.discount / 100) * item.tax) / 100,
        0,
      )

      state.currentSale.total = state.currentSale.subtotal - state.currentSale.discount + state.currentSale.tax
    },
    removeItemFromSale: (state, action: PayloadAction<string>) => {
      state.currentSale.items = state.currentSale.items.filter((item) => item.productId !== action.payload)

      // Recalculate totals
      state.currentSale.subtotal = state.currentSale.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      )

      state.currentSale.discount = state.currentSale.items.reduce(
        (sum, item) => sum + (item.quantity * item.unitPrice * item.discount) / 100,
        0,
      )

      state.currentSale.tax = state.currentSale.items.reduce(
        (sum, item) => sum + (item.quantity * item.unitPrice * (1 - item.discount / 100) * item.tax) / 100,
        0,
      )

      state.currentSale.total = state.currentSale.subtotal - state.currentSale.discount + state.currentSale.tax
    },
    updateItemQuantity: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
      const item = state.currentSale.items.find((item) => item.productId === action.payload.productId)

      if (item) {
        item.quantity = action.payload.quantity
        item.total = item.quantity * item.unitPrice * (1 - item.discount / 100) * (1 + item.tax / 100)

        // Recalculate totals
        state.currentSale.subtotal = state.currentSale.items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0,
        )

        state.currentSale.discount = state.currentSale.items.reduce(
          (sum, item) => sum + (item.quantity * item.unitPrice * item.discount) / 100,
          0,
        )

        state.currentSale.tax = state.currentSale.items.reduce(
          (sum, item) => sum + (item.quantity * item.unitPrice * (1 - item.discount / 100) * item.tax) / 100,
          0,
        )

        state.currentSale.total = state.currentSale.subtotal - state.currentSale.discount + state.currentSale.tax
      }
    },
    clearSale: (state) => {
      state.currentSale = {
        items: [],
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
      }
    },
    completeSale: (state, action: PayloadAction<Sale>) => {
      state.sales.push(action.payload)

      // Update customer credit if payment is partial or unpaid
      if (action.payload.paymentStatus === "partial" || action.payload.paymentStatus === "unpaid") {
        const remainingAmount = action.payload.total - action.payload.paymentAmount

        // Find existing customer or create new one
        const existingCustomerIndex = state.customers.findIndex(
          (c) =>
            c.id === action.payload.customerId ||
            (action.payload.customerName && c.name === action.payload.customerName),
        )

        if (existingCustomerIndex !== -1) {
          // Update existing customer
          state.customers[existingCustomerIndex].totalCredit += remainingAmount
          state.customers[existingCustomerIndex].transactions.push({
            saleId: action.payload.id,
            date: action.payload.createdAt,
            amount: action.payload.total,
            paid: action.payload.paymentAmount,
            remaining: remainingAmount,
          })
        } else if (action.payload.customerName) {
          // Create new customer
          state.customers.push({
            id: action.payload.customerId || `cust-${Date.now()}`,
            name: action.payload.customerName,
            phone: action.payload.customerPhone || "",
            totalCredit: remainingAmount,
            transactions: [
              {
                saleId: action.payload.id,
                date: action.payload.createdAt,
                amount: action.payload.total,
                paid: action.payload.paymentAmount,
                remaining: remainingAmount,
              },
            ],
          })
        }
      }

      state.currentSale = {
        items: [],
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
      }
    },
    // New reducers for returns
    addReturn: (state, action: PayloadAction<ReturnItem>) => {
      state.returns.push(action.payload)

      // Find the sale and update it if needed
      const sale = state.sales.find((sale) => sale.id === action.payload.saleId)
      if (sale) {
        // Find the item in the sale
        const saleItem = sale.items.find((item) => item.productId === action.payload.productId)
        if (saleItem) {
          // Update the quantity
          saleItem.quantity -= action.payload.quantity
          // Recalculate the total
          saleItem.total =
            saleItem.quantity * saleItem.unitPrice * (1 - saleItem.discount / 100) * (1 + saleItem.tax / 100)

          // If quantity is now 0, remove the item
          if (saleItem.quantity <= 0) {
            sale.items = sale.items.filter((item) => item.productId !== action.payload.productId)
          }

          // Recalculate sale totals
          sale.subtotal = sale.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
          sale.discount = sale.items.reduce(
            (sum, item) => sum + (item.quantity * item.unitPrice * item.discount) / 100,
            0,
          )
          sale.tax = sale.items.reduce(
            (sum, item) => sum + (item.quantity * item.unitPrice * (1 - item.discount / 100) * item.tax) / 100,
            0,
          )
          sale.total = sale.subtotal - sale.discount + sale.tax

          // Update the sale
          sale.updatedAt = new Date().toISOString()
        }
      }
    },
    fetchReturnsSuccess: (state, action: PayloadAction<ReturnItem[]>) => {
      state.returns = action.payload
    },
    // Customer credit management
    fetchCustomersSuccess: (state, action: PayloadAction<Customer[]>) => {
      state.customers = action.payload
    },
    addCustomerPayment: (state, action: PayloadAction<{ customerId: string; amount: number; saleId?: string }>) => {
      const customer = state.customers.find((c) => c.id === action.payload.customerId)
      if (customer) {
        // Update customer total credit
        customer.totalCredit = Math.max(0, customer.totalCredit - action.payload.amount)

        // If saleId is provided, update that specific transaction
        if (action.payload.saleId) {
          const transaction = customer.transactions.find((t) => t.saleId === action.payload.saleId)
          if (transaction) {
            transaction.paid += action.payload.amount
            transaction.remaining = Math.max(0, transaction.remaining - action.payload.amount)
          }
        }

        // Add a new transaction record for this payment
        customer.transactions.push({
          saleId: action.payload.saleId || "payment-" + Date.now(),
          date: new Date().toISOString(),
          amount: action.payload.amount,
          paid: action.payload.amount,
          remaining: 0,
        })
      }
    },
    updateCustomerInfo: (
      state,
      action: PayloadAction<{ id: string; name?: string; phone?: string; address?: string }>,
    ) => {
      const customer = state.customers.find((c) => c.id === action.payload.id)
      if (customer) {
        if (action.payload.name) customer.name = action.payload.name
        if (action.payload.phone) customer.phone = action.payload.phone
        if (action.payload.address) customer.address = action.payload.address
      }
    },
  },
})

export const {
  fetchSalesStart,
  fetchSalesSuccess,
  fetchSalesFailure,
  addItemToSale,
  removeItemFromSale,
  updateItemQuantity,
  clearSale,
  completeSale,
  addReturn,
  fetchReturnsSuccess,
  fetchCustomersSuccess,
  addCustomerPayment,
  updateCustomerInfo,
} = salesSlice.actions

export default salesSlice.reducer
