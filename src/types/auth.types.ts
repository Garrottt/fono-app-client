export interface User {
  id: string
  name: string
  email: string
  role: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}