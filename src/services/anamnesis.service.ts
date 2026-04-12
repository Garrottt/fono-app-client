import axios from "axios"
import type { Anamnesis, UpdateAnamnesisInput } from "../types/anamnesis.types"
import { API_URL, getAuthHeaders } from "./api"

export const getAnamnesisService = async (patientId: string): Promise<Anamnesis | null> => {
  const response = await axios.get(`${API_URL}/patients/${patientId}/anamnesis`, {
    headers: getAuthHeaders()
  })

  return response.data.anamnesis
}

export const saveAnamnesisService = async (
  patientId: string,
  data: UpdateAnamnesisInput
): Promise<{ anamnesis: Anamnesis; message: string }> => {
  const response = await axios.put(`${API_URL}/patients/${patientId}/anamnesis`, data, {
    headers: getAuthHeaders()
  })

  return response.data
}
