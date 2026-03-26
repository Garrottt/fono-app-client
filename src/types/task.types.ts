import type { FileRecord } from "./file.types"

export interface Task {
  id: string
  patientId: string
  title: string
  description?: string
  assignedAt: string
  seen: boolean
  files: FileRecord[]
}

export interface CreateTaskInput {
  title: string
  description?: string
}