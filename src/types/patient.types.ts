export interface Patient {
  id: string
  name: string
  email?: string
  phone?: string
  active: boolean
  createdAt: string
}

export interface CreatePatientInput {
  name: string
  email?: string
  phone?: string
}

export interface UpdatePatientInput {
  name?: string
  email?: string
  phone?: string
}