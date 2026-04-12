export interface AppointmentReminder {
  id: string
  scheduledAt: string
  sentAt?: string | null
}

export interface Appointment {
  id: string
  patientId: string
  professionalId: string
  datetime: string
  status: string
  notes?: string
  reminders: AppointmentReminder[]
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
  reminderScheduledAts?: string[]
}

export interface UpdateAppointmentInput {
  datetime?: string
  notes?: string
  status?: string
  reminderScheduledAts?: string[]
}
