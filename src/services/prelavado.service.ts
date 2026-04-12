import axios from "axios"
import type { PreLavadoEvaluation, UpdatePreLavadoInput } from "../types/prelavado.types"
import { API_URL, getAuthHeaders } from "./api"

export const getPreLavadoService = async (patientId: string): Promise<PreLavadoEvaluation | null> => {
  const response = await axios.get(`${API_URL}/patients/${patientId}/pre-lavado`, {
    headers: getAuthHeaders()
  })

  return response.data.evaluation
}

export const savePreLavadoService = async (
  patientId: string,
  data: UpdatePreLavadoInput
): Promise<{ evaluation: PreLavadoEvaluation; message: string }> => {
  const response = await axios.put(`${API_URL}/patients/${patientId}/pre-lavado`, data, {
    headers: getAuthHeaders()
  })

  return response.data
}

export const downloadPreLavadoPdfService = async (patientId: string): Promise<Blob> => {
  const response = await axios.get(`${API_URL}/patients/${patientId}/pre-lavado/pdf`, {
    headers: getAuthHeaders(),
    responseType: "blob"
  })

  return response.data
}
