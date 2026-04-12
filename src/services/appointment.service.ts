import axios from "axios"
import type { Appointment, CreateAppointmentInput, UpdateAppointmentInput } from "../types/appointment.types"
import { API_URL, getAuthHeaders } from "./api"

export const getAppointmentsService = async (): Promise<Appointment[]> => {
  const response = await axios.get(`${API_URL}/appointments`, {
    headers: getAuthHeaders()
  })
  return response.data.appointments
}

export const getAppointmentsByPatientService = async (patientId: string): Promise<Appointment[]> => {
  const response = await axios.get(`${API_URL}/appointments/patient/${patientId}`, {
    headers: getAuthHeaders()
  })
  return response.data.appointments
}

export const createAppointmentService = async (
  data: CreateAppointmentInput
): Promise<Appointment> => {
  const response = await axios.post(`${API_URL}/appointments`, data, {
    headers: getAuthHeaders()
  })
  return response.data.appointment
}

export const updateAppointmentService = async (
  id: string,
  data: UpdateAppointmentInput
): Promise<Appointment> => {
  const response = await axios.put(`${API_URL}/appointments/${id}`, data, {
    headers: getAuthHeaders()
  })
  return response.data.appointment
}

export const deleteAppointmentService = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/appointments/${id}`, {
    headers: getAuthHeaders()
  })
}
