"use client"

import { useCallback, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { loginSuccess, logout } from "@/lib/redux/slices/authSlice"
import type { RootState } from "@/lib/redux/store"

export function useAuth() {
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loginUser = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true)
      setError(null)

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (email === "admin@example.com" && password === "password") {
        dispatch(
          loginSuccess({
            id: "1",
            name: "Admin User",
            email,
            role: "admin",
          }),
        )
        setIsLoading(false)
        return true
      } else if (email === "staff@example.com" && password === "password") {
        dispatch(
          loginSuccess({
            id: "2",
            name: "Staff User",
            email,
            role: "staff",
          }),
        )
        setIsLoading(false)
        return true
      } else {
        setError("Invalid email or password")
        setIsLoading(false)
        return false
      }
    },
    [dispatch],
  )

  const logoutUser = useCallback(() => {
    dispatch(logout())
  }, [dispatch])

  return {
    user,
    isAuthenticated,
    login: loginUser,
    logout: logoutUser,
    isLoading,
    error,
  }
}
