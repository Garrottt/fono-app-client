import axios from "axios"
import type {
  CompletePasswordSetupInput,
  LoginInput,
  AuthResponse,
  ValidatePasswordSetupResponse
} from "../types/auth.types"
import { API_URL } from "./api"

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
