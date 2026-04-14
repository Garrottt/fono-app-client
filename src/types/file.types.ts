export interface FileRecord {
  id: string
  patientId: string
  filename: string
  url: string
  filetype: string
  uploadedAt: string
  taskId?: string
  sessionTaskId?: string
}
