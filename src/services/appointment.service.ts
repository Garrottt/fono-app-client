import axios from "axios"
import type { Appointment, CreateAppointmentInput, UpdateAppointmentInput } from "../types/appointment.types"

const API_URL = "http://localhost:3000/api/v1"

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`
})

export const getAppointmentsService = async (): Promise<Appointment[]> => {
  const response = await axios.get(`${API_URL}/appointments`, {
    headers: getHeaders()
  })
  return response.data.appointments
}

export const getAppointmentsByPatientService = async (patientId: string): Promise<Appointment[]> => {
  const response = await axios.get(`${API_URL}/appointments/patient/${patientId}`, {
    headers: getHeaders()
  })
  return response.data.appointments
}

export const createAppointmentService = async (
  data: CreateAppointmentInput
): Promise<Appointment> => {
  const response = await axios.post(`${API_URL}/appointments`, data, {
    headers: getHeaders()
  })
  return response.data.appointment
}

export const updateAppointmentService = async (
  id: string,
  data: UpdateAppointmentInput
): Promise<Appointment> => {
  const response = await axios.put(`${API_URL}/appointments/${id}`, data, {
    headers: getHeaders()
  })
  return response.data.appointment
}

export const deleteAppointmentService = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/appointments/${id}`, {
    headers: getHeaders()
  })
}