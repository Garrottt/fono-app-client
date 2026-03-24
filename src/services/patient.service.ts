import axios from "axios"
import type { Patient, CreatePatientInput, UpdatePatientInput } from "../types/patient.types"

const API_URL = "http://localhost:3000/api/v1"

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`
})

export const getPatientsService = async (): Promise<Patient[]> => {
  const response = await axios.get(`${API_URL}/patients`, {
    headers: getHeaders()
  })
  return response.data.patients
}

export const createPatientService = async (data: CreatePatientInput): Promise<Patient> => {
  const response = await axios.post(`${API_URL}/patients`, data, {
    headers: getHeaders()
  })
  return response.data.patient
}

export const updatePatientService = async (id: string, data: UpdatePatientInput): Promise<Patient> => {
  const response = await axios.put(`${API_URL}/patients/${id}`, data, {
    headers: getHeaders()
  })
  return response.data.patient
}

export const deactivatePatientService = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/patients/${id}`, {
    headers: getHeaders()
  })
}