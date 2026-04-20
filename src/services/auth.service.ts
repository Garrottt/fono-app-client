import axios from "axios"
import type {
  CompletePasswordSetupInput,
  LoginInput,
  AuthResponse,
  User,
  ValidatePasswordSetupResponse
} from "../types/auth.types"
import { API_URL, getAuthHeaders } from "./api"

export const loginService = async (data: LoginInput): Promise<AuthResponse> => {
  const response = await axios.post(`${API_URL}/auth/login`, data)
  return response.data
}

export const validatePasswordSetupTokenService = async (token: string): Promise<ValidatePasswordSetupResponse> => {
  const response = await axios.post(`${API_URL}/auth/password-setup/validate`, { token })
  return response.data
}

export const completePasswordSetupService = async (data: CompletePasswordSetupInput): Promise<{ message: string }> => {
  const response = await axios.post(`${API_URL}/auth/password-setup/complete`, data)
  return response.data
}

export const getMeService = async (): Promise<User> => {
  const response = await axios.get(`${API_URL}/auth/me`, {
    headers: getAuthHeaders()
  })
  return response.data.user
}
