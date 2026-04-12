import axios from "axios"
import type { PreLavadoEvaluation, UpdatePreLavadoInput } from "../types/prelavado.types"

const API_URL = "http://localhost:3000/api/v1"

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`
})

export const getPreLavadoService = async (patientId: string): Promise<PreLavadoEvaluation | null> => {
  const response = await axios.get(`${API_URL}/patients/${patientId}/pre-lavado`, {
    headers: getHeaders()
  })

  return response.data.evaluation
}

export const savePreLavadoService = async (
  patientId: string,
  data: UpdatePreLavadoInput
): Promise<{ evaluation: PreLavadoEvaluation; message: string }> => {
  const response = await axios.put(`${API_URL}/patients/${patientId}/pre-lavado`, data, {
    headers: getHeaders()
  })

  return response.data
}

export const downloadPreLavadoPdfService = async (patientId: string): Promise<Blob> => {
  const response = await axios.get(`${API_URL}/patients/${patientId}/pre-lavado/pdf`, {
    headers: getHeaders(),
    responseType: "blob"
  })

  return response.data
}
