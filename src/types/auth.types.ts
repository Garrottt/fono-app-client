export type UserRole = "PROFESSIONAL" | "PATIENT"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface LoginInput {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface ValidatePasswordSetupResponse {
  valid: boolean
  user: {
    id: string
    email: string
    name: string
  }
}

export interface CompletePasswordSetupInput {
  token: string
  newPassword: string
}
