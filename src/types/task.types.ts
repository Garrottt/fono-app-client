export interface Task {
  id: string
  patientId: string
  title: string
  description?: string
  assignedAt: string
  seen: boolean
}

export interface CreateTaskInput {
  title: string
  description?: string
}