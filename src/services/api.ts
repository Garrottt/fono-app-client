const DEFAULT_API_URL = "http://localhost:3000/api/v1"

export const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, "")

export const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`
})
