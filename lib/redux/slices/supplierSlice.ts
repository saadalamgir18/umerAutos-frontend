import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"

export interface Supplier {
  id: string
  contactPerson: string
  company: string
  phoneNumber: string
  email: string
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
  },
})

export const { fetchSuppliersStart, fetchSuppliersSuccess, fetchSuppliersFailure, selectSupplier } =
  supplierSlice.actions

export default supplierSlice.reducer
