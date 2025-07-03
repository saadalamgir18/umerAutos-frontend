"use client"

import type React from "react"
import { createContext, useContext, useCallback, useState, useEffect, useRef } from "react"

interface User {
  id?: string
  name?: string
  username: string
  email?: string
  role: string[]
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  isLoading: boolean
  error: string | null
  isInitializing: boolean
  getCurrentUser: () => Promise<User | null>
  hasRole: (roleName: string) => boolean
  isAdmin: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const isCheckingAuth = useRef(false)
  const hasInitialized = useRef(false)

  // Function to get cookie value
  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null
    return null
  }

  // Function to fetch current user from Spring Boot backend
  const fetchCurrentUser = useCallback(async (): Promise<User | null> => {
    if (isCheckingAuth.current) {
      return null
    }

    isCheckingAuth.current = true

    try {
      const response = await fetch("http://localhost:8083/api/auth/me", {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        // If 401 or 403, user is not authenticated
        if (response.status === 401 || response.status === 403) {
          setUser(null)
          setIsAuthenticated(false)
          return null
        }
        throw new Error(`Failed to fetch user: ${response.status}`)
      }

      const userData = await response.json()

      const user: User = {
        username: userData.username.split("@")[0],
        email: userData.username,
        role: userData.role || [],
      }

      setUser(user)
      setIsAuthenticated(true)
      return user
    } catch (err) {
      console.error("❌ Error fetching current user:", err)
      setUser(null)
      setIsAuthenticated(false)
      return null
    } finally {
      isCheckingAuth.current = false
    }
  }, [])

  // Initialize authentication state - ONLY RUN ONCE
  useEffect(() => {
    if (hasInitialized.current) {
      return
    }

    const initializeAuth = async () => {
      hasInitialized.current = true

      const token = getCookie("token")

      if (token) {
        // Token exists, verify with Spring Boot backend
        const userData = await fetchCurrentUser()
      } else {
        // No token, user is not authenticated
        setUser(null)
        setIsAuthenticated(false)
      }

      setIsInitializing(false)
    }

    initializeAuth()
  }, [fetchCurrentUser])

  const loginUser = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("http://localhost:8083/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email,
            password,
          }),
        })

        if (response.ok) {
          // After successful login, fetch user data from backend
          const userData = await fetchCurrentUser()
          if (userData) {
            return true
          } else {
            setError("Failed to load user data")
            return false
          }
        } else {
          const errorText = await response.text()
          setError(errorText || "Login failed")
          return false
        }
      } catch (error) {
        setError("Network error. Please check if the server is running.")
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [fetchCurrentUser],
  )

  const logoutUser = useCallback(async () => {
    try {

      // Clear local state first
      setUser(null)
      setIsAuthenticated(false)

      // Call Spring Boot logout API to clear server-side session/cookie
      await fetch("http://localhost:8083/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })

      // Clear cookie manually as backup
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

    } catch (error) {
      console.error("❌ Logout error:", error)
      // Still clear local state even if API call fails
      setUser(null)
      setIsAuthenticated(false)
    }
  }, [])

  // Function to get current user (useful for refreshing user data)
  const getCurrentUser = useCallback(() => {
    return fetchCurrentUser()
  }, [fetchCurrentUser])

  // Helper function to check if user has a specific role
  const hasRole = useCallback(
    (roleName: string) => {
      if (!user || !user.role) return false
      return user.role.includes(`ROLE_${roleName.toUpperCase()}`)
    },
    [user],
  )

  // Check if user is admin
  const isAdmin = useCallback(() => {
    return hasRole("ADMIN")
  }, [hasRole])

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login: loginUser,
    logout: logoutUser,
    isLoading,
    error,
    isInitializing,
    getCurrentUser,
    hasRole,
    isAdmin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
