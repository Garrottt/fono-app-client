import axios from "axios"
import type { Anamnesis, UpdateAnamnesisInput } from "../types/anamnesis.types"

const API_URL = "http://localhost:3000/api/v1"

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`
})

export const getAnamnesisService = async (patientId: string): Promise<Anamnesis | null> => {
  const response = await axios.get(`${API_URL}/patients/${patientId}/anamnesis`, {
    headers: getHeaders()
  })

  return response.data.anamnesis
}

export const saveAnamnesisService = async (
  patientId: string,
  data: UpdateAnamnesisInput
): Promise<{ anamnesis: Anamnesis; message: string }> => {
  const response = await axios.put(`${API_URL}/patients/${patientId}/anamnesis`, data, {
    headers: getHeaders()
  })

  return response.data
}
