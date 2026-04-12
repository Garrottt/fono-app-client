export interface Appointment {
  id: string
  patientId: string
  professionalId: string
  datetime: string
  status: string
  notes?: string
  reminderSent: boolean
  reminderScheduledAt?: string
  patient?: {
    id: string
    name: string
    email?: string
  }
}

export interface CreateAppointmentInput {
  patientId: string
  datetime: string
  notes?: string
  reminderScheduledAt?: string
}

export interface UpdateAppointmentInput {
  datetime?: string
  notes?: string
  status?: string
  reminderScheduledAt?: string
}