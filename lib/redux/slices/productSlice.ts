import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"

export interface Product {
  id: string
  name: string
  brandName: string
  compatibleModels: string[]
  categoryName: string
  sku: string
  description: string
  quantityInStock: number
  purchasePrice: number
  sellingPrice: number
  supplierId: string
  shelfCodeName: string
  createdAt: string
  updatedAt: string
}

interface ProductState {
  products: Product[]
  filteredProducts: Product[]
  selectedProduct: Product | null
  isLoading: boolean
  error: string | null
}

const initialState: ProductState = {
  products: [],
  filteredProducts: [],
  selectedProduct: null,
  isLoading: false,
  error: null,
}

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    fetchProductsStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    fetchProductsSuccess: (state, action: PayloadAction<Product[]>) => {
      state.isLoading = false
      state.products = action.payload
      state.filteredProducts = action.payload
    },
    fetchProductsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.error = action.payload
    },
    selectProduct: (state, action: PayloadAction<string>) => {
      state.selectedProduct = state.products.find((p) => p.id === action.payload) || null
    },
    addProduct: (state, action: PayloadAction<Product>) => {
      state.products.push(action.payload)
      state.filteredProducts = [...state.products]
    },
    updateProduct: (state, action: PayloadAction<Product>) => {
      const index = state.products.findIndex((p) => p.id === action.payload.id)
      if (index !== -1) {
        state.products[index] = action.payload
        state.filteredProducts = [...state.products]
      }
    },
    deleteProductSuccess: (state, action: PayloadAction<string>) => {
      state.products = state.products.filter((p) => p.id !== action.payload)
      state.filteredProducts = [...state.products]
    },
    resetProducts: (state) => {
      state.products = []
      state.filteredProducts = []
    },
    updateStock: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const product = state.products.find((p) => p.id === action.payload.id)
      if (product) {
        product.quantityInStock += action.payload.quantity
      }
    },
  },
})

export const {
  fetchProductsStart,
  fetchProductsSuccess,
  fetchProductsFailure,
  selectProduct,
  addProduct,
  updateProduct,
  deleteProductSuccess,
  resetProducts,
  updateStock,
} = productSlice.actions

export default productSlice.reducer
