// Utility function to get cookie value by name
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null

  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(";").shift()
    return cookieValue || null
  }
  return null
}

// Utility function to parse JWT token
export function parseJWT(token: string) {
  try {
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error("Error parsing JWT:", error)
    return null
  }
}

// Utility function to check if token is expired
export function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token)
  if (!payload || !payload.exp) return true

  const currentTime = Math.floor(Date.now() / 1000)
  return payload.exp < currentTime
}

// Utility function to extract user data from token
export function extractUserFromToken(token: string) {
  const payload = parseJWT(token)
  if (!payload) return null

  // Extract role from the role array and remove "ROLE_" prefix
  const role = payload.role && payload.role.length > 0 ? payload.role[0].replace("ROLE_", "").toLowerCase() : "user"

  return {
    id: payload.sub || payload.userName,
    name: payload.userName || payload.sub,
    email: payload.sub || payload.userName,
    role: role,
    exp: payload.exp,
    iat: payload.iat,
  }
}
