import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./slices/authSlice"
import productReducer from "./slices/productSlice"
import salesReducer from "./slices/salesSlice"
import supplierReducer from "./slices/supplierSlice"
import expenseReducer from "./slices/expenseSlice"
import brandReducer from "./slices/brandSlice"
import shelfCodeReducer from "./slices/shelfCodeSlice"
import compatibleModelReducer from "./slices/compatibleModelSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    sales: salesReducer,
    suppliers: supplierReducer,
    expenses: expenseReducer,
    brands: brandReducer,
    shelfCode: shelfCodeReducer,
    compatibleModel: compatibleModelReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: process.env.NODE_ENV !== "production",
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
