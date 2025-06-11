"use client"

import { useCallback, useState, useEffect } from "react"
import { getCookie, extractUserFromToken, isTokenExpired } from "@/lib/utils/jwt-utils"

interface User {
  id: string
  name: string
  email: string
  role: string
  exp?: number
  iat?: number
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  // Function to check and load user from token
  const loadUserFromToken = useCallback(() => {
    const token = getCookie("token")

    if (!token) {
      setUser(null)
      setIsAuthenticated(false)
      return null
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      setUser(null)
      setIsAuthenticated(false)
      // Clear expired token
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      return null
    }

    // Extract user data from token
    const userData = extractUserFromToken(token)

    if (userData) {
      setUser(userData)
      setIsAuthenticated(true)
      return userData
    } else {
      setUser(null)
      setIsAuthenticated(false)
      return null
    }
  }, [])

  // Check if user is authenticated on mount and set up token checking
  useEffect(() => {
    setIsInitializing(true)
    loadUserFromToken()
    setIsInitializing(false)

    // Set up interval to check token expiration every minute
    const interval = setInterval(() => {
      const token = getCookie("token")
      if (token && isTokenExpired(token)) {
        setUser(null)
        setIsAuthenticated(false)
        // Clear expired token
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [loadUserFromToken])

  const loginUser = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("http://localhost:8083/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Important for cookies
          body: JSON.stringify({
            email,
            password,
          }),
        })

        if (response.ok) {
          // After successful login, the cookie should be set
          // Wait a bit for cookie to be set, then load user data
          setTimeout(() => {
            const userData = loadUserFromToken()
            if (userData) {
              setIsLoading(false)
            } else {
              setError("Failed to load user data from token")
              setIsLoading(false)
            }
          }, 100)

          return true
        } else {
          const errorText = await response.text()
          setError(errorText || "Login failed")
          setIsLoading(false)
          return false
        }
      } catch (error) {
        console.error("Login error:", error)
        setError("Network error. Please check if the server is running.")
        setIsLoading(false)
        return false
      }
    },
    [loadUserFromToken],
  )

  const logoutUser = useCallback(async () => {
    try {
      // Call logout API to clear server-side session/cookie
      await fetch("http://localhost:8083/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Clear local state
      setUser(null)
      setIsAuthenticated(false)

      // Clear cookie manually as backup
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    }
  }, [])

  // Function to get current user (useful for refreshing user data)
  const getCurrentUser = useCallback(() => {
    return loadUserFromToken()
  }, [loadUserFromToken])

  return {
    user,
    isAuthenticated,
    login: loginUser,
    logout: logoutUser,
    isLoading,
    error,
    isInitializing,
    getCurrentUser,
  }
}
