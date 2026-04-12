import axios from "axios"
import type { Patient, CreatePatientInput, UpdatePatientInput, ConfigurePortalAccessInput } from "../types/patient.types"
import { API_URL, getAuthHeaders } from "./api"

export const getPatientsService = async (): Promise<Patient[]> => {
  const response = await axios.get(`${API_URL}/patients`, {
    headers: getAuthHeaders()
  })
  return response.data.patients
}

export const createPatientService = async (data: CreatePatientInput): Promise<Patient> => {
  const response = await axios.post(`${API_URL}/patients`, data, {
    headers: getAuthHeaders()
  })
  return response.data.patient
}

export const updatePatientService = async (id: string, data: UpdatePatientInput): Promise<Patient> => {
  const response = await axios.put(`${API_URL}/patients/${id}`, data, {
    headers: getAuthHeaders()
  })
  return response.data.patient
}

export const configurePortalAccessService = async (
  id: string,
  data: ConfigurePortalAccessInput
): Promise<{ user: { id: string; email: string; patientId: string }; message: string }> => {
  const response = await axios.put(`${API_URL}/patients/${id}/portal-access`, data, {
    headers: getAuthHeaders()
  })
  return response.data
}

export const deactivatePatientService = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/patients/${id}`, {
    headers: getAuthHeaders()
  })
}

export const updatePatientDiagnosisService = async (
  id: string,
  diagnosis: string
): Promise<Patient> => {
  const response = await axios.put(`${API_URL}/patients/${id}`,
    { diagnosis },
    { headers: getAuthHeaders() }
  )
  return response.data.patient
}
