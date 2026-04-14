import axios from "axios"
import type { Session, CreateSessionInput, UpdateSessionInput } from "../types/session.types"
import type { FileRecord } from "../types/file.types"
import { API_URL, getAuthHeaders } from "./api"

const normalizeSessionDate = (date: string) => (
  date.includes("T") ? date : `${date}T12:00:00`
)

const normalizeSessionPayload = <T extends { date?: string }>(data: T): T => ({
  ...data,
  ...(data.date ? { date: normalizeSessionDate(data.date) } : {})
})

export const getSessionsService = async (patientId: string): Promise<Session[]> => {
  const response = await axios.get(`${API_URL}/patients/${patientId}/sessions`, {
    headers: getAuthHeaders()
  })
  return response.data.sessions
}

export const createSessionService = async (
  patientId: string,
  data: CreateSessionInput
): Promise<Session> => {
  const response = await axios.post(`${API_URL}/patients/${patientId}/sessions`,
    normalizeSessionPayload(data),
    { headers: getAuthHeaders() }
  )
  return response.data.session
}

export const updateSessionService = async (
  patientId: string,
  id: string,
  data: UpdateSessionInput
): Promise<Session> => {
  const response = await axios.put(
    `${API_URL}/patients/${patientId}/sessions/${id}`,
    normalizeSessionPayload(data),
    { headers: getAuthHeaders() }
  )
  return response.data.session
}

export const deleteSessionService = async (
  patientId: string,
  id: string
): Promise<void> => {
  await axios.delete(
    `${API_URL}/patients/${patientId}/sessions/${id}`,
    { headers: getAuthHeaders() }
  )
}

export const uploadSessionTaskFileService = async (
  patientId: string,
  sessionId: string,
  taskId: string,
  file: File
): Promise<FileRecord> => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await axios.post(
    `${API_URL}/patients/${patientId}/sessions/${sessionId}/tasks/${taskId}/files`,
    formData,
    {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data"
      }
    }
  )

  return response.data.file
}

export const deleteSessionTaskFileService = async (
  patientId: string,
  sessionId: string,
  taskId: string,
  fileId: string
): Promise<void> => {
  await axios.delete(
    `${API_URL}/patients/${patientId}/sessions/${sessionId}/tasks/${taskId}/files/${fileId}`,
    { headers: getAuthHeaders() }
  )
}
