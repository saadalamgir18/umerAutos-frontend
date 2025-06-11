// Utility functions for JWT handling
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null

  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null
  }
  return null
}

export function parseJWT(token: string) {
  try {
    // JWT has 3 parts separated by dots: header.payload.signature
    const parts = token.split(".")
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format")
    }

    // Decode the payload (second part)
    const payload = parts[1]

    // Add padding if needed for base64 decoding
    const paddedPayload = payload + "=".repeat((4 - (payload.length % 4)) % 4)

    // Decode base64
    const decodedPayload = atob(paddedPayload)

    // Parse JSON
    return JSON.parse(decodedPayload)
  } catch (error) {
    console.error("Error parsing JWT:", error)
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token)
  if (!payload || !payload.exp) return true

  // exp is in seconds, Date.now() is in milliseconds
  return payload.exp * 1000 < Date.now()
}

export function extractUserFromToken(token: string) {
  const payload = parseJWT(token)
  if (!payload) return null

  // Extract role from the array and remove ROLE_ prefix
  const role = payload.role && payload.role.length > 0 ? payload.role[0].replace("ROLE_", "").toLowerCase() : "user"

  return {
    id: payload.sub || payload.userName,
    name: payload.userName.split("@")[0] || payload.sub,
    email: payload.sub || payload.userName,
    role: role,
    exp: payload.exp,
    iat: payload.iat,
  }
}
