import axios from "axios"
import type { LoginInput, AuthResponse } from "../types/auth.types"

const API_URL = "http://localhost:3000/api/v1"

export const loginService = async (data: LoginInput): Promise<AuthResponse> => {
  const response = await axios.post(`${API_URL}/auth/login`, data)
  return response.data
}