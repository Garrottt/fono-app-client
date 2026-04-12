import axios from "axios"
import type { Session, CreateSessionInput } from "../types/session.types"
import { API_URL, getAuthHeaders } from "./api"

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
  const dateWithTime = data.date + "T12:00:00"
  const response = await axios.post(`${API_URL}/patients/${patientId}/sessions`,
    { ...data, date: dateWithTime },
    { headers: getAuthHeaders() }
  )
  return response.data.session
}

export const updateSessionService = async (
  patientId: string,
  id: string,
  data: Partial<CreateSessionInput>
): Promise<Session> => {
  const response = await axios.put(
    `${API_URL}/patients/${patientId}/sessions/${id}`,
    data,
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
