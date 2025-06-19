import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"

export interface Supplier {
  id: string
  name: string
  companyName: string
  phone: string
  email: string
  address: string
  createdAt: string
  updatedAt: string
}

interface SupplierState {
  suppliers: Supplier[]
  selectedSupplier: Supplier | null
  isLoading: boolean
  error: string | null
}

const initialState: SupplierState = {
  suppliers: [],
  selectedSupplier: null,
  isLoading: false,
  error: null,
}

const supplierSlice = createSlice({
  name: "suppliers",
  initialState,
  reducers: {
    fetchSuppliersStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    fetchSuppliersSuccess: (state, action: PayloadAction<Supplier[]>) => {
      state.isLoading = false
      state.suppliers = action.payload
    },
    fetchSuppliersFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.error = action.payload
    },
    selectSupplier: (state, action: PayloadAction<string>) => {
      state.selectedSupplier = state.suppliers.find((s) => s.id === action.payload) || null
    },
    addSupplier: (state, action: PayloadAction<Supplier>) => {
      state.suppliers.push(action.payload)
    },
    updateSupplier: (state, action: PayloadAction<Supplier>) => {
      const index = state.suppliers.findIndex((s) => s.id === action.payload.id)
      if (index !== -1) {
        state.suppliers[index] = action.payload
      }
    },
  },
})

export const { fetchSuppliersStart, fetchSuppliersSuccess, fetchSuppliersFailure, selectSupplier, addSupplier, updateSupplier } =
  supplierSlice.actions

export default supplierSlice.reducer
