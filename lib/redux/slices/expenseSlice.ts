import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"

export interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  createdAt: string
}

interface ExpenseState {
  expenses: Expense[]
  isLoading: boolean
  error: string | null
}

const initialState: ExpenseState = {
  expenses: [],
  isLoading: false,
  error: null,
}

const expenseSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    fetchExpensesStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    fetchExpensesSuccess: (state, action: PayloadAction<Expense[]>) => {
      state.isLoading = false
      state.expenses = action.payload
    },
    fetchExpensesFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.error = action.payload
    },
    addExpense: (state, action: PayloadAction<Expense>) => {
      state.expenses.push(action.payload)
    },
    updateExpense: (state, action: PayloadAction<Expense>) => {
      const index = state.expenses.findIndex((e) => e.id === action.payload.id)
      if (index !== -1) {
        state.expenses[index] = action.payload
      }
    },
    deleteExpense: (state, action: PayloadAction<string>) => {
      state.expenses = state.expenses.filter((e) => e.id !== action.payload)
    },
  },
})

export const {
  fetchExpensesStart,
  fetchExpensesSuccess,
  fetchExpensesFailure,
  addExpense,
  updateExpense,
  deleteExpense,
} = expenseSlice.actions

export default expenseSlice.reducer
